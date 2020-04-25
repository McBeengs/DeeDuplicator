const path = require('path')
const fs = require('fs')
const workerpool = require('workerpool');
// const _ = require('lodash');

const MediaOperations = require("../db/media.operations");
const db = new MediaOperations();

/////////////////////////////////////////////////////////////////////////////////////////////////////////

// Start of worker
const rootPath = process.argv[2];
const extensions = process.argv[3];

const comparator = "lsh";
const differenceAlgorithm = "hamming";
const threshold = 0.85;

const processFilesPool = workerpool.pool(path.resolve(__dirname, "./processFile.worker.js"), {
    minWorkers: 1,
    maxWorkers: 10
});

let comparatorPool;

function entryPoint() {
    try {
        db.clearTempFilesTable();

        getAllFilesRecursively(rootPath, extensions).then((success) => {
            if (db.removeProcessedFiles()) {
                process.send({ event: "filesFounded", data: db.getTempFilesTableSize() });

                processFilesChunk();
            }
        });
    } catch (ex) {
        console.error(ex);
        process.send({ event: "onException", data: { message: "Error while iterating", exception: ex } });
    }
}

entryPoint();
/////////////////////////////////////////////////////////////////////////////////////////////////////////

let mediaToCompare = [];

function processFilesChunk() {
    const chunk = db.getChunkTempFiles();

    for (let index = 0; index < chunk.length; index++) {
        const file = chunk[index].path;

        processFilesPool.exec('processFile', [file])
            .catch(err => {
                console.error(err);
                process.send({ event: "onException", data: err });
                process.send({ event: "onFileProcessed", data: undefined });
            })
            .then((result, error) => {
                process.send({ event: "onFileProcessed", data: result.id });
            });
    }

    // The worker must be terminated in order to continue the process, but it doesn't have a native
    // way to gracefully terminate when all pending tasks are complete. So we have to monitor
    const workerChecker = setInterval(() => {
        if (processFilesPool.stats().pendingTasks <= 0) {
            processFilesPool.terminate(false).then(() => {
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
    switch (comparator) {
        default:
        case "dynamic":
            dynamicAlgorithm();
            break;
        case "bruteforce":
            bruteforceAlgorithm();
            break;
        case "lsh":
            lshAlgorithm();
            break;
    }
}

let comparedIds = [];

///////////////////////////// Dynamic algorithm ////////////////////////////////

function dynamicAlgorithm() {
    comparatorPool = workerpool.pool(path.resolve(__dirname, `./comparators/dynamic.comparator.js`), {
        minWorkers: 1,
        maxWorkers: 10
    });

    mediaToCompare = db.getNonComparedMedias();
    comparedIds = db.getAllAlreadyComparedIds();
    process.send({ event: "filesToCompare", data: mediaToCompare.length });
}

/////////////////////////// End Dynamic algorithm //////////////////////////////

/////////////////////////// Bruteforce algorithm ///////////////////////////////

function bruteforceAlgorithm() {
    comparatorPool = workerpool.pool(path.resolve(__dirname, `./comparators/bruteforce.comparator.js`), {
        minWorkers: 1,
        maxWorkers: 10
    });

    mediaToCompare = db.getNonComparedMedias();
    comparedIds = db.getAllAlreadyComparedIds();
    process.send({ event: "filesToCompare", data: mediaToCompare.length });

    processBruteforceAlgorithmChunk();
}

function processBruteforceAlgorithmChunk() {
    // Only compare those who haven't being compared already
    // TODO: deal with the multiple compare hash algorithms, since now it's only checking if the comparison is there
    let tempArray = mediaToCompare.splice(0, 1000);

    while (tempArray.length) {
        const idFileBeingCompared = tempArray.pop().id;

        comparatorPool.exec('compare', [idFileBeingCompared, comparedIds, differenceAlgorithm, threshold])
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
            comparatorPool.terminate(false).then(() => {
                clearInterval(workerChecker);

                if (mediaToCompare.length > 0) {
                    processBruteforceAlgorithmChunk();
                } else {
                    // await a little longer for all duplicates to be pushed
                    setTimeout(() => {
                        console.log("Workerpool finished. Compare algorithm done.");
                        process.send({
                            event: "processFinished", data: db.getDuplicateMedias(differenceAlgorithm, threshold)
                        });
                    }, 5000);
                }
            });
        }
    }, 1000);
}

///////////////////////// End Bruteforce algorithm /////////////////////////////

/////////////////////////////// LSH algorithm //////////////////////////////////

function lshAlgorithm() {
    comparatorPool = workerpool.pool(path.resolve(__dirname, `./comparators/lsh.comparator.js`), {
        minWorkers: 1,
        maxWorkers: 10
    });

    const prepare = require("./comparators/lsh/PrepareLSHDataset");
    const buckets = prepare.getBuckets();

    let totalSize = 0;

    for (let i = 0; i < buckets.length; i++) {
        totalSize += buckets[i].length;
    }

    process.send({ event: "filesToCompare", data: totalSize });

    for (let i = 0; i < buckets.length; i++) {
        const bucket = buckets[i];
        let comparedBucketIds = [];

        while (bucket.length) {
            const idFileBeingCompared = bucket.pop();

            comparatorPool.exec('compare', [idFileBeingCompared, comparedBucketIds, differenceAlgorithm, threshold])
                .catch(err => {
                    console.error(err);
                    process.send({ event: "onException", data: err });
                })
                .then((dupesFound) => {
                    process.send({ event: "onFileCompared", data: idFileBeingCompared });
                    db.insertMediasCompared(dupesFound)
                });

            comparedBucketIds.push(idFileBeingCompared);
        }
    }

    const workerChecker = setInterval(() => {
        if (comparatorPool.stats().pendingTasks <= 0) {
            comparatorPool.terminate(false).then(() => {
                clearInterval(workerChecker);

                // await a little longer for all duplicates to be pushed
                setTimeout(() => {
                    console.log("Workerpool finished. Compare algorithm done.");
                    process.send({
                        event: "processFinished", data: db.getDuplicateMedias(differenceAlgorithm, threshold)
                    });
                }, 5000);
            });
        }
    }, 1000);
}

///////////////////////////// End LSH algorithm ////////////////////////////////

async function getAllFilesRecursively(base, ext = ['*'], files) {
    try {
        files = files || fs.readdirSync(base);

        for (let index = 0; index < files.length; index++) {
            const file = files[index];

            var newbase = path.join(base, file)
            if (fs.statSync(newbase).isDirectory()) {
                await getAllFilesRecursively(newbase, ext, fs.readdirSync(newbase))
            }
            else {
                const extension = file.substr(file.lastIndexOf(".") + 1);

                if (ext.includes(extension)) {
                    await db.insertTempFile(newbase);

                    process.send({
                        event: "fileFounded",
                        data: newbase
                    })
                }
            }
        }

        return true;
    } catch (ex) {
        process.send({ event: "onException", data: { message: "Error while getting all files recursively", exception: ex } });
        return false;
    }
}