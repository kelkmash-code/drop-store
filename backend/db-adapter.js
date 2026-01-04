const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');
const { Pool } = require('pg');

// Adapter to unify SQLite and PostgreSQL interfaces
class DbAdapter {
    constructor() {
        this.type = process.env.DATABASE_URL ? 'postgres' : 'sqlite';
        this.db = null;
    }

    async connect() {
        if (this.type === 'postgres') {
            console.log('Connecting to PostgreSQL...');
            this.db = new Pool({
                connectionString: process.env.DATABASE_URL,
                ssl: { rejectUnauthorized: false } // Required for Render
            });
            // Test connection
            await this.db.query('SELECT NOW()');
        } else {
            console.log('Connecting to SQLite...');
            this.db = await open({
                filename: path.join(__dirname, 'database.sqlite'),
                driver: sqlite3.Database
            });
        }
        return this;
    }

    // Convert SQLite '?' params to Postgres '$1, $2...' params
    _prepareQuery(sql) {
        if (this.type === 'sqlite') return sql;

        let i = 1;
        // Replace ? with $1, $2, etc.
        return sql.replace(/\?/g, () => `$${i++}`);
    }

    async run(sql, params = []) {
        if (this.type === 'sqlite') {
            return await this.db.run(sql, params);
        } else {
            // PostgreSQL implementation
            const pgSql = this._prepareQuery(sql);

            // Handle INSERT 'lastID' requirement
            // If it's an INSERT and doesn't have RETURNING, add it
            let finalSql = pgSql;
            const isInsert = /^\s*INSERT\s/i.test(sql);
            if (isInsert && !/RETURNING/i.test(sql)) {
                finalSql += ' RETURNING id';
            }

            const res = await this.db.query(finalSql, params);

            // Mimic SQLite return object
            return {
                lastID: isInsert && res.rows.length > 0 ? res.rows[0].id : null,
                changes: res.rowCount
            };
        }
    }

    async get(sql, params = []) {
        if (this.type === 'sqlite') {
            return await this.db.get(sql, params);
        } else {
            const pgSql = this._prepareQuery(sql);
            const res = await this.db.query(pgSql, params);
            return res.rows[0];
        }
    }

    async all(sql, params = []) {
        if (this.type === 'sqlite') {
            return await this.db.all(sql, params);
        } else {
            const pgSql = this._prepareQuery(sql);
            const res = await this.db.query(pgSql, params);
            return res.rows;
        }
    }

    async exec(sql) {
        if (this.type === 'sqlite') {
            return await this.db.exec(sql);
        } else {
            // exec in generic driver usually means running multiple statements or script
            // pg pool.query can handle this BUT parameterized query replacement might fail if we blindly do it
            // usually exec params are empty.
            return await this.db.query(sql);
        }
    }
}

module.exports = new DbAdapter();
