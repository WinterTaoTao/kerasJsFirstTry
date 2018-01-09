import Vue from 'vue'
import Router from 'vue-router'
import ScanImage from '../components/ScanImage'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'ScanImage',
      component: ScanImage
    }
  ]
})
