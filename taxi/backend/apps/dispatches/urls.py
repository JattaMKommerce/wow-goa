from rest_framework.routers import DefaultRouter
from .views import CorporateClientViewSet, DispatchBookingViewSet

router = DefaultRouter()
router.register(r'clients', CorporateClientViewSet, basename='client')
router.register(r'bookings', DispatchBookingViewSet, basename='booking')

urlpatterns = router.urls
