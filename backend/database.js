const { Pool } = require ( 'pg' )

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'consultorio_db',
    password: 'mimientzi1312',

    port: 5432,
});

module.exports = pool;