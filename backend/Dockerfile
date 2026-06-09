# CA Pharmacy API — PHP 8.3 + Apache
FROM php:8.3-apache

# PostgreSQL PDO driver + build deps
RUN apt-get update \
    && apt-get install -y --no-install-recommends libpq-dev \
    && docker-php-ext-install pdo pdo_pgsql \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Composer (autoloader only — there are no third-party runtime dependencies)
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Apache: enable rewrite and point the document root at /public
RUN a2enmod rewrite
COPY docker/vhost.conf /etc/apache2/sites-available/000-default.conf

WORKDIR /var/www/html

# Install (generate the autoloader) using only the manifest first, for caching
COPY composer.json composer.lock* ./
RUN composer install --no-dev --no-interaction --no-progress --no-autoloader

# Application code
COPY . .
RUN composer dump-autoload --optimize --no-dev \
    && chown -R www-data:www-data /var/www/html

EXPOSE 80
