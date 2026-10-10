import random
from datetime import timedelta
from django.utils import timezone
from django.db.models import Count, Q
from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import GeofenceZone, VehicleTelemetry, TelematicsAlert
from .serializers import (
    GeofenceZoneSerializer,
    VehicleTelemetrySerializer,
    TelematicsAlertSerializer,
    LiveFleetVehicleSerializer
)
from apps.fleet.models import Vehicle
from apps.dispatches.models import DispatchBooking


class GeofenceZoneViewSet(viewsets.ModelViewSet):
    queryset = GeofenceZone.objects.all().order_by('name')
    serializer_class = GeofenceZoneSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'zone_type']
    ordering_fields = ['name', 'radius_meters', 'speed_limit_kmh', 'created_at']


class TelematicsAlertViewSet(viewsets.ModelViewSet):
    queryset = TelematicsAlert.objects.all().order_by('-created_at')
    serializer_class = TelematicsAlertSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['vehicle__registration_number', 'message', 'alert_type', 'severity']
    ordering_fields = ['created_at', 'severity', 'is_resolved']

    def get_queryset(self):
        qs = super().get_queryset()
        resolved = self.request.query_params.get('resolved')
        if resolved is not None:
            qs = qs.filter(is_resolved=resolved.lower() in ['true', '1'])
        severity = self.request.query_params.get('severity')
        if severity:
            qs = qs.filter(severity=severity)
        return qs

    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        alert = self.get_object()
        alert.is_resolved = True
        alert.resolved_at = timezone.now()
        alert.save(update_fields=['is_resolved', 'resolved_at'])
        return Response({
            'message': f"Alert resolved: {alert.message}",
            'alert': TelematicsAlertSerializer(alert).data
        })


class TelematicsViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'], url_path='live-fleet')
    def live_fleet(self, request):
        """Returns all vehicles with their latest telematics coordinates."""
        vehicles = Vehicle.objects.prefetch_related('telemetry_logs', 'dispatches', 'current_driver').all()
        serializer = LiveFleetVehicleSerializer(vehicles, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """High-level KPI metrics for live control center."""
        vehicles = Vehicle.objects.all()
        total_vehicles = vehicles.count()

        recent_cutoff = timezone.now() - timedelta(hours=24)
        online_tracked = vehicles.filter(telemetry_logs__timestamp__gte=recent_cutoff).distinct().count()

        # In motion vs idle based on latest telemetry
        latest_logs = [v.telemetry_logs.first() for v in vehicles if v.telemetry_logs.exists()]
        in_motion = sum(1 for log in latest_logs if log and float(log.speed_kmh) > 5.0)
        idling = sum(1 for log in latest_logs if log and float(log.speed_kmh) <= 5.0 and log.engine_status in ['RUNNING', 'IDLE'])

        active_geofences = GeofenceZone.objects.filter(is_active=True).count()
        unresolved_alerts = TelematicsAlert.objects.filter(is_resolved=False).count()

        return Response({
            'total_vehicles': total_vehicles,
            'online_tracked': online_tracked,
            'in_motion': in_motion,
            'idling': idling,
            'active_geofences': active_geofences,
            'unresolved_alerts': unresolved_alerts
        })

    @action(detail=False, methods=['post'])
    def ping(self, request):
        """Device ingestion endpoint for GPS tracker / OBD-II dongle."""
        vehicle_id = request.data.get('vehicle_id')
        reg_number = request.data.get('registration_number')

        try:
            if vehicle_id:
                vehicle = Vehicle.objects.get(pk=vehicle_id)
            elif reg_number:
                vehicle = Vehicle.objects.get(registration_number=reg_number)
            else:
                return Response({'error': 'vehicle_id or registration_number required'}, status=status.HTTP_400_BAD_REQUEST)
        except Vehicle.DoesNotExist:
            return Response({'error': 'Vehicle not found'}, status=status.HTTP_404_NOT_FOUND)

        lat = float(request.data.get('latitude', 15.4989))
        lng = float(request.data.get('longitude', 73.8278))
        speed = float(request.data.get('speed_kmh', 0.0))
        heading = int(request.data.get('heading', 0)) % 360
        engine_status = request.data.get('engine_status', 'RUNNING' if speed > 0 else 'IDLE')
        odometer = float(request.data.get('odometer_km', vehicle.current_odometer))

        # Check geofences
        current_zone = None
        for zone in GeofenceZone.objects.filter(is_active=True):
            if zone.contains_point(lat, lng):
                current_zone = zone
                break

        telemetry = VehicleTelemetry.objects.create(
            vehicle=vehicle,
            latitude=lat,
            longitude=lng,
            speed_kmh=speed,
            heading=heading,
            engine_status=engine_status,
            odometer_km=odometer,
            current_zone=current_zone,
            battery_pct=float(request.data.get('battery_pct', 95.0)),
            fuel_pct=float(request.data.get('fuel_pct', 80.0))
        )

        # Update vehicle current odometer
        if odometer > float(vehicle.current_odometer):
            vehicle.current_odometer = odometer
            vehicle.save(update_fields=['current_odometer'])

        # Overspeeding Detection (Vehicle speed governor max 80 km/h or zone limit)
        max_permitted = current_zone.speed_limit_kmh if current_zone else 80.0
        if speed > max_permitted:
            TelematicsAlert.objects.create(
                vehicle=vehicle,
                alert_type=TelematicsAlert.AlertType.OVERSPEEDING,
                severity=TelematicsAlert.Severity.CRITICAL if speed > 90 else TelematicsAlert.Severity.WARNING,
                speed_kmh=speed,
                latitude=lat,
                longitude=lng,
                message=f"Speeding detected: {speed:.1f} km/h (Limit: {max_permitted} km/h)"
            )

        return Response(VehicleTelemetrySerializer(telemetry).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def history(self, request):
        """Returns recent route breadcrumbs for a given vehicle."""
        vehicle_id = request.query_params.get('vehicle_id')
        if not vehicle_id:
            return Response({'error': 'vehicle_id query param is required'}, status=status.HTTP_400_BAD_REQUEST)

        logs = VehicleTelemetry.objects.filter(vehicle_id=vehicle_id).order_by('-timestamp')[:60]
        return Response(VehicleTelemetrySerializer(logs, many=True).data)

    @action(detail=False, methods=['post'])
    def simulate(self, request):
        """
        Real-Time Route Movement Simulator:
        Steps forward GPS positions along realistic corridors in Goa:
        - Route A: Mopa Airport (15.7600, 73.8650) to Panaji (15.4989, 73.8278)
        - Route B: Dabolim Airport (15.3800, 73.8310) to Benaulim / Taj Exotica (15.2500, 73.9250)
        - Route C: Panaji Patto to Verna Infosys DC (15.3620, 73.9350)
        - Route D: Candolim Coastal Strip (15.5170, 73.7650)
        """
        vehicles = list(Vehicle.objects.all())
        updated_count = 0

        # Corridor waypoints
        corridors = [
            # Mopa Corridor (North)
            [(15.7600, 73.8650), (15.7100, 73.8500), (15.6500, 73.8400), (15.5800, 73.8300), (15.4989, 73.8278)],
            # Dabolim to South Luxury Corridor
            [(15.3800, 73.8310), (15.3500, 73.8600), (15.3100, 73.8900), (15.2800, 73.9100), (15.2500, 73.9250)],
            # Tech Park Expressway (Panaji to Verna)
            [(15.4989, 73.8278), (15.4600, 73.8500), (15.4100, 73.8900), (15.3800, 73.9100), (15.3620, 73.9350)],
            # Coastal Tourism Strip (Calangute / Candolim)
            [(15.5450, 73.7550), (15.5300, 73.7600), (15.5170, 73.7650), (15.5000, 73.7750), (15.4989, 73.8278)],
        ]

        active_geofences = list(GeofenceZone.objects.filter(is_active=True))

        for idx, vehicle in enumerate(vehicles):
            last_log = vehicle.telemetry_logs.first()
            corridor = corridors[idx % len(corridors)]

            if last_log:
                curr_lat = float(last_log.latitude)
                curr_lng = float(last_log.longitude)
                curr_odo = float(last_log.odometer_km)

                # Nudge position slightly towards next corridor waypoint with realistic jitter
                step_lat = (random.random() - 0.48) * 0.003
                step_lng = (random.random() - 0.48) * 0.003
                new_lat = round(curr_lat + step_lat, 6)
                new_lng = round(curr_lng + step_lng, 6)

                # Speeds: ON_DUTY cars drive 45-78 km/h, available cars idle or park
                if vehicle.status == Vehicle.VehicleStatus.ON_DUTY:
                    new_speed = round(random.uniform(42.0, 76.0), 1)
                    engine = VehicleTelemetry.EngineStatus.RUNNING
                elif vehicle.status == Vehicle.VehicleStatus.AVAILABLE:
                    new_speed = round(random.uniform(0.0, 25.0), 1) if random.random() > 0.6 else 0.0
                    engine = VehicleTelemetry.EngineStatus.RUNNING if new_speed > 0 else VehicleTelemetry.EngineStatus.IDLE
                else:
                    new_speed = 0.0
                    engine = VehicleTelemetry.EngineStatus.OFF

                heading = (last_log.heading + random.randint(-15, 15)) % 360
                new_odo = round(curr_odo + (new_speed * (5.0 / 3600.0)), 2)
            else:
                # Default start at corridor origin
                start_pt = corridor[0]
                new_lat = start_pt[0]
                new_lng = start_pt[1]
                new_speed = round(random.uniform(30.0, 65.0), 1)
                heading = random.randint(0, 360)
                engine = VehicleTelemetry.EngineStatus.RUNNING
                new_odo = float(vehicle.current_odometer)

            # Check geofence
            zone_matched = next((z for z in active_geofences if z.contains_point(new_lat, new_lng)), None)

            VehicleTelemetry.objects.create(
                vehicle=vehicle,
                latitude=new_lat,
                longitude=new_lng,
                speed_kmh=new_speed,
                heading=heading,
                engine_status=engine,
                odometer_km=new_odo,
                current_zone=zone_matched,
                battery_pct=round(random.uniform(85.0, 99.0), 1),
                fuel_pct=round(random.uniform(65.0, 95.0), 1)
            )

            # Random occasional test alert (1 in 10 chance on in-motion car)
            if new_speed > 75 and random.random() < 0.15:
                TelematicsAlert.objects.create(
                    vehicle=vehicle,
                    alert_type=TelematicsAlert.AlertType.OVERSPEEDING,
                    severity=TelematicsAlert.Severity.WARNING,
                    speed_kmh=new_speed,
                    latitude=new_lat,
                    longitude=new_lng,
                    message=f"Vehicle {vehicle.registration_number} logged {new_speed} km/h approaching speed threshold"
                )

            updated_count += 1

        return Response({
            'message': f"Simulated real-time movement update for {updated_count} fleet vehicles",
            'updated_count': updated_count
        })
