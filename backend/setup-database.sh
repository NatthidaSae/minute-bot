#!/bin/bash

echo "🗄️  PostgreSQL Setup for Meeting App"
echo "===================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
DB_NAME="meeting_app_db"
DB_USER="meeting_user"
DB_PASS="meeting_password"

echo "This script will help you set up PostgreSQL for the meeting app."
echo ""
echo "Default database settings:"
echo "  Database: $DB_NAME"
echo "  Username: $DB_USER"
echo "  Password: $DB_PASS"
echo ""
read -p "Use default settings? (y/n): " use_defaults

if [ "$use_defaults" != "y" ]; then
    read -p "Enter database name [$DB_NAME]: " input_db
    DB_NAME=${input_db:-$DB_NAME}
    
    read -p "Enter username [$DB_USER]: " input_user
    DB_USER=${input_user:-$DB_USER}
    
    read -p "Enter password [$DB_PASS]: " input_pass
    DB_PASS=${input_pass:-$DB_PASS}
fi

echo ""
echo "Setting up PostgreSQL with:"
echo "  Database: $DB_NAME"
echo "  Username: $DB_USER"
echo ""

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ PostgreSQL is not installed!${NC}"
    echo "Please install PostgreSQL first:"
    echo "  macOS: brew install postgresql"
    echo "  Ubuntu: sudo apt install postgresql"
    exit 1
fi

echo -e "${GREEN}✅ PostgreSQL is installed${NC}"

# Create .env file
echo ""
echo "Creating .env file..."
cat > .env << EOF
# Database Configuration
DATABASE_URL=postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}

# Server Configuration
PORT=5000
NODE_ENV=development
EOF

echo -e "${GREEN}✅ Created .env file${NC}"

# Create database and user
echo ""
echo "Creating database and user..."
echo "You may be prompted for your PostgreSQL superuser password."

# Create user and database
psql -U postgres << EOF
-- Create user if not exists
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_user WHERE usename = '${DB_USER}') THEN
    CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASS}';
  END IF;
END
\$\$;

-- Create database if not exists
SELECT 'CREATE DATABASE ${DB_NAME}' 
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${DB_NAME}')\gexec

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database and user created${NC}"
else
    echo -e "${YELLOW}⚠️  Could not create database/user (may already exist)${NC}"
fi

# Create schema
echo ""
echo "Creating database schema..."
PGPASSWORD=$DB_PASS psql -U $DB_USER -d $DB_NAME -h localhost -f src/config/schema.sql

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Schema created successfully${NC}"
else
    echo -e "${RED}❌ Failed to create schema${NC}"
    exit 1
fi

# Seed data
echo ""
echo "Seeding database with test data..."
npm run seed

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database seeded successfully${NC}"
else
    echo -e "${RED}❌ Failed to seed database${NC}"
    exit 1
fi

# Test connection
echo ""
echo "Testing database connection..."
npm run db:test

echo ""
echo -e "${GREEN}🎉 Database setup complete!${NC}"
echo ""
echo "You can now start the backend server with:"
echo "  npm run dev"
echo ""
echo "To reset the database later, run:"
echo "  npm run db:reset"