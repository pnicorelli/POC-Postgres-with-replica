const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Leggi le variabili d'ambiente dal file .env
require('dotenv').config();

const pool = new Pool({
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    database: process.env.POSTGRES_DB,
  });

async function runMigrations() {

    const client = await pool.connect();

    try {
        
    await client.query('BEGIN');

    // Ottieni la lista dei file di migrazione nella cartella "migrations"
    const migrationFiles = fs.readdirSync(path.join(__dirname, 'migrations')).sort();

    for (const migrationFile of migrationFiles) {
        // Verifica se la migrazione è già stata eseguita
        const migrationName = migrationFile.replace(/\.sql$/, '');
        const checkMigrationQuery = 'SELECT name FROM migrations WHERE name = $1';
        const { rows } = await client.query(checkMigrationQuery, [migrationName]);
      
        if (rows.length === 0) {
          // Leggi il contenuto del file di migrazione
          const migrationContent = fs.readFileSync(path.join(__dirname, 'migrations', migrationFile), 'utf8');
      
          // Esegui il contenuto del file di migrazione come query SQL
          await client.query(migrationContent);
      
          // Registra la migrazione nel database
          await client.query('INSERT INTO migrations (name, executed_at) VALUES ($1, $2)', [migrationName, new Date()]);
        } else {
          console.log(`Migration '${migrationName}' has already been executed`);
        }
      }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}


runMigrations()
    .then(() => console.log('Migrations complete'))
    .catch(err => console.error(err));
