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
    async function compare(mediaToCompare, comparedIds, differenceAlgorithm, threshold) {
        // Get the appropiate service for the file type
        // TODO: fix this later
        // let ServiceObject = require(`../../services/images.service`);
        // for (let i = 0; i < mediaTable.length; i++) {
        //     const type = mediaTable[i];
        //     if (type.extensions.includes(fileBeingCompared.extension)) { // At least for now all files in slice are the same type
        //         ServiceObject = require(`../../services/${type.service}`);
        //         break;
        //     }
        // }

        return dupesFound;
    }

    workerpool.worker({
        compare: compare
    });
});