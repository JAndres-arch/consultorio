const { Pool } = require('pg');
// No es necesario require('dotenv') si ya lo tienes en index.js, pero lo dejamos por si acaso.
require('dotenv').config(); 

// Render usa la variable DATABASE_URL que tú configuraste
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    
    // Esta configuración es OBLIGATORIA para las conexiones seguras de Render.
    ssl: {
        rejectUnauthorized: false
    }
});

module.exports = pool;