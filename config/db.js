const { Pool } = require("pg");

require("dotenv").config();

const pool = new Pool({

    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT),
     ssl:{
        rejectUnauthorized: false,
    },
    // Connection pool
    max: 20,
    min: 2,

    // Connection timeout
    connectionTimeoutMillis: 5000,

    // Close idle connections after 30 seconds
    idleTimeoutMillis: 30000

});

pool.on("connect", () => {

    console.log("PostgreSQL client connected");

});

pool.on("error", (err) => {

    console.error(
        "Unexpected PostgreSQL pool error:",
        err
    );

});





module.exports = pool;