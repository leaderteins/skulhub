#!/bin/bash
# Switch Prisma schema provider based on DATABASE_URL
set -e

SCHEMA_DIR="prisma"
SQLITE_SCHEMA="$SCHEMA_DIR/schema.prisma"
POSTGRES_SCHEMA="$SCHEMA_DIR/schema.prisma.pg"

if [ -n "$DATABASE_URL" ] && [[ "$DATABASE_URL" == postgresql://* || "$DATABASE_URL" == postgres://* ]]; then
  echo "[schema-switch] DATABASE_URL is Postgres → switching schema to PostgreSQL"
  if [ -f "$POSTGRES_SCHEMA" ]; then
    cp "$POSTGRES_SCHEMA" "$SQLITE_SCHEMA"
    echo "[schema-switch] ✓ Copied schema.prisma.pg → schema.prisma"
  else
    # Generate from SQLite schema by changing provider
    sed 's/provider = "sqlite"/provider = "postgresql"/' "$SQLITE_SCHEMA" > "$POSTGRES_SCHEMA"
    cp "$POSTGRES_SCHEMA" "$SQLITE_SCHEMA"
    echo "[schema-switch] ✓ Generated and switched to PostgreSQL schema"
  fi
else
  echo "[schema-switch] DATABASE_URL not set or is SQLite → keeping SQLite schema"
fi
