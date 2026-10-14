import os
import sys
import django
from datetime import timedelta
from django.utils import timezone

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.fleet.models import Vehicle
from apps.telematics.models import GeofenceZone, VehicleTelemetry, TelematicsAlert

def seed_telematics():
    print("🛰️ Seeding Phase 4: Operational Geofence Zones & Live GPS Telemetry...")

    # 1. Geofence Zones in Goa
    zones_data = [
        {
            'name': 'Manohar International Airport (Mopa GOX)',
            'zone_type': GeofenceZone.ZoneType.AIRPORT,
            'center_latitude': 15.7600000,
            'center_longitude': 73.8650000,
            'radius_meters': 2500,
            'speed_limit_kmh': 40,
            'color_hex': '#1e293b'
        },
        {
            'name': 'Dabolim International Airport Hub',
            'zone_type': GeofenceZone.ZoneType.AIRPORT,
            'center_latitude': 15.3800000,
            'center_longitude': 73.8310000,
            'radius_meters': 2000,
            'speed_limit_kmh': 40,
            'color_hex': '#334155'
        },
        {
            'name': 'Panaji Patto Commercial & Protocol Hub',
            'zone_type': GeofenceZone.ZoneType.DEPOT,
            'center_latitude': 15.4989000,
            'center_longitude': 73.8278000,
            'radius_meters': 1800,
            'speed_limit_kmh': 50,
            'color_hex': '#0f172a'
        },
        {
            'name': 'Verna Industrial Estate - Infosys DC',
            'zone_type': GeofenceZone.ZoneType.TECH_PARK,
            'center_latitude': 15.3620000,
            'center_longitude': 73.9350000,
            'radius_meters': 2200,
            'speed_limit_kmh': 50,
            'color_hex': '#475569'
        },
        {
            'name': 'South Goa Luxury Resorts (Taj Exotica / Benaulim)',
            'zone_type': GeofenceZone.ZoneType.HOTEL_CLUSTER,
            'center_latitude': 15.2500000,
            'center_longitude': 73.9250000,
            'radius_meters': 2800,
            'speed_limit_kmh': 45,
            'color_hex': '#64748b'
        },
        {
            'name': 'North Goa Coastal Strip (Calangute / Candolim)',
            'zone_type': GeofenceZone.ZoneType.RESTRICTED,
            'center_latitude': 15.5170000,
            'center_longitude': 73.7650000,
            'radius_meters': 3000,
            'speed_limit_kmh': 40,
            'color_hex': '#94a3b8'
        }
    ]

    zones = []
    for zd in zones_data:
        zone, _ = GeofenceZone.objects.get_or_create(
            name=zd['name'],
            defaults=zd
        )
        zones.append(zone)
    print(f"✅ Created/Verified {len(zones)} Operational Geofence Zones.")

    # 2. Assign Live Telemetry Pings to Fleet Vehicles
    vehicles = list(Vehicle.objects.all())
    if not vehicles:
        print("❌ No vehicles found to attach telemetry.")
        return

    # Coordinates across Goa highways & hubs
    locations_pool = [
        # (lat, lng, speed, heading, status, zone_idx)
        (15.7520, 73.8610, 38.0, 185, VehicleTelemetry.EngineStatus.RUNNING, 0),  # Mopa exit
        (15.6800, 73.8450, 68.0, 190, VehicleTelemetry.EngineStatus.RUNNING, None), # NH66 North
        (15.5800, 73.8320, 74.0, 175, VehicleTelemetry.EngineStatus.RUNNING, None), # Mapusa bypass
        (15.4989, 73.8278, 0.0, 90, VehicleTelemetry.EngineStatus.IDLE, 2),        # Panaji depot
        (15.4850, 73.8190, 42.0, 240, VehicleTelemetry.EngineStatus.RUNNING, 2),   # Miramar road
        (15.3800, 73.8310, 18.0, 310, VehicleTelemetry.EngineStatus.RUNNING, 1),   # Dabolim terminal
        (15.3620, 73.9350, 0.0, 0, VehicleTelemetry.EngineStatus.IDLE, 3),         # Verna Infosys DC
        (15.4100, 73.8900, 62.0, 150, VehicleTelemetry.EngineStatus.RUNNING, None), # Zuari Bridge highway
        (15.2500, 73.9250, 24.0, 80, VehicleTelemetry.EngineStatus.RUNNING, 4),    # Taj Benaulim approach
        (15.2850, 73.9120, 52.0, 180, VehicleTelemetry.EngineStatus.RUNNING, None), # Margao bypass
        (15.5170, 73.7650, 32.0, 340, VehicleTelemetry.EngineStatus.RUNNING, 5),   # Candolim main strip
        (15.5400, 73.7580, 0.0, 120, VehicleTelemetry.EngineStatus.OFF, 5),        # Calangute stand
    ]

    now = timezone.now()
    telemetry_created = 0

    for idx, v in enumerate(vehicles):
        loc = locations_pool[idx % len(locations_pool)]
        lat = loc[0] + ((idx // len(locations_pool)) * 0.005)
        lng = loc[1] + ((idx // len(locations_pool)) * 0.005)
        speed = loc[2]
        heading = loc[3]
        eng_status = loc[4]
        zone = zones[loc[5]] if loc[5] is not None else None

        # Create recent telemetry log
        telemetry = VehicleTelemetry.objects.create(
            vehicle=v,
            latitude=lat,
            longitude=lng,
            speed_kmh=speed,
            heading=heading,
            engine_status=eng_status,
            odometer_km=float(v.current_odometer),
            current_zone=zone,
            battery_pct=96.0 - (idx % 8),
            fuel_pct=88.0 - (idx % 15),
            timestamp=now - timedelta(minutes=idx * 2)
        )
        telemetry_created += 1

    print(f"✅ Created {telemetry_created} Initial GPS Telemetry Coordinates for Fleet Vehicles.")

    # 3. Seed Realistic Telematics Alerts
    alerts_data = [
        {
            'vehicle': vehicles[0],
            'alert_type': TelematicsAlert.AlertType.OVERSPEEDING,
            'severity': TelematicsAlert.Severity.CRITICAL,
            'speed_kmh': 86.50,
            'latitude': 15.6800,
            'longitude': 73.8450,
            'message': 'Vehicle exceeded 80 km/h commercial governor limit on NH-66 North Expressway (86.5 km/h recorded)'
        },
        {
            'vehicle': vehicles[1] if len(vehicles) > 1 else vehicles[0],
            'alert_type': TelematicsAlert.AlertType.GEOFENCE_ENTER,
            'severity': TelematicsAlert.Severity.INFO,
            'speed_kmh': 35.0,
            'latitude': 15.7600,
            'longitude': 73.8650,
            'message': 'Chauffeur arrived inside Manohar International Airport (Mopa GOX) geofence boundary'
        },
        {
            'vehicle': vehicles[2] if len(vehicles) > 2 else vehicles[0],
            'alert_type': TelematicsAlert.AlertType.IDLE_TIMEOUT,
            'severity': TelematicsAlert.Severity.WARNING,
            'speed_kmh': 0.0,
            'latitude': 15.4989,
            'longitude': 73.8278,
            'message': 'Excessive idle alert: Engine ON with 0 km/h speed for > 18 minutes at Panaji Protocol Hub'
        }
    ]

    for ad in alerts_data:
        TelematicsAlert.objects.get_or_create(
            vehicle=ad['vehicle'],
            alert_type=ad['alert_type'],
            message=ad['message'],
            defaults=ad
        )

    print(f"✅ Seeded 3 Telematics Alerts (Overspeeding, Geofence Entry, Idle Timeout).")
    print("🎉 Phase 4 Telematics Seeding Complete!")

if __name__ == '__main__':
    seed_telematics()
