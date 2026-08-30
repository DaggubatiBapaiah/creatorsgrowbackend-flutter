"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
var pg_1 = require("pg");
var env_1 = require("./env");
exports.pool = new pg_1.Pool({
    connectionString: env_1.env.DATABASE_URL,
    // Disable SSL for local database setup unless production/Supabase is specified
    ssl: env_1.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});
exports.pool.on('error', function (err) {
    console.error('Unexpected error on idle PostgreSQL client', err);
});
