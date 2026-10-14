from django.utils import timezone
from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import DriverProfile, ShiftLog
from .serializers import DriverProfileSerializer, ShiftLogSerializer
from apps.dispatches.models import DispatchBooking
from apps.dispatches.serializers import DispatchBookingSerializer
from apps.fleet.models import Vehicle
from apps.telematics.models import TelematicsAlert

class DriverViewSet(viewsets.ModelViewSet):
    queryset = DriverProfile.objects.all().order_by('-created_at')
    serializer_class = DriverProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['license_number', 'user__first_name', 'user__last_name', 'user__username', 'badge_number']
    ordering_fields = ['rating', 'safety_score', 'created_at']

    @action(detail=False, methods=['get'])
    def summary(self, request):
        total = self.get_queryset().count()
        on_duty = self.get_queryset().filter(duty_status=DriverProfile.DutyStatus.ON_DUTY_AVAILABLE).count()
        on_trip = self.get_queryset().filter(duty_status=DriverProfile.DutyStatus.ON_TRIP).count()
        off_duty = self.get_queryset().filter(duty_status=DriverProfile.DutyStatus.OFF_DUTY).count()

        return Response({
            'total_drivers': total,
            'on_duty': on_duty,
            'on_trip': on_trip,
            'off_duty': off_duty
        })

    @action(detail=True, methods=['post'])
    def assign_vehicle(self, request, pk=None):
        driver = self.get_object()
        vehicle_id = request.data.get('vehicle_id')
        if not vehicle_id:
            return Response({'error': 'vehicle_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            vehicle = Vehicle.objects.get(pk=vehicle_id)
        except Vehicle.DoesNotExist:
            return Response({'error': 'Vehicle not found'}, status=status.HTTP_404_NOT_FOUND)

        DriverProfile.objects.filter(assigned_vehicle=vehicle).exclude(pk=driver.pk).update(assigned_vehicle=None)

        driver.assigned_vehicle = vehicle
        driver.save(update_fields=['assigned_vehicle'])

        return Response({
            'message': f"Vehicle {vehicle.registration_number} assigned to driver {driver.user.get_full_name() or driver.user.username}",
            'driver': DriverProfileSerializer(driver).data
        })

    @action(detail=True, methods=['post'])
    def unassign_vehicle(self, request, pk=None):
        driver = self.get_object()
        driver.assigned_vehicle = None
        driver.save(update_fields=['assigned_vehicle'])

        return Response({
            'message': f"Vehicle unassigned from driver {driver.user.get_full_name() or driver.user.username}",
            'driver': DriverProfileSerializer(driver).data
        })

    @action(detail=True, methods=['get'])
    def chauffeur_portal(self, request, pk=None):
        """Returns unified dashboard data for chauffeur mobile view."""
        driver = self.get_object()
        
        active_booking = DispatchBooking.objects.filter(
            assigned_driver=driver,
            status__in=[DispatchBooking.DispatchStatus.DISPATCHED, DispatchBooking.DispatchStatus.ON_TRIP]
        ).first()

        active_shift = driver.shift_logs.filter(status=ShiftLog.ShiftStatus.ACTIVE).first()

        recent_trips = DispatchBooking.objects.filter(
            assigned_driver=driver,
            status=DispatchBooking.DispatchStatus.COMPLETED
        ).order_by('-updated_at')[:10]

        today = timezone.now().date()
        today_completed = DispatchBooking.objects.filter(
            assigned_driver=driver,
            status=DispatchBooking.DispatchStatus.COMPLETED,
            updated_at__date=today
        )
        today_earnings = sum(float(b.total_fare_inr) * 0.20 for b in today_completed)
        today_kms = sum(float(b.distance_km) for b in today_completed)

        return Response({
            'driver': DriverProfileSerializer(driver).data,
            'active_shift': ShiftLogSerializer(active_shift).data if active_shift else None,
            'active_booking': DispatchBookingSerializer(active_booking).data if active_booking else None,
            'recent_trips': DispatchBookingSerializer(recent_trips, many=True).data,
            'stats': {
                'today_trips_count': today_completed.count(),
                'today_kms': round(today_kms, 1),
                'today_earnings_inr': round(today_earnings, 2),
                'all_time_trips': driver.total_trips,
                'rating': float(driver.rating),
                'safety_score': float(driver.safety_score)
            }
        })

    @action(detail=True, methods=['post'])
    def start_shift(self, request, pk=None):
        """Chauffeur mobile check-in to begin shift."""
        driver = self.get_object()
        vehicle_id = request.data.get('vehicle_id')
        start_odo = request.data.get('start_odometer')
        checklist_passed = request.data.get('pre_inspection_passed', True)
        notes = request.data.get('inspection_notes', 'All pre-trip safety checks passed.')

        if not vehicle_id:
            return Response({'error': 'vehicle_id is required to begin shift'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            vehicle = Vehicle.objects.get(pk=vehicle_id)
        except Vehicle.DoesNotExist:
            return Response({'error': 'Vehicle not found'}, status=status.HTTP_404_NOT_FOUND)

        if not start_odo:
            start_odo = float(vehicle.current_odometer)
        else:
            start_odo = float(start_odo)

        driver.shift_logs.filter(status=ShiftLog.ShiftStatus.ACTIVE).update(
            status=ShiftLog.ShiftStatus.COMPLETED,
            shift_end=timezone.now(),
            end_odometer=start_odo
        )

        shift = ShiftLog.objects.create(
            driver=driver,
            vehicle=vehicle,
            start_odometer=start_odo,
            pre_inspection_passed=checklist_passed,
            inspection_notes=notes,
            status=ShiftLog.ShiftStatus.ACTIVE
        )

        driver.assigned_vehicle = vehicle
        driver.duty_status = DriverProfile.DutyStatus.ON_DUTY_AVAILABLE
        driver.save(update_fields=['assigned_vehicle', 'duty_status'])

        vehicle.status = Vehicle.VehicleStatus.ON_DUTY
        vehicle.save(update_fields=['status'])

        return Response({
            'message': f"Shift started with {vehicle.registration_number}",
            'shift': ShiftLogSerializer(shift).data,
            'driver': DriverProfileSerializer(driver).data
        })

    @action(detail=True, methods=['post'])
    def end_shift(self, request, pk=None):
        """Chauffeur mobile check-out to conclude shift."""
        driver = self.get_object()
        end_odo = request.data.get('end_odometer')

        active_shift = driver.shift_logs.filter(status=ShiftLog.ShiftStatus.ACTIVE).first()
        if not active_shift:
            return Response({'error': 'No active shift found'}, status=status.HTTP_400_BAD_REQUEST)

        if not end_odo:
            end_odo = float(active_shift.vehicle.current_odometer)
        else:
            end_odo = float(end_odo)

        active_shift.end_odometer = end_odo
        active_shift.shift_end = timezone.now()
        active_shift.status = ShiftLog.ShiftStatus.COMPLETED
        active_shift.save()

        vehicle = active_shift.vehicle
        vehicle.current_odometer = end_odo
        vehicle.status = Vehicle.VehicleStatus.AVAILABLE
        vehicle.save()

        driver.duty_status = DriverProfile.DutyStatus.OFF_DUTY
        driver.save(update_fields=['duty_status'])

        return Response({
            'message': "Shift ended successfully",
            'shift': ShiftLogSerializer(active_shift).data,
            'driver': DriverProfileSerializer(driver).data
        })

    @action(detail=True, methods=['post'])
    def trigger_sos(self, request, pk=None):
        """Emergency SOS beacon from chauffeur smartphone."""
        driver = self.get_object()
        lat = float(request.data.get('latitude', 15.4989))
        lng = float(request.data.get('longitude', 73.8278))
        message = request.data.get('message', f"EMERGENCY SOS: Chauffeur {driver.user.get_full_name() or driver.user.username} triggered distress button")

        alert = TelematicsAlert.objects.create(
            vehicle=driver.assigned_vehicle,
            alert_type=TelematicsAlert.AlertType.SOS_EMERGENCY,
            severity=TelematicsAlert.Severity.CRITICAL,
            latitude=lat,
            longitude=lng,
            message=message
        )

        return Response({
            'message': 'DISTRESS ALERT BROADCASTED TO FLEET CONTROL DESK',
            'alert_id': alert.id
        })

class ShiftLogViewSet(viewsets.ModelViewSet):
    queryset = ShiftLog.objects.all().order_by('-shift_start')
    serializer_class = ShiftLogSerializer
    permission_classes = [permissions.IsAuthenticated]
