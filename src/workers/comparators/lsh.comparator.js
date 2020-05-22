// Necessary for define
require("amd-loader");

let dupesFound = [];

define(['workerpool/dist/workerpool'], function (workerpool) {
    function compare(combinationChunk, differenceAlgorithm, threshold, serviceObjectName) {
        let ServiceObject = require(`../../services/${serviceObjectName}`);
        const service = new ServiceObject();

        for (let i = 0; i < combinationChunk.length; i++) {
            let combination = combinationChunk[i];

            let fileBeingCompared = combination[0];
            let fileToCompare = combination[1];

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
                console.log(`dupe found: ${distance}`);
            }
        }

        return dupesFound;
    }

    workerpool.worker({
        compare: compare
    });
});