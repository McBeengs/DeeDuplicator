const fs = require('fs');
const levenshtein = require('js-levenshtein');
const hammingDistance = require('hamming');
const stringSimilarity = require('string-similarity');

const ImagesOperations = require("../db/images.operations");
const db = new ImagesOperations();

function getFileAsBuffer(path) {
    return new Promise((resolve) => {
        let chunks = [];
        let fileBuffer;

        let fileStream = fs.createReadStream(path);

        fileStream.once('error', (err) => {
            // Be sure to handle this properly!
            console.error(err);
        });

        fileStream.once('end', () => {
            // create the final data Buffer from data chunks;
            fileBuffer = Buffer.concat(chunks);

            resolve(fileBuffer);
        });

        fileStream.on('data', (chunk) => {
            chunks.push(chunk); // push data chunk to array
        });
    })
}

module.exports = class ImagesService {
    getMedia(idMedia) {
        return null;
    }

    getMedias(idMedias) {
        return null;
    }

    processMedia(media) {
        return new Promise((resolve, reject) => {
            db.insertImage({ idMedia: media.id, lowResHash: pixels, pHash: data }).then(idInserted => {
                resolve(true);
            });
        });
    }

    getVectors(medias) {
        return db.getVectors(medias);
    }

    getRelativeDistance(mediaA, mediaB) {
        // const binaryLowResHashA = Number(mediaA.lowResHash); // (mediaA.lowResHash >>> 0).toString(2);
        // const binaryLowResHashB = Number(mediaB.lowResHash); // (mediaB.lowResHash >>> 0).toString(2);
        // return Math.abs((binaryLowResHashA - binaryLowResHashB) / ( (binaryLowResHashA + binaryLowResHashB) / 2 ));
    }

    compareMedia(mediaA, mediaB, comparator) {
        return 0.0;
    }
}
