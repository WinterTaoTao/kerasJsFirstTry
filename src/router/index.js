import Vue from 'vue'
import Router from 'vue-router'
import ScanImage from '../components/ScanImage'
import ObjectDetectionTry from '../components/ObjectDetectionTry'
import KeyframesExtractorTry from '../components/KeyframesExtractorTry'

Vue.use(Router)

export default new Router({
  mode: 'history',
  routes: [
    {
      path: '/single-picture',
      name: 'ScanImage',
      component: ScanImage
    },
    {
      path: '/objectDetection',
      name: 'ObjectDetectionDemo',
      component: ObjectDetectionTry
    },
    {
      path: '/',
      name: 'KeyframesExtractorTry',
      component: KeyframesExtractorTry
    }
  ]
})
