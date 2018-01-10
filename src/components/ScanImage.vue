<template>
  <div>
    <a href="#/objectDetection">Object Detection Demo</a><br/>

    <div style="text-align: left">
      <div id="rectangle"></div>
      <img v-bind:src="sampleImgPath">
    </div>

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

        position: {
          INDEPENDENT: 0,
          INTERSECTION: 1,
          CONTAINED: 2,
          CONTAIN: 3
        }
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

          // this.items.push(item)
          this.addItem(item)
        }
      },

      async scan () {
        this.items = []
        let myNode = document.getElementById('scan-img-root')
        while (myNode.firstChild) {
          myNode.removeChild(myNode.firstChild)
        }

        const start = new Date().getTime()

        // original picture
        const srcImgWidth = this.srcImg.width
        const srcImgHeight = this.srcImg.height
        let inputImgX = 0
        let inputImgY = 0
        let inputImgW = srcImgWidth
        let inputImgH = srcImgHeight

        // this.$worker.run(
        //   (arg) => console.log(arg), [inputImgW]
        // )

        await this.objectDetection(inputImgX, inputImgY, inputImgW, inputImgH)

        let scannerSize = srcImgWidth < srcImgHeight ? srcImgWidth : srcImgHeight
        let scannerLayer = 0

        // scan parts of picture
        while (scannerSize > 32 && scannerLayer < 2) {
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

              await this.objectDetection(inputImgX, inputImgY, inputImgW, inputImgH)
            }
          }

          scannerLayer++
          scannerSize /= 2
        }

        for (let i in this.items) {
          console.log(this.items[i].item_name, this.items[i].probability)
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
      },

      async addItem (item) {
        let shouldAdd = true
        for (let index = 0; index < this.items.length; index++) {
          const compareItem = this.items[index]
          const itemName = item.item_name
          const _itemName = compareItem.item_name

          if (itemName === _itemName) {
            const probability = item.probability
            const _probability = compareItem.probability
            const pos = this.positionRelationship(item, compareItem)

            if (pos === this.position.CONTAINED || pos === this.position.CONTAIN || pos === this.position.INTERSECTION) {
              console.log('contain')
              if (probability >= _probability) {
                this.items.splice(index, 1)
                index--
              } else {
                shouldAdd = false
              }
            }
            // } else if (pos === this.position.INTERSECTION) {
            //   console.log('intersection')
            //   // detect intersection part
            //   const intersectionX = Math.max(item.x, compareItem.x)
            //   const intersectionY = Math.max(item.y, compareItem.y)
            //   const intersectionW = Math.min(item.x + item.width, compareItem.x + compareItem.width) - intersectionX
            //   const intersectionH = Math.min(item.y + item.height, compareItem.y + compareItem.height) - intersectionY
            //   await this.objectDetection(intersectionX, intersectionY, intersectionW, intersectionH)
            //
            //   // detect union part
            //   const unionX = Math.min(item.x, compareItem.x)
            //   const unionY = Math.min(item.y, compareItem.y)
            //   const unionW = Math.max(item.x + item.width, compareItem.x + compareItem.width) - unionX
            //   const unionH = Math.max(item.y + item.height, compareItem.y + compareItem.height) - unionY
            //   await this.objectDetection(unionX, unionY, unionW, unionH)
            // }
          }
        }
        if (shouldAdd) {
          this.items.push(item)
        }
      },

      positionRelationship (item, compareItem) {
        const xStart = item.x
        const yStart = item.y
        const xEnd = xStart + item.width
        const yEnd = yStart + item.height
        const _xStart = compareItem.x
        const _yStart = compareItem.y
        const _xEnd = _xStart + compareItem.width
        const _yEnd = _yStart + compareItem.height

        if (xStart >= _xEnd || yStart >= _yEnd || _xStart >= xEnd || _yStart >= yEnd) {
          return this.position.INDEPENDENT // two independent items
        } else if (xStart >= _xStart && yStart >= _yStart && xEnd <= _xEnd && yEnd <= _yEnd) {
          return this.position.CONTAINED // item is contained by compareItem
        } else if (xStart <= _xStart && yStart <= _yStart && xEnd >= _xEnd && yEnd >= _yEnd) {
          return this.position.CONTAIN // item contains compareItem
        } else {
          return this.position.INTERSECTION // two intersection items
        }
      }
    }
  }
</script>

<style>
  #rectangle {
    width: 200px;
    height: 200px;
    border: 4px solid black;
    position: absolute;
  }
</style>
