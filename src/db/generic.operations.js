const SQLiteService = require("../services/sqlite.service");
let db = {};

module.exports = class GenericOperations {

    constructor() {
        db = new SQLiteService();
    }

    getGenericFile(idMedia) {
        const result = db.query(`
            SELECT 
                media.id,
                media.fileName,
                media.extension,
                media.size,
                genericFile.md5,
                genericFile.binaryHash
            FROM media
            INNER JOIN genericFile ON genericFile.idMedia = media.id 
            WHERE idMedia = ? LIMIT 1`, idMedia);

        if (!result.length || result.length <= 0) {
            return 0;
        } else {
            return result[0];
        }
    }

    getGenericFiles(idsMedias) {
        let values = "";
        let separator = "";

        if (idsMedias.length <= 0) {
            values = "";
        } else {
            for (let i = 0; i < idsMedias.length; i++) {
                values += separator + `(${idsMedias[i]})`;
                separator = ","
            }

            values = "VALUES " + values;
        }
        
        const result = db.query(`
            SELECT 
                media.id,
                media.fileName,
                media.extension,
                media.size,
                genericFile.md5,
                genericFile.binaryHash
            FROM media
            INNER JOIN genericFile ON genericFile.idMedia = media.id 
            WHERE idMedia IN (${values})`);

        if (!result.length || result.length <= 0) {
            return 0;
        } else {
            return result;
        }
    }

    checkIfGenericFileExists(idMedia) {
        return new Promise((resolve) => {
            const result = db.query("SELECT pHash, Id FROM video WHERE idMedia = ? LIMIT 1", idMedia);

            if (!result.length || result.length <= 0) {
                resolve({ id: 0, pHash: undefined });
            } else {
                if (result[0].id > 0) {
                    resolve({ id: result[0].id, pHash: result[0].pHash })
                } else {
                    resolve({ id: 0, pHash: undefined });
                }
            }
        });
    }

    insertGenericFile(file) {
        return new Promise((resolve) => {
            const result =
                db.execute(`
                INSERT INTO genericFile (idMedia, md5, binaryHash)
                VALUES
                (?, ?, ?)`, 
                file.idMedia, file.md5, file.binaryHash);

            resolve(result.lastInsertRowid);
        })
    }

    getVectors(idsMedias) {
        let values = "";
        let separator = "";

        if (idsMedias.length <= 0) {
            values = "";
        } else {
            for (let i = 0; i < idsMedias.length; i++) {
                values += separator + `(${idsMedias[i]})`;
                separator = ","
            }

            values = "VALUES " + values;
        }

        const result = db.query(`SELECT idMedia, md5, binaryHash FROM genericFile WHERE idMedia IN (${values})`);

        if (!result.length || result.length <= 0) {
            return 0;
        } else {
            let results = [];

            for (let i = 0; i < result.length; i++) {
                results.push({ xAxis: result[i].md5, yAxis: result[i].binaryHash, id: result[i].idMedia });
            }
            return results;
        }
    }

    close() {
        db.close();
    }
}