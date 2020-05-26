<template>
    <div class="wrapper-comparing-media">
        <sidebar-menu :menu="menu" :collapsed="true" @item-click="onItemMenuClick"/>

        <div class="layout-container">
            <grid-layout v-if="viewActive === 'grid'" :duplicateGroups="duplicateGroups" :openEachGroupLayout="openEachGroupLayout"></grid-layout>
            <group-layout v-if="viewActive === 'group'" :duplicateGroups="duplicateGroups" :openEachGroupLayout="openEachGroupLayout"></group-layout>
            <each-group-layout v-if="viewActive === 'eachGroup'" :duplicateGroups="duplicateGroups" :openWithGroup="groupToOpen"></each-group-layout>
        </div>

        <sweet-modal ref="modalNoDuplicateGroups" hide-close-button blocking >
            <p style="font-size: 44px">🎉</p>
            Good news! No duplicate files were founded on the folder selected. There's nothing to compare here.
            <hr>
            If you think that there is something we missed, you can try changing the algorithm's params into the "Settings" screen.

            <button slot="button" class="btn btn-success" @click="redirectToHome">Start new search</button>
        </sweet-modal>

        <sweet-modal icon="warning" ref="modalFinishComparison">
            By finishing the comparison, all the files selected will be moved to the trashcan. 
            The current batch of files will be erased and another scan will be required. Are you sure?

            <button slot="button" class="btn btn-primary" @click="$refs.modalFinishComparison.close()" style="margin-right: 10px;">Continue comparison</button>
            <button slot="button" class="btn btn-success" @click="$refs.modalAddWhitelist.open()" >Finish</button>
        </sweet-modal>

        <sweet-modal icon="warning" ref="modalAddWhitelist" hide-close-button blocking >
            Do you want to add the non checked files to the whitelist so that the next time a scan occurs
            they will be ignored as duplicates (unless new files show up and are equal)?

            <button slot="button" class="btn btn-default" @click="finishComparison(false)" style="margin-right: 10px;">No</button>
            <button slot="button" class="btn btn-success" @click="finishComparison(true)">Yes</button>
        </sweet-modal>
    </div>
</template>

<script>
import { SidebarMenu } from 'vue-sidebar-menu'
import 'vue-sidebar-menu/dist/vue-sidebar-menu.css'
import GridLayout from './Layouts/GridLayout.vue'
import GroupLayout from './Layouts/GroupLayout.vue'
import EachGroupLayout from './Layouts/EachGroupLayout.vue'
import RendererOperations from '../../db/renderer.operations'
const db = new RendererOperations();

import { Menu } from './comparingSideMenu.js'

