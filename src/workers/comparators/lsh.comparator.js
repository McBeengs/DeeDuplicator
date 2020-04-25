// Necessary for define
require("amd-loader");
const async = require("async");

const MediaOperations = require("../../db/media.operations");
const db = new MediaOperations();
const LSHMinHash = require("./lsh/LSHMinHash");

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

        await async.each(comparedIds, async (idFileToCompare) => {
            // if same id == same exact file at the same path. ingnore
            if (idFileBeingCompared === idFileToCompare) {
                return;
            }
            
            const distance = service.compareMedia(idFileBeingCompared, idFileToCompare, differenceAlgorithm);
            if (distance >= threshold) {
                const dupe = { 
                    idMediaA: idFileBeingCompared, 
                    idMediaB: idFileToCompare,
                    algorithm: differenceAlgorithm,
                    percentage: distance
                };
                console.log("Dupe found", dupe);
                dupesFound.push(dupe);
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