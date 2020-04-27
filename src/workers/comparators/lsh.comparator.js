// Necessary for define
require("amd-loader");
const async = require("async");

// const MediaOperations = require("../../db/media.operations");
// const db = new MediaOperations();
// const LSHMinHash = require("./lsh/LSHMinHash");

// TODO: should this be configurable?
const mediaTable = [
    {
        extensions: ["jpg", "jpeg", "png", "gif", "bmp", "svg"],
        service: "images.service"
    }
]

let dupesFound = [];

define(['workerpool/dist/workerpool'], function (workerpool) {
    async function compare(fileBeingCompared, comparedMedias, differenceAlgorithm, threshold) {
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

        await async.each(comparedMedias, async (fileToCompare) => {
            // if same id == same exact file at the same path. ingnore
            if (fileBeingCompared.id === fileToCompare.id) {
                return;
            }

            // if (fileBeingCompared.size === fileToCompare.size) {
            //     if (fileBeingCompared.extension === fileToCompare.extension) {
            //         const dupe = { 
            //             idMediaA: fileBeingCompared.id, 
            //             idMediaB: fileToCompare.id,
            //             algorithm: "sameSizeAndExtension",
            //             percentage: 1.0
            //         };
            //         dupesFound.push(dupe);
            //         // console.log("Dupe found", dupe);
            //     }
            // }

            const distance = service.compareMedia(fileBeingCompared, fileToCompare, differenceAlgorithm);
            if (distance >= threshold) {
                const dupe = { 
                    idMediaA: fileBeingCompared.id, 
                    idMediaB: fileToCompare.id,
                    algorithm: differenceAlgorithm,
                    percentage: distance
                };
                dupesFound.push(dupe);
                console.log("Dupe found", dupe);
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