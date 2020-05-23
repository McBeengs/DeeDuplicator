<template>
    <div class="wrapper-trashcan-layout">
        <sidebar-menu :menu="menu" :collapsed="true" @item-click="onItemMenuClick"/>

        <b-table id="gridTable" :items="tableItems" :fields="fields">
            <template v-slot:cell(spare)="data" >
                <button class="btn btn-primary" @click="spareFile(data.item)">
                    <span><i class="fas fa-trash-alt"></i></span>
                    Spare File
                </button>
            </template>
            <template v-slot:cell(fileName)="data" >
                <button class="btn btn-link" @click="openFile(data.item.path)">
                    {{ data.item.fileName.length > 45 ? data.item.fileName.substring(0, 45) + '...' : data.item.fileName  }}
                </button>
            </template>
            <template v-slot:cell(path)="data" >
                <p>{{ data.item.path.length > 60 ? data.item.path.substring(0, 60) + '...' : data.item.path }}</p>
            </template>
            <template v-slot:cell(size)="data" ><p>{{ formatBytes(data.item.size) }}</p></template>
            <template v-slot:cell(createDate)="data"><p style="min-width: 100px;"> {{ formatDate(data.item.createDate) }}</p></template>
        </b-table>

        <sweet-modal ref="modalConfirmSpare" hide-close-button blocking>
            Do you want to spare all the files? This action cannot be undone and will require another comparison if need be. 

            <button slot="button" class="btn btn-primary" @click="$refs.modalConfirmSpare.close()" style="margin-right: 10px;">No</button>
            <button slot="button" class="btn btn-danger" @click="spareFiles()" >Yes</button>
        </sweet-modal>

        <sweet-modal ref="modalConfirmDelete" hide-close-button blocking>
            Do you want to move them to the OS trashcan or permanently delete (the last one is irreversible)?

            <button slot="button" class="btn btn-primary" @click="$refs.modalConfirmDelete.close()" style="margin-right: 10px;">Close</button>
            <button slot="button" class="btn btn-warning" @click="deleteFiles(false)" style="margin-right: 10px;">Move to trashcan</button>
            <button slot="button" class="btn btn-danger" @click="deleteFiles(true)" >Delete permanently</button>
        </sweet-modal>

        <sweet-modal ref="modalFilesDeleted" hide-close-button blocking>
            The files were deleted succesfully. Returnung to the main screen

            <button slot="button" class="btn btn-primary" @click="returnHomeScreen">Ok</button>
        </sweet-modal>
    </div>
</template>

<script>
import { SidebarMenu } from 'vue-sidebar-menu'
import 'vue-sidebar-menu/dist/vue-sidebar-menu.css'
import moment from 'moment'
import trash from 'trash'
import del from 'del'
const shell = require('electron').shell;

import { Menu } from './trashcanSideMenu.js'

export default {
    components: {
        SidebarMenu
    },
    data() {
        return {
            menu: Menu,

            fields: [
                { key: 'spare', label: "" },
                { key: 'fileName', label: "Name" },
                { key: 'path', label: "Path" },
                { key: 'size', label: "Size" },
                { key: 'createDate', label: "Created Date" }
            ],
            tableItems: []
        }
    },
    beforeMount() {
        const trash = this.$store.getters.getTrash;
        trash.forEach((media) => {
            this.tableItems.push(media);
        });
    },
    methods: {
        onItemMenuClick(event, item) {
            switch (item.id) {
                case "ignore":
                default:
                    break;
                case "deleteAll":
                    this.$refs.modalConfirmDelete.open();
                    break;
                case "spareAll":
                    this.$refs.modalConfirmSpare.open();
                    break;
                case "goHome":
                    this.$router.push('/home');
            }
        },

        openFile(path) {
            shell.openItem(path);
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

        spareFile(file) {
            this.tableItems.splice( this.tableItems.indexOf(file), 1 );
        },

        spareFiles() {
            this.tableItems.forEach((file) => {
                this.$store.dispatch({
                    type: "removeItem",
                    item: file
                });
            });

            this.$router.push({ path: "/home" });
        },

        deleteFiles(definitively) {
            let paths = [];

            for (let i = 0; i < this.tableItems.length; i++) {
                const media = this.tableItems[i];
                if (!paths.includes(media.path)) {
                    paths.push(media.path);
                }
            }

            if (!definitively) {
                (async () => {
                    await trash(paths);
                })();
            } else {
                (async () => {
                    await del(paths);
                })();
            }

            this.$refs.modalConfirmDelete.close();
            this.$refs.modalFilesDeleted.open();
        },

        returnHomeScreen() {
            this.$store.dispatch({
                type: "setTrash",
                trash: []
            });

            this.$router.push('/home');
        }
    }
}
</script>

<style lang="scss">
.wrapper-trashcan-layout {

    table {
        padding: 15px 15px 0px 15px;
        margin-left: 50px;

        p {
            margin: 0;
            padding: 0.375rem 1rem;
        }

        button {
            font-size: 0.875rem;
        }

        td { 
            overflow: hidden; 
            text-overflow: ellipsis; 
            word-wrap: break-word;
        }
    }

    .even {
        background-color: transparent;
    }

    .odd {
        background-color: lightgrey;
    }

    .even:hover {
        background-color: #eee;
        cursor: pointer;
    }

    .odd:hover {
        background-color: rgb(200, 200, 200);
        cursor: pointer;
    }
}
</style>