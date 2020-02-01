import SQLiteService from './sqlite.service'
let db = {};

export default class RendererOperations {

    constructor() {
        db = new SQLiteService();
    }
    
    switchDirectories(mediaLeft, mediaRight) {
        try {
            const mediaLeftPathHolder = mediaLeft.path.replace(mediaLeft.fileName, mediaRight.fileName);
            const mediaRightPathHolder = mediaRight.path.replace(mediaRight.fileName, mediaLeft.fileName);

            db.execute("UPDATE media SET path = ? WHERE id = ?", mediaRightPathHolder, mediaLeft.id);
            db.execute("UPDATE media SET path = ? WHERE id = ?", mediaLeftPathHolder, mediaRight.id);

            mediaLeft.path = mediaRightPathHolder;
            mediaRight.path = mediaLeftPathHolder;

            return true;
        } catch (ex) {
            return false;
        }
    }

    swapFilenames(mediaLeft, mediaRight) {
        try {
            const mediaLeftPathHolder = mediaLeft.path.replace(mediaLeft.fileName, mediaRight.fileName);
            const mediaRightPathHolder = mediaRight.path.replace(mediaRight.fileName, mediaLeft.fileName);

            db.execute("UPDATE media SET fileName = ?, extension = ?, path = ? WHERE id = ?", 
                mediaLeft.fileName, mediaLeft.extension,  mediaRightPathHolder, mediaRight.id);
            db.execute("UPDATE media SET fileName = ?, extension = ?, path = ? WHERE id = ?", 
                mediaRight.fileName, mediaRight.extension, mediaLeftPathHolder, mediaLeft.id);

            mediaLeft.path = mediaLeftPathHolder;
            mediaRight.path = mediaRightPathHolder;

            const filenameHolder = mediaLeft.fileName;
            mediaLeft.fileName = mediaRight.fileName;
            mediaRight.fileName = filenameHolder;

            const extensionHolder = mediaLeft.extension;
            mediaLeft.extension = mediaRight.extension;
            mediaRight.extension = extensionHolder;

            return true;
        } catch (ex) {
            return false;
        }
    }

    addDuplicatesToWhitelist(ids) {
        try {
            let values = "";
            let separator = "";
            for (let i = 0; i < ids.length; i++) {
                values += separator + `${ids[i]}`;
                separator = ","
            }

            db.execute(`UPDATE comparison SET whitelisted = 1 WHERE a IN (${values}) OR b IN (${values})`);

            return true;
        } catch (ex) {
            return false;
        }
    }

    deleteFiles(paths) {
        try {
            let values = "";
            let separator = "";
            for (let i = 0; i < paths.length; i++) {
                values += separator + paths[i];
                separator = ","
            }

            // Get ids for delete the medias and comparisons
            const ids = db.query(`SELECT id FROM media WHERE path IN (${values})`);

            values = "";
            separator = "";
            for (let i = 0; i < ids.length; i++) {
                values += separator + `${ids[i]}`;
                separator = ","
            }

            db.execute(`DELETE FROM media WHERE id IN (${values})`);
            db.execute(`DELETE FROM metadata WHERE idMedia IN (${values})`);
            db.execute(`DELETE FROM comparison WHERE idMedia IN (${values})`);
            db.execute(`DELETE FROM image WHERE idMedia IN (${values})`);

            return true;
        } catch (ex) {
            return false;
        }
    }

    close() {
        db.close();
    }
}