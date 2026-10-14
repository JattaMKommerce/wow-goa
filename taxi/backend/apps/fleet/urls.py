from rest_framework.routers import DefaultRouter
from .views import VehicleViewSet, VehicleComplianceViewSet

router = DefaultRouter()
router.register(r'vehicles', VehicleViewSet, basename='vehicle')
router.register(r'compliance', VehicleComplianceViewSet, basename='compliance')

urlpatterns = router.urls
