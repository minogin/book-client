import Vue from 'vue'
import App from '@/components/App'
import router from '@/router/router'
import store from '@/services/store'
import drr from '@/components/drr/drr'
import VeeValidate from 'vee-validate';
import VModal from 'vue-js-modal'

Vue.component('drr', drr)
Vue.use(VeeValidate)
Vue.use(VModal)

Vue.config.productionTip = false  // TODO

new Vue({
  el: '#app',
  router,
  store,
  components: { App },
  template: '<App/>'
})
