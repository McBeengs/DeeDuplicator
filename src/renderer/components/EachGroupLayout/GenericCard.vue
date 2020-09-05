<template>
    <image-card :media="media" v-if="isImage"></image-card>
    <image-card :media="media" v-else-if="isVideo"></image-card>
</template>

<script>
import ImageCard from './ImageCard.vue'
import VideoCard from './VideoCard.vue'

export default {
    props: ["media"],
    components: {
        ImageCard,
        VideoCard
    },
    data() {
        return {
            images: ["png", "jpg", "jpeg", "gif"],
            videos: ["mp4", "m4v", "avi", "wmv", "3gp", "webm", "mpg", "mpeg", "mov", "flv", "mkv", "divx"]
        }
    },
    computed: {
        isImage() {
            return this.images.indexOf(this.media.extension);
        },
        isVideo() {
            return this.videos.indexOf(this.media.extension);
        }
    }
}
</script>