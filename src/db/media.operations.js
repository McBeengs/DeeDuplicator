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

    getMediasByIds(idsMedias) {
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

        const result = db.query(`SELECT * FROM media WHERE id IN (${values})`);
        return result;
    }

    getMediasByTempFiles(pathsMedias) {
        let query = `SELECT * FROM media WHERE path IN (SELECT path FROM tempFiles)`;

        const result = db.query(query);

        if (!result.length || result.length <= 0) {
            return [];
        } else {
            return result
        }
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

    insertMediaException(path) {
        db.execute(`
        INSERT INTO mediaException (path)
        SELECT ? WHERE NOT EXISTS (SELECT 1 FROM mediaException WHERE path = ?);
        `, path, path);
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

    getIdsMediasAlreadyProcessed() {
        try {
            const result = db.query("SELECT id FROM media WHERE path IN (SELECT path FROM tempFiles)");
            if (!result.length || result.length <= 0) {
                return [];
            } else {
                let ids = [];

                for (let i = 0; i < result.length; i++) {
                    ids.push(result[i].id);
                }

                return ids;
            }
        } catch (ex) {
            return [];
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

    getNonComparedMedias(idsToConsider) {
        let values = "";
        let separator = "";

        // const idsMedias = db.query(`
        // SELECT DISTINCT a FROM (
        //     SELECT DISTINCT a FROM comparison
        //     UNION ALL
        //     SELECT DISTINCT b FROM comparison
        // )
        // `);

        if (idsToConsider.length <= 0) {
            values = "";
        } else {
            for (let i = 0; i < idsToConsider.length; i++) {
                values += separator + `(${idsToConsider[i]})`;
                separator = ","
            }

            values = "VALUES " + values;
        }

        let query = `SELECT id FROM media WHERE id IN (${values})`;

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
            if (!comparisons || comparisons.length <= 0) {
                return true;
            }

            // Remove possible duplicates on comparisons
            const uniqueComparisons = comparisons.filter((value, index, self) => { return self.indexOf(value) === index; });

            let stringsToInsert = "";
            
            for (let i = 0; i < uniqueComparisons.length; i++) {
                const comparison = uniqueComparisons[i];
                
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
                    default:
                        stringsToInsert += `'${comparison.percentage}', '${comparison.percentage}', '${comparison.percentage}')`
                        break;
                }
            }

            // db.executeMultiple(`
            // CREATE TEMPORARY TABLE IF NOT EXISTS tempComparison (
            //     a INTEGER NOT NULL,
            //     b INTEGER NOT NULL,
            //     leven NUMERIC NULL,
            //     hamming NUMERIC NULL,
            //     dice NUMERIC NULL,
            //     whitelisted INTEGER NULL
            // );
            
            // INSERT INTO tempComparison (a, b, leven, hamming, dice) VALUES ${stringsToInsert};
            
            // INSERT INTO comparison (a, b, leven, hamming, dice)
            // SELECT DISTINCT t.a, t.b, t.leven, t.hamming, t.dice FROM tempComparison t
            // LEFT JOIN comparison c ON c.a = t.a AND c.b = t.b
            // WHERE c.a IS NULL;
            // `);

            db.execute("INSERT INTO tempComparison (a, b, leven, hamming, dice) VALUES " + stringsToInsert);
            
            return true;
        } catch (ex) {
            console.error(ex);
            return false;
        }
    }

    consolidateComparisons() {
        try {
            db.executeMultiple(`
                INSERT INTO comparison (a, b, leven, hamming, dice)
                SELECT DISTINCT t.a, t.b, t.leven, t.hamming, t.dice FROM tempComparison t
                LEFT JOIN comparison c ON c.a = t.a AND c.b = t.b
                WHERE c.a IS NULL;

                DELETE FROM tempComparison
            `);
        } catch (ex) {
            console.error(ex);
        }
    }

    getDuplicateMedias(algorithm, threshold, idsToConsider) {
        try {
            let values = "";
            let separator = "";

            // const idsMedias = db.query(`
            // SELECT DISTINCT a FROM (
            //     SELECT DISTINCT a FROM comparison
            //     UNION ALL
            //     SELECT DISTINCT b FROM comparison
            // )
            // `);

            if (!idsToConsider || idsToConsider.length <= 0) {
                values = "";
            } else {
                for (let i = 0; i < idsToConsider.length; i++) {
                    values += separator + `${idsToConsider[i]}`;
                    separator = ","
                }
            }

            let query = "";
            if (values) {
                query = `SELECT a, b FROM comparison WHERE ${algorithm} >= ? AND whitelisted IS null AND a IN (${values}) AND b IN (${values}) ORDER BY a ASC`;
            } else {
                query = `SELECT a, b FROM comparison WHERE ${algorithm} >= ? AND whitelisted IS null ORDER BY a ASC`;
            }
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

                        if (group.filter(m => { return m.id === media.id }).length <= 0) {
                            group.push(media);
                        }
                    }

                    if (group.length > 1) {
                        // Sometimes due to similar comparisons that have a slightly diff. being added to groups, things can snowball out of control
                        // where a group can have 100+ medias that doesn't are equal at all just because a file was similar enough to another, that was
                        // similar to another, and another... and so on. This failsafe gets unusual large groups and check them again just to be sure
                        if (group.length > 10) {
                            try {
                                let ServiceObject = require(`../services/${serviceObjectName}`);
                                const service = new ServiceObject();
                                
                                let newGroup = [];

                                for (let x = 0; x < group.length; x++) {
                                    const elementX = array[x];
                                    
                                    for (let y = 0; y < group.length; y++) {
                                        const elementY = group[y];
                                        
                                        if (elementX.id === elementY.id) {
                                            continue;
                                        }

                                        let distance = service.compareMedia(service.getMedia(elementX.id), service.getMedia(elementY.id), "hamming");
                                        if (distance >= 0.75) {
                                            newGroup.push(elementY);
                                        }
                                    }
                                }

                                console.log(`Group too big has broken from ${group.length} to ${newGroup.length}`);
                                mediaGroups.push(newGroup);
                            } catch (ex) {}
                        } else {
                            mediaGroups.push(group);
                        }
                    }
                }



                return mediaGroups;
            }
        } catch (ex) {
            return [];
        }
    }

    insertAllDuplicatesFound(allDupes) {
        try {
            let values = "";
            let separator = "";

            db.execute("DELETE FROM tempDuplicates");

            let group = 1;
            if (!allDupes || allDupes.length <= 0) {
                values = "";
            } else {
                for (let i = 0; i < allDupes.length; i++) {
                    for (let j = 0; j < allDupes[i].length; j++) {
                        let media = allDupes[i][j];
                        values += separator + `(${group}, ${media.id}, '${media.fileName.replace(/'/g, "''")}', 
                            '${media.extension}', '${media.createDate}', ${media.size}, '${media.path.replace(/'/g, "''")}')`;
                        separator = ","
                    }
                    group++;
                }
            }

            if (!values) {
                return true;
            }

            let query = `INSERT INTO tempDuplicates ('group', 'id', 'fileName', 'extension', 'createDate', 'size', 'path') VALUES ${values}`;
            db.execute(query);

            return true;
        } catch (ex) {
            console.error(ex);
            return false;
        }
    }

    close() {
        db.close();
    }
}