const path = require('path')
const fs = require('fs')
const workerpool = require('workerpool');
// const _ = require('lodash');

const MediaOperations = require("../db/media.operations");
const db = new MediaOperations();

// TODO: should this be configurable?
const mediaTable = [
    {
        extensions: ["jpg", "jpeg", "png", "gif", "bmp", "svg"],
        service: "images.service"
    },
    {
        extensions: ["mp4", "m4v", "avi", "wmv", "3gp", "webm", "mpg", "mpeg", "mov", "flv", "mkv", "divx"],
        service: "videos.service"
    },
    {
        extensions: ["mp3", "ogg", "wma", "raw", "flac"],
        service: "audios.service"
    },
    {
        extensions: ["zip", "rar"],
        service: "compressed.service"
    }
]
let service;

/////////////////////////////////////////////////////////////////////////////////////////////////////////

// Start of worker
const directoriesToSearch = process.argv[2].split(",");
const directoriesToIgnore = process.argv[3].split(",");
const extensions = process.argv[4];

const comparator = "bruteforce";
const differenceAlgorithm = "hamming";
const threshold = 0.90;
const serviceOptions = {
    generateGifs: false
};
const skipWhenNoNewFiles = true;

const processFilesPool = workerpool.pool(path.resolve(__dirname, "./processFile.worker.js"), {
    minWorkers: 10,
    maxWorkers: 24
});

let comparatorPool;
let serviceObjectName = undefined;
let idsMediasProcessed = [];

function entryPoint() {
    try {
        db.clearTempFilesTable();

        let extensionsArray = extensions.split(",");

        // Get the appropiate service for the file type. In theory, a array will only have one type of file at any time
        for (let i = 0; i < mediaTable.length; i++) {
            const type = mediaTable[i];
            let serviceFound = false;

            for (let j = 0; j < extensionsArray.length; j++) {
                if (type.extensions.includes(extensionsArray[j])) { // At least for now all files in slice are the same type
                    serviceObjectName = type.service;
                    serviceFound = true;
                    break;
                }   
            }

            if (serviceFound) break;
        }

        if (!serviceObjectName) {
            console.error("No service was found for the extensions informed. Using generic comparator.");
            serviceObjectName = "generic.service";
            // process.send({
            //     event: "processFinished", data: []
            // });
            // return;
        }

        for (let i = 0; i < directoriesToSearch.length; i++) {
            console.log(directoriesToSearch[i])
            getAllFilesRecursively(directoriesToSearch[i], extensions);
        }

        idsMediasProcessed = db.getIdsMediasAlreadyProcessed();

        if (db.removeProcessedFiles()) {
            const tempFilesSize = db.getTempFilesTableSize();

            // If no new file was founded, we can assume that everything has already been compared
            if (tempFilesSize <= 0 && skipWhenNoNewFiles) {
                console.log("No new files were founded on the path informed and its subdirectories. Skipping comparison.");
                let allDupes = db.getDuplicateMedias(differenceAlgorithm, threshold, []);
                let extensions = mediaTable.filter(m => m.service === serviceObjectName)[0].extensions;
                console.log(allDupes.length)
                allDupes = allDupes.filter(dupe => {
                    return extensions.includes(dupe[0].extension);
                });
                console.log(allDupes.length)
                db.insertAllDuplicatesFound(allDupes);
                process.send({
                    event: "processFinished", data: allDupes
                });
                return;
            }

            process.send({ event: "filesFounded", data: tempFilesSize });
            processFilesChunk();
        }
    } catch (ex) {
        console.error(ex);
        process.send({ event: "onException", data: { message: "Error while iterating", exception: ex } });
    }
}

entryPoint();
/////////////////////////////////////////////////////////////////////////////////////////////////////////

let mediaToCompare = [];
let pendingTasks = 0;
let pendingTasksCount = 0;

