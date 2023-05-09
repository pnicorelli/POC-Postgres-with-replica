const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');

// Leggi le variabili d'ambiente dal file .env
require('dotenv').config({});

const app = express();
app.use(bodyParser.json());

const masterPool = new Pool({
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  database: process.env.POSTGRES_DB,
});

const replicaPool = new Pool({
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  host: process.env.POSTGRES_REPLICA_HOST,
  port: process.env.POSTGRES_REPLICA_PORT,
  database: process.env.POSTGRES_REPLICA_DB,
});

// Funzione per scrivere i dati su database master
async function writeToMaster(data) {
  const client = await masterPool.connect();
  try {
    await client.query('BEGIN');
    await client.query('INSERT INTO test (data) VALUES ($1)', [JSON.stringify(data)]);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// Funzione per leggere i dati dal database replica
async function readFromReplica() {
  const client = await replicaPool.connect();
  try {
    const result = await client.query('SELECT * FROM test');
    return result.rows
  } finally {
    client.release();
  }
}

app.post('/test', async (req, res) => {
  try {
    const data = req.body;
    await writeToMaster(data);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create test' });
  }
});

app.get('/test', async (req, res) => {
  try {
    const tests = await readFromReplica();
    console.error(tests)
    res.json(tests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch tests' });
  }
});

app.listen(3000, () => {
  console.log('Server listening on port 3000');
});
