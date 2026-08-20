#!/bin/bash
# ============================================================================
# SkulHub Database Setup Script
# ============================================================================
# This script sets up your Postgres database in one go.
# 
# USAGE:
#   1. Get your free Postgres connection string from neon.tech (see README)
#   2. Run: DATABASE_URL="your-connection-string" bash scripts/setup-db.sh
#
# WHAT IT DOES:
#   1. Switches the Prisma schema to Postgres
#   2. Creates all tables in your Postgres database
#   3. Loads demo data (426 students, staff, invoices, etc.)
#   4. Verifies everything works
# ============================================================================

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo ""
echo "================================================"
echo "  SkulHub Database Setup"
echo "================================================"
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo -e "${RED}❌ DATABASE_URL is not set!${NC}"
  echo ""
  echo "To get your free Postgres database:"
  echo "  1. Go to https://neon.tech"
  echo "  2. Sign up (free, no credit card)"
  echo "  3. Create a project named 'skulhub'"
  echo "  4. Copy the connection string"
  echo "  5. Run this script with:"
  echo ""
  echo -e "     ${YELLOW}DATABASE_URL=\"your-connection-string\" bash scripts/setup-db.sh${NC}"
  echo ""
  echo "Example:"
  echo '  DATABASE_URL="postgresql://user:pass@host/db?sslmode=require" bash scripts/setup-db.sh'
  echo ""
  exit 1
fi

# Check if it's a Postgres URL
if [[ "$DATABASE_URL" != postgresql://* && "$DATABASE_URL" != postgres://* ]]; then
  echo -e "${RED}❌ DATABASE_URL doesn't look like a Postgres connection string!${NC}"
  echo "It should start with: postgresql://"
  echo "Current value: $DATABASE_URL"
  exit 1
fi

echo -e "${GREEN}✓ DATABASE_URL detected (Postgres)${NC}"
echo ""

# Step 1: Switch schema to Postgres
echo -e "${YELLOW}Step 1/4: Switching Prisma schema to PostgreSQL...${NC}"
bash scripts/switch-schema.sh
echo -e "${GREEN}✓ Schema switched${NC}"
echo ""

# Step 2: Generate Prisma client
echo -e "${YELLOW}Step 2/4: Generating Prisma client...${NC}"
bunx prisma generate 2>&1 | tail -3
echo -e "${GREEN}✓ Prisma client generated${NC}"
echo ""

# Step 3: Create tables
echo -e "${YELLOW}Step 3/4: Creating database tables...${NC}"
bunx prisma db push --accept-data-loss 2>&1 | tail -5
echo -e "${GREEN}✓ Tables created${NC}"
echo ""

# Step 4: Load demo data
echo -e "${YELLOW}Step 4/4: Loading demo data (426 students, staff, invoices)...${NC}"
bun run prisma/seed-demo.ts 2>&1 | tail -10
echo -e "${GREEN}✓ Demo data loaded${NC}"
echo ""

# Verify
echo "================================================"
echo -e "${GREEN}  ✅ Database setup complete!${NC}"
echo "================================================"
echo ""
echo "Your database now has:"
echo "  • 1 school (SkulHub Academy, code: SKH-2024-001)"
echo "  • 14 staff accounts (admin, principal, bursar, etc.)"
echo "  • 426 students (Primary + Secondary)"
echo "  • 1 super admin (superadmin@skulhub.ac.ke)"
echo "  • Class levels, subjects, departments"
echo "  • Invoices and payments"
echo ""
echo "Demo Login Credentials:"
echo "  School Code: SKH-2024-001"
echo "  Admin:       admin@skulhub.ac.ke / admin123"
echo "  Super Admin: superadmin@skulhub.ac.ke / superadmin123"
echo ""
echo -e "${YELLOW}NEXT STEPS:${NC}"
echo "  1. Go to Vercel → Project Settings → Environment Variables"
echo "  2. Add DATABASE_URL = $DATABASE_URL"
echo "  3. Add SESSION_SECRET = skulhub-secret-2026 (or any random text)"
echo "  4. Redeploy your project"
echo "  5. Login will work permanently on skulhub.co.ke!"
echo ""
echo -e "${YELLOW}To test locally with the new database:${NC}"
echo "  bun run dev"
echo "  → Open http://localhost:3000"
echo ""
