from rest_framework.routers import DefaultRouter
from .views import (
    ContractPricingCardViewSet, 
    CorporateInvoiceViewSet, 
    DriverPayoutViewSet
)

router = DefaultRouter()
router.register(r'pricing', ContractPricingCardViewSet, basename='pricing')
router.register(r'invoices', CorporateInvoiceViewSet, basename='invoice')
router.register(r'payouts', DriverPayoutViewSet, basename='payout')

urlpatterns = router.urls
