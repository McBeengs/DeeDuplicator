// Necessary for define
require("amd-loader");
const async = require("async");

let dupesFound = [];

define(['workerpool/dist/workerpool'], function (workerpool) {
    async function compare(idFileBeingCompared, comparedIds, differenceAlgorithm, threshold, serviceObjectName) {
        let ServiceObject = require(`../../services/${serviceObjectName}`);
        const service = new ServiceObject();

        const fileBeingCompared = service.getMedia(idFileBeingCompared);
        const comparedFiles = service.getMedias(comparedIds);

        await async.each(comparedFiles, async (fileToCompare) => {
            // if same id == same exact file at the same path. ingnore
            if (fileBeingCompared.id === fileToCompare.id) {
                return;
            }

            const distance = await service.compareMedia(fileBeingCompared, fileToCompare, differenceAlgorithm);
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