export default {
    components: {
        SidebarMenu,
        GridLayout,
        GroupLayout,
        EachGroupLayout
    },
    created() {
        this.getDuplicatesFromDb();
    },
    mounted() {
        window.addEventListener('unload', () => {
            if (!this.isBeingFinished) {
                this.$store.dispatch({
                    type: "setDuplicates",
                    duplicates: this.duplicateGroups
                });
            }
        });

        if (this.duplicateGroups.length <= 0) {
            this.$refs.modalNoDuplicateGroups.open();
        }
    },
    data() {
        return {
            duplicateGroups: [],
            menu: Menu,
            groupToOpen: null,
            isBeingFinished: false,

            viewActive: 'group'
        }
    },
    methods: {
        getDuplicatesFromDb() {
            let dbDuplicates = db.getDuplicates();
            this.duplicateGroups = this.$store.getters.getDuplicates;

            if (this.duplicateGroups.length !== dbDuplicates.length) {
                this.duplicateGroups = dbDuplicates;
                this.$store.dispatch({
                    type: "setDuplicates",
                    duplicates: this.duplicateGroups
                });
                this.duplicateGroups = this.$store.getters.getDuplicates;
            }
        },

        redirectToHome() {
            this.$router.push({ path: '/home' });
        },

        openEachGroupLayout(group) {
            this.groupToOpen = group;
            this.viewActive = "eachGroup";
        },

        onItemMenuClick(event, item) {
            switch (item.id) {
                case "ignore":
                default:
                    break
                case "grid":
                    this.viewActive = "grid";
                    break;
                case "group":
                    this.viewActive = "group";
                    break;
                case "eachGroup":
                    this.viewActive = "eachGroup";
                    break;
                case "customRule":
                    break;

                case "fa":
                    this.customCheckFA();
                    break;
                case "bbw":
                    this.customCheckBBW();
                    break;

                case "biggestSize":
                    this.checkBySize("biggest");
                    break;
                case "smallestSize":
                    this.checkBySize("smallest");
                    break;
                case "longestPath":
                    this.checkByPath("longest");
                    break;
                case "shortestPath":
                    this.checkByPath("shortest");
                    break;
                case "newestFile":
                    this.checkByDate("newest");
                    break;
                case "oldestFile":
                    this.checkByDate("oldest");
                    break;
                case "unselectAll":
                    this.unselectAll();
                    break;
                case "goHome":
                    this.$router.push('/home');
                case "finish":
                    this.$refs.modalFinishComparison.open();
                    break;
            }
        },

        customCheckFA() {
            for (let i = 0; i < this.duplicateGroups.length; i++) {
                const group = this.duplicateGroups[i];

                group.reduce((prev, current) => {
                    if (!prev || !current) {
                        return;
                    }

                    prev.checked = false;
                    current.checked = false;

                    if (prev.fileName === "default.png") {
                        prev.checked = false;
                    }

                    if (current.fileName === "default.png") {
                        prev.checked = false;
                    }

                    if (prev.path.indexOf("yiff.party") > 0) {
                        if (prev.size > current.size) {
                            current.checked = true;
                        } else {
                            prev.checked = true;
                        }
                    }

                    if (current.path.indexOf("yiff.party") > 0) {
                        if (current.size > prev.size) {
                            prev.checked = true;
                        } else {
                            current.checked = true;
                        }
                    }

                    // let artistName = media.path.substring(media.path.indexOf("FurAffinity"));
                    // artistName = artistName.substring(artistName.indexOf("\\") + 1);
                    // artistName = artistName.substring(0, artistName.indexOf("\\"));

                    // let fileArtistName = media.fileName.substring(media.fileName.indexOf(".") + 1, media.fileName.indexOf("_"));

                    // if (escape(artistName.trim()) !== escape(fileArtistName.trim())) {
                    //     media.checked = true;
                    //     continue;
                    // }

                    if (prev.size > current.size) {
                        current.checked = true;
                    } else {
                        prev.checked = true;
                    }
                });
            }
            this.$store.dispatch({
                type: "setRefreshDuplicateGroups",
                refreshDuplicateGroups: Math.random()
            });
        },

        customCheckBBW() {
            for (let i = 0; i < this.duplicateGroups.length; i++) {
                const group = this.duplicateGroups[i];
                
                group.reduce((prev, current) => {
                    if (!prev || !current) {
                        return;
                    }

                    prev.checked = false;
                    current.checked = false;

                    if (
                        prev.path.indexOf("\\Sort\\") > 0 ||
                        prev.path.indexOf("\\Downloads\\") > 0
                    ) {
                        prev.checked = true;
                    }

                    if (
                        current.path.indexOf("\\Sort\\") > 0 ||
                        current.path.indexOf("\\Downloads\\") > 0
                    ) {
                        current.checked = true;
                    }

                    // if (prev.size > current.size) {
                    //     current.checked = true;
                    // } else {
                    //     prev.checked = true;
                    // }
                });
            }
            this.$store.dispatch({
                type: "setRefreshDuplicateGroups",
                refreshDuplicateGroups: Math.random()
            });
        },

        checkBySize(size) {
            for (let i = 0; i < this.duplicateGroups.length; i++) {
                const group = this.duplicateGroups[i];
                group.reduce((prev, current) => {
                    prev.checked = false;
                    current.checked = false;

                    if (size === "biggest") {
                        return (prev.size > current.size) ? prev : current;
                    } else {
                        return (prev.size < current.size) ? prev : current
                    }
                }).checked = true;
            }
            this.$store.dispatch({
                type: "setRefreshDuplicateGroups",
                refreshDuplicateGroups: Math.random()
            });
        },

        checkByPath(size) {
            for (let i = 0; i < this.duplicateGroups.length; i++) {
                const group = this.duplicateGroups[i];
                group.reduce((prev, current) => {
                    prev.checked = false;
                    current.checked = false;

                    if (size === "longest") {
                        return (prev.path.length > current.path.length) ? prev : current;
                    } else {
                        return (prev.path.length < current.path.length) ? prev : current
                    }
                }).checked = true;
            }
            this.$store.dispatch({
                type: "setRefreshDuplicateGroups",
                refreshDuplicateGroups: Math.random()
            });
        },

        checkByDate(size) {
            for (let i = 0; i < this.duplicateGroups.length; i++) {
                const group = this.duplicateGroups[i];
                group.reduce((prev, current) => {
                    prev.checked = false;
                    current.checked = false;

                    if (size === "newest") {
                        return (new Date(prev.createDate) > new Date(prev.createDate)) ? prev : current;
                    } else {
                        return (new Date(prev.createDate) < new Date(prev.createDate)) ? prev : current
                    }
                }).checked = true;
            }
            this.$store.dispatch({
                type: "setRefreshDuplicateGroups",
                refreshDuplicateGroups: Math.random()
            });
        },

        unselectAll() {
            for (let i = 0; i < this.duplicateGroups.length; i++) {
                const group = this.duplicateGroups[i];
                
                if (!group) {
                    continue;
                }

                for (let j = 0; j < group.length; j++) {
                    group[j].checked = false;
                }
            }
            this.$store.dispatch({
                type: "setRefreshDuplicateGroups",
                refreshDuplicateGroups: Math.random()
            });
        },

        finishComparison(whitelist) {
            let uniqueIds = [];
            let trash = [];

            for (let i = 0; i < this.duplicateGroups.length; i++) {
                const group = this.duplicateGroups[i];
                for (let j = 0; j < group.length; j++) {
                    const media = group[j];
                    if (media.checked) {
                        if (trash.filter(m => { return m.path === media.path; }).length === 0) {
                            trash.push(media);
                        }
                        continue;
                    }

                    if (!uniqueIds.includes(media.id)) {
                        uniqueIds.push(media.id);
                    }
                }
            }

            if (whitelist) {
                db.addDuplicatesToWhitelist(uniqueIds)
            }

            if (trash.length > 0) {
                this.$store.dispatch({
                    type: "setTrash",
                    trash: trash
                });
            }

            this.$store.dispatch({
                type: "setDuplicates",
                duplicates: []
            });
            this.isBeingFinished = true;

            this.$router.push("/trashcan");
        }
    }
}
</script>

<style lang="scss">
.wrapper-comparing-media {
    height: 100%;

    .layout-container {
        margin-left: 50px;
        height: 100%;
    }
}
</style>