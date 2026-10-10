from datetime import timedelta
from django.utils import timezone
from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Vehicle, VehicleCompliance
from .serializers import VehicleSerializer, VehicleComplianceSerializer

class VehicleViewSet(viewsets.ModelViewSet):
    queryset = Vehicle.objects.all().order_by('-created_at')
    serializer_class = VehicleSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['registration_number', 'vin', 'make', 'model']
    ordering_fields = ['registration_number', 'created_at', 'current_odometer']

    @action(detail=False, methods=['get'])
    def summary(self, request):
        total = self.get_queryset().count()
        available = self.get_queryset().filter(status=Vehicle.VehicleStatus.AVAILABLE).count()
        on_duty = self.get_queryset().filter(status=Vehicle.VehicleStatus.ON_DUTY).count()
        in_maintenance = self.get_queryset().filter(status=Vehicle.VehicleStatus.IN_MAINTENANCE).count()
        
        return Response({
            'total_vehicles': total,
            'available': available,
            'on_duty': on_duty,
            'in_maintenance': in_maintenance
        })

    @action(detail=True, methods=['post'])
    def assign_driver(self, request, pk=None):
        vehicle = self.get_object()
        driver_id = request.data.get('driver_id')
        if not driver_id:
            return Response({'error': 'driver_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        from apps.drivers.models import DriverProfile
        try:
            driver = DriverProfile.objects.get(pk=driver_id)
        except DriverProfile.DoesNotExist:
            return Response({'error': 'Driver profile not found'}, status=status.HTTP_404_NOT_FOUND)

        # Unassign any previously assigned driver from this vehicle
        DriverProfile.objects.filter(assigned_vehicle=vehicle).exclude(pk=driver.pk).update(assigned_vehicle=None)

        # Assign this driver to this vehicle
        driver.assigned_vehicle = vehicle
        driver.save(update_fields=['assigned_vehicle'])

        return Response({
            'message': f"Driver {driver.user.get_full_name() or driver.user.username} successfully assigned to {vehicle.registration_number}",
            'vehicle': VehicleSerializer(vehicle).data
        })

    @action(detail=True, methods=['post'])
    def unassign_driver(self, request, pk=None):
        vehicle = self.get_object()
        from apps.drivers.models import DriverProfile
        unassigned_count = DriverProfile.objects.filter(assigned_vehicle=vehicle).update(assigned_vehicle=None)
        
        return Response({
            'message': f"Unassigned {unassigned_count} driver(s) from {vehicle.registration_number}",
            'vehicle': VehicleSerializer(vehicle).data
        })

class VehicleComplianceViewSet(viewsets.ModelViewSet):
    queryset = VehicleCompliance.objects.all().order_by('expiry_date')
    serializer_class = VehicleComplianceSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['document_number', 'vehicle__registration_number', 'vehicle__make', 'vehicle__model', 'issuer_authority']
    ordering_fields = ['expiry_date', 'issue_date', 'document_type']

    @action(detail=False, methods=['get'])
    def summary(self, request):
        today = timezone.now().date()
        in_30_days = today + timedelta(days=30)

        queryset = self.get_queryset()
        total = queryset.count()
        expired = queryset.filter(expiry_date__lt=today).count()
        expiring_soon = queryset.filter(expiry_date__gte=today, expiry_date__lte=in_30_days).count()
        valid = queryset.filter(expiry_date__gt=in_30_days).count()

        return Response({
            'total_documents': total,
            'valid': valid,
            'expiring_soon': expiring_soon,
            'expired': expired
        })
