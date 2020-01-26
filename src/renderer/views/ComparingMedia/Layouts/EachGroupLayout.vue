<template>
    <div class="wrapper-each-group-layout">
        <div class="row medias-section">
            <div class="col-md-8 col-lg-9 col-xl-10">
                <div class="row h-100">
                    <div class="col-6">
                        <div class="card h-100 left-card">
                            <div class="card-body h-100">
                                <div class="media-card-container">
                                    <image-card :media="mediaLeft"></image-card>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-6">
                        <div class="card h-100 right-card">
                            <div class="card-body h-100">
                                <div class="media-card-container">
                                    <image-card :media="mediaRight"></image-card>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-4 col-lg-3 col-xl-2">
                <div class="card pills-container" v-bar>
                    <div class="card-body">
                        <div class="pill-container" v-for="(media, index) in currentGroup" v-bind:key="index">
                            <media-pill 
                                :media="media" 
                                :onClick="onPillClick"
                                :onLeftClick="leftClick" 
                                :onRightClick="rightClick">
                            </media-pill>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="buttons-footer">
            <button class="btn btn-primary" :disabled="currentGroupIndex <= 0" @click="previousGroupClick">
                Previous Group
            </button>

            <b-button-group size="sm" class="mt-3">
                <b-button variant="success" @click="mediaLeft.checked = !mediaLeft.checked">
                    <span><i class="fas fa-arrow-left"></i></span>
                    <span><i class="fas fa-trash-alt"></i></span>
                    Delete left
                </b-button>
                <b-button>
                    <span><i class="fas fa-cut"></i></span>
                    <span><i class="fas fa-paste"></i></span>
                    Switch directories
                </b-button>
                <b-button>
                    <span><i class="fas fa-retweet"></i></span>
                    Swap filenames
                </b-button>
                <b-button variant="info" @click="mediaRight.checked = !mediaRight.checked">
                    Delete right
                    <span><i class="fas fa-trash-alt"></i></span>
                    <span><i class="fas fa-arrow-right"></i></span>
                </b-button>
            </b-button-group>

            <button class="btn btn-primary" :disabled="groupsRemaining === 0" @click="nextGroupClick">
                Next Group {{ groupsRemaining > 0 ? `(${groupsRemaining} remaining)` : ""}}
            </button>
        </div>
    </div>
</template>

<script>
import MediaPill from '../../../components/MediaPill.vue'
import ImageCard from '../../../components/EachGroupLayout/ImageCard.vue'

export default {
    components: {
        MediaPill,
        ImageCard
    },
    props: ["duplicateGroups"],
    data() {
        return {
            currentGroupIndex: 0,
            currentGroup: {},

            mediaLeft: {},
            mediaRight: {}
        }
    },
    beforeMount() {
        this.currentGroup = this.duplicateGroups[this.currentGroupIndex];
        this.mediaLeft = this.currentGroup[0];
        this.mediaRight = this.currentGroup[1]
    },
    methods: {
        nextGroupClick() {
            this.currentGroupIndex++;
            this.currentGroup = this.duplicateGroups[this.currentGroupIndex];
            this.mediaLeft = this.currentGroup[0];
            this.mediaRight = this.currentGroup[1]
        },
        previousGroupClick() {
            this.currentGroupIndex--;
            this.currentGroup = this.duplicateGroups[this.currentGroupIndex];
            this.mediaLeft = this.currentGroup[0];
            this.mediaRight = this.currentGroup[1]
        },
        onPillClick(media) {
            media.checked = !media.checked;
        },
        leftClick(media) {
            this.mediaLeft = media;
        },
        rightClick(media) {
            this.mediaRight = media;
        }
    },
    computed: {
        groupsRemaining: function() {
            return this.duplicateGroups.length - (this.currentGroupIndex + 1);
        }
    }
}
</script>

<style lang="scss">
.wrapper-each-group-layout {
    padding: 10px 10px 0px 10px;
    overflow-x: hidden;
    overflow-y: hidden;
    height: 100%;

    .medias-section {
        height: 92%;
        padding-bottom: 10px;

        .left-card {
            border: 2px solid #27c24c;
            border-radius: 5px;
        }

        .right-card {
            border: 2px solid #23b7e5;
            border-radius: 5px;
        }

        .media-card-container {
            width: 100%;
            height: 100%;
        }

        .pills-container {
            height: 100%;
        }
    }

    .buttons-footer {
        height: 8%;
        display: flex;
        justify-content: space-between;
        padding-bottom: 10px;

        button {
            align-self: flex-end;
        }
    }
}
</style>