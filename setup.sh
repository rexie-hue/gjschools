#!/bin/bash

# G & J Schools Management System - Automated Setup Script
# This script automates the entire setup process

echo "╔════════════════════════════════════════════════════╗"
echo "║  G & J Schools Management System Setup            ║"
echo "║  Enhanced Edition v2.0                            ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored messages
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Check if required software is installed
echo "Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    print_error "Node.js version must be 16 or higher. Current: $(node -v)"
    exit 1
fi
print_success "Node.js $(node -v) found"

# Check npm
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed"
    exit 1
fi
print_success "npm $(npm -v) found"

# Check PostgreSQL
if ! command -v psql &> /dev/null; then
    print_error "PostgreSQL is not installed. Please install PostgreSQL 13+ first."
    exit 1
fi
print_success "PostgreSQL found"

echo ""
echo "Installing dependencies..."
npm install
if [ $? -eq 0 ]; then
    print_success "Dependencies installed"
else
    print_error "Failed to install dependencies"
    exit 1
fi

echo ""
echo "Setting up database..."

# Get database credentials
read -p "Enter PostgreSQL username (default: postgres): " DB_USER
DB_USER=${DB_USER:-postgres}

read -sp "Enter PostgreSQL password: " DB_PASS
echo ""

read -p "Enter database name (default: edumanage): " DB_NAME
DB_NAME=${DB_NAME:-edumanage}

read -p "Enter database host (default: localhost): " DB_HOST
DB_HOST=${DB_HOST:-localhost}

read -p "Enter database port (default: 5432): " DB_PORT
DB_PORT=${DB_PORT:-5432}

# Check if database exists
export PGPASSWORD=$DB_PASS
DB_EXISTS=$(psql -U $DB_USER -h $DB_HOST -p $DB_PORT -lqt | cut -d \| -f 1 | grep -w $DB_NAME | wc -l)

if [ $DB_EXISTS -eq 0 ]; then
    echo "Creating database $DB_NAME..."
    createdb -U $DB_USER -h $DB_HOST -p $DB_PORT $DB_NAME
    if [ $? -eq 0 ]; then
        print_success "Database created"
    else
        print_error "Failed to create database"
        exit 1
    fi
else
    print_warning "Database $DB_NAME already exists"
    read -p "Do you want to drop and recreate it? (y/N): " RECREATE
    if [ "$RECREATE" = "y" ] || [ "$RECREATE" = "Y" ]; then
        dropdb -U $DB_USER -h $DB_HOST -p $DB_PORT $DB_NAME
        createdb -U $DB_USER -h $DB_HOST -p $DB_PORT $DB_NAME
        print_success "Database recreated"
    fi
fi

echo ""
echo "Running database migrations..."

# Run base schema
if [ -f "schema.sql" ]; then
    psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME -f schema.sql > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        print_success "Base schema applied"
    else
        print_error "Failed to apply base schema"
        exit 1
    fi
else
    print_warning "schema.sql not found, skipping base schema"
fi

# Run enhanced schema
if [ -f "enhanced_schema.sql" ]; then
    psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME -f enhanced_schema.sql > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        print_success "Enhanced schema applied"
    else
        print_error "Failed to apply enhanced schema"
        exit 1
    fi
else
    print_warning "enhanced_schema.sql not found, skipping enhanced features"
fi

unset PGPASSWORD

echo ""
echo "Configuring environment..."

# Generate random JWT secret
JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || head -c 32 /dev/urandom | base64)

# Create .env file
cat > .env << EOF
# Database Configuration
DATABASE_URL=postgresql://$DB_USER:$DB_PASS@$DB_HOST:$DB_PORT/$DB_NAME

# JWT Secret
JWT_SECRET=$JWT_SECRET

# Server Configuration
PORT=4000
NODE_ENV=development
EOF

print_success ".env file created"

echo ""
echo "Seeding database with sample data..."
read -p "Do you want to seed the database with sample data? (Y/n): " SEED
SEED=${SEED:-Y}

if [ "$SEED" = "y" ] || [ "$SEED" = "Y" ]; then
    npm run seed
    if [ $? -eq 0 ]; then
        print_success "Database seeded successfully"
    else
        print_warning "Seeding completed with warnings (this is usually okay)"
    fi
fi

echo ""
echo "╔════════════════════════════════════════════════════╗"
echo "║  Setup Complete!                                   ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""
print_success "G & J Schools Management System is ready!"
echo ""
echo "To start the application:"
echo "  Development: npm run dev"
echo "  Production:  npm start"
echo ""
echo "Access the application at: http://localhost:4000"
echo ""
echo "Default Login Credentials:"
echo "  Admin:      admin@gjschools.com / admin123"
echo "  Accountant: accountant@gjschools.com / account123"
echo "  Teacher:    teacher@gjschools.com / teacher123"
echo ""
print_warning "Important: Change default passwords in production!"
echo ""
echo "For documentation, see README.md"
echo ""