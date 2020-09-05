<template>
    <div class="card card-searching-media">
        <div class="card-body">
            <div class="progress">
                <radial-progress-bar
                    :diameter="200"
                    :completed-steps="completedSteps"
                    :total-steps="totalSteps"
                    startColor="#3480eb"
                    stopColor="#3480eb"
                    :strokeWidth="20">

                    <p>{{ percentage }}</p>
                </radial-progress-bar>
            </div>
            
            <div>
                <step-progress :steps="steps" :current-step="currentStep" activeColor="#3480eb" icon-class="fa fa-check"></step-progress>
            </div>
            <hr>
            <div class="progressMessage">
                <p>Total time: {{ totalTimePassed }} | Current step: {{ stepTimePassed }} | Estimate time remaining (step): {{ stepTimeRemaining }}</p>
                <p>{{ message }}</p>
            </div>
        </div>
    </div>
</template>

<script>
import RadialProgressBar from './RadialProgressBar';
import StepProgress from 'vue-step-progress';
import 'vue-step-progress/dist/main.css';

const electron = require('electron');
const ipcMain  = electron.remote.ipcMain;
const moment = require('moment');

export default {
    components: {
        RadialProgressBar,
        StepProgress
    },
    data() {
        return {
            processFinished: false,
            steps: ["Get files", "Process files", "Compare files"],
            currentStep: 0,

            message: "Iterating folders...",
            totalSteps: 0,
            completedSteps: 0,

            totalTimer: undefined,
            startTime: undefined,
            totalTimePassed: "00:00:00",

            stepTimer: undefined,
            stepStartTime: new Date(),
            stepTimePassed: "00:00:00",
            stepTimeRemaining: "",

            totalDupes: 0,

            mediaIteratorWorkerPId: 0
        }
    },
    mounted() {
        ipcMain.emit("hideMainWindow");

        // NECESARRY TO KILL THE WORKER WHEN RELOADING
        window.addEventListener('beforeunload', () => {
            process.kill(this.mediaIteratorWorkerPId);
        });

        window.onbeforeunload = (e) => {
            if (!this.processFinished) {
                e.returnValue = false;
            }
        };

        this.startTime = new Date();

        this.iterate();
    },
    beforeDestroy() {
        ipcMain.emit("showMainWindow");
    },
    methods: {
        iterate() {
            const preparedSearch = this.$store.getters.getPreparedSearch.preparedSearch;

            // Start cron
            this.totalTimer = setInterval(this.clockRunning, 1000);
            this.stepTimer = setInterval(this.clockRunningStep, 1000);

            // TODO: deal with directory array
            ipcMain.emit("runWorker", {
                file: `mediaIterator.worker.js`,
                params: [preparedSearch.directories, preparedSearch.excludedDirectories, preparedSearch.extensions],
                listeners: {
                    fileFounded: (filePath) => {
                        this.message = `Iterating folders... Found file ${filePath}`;
                    },
                    filesFounded: (filesCount) => {
                        clearInterval(this.stepTimer);
                        this.stepStartTime = new Date();
                        this.stepTimePassed = "00:00:00";
                        this.stepTimer = setInterval(this.clockRunningStep, 1000);
                        this.currentStep = 1;
                        
                        this.message = `Done iterating folders... ${filesCount} files founded.`;
                        this.totalSteps = filesCount;
                    },
                    onException: (exception) => {
                        console.error(exception);
                    },
                    onFileProcessed: (hash) => {
                        this.completedSteps++;
                        this.message = `Processing files. ${this.totalSteps - this.completedSteps} files remaining...`

                        if (this.totalSteps - this.completedSteps === 0) {
                            this.message = "Processing finished. Now starting the compare algorithm";
                        }
                    },
                    filesToCompare: (compareCount) => {
                        clearInterval(this.stepTimer);
                        this.stepStartTime = new Date();
                        this.stepTimePassed = "00:00:00";
                        this.stepTimer = setInterval(this.clockRunningStep, 1000);
                        this.currentStep = 2;

                        this.completedSteps = 0;
                        this.totalSteps = compareCount;
                    },
                    onFileCompared: (file) => {
                        this.completedSteps++;
                        this.message = `Comparing files. ${this.totalSteps - this.completedSteps} files remaining...`

                        if (this.totalSteps - this.completedSteps === 0) {
                            this.message = "Finishing the algorithm...";
                        }
                    },
                    processFinished: () => {
                        clearInterval(this.totalTimer);
                        clearInterval(this.stepTimer);
                        this.processFinished = true;
                        this.message = "All done. Redirecting to the selection screen";
                        this.currentStep = 3;

                        setTimeout(() => {
                            ipcMain.emit("closeWindow", { 
                                name: "comparator",
                                redirectTo: "compare"
                            });
                        }, 5000);
                    }
                },
                callback: (pid) => {
                    this.mediaIteratorWorkerPId = pid;
                }
            });
        },
        clockRunning(){
            var currentTime = new Date()
            , timeElapsed = new Date(currentTime - this.startTime)
            , hour = timeElapsed.getUTCHours()
            , min = timeElapsed.getUTCMinutes()
            , sec = timeElapsed.getUTCSeconds()
            , ms = timeElapsed.getUTCMilliseconds();

            this.totalTimePassed = 
                this.zeroPrefix(hour, 2) + ":" + 
                this.zeroPrefix(min, 2) + ":" + 
                this.zeroPrefix(sec, 2);
        },
        clockRunningStep(){
            var currentTime = new Date()
            , timeElapsed = new Date(currentTime - this.stepStartTime)
            , hour = timeElapsed.getUTCHours()
            , min = timeElapsed.getUTCMinutes()
            , sec = timeElapsed.getUTCSeconds()
            , ms = timeElapsed.getUTCMilliseconds();

            this.stepTimePassed = 
                this.zeroPrefix(hour, 2) + ":" + 
                this.zeroPrefix(min, 2) + ":" + 
                this.zeroPrefix(sec, 2);
        },
        zeroPrefix(num, digit) {
            var zero = '';
            for(var i = 0; i < digit; i++) {
                zero += '0';
            }
            return (zero + num).slice(-digit);
        }
    },
    computed: {
        percentage() {
            const p = (this.completedSteps * 100 / this.totalSteps).toFixed(2);
            return isNaN(p) ? "0.00%" : `${p}%`;
        }
    },
    watch: {
        //estimateTimeRemaining
        stepTimePassed: {
            handler() {
                const currentTime = new Date();
                const elapsed = currentTime - this.stepStartTime;
                const timePer = elapsed / (this.completedSteps === 0 ? 1 : this.completedSteps);
                const tasksRemaining = this.totalSteps - this.completedSteps;
                const millisecondsRemaining = tasksRemaining * timePer;
                const duration = moment.duration(millisecondsRemaining, 'milliseconds');

                this.stepTimeRemaining = 
                    this.zeroPrefix(duration.hours(), 2) + ":" + 
                    this.zeroPrefix(duration.minutes(), 2) + ":" + 
                    this.zeroPrefix(duration.seconds(), 2);
            }, deep: true
        }
    }
}
</script>

<style lang="scss">
.card-searching-media {
    margin-bottom: 0;
    
    .progress-container {
        margin: 10px;
    }

    .progress {
        height: 200px;
        display:flex;
        justify-content:center;
        align-items:center;
        border: 0;
        background-color: #FFF;
    }
    
    .step-progress__wrapper {
        margin-bottom: 40px;
    }
}

</style>