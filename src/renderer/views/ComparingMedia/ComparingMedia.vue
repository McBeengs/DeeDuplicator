<template>
    <div class="wrapper-comparing-media">
        <sidebar-menu :menu="menu" :collapsed="true" @item-click="onItemMenuClick"/>

        <div class="layout-container">
            <grid-layout v-if="viewActive === 'grid'" :duplicateGroups="duplicateGroups"></grid-layout>
            <group-layout v-if="viewActive === 'group'" :duplicateGroups="duplicateGroups"></group-layout>
            <each-group-layout v-if="viewActive === 'eachGroup'" :duplicateGroups="duplicateGroups"></each-group-layout>
        </div>
    </div>
</template>

<script>
import GridLayout from './Layouts/GridLayout.vue'
import GroupLayout from './Layouts/GroupLayout.vue'
import EachGroupLayout from './Layouts/EachGroupLayout.vue'
import { SidebarMenu } from 'vue-sidebar-menu'
import 'vue-sidebar-menu/dist/vue-sidebar-menu.css'
import store from "../../store/index";

import { Menu } from './comparingSideMenu.js'

export default {
    components: {
        SidebarMenu,
        GridLayout,
        GroupLayout,
        EachGroupLayout
    },
    mounted() {
        this.duplicateGroups = store.getters.getDuplicates;
    },
    data() {
        return {
            duplicateGroups: [],
            menu: Menu,

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

                    break;
                case "smallestSize":

                    break;
                case "longestPath":

                    break;
                case "shortestPath":

                    break;
                case "newestFile":

                    break;
                case "oldestFile":

                    break;
                case "goHome":
                    this.$router.push('/home')
                    break;
            }
        }
    }
}
</script>

<style lang="scss">
.wrapper-comparing-media {
    .layout-container {
        margin-left: 55px;
    }
}
</style>