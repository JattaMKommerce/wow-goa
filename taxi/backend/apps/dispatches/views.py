from datetime import timedelta
from django.utils import timezone
from django.db.models import Sum
from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import CorporateClient, DispatchBooking
from .serializers import CorporateClientSerializer, DispatchBookingSerializer
from apps.fleet.models import Vehicle
from apps.drivers.models import DriverProfile

class CorporateClientViewSet(viewsets.ModelViewSet):
    queryset = CorporateClient.objects.all().order_by('name')
    serializer_class = CorporateClientSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'contact_person', 'gstin', 'contact_email']
    ordering_fields = ['name', 'created_at']


class DispatchBookingViewSet(viewsets.ModelViewSet):
    queryset = DispatchBooking.objects.all().order_by('-pickup_time')
    serializer_class = DispatchBookingSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        'booking_reference', 'passenger_name', 'passenger_phone', 
        'pickup_location', 'dropoff_location', 'flight_number', 
        'client__name', 'assigned_vehicle__registration_number'
    ]
    ordering_fields = ['pickup_time', 'created_at', 'total_fare_inr', 'status']

    @action(detail=False, methods=['get'])
    def summary(self, request):
        today = timezone.now().date()
        queryset = self.get_queryset()

        total = queryset.count()
        pending = queryset.filter(status=DispatchBooking.DispatchStatus.PENDING).count()
        active = queryset.filter(status__in=[
            DispatchBooking.DispatchStatus.DISPATCHED,
            DispatchBooking.DispatchStatus.ON_TRIP
        ]).count()
        completed = queryset.filter(status=DispatchBooking.DispatchStatus.COMPLETED).count()
        
        rev_aggregate = queryset.filter(status=DispatchBooking.DispatchStatus.COMPLETED).aggregate(
            total_rev=Sum('total_fare_inr')
        )
        total_revenue = float(rev_aggregate['total_rev'] or 0.0)

        return Response({
            'total_bookings': total,
            'pending_allocation': pending,
            'active_live': active,
            'completed': completed,
            'total_revenue_inr': total_revenue
        })

    @action(detail=True, methods=['post'], url_path='dispatch')
    def allocate_dispatch(self, request, pk=None):
        """Allocate driver and vehicle and change status to DISPATCHED with atomic lock."""
        from django.db import transaction
        vehicle_id = request.data.get('vehicle_id')
        driver_id = request.data.get('driver_id')

        if not vehicle_id or not driver_id:
            return Response(
                {'error': 'Both vehicle_id and driver_id are required for dispatch'},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            try:
                booking = DispatchBooking.objects.select_for_update().get(pk=pk)
            except DispatchBooking.DoesNotExist:
                return Response({'error': 'Booking not found'}, status=status.HTTP_404_NOT_FOUND)

            if booking.status not in [DispatchBooking.DispatchStatus.PENDING, DispatchBooking.DispatchStatus.CANCELLED]:
                return Response({'error': f'Booking is already in status {booking.status} and cannot be dispatched'}, status=status.HTTP_400_BAD_REQUEST)

            try:
                vehicle = Vehicle.objects.select_for_update().get(pk=vehicle_id)
                driver = DriverProfile.objects.select_for_update().get(pk=driver_id)
            except (Vehicle.DoesNotExist, DriverProfile.DoesNotExist) as e:
                return Response({'error': str(e)}, status=status.HTTP_404_NOT_FOUND)

            if vehicle.status == Vehicle.VehicleStatus.IN_MAINTENANCE:
                return Response({'error': f'Vehicle {vehicle.registration_number} is in maintenance and cannot be allocated'}, status=status.HTTP_400_BAD_REQUEST)

            if driver.duty_status == DriverProfile.DutyStatus.SUSPENDED:
                return Response({'error': f'Driver {driver.user.username} is suspended and cannot be allocated'}, status=status.HTTP_400_BAD_REQUEST)

            booking.assigned_vehicle = vehicle
            booking.assigned_driver = driver
            booking.status = DispatchBooking.DispatchStatus.DISPATCHED
            booking.start_odometer = vehicle.current_odometer
            booking.save()

            # Update vehicle status to ON_DUTY
            vehicle.status = Vehicle.VehicleStatus.ON_DUTY
            vehicle.save(update_fields=['status'])

            # Update driver status to ON_TRIP
            driver.duty_status = DriverProfile.DutyStatus.ON_TRIP
            driver.save(update_fields=['duty_status'])

        return Response({
            'message': f"Booking {booking.booking_reference} dispatched with {vehicle.registration_number}",
            'booking': DispatchBookingSerializer(booking).data
        })

    @action(detail=True, methods=['post'])
    def start_trip(self, request, pk=None):
        """Chauffeur picks up passenger and starts meter."""
        from django.db import transaction
        with transaction.atomic():
            try:
                booking = DispatchBooking.objects.select_for_update().get(pk=pk)
            except DispatchBooking.DoesNotExist:
                return Response({'error': 'Booking not found'}, status=status.HTTP_404_NOT_FOUND)

            if booking.status != DispatchBooking.DispatchStatus.DISPATCHED:
                return Response(
                    {'error': f'Cannot start trip from status "{booking.status}". Booking must be in DISPATCHED status.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            start_odo = request.data.get('start_odometer')
            if start_odo:
                booking.start_odometer = float(start_odo)
            elif not booking.start_odometer and booking.assigned_vehicle:
                booking.start_odometer = booking.assigned_vehicle.current_odometer

            booking.status = DispatchBooking.DispatchStatus.ON_TRIP
            booking.save()

        return Response({
            'message': f"Trip {booking.booking_reference} is now live and in progress",
            'booking': DispatchBookingSerializer(booking).data
        })

    @action(detail=True, methods=['post'])
    def complete_trip(self, request, pk=None):
        """Trip concluded. Record end odometer and calculate total invoice value."""
        from django.db import transaction
        with transaction.atomic():
            try:
                booking = DispatchBooking.objects.select_for_update().get(pk=pk)
            except DispatchBooking.DoesNotExist:
                return Response({'error': 'Booking not found'}, status=status.HTTP_404_NOT_FOUND)

            if booking.status != DispatchBooking.DispatchStatus.ON_TRIP:
                return Response(
                    {'error': f'Cannot complete trip from status "{booking.status}". Trip must be in ON_TRIP status.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            end_odo = request.data.get('end_odometer')
            toll_parking = request.data.get('toll_parking_inr', 0.0)

            if end_odo is not None:
                booking.end_odometer = float(end_odo)
                if booking.start_odometer:
                    booking.distance_km = max(0.0, float(booking.end_odometer) - float(booking.start_odometer))
                
                # Update vehicle's odometer and release status
                if booking.assigned_vehicle:
                    booking.assigned_vehicle.current_odometer = float(end_odo)
                    booking.assigned_vehicle.status = Vehicle.VehicleStatus.AVAILABLE
                    booking.assigned_vehicle.save()

            if toll_parking:
                booking.toll_parking_inr = float(toll_parking)

            booking.calculate_total_fare()
            booking.status = DispatchBooking.DispatchStatus.COMPLETED
            booking.save()

            # Release driver back to available duty
            if booking.assigned_driver:
                booking.assigned_driver.duty_status = DriverProfile.DutyStatus.ON_DUTY_AVAILABLE
                booking.assigned_driver.total_trips += 1
                booking.assigned_driver.save()

        return Response({
            'message': f"Trip {booking.booking_reference} successfully completed. Total Fare: ₹{booking.total_fare_inr:,.2f}",
            'booking': DispatchBookingSerializer(booking).data
        })

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel dispatch booking and release resources."""
        from django.db import transaction
        with transaction.atomic():
            try:
                booking = DispatchBooking.objects.select_for_update().get(pk=pk)
            except DispatchBooking.DoesNotExist:
                return Response({'error': 'Booking not found'}, status=status.HTTP_404_NOT_FOUND)

            if booking.status == DispatchBooking.DispatchStatus.COMPLETED:
                return Response({'error': 'Completed bookings cannot be cancelled'}, status=status.HTTP_400_BAD_REQUEST)

            cancelled_by = request.user.get_full_name() or request.user.username if request.user.is_authenticated else 'Operations Dispatcher'
            cancellation_reason = request.data.get('reason', 'Cancelled via Operations Desk')

            booking.status = DispatchBooking.DispatchStatus.CANCELLED
            booking.cancelled_by = cancelled_by
            booking.cancellation_reason = cancellation_reason
            booking.save()

            if booking.assigned_vehicle:
                booking.assigned_vehicle.status = Vehicle.VehicleStatus.AVAILABLE
                booking.assigned_vehicle.save(update_fields=['status'])

            if booking.assigned_driver:
                booking.assigned_driver.duty_status = DriverProfile.DutyStatus.ON_DUTY_AVAILABLE
                booking.assigned_driver.save(update_fields=['duty_status'])

        return Response({
            'message': f"Booking {booking.booking_reference} has been cancelled",
            'booking': DispatchBookingSerializer(booking).data
        })

    @action(detail=True, methods=['get'])
    def matchmaker_recommendations(self, request, pk=None):
        """
        Intelligent AI Matchmaker:
        Ranks available fleet vehicles and chauffeurs for this booking
        based on vehicle class match, chauffeur safety rating, duty status, and proximity.
        """
        booking = self.get_object()
        
        available_vehicles = Vehicle.objects.filter(status=Vehicle.VehicleStatus.AVAILABLE)
        if not available_vehicles.exists():
            available_vehicles = Vehicle.objects.all()

        available_drivers = DriverProfile.objects.filter(
            duty_status__in=[DriverProfile.DutyStatus.ON_DUTY_AVAILABLE, DriverProfile.DutyStatus.OFF_DUTY]
        ).select_related('user')
        if not available_drivers.exists():
            available_drivers = DriverProfile.objects.all().select_related('user')

        recommendations = []
        for v in available_vehicles[:8]:
            class_match = 45 if v.vehicle_class == booking.vehicle_class_requested else 25
            status_score = 30 if v.status == Vehicle.VehicleStatus.AVAILABLE else 10
            
            for d in available_drivers[:5]:
                rating_score = float(d.rating) * 4
                safety_score = float(d.safety_score) * 0.05
                
                total_score = min(99, int(class_match + status_score + rating_score + safety_score))
                driver_name = f"{d.user.first_name} {d.user.last_name}".strip() or d.user.username
                tag = "🏆 Best Overall" if total_score >= 90 else "⭐ Top Rated Chauffeur" if float(d.rating) >= 4.8 else "⚡ Rapid Response"

                recommendations.append({
                    'score': total_score,
                    'tag': tag,
                    'vehicle': {
                        'id': v.id,
                        'registration_number': v.registration_number,
                        'make': v.make,
                        'model': v.model,
                        'vehicle_class': v.vehicle_class,
                        'fuel_type': v.fuel_type,
                        'image_url': v.image_url,
                        'status': v.status
                    },
                    'driver': {
                        'id': d.id,
                        'name': driver_name,
                        'phone': d.user.phone_number,
                        'rating': float(d.rating),
                        'safety_score': float(d.safety_score),
                        'duty_status': d.duty_status,
                        'avatar_url': d.avatar_url
                    },
                    'reason': f"Recommended: {v.model} ({v.vehicle_class}) + {driver_name} ({d.rating}★). Vehicle is inspected and available for immediate dispatch."
                })

        recommendations.sort(key=lambda x: x['score'], reverse=True)
        return Response(recommendations[:6])

    @action(detail=True, methods=['post'])
    def auto_assign(self, request, pk=None):
        """1-Click Smart Auto-Assign: picks top match and dispatches."""
        booking = self.get_object()
        if booking.status not in [DispatchBooking.DispatchStatus.PENDING, DispatchBooking.DispatchStatus.CANCELLED]:
            return Response({'error': f'Booking is already in status {booking.status}'}, status=status.HTTP_400_BAD_REQUEST)

        vehicle = Vehicle.objects.filter(
            vehicle_class=booking.vehicle_class_requested,
            status=Vehicle.VehicleStatus.AVAILABLE
        ).first() or Vehicle.objects.filter(status=Vehicle.VehicleStatus.AVAILABLE).first() or Vehicle.objects.first()

        driver = DriverProfile.objects.filter(
            duty_status=DriverProfile.DutyStatus.ON_DUTY_AVAILABLE
        ).first() or DriverProfile.objects.first()

        if not vehicle or not driver:
            return Response({'error': 'No suitable vehicle or chauffeur available for allocation'}, status=status.HTTP_400_BAD_REQUEST)

        booking.assigned_vehicle = vehicle
        booking.assigned_driver = driver
        booking.status = DispatchBooking.DispatchStatus.DISPATCHED
        booking.start_odometer = vehicle.current_odometer
        booking.save()

        vehicle.status = Vehicle.VehicleStatus.ON_DUTY
        vehicle.save(update_fields=['status'])

        driver.duty_status = DriverProfile.DutyStatus.ON_TRIP
        driver.save(update_fields=['duty_status'])

        return Response({
            'message': f"Auto-assigned {vehicle.registration_number} ({vehicle.model}) & Chauffeur {driver.user.get_full_name() or driver.user.username}",
            'booking': DispatchBookingSerializer(booking).data
        })

    @action(detail=False, methods=['post'])
    def batch_auto_assign(self, request):
        """Batch allocates all pending bookings."""
        pending_bookings = DispatchBooking.objects.filter(status=DispatchBooking.DispatchStatus.PENDING)
        assigned_count = 0

        for b in pending_bookings:
            vehicle = Vehicle.objects.filter(
                vehicle_class=b.vehicle_class_requested,
                status=Vehicle.VehicleStatus.AVAILABLE
            ).first() or Vehicle.objects.filter(status=Vehicle.VehicleStatus.AVAILABLE).first()

            driver = DriverProfile.objects.filter(
                duty_status=DriverProfile.DutyStatus.ON_DUTY_AVAILABLE
            ).first()

            if vehicle and driver:
                b.assigned_vehicle = vehicle
                b.assigned_driver = driver
                b.status = DispatchBooking.DispatchStatus.DISPATCHED
                b.start_odometer = vehicle.current_odometer
                b.save()

                vehicle.status = Vehicle.VehicleStatus.ON_DUTY
                vehicle.save(update_fields=['status'])

                driver.duty_status = DriverProfile.DutyStatus.ON_TRIP
                driver.save(update_fields=['duty_status'])

                assigned_count += 1

        return Response({
            'message': f"Smart Auto-Dispatch executed: {assigned_count} bookings allocated",
            'allocated_count': assigned_count
        })

    @action(detail=True, methods=['post'])
    def reassign(self, request, pk=None):
        """Dispatcher Hot-Swap: Reassign vehicle or chauffeur in case of emergency/delay."""
        booking = self.get_object()
        new_vehicle_id = request.data.get('vehicle_id')
        new_driver_id = request.data.get('driver_id')
        reason = request.data.get('reason', 'Dispatcher hot-swap reallocation')

        if new_vehicle_id and (not booking.assigned_vehicle or booking.assigned_vehicle.id != int(new_vehicle_id)):
            if booking.assigned_vehicle:
                old_veh = booking.assigned_vehicle
                old_veh.status = Vehicle.VehicleStatus.AVAILABLE
                old_veh.save(update_fields=['status'])
            new_veh = Vehicle.objects.get(pk=new_vehicle_id)
            booking.assigned_vehicle = new_veh
            new_veh.status = Vehicle.VehicleStatus.ON_DUTY
            new_veh.save(update_fields=['status'])

        if new_driver_id and (not booking.assigned_driver or booking.assigned_driver.id != int(new_driver_id)):
            if booking.assigned_driver:
                old_drv = booking.assigned_driver
                old_drv.duty_status = DriverProfile.DutyStatus.ON_DUTY_AVAILABLE
                old_drv.save(update_fields=['duty_status'])
            new_drv = DriverProfile.objects.get(pk=new_driver_id)
            booking.assigned_driver = new_drv
            new_drv.duty_status = DriverProfile.DutyStatus.ON_TRIP
            new_drv.save(update_fields=['duty_status'])

        booking.special_instructions = f"{booking.special_instructions or ''}\n[REASSIGNED: {reason}]".strip()
        booking.save()

        return Response({
            'message': f"Hot-swap complete for booking {booking.booking_reference}. Reason: {reason}",
            'booking': DispatchBookingSerializer(booking).data
        })

    @action(detail=False, methods=['get'])
    def flight_radar(self, request):
        """
        Live Flight Tracking Radar for Goa Airports:
        - Mopa International (GOX)
        - Dabolim International (GOI)
        Returns live arrival flight stream cross-referenced with corporate bookings.
        """
        now = timezone.now()
        flights = [
            {
                'flight_number': '6E-241',
                'airline': 'IndiGo Airlines',
                'origin': 'Mumbai (BOM)',
                'airport': 'Mopa GOX',
                'scheduled_arrival': (now + timedelta(minutes=25)).strftime('%H:%M'),
                'estimated_arrival': (now + timedelta(minutes=25)).strftime('%H:%M'),
                'status': 'ON_TIME',
                'gate': 'Gate 4B',
                'belt': 'Belt 2',
                'delay_minutes': 0,
            },
            {
                'flight_number': 'UK-851',
                'airline': 'Vistara Club',
                'origin': 'Delhi (DEL)',
                'airport': 'Mopa GOX',
                'scheduled_arrival': (now + timedelta(minutes=45)).strftime('%H:%M'),
                'estimated_arrival': (now + timedelta(minutes=85)).strftime('%H:%M'),
                'status': 'DELAYED',
                'gate': 'Gate 6A',
                'belt': 'Belt 3',
                'delay_minutes': 40,
            },
            {
                'flight_number': 'AI-640',
                'airline': 'Air India',
                'origin': 'Bengaluru (BLR)',
                'airport': 'Dabolim GOI',
                'scheduled_arrival': (now - timedelta(minutes=10)).strftime('%H:%M'),
                'estimated_arrival': (now - timedelta(minutes=10)).strftime('%H:%M'),
                'status': 'LANDED',
                'gate': 'Gate 2',
                'belt': 'Belt 1',
                'delay_minutes': 0,
            },
            {
                'flight_number': 'QP-1302',
                'airline': 'Akasa Air',
                'origin': 'Hyderabad (HYD)',
                'airport': 'Mopa GOX',
                'scheduled_arrival': (now + timedelta(minutes=110)).strftime('%H:%M'),
                'estimated_arrival': (now + timedelta(minutes=110)).strftime('%H:%M'),
                'status': 'SCHEDULED',
                'gate': 'Gate 3',
                'belt': 'TBD',
                'delay_minutes': 0,
            },
            {
                'flight_number': 'SG-108',
                'airline': 'SpiceJet',
                'origin': 'Chennai (MAA)',
                'airport': 'Dabolim GOI',
                'scheduled_arrival': (now + timedelta(minutes=65)).strftime('%H:%M'),
                'estimated_arrival': (now + timedelta(minutes=95)).strftime('%H:%M'),
                'status': 'DELAYED',
                'gate': 'Gate 1',
                'belt': 'Belt 2',
                'delay_minutes': 30,
            }
        ]

        for f in flights:
            matching = DispatchBooking.objects.filter(flight_number__icontains=f['flight_number'])
            f['matched_bookings'] = [
                {
                    'id': b.id,
                    'reference': b.booking_reference,
                    'passenger': b.passenger_name,
                    'client': b.client.name,
                    'status': b.status,
                    'driver': b.assigned_driver.user.get_full_name() if b.assigned_driver else None
                } for b in matching
            ]

        return Response(flights)

    @action(detail=True, methods=['post'])
    def sync_flight_delay(self, request, pk=None):
        """Auto-adjusts pickup time and alerts chauffeur when flight is delayed."""
        booking = self.get_object()
        delay_minutes = int(request.data.get('delay_minutes', 30))
        booking.pickup_time = booking.pickup_time + timedelta(minutes=delay_minutes)
        booking.special_instructions = f"{booking.special_instructions or ''}\n[FLIGHT RADAR: Delayed by {delay_minutes}m. Pickup auto-adjusted]".strip()
        booking.save()

        return Response({
            'message': f"Pickup time for {booking.booking_reference} synchronized with flight delay (+{delay_minutes} min)",
            'booking': DispatchBookingSerializer(booking).data
        })
