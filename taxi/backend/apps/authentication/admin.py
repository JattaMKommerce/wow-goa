from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ('B2B Fleet Specifics', {'fields': ('role', 'phone_number', 'company_name')}),
    )
    list_display = ('username', 'email', 'first_name', 'last_name', 'role', 'phone_number', 'is_staff')
    list_filter = ('role', 'is_staff', 'is_superuser', 'is_active')
