const sql = require('mssql');

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    options: {
        encrypt: true,
        trustServerCertificate: false
    }
};

async function connectToDatabase() {
    try {
        await sql.connect(config);
        console.log("Connected to Azure SQL Database successfully.");
    } catch (err) {
        console.error("Database connection failed:", err);
    }
}