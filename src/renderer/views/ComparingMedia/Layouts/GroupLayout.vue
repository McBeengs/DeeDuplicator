<template>
    <div class="wrapper-group-layout">
        <div class="header-container">
            <div class="card">
                <div class="card-body">
                    <b-form inline>
                        <div class="form-group">
                            <label class="mr-sm-2">Groups per Page: </label>
                            <b-form-select v-model="filesPerPage" :options="optionsPerPageSelection"></b-form-select>
                        </div>

                        <p class="ml-sm-2 mr-sm-2 info-label">
                            {{ totalFilesSelected }} files selected from a total of {{ totalFiles }}. Actual save of {{ formatBytes(totalBytesSelected) }}
                        </p>

                        <div class="form-group">
                            <b-pagination
                                v-model="currentPage"
                                :total-rows="duplicateGroups.length"
                                :per-page="filesPerPage">
                            </b-pagination>
                        </div>
                    </b-form>
                </div>
            </div>
        </div>

        <div class="groups-container">
            <div class="group-container row" v-for="(group, index) in getGroupsSlice()" v-bind:key="index">
                <div class="col-xs-8 col-sm-4 col-md-4 col-lg-3 col-xl-3" v-for="(media) in group" v-bind:key="media.id"
                    @contextmenu="$easycm($event,$root,1); contextMenuOpened(media)">
                    <media-pill :media="media" :onClick="onMediaClick" :showInfo="true"></media-pill>
                </div>
                <hr>
            </div>
        </div>

        <easy-cm :list="contextMenuList" :tag="1" @ecmcb="contextMenuOptionClicked" :itemWidth="330"></easy-cm>
    </div>
</template>

<script>
import MediaPill from '../../../components/MediaPill.vue';

export default {
    components: {
        MediaPill
    },
    props: ["duplicateGroups", "openEachGroupLayout"],
    data() {
        return {
            contextMenuItem: {},
            contextMenuList: [{ text: "Open \"Compare Group by Group\" with this file", icon: "" }],
            optionsPerPageSelection: [50, 100, 1000, 5000, 10000, 1000000, 1000000000],
            currentPage: 1,

            filesPerPage: 50,
            totalFiles: 0,
            totalFilesSelected: 0,
            totalBytesSelected: 0
        }
    },
    beforeMount() {
        this.calculateSelectedMedias();
    },
    methods: {
        calculateSelectedMedias() {
            for (let i = 0; i < this.duplicateGroups.length; i++) {
                const group = this.duplicateGroups[i];
                
                for (let j = 0; j < group.length; j++) {
                    const media = group[j];
                    this.totalFiles++;
                    if (media.checked) {
                        this.totalFilesSelected++;
                        this.totalBytesSelected += media.size;
                    }
                }
            }
        },
        contextMenuOpened(item) {
            this.contextMenuItem = item;
        },
        contextMenuOptionClicked(indexList){
            switch(indexList) {
                default:
                    this.openEachGroupLayout(this.contextMenuItem);
                    break;
            }
        },
        onMediaClick(item) {
            item.checked = !item.checked;

            if (item.checked) {
                this.totalFilesSelected++;
                this.totalBytesSelected += item.size;
            } else {
                this.totalFilesSelected--;
                this.totalBytesSelected -= item.size;
            }
        },
        getGroupsSlice() {
            const currentIndex = this.filesPerPage * (this.currentPage - 1);
            return this.duplicateGroups.slice(currentIndex, currentIndex + this.filesPerPage)
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
        }
    },
    watch: {
        duplicateGroups: {
            handler() {
                this.totalFiles = 0;
                this.totalFilesSelected = 0;
                this.totalBytesSelected = 0;
                this.calculateSelectedMedias();
            }, deep: true
        }
    }
}
</script>

<style lang="scss">
.wrapper-group-layout {

    .groups-container {
        margin-top: 70px;
    }
    
    .header-container {
        position: fixed;
        width: 100%;
        margin-top: -70px;
        z-index: 100;

        .card {
            margin-bottom: 0;

            .card-body {
                padding: 10px 15px !important;
                
                .form-inline {
                    display: flex;
                    justify-content: space-between;
                }
            }
        }

        .info-label {
            margin-bottom: 0;
        }

        .pagination {
            margin-bottom: 0;
            margin-right: 50px;
        }
    }

    .row.group-container {
        margin: 0;
    }

    .group-container {

        .card.media-pill-wrapper {
            margin-bottom: 0;
        }
        
        .media-pill-wrapper {
            margin-top: 10px;
        }

        hr {
            width: 100%;
            margin-top: 20px;
            margin-bottom: 10px;
        }
    }
}
</style>