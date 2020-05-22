// Necessary for define
require("amd-loader");
const fs = require('fs');

const MediaOperations = require("../db/media.operations");
const db = new MediaOperations();

// TODO: should this be configurable?
const mediaTable = [
    {
        extensions: ["jpg", "jpeg", "png", "gif", "bmp", "svg"],
        service: "images.service"
    }
]

define(['workerpool/dist/workerpool'], function(workerpool) {
    async function processFile(file) {
        const media = {};
        const fileStats = fs.statSync(file);
        media.filename = file.substring(file.lastIndexOf("\\") + 1);
        media.extension = file.substring(file.lastIndexOf(".") + 1);
        media.createDate = fileStats.birthtime;
        media.size = fileStats.size;
        media.path = file;
        
        // Since we deleted the already captured files in the mediaIterator.js, every file passing here
        // will be brand new
        fileId = await db.insertMedia(media);
        media.id = fileId;

        // Get the appropiate server for the file type
        let ServiceObject = {}
        for (let i = 0; i < mediaTable.length; i++) {
            const type = mediaTable[i];
            if (type.extensions.includes(media.extension)) {
                ServiceObject = require(`../services/${type.service}`);
                break;
            }
        }

        const service = new ServiceObject();
        const result = await service.processMedia(media);
        if (!result) { // Something went wrong and no media was persisted
            // await db.deleteFailedMedia(media.path);
            db.insertMediaException(file);
            return null;
        }

        return { id: media.id };
    }

    workerpool.worker({
        processFile: processFile
    });

});