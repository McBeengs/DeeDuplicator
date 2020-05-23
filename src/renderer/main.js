import Vue from 'vue'

import '@fortawesome/fontawesome-free/css/brands.css';
import '@fortawesome/fontawesome-free/css/regular.css';
import '@fortawesome/fontawesome-free/css/solid.css';
import '@fortawesome/fontawesome-free/css/fontawesome.css';

import App from './App'
import router from './router'
import store from './store'

import BootstrapVue from 'bootstrap-vue'
import VueLazyload from 'vue-lazyload'
import SweetModal from 'sweet-modal-vue/src/plugin.js'
import Vuebar from 'vuebar';
import VueEasyCm from 'vue-easycm'

import * as LazyloadSpinner from './assets/img-lazyload-spinner.gif'

if (!process.env.IS_WEB)
  Vue.use(require('vue-electron'))

Vue.config.productionTip = false

Vue.use(BootstrapVue)
Vue.use(VueLazyload, {
  loading: LazyloadSpinner,
  attempt: 2
})
Vue.use(SweetModal)
Vue.use(Vuebar)
Vue.use(VueEasyCm)

/* eslint-disable no-new */
new Vue({
  components: { App },
  router,
  store,
  template: '<App/>'
}).$mount('#app')
