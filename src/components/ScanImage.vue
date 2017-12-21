<template>
  <div>
    <a href="#/objectDetection">Object Detection Demo</a><br/>
    <button @click="scan()">scan</button><br/>
    <div id="scan-img-root"></div>
  </div>
</template>

<script>
  import loadImage from 'blueimp-load-image'
  const KerasJS = require('keras-js')
  let srcWidth = 0
  let srcHeight = 0

  export default {
    name: 'scan-image',
    data () {
      return {
        modelFilePath: '/src/models/squeezenet_v1.1.bin',
        sampleImgPath: '/src/assets/sample-images/photo.jpg',
        canvasSize: 227,
        inputImgSize: 0,
        model: null,

        msg: 'Preparing...',
        isPredicting: false,
        isReady: false
      }
    },

    created () {
      this.initModel()
    },

    mounted () {
      const img = new Image()
      img.onload = function () {
        srcWidth = img.width
        srcHeight = img.height
      }
      img.src = this.sampleImgPath
    },

    methods: {
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

        // load image to this canvas
        loadImage(
          imagePath,
          function (img) {
            const ctx = canvas.getContext('2d')
            ctx.drawImage(
              img,
              imgX, imgY, imgW, imgH,
              cvX, cvY, cvW, cvH
            )
          },
          {
            crossOrigin: 'Anonymous'
          }
        )
      },

      async runModel (imageData) {
        if (this.isReady && !this.isPredicting) {
          const start = new Date().getTime()
          this.isPredicting = true
          console.log('Predicting...', this.isPredicting)

          // // load image in canva
          // const ctx = document.getElementById('input-img').getContext('2d')
          // const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height)

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

      scan () {
        this.insertNewCanva(
          this.sampleImgPath, this.canvasSize,
          0, 0, srcWidth, srcHeight
        )

        let scannerSize = srcWidth > srcHeight ? srcHeight : srcWidth
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
              this.insertNewCanva(this.sampleImgPath, this.canvasSize,
                x, y, inputImgW, inputImgH
              )
            }
          }
          console.log(scannerSize, scannerLayer)
          scannerLayer++
          scannerSize /= 2
        }
      }
    }
  }
</script>

<style scoped>

</style>
