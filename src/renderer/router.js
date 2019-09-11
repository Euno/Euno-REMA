import Router from 'vue-router'

//Modules
import Start from './views/Start'
import Settings from './views/Settings'

const router = new Router({
    routes: [
        {
            path: "/",
            name: "Start",
            component: Start
        },
        {
            path: "/settings",
            name: "Settings",
            component: Settings
        }
    ]
});

export default router;