from rest_framework.routers import DefaultRouter
from .views import DriverViewSet, ShiftLogViewSet

router = DefaultRouter()
router.register(r'drivers', DriverViewSet, basename='driver')
router.register(r'shifts', ShiftLogViewSet, basename='shift')

urlpatterns = router.urls
