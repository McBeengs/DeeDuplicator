<template>
    <div class="card media-pill-wrapper" @click="onClick(media)">
        <div class="card-body">
            <div class="thumb-wrapper">
                <div class="file-thumbnail">
                    <div class="checkbox-hover" v-if="media.checked">
                        <span><i class="fas fa-trash-alt"></i></span>
                    </div>
                    <img v-lazy="media.path" />
                </div>
            </div>
            <div class="thumb-info">
                <div class="thumb-info-value">
                    <h6 class="d-inline">Name: </h6>
                    <p class="d-inline">{{media.fileName}}</p>
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

export default {
    props: ["media", "onClick"],
    data() {
        return {

        }
    },
    methods: {
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

    .checkbox-hover {
        position: absolute;
        
        span i {
            padding: 10px;
            border-radius: 20px;
            color: #eee;
            background-color: rgba($color: red, $alpha: 0.6)
        }
    }

    :hover {
        background: #eee;
        cursor: pointer;
    }
}
</style>