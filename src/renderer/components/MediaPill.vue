<template>
    <div class="card media-pill-wrapper" @click="onCardClick" :key="key">
        <div class="card-body" :class="showInfo ? 'hover' : ''">
            <div class="thumb-wrapper">
                <div class="arrows-comparator" v-if="!showInfo">
                    <b-button variant="success" @click="onLeftClick" size="sm">
                        <span><i class="fas fa-arrow-left"></i></span>
                    </b-button>
                    <b-button variant="info" @click="onRightClick" size="sm" style="float: right">
                        <span><i class="fas fa-arrow-right"></i></span>
                    </b-button>
                </div>
                <div class="file-thumbnail">
                    <div class="checkbox-hover" v-if="media.checked" :class="showInfo ? '' : 'margin-arrows'">
                        <span><i class="fas fa-trash-alt"></i></span>
                    </div>
                    <img v-lazy="pathMedia(media)" />
                </div>
            </div>
            <div class="thumb-info" v-if="showInfo">
                <div class="thumb-info-value">
                    <h6 class="d-inline">Name: </h6>
                    <p class="d-inline">{{media.fileName}}</p>
                </div>
                <div class="thumb-info-value">
                    <h6 class="d-inline">Path: </h6>
                    <p class="d-inline">{{media.path}}</p>
                </div>
                <div class="thumb-info-value">
                    <h6 class="d-inline">Date: </h6>
                    <p class="d-inline">
                        {{ formatDate(media.createDate) }}
                    </p>
                </div>
                <div class="thumb-info-value">
                    <h6 class="d-inline">Size: </h6>
                    <p class="d-inline">{{ formatBytes(media.size) }}</p>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import moment from 'moment'
const Path = require('path');

export default {
    props: ["media", "showInfo"],
    data() {
        return {
            videos: ["mp4", "m4v", "avi", "wmv", "3gp", "webm", "mpg", "mpeg", "mov", "flv", "mkv", "divx"],
            key: 0
        }
    },
    methods: {
        pathMedia(media) {
            if (this.videos.includes(media.extension.toLowerCase())) {
                let directory = process.env.NODE_ENV === 'development' ? Path.resolve(__dirname, "../../../Thumbnails/videos") : Path.resolve(__dirname, "../../Thumbnails/videos");

                // console.log(directory)

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
            return moment(new Date(date)).format("YYYY/MM/DD");
        },

        onCardClick() {
            this.media.checked = !this.media.checked;
            this.$emit("onCardClick", this.media);
            this.key++;
        },

        onLeftClick() {
            this.media.checked = !this.media.checked;
            this.$emit("onLeftClick", this.media);
            this.key++;
        },

        onRightClick() {
            this.media.checked = !this.media.checked;
            this.$emit("onRightClick", this.media);
            this.key++;
        }
    }
}
</script>

<style lang="scss">
.media-pill-wrapper.card {
    border: 0;
}

.media-pill-wrapper {

    padding: 0;

    .thumb-wrapper {
        width: 100%;
    }

    .file-thumbnail {
        max-width: 80%;
        max-height: 80%;
        display: inherit;
        margin: 0 auto;

        img {
            width: 100%;
            height: 100%;
        }
    }

    .thumb-info {
        margin-top: 10px;
    }

    .thumb-info-value {
        margin-bottom: 7px;
    }

    .file-thumbnail {
        max-width: 80%;
        max-height: 80%;
    }

    .arrows-comparator {
        position: absolute;
        width: 82%;
    }

    .margin-arrows {
        margin-top: 35px;
    }

    .checkbox-hover {
        position: absolute;
        
        span i {
            padding: 10px;
            border-radius: 20px;
            color: #eee;
            background-color: rgba($color: red, $alpha: 0.6)
        }
    }

    .hover:hover {
        background: #eee;
        cursor: pointer;
    }
}
</style>