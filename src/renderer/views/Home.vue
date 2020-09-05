<template>
    <div class="wrapper section-container">
        <div class="row">
            <div class="col-6">
                <div class="card">
                    <div class="card-body">
                        <input type="text" class="form-control" v-model="input">
                        <button @click="selectDirectory()">click me!</button>
                        <button @click="clearCache()">Clear Cache</button>
                        <button @click="openTrashcan()">See trashcan</button>
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
const electron = require("electron");
const BrowserWindow = electron.remote.BrowserWindow;
const ipcMain = electron.remote.ipcMain;

export default {
    data() {
        return {
            input: '\\\\THEONETOYETBENA\\Roms\\Nintendo - Super Nintento Entertainment System (SNES)'
        };
    },
    methods: {
        selectDirectory() {
            //   electron.remote.dialog.showOpenDialog(
            //     { properties: ["openDirectory"] },
            //     directories => {
                
            //     }
            //   );

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
                    directories: [this.input],
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
.vtl {
    .vtl-drag-disabled {
        background-color: #d0cfcf;
        &:hover {
        background-color: #d0cfcf;
        }
    }
    .vtl-disabled {
        background-color: #d0cfcf;
    }
}
</style>

<style  lang="scss" scoped>
.icon {
  &:hover {
    cursor: pointer;
  }
}
</style>