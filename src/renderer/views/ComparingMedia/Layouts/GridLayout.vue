<template>
    <div class="wrapper-grid-layout">
        <div class="header-container">
            <div class="card">
                <div class="card-body">
                    <b-form inline>
                        <div class="form-group">
                            <label class="mr-sm-2">Files per Page: </label>
                            <b-form-select v-model="filesPerPage" :options="optionsPerPageSelection"></b-form-select>
                        </div>

                        <p class="ml-sm-2 mr-sm-2 info-label">
                            {{ totalFilesSelected }} files selected from a total of {{ tableItems.length }}. Actual save of {{ formatBytes(totalBytesSelected) }}
                        </p>

                        <div class="form-group">
                            <b-pagination
                                v-model="currentPage"
                                :total-rows="tableItems.length"
                                :per-page="filesPerPage"
                                aria-controls="gridTable">
                            </b-pagination>
                        </div>
                    </b-form>
                </div>
            </div>
        </div>

        <b-table id="gridTable" :items="tableItems" :fields="fields" :per-page="filesPerPage" 
            :current-page="currentPage" :tbody-tr-class="rowClass" @row-clicked="rowClick">
            <template v-slot:cell(checked)="data">
                <span v-if="data.item.checked" @click="rowClick"><i class="fas fa-trash-alt" @click="rowClick"></i></span>
                <!-- <input type="checkbox" v-model="data.item.checked" v-on:input="checkboxClick(data.item)"> -->
            </template>
            <template v-slot:cell(fileName)="data" >
                <button class="btn btn-link media-button" @click="openFile(data.item.path)" @contextmenu="$easycm($event,$root,1); contextMenuOpened(data.item)">
                    {{ data.item.fileName.length > 45 ? data.item.fileName.substring(0, 45) + '...' : data.item.fileName  }}
                </button>
            </template>
            <template v-slot:cell(path)="data" >
                <p @contextmenu="$easycm($event,$root,1); contextMenuOpened(data.item)">{{ data.item.path }}</p>
            </template>
            <template v-slot:cell(size)="data" >{{ formatBytes(data.item.size) }}</template>
            <template v-slot:cell(createDate)="data"><p style="min-width: 100px;"> {{ formatDate(data.item.createDate) }}</p></template>
        </b-table>

        <easy-cm :list="contextMenuList" :tag="1" @ecmcb="contextMenuOptionClicked" :itemWidth="330"></easy-cm>
    </div>
</template>

<script>
import moment from 'moment'
const shell = require('electron').shell;

export default {
    props: ["duplicateGroups", "openEachGroupLayout"],
    data() {
        return {
            fields: [
                { key: 'checked', label: "" },
                { key: 'fileName', label: "Name" },
                { key: 'path', label: "Path" },
                { key: 'size', label: "Size" },
                { key: 'createDate', label: "Created Date" }
            ],
            contextMenuItem: {},
            contextMenuList: [{ text: "Open \"Compare Group by Group\" with this file", icon: "" }],
            optionsPerPageSelection: [50, 100, 1000, 5000, 10000],
            tableItems: [],
            currentPage: 1,

            filesPerPage: 50,
            totalFilesSelected: 0,
            totalBytesSelected: 0
        }
    },
    beforeMount() {
        this.calculateSelectedMedias();
    },
    methods: {
        calculateSelectedMedias() {
            let groupOdd = false;

            for (let i = 0; i < this.duplicateGroups.length; i++) {
                const group = this.duplicateGroups[i];

                for (let j = 0; j < group.length; j++) {
                    let media = group[j];
                    media.cssClass = groupOdd ? "odd" : "even";
                    if (media.checked) {
                        this.totalFilesSelected++;
                        this.totalBytesSelected += media.size;
                    }
                    this.tableItems.push(media)
                }
                groupOdd = !groupOdd;   
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

        rowClass(item, type) {
            if (!item || type !== 'row') {
                return;
            }

            return item.cssClass;
        },
        
        rowClick(item) {
            item.checked = !item.checked;

            if (item.checked) {
                this.totalFilesSelected++;
                this.totalBytesSelected += item.size;
            } else {
                this.totalFilesSelected--;
                this.totalBytesSelected -= item.size;
            }
        },

        openFile(path) {
            shell.openItem(path);
        },

        formatBytes(bytes, decimals) {
            if (bytes === 0) {
                return '0 Bytes';
            }

            if (isNaN(bytes)) {
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
    },
    watch: {
        '$store.state.ComparingFiles.refreshDuplicateGroups.refreshDuplicateGroups': function() {
            this.totalFilesSelected = 0;
            this.totalBytesSelected= 0;
            this.calculateSelectedMedias();
        }
    }
}
</script>

<style lang="scss">
.wrapper-grid-layout {
    table {
        padding: 15px 15px 0px 15px;
        margin-top: 55px;

        p {
            margin: 0;
        }

        tbody tr td:nth-child(1) {
            min-width: 45px;
            height: 100%;
            padding-right: 0;
            padding-top: 8px;
            padding-bottom: 8px;

            span i {
                max-width: 45px;
            }
        }

        .media-button {
            text-align: left;
            padding: 0;
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

    span i {
        padding: 10px;
        border-radius: 20px;
        color: #eee;
        background-color: rgba($color: red, $alpha: 0.6)
    }

    .header-container {
        position: fixed;
        width: 100%;
        margin-top: -55px;

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
}
</style>