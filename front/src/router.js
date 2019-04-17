import Vue from 'vue'
import Router from 'vue-router'
import Pen from './views/Pen.vue'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/p/:project',
      name: 'Project',
      component: Pen
    },
    {
      path: '/',
      name: 'home',
      component: Pen
    }
  ]
})
