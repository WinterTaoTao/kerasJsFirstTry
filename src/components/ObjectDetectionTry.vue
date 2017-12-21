<template>
  <div>
    <canvas id="input-img"
            v-bind:width="canvasSize"
            v-bind:height="canvasSize"
    >
    </canvas><br/>
    <button @click="runModel" :disabled="isPredicting">predict</button>
    <div v-if="msg">{{msg}}</div>
    <div v-for="items in output">
      {{items.name}} {{items.probability}}
    </div>
  </div>
</template>

<script>
  import ndarray from 'ndarray'
  import ops from 'ndarray-ops'
  import loadImage from 'blueimp-load-image'
  import _ from 'lodash'
  import { imagenetClasses } from '../data/imagenet'
  import ScanImage from './ScanImage'

  const KerasJS = require('keras-js')

  export default {
    components: {ScanImage},
    name: 'object-detection-try',

    data () {
      return {
        modelFilePath: '/src/models/squeezenet_v1.1.bin',
        sampleImgPath: '/src/assets/sample-images/dog1.jpg',
        canvasSize: 227,
        msg: 'Preparing...',
        output: null,
        isReady: false,
        isPredicting: false,
        src_width: 0,
        src_height: 0
      }
    },

    created () {
      this.initModel()
    },

    mounted () {
      this.loadImageToCanva(this.sampleImgPath, this.canvasSize)
    },

    methods: {
      preprocess (imageData) {
        const {data, width, height} = imageData

        // data processing
        // see https://github.com/fchollet/keras/blob/master/keras/applications/imagenet_utils.py
        const dataTensor = ndarray(new Float32Array(data), [width, height, 4])
        const dataProcessedTensor = ndarray(new Float32Array(width * height * 3), [width, height, 3])

        ops.subseq(dataTensor.pick(null, null, 2), 103.939)
        ops.subseq(dataTensor.pick(null, null, 1), 116.779)
        ops.subseq(dataTensor.pick(null, null, 0), 123.68)
        ops.assign(dataProcessedTensor.pick(null, null, 0), dataTensor.pick(null, null, 2))
        ops.assign(dataProcessedTensor.pick(null, null, 1), dataTensor.pick(null, null, 1))
        ops.assign(dataProcessedTensor.pick(null, null, 2), dataTensor.pick(null, null, 0))

        return dataProcessedTensor.data
      },

      loadImageToCanva (imagePath, canvaSize) {
        loadImage(
          imagePath,
          function (img) {
            const ctx = document.getElementById('input-img').getContext('2d')
            ctx.drawImage(img, 0, 0, canvaSize, canvaSize)
          },
          {
            crossOrigin: 'Anonymous'
          }
        )
      },

      async runModel () {
        if (this.isReady && !this.isPredicting) {
          const start = new Date().getTime()
          this.isPredicting = true
          console.log('Predicting...', this.isPredicting)

          // load image in canva
          const ctx = document.getElementById('input-img').getContext('2d')
          const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height)

          // preprocess image data
          const preprocessedData = this.preprocess(imageData)
          const inputName = this.model.inputLayerNames[0]

          // recognize
          const outputName = this.model.outputLayerNames[0]
          const inputData = { [inputName]: preprocessedData }
          const outputData = await this.model.predict(inputData)

          this.output = outputData[outputName]
          this.output = this.imagenetClassesTopK(this.output, 5)

          const end = new Date().getTime()
          this.msg = 'Finished: cost ' + (end - start) + 'ms'
          console.log('Predict Time: ', end - start, 'ms')
          this.isPredicting = false
        } else if (this.isPredicting) {
          this.msg = 'Predicting...Not Finish Yet'
        } else {
          this.msg = 'Preparing...Not Ready Yet'
        }
      },

      imagenetClassesTopK (classProbabilities, k = 5) {
        const probs = _.isTypedArray(classProbabilities) ? Array.prototype.slice.call(classProbabilities) : classProbabilities

        const sorted = _.reverse(_.sortBy(probs.map((prob, index) => [prob, index]), probIndex => probIndex[0]))

        const topK = _.take(sorted, k).map(probIndex => {
          const iClass = imagenetClasses[probIndex[1]]
          return {
            id: iClass[0],
            index: parseInt(probIndex[1], 10),
            name: iClass[1].replace(/_/, ' '),
            probability: probIndex[0]
          }
        })
        return topK
      },

      async initModel () {
        this.model = new KerasJS.Model({
          filepath: this.modelFilePath,
          gpu: true,
          filesystem: true
        })
        await this.model.ready()
        this.isReady = true
        this.msg = 'Ready'
      }
    }
  }
</script>

<style scoped>
/*#input-img {*/
  /*border: 1px solid red;*/
  /*!*width: 500px;*!*/
  /*!*height: 400px;*!*/
/*}*/
</style>
