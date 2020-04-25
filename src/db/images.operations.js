const SQLiteService = require("../services/sqlite.service");
let db = {};

module.exports = class ImagesOperations {

    constructor() {
        db = new SQLiteService();
    }

    checkIfImageExists(idMedia) {
        return new Promise((resolve) => {
            const result = db.query("SELECT pHash, Id FROM image WHERE idMedia = ? LIMIT 1", idMedia);

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

    insertImage(image) {
        return new Promise((resolve) => {
            const result =
                db.execute(`INSERT INTO image (idMedia, lowResHash, pHash) VALUES (?, ?, ?)`, image.idMedia, image.lowResHash, image.pHash);

            resolve(result.lastInsertRowid);
        })
    }

    getImagePHash(idMedia) {
        const result = db.query(`SELECT pHash FROM image WHERE idMedia = ? LIMIT 1`, idMedia);

        if (!result.length || result.length <= 0) {
            return 0;
        } else {
            return result[0].pHash;
        }
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


        const result = db.query(`SELECT idMedia, size, lowResHash FROM media INNER JOIN image ON image.idMedia = media.id WHERE idMedia IN (${values})`);

        if (!result.length || result.length <= 0) {
            return 0;
        } else {
            let results = [];

            for (let i = 0; i < result.length; i++) {
                results.push({ xAxis: result[i].size, yAxis: result[i].lowResHash, id: result[i].idMedia });
            }
            return results;
        }
    }

    close() {
        db.close();
    }
}