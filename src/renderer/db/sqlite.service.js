import Database from 'better-sqlite3';
const db = new Database('cache.db');

export default class SQLiteService {
    constructor() {
        db.pragma('synchronous = OFF;');
        db.pragma('journal_mode = WAL;');
    }

    execute(sql, ...parameters) {
        try {
            const stmt = db.prepare(sql);
            const result = stmt.run(parameters);
            
            return result;
        } catch (ex) {
            if (ex.message.includes("database is locked")) {
                // console.warn(`Database was locked while executing query [${sql}]. Trying again in a few moments`);
                
                if (parameters.length > 0) {
                    return this.execute(sql, ...parameters);
                } else {
                    return this.execute(sql);
                }
            }

            throw ex;
        }
    }

    query(sql, ...parameters) {
        try {
            const stmt = db.prepare(sql);
            const result = stmt.all(parameters);

            return result;
        } catch (ex) {
            if (ex.message.includes("database is locked")) {
                // console.warn(`Database was locked while executing query [${sql}]. Trying again in a few moments`);
                
                if (parameters.length > 0) {
                    return this.query(sql, ...parameters);
                } else {
                    return this.query(sql);
                }
            }
            throw ex;
        }
    }

    close() {
        db.close();
    }
}
