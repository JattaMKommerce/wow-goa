import os
import shutil
import zipfile

base_dir = os.path.dirname(os.path.abspath(__file__))
dist_dir = os.path.join(base_dir, "frontend", "dist")
backend_src = os.path.join(base_dir, "backend")

temp_dir = os.path.join(base_dir, "temp_cpanel_build")
zip_out = os.path.join(base_dir, "cpanel_ready_deploy.zip")

print("Building cPanel Deployment Package...")
print(f"Base Directory: {base_dir}")
print(f"Output ZIP: {zip_out}")

# 1. Clean temp directory
if os.path.exists(temp_dir):
    shutil.rmtree(temp_dir)
os.makedirs(temp_dir, exist_ok=True)

# 2. Copy frontend/dist contents to root of temp_dir
if not os.path.exists(dist_dir):
    raise FileNotFoundError(f"frontend/dist directory not found at {dist_dir}. Run 'npm run build' first.")

print("Copying frontend distribution files to web root...")
for item in os.listdir(dist_dir):
    s = os.path.join(dist_dir, item)
    d = os.path.join(temp_dir, item)
    if os.path.isdir(s):
        shutil.copytree(s, d)
    else:
        shutil.copy2(s, d)

# 3. Ensure .htaccess is at web root
htaccess_src = os.path.join(base_dir, ".htaccess")
if os.path.exists(htaccess_src):
    shutil.copy2(htaccess_src, os.path.join(temp_dir, ".htaccess"))

# 4. Copy backend files (including database.sqlite!)
backend_dest = os.path.join(temp_dir, "backend")
os.makedirs(backend_dest, exist_ok=True)

print("Copying backend API and SQLite database...")
# Exclude test files, local windows configs, and backup dumps
excluded_files = {
    "php.ini",              # Windows specific path
    "database.sqlite.backup_phase3",
    "duffel_api.log"
}

for item in os.listdir(backend_src):
    s = os.path.join(backend_src, item)
    d = os.path.join(backend_dest, item)
    
    if item in excluded_files:
        continue
    # Skip test scripts
    if item.startswith("test_") and item.endswith(".php"):
        continue
    if item.startswith("check_") and item.endswith(".php"):
        continue
    if item.startswith("scratch_") and item.endswith(".php"):
        continue
    if item.endswith(".zip"):
        continue

    if os.path.isdir(s):
        if item in {"migrations"}:
            continue
        shutil.copytree(s, d)
    else:
        shutil.copy2(s, d)

# Ensure backend has uploads directory
os.makedirs(os.path.join(backend_dest, "uploads"), exist_ok=True)

# 5. Verify database.sqlite is present
sqlite_dest = os.path.join(backend_dest, "database.sqlite")
if not os.path.exists(sqlite_dest) or os.path.getsize(sqlite_dest) == 0:
    raise RuntimeError("CRITICAL ERROR: database.sqlite is missing or empty in the package!")

print(f"Verified database.sqlite: {os.path.getsize(sqlite_dest):,} bytes")

# 6. Create ZIP
if os.path.exists(zip_out):
    os.remove(zip_out)

print("Creating ZIP archive...")
with zipfile.ZipFile(zip_out, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk(temp_dir):
        for file in files:
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, temp_dir)
            zipf.write(full_path, rel_path)

shutil.rmtree(temp_dir)
total_size = os.path.getsize(zip_out)
print(f"SUCCESS! Created '{zip_out}' ({total_size / (1024*1024):.2f} MB)")
