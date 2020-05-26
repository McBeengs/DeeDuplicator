<template>
  <div id="app" v-bar>
    
    <router-view class="darkreader"></router-view>
  </div>
</template>

<script>
  export default {
    name: 'deeduplicator'
  }
</script>

<style lang="scss">
// Import Main styles for this application
@import '@/styles/bootstrap.scss';
@import '@/styles/app.scss';

// important for the "EachGroup.vue"
html, body, #app {
  height: 100%;
}

// Fixing sweet-modal scroll when opening
.sweet-modal, .sweet-content {
  overflow-y: hidden;
}
</style>
