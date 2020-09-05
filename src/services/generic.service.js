const fs = require('fs');
const md5File = require('md5-file');
const levenshtein = require('js-levenshtein');
const hammingDistance = require('hamming');
const stringSimilarity = require('string-similarity');

const GenericOperations = require("../db/generic.operations");
const db = new GenericOperations();

function getFileAsByteArray(path) {
    let fileDataBuffer = fs.readFileSync(path);
    let result = Uint8Array.from(fileDataBuffer);

    return result;
}

module.exports = class GenericService {
    getMedia(idMedia) {
        return db.getGenericFile(idMedia);
    }

    getMedias(idMedias) {
        return db.getGenericFiles(idMedias);
    }

    processMedia(media) {
        return new Promise((resolve, reject) => {
            let md5Hash = md5File.sync(media.path);

            let byteArray = getFileAsByteArray(media.path);
            let binaryHash = 0;

            if (byteArray.length < 256) {
                let sumOfBytes = 0;

                for (let byte in byteArray) {
                    sumOfBytes += byte;
                }

                binaryHash = sumOfBytes;
            } else {
                let sumOfBytes = 0;

                // 128 bytes from start of file
                for (let i = 0; i < 128; i++) {
                    sumOfBytes += byteArray[i];
                }

                // 128 bytes from end of file
                for (let i = byteArray.length - 128; i < byteArray.length; i++) {
                    sumOfBytes += byteArray[i];
                }

                binaryHash = sumOfBytes;
            }

            db.insertGenericFile({ idMedia: media.id, md5: md5Hash, binaryHash: binaryHash }).then(idInserted => {
                resolve(true);
            });
        });
    }

    getVectors(medias) {
        return db.getVectors(medias);
    }

    getRelativeDistance(mediaA, mediaB) {
        const binaryHashA = Number(mediaA.binaryHash); // (mediaA.lowResHash >>> 0).toString(2);
        const binaryHashB = Number(mediaB.binaryHash); // (mediaB.lowResHash >>> 0).toString(2);
        return Math.abs((binaryHashA - binaryHashB) / ( (binaryHashA + binaryHashB) / 2 ));
    }

    compareMedia(mediaA, mediaB, comparator) {
        if (mediaA.md5 === mediaB.md5) {
            return 1;
        }

        if (mediaA.extension === mediaB.extension && mediaA.size === mediaB.size) {
            return 1;
        }

        let distance = 0;
        let bigger = 0;

        switch (comparator) {
            default:
            case "leven": // Levenshtein distance
                distance = levenshtein(mediaA.filename, mediaB.filename);
                bigger = Math.max(mediaA.filename.length, mediaB.filename.length)
                distance = (bigger - distance) / bigger // We need to divide by 100 ?
                break;

            case "hamming": // Hamming distance
                distance = hammingDistance(mediaA.filename, mediaB.filename);
                bigger = Math.max(mediaA.filename.length, mediaB.filename.length)
                distance = (bigger - distance) / bigger // We need to divide by 100 ?
                break;

            case "dice": // Dice's Coefficient
                distance = stringSimilarity.compareTwoStrings(mediaA.filename, mediaB.filename);
                break;
        }

        // Example from imghash npm demo
        // console.log(`${percDiff} | ${distance.toFixed(2)}`);
        return distance.toFixed(2);
    }
}
