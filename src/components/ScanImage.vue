<template>
  <div>
    <a href="#/objectDetection">Object Detection Demo</a><br/>
    <a href="#/ky">Key Frames Etractor Demo</a><br/>

    <div id="src-img-div">
      <img id="src-img" v-bind:src="sampleImgPath" style="position: absolute">
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
        sampleImgPath: '/src/assets/sample-images/photo2.jpg',
        canvasSize: 227,
        inputImgSize: 0,
        model: null,
        srcImg: new Image(),
        items: [],
        threshold1: 0.5,
        threshold2: 0.8,

        notCheckList: [],

        position: {
          INDEPENDENT: 0,
          INTERSECTION: 1,
          CONTAINED: 2,
          CONTAIN: 3
        }
      }
    },

    mounted () {
      this.srcImg.src = this.sampleImgPath
      let img = this.srcImg

      img.onload = function () {
        let srcImgDiv = document.getElementById('src-img-div')
        srcImgDiv.style.width = img.width + 'px'
        srcImgDiv.style.height = img.height + 'px'
      }

      this.initModel()
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

        if (result.probability > this.threshold1) {
          const item = {
            item_name: result.name,
            probability: result.probability,
            boundary: {
              x: x,
              y: y,
              width: width,
              height: height
            }
          }

          await this.addItem(item)
        }
      },

      async scan () {
        const start = new Date().getTime()
        this.items = []
        this.notCheckList = []

        let myNode = document.getElementById('scan-img-root')
        while (myNode.firstChild) {
          myNode.removeChild(myNode.firstChild)
        }

        // original picture
        const srcImgWidth = this.srcImg.width
        const srcImgHeight = this.srcImg.height
        let inputImgX = 0
        let inputImgY = 0
        let inputImgW = srcImgWidth
        let inputImgH = srcImgHeight

        await this.objectDetection(inputImgX, inputImgY, inputImgW, inputImgH)

        let scannerSize = srcImgWidth < srcImgHeight ? srcImgWidth : srcImgHeight
        let scannerLayer = 0

        // scan parts of picture
        while (scannerSize > 32 && scannerLayer < 3) {
          inputImgY = 0
          let stepSize = scannerSize / 2

          for (inputImgY; inputImgY < srcImgHeight; inputImgY += stepSize) {
            inputImgX = 0
            inputImgH = scannerSize

            if (inputImgY + scannerSize > srcImgHeight) {
              inputImgH = srcImgHeight - inputImgY
            }

            for (inputImgX; inputImgX < srcImgWidth; inputImgX += stepSize) {
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

        for (let index = 0; index < this.items.length; index++) {
          let item = this.items[index]

          if (item.probability > this.threshold2) {
            console.log(item.item_name, item.probability, item.boundary)

            const objectRectangles = document.createElement('div')
            const objectText = document.createElement('span')
            const file = document.getElementById('src-img-div')

            objectRectangles.appendChild(objectText)
            file.appendChild(objectRectangles)
            objectRectangles.className = 'object-rectangles'

            objectText.innerText = item.item_name + ' ' + item.probability

            objectRectangles.style.width = item.boundary.width + 'px'
            objectRectangles.style.height = item.boundary.height + 'px'
            objectRectangles.style.left = item.boundary.x + 'px'
            objectRectangles.style.top = item.boundary.y + 'px'

            const r = Math.floor(index / this.items.length * 255)
            const g = Math.floor(item.boundary.x / this.srcImg.width * 255)
            const b = Math.floor(item.boundary.y / this.srcImg.height * 255)
            const backColor = 'rgba(' + r + ',' +
              g + ', ' +
              b + ', 0.8)'

            const textColor = 'rgb(' + (255 - r) + ',' +
              (255 - g) + ', ' +
              (255 - b) + ')'

            objectRectangles.style.borderColor = backColor
            objectText.style.backgroundColor = backColor
            objectText.style.color = textColor
          } else {
            this.items.splice(index, 1)
            index = index - 1
          }
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
        imgH = canvasSize
      ) {
        // create a new canvas
        const canvas = document.createElement('canvas')
        const file = document.getElementById('scan-img-root')

        file.appendChild(canvas)
        canvas.className = 'scanned-imgs'
        canvas.width = canvasSize
        canvas.height = canvasSize

        let cvX = 0
        let cvY = 0
        let cvW = canvasSize
        let cvH = canvasSize

        if (imgW > imgH) {
          cvH = canvasSize * (imgH / imgW)
          cvY += (canvasSize - cvH) / 2
        } else if (imgW < imgH) {
          cvW = canvasSize * (imgW / imgH)
          cvX += (canvasSize - cvW) / 2
        }

        const ctx = canvas.getContext('2d')
        ctx.drawImage(
          this.srcImg,
          imgX,
          imgY,
          imgW,
          imgH,
          cvX,
          cvY,
          cvW,
          cvH
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
        if (!this.inNotCheckList(item.boundary)) {
          let shouldAdd = true
          for (let index = 0; index < this.items.length; index++) {
            const compareItem = this.items[index]
            const itemName = item.item_name
            const _itemName = compareItem.item_name

            if (itemName === _itemName) {
              const probability = item.probability
              const _probability = compareItem.probability

              const boundary = item.boundary
              const _boundary = compareItem.boundary

              const pos = this.positionRelationship(boundary, _boundary)

              if (pos === this.position.CONTAINED || pos === this.position.CONTAIN) {
                if (probability >= _probability) {
                  this.items.splice(index, 1)
                  index--
                } else {
                  shouldAdd = false
                }
                // }
              } else if (pos === this.position.INTERSECTION) {
                this.notCheckList.push(boundary)
                if (shouldAdd) {
                  this.items.push(item)
                  shouldAdd = false
                }

                // detect intersection part
                const intersectionX = Math.max(boundary.x, _boundary.x)
                const intersectionY = Math.max(boundary.y, _boundary.y)
                const intersectionW = Math.min(boundary.x + boundary.width, _boundary.x + _boundary.width) - intersectionX
                const intersectionH = Math.min(boundary.y + boundary.height, _boundary.y + _boundary.height) - intersectionY
                await this.objectDetection(intersectionX, intersectionY, intersectionW, intersectionH)

                // detect union part
                const unionX = Math.min(boundary.x, _boundary.x)
                const unionY = Math.min(boundary.y, _boundary.y)
                const unionW = Math.max(boundary.x + boundary.width, _boundary.x + _boundary.width) - unionX
                const unionH = Math.max(boundary.y + boundary.height, _boundary.y + _boundary.height) - unionY
                await this.objectDetection(unionX, unionY, unionW, unionH)
              }
            }
          }
          if (shouldAdd) {
            this.items.push(item)
          }
        }
      },

      positionRelationship (itemBoundary, compareItemBoundary) {
        const xStart = itemBoundary.x
        const yStart = itemBoundary.y
        const xEnd = xStart + itemBoundary.width
        const yEnd = yStart + itemBoundary.height
        const _xStart = compareItemBoundary.x
        const _yStart = compareItemBoundary.y
        const _xEnd = _xStart + compareItemBoundary.width
        const _yEnd = _yStart + compareItemBoundary.height

        if (xStart >= _xEnd || yStart >= _yEnd || _xStart >= xEnd || _yStart >= yEnd) {
          return this.position.INDEPENDENT // two independent items
        } else if (xStart >= _xStart && yStart >= _yStart && xEnd <= _xEnd && yEnd <= _yEnd) {
          return this.position.CONTAINED // item is contained by compareItem
        } else if (xStart <= _xStart && yStart <= _yStart && xEnd >= _xEnd && yEnd >= _yEnd) {
          return this.position.CONTAIN // item contains compareItem
        } else {
          return this.position.INTERSECTION // two intersection items
        }
      },

      inNotCheckList (boundary) {
        for (let i = 0; i < this.notCheckList.length; i++) {
          const _boundary = this.notCheckList[i]
          if (boundary.x === _boundary.x &&
              boundary.y === _boundary.y &&
              boundary.width === _boundary.width &&
              boundary.height === _boundary.height
          ) {
            return true
          }
        }
        return false
      }
    }
  }
</script>

<style>
  #src-img-div {
    margin-left: 50px;
    text-align: left;
    padding: 0;
    position:relative;
  }

  .scanned-imgs {
    margin: 5px;
    border: 1px solid red;
  }

  .object-rectangles {
    width: 200px;
    height: 200px;
    border: 3px solid;
    position: absolute;
    z-index: 1;
  }
</style>
