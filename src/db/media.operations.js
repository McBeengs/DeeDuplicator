const SQLiteService = require("../services/sqlite.service");
let db = {};

module.exports = class MediaOperations {

    constructor() {
        db = new SQLiteService();
    }

    getMediaById(idMedia) {
        const result = db.query(`SELECT * FROM media WHERE id = ?`, idMedia);
        return result[0];
    }

    insertMedia(media) {
        return new Promise((resolve) => {
            const result =
                db.execute(
                    `INSERT INTO media (fileName, extension, createDate, size, path) VALUES (?, ?, ?, ?, ?)`,
                    media.filename, media.extension, `${media.createDate}`, media.size, media.path);

            resolve(result.lastInsertRowid);
        });
    }

    deleteFailedMedia(filePath) {
        return new Promise((resolve) => {
            const result = db.execute(`DELETE FROM media WHERE path = ?`, filePath);

            resolve(result.lastInsertRowid);
        });
    }

    clearTempFilesTable() {
        try {
            db.execute("DELETE FROM tempFiles");
            return true;
        } catch (ex) {
            return false;
        }
    }

    removeProcessedFiles() {
        try {
            db.execute("DELETE FROM tempFiles WHERE path IN (SELECT path FROM media)");
            return true;
        } catch (ex) {
            return false;
        }
    }

    insertTempFile(path) {
        const result = db.execute(`INSERT INTO tempFiles (path) VALUES (?)`, path);
        return result.lastInsertRowid;
    }

    getTempFilesTableSize() {
        const result = db.query("SELECT COUNT(*) AS Contains FROM tempFiles");

        if (!result.length || result.length <= 0) {
            return 0;
        } else {
            if (result[0].Contains > 0) {
                return result[0].Contains;
            } else {
                return 0;
            }
        }
    }

    getChunkTempFiles() {
        const result = db.query(`SELECT path FROM tempFiles LIMIT 10000`);
        db.execute(`DELETE FROM tempFiles WHERE path IN (SELECT path FROM tempFiles LIMIT 10000)`);

        if (!result.length || result.length <= 0) {
            return [];
        } else {
            return result
        }
    }

    clearTempVectorsTable() {
        try {
            db.execute("DELETE FROM tempVectors");
            return true;
        } catch (ex) {
            return false;
        }
    }

    getAllAlreadyComparedIds() {
        const idsMedias = db.query(`
        SELECT DISTINCT a FROM (
            SELECT DISTINCT a FROM comparison
            UNION ALL
            SELECT DISTINCT b FROM comparison
        )
        `);

        let ids = [];

        for (let i = 0; i < idsMedias.length; i++) {
            ids.push(idsMedias[i].a);
        }

        return ids;
    }

    getNonComparedMedias() {
        let values = "";
        let separator = "";

        const idsMedias = db.query(`
        SELECT DISTINCT a FROM (
            SELECT DISTINCT a FROM comparison
            UNION ALL
            SELECT DISTINCT b FROM comparison
        )
        `);

        if (idsMedias.length <= 0) {
            values = "";
        } else {
            for (let i = 0; i < idsMedias.length; i++) {
                values += separator + `(${idsMedias[i].a})`;
                separator = ","
            }

            values = "VALUES " + values;
        }

        let query = `SELECT id FROM media WHERE id NOT IN (${values})`;

        const result = db.query(query);

        if (!result.length || result.length <= 0) {
            return [];
        } else {
            return result
        }
    }

    mediasAlreadyCompared(idMediaA, idMediaB) {
        const result = db.query(`SELECT * FROM comparison WHERE (a = ? AND b = ?) OR (b = ? AND a = ?) LIMIT 1`,
            idMediaA, idMediaB, idMediaA, idMediaB);

        if (!result.length || result.length <= 0) {
            return null;
        } else {
            return result[0];
        }
    }

    insertMediasCompared(comparisons) {
        try {
            let stringsToInsert = "";
            
            for (let i = 0; i < comparisons.length; i++) {
                const comparison = comparisons[i];
                
                if (i > 0) {
                    stringsToInsert += ", ";
                }

                stringsToInsert += `(${comparison.idMediaA}, ${comparison.idMediaB}, `;

                switch (comparison.algorithm) {
                    case "leven":
                        stringsToInsert += `'${comparison.percentage}', null, null)`
                        break;
                    case "hamming":
                        stringsToInsert += `null, '${comparison.percentage}', null)`
                        break;
                    case "dice":
                        stringsToInsert += `null, null, '${comparison.percentage}')`
                        break;
                }
            }
            
            db.execute("INSERT INTO comparison (a, b, leven, hamming, dice) VALUES " + stringsToInsert);
            
            return true;
        } catch (ex) {
            return false;
        }
    }

    getDuplicateMedias(algorithm, threshold) {
        try {
            let query = `SELECT a, b FROM comparison WHERE ${algorithm} >= ? AND whitelisted IS null ORDER BY a ASC`;
            let result = db.query(query, threshold);

            if (!result.length || result.length <= 0) {
                return [];
            } else {
                let arrayIdGroups = [];

                for (let i = 0; i < result.length; i++) {
                    const idA = result[i].a;
                    const idB = result[i].b;

                    let inGroup = false;
                    for (let j = 0; j < arrayIdGroups.length; j++) {
                        const elements = arrayIdGroups[j];
                        if (elements.includes(idA) || elements.includes(idB)) {
                            if (!elements.includes(idA)) {
                                arrayIdGroups[j].push(idA);
                            }
                            if (!elements.includes(idB)) {
                                arrayIdGroups[j].push(idB);
                            }
                            inGroup = true;
                            break;
                        }
                    }

                    if (!inGroup) {
                        arrayIdGroups.push([idA, idB])
                    }
                }

                let mediaGroups = [];

                for (let i = 0; i < arrayIdGroups.length; i++) {
                    const idGroup = arrayIdGroups[i];
                    let group = [];

                    for (let j = 0; j < idGroup.length; j++) {
                        let media = this.getMediaById(idGroup[j]);
                        media.checked = false;
                        group.push(media);
                    }

                    mediaGroups.push(group);
                }

                return mediaGroups;
            }
        } catch (ex) {
            return [];
        }
    }

    close() {
        db.close();
    }
}