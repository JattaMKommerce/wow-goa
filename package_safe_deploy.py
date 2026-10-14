import os
import shutil
import zipfile

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIST = os.path.join(BASE_DIR, "frontend", "dist")
HTACCESS_SRC = os.path.join(BASE_DIR, ".htaccess")
DJANGO_SRC = os.path.join(BASE_DIR, "taxi", "backend")

ZIP_FRONTEND = os.path.join(BASE_DIR, "cpanel_frontend_safe.zip")
ZIP_DJANGO = os.path.join(BASE_DIR, "cpanel_django_backend.zip")

print("=" * 60)
print("  WOW GOA TAXI INTEGRATION — SAFE ZERO-RISK PACKAGER")
print("=" * 60)

# ----------------------------------------------------
# 1. PACKAGE FRONTEND (SAFE: NEVER TOUCHES backend/)
# ----------------------------------------------------
print("\n[1/2] Packaging Safe Frontend (cpanel_frontend_safe.zip)...")
if not os.path.exists(FRONTEND_DIST):
    raise FileNotFoundError(f"Frontend dist not found at {FRONTEND_DIST}. Run 'npm run build' first.")

temp_frontend = os.path.join(BASE_DIR, "temp_frontend_build")
if os.path.exists(temp_frontend):
    shutil.rmtree(temp_frontend)
os.makedirs(temp_frontend, exist_ok=True)

for item in os.listdir(FRONTEND_DIST):
    src = os.path.join(FRONTEND_DIST, item)
    dst = os.path.join(temp_frontend, item)
    if os.path.isdir(src):
        shutil.copytree(src, dst)
    else:
        shutil.copy2(src, dst)

# Ensure root .htaccess is included for React SPA routing
if os.path.exists(HTACCESS_SRC):
    shutil.copy2(HTACCESS_SRC, os.path.join(temp_frontend, ".htaccess"))

if os.path.exists(ZIP_FRONTEND):
    os.remove(ZIP_FRONTEND)

with zipfile.ZipFile(ZIP_FRONTEND, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk(temp_frontend):
        for file in files:
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, temp_frontend)
            zipf.write(full_path, rel_path)

shutil.rmtree(temp_frontend)
frontend_size_mb = os.path.getsize(ZIP_FRONTEND) / (1024 * 1024)
print(f"  -> SUCCESS! Created '{ZIP_FRONTEND}' ({frontend_size_mb:.2f} MB)")
print("  -> NOTE: backend/ and database.sqlite are 100% EXCLUDED from this package.")

# ----------------------------------------------------
# 2. PACKAGE DJANGO BACKEND (INDEPENDENT MICROSERVICE)
# ----------------------------------------------------
print("\n[2/2] Packaging Django Taxi Microservice (cpanel_django_backend.zip)...")
if not os.path.exists(DJANGO_SRC):
    raise FileNotFoundError(f"Django backend not found at {DJANGO_SRC}")

temp_django = os.path.join(BASE_DIR, "temp_django_build")
if os.path.exists(temp_django):
    shutil.rmtree(temp_django)
os.makedirs(temp_django, exist_ok=True)

excluded_names = {
    ".venv", "venv", "env", "__pycache__", ".pytest_cache", ".git", ".DS_Store"
}

for root, dirs, files in os.walk(DJANGO_SRC):
    # Filter out excluded directories in-place
    dirs[:] = [d for d in dirs if d not in excluded_names and not d.endswith(".egg-info")]
    rel_root = os.path.relpath(root, DJANGO_SRC)
    target_root = os.path.join(temp_django, rel_root) if rel_root != "." else temp_django
    os.makedirs(target_root, exist_ok=True)

    for file in files:
        if file in excluded_names or file.endswith((".pyc", ".pyo", ".log")):
            continue
        src_file = os.path.join(root, file)
        dst_file = os.path.join(target_root, file)
        shutil.copy2(src_file, dst_file)

if os.path.exists(ZIP_DJANGO):
    os.remove(ZIP_DJANGO)

with zipfile.ZipFile(ZIP_DJANGO, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk(temp_django):
        for file in files:
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, temp_django)
            zipf.write(full_path, rel_path)

shutil.rmtree(temp_django)
django_size_mb = os.path.getsize(ZIP_DJANGO) / (1024 * 1024)
print(f"  -> SUCCESS! Created '{ZIP_DJANGO}' ({django_size_mb:.2f} MB)")
print("  -> Ready to upload to /home/wowgoa/taxi_backend on cPanel.")

print("\n" + "=" * 60)
print("  ALL DEPLOYMENT PACKAGES CREATED WITH 100% ISOLATION!")
print("=" * 60)
