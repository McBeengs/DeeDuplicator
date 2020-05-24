const fs = require('fs');
const Path = require('path');

const generatePreview = require('ffmpeg-generate-video-preview')
const extractFrame = require('ffmpeg-extract-frame');
const ffprobe = require('ffprobe');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const imghash = require('imghash');
const Jimp = require("jimp");
//------------------------------------------------------------------
const levenshtein = require('js-levenshtein');
const hammingDistance = require('hamming');
const stringSimilarity = require('string-similarity');

const VideosOperations = require("../db/videos.operations");
const db = new VideosOperations();

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
            getFileAsBuffer(media).then((buffer) => {
                try {
                    imghash.hash(buffer, bitDepth).then((hash) => {
                        resolve(hash);
                    }).catch((error) => {
                        // It's possible an error happened inside jpeg-turbo dependency of imghash, or
                        // the file is reporting an mime when it's another
                        console.error(`File [${media}] failed at the normal hashing routine. Trying one more time, this time with Jimp conversion.`)

                        this.calcBuffer_pHash(media, buffer).then(hash => resolve(hash)).catch((err) => {
                            console.error("Error while converting file to accepted format to pHash");
                            reject(err);
                        });
                    })
                } catch (ex) {
                    // It's possible an error happened inside jpeg-turbo dependency of imghash, or
                    // the file is reporting an mime when it's another
                    console.error(`File [${media}] failed at the normal hashing routine. Trying one more time, this time with Jimp conversion.`)

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
                    
                    imghash.hash(jiffBuffer, bitDepth).then((hash) => {
                        resolve(hash);
                    });
                });
            }).catch(err => {
                console.error(`Error while converting file [${media}] to accepted format to pHash. Jimp was used but failed. The file will have to be ignored.`);
                reject(err);
            });
        });
    }
}

let directory = "";

