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

    getImageVector(idMedia) {
        const result = db.query(`SELECT size, lowResHash FROM media INNER JOIN image ON image.idMedia = media.id WHERE idMedia = ? LIMIT 1`, idMedia);

        if (!result.length || result.length <= 0) {
            return 0;
        } else {
            return [ result[0].size, result[0].lowResHash ];
        }
    }

    close() {
        db.close();
    }
}