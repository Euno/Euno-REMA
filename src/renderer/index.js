import Vue from 'vue'
import App from './App'

import VueRouter from 'vue-router'
Vue.use(VueRouter);

import ElementUI from 'element-ui'
import '@/assets/element-ui/index.css';
import router from './router'

Vue.use(ElementUI);

new Vue({
    router,
    render: h => h(App)
}).$mount('#app')
