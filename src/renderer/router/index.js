import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

export default new Router({
    routes: [
        {
            path: '*',
            redirect: '/home'
        },
        {
            path: '/home',
            component: require('@/views/Home').default
        },
        {
            path: '/progress',
            component: require('@/views/SearchingMedia/SearchingMedia').default
        },
        {
            path: '/compare',
            component: require('@/views/ComparingMedia/ComparingMedia.vue').default
        },
        {
            path: '/trashcan',
            component: require('@/views/Trashcan/Trashcan.vue').default
        }
    ]
})
