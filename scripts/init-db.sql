-- Space Notes Database Initialization Script
-- This script sets up the basic database structure for local development

-- Create database if it doesn't exist
-- Note: This is handled by the POSTGRES_DB environment variable in docker-compose

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create a basic health check function
CREATE OR REPLACE FUNCTION health_check()
RETURNS TEXT AS $$
BEGIN
    RETURN 'Database is healthy';
END;
$$ LANGUAGE plpgsql;

-- Note: The actual schema should be managed by your migration system
-- This is just a basic setup for Docker development environment

-- You can add any additional setup queries here
-- For example, creating development users, setting up permissions, etc.

COMMENT ON FUNCTION health_check() IS 'Simple health check function for Docker container';
