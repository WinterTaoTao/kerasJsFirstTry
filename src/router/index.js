import Vue from 'vue'
import Router from 'vue-router'
import ScanImage from '../components/ScanImage'
import ObjectDetectionTry from '../components/ObjectDetectionTry'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'ScanImage',
      component: ScanImage
    },
    {
      path: '/objectDetection',
      name: 'ObjectDetectionDemo',
      component: ObjectDetectionTry
    }
  ]
})
