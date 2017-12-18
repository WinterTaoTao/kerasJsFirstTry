<template>
  <div>
    <canvas id="input-img"
            v-bind:width="imageSize"
            v-bind:height="imageSize"
    >
    </canvas><br/>
    <!--<img id="input" v-bind:src="sampleImgPath"/>-->
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
  // import {imagenetClassesTopK} from "../util/imagenet";

  const KerasJS = require('keras-js')

  export default {
    name: 'object-detection-try',

    data () {
      return {
        modelFilepath: '/src/models/resnet50.bin',
        // modelFilepath: 'https://transcranial.github.io/keras-js-demos-data/resnet50/resnet50.bin',
        sampleImgPath: '/src/assets/sample-images/dog1.jpg',
        imageSize: 224,
        msg: 'Preparing...',
        output: null,
        isReady: false,
        isPredicting: false
      }
    },
    async created () {
      var start = new Date().getTime()
      this.model = new KerasJS.Model({
        filepath: this.modelFilepath,
        // gpu: false,
        filesystem: true
      })
      this.loadImageToCanva(this.sampleImgPath)
      await this.model.ready()
      this.isReady = true
      this.msg = 'Ready'
      var end = new Date().getTime()
      console.log('Initialize Time: ', end - start, 'ms')
      // // this.runModel()
      // this.$nextTick(function () {
      //   setTimeout(() => {
      //     this.runModel()
      //   }, 10)
      // })
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

      loadImageToCanva (imagePath) {
        loadImage(
          imagePath,
          function (img) {
            const ctx = document.getElementById('input-img').getContext('2d')
            ctx.drawImage(img, 0, 0)
          },
          {
            maxWidth: this.imageSize,
            maxHeight: this.imageSize,
            cover: true,
            crop: true,
            canvas: true,
            crossOrigin: 'Anonymous'
          }
        )
      },

      async runModel () {
        if (this.isReady && !this.isPredicting) {
          var start = new Date().getTime()
          this.isPredicting = true
          console.log('Predicting...', this.isPredicting)

          const ctx = document.getElementById('input-img').getContext('2d')
          const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height)

          const preprocessedData = this.preprocess(imageData)
          const inputName = this.model.inputLayerNames[0]
          // console.log(inputName)
          const outputName = this.model.outputLayerNames[0]
          const inputData = { [inputName]: preprocessedData }
          const outputData = await this.model.predict(inputData)
          this.output = outputData[outputName]
          this.output = this.imagenetClassesTopK(this.output, 5)
          // this.model.predict(inputData).then(outputData => {
          //   this.output = outputData[outputName]
          //   this.isPredicting = false
          // })
          this.isPredicting = false
          this.msg = 'finished'
          var end = new Date().getTime()
          console.log('Predict Time: ', end - start, 'ms')
        } else if (this.isPredicting) {
          this.msg = 'Predicting...Not Finish Yet'
          // console.log('Not ready ')
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
      }
    }
  }
</script>

<style scoped>
#input-img {
  border: 1px solid red;
  /*width: 500px;*/
  /*height: 400px;*/
}
</style>
