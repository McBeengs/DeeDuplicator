const MediaOperations = require("../../../db/media.operations");
const db = new MediaOperations();

const PrepareLSHDataset = {
    getBuckets() {
        try {
            let mediaToCompare = db.getNonComparedMedias();
            let comparedIds = db.getAllAlreadyComparedIds();

            const LSHMinHash = require("./LSHMinHash");

            // Get the appropiate service for the file type
            // TODO: fix this later
            let ServiceObject = require(`../../../services/images.service`);
            // for (let i = 0; i < mediaTable.length; i++) {
            //     const type = mediaTable[i];
            //     if (type.extensions.includes(fileBeingCompared.extension)) { // At least for now all files in slice are the same type
            //         ServiceObject = require(`../../services/${type.service}`);
            //         break;
            //     }
            // }

            const service = new ServiceObject();

            let totalSize = (mediaToCompare.length + comparedIds.length);
            let stages = 2;
            let size = totalSize;
            let buckets = totalSize / 500;

            if (buckets <= 0) { // less than 500 medias
                buckets = totalSize / 100;

                if (buckets <= 0) { // less than 100 medias
                    buckets = totalSize / 10;

                    if (buckets <= 0) { // less than 10 medias
                        buckets = 2;
                    }
                }
            }
            
            const lsh = new LSHMinHash(stages, buckets, size);

            let dictionary = [];

            for (let i = 0; i < mediaToCompare.length; i++) {
                const vector = service.getVector(mediaToCompare[i].id);
                let hash = lsh.hash(vector);
                
                if (dictionary[hash[1]]) {
                    dictionary[hash[1]].push(mediaToCompare[i].id);
                } else {
                    let array = [];
                    array.push(mediaToCompare[i].id);
                    dictionary[hash[1]] = array;
                }
            }

            return dictionary;
        } catch (ex) {
            console.error(ex);
            return [];
        }
    }
}

module.exports = PrepareLSHDataset;