module.exports = class ImagesService {

    constructor() {
        directory = process.env.NODE_ENV === 'development' ?
            Path.resolve(__dirname, "../../Thumbnails") : Path.resolve(__dirname, "../../Thumbnails");

        if (!fs.existsSync(directory)){
            fs.mkdirSync(directory);
        }

        directory = Path.join(directory, "videos");

        if (!fs.existsSync(directory)){
            fs.mkdirSync(directory);
        }
    }

    getMedia(idMedia) {
        return db.getVideo(idMedia);
    }

    getMedias(idMedias) {
        return db.getVideos(idMedias);
    }

    processMedia(media, serviceOptions) {
        return new Promise(async (resolve, reject) => {
            let outputPathGrid = Path.join(directory, Buffer.from(media.filename).toString('base64') + ".png");
            let outputPathGif = Path.join(directory, Buffer.from(media.filename).toString('base64') + ".gif");

            ////// This works, but it is hyper slow
            // const metadataGrid = await generatePreview({
            //     input: media.path,
            //     output: outputPathGrid,
            //     rows: 2,
            //     cols: 3,
            //     width: 640,
            //     height: 480,
            //     // quality: 20
            // });

            let metadata = undefined;

            try {
                let mediaMetadata = await ffprobe(media.path, { path: process.env.FFPROBE_PATH });
                
                let videoMetadata = mediaMetadata.streams.filter(m => m.codec_type === "video")[0];
                let audioMetadata = mediaMetadata.streams.filter(m => m.codec_type === "audio")[0];

                if (!videoMetadata) {
                    console.error(`No metadata could be extracted from [${media.path}]`);
                    resolve(false);
                    return;
                }

                metadata = {
                    width: videoMetadata.width,
                    height: videoMetadata.height,
                    duration: Math.floor(videoMetadata.duration * 1000),
                    bitrate: videoMetadata.bit_rate,
                    framerate: videoMetadata.avg_frame_rate,
                    codec: videoMetadata.codec_name,
                    audio: audioMetadata ? audioMetadata.codec_name : ""
                };
            } catch (ex) {
                // console.error(ex);
                resolve(false);
                return;
            }

            let offset = (metadata.duration / 1000) / 2;
            if (isNaN(offset)) {
                offset = 20;
            }

            if (metadata) {
                media.metadata = metadata;
            }

            if (serviceOptions.generateGif) {
                if (!fs.existsSync(outputPathGif)) {
                    fs.createWriteStream(outputPathGif);

                    await generatePreview({
                        input: media.path,
                        output: outputPathGif,
                        numFrames: 5,
                        gifski: {
                            fps: 40,
                            quality: 40,
                            fast: true
                        }
                    });
                }
            }

            if (!fs.existsSync(outputPathGrid)) {
                try {
                    const { stdout, stderr } = await exec(`cd bin && ffmpeg -ss ${offset} -i "${media.path}" -frames:v 1 "${outputPathGrid}"`,
                    { maxBuffer: 1024 * 1024 * 1024 });
                } catch (ex) {
                    // console.error(ex);
                    resolve(false);
                    return;
                }
            }

            // await extractFrame({
            //     input: media.path,
            //     output: outputPathGrid,
            //     offset: offset,
            //     width: 640,
            //     height: 480
            // });

            if (!fs.existsSync(outputPathGrid)) {
                resolve(false);
                return;
            }

            try {
                let data = await Hashes.calcImage_pHash(outputPathGrid);
                let image = await Jimp.read(outputPathGrid);

                const size = 64;
                image
                    .resize(size, size)
                    .grayscale().contrast(1); // make pure black and white pixels, no gray
                
                let pixels = 0;
                for (let y = 0; y < size; y++) {
                    for (let x = 0; x < size; x++) {
                        if (image.getPixelColor(x, y) === 255) {
                            pixels++;
                        }
                    }
                }

                media.idMedia = media.id;
                media.lowResHash = pixels;
                media.pHash = data;
                
                const idInserted = await db.insertVideo(media);
                resolve(true);
            } catch (err) {
                // console.log(err);
                console.error(`Error while getting low res hash of file [${outputPathGrid}]. Jimp was used but failed. The file will have to be ignored.`);
                reject(err);
            }
        })
    }

    getVectors(medias) {
        return db.getVectors(medias);
    }

    getRelativeDistance(mediaA, mediaB) {
        const binaryLowResHashA = Number(mediaA.lowResHash); // (mediaA.lowResHash >>> 0).toString(2);
        const binaryLowResHashB = Number(mediaB.lowResHash); // (mediaB.lowResHash >>> 0).toString(2);
        return Math.abs((binaryLowResHashA - binaryLowResHashB) / ( (binaryLowResHashA + binaryLowResHashB) / 2 ));
    }

    compareMedia(mediaA, mediaB, comparator) {
        let sizeOfComparison = 64;

        let firstCharsMediaA = mediaA.pHash.substring(0, sizeOfComparison);
        let firstCharsMediaB = mediaB.pHash.substring(0, sizeOfComparison);
        let difference = false;

        for (let i = 0; i < firstCharsMediaA.length; i++) {
            if (firstCharsMediaA[i] !== firstCharsMediaB[i]) {
                difference = true;
                break;
            }
        }

        if (difference) {
            return 0.0;
        }

        let lastCharsMediaA = mediaA.pHash.substring(mediaA.length / 2 - sizeOfComparison, sizeOfComparison);
        let lastCharsMediaB = mediaB.pHash.substring(mediaB.length / 2 - sizeOfComparison, sizeOfComparison);
        difference = false;

        for (let i = 0; i < lastCharsMediaA.length; i++) {
            if (lastCharsMediaA[i] !== lastCharsMediaB[i]) {
                difference = true;
                break;
            }
        }

        if (difference) {
            return 0.0;
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
        // console.log(`${percDiff} | ${distance.toFixed(2)}`);
        return distance.toFixed(2);
    }
}
