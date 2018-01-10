<template>
  <div>
    <a href="#/objectDetection">Object Detection Demo</a><br/>
    <button id="scan-button" @click="scan">Scan</button><br/>
    <div id="scan-img-root"></div>
  </div>
</template>

<script>
  import ndarray from 'ndarray'
  import ops from 'ndarray-ops'
  import _ from 'lodash'
  import { imagenetClasses } from '../data/imagenet'

  const KerasJS = require('keras-js')

  export default {
    name: 'scan-image',

    data: function () {
      return {
        modelFilePath: '/src/models/squeezenet_v1.1.bin',
        sampleImgPath: '/src/assets/sample-images/photo.jpg',
        canvasSize: 227,
        inputImgSize: 0,
        model: null,
        srcImg: new Image(),
        items: [],
        index: 0
      }
    },

    mounted () {
      this.initModel()
      this.srcImg.src = this.sampleImgPath
    },

    methods: {
      async initModel () {
        document.getElementById('scan-button').disabled = true
        this.model = new KerasJS.Model({
          filepath: this.modelFilePath,
          gpu: true,
          filesystem: true
        })

        await this.model.ready()
        document.getElementById('scan-button').disabled = false
      },

      async objectDetection (x, y, width, height) {
        let imageData = this.insertNewCanvas(
          this.canvasSize,
          x,
          y,
          width,
          height
        )

        const output = await this.runModel(imageData)
        const result = output[0]

        console.log(result.name, result.probability)

        if (result.probability > 0.5) {
          const item = {
            item_name: result.name,
            probability: result.probability,
            x: x,
            y: y,
            width: width,
            height: height
          }

          this.items.push(item)
        }
      },

      // testX (arg) {
      //   console.log(arg)
      // },

      async scan () {
        const start = new Date().getTime()

        // original picture
        const srcImgWidth = this.srcImg.width
        const srcImgHeight = this.srcImg.height
        let inputImgX = 0
        let inputImgY = 0
        let inputImgW = srcImgWidth
        let inputImgH = srcImgHeight

        // let testX = function (arg) {
        //   console.log(inputImgW)
        // }

        // this.index++
        // this.$worker.run(
        //   (arg) => console.log(arg), [inputImgW]
        // )
        await this.objectDetection(inputImgX, inputImgY, inputImgW, inputImgH)

        let scannerSize = srcImgWidth < srcImgHeight ? srcImgWidth : srcImgHeight
        let scannerLayer = 0

        // scan parts of picture
        while (scannerSize > 32 && scannerLayer < 3) {
          inputImgX = 0
          inputImgY = 0
          inputImgW = scannerSize
          inputImgH = scannerSize

          for (inputImgY; inputImgY < srcImgHeight; inputImgY += scannerSize / 2) {
            inputImgX = 0
            inputImgH = scannerSize

            if (inputImgY + scannerSize > srcImgHeight) {
              inputImgH = srcImgHeight - inputImgY
            }

            for (inputImgX; inputImgX < srcImgWidth; inputImgX += scannerSize / 2) {
              inputImgW = scannerSize

              if (inputImgX + scannerSize > srcImgWidth) {
                inputImgW = srcImgWidth - inputImgX
              }

              this.index++
              // if (this.index < 27) {
              //   this.$worker.run(
              //     function () {
              //       console.log('THIS', this)
              //       // await this.objectDetection(inputImgX, inputImgY, inputImgW, inputImgH)
              //     }
              //   )
              // }
              await this.objectDetection(inputImgX, inputImgY, inputImgW, inputImgH)
            }
          }

          scannerLayer++
          scannerSize /= 2
        }

        for (let i in this.items) {
          console.log(this.items[i].item_name)
        }

        const end = new Date().getTime()

        console.log('Total Scan Time: ', end - start, 'ms')
      },

      async runModel (imageData) {
        const start = new Date().getTime()

        // preprocess image data
        const preprocessedData = this.preprocess(imageData)
        const inputName = this.model.inputLayerNames[0]
        const outputName = this.model.outputLayerNames[0]
        const inputData = {
          [inputName]: preprocessedData
        }

        // recognize
        const outputData = await this.model.predict(inputData)
        let output = outputData[outputName]
        output = this.imagenetClassesTopK(output, 1)

        const end = new Date().getTime()
        console.log('Predict Time: ', end - start, 'ms')
        return output
      },

      insertNewCanvas (
        canvasSize,
        imgX = 0,
        imgY = 0,
        imgW = canvasSize,
        imgH = canvasSize,
        cvX = 0,
        cvY = 0,
        cvW = canvasSize,
        cvH = canvasSize
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

        const ctx = canvas.getContext('2d')

        ctx.drawImage(
          this.srcImg,
          imgX,
          imgY,
          imgW,
          imgH,
          cvX = 0,
          cvY = 0,
          cvW = canvasSize,
          cvH = canvasSize
        )

        return ctx.getImageData(0, 0, canvasSize, canvasSize)
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
