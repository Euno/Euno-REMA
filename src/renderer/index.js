import Vue from 'vue'
import App from './App'

import VueRouter from 'vue-router'
Vue.use(VueRouter);

import router from './router'

new Vue({
    router,
    render: h => h(App)
}).$mount('#app')
