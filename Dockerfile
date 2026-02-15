FROM php:8.3-apache

# Install PHP extensions
RUN apt-get update && apt-get install -y libzip-dev libpng-dev libjpeg62-turbo-dev libfreetype6-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install mysqli pdo pdo_mysql zip gd \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Increase PHP upload limits
RUN echo 'upload_max_filesize = 10M\npost_max_size = 12M' > /usr/local/etc/php/conf.d/uploads.ini

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

# Ensure correct permissions for uploads, fonts, and mPDF temp directory
RUN mkdir -p /var/www/html/uploads/images /tmp/mpdf \
    && chown -R www-data:www-data /var/www/html/uploads /tmp/mpdf \
    && chmod -R 775 /var/www/html/uploads /tmp/mpdf \
    && chown -R www-data:www-data /var/www/html/api/fonts \
    && chmod -R 775 /var/www/html/api/fonts

EXPOSE 80

CMD ["apache2-foreground"]
