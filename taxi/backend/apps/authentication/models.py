from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    class Roles(models.TextChoices):
        FLEET_ADMIN = 'FLEET_ADMIN', 'Fleet Admin / Operations Manager'
        DISPATCHER = 'DISPATCHER', 'Fleet Dispatcher'
        CORPORATE_CLIENT = 'CORPORATE_CLIENT', 'Corporate Account Client'
        DRIVER = 'DRIVER', 'Fleet Driver'

    role = models.CharField(
        max_length=20,
        choices=Roles.choices,
        default=Roles.FLEET_ADMIN,
        help_text="Role determining permissions and access scope across the platform"
    )
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    company_name = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
