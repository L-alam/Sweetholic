import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

async function runMigrations() {
    const client = await pool.connect();
    
    try {
    console.log('Starting database migrations...\n');
    
    // Get all migration files in order
    const migrationsDir = __dirname;
    const files = fs
        .readdirSync(migrationsDir)
        .filter(f => f.endsWith('.sql'))
        .sort();
    
    // Run each migration
    for (const file of files) {
        console.log(`Running migration: ${file}`);
        const filePath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(filePath, 'utf8');
        
        await client.query(sql);
        console.log(`Completed: ${file}\n`);
    }
    
    console.log('🎉 All migrations completed successfully!');
    } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
    } finally {
    client.release();
    await pool.end();
    }
}

// Run migrations
runMigrations()
    .then(() => process.exit(0))
    .catch((error) => {
    console.error(error);
    process.exit(1);
    });