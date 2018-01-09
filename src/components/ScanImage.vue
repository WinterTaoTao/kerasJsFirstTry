<template>
  <div>
    <a href="#/objectDetection">Object Detection Demo</a><br/>
    <button id='scan-button' @click="scan">scan</button><br/>
    <div id="scan-img-root"></div>
  </div>
</template>

<script>
  import ndarray from 'ndarray'
  import ops from 'ndarray-ops'
  // import loadImage from 'blueimp-load-image'
  import _ from 'lodash'
  import { imagenetClasses } from '../data/imagenet'

  const KerasJS = require('keras-js')

  let srcWidth = 0
  let srcHeight = 0
  let srcImg = new Image()
  let isModelReady = false
  let isSrcImgReady = false
  let model = null
  let items = []

  // let index = 0

  // let detectors = []

  export default {
    name: 'scan-image',
    data () {
      return {
        modelFilePath: '/src/models/squeezenet_v1.1.bin',
        sampleImgPath: '/src/assets/sample-images/photo.jpg',
        canvasSize: 227,
        inputImgSize: 0,
        model: null

        // items: [], // store the result

        // msg: 'Preparing...',
        // isPredicting: false,
      }
    },

    created () {
    },

    mounted () {
      this.initModel()
      this.loadSrcImg(this.sampleImgPath)
    },

    methods: {
      async initModel () {
        document.getElementById('scan-button').disabled = true
        model = new KerasJS.Model({
          filepath: this.modelFilePath,
          gpu: true,
          filesystem: true
        })
        await model.ready()
        isModelReady = true
        if (isModelReady && isSrcImgReady) {
          document.getElementById('scan-button').disabled = false
        }
      },

      loadSrcImg (imgPath) {
        document.getElementById('scan-button').disabled = true
        srcImg.src = imgPath
        srcImg.onload = function () {
          srcWidth = srcImg.width
          srcHeight = srcImg.height
          isSrcImgReady = true
          if (isModelReady && isSrcImgReady) {
            document.getElementById('scan-button').disabled = false
          }
        }
      },

      async scan () {
        document.getElementById('scan-button').disabled = true
        // let subImgData = []
        // let detectionFunctionsParallel = []

        const start = new Date().getTime()
        // let index = 0
        // original picture
        let inputImgX = 0
        let inputImgY = 0
        let inputImgW = srcWidth
        let inputImgH = srcHeight

        // let detectors = []

        let imageData = insertNewCanva(
          this.sampleImgPath, this.canvasSize,
          inputImgX, inputImgY, inputImgW, inputImgH
        )

        // let worker = new Worker(function () {
        //   postMessage("I'm working before postMessage('ali').")
        //   this.onmessage = function (event) {
        //     postMessage('Hi ' + event.data)
        //     self.close()
        //   }
        // })
        // worker.postMessage('ali')
        // worker.onmessage = function (e) {
        //   console.log(e.data)
        // }

        // detectors.push(new Worker('/src/components/ObjectDetector/ObjectDetector.js'))
        // const modelJ = JSON.parse(JSON.stringify(model))
        // detectors[0].postMessage({model: modelJ, imgData: imageData})
        // detectors[0].onmessage = function (e) {
        //   const output = e.data
        //   console.log(output[0].name)
        // }

        // index++
        // this.$worker.run((arg) => {
        //   return arg
        // }, [imageData]).then(
        //   async function (result) {
        //     console.log(index)
        //     await objectDetection(result, inputImgX, inputImgY, inputImgW, inputImgH)
        //     index--
        //     if (index === 0) {
        //       const end = new Date().getTime()
        //       console.log('Total Scan Time: ', index, end - start, 'ms')
        //       document.getElementById('scan-button').disabled = false
        //     }
        //   })

        // await objectDetection(imageData, inputImgX, inputImgY, inputImgW, inputImgH)
        // subImgData.push({
        //   imgData: imageData,
        //   imgX: inputImgX, imgY: inputImgY,
        //   imgW: inputImgW, imgH: inputImgH
        // })
        // detectionFunctionsParallel.push(function () {
        // await objectDetection(imageData, inputImgX, inputImgY, inputImgW, inputImgH)
        // })

        let scannerSize = srcWidth < srcHeight ? srcWidth : srcHeight
        let scannerLayer = 0

        // scan parts of picture
        while (scannerSize > 32 && scannerLayer < 2) {
          inputImgX = 0
          inputImgY = 0
          inputImgW = scannerSize
          inputImgH = scannerSize

          for (inputImgY; inputImgY < srcHeight; inputImgY += scannerSize / 2) {
            inputImgX = 0
            // console.log(y)
            inputImgH = scannerSize
            if (inputImgY + scannerSize > srcHeight) {
              inputImgH = srcHeight - inputImgY
            }
            for (inputImgX; inputImgX < srcWidth; inputImgX += scannerSize / 2) {
              inputImgW = scannerSize
              if (inputImgX + scannerSize > srcWidth) {
                inputImgW = srcWidth - inputImgX
              }
              imageData = insertNewCanva(
                this.sampleImgPath, this.canvasSize,
                inputImgX, inputImgY, inputImgW, inputImgH
              )

              // if (index < 27) {
              //   index++
              //   this.$worker.run((arg) => {
              //     return arg
              //   }, [imageData]).then(
              //     async function (result) {
              //       console.log(index)
              //       await objectDetection(result, inputImgX, inputImgY, inputImgW, inputImgH)
              //       index--
              //       if (index === 0) {
              //         const end = new Date().getTime()
              //         console.log('Total Scan Time: ', end - start, 'ms')
              //         document.getElementById('scan-button').disabled = false
              //       }
              //     })
              // }

              await objectDetection(imageData, inputImgX, inputImgY, inputImgW, inputImgH)
              // detectionFunctionsParallel.push(function () {
              // await objectDetection(imageData, inputImgX, inputImgY, inputImgW, inputImgH)
              // })
              // subImgData.push({
              //   imgData: imageData,
              //   imgX: inputImgX, imgY: inputImgY,
              //   imgW: inputImgW, imgH: inputImgH
              // })
            }
          }
          scannerLayer++
          scannerSize /= 2
        }

        for (let i in items) {
          console.log(items[i].item_name)
        }
        // for (let i in subImgData) {
        //   let data = subImgData[i]
        //   console.log(data)
        //   detectionFunctionsParallel.push(async function () {
        //     await objectDetection(data.imgData, data.imgX, data.imgY, data.imgW, data.imgH)
        //   })
        // }
        //
        // async.parallel(detectionFunctionsParallel)

        // subImgData.forEach(function (data) {
        //   objectDetection(data.imgData, data.imgX, data.imgY, data.imgW, data.imgH)
        // })

        const end = new Date().getTime()
        console.log('Total Scan Time: ', end - start, 'ms')
        document.getElementById('scan-button').disabled = false
      }
    }
  }

  // function testX () {
  //   console.log('this is testX')
  //   return 'this is tt'
  // }

  async function objectDetection (imageData, x = null, y = null, width = null, height = null) {
    const output = await runModel(imageData)
    const result = output[0]
    console.log(result.name, result.probability)

    if (result.probability > 0.5) {
      items.push({
        item_name: result.name,
        probability: result.probability,
        x: x,
        y: y,
        width: width,
        height: height
      })
      // console.log(result.name, result.probability)
    }
  }

  async function runModel (imageData) {
    const start = new Date().getTime()
    // console.log('runModel', 2)

    // preprocess image data
    const preprocessedData = preprocess(imageData)
    const inputName = model.inputLayerNames[0]
    const outputName = model.outputLayerNames[0]
    const inputData = { [inputName]: preprocessedData }

    // recognize
    // console.log(inputData)
    const outputData = await model.predict(inputData)

    let output = outputData[outputName]
    // console.log(output)
    output = imagenetClassesTopK(output, 1)

    const end = new Date().getTime()
    console.log('Predict Time: ', end - start, 'ms')
    return output
  }

  function insertNewCanva (
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

    const ctx = canvas.getContext('2d')
    ctx.drawImage(
      srcImg,
      imgX, imgY, imgW, imgH,
      cvX, cvY, cvW, cvH
    )
    return ctx.getImageData(0, 0, canvasSize, canvasSize)
  }

  // function filter () {
  //   if (items.length > 1) {
  //     const lastItem = items[items.length - 1]
  //     const name = lastItem.item_name
  //     const x = lastItem.x
  //     const y = lastItem.y
  //     const width = lastItem.width
  //     const height = lastItem.height
  //
  //     for (let index in items) {
  //       const compareItem = item[index]
  //     }
  //   }
  // }

  function preprocess (imageData) {
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
  }

  function imagenetClassesTopK (classProbabilities, k = 5) {
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
</script>

<style scoped>

</style>
