from rest_framework.routers import DefaultRouter
from .views import GeofenceZoneViewSet, TelematicsAlertViewSet, TelematicsViewSet

router = DefaultRouter()
router.register(r'geofences', GeofenceZoneViewSet, basename='geofence')
router.register(r'alerts', TelematicsAlertViewSet, basename='alert')
router.register(r'ops', TelematicsViewSet, basename='telematics-ops')

urlpatterns = router.urls
