#!/bin/bash

# Database Initialization Script
# This script runs during PostgreSQL container initialization

set -e

# Read secrets from files if they exist
if [[ -f "/run/secrets/postgres_db" ]]; then
    POSTGRES_DB=$(cat /run/secrets/postgres_db)
fi

if [[ -f "/run/secrets/postgres_user" ]]; then
    POSTGRES_USER=$(cat /run/secrets/postgres_user)
fi

if [[ -f "/run/secrets/postgres_password" ]]; then
    POSTGRES_PASSWORD=$(cat /run/secrets/postgres_password)
fi

echo "Initializing database: $POSTGRES_DB"

# Create database if it doesn't exist
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "postgres" <<-EOSQL
    SELECT 'CREATE DATABASE $POSTGRES_DB'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$POSTGRES_DB')\gexec
EOSQL

echo "Database initialization completed"