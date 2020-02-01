<template>
    <div class="wrapper-comparing-media">
        <sidebar-menu :menu="menu" :collapsed="true" @item-click="onItemMenuClick"/>

        <div class="layout-container">
            <grid-layout v-if="viewActive === 'grid'" :duplicateGroups="duplicateGroups"></grid-layout>
            <group-layout v-if="viewActive === 'group'" :duplicateGroups="duplicateGroups"></group-layout>
            <each-group-layout v-if="viewActive === 'eachGroup'" :duplicateGroups="duplicateGroups"></each-group-layout>
        </div>

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
import store from "../../store/index";
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
        this.duplicateGroups = store.getters.getDuplicates;
    },
    mounted() {
        window.addEventListener('unload', () => {
            if (!this.isBeingFinished) {
                store.dispatch({
                    type: "setDuplicates",
                    duplicates: this.duplicateGroups
                });
            }
        });
    },
    data() {
        return {
            duplicateGroups: [],
            menu: Menu,
            isBeingFinished: false,

            viewActive: 'grid'
        }
    },
    methods: {
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
                case "goHome":
                    this.$router.push('/home');
                case "finish":
                    this.$refs.modalFinishComparison.open();
                    break;
            }
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
                store.dispatch({
                    type: "setTrash",
                    trash: trash
                });
            }

            store.dispatch({
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