const SQLiteService = require("../services/sqlite.service");
let db = {};

module.exports = class VideosOperations {

    constructor() {
        db = new SQLiteService();
    }

    getVideo(idMedia) {
        const result = db.query(`
            SELECT 
                media.id,
                media.fileName,
                media.extension,
                media.size,
                video.width,
                video.height,
                video.duration,
                video.bitrate,
                video.framerate,
                video.codec,
                video.audio,
                video.lowResHash,
                video.pHash
            FROM media
            INNER JOIN video ON video.idMedia = media.id 
            WHERE idMedia = ? LIMIT 1`, idMedia);

        if (!result.length || result.length <= 0) {
            return 0;
        } else {
            return result[0];
        }
    }

    getVideos(idsMedias) {
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
                video.width,
                video.height,
                video.duration,
                video.bitrate,
                video.framerate,
                video.codec,
                video.audio,
                video.lowResHash,
                video.pHash
            FROM media
            INNER JOIN video ON video.idMedia = media.id 
            WHERE idMedia IN (${values})`);

        if (!result.length || result.length <= 0) {
            return 0;
        } else {
            return result;
        }
    }

    checkIfVideoExists(idMedia) {
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

    insertVideo(video) {
        return new Promise((resolve) => {
            const result =
                db.execute(`
                INSERT INTO video (idMedia, width, height, duration, bitrate, framerate, codec, audio, lowResHash, pHash)
                VALUES
                (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
                video.idMedia, video.metadata.width, video.metadata.height, video.metadata.duration, video.metadata.bitrate,
                video.metadata.framerate, video.metadata.codec, video.metadata.audio, video.lowResHash, video.pHash);

            resolve(result.lastInsertRowid);
        })
    }

    getVideoPHash(idMedia) {
        const result = db.query(`SELECT pHash FROM video WHERE idMedia = ? LIMIT 1`, idMedia);

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

        const result = db.query(`SELECT idMedia, duration, lowResHash FROM video WHERE idMedia IN (${values})`);

        if (!result.length || result.length <= 0) {
            return 0;
        } else {
            let results = [];

            for (let i = 0; i < result.length; i++) {
                results.push({ xAxis: result[i].duration, yAxis: result[i].lowResHash, id: result[i].idMedia });
            }
            return results;
        }
    }

    close() {
        db.close();
    }
}