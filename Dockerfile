FROM php:8.3-apache

# Install PHP extensions
RUN apt-get update && apt-get install -y libzip-dev \
    && docker-php-ext-install mysqli pdo pdo_mysql zip \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Enable Apache modules
RUN a2enmod rewrite

# Configure Apache to pass environment variables and allow .htaccess
RUN echo 'PassEnv MYSQL_DATABASE_URL MYSQL_HOST MYSQL_PORT MYSQL_DATABASE MYSQL_USER MYSQL_PASSWORD ADMIN_PASSWORD SESSION_EXPIRY ALLOWED_ORIGINS\n\
<Directory /var/www/html>\n\
    AllowOverride All\n\
    Require all granted\n\
</Directory>' > /etc/apache2/conf-available/custom.conf \
    && a2enconf custom

# Set working directory
WORKDIR /var/www/html

# Copy pre-built application (entire dist folder contents)
COPY . .

# Ensure correct permissions for uploads
RUN mkdir -p /var/www/html/uploads/images \
    && chown -R www-data:www-data /var/www/html/uploads \
    && chmod -R 775 /var/www/html/uploads

EXPOSE 80

CMD ["apache2-foreground"]
