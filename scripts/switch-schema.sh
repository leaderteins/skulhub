#!/bin/bash
# Switch Prisma schema provider based on DATABASE_URL
# - Postgres URL → use schema.prisma.pg (source of truth for production)
# - SQLite URL   → convert schema.prisma.pg to SQLite by flipping the provider
#                  line and stripping any PG-only annotations
set -e

SCHEMA_DIR="prisma"
SCHEMA="$SCHEMA_DIR/schema.prisma"
POSTGRES_SCHEMA="$SCHEMA_DIR/schema.prisma.pg"

if [ -n "$DATABASE_URL" ] && [[ "$DATABASE_URL" == postgresql://* || "$DATABASE_URL" == postgres://* ]]; then
  echo "[schema-switch] DATABASE_URL is Postgres → switching schema to PostgreSQL"
  if [ -f "$POSTGRES_SCHEMA" ]; then
    cp "$POSTGRES_SCHEMA" "$SCHEMA"
    echo "[schema-switch] ✓ Copied schema.prisma.pg → schema.prisma"
  else
    sed 's/provider = "sqlite"/provider = "postgresql"/' "$SCHEMA" > "$POSTGRES_SCHEMA"
    cp "$POSTGRES_SCHEMA" "$SCHEMA"
    echo "[schema-switch] ✓ Generated and switched to PostgreSQL schema"
  fi
elif [ -n "$DATABASE_URL" ] && [[ "$DATABASE_URL" == file:* ]]; then
  echo "[schema-switch] DATABASE_URL is SQLite → switching schema to SQLite"
  if [ -f "$POSTGRES_SCHEMA" ]; then
    # Convert PG schema → SQLite by flipping provider (no @db annotations to strip)
    sed 's/provider = "postgresql"/provider = "sqlite"/' "$POSTGRES_SCHEMA" > "$SCHEMA"
    echo "[schema-switch] ✓ Converted schema.prisma.pg → schema.prisma (SQLite)"
  else
    echo "[schema-switch] ✓ schema.prisma already SQLite (no .pg template)"
  fi
else
  echo "[schema-switch] DATABASE_URL not set → keeping existing schema.prisma"
fi
