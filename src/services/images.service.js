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
    getMedia(idMedia) {
        return db.getImage(idMedia);
    }

    getMedias(idMedias) {
        return db.getImages(idMedias);
    }

    processMedia(media) {
        return new Promise((resolve, reject) => {
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

                Jimp.read(media.path).then((image) => {
                    try {
                        const size = 28;
                        image
                            .resize(size, size)
                            .grayscale().contrast(1); // make pure black and white pixels, no gray
                        

                        let pixels = '';
                        for (let y = 0; y < size; y++) {
                            for (let x = 0; x < size; x++) {
                                pixels += image.getPixelColor(x, y) === 255 ? '1' : '0'
                            }
                        }
                        const bigInteger = parseInt(pixels, 2);

                        // image.writeAsync(media.path.substring(0, media.path.lastIndexOf("\\")) + `\\test-${Math.random() * 1000 }.jpg`).then(() => {
                        //     db.insertImage({ idMedia: media.id, lowResHash: bigInteger, pHash: data }).then(idInserted => {
                        //         resolve(true);
                        //     });
                        // });

                        db.insertImage({ idMedia: media.id, lowResHash: bigInteger, pHash: data }).then(idInserted => {
                            resolve(true);
                        });
                    } catch (err) {
                        console.error(`Error while getting low res hash of file [${media.path}]. Jimp was used but failed. The file will have to be ignored.`);
                        reject(err);
                    }
                });
            }).catch((rejectReason) => {
                // Tried co hash the image but failed, even on the failsafes
                resolve(false);
            });
        });
    }

    getVectors(medias) {
        return db.getVectors(medias);
    }

    compareMedia(mediaA, mediaB, comparator) {
        const binaryLowResHashA = Number(mediaA.lowResHash); // (mediaA.lowResHash >>> 0).toString(2);
        const binaryLowResHashB = Number(mediaB.lowResHash); // (mediaB.lowResHash >>> 0).toString(2);

        // Two lineart with faint lines and no color could be mistaken as "empty" since the lowResHash might be zero. But very dark images can be the opposite as in
        // everything would be black. As such, everything 0 or 5.087291284850963e+235 must be compared
        if (!(binaryLowResHashA <= 0 && binaryLowResHashB <= 0) || !(binaryLowResHashA == 5.087291284850963e+235 && binaryLowResHashB == 5.087291284850963e+235)) {
            // Get the difference between the two hashes. If above 120% then it most likely isn't a duplicate, so let it be ignored.
            let percDiff = Math.abs( (binaryLowResHashA - binaryLowResHashB) / ( (binaryLowResHashA + binaryLowResHashB) / 2 ) );
            
            // if (percDiff.toFixed(2) < 0.5) {
            //     // console.log("Ignored with lowResHash diferrence of just " + percDiff.toFixed(2))
            //     return percDiff.toFixed(2);
            // }
    
            if (percDiff.toFixed(2) > 1.2) {
                // console.log("Ignored with lowResHash diferrence too big to be relevant " + percDiff.toFixed(2))
                return 0.0;
            }
        }

        const pHashImageA = mediaA.pHash;
        const pHashImageB = mediaB.pHash;

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
