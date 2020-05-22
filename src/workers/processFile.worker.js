// Necessary for define
require("amd-loader");
const fs = require('fs');

const MediaOperations = require("../db/media.operations");
const db = new MediaOperations();

define(['workerpool/dist/workerpool'], function(workerpool) {
    async function processFile(file, serviceObjectName) {
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

        ServiceObject = require(`../services/${serviceObjectName}`);
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