const Database = require('better-sqlite3');
const db = new Database('cache.db');

export function initializeSQLite() {
    const media = db.prepare(`
    CREATE TABLE IF NOT EXISTS media (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fileName VARCHAR(300) NOT NULL,
        extension VARCHAR(20) NOT NULL,
        createDate VARCHAR(35) NOT NULL,
        size NUMERIC NOT NULL,
        --md5 VARCHAR(32) NOT NULL,
        path TEXT NOT NULL
    )`);
    media.run();

    const metadata = db.prepare(`
    CREATE TABLE IF NOT EXISTS metadata (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        idMedia INTEGER NOT NULL,
        width INTEGER NULL,
        height INTEGER NULL,
        duration INTEGER NULL,
        bitrate INTEGER NULL,
        framerate INTEGER NULL,
        codec TEXT NULL,
        audio TEXT NULL
    )`);
    metadata.run();

    const comparisons = db.prepare(`
    CREATE TABLE IF NOT EXISTS comparison (
        a INTEGER NOT NULL,
        b INTEGER NOT NULL,
        leven NUMERIC NULL,
        hamming NUMERIC NULL,
        dice NUMERIC NULL
    )`);
    comparisons.run();

    const tempFiles = db.prepare(`
    CREATE TABLE IF NOT EXISTS tempFiles (
        path TEXT NOT NULL
    )`);
    tempFiles.run();

    const image = db.prepare(`
    CREATE TABLE IF NOT EXISTS image (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        idMedia INTEGER NOT NULL,
        pHash TEXT NULL
    )`);
    image.run();

    db.close();
  }
