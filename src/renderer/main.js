import Vue from 'vue'

import '@fortawesome/fontawesome-free/css/brands.css';
import '@fortawesome/fontawesome-free/css/regular.css';
import '@fortawesome/fontawesome-free/css/solid.css';
import '@fortawesome/fontawesome-free/css/fontawesome.css';

import App from './App'
import router from './router'
import store from './store'

import BootstrapVue from 'bootstrap-vue'

if (!process.env.IS_WEB)
  Vue.use(require('vue-electron'))

Vue.config.productionTip = false

Vue.use(BootstrapVue)

/* eslint-disable no-new */
new Vue({
  components: { App },
  router,
  store,
  template: '<App/>'
}).$mount('#app')
