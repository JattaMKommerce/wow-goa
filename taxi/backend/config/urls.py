from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.authentication.urls')),
    path('api/fleet/', include('apps.fleet.urls')),
    path('api/drivers/', include('apps.drivers.urls')),
    path('api/dispatches/', include('apps.dispatches.urls')),
    path('api/billing/', include('apps.billing.urls')),
    path('api/telematics/', include('apps.telematics.urls')),
]
