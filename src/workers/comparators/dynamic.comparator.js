// Necessary for define
require("amd-loader");
const async = require("async");

const MediaOperations = require("../../db/media.operations");
const db = new MediaOperations();

// TODO: should this be configurable?
const mediaTable = [
    {
        extensions: ["jpg", "jpeg", "png", "gif", "bmp", "svg"],
        service: "images.service"
    }
]

let dupesFound = [];

define(['workerpool/dist/workerpool'], function (workerpool) {
    async function compare(idFileBeingCompared, comparedIds, differenceAlgorithm, threshold) {
        const fileBeingCompared = db.getMediaById(idFileBeingCompared);

        // Get the appropiate service for the file type
        let ServiceObject = {}
        for (let i = 0; i < mediaTable.length; i++) {
            const type = mediaTable[i];
            if (type.extensions.includes(fileBeingCompared.extension)) { // At least for now all files in slice are the same type
                ServiceObject = require(`../../services/${type.service}`);
                break;
            }
        }

        const service = new ServiceObject();

        async.each(comparedIds, async (idFileToCompare) => {
            // if same id == same exact file at the same path. ingnore
            if (idFileBeingCompared === idFileToCompare) {
                return;
            }

            const fileToCompare = db.getMediaById(idFileToCompare);

            // Check if files were compared at least one time
            const comparison = db.mediasAlreadyCompared(idFileBeingCompared, idFileToCompare);
            if (comparison !== null) {
                // If they were compared with the current comparator algorithm, ignore
                let stopComparison = false;
                switch (differenceAlgorithm) {
                    case "leven":
                        if (comparison.leven !== null && comparison.leven > 0) {
                            stopComparison = true;
                        }
                        break;
                    case "hamming":
                        if (comparison.hamming !== null && comparison.hamming > 0) {
                            stopComparison = true;
                        }
                        break;
                    case "dice":
                        if (comparison.dice !== null && comparison.dice > 0) {
                            stopComparison = true;
                        }
                        break;
                }
                if (stopComparison) {
                    return;
                }
            }

            if (fileBeingCompared.filename === fileToCompare.filename &&
                fileBeingCompared.size === fileToCompare.size) {
                newDupeFound(fileBeingCompared, fileToCompare, differenceAlgorithm, 1);
            }

            const distance = await service.compareMedia(fileBeingCompared, fileToCompare, differenceAlgorithm);
            if (distance >= threshold) {
                newDupeFound(fileBeingCompared, fileToCompare, differenceAlgorithm, distance);
            }
        }, () => {
            return true;
        })
    }

    function newDupeFound(fileBeingCompared, fileToCompare, differenceAlgorithm, distance) {
        db.insertMediasCompared(fileBeingCompared, fileToCompare, differenceAlgorithm, distance).then(() => {
            console.error(`Dupe found for file [${fileBeingCompared.path}]`);
        });
    }

    workerpool.worker({
        compare: compare
    });
});