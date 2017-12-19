import Vue from 'vue'
import Router from 'vue-router'
// import HelloWorld from '@/components/HelloWorld'
// import PredictionTry from '../components/PredictionTry'
import ObjectDetectionTry from '../components/ObjectDetectionTry'
import ScanImage from '../components/ScanImage'

Vue.use(Router)

export default new Router({
  routes: [
    // {
    //   path: '/',
    //   name: 'HelloWorld',
    //   component: HelloWorld
    // },
    // {
    //   path: '/',
    //   name: 'PredictionTry',
    //   component: PredictionTry
    // },
    {
      path: '/',
      name: 'ScanImage',
      component: ScanImage
    },
    {
      path: '/objectDetection',
      name: 'ObjectDetectionTry',
      component: ObjectDetectionTry
    }
  ]
})
