import os
import sys

# Ensure project directory is in Python path
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
if SCRIPT_DIR not in sys.path:
    sys.path.insert(0, SCRIPT_DIR)

# Configure Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# Load the WSGI application for Phusion Passenger on cPanel
from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
