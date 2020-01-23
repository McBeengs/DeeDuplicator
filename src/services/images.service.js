const fs = require('fs');
const imghash = require('imghash');
const Jimp = require("jimp");
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

// TODO: implement SSIM
const Hashes = {
    calcImage_pHash: function (media, bitDepth = 128) {
        return new Promise((resolve, reject) => {

            // imghash already gets a buffer inside anyway, and doing this helps with catching
            // exceptions that for some reason doesn't get caught on the try/catch
            getFileAsBuffer(media.path).then((buffer) => {
                try {
                    // imghash is the prefered option but only works on png and jp(e)g.
                    // Other packages also wrap the same dependencies, so they are all the same.
                    // We need to convert other types to png. RIP CPU
                    if (media.extension === "png" || media.extension === "jpg" || media.extension === "jpeg") {
                        imghash.hash(buffer, bitDepth).then((hash) => {
                            resolve(hash);
                        }).catch((error) => {
                            // It's possible an error happened inside jpeg-turbo dependency of imghash, or
                            // the file is reporting an mime when it's another
                            console.error(`File [${media.path}] failed at the normal hashing routine. Trying one more time, this time with Jimp conversion.`)

                            this.calcBuffer_pHash(media, buffer).then(hash => resolve(hash)).catch((err) => {
                                console.error("Error while converting file to accepted format to pHash");
                                reject(err);
                            });
                        })
                    } else {
                        this.calcBuffer_pHash(media, buffer).then(hash => resolve(hash)).catch((err) => {
                            console.error(`Error while converting file [${media.path}] to accepted format to pHash. Jimp was used but failed. The file will have to be ignored.`);
                            reject(err);
                        })
                    }
                } catch (ex) {
                    // It's possible an error happened inside jpeg-turbo dependency of imghash, or
                    // the file is reporting an mime when it's another
                    console.error(`File [${media.path}] failed at the normal hashing routine. Trying one more time, this time with Jimp conversion.`)

                    this.calcBuffer_pHash(media, buffer).then(hash => resolve(hash)).catch((err) => {
                        console.error("Error while converting file to accepted format to pHash");
                        reject(err);
                    });
                }
            });
        })
    },

    calcBuffer_pHash: function (media, buffer, bitDepth = 128) {
        return new Promise((resolve, reject) => {
            Jimp.read(buffer).then((image) => {
                image.getBuffer(Jimp.MIME_PNG, (error, jiffBuffer) => {
                    if (error) {
                        reject(error);
                        return;
                    }
                    console.log(`File [${media.filename}] was in an unsupported format. Used Jimp to convert from ${media.extension.toUpperCase()} to PNG`);

                    imghash.hash(jiffBuffer, bitDepth).then((hash) => {
                        resolve(hash);
                    });
                });
            }).catch(err => {
                console.error(`Error while converting file [${media.path}] to accepted format to pHash. Jimp was used but failed. The file will have to be ignored.`);
                reject(err);
            });
        });
    }
}

module.exports = class ImagesService {
    processMedia(media) {
        return new Promise((resolve) => {
            // Check if image was already captured last time
            // db.checkIfImageExists(media.id).then(result => {
            //     if (result.id > 0) {
            //         resolve(true);
            //         return;
            //     }
            // });

            Hashes.calcImage_pHash(media).then((data, error) => {
                if (error) {
                    reject(error);
                    return;
                }

                db.insertImage({ idMedia: media.id, pHash: data }).then(idInserted => {
                    resolve(true);
                });
            }).catch((rejectReason) => {
                // Tried co hash the image but failed, even on the failsafes
                resolve(false);
            });
        });
    }

    compareMedia(idMediaA, idMediaB, comparator) {
        const pHashImageA = db.getImagePHash(idMediaA);
        const pHashImageB = db.getImagePHash(idMediaB);

        let distance = 0;
        let bigger = 0;

        switch (comparator) {
            default:
            case "leven": // Levenshtein distance
                distance = levenshtein(pHashImageA, pHashImageB);
                bigger = Math.max(pHashImageA.length, pHashImageB.length)
                distance = (bigger - distance) / bigger // We need to divide by 100 ?
                break;

            case "hamming": // Hamming distance
                distance = hammingDistance(pHashImageA, pHashImageB);
                bigger = Math.max(pHashImageA.length, pHashImageB.length)
                distance = (bigger - distance) / bigger // We need to divide by 100 ?
                break;

            case "dice": // Dice's Coefficient
                distance = stringSimilarity.compareTwoStrings(pHashImageA, pHashImageB);
                break;
        }

        // Example from imghash npm demo
        return distance.toFixed(2);
    }
}
