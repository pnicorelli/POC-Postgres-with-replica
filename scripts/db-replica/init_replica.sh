#!/bin/bash
set -e

echo "Checking if the master is available..."
until PGPASSWORD=$POSTGRES_PASSWORD psql -h "$POSTGRES_MASTER_HOST" -d "$POSTGRES_DB"  -U "$POSTGRES_USER" -c '\q'; do
  >&2 echo "Master is unavailable - sleeping"
  sleep 1
done

echo "Master is available, configuring replica..."
echo "Cleaning data directory..."
rm -rf ${PGDATA}/*

echo "Creating base backup from master..."
PGPASSWORD=$POSTGRES_REPLICA_PASSWORD pg_basebackup -h "$POSTGRES_MASTER_HOST" -D "$PGDATA" -U "$POSTGRES_REPLICA_USER" -C -S replica2 -v  -R -W -P --wal-method=stream

echo "Restarting PostgreSQL to apply changes..."
pg_ctl -D "$PGDATA" -w restart

echo "Replica configuration completed!"