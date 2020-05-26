<template>
    <div class="image-card-wrapper">
        <div class="image-container">
            <img v-lazy="pathMedia(media)" />
        </div>
        <div class="info-container" v-bar>
            <div>
                <b-form inline class="mt-sm-1">
                    <label class="mr-sm-2"><b>Name: </b></label>
                    <button class="btn btn-link" @click="openFile">{{ media.fileName }}</button>
                </b-form>
                <b-form inline class="mt-sm-1">
                    <label class="mr-sm-2"><b>Path: </b></label>
                    <p>{{ media.path }}</p>
                </b-form>
                <div class="row mt-sm-1">
                    <div class="col-4">
                        <b-form inline>
                            <label class="mr-sm-2"><b>Size: </b></label>
                            <p>{{ formatBytes(media.size) }}</p>
                        </b-form>
                    </div>
                    <div class="col-8">
                        <b-form inline>
                            <label class="mr-sm-2"><b>Created Date: </b></label>
                            <p>{{ formatDate(media.createDate) }}</p>
                        </b-form>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import moment from 'moment';
const shell = require('electron').shell;
const Path = require('path');

export default {
    props: ["media"],
    data() {
        return {
            videos: ["mp4", "m4v", "avi", "wmv", "3gp", "webm", "mpg", "mpeg", "mov", "flv", "mkv", "divx"]
        }
    },
    methods: {
        pathMedia(media) {
            if (this.videos.includes(media.extension)) {
                let directory = process.env.NODE_ENV === 'development' ? Path.resolve(__dirname, "../../../../Thumbnails/videos") : Path.resolve(__dirname, "../../Thumbnails/videos");

                return Path.join(directory, Buffer.from(media.path).toString('base64') + ".png")
            } else {
                return media.path;
            }
        },
        formatBytes(bytes, decimals) {
            if (bytes === 0) {
                return '0 Bytes';
            }

            const k = 1024;
            const dm = decimals <= 0 ? 0 : decimals || 2;
            const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));

            return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
        },
        formatDate(date) {
            return date === '' ? "Not Available" : moment(new Date(date)).format("YYYY/MM/DD");
        },
        openFile() {
            shell.openItem(this.media.path);
        },
    }
}
</script>

<style lang="scss">
.image-card-wrapper {
    width: 100%;
    height: 100%;

    .image-container {
        height: 80%;

        img {
            max-width: 100%;
            max-height: 100%;
            display: block;
            margin: 0 auto;
        }
    }

    .info-container {
        height: 20%;
        margin-top: 10px;
        padding-top: 10px;
        border-top: 1px solid #eee;
        

        button {
            margin: 0;
            padding: 0;
            font-size: 0.875rem;
        }

        p {
            margin: 0;
        }
    }
}
</style>