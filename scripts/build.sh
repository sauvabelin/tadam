#!/bin/bash
set -e

echo "=== Building Tadam Festival ==="

# Clean dist contents except uploads/ — admin-uploaded images live there and
# must survive rebuilds. Doing this in-place (no /tmp shuffle) means a build
# crash can't strand uploads in a stale backup dir on the next run.
echo "Cleaning dist folder (preserving uploads)..."
if [ -d dist ]; then
  find dist -mindepth 1 -maxdepth 1 -not -name 'uploads' -exec rm -rf {} +
else
  mkdir -p dist
fi

# Build frontend with Vite
echo "Building frontend..."
npm run build:frontend

# Copy API files
echo "Copying API files..."
mkdir -p dist/api
cp -r api/src dist/api/
cp -r api/config dist/api/
cp -r api/migrations dist/api/
cp api/index.php dist/api/
cp api/composer.json dist/api/
cp api/composer.lock dist/api/ 2>/dev/null || true
cp api/.htaccess dist/api/
if [ -d api/fonts ]; then
  cp -r api/fonts dist/api/
fi
if [ -d public/assets/Stamps ]; then
  mkdir -p dist/api/stamps
  cp public/assets/Stamps/*.png dist/api/stamps/
fi

# Install composer dependencies
echo "Installing PHP dependencies..."
cd dist/api
composer install --no-dev --optimize-autoloader --no-interaction
cd ../..

# Create uploads directory structure (at root level to match URL /uploads/images/)
echo "Creating uploads directory..."
mkdir -p dist/uploads/images
touch dist/uploads/images/.gitkeep
# Copy .htaccess for security
if [ -f public/uploads/images/.htaccess ]; then
  cp public/uploads/images/.htaccess dist/uploads/images/
fi

# Copy root .htaccess for Apache routing
echo "Creating root .htaccess..."
cat > dist/.htaccess << 'EOF'
RewriteEngine On

# Handle API requests
RewriteRule ^api/(.*)$ api/index.php [L,QSA]

# Handle frontend routes (SPA)
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(?!api/).*$ index.html [L]
EOF

# Copy Dockerfile for deployment
echo "Copying Dockerfile..."
cp Dockerfile dist/

# Create .dockerignore
cat > dist/.dockerignore << 'EOF'
Dockerfile
.dockerignore
.git
.gitignore
*.md
EOF

echo "=== Build complete! ==="
echo "Output: dist/"
ls -la dist/
