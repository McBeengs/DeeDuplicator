<template>
    <div class="wrapper section-container">
        <div class="card">
            <div class="card-body">
                <div class="buttons">
                    <button class="btn btn-primary" @click="selectDirectory()">Add directory</button>
                    <button class="btn btn-primary" @click="openTrashcan()">See trashcan</button>
                    <button class="btn btn-danger" @click="clearCache()">Clear Cache</button>
                    <button class="btn btn-success" @click="start()">click me!</button>
                </div>
                <br>
                <div class="row">
                    <div class="col-6">
                        <h3>Folders to include</h3>
                    </div>
                    <div class="col-6">
                        <h3>Folders to exclude</h3>
                    </div>
                </div>
                <div class="row">
                    <div class="col-12">
                        <v-multiselect-listbox :options="listBoxesOptions" v-model="selectedListBoxedOptions"></v-multiselect-listbox>
                    </div>
                </div>
            </div>
        </div>

        <sweet-modal icon="warning" ref="modalComparisonInProgress">
            There is already a comparison going on since the last time the app was closed.
            Scanning again would override any decisions made about the duplicates checked. Are you sure?

            <button slot="button" class="btn btn-warning" @click="startSearchProcess" style="margin-right: 10px; ">Scan again</button>
            <button slot="button" class="btn btn-primary" @click="$router.push('/compare')">Continue comparison</button>
        </sweet-modal>
    </div>
</template>

<script>
import vMultiselectListbox from 'vue-multiselect-listbox';


const electron = require("electron");
const BrowserWindow = electron.remote.BrowserWindow;
const ipcMain = electron.remote.ipcMain;

export default {
    components: {
        "v-multiselect-listbox" : vMultiselectListbox
    },
    data() {
        return {
            listBoxesOptions: ["E:\\"], // "D:\\The Vault\\Real", "D:\\Windows\\Downloads\\[JDownloader]", "E:\\", "F:\\Torrents"
            selectedListBoxedOptions: []
        };
    },
    methods: {
        selectDirectory() {
            electron.remote.dialog.showOpenDialog({ properties: ["openDirectory"] }, (directories) => {
                this.listBoxesOptions.push(...directories);
                this.listBoxesOptions = Array.from(new Set(this.listBoxesOptions));
            });
        },

        start() {
            if (this.$store.getters.checkIfHasComparisonUnfinished) {
                this.$refs.modalComparisonInProgress.open();
            } else {
                this.startSearchProcess();
            }
        },

        clearCache() {
            this.$store.dispatch({
                type: "setDuplicates",
                duplicates: []
            });

            this.$store.dispatch({
                type: "setTrash",
                trash: []
            });

            console.log(this.listBoxesOptions);
        },

        openTrashcan() {
            this.$router.push({ path: '/trashcan' });
        },

        startSearchProcess() {
            this.$store.dispatch({
                type: "setDuplicates",
                duplicates: []
            });

            // ["mp4", "m4v", "avi", "wmv", "3gp", "webm", "mpg", "mpeg", "mov", "flv", "mkv", "divx"]
            // ["png", "jpg", "jpeg", "gif"]
            // ["zip", "rar"]

            this.$store.dispatch({
                type: "setPreparedSearch",
                preparedSearch: {
                    directories: [...this.listBoxesOptions],
                    excludedDirectories: [...this.selectedListBoxedOptions],
                    extensions: ["zip", "rar"]
                }
            });

            ipcMain.emit("showWindow", {
                name: "comparator",
                title: "File Searcher and Comparer - DeeDuplicator",
                route: "progress",
                width: 915,
                height: 550,
                frameless: true
            });
        }
    }
};
</script>

<style lang="scss">
input.msl-search-list-input {
    display: none;
}

.msl-multi-select {
    width: 100%;
}

.msl-searchable-list__items {
    width: 100%;
    min-width: 300px;
}
</style>
