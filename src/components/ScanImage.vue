<template>
  <div>
    <a href="#/objectDetection">Object Detection Demo</a><br/>
    <button id='scan-button' @click="scan()">scan</button><br/>
    <div id="scan-img-root"></div>
  </div>
</template>

<script>
  /* eslint-disable */
  import ndarray from 'ndarray'
  import ops from 'ndarray-ops'
  // import loadImage from 'blueimp-load-image'
  import _ from 'lodash'
  import { imagenetClasses } from '../data/imagenet'

  const KerasJS = require('keras-js')
  let srcWidth = 0
  let srcHeight = 0
  let srcImg = new Image()

  export default {
    name: 'scan-image',
    data () {
      return {
        modelFilePath: '/src/models/squeezenet_v1.1.bin',
        sampleImgPath: '/src/assets/sample-images/photo.jpg',
        canvasSize: 227,
        inputImgSize: 0,
        model: null,

        items: [], // store the result

        // msg: 'Preparing...',
        // isPredicting: false,
        isReady: false
      }
    },

    created () {
      this.initModel()
    },

    mounted () {
      document.getElementById('scan-button').disabled = true

      srcImg.src = this.sampleImgPath
      srcImg.onload = function () {
        srcWidth = srcImg.width
        srcHeight = srcImg.height
        document.getElementById('scan-button').disabled = false
      }
    },

    methods: {
      test () {
        console.log('test')
      },
      async initModel () {
        this.model = new KerasJS.Model({
          filepath: this.modelFilePath,
          gpu: true,
          filesystem: true
        })
        await this.model.ready()
      },

      insertNewCanva (
        imagePath, canvasSize,
        imgX = 0, imgY = 0, imgW = canvasSize, imgH = canvasSize,
        cvX = 0, cvY = 0, cvW = canvasSize, cvH = canvasSize
      ) {
        // create a new canvas
        const canvas = document.createElement('canvas')
        const file = document.getElementById('scan-img-root')
        file.appendChild(canvas)
        canvas.className = 'scanned-imgs'
        canvas.width = canvasSize
        canvas.height = canvasSize
        canvas.style.margin = '5px'
        canvas.style.border = '1px solid darkred'

        // define draw area
        if (imgW !== imgH) {
          if (imgW > imgH) {
            const movement = (canvasSize / imgW) * ((imgW - imgH) / 2)
            cvY += movement
            cvH -= 2 * movement
          } else {
            const movement = (canvasSize / imgH) * ((imgH - imgW) / 2)
            cvX += movement
            cvW -= 2 * movement
          }
        }

        const ctx = canvas.getContext('2d')
        ctx.drawImage(
          srcImg,
          imgX, imgY, imgW, imgH,
          cvX, cvY, cvW, cvH
        )
        this.objectDetection(canvas, imgX, imgY, imgW, imgH)
        // return canvas
      },

      scan () {
        // original picture
        this.insertNewCanva(
          this.sampleImgPath, this.canvasSize,
          0, 0, srcWidth, srcHeight
        )
        // this.objectDetection(originalImgCanvas, 0, 0, srcWidth, srcHeight)

        let scannerSize = srcWidth < srcHeight ? srcWidth : srcHeight
        let scannerLayer = 0

        while (scannerSize > 32 && scannerLayer < 3) {
          let x = 0
          let y = 0
          let inputImgW = scannerSize
          let inputImgH = scannerSize

          for (y; y < srcHeight; y += scannerSize / 2) {
            x = 0
            console.log(y)
            inputImgH = scannerSize
            if (y + scannerSize > srcHeight) {
              inputImgH = srcHeight - y
            }
            for (x; x < srcWidth; x += scannerSize / 2) {
              inputImgW = scannerSize
              if (x + scannerSize > srcWidth) {
                inputImgW = srcWidth - x
              }
              this.insertNewCanva(
                this.sampleImgPath, this.canvasSize,
                x, y, inputImgW, inputImgH
              )
              // this.objectDetection(canvas, x, y, inputImgW, inputImgH)
            }
          }
          console.log(scannerSize, scannerLayer)
          scannerLayer++
          scannerSize /= 2
        }
      },

      async objectDetection (canvas, x = null, y = null, width = null, height = null) {

        const ctx = canvas.getContext('2d')
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const output = await this.runModel(imageData)
        const result = output[0]
        console.log(result.name)

        if (result.probability > 0.5) {
          this.items.push({ item_name: result.name, x: x, y: y, width: width, height: height })
        }
      },

      async runModel (imageData) {
        const start = new Date().getTime()

        // preprocess image data
        const preprocessedData = this.preprocess(imageData)
        const inputName = this.model.inputLayerNames[0]

        // recognize
        const outputName = this.model.outputLayerNames[0]
        const inputData = { [inputName]: preprocessedData }
        const outputData = await this.model.predict(inputData)

        let output = outputData[outputName]
        // console.log(output)
        output = this.imagenetClassesTopK(output, 1)

        const end = new Date().getTime()
        console.log('Predict Time: ', end - start, 'ms')
        return output
      },

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

</style>
