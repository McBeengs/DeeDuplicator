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

    const comparisons = db.prepare(`
    CREATE TABLE IF NOT EXISTS comparison (
        a INTEGER NOT NULL,
        b INTEGER NOT NULL,
        leven NUMERIC NULL,
        hamming NUMERIC NULL,
        dice NUMERIC NULL,
        whitelisted INTEGER NULL
    )`);
    comparisons.run();

    const tempComparison = db.prepare(`
    CREATE TABLE IF NOT EXISTS tempComparison (
        a INTEGER NOT NULL,
        b INTEGER NOT NULL,
        leven NUMERIC NULL,
        hamming NUMERIC NULL,
        dice NUMERIC NULL,
        whitelisted INTEGER NULL
    )`);
    tempComparison.run();

    const tempFiles = db.prepare(`
    CREATE TABLE IF NOT EXISTS tempFiles (
        path TEXT NOT NULL
    )`);
    tempFiles.run();

    const image = db.prepare(`
    CREATE TABLE IF NOT EXISTS image (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        idMedia INTEGER NOT NULL,
        lowResHash VARCHAR(24) NOT NULL,
        pHash TEXT NULL
    )`);
    image.run();

    const video = db.prepare(`
    CREATE TABLE IF NOT EXISTS video (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        idMedia INTEGER NOT NULL,
        width INTEGER NULL,
        height INTEGER NULL,
        duration INTEGER NULL,
        bitrate INTEGER NULL,
        framerate INTEGER NULL,
        codec TEXT NULL,
        audio TEXT NULL,
        lowResHash VARCHAR(24) NOT NULL,
        pHash TEXT NULL
    )`);
    video.run();

    const mediaException = db.prepare(`
    CREATE TABLE IF NOT EXISTS mediaException (
        path TEXT NOT NULL
    )`);
    mediaException.run();

    const tempDuplicates = db.prepare(`
    CREATE TABLE IF NOT EXISTS tempDuplicates (
        'group' INTEGER NOT NULL,
        id INTEGER NOT NULL,
        fileName VARCHAR(300) NOT NULL,
        extension VARCHAR(20) NOT NULL,
        createDate VARCHAR(35) NOT NULL,
        size NUMERIC NOT NULL,
        --md5 VARCHAR(32) NOT NULL,
        path TEXT NOT NULL
    )`);
    tempDuplicates.run();

    db.close();
  }
