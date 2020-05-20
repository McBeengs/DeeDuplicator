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
        // Get the appropiate service for the file type
        // TODO: fix this later
        let ServiceObject = require(`../../services/images.service`);
        // for (let i = 0; i < mediaTable.length; i++) {
        //     const type = mediaTable[i];
        //     if (type.extensions.includes(fileBeingCompared.extension)) { // At least for now all files in slice are the same type
        //         ServiceObject = require(`../../services/${type.service}`);
        //         break;
        //     }
        // }

        const service = new ServiceObject();

        const fileBeingCompared = service.getMedia(idFileBeingCompared);
        const comparedFiles = service.getMedias(comparedIds);

        await async.each(comparedFiles, async (fileToCompare) => {
            // if same id == same exact file at the same path. ingnore
            if (fileBeingCompared.id === fileToCompare.id) {
                return;
            }

            const distance = service.compareMedia(fileBeingCompared, fileToCompare, differenceAlgorithm);
            if (distance >= threshold) {
                dupesFound.push({ 
                    idMediaA: fileBeingCompared.id, 
                    idMediaB: fileToCompare.id,
                    algorithm: differenceAlgorithm,
                    percentage: distance
                });
                console.log(`dupe found: ${distance}`);
            }
        }, () => {
            return true;
        });

        return dupesFound;
    }

    workerpool.worker({
        compare: compare
    });
});