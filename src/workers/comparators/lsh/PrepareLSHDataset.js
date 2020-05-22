const MediaOperations = require("../../../db/media.operations");
const db = new MediaOperations();

const PrepareLSHDataset = {
    getBuckets(idsMediasProcessed, service) {
        try {
            let mediaToCompare = db.getNonComparedMedias(idsMediasProcessed);

            const LSHMinHash = require("./LSHMinHash");

            let totalSize = mediaToCompare.length;

            // must have at the very least a few files for LSH to work
            if (totalSize < 10) {
                let ret = [];
                ret.push([]);
                return ret;
            }

            let stages = 2;
            let size = totalSize;
            let buckets = totalSize / 2000;

            if (buckets <= 0) { // less than 2000 medias
                buckets = totalSize / 1000;

                if (buckets <= 0) { // less than 1000 medias
                    buckets = totalSize / 500;

                    if (buckets <= 0) { // less than 500 medias
                        buckets = totalSize / 100;
        
                        if (buckets <= 0) { // less than 100 medias
                            buckets = totalSize / 10;
        
                            if (buckets <= 0) { // less than 10 medias
                                buckets = 2;
                            }
                        }
                    }
                }
            }

            if (buckets === 1) {
                buckets = 5;
            }

            const lsh = new LSHMinHash(stages, buckets, size);
            const ids = [];

            for (let i = 0; i < mediaToCompare.length; i++) {
                ids.push(mediaToCompare[i].id);
            }

            const vectors = service.getVectors(ids);

            // Empty the datasets to release memory
            mediaToCompare = [];
            comparedIds = [];
            let dictionary = [];

            while (vectors.length) {
                const vector = vectors.pop();
                let hash = lsh.hash([vector.xAxis, vector.yAxis]);
                
                if (dictionary[hash[1]]) {
                    dictionary[hash[1]].push(vector.id);
                } else {
                    let array = [];
                    array.push(vector.id);
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