<template>
    <div>{{ jsonString }}</div>
</template>

<script>
import store from "../store/index";

export default {
    mounted() {
        this.duplicateGroups = store.getters.getDuplicates;
        this.jsonString = JSON.stringify(this.duplicateGroups);

        console.log(this.duplicateGroups);
    },
    data() {
        return {
            duplicateGroups: [],
            jsonString: ''
        }
    }
}
</script>