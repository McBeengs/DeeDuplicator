import SQLiteService from './sqlite.service'
let db = {};

export default class RendererOperations {

    constructor() {
        db = new SQLiteService();
    }

    getDuplicates() {
        try {
            let query = db.query("SELECT * FROM tempDuplicates");

            if (!query || query.length <= 0) {
                return [];
            }

            let dictionary = [];

            while (query.length) {
                let line = query.pop();

                if (dictionary[line.group]) {
                    dictionary[line.group].push(line);
                } else {
                    const groupId = line.group;
                    let array = [];
                    array.push(line);
                    dictionary[groupId] = array;
                }
            }

            let result = [];

            while (dictionary.length) {
                let item = dictionary.pop();
                if (item) {
                    result.push(item)
                }
            }

            return result.reverse();
        } catch (ex) {
            return [];
        }
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
                values += separator + `${ids[i].id}`;
                separator = ","
            }

            console.log(values)

            db.execute(`DELETE FROM comparison WHERE a IN (${values})`);
            db.execute(`DELETE FROM comparison WHERE b IN (${values})`);
            db.execute(`DELETE FROM image WHERE idMedia IN (${values})`);
            db.execute(`DELETE FROM video WHERE idMedia IN (${values})`);
            db.execute(`DELETE FROM media WHERE id IN (${values})`);

            return true;
        } catch (ex) {
            return false;
        }
    }

    close() {
        db.close();
    }
}