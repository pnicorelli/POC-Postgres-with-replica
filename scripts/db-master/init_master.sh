#!/bin/bash

set -e

echo "Configuring master for replication..."

echo "Modifying postgresql.conf..."
mkdir -p $PGDATA/archive
chown postgres:postgres $PGDATA/archive
chmod 700 $PGDATA/archive

echo "wal_level = logical" >> "$PGDATA/postgresql.conf"
echo "wal_log_hints = on" >> "$PGDATA/postgresql.conf"

echo "Modifying pg_hba.conf to allow replication connections..."
echo "host replication $POSTGRES_REPLICA_USER 0.0.0.0/0 md5" >> "$PGDATA/pg_hba.conf"

echo "Creating replication user..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE ROLE $POSTGRES_REPLICA_USER WITH REPLICATION LOGIN ENCRYPTED PASSWORD '$POSTGRES_REPLICA_PASSWORD';
EOSQL

echo "Restarting PostgreSQL to apply changes..."
pg_ctl -D "$PGDATA" -w restart

echo "Master configuration completed!"
