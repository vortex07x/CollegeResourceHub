FROM php:8.2-cli

# Install system dependencies including Git and PostgreSQL
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    libpq-dev \
    && docker-php-ext-install pdo pdo_pgsql pgsql \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy composer.phar and composer files
COPY composer.phar ./
COPY composer.json ./

# Copy composer.lock if it exists
COPY composer.lock* ./

# Install dependencies with prefer-dist to avoid git requirement
RUN php composer.phar install --no-dev --optimize-autoloader --prefer-dist --no-interaction

# Copy application files
COPY . .

# Expose port
EXPOSE 8080

# Start PHP server
CMD php -S 0.0.0.0:8080