function processFilesChunk() {
    const chunk = db.getChunkTempFiles();

    for (let index = 0; index < chunk.length; index++) {
        const file = chunk[index].path;

        processFilesPool.exec('processFile', [file, serviceObjectName, serviceOptions])
            .catch(err => {
                console.error(err);
                process.send({ event: "onException", data: err });
                process.send({ event: "onFileProcessed", data: 0 });
            })
            .then((result, error) => {
                try {
                    if (result) {
                        process.send({ event: "onFileProcessed", data: result.id });
                        idsMediasProcessed.push(result.id);
                    } else {
                        process.send({ event: "onFileProcessed", data: 0 });
                    }
                } catch (ex) {
                    process.send({ event: "onFileProcessed", data: 0 });
                }
            });
    }

    // The worker must be terminated in order to continue the process, but it doesn't have a native
    // way to gracefully terminate when all pending tasks are complete. So we have to monitor
    const workerChecker = setInterval(() => {

        if (pendingTasks === processFilesPool.stats().pendingTasks) {
            pendingTasksCount++;
        } else {
            pendingTasks = processFilesPool.stats().pendingTasks;
            pendingTasksCount = 0;
        }

        if (processFilesPool.stats().pendingTasks <= 0 || (pendingTasksCount > 15 && serviceObjectName === "videos.service")) {
            if (pendingTasksCount > 15) {
                console.log("Workerpool forcefully terminated due to inactivity");
            }

            processFilesPool.terminate((pendingTasksCount > 15 && serviceObjectName === "videos.service")).then(() => {
                pendingTasksCount = 0;
                pendingTasks = 0;
                clearInterval(workerChecker);

                if (db.getTempFilesTableSize() > 0) {
                    processFilesChunk();
                } else {
                    // await a little longer for all files to be processed
                    setTimeout(() => {
                        db.clearTempFilesTable();
                        console.log("Workerpool finished. Starting compare algorithm.");
                        compareAlgorithm(comparator);
                    }, 5000);
                }
            });
        }
    }, 1000);
}

function compareAlgorithm(comparator) {
    let ServiceObject = require(`../services/${serviceObjectName}`);
    service = new ServiceObject();
    
    switch (comparator) {
        default:
        case "lsh":
            lshAlgorithm();
            break;
        case "bruteforce":
            bruteforceAlgorithm();
            break;
    }
}

let comparedIds = [];

/////////////////////////// Bruteforce algorithm ///////////////////////////////

function bruteforceAlgorithm() {
    comparatorPool = workerpool.pool(path.resolve(__dirname, `./comparators/bruteforce.comparator.js`), {
        minWorkers: 1,
        maxWorkers: 10
    });

    // mediaToCompare = db.getNonComparedMedias(idsMediasProcessed);
    mediaToCompare = [];
    mediaToCompare.push(... idsMediasProcessed);
    process.send({ event: "filesToCompare", data: mediaToCompare.length });

    processBruteforceAlgorithmChunk();
}

function processBruteforceAlgorithmChunk() {
    // Only compare those who haven't being compared already
    // TODO: deal with the multiple compare hash algorithms, since now it's only checking if the comparison is there
    let tempArray = mediaToCompare.splice(0, 1000);

    while (tempArray.length) {
        // const idFileBeingCompared = tempArray.pop().id;
        const idFileBeingCompared = tempArray.pop();

        comparatorPool.exec('compare', [idFileBeingCompared, comparedIds, differenceAlgorithm, threshold, serviceObjectName])
            .catch(err => {
                console.error(err);
                process.send({ event: "onException", data: err });
            })
            .then((dupesFound) => {
                process.send({ event: "onFileCompared", data: idFileBeingCompared });
                db.insertMediasCompared(dupesFound)
            });

        comparedIds.push(idFileBeingCompared);
    }

    const workerChecker = setInterval(() => {
        if (comparatorPool.stats().pendingTasks <= 0) {
            clearInterval(workerChecker);
            
            comparatorPool.terminate(false).then(() => {
                db.consolidateComparisons();

                if (mediaToCompare.length > 0) {
                    processBruteforceAlgorithmChunk();
                } else {
                    // await a little longer for all duplicates to be pushed
                    setTimeout(() => {
                        db.consolidateComparisons();
                        console.log("Workerpool finished. Compare algorithm done.");
                        const allDupes = db.getDuplicateMedias(differenceAlgorithm, threshold, idsMediasProcessed);
                        db.insertAllDuplicatesFound(allDupes);
                        process.send({
                            event: "processFinished", data: null
                        });
                    }, 5000);
                }
            });
        }
    }, 1000);
}

///////////////////////// End Bruteforce algorithm /////////////////////////////

/////////////////////////////// LSH algorithm //////////////////////////////////

let buckets = [];

function lshAlgorithm() {
    comparatorPool = workerpool.pool(path.resolve(__dirname, `./comparators/lsh.comparator.js`), {
        minWorkers: 10,
        maxWorkers: 24
    });

    const prepare = require("./comparators/lsh/PrepareLSHDataset");
    buckets = prepare.getBuckets(idsMediasProcessed, service);
    // buckets = [ buckets[0] ];

    let totalSize = 0;

    for (let i = 0; i < buckets.length; i++) {
        totalSize += buckets[i].length;
    }

    process.send({ event: "filesToCompare", data: totalSize });

    processLshAlgorithmChunk();
}

function processLshAlgorithmChunk() {
    const bucket = buckets.pop();
    let bucketMedias = service.getMedias(bucket);

    // let comparedBucketMedias = [];
    let combinations = combineWithoutRepetitions(bucketMedias, 2);
    let numBucketMedias = bucketMedias.length;
    bucketMedias = []; // free memory

    console.log(`${combinations.length} before filtering`);
    // filter the combinations so that only relevant similar pairs are fed to the workers. By similar it's assumed a relative distance of < 0.3 of each file type
    // equivalent of the implementation of "getRelativeDistance"
    combinations = combinations.filter(c => {
        return service.getRelativeDistance(c[0], c[1]) <= 0.15;
    });
    console.log(`Starting new bucket: ${numBucketMedias} total medias in this bucket | ${buckets.length} buckets remaining | ${combinations.length} total combinations to process`);

    while (combinations.length) {
        const combinationChunk = combinations.splice(0, 10000);

        comparatorPool.exec('compare', [combinationChunk, differenceAlgorithm, threshold, serviceObjectName])
            .catch(err => {
                console.error(err);
                process.send({ event: "onException", data: err });
            })
            .then((dupesFound) => {
                db.insertMediasCompared(dupesFound);

                for (let i = 0; i < combinationChunk.length; i++) {
                    let combination = combinationChunk[i];
                    if (comparedIds.includes(combination[0].id) <= 0) {
                        comparedIds.push(combination[0].id);
                        process.send({ event: "onFileCompared", data: combination[0].id });
                    }

                    if (comparedIds.includes(combination[1].id) <= 0) {
                        comparedIds.push(combination[1].id);
                        process.send({ event: "onFileCompared", data: combination[1].id });
                    }
                }
            });
    }

    const workerChecker = setInterval(() => {
        // console.log(`comparatorPool.stats.pendingTasks: ${comparatorPool.stats().pendingTasks} | buckets.length: ${buckets.length}`);
        if (comparatorPool.stats().pendingTasks <= 0) {
            clearInterval(workerChecker);
            // If the LSH algorithm terminates way too fast (prob. few files / buckets), we can prematurely terminate the workerpool,
            // generating an exception
            setTimeout(() => {
                comparatorPool.terminate(false).then(() => {
                    db.consolidateComparisons();
    
                    if (buckets.length > 0) {
                        processLshAlgorithmChunk();
                    } else {
                        // await a little longer for all duplicates to be pushed
                        setTimeout(() => {
                            // Just in case some medias get inserted on last executing insert on tempComparison
                            db.consolidateComparisons();
                            console.log("Workerpool finished. Compare algorithm done.");
                            const allDupes = db.getDuplicateMedias(differenceAlgorithm, threshold, idsMediasProcessed);
                            db.insertAllDuplicatesFound(allDupes);
                            process.send({
                                event: "processFinished", data: null
                            });
                        }, 5000);
                    }
                });
            }, 1000);
        }
    }, 500);
}
///////////////////////////// End LSH algorithm ////////////////////////////////

function getAllFilesRecursively(base, ext = ['*'], files) {
    try {
        if (directoriesToIgnore.indexOf(base) > 0) {
            return;
        }

        try {
            files = files || fs.readdirSync(base);
        } catch (ex) { }

        for (let index = 0; index < files.length; index++) {
            const file = files[index];

            var newbase = path.join(base, file)
            let isDirectory = false;

            try {
                isDirectory = fs.statSync(newbase).isDirectory();
            } catch (ex) { }

            if (isDirectory) {
                getAllFilesRecursively(newbase, ext, fs.readdirSync(newbase))
            }
            else {
                try {
                    const extension = file.substr(file.lastIndexOf(".") + 1);

                    if (ext.includes(extension)) {
                        db.insertTempFile(newbase);

                        process.send({
                            event: "fileFounded",
                            data: newbase
                        })
                    }
                } catch (ex) { }
            }
        }

        return true;
    } catch (ex) {
        process.send({ event: "onException", data: { message: "Error while getting all files recursively", exception: ex } });
        return false;
    }
}

function combineWithoutRepetitions(comboOptions, comboLength) {
    // If the length of the combination is 1 then each element of the original array
    // is a combination itself.
    if (comboLength === 1) {
        return comboOptions.map(comboOption => [comboOption]);
    }
  
    // Init combinations array.
    const combos = [];
  
    // Extract characters one by one and concatenate them to combinations of smaller lengths.
    // We need to extract them because we don't want to have repetitions after concatenation.
    if (comboOptions) {
        comboOptions.forEach((currentOption, optionIndex) => {
            // Generate combinations of smaller size.
            const smallerCombos = combineWithoutRepetitions(
                comboOptions.slice(optionIndex + 1),
                comboLength - 1,
            );
    
            // Concatenate currentOption with all combinations of smaller size.
            smallerCombos.forEach((smallerCombo) => {
                combos.push([currentOption].concat(smallerCombo));
            });
        });
    }
  
    return combos;
}