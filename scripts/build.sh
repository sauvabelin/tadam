#!/bin/bash
set -e

echo "=== Building Tadam Festival ==="

# Clean dist folder
echo "Cleaning dist folder..."
rm -rf dist

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
