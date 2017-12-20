<template>
  <div id="scan-image-root">
    <img style="display: none" v-bind:src="sampleImgPath"/>
    <a href="#/objectDetection">Object Detection Demo</a><br/>
    <button @click="test()">test</button>
  </div>
</template>

<script>
  import loadImage from 'blueimp-load-image'

  const KerasJS = require('keras-js')

  export default {
    name: 'scan-image',
    data () {
      return {
        modelFilePath: '/src/models/squeezenet_v1.1.bin',
        sampleImgPath: '/src/assets/sample-images/dog1.jpg',
        canvasSize: 227,
        inputImgSize: 0,
        src_width: 0,
        src_height: 0,
        model: null
      }
    },

    async created () {
      // const img = new Image()
      // img.src = this.sampleImgPath
      // this.src_width = img.width
      // this.src_height = img.height
      // console.log(this.src_width, this.src_height)
      // const img = new Image()
      // img.src = this.sampleImgPath
      // this.$nextTick(() => {
      //   this.src_width = img.width
      //   this.src_height = img.height
      //   console.log('test', this.src_height, this.src_width)
      // })
    },

    mounted () {
      const img = new Image()
      img.src = this.sampleImgPath
      this.src_width = img.width
      this.src_height = img.height
      console.log(this.src_width, this.src_height)
      // this.insertNewCanva(
      //   this.sampleImgPath, this.canvasSize,
      //   0, 0, 500, 500
      // )
      // console.log(this.src_height, this.src_width)
    },
    methods: {
      insertNewCanva (
        imagePath, canvaSize,
        x_img_start = 0, y_img_start = 0, img_W = canvaSize, img_H = canvaSize,
        x_cv_start = 0, y_cv_start = 0, cv_W = canvaSize, cv_H = canvaSize
      ) {
        const canvas = document.createElement('canvas')
        const file = document.getElementById('scan-image-root')
        file.appendChild(canvas)
        canvas.className = 'scanned-imgs'
        canvas.width = canvaSize
        canvas.height = canvaSize
        loadImage(
          imagePath,
          function (img) {
            const ctx = canvas.getContext('2d')
            ctx.drawImage(
              img,
              x_img_start, y_img_start, img_W, img_H,
              x_cv_start, y_cv_start, cv_W, cv_H
            )
          },
          {
            crossOrigin: 'Anonymous'
          }
        )
      },

      readImgSize (imagePath) {
        const img = new Image()
        img.src = imagePath
        img.onload = function () {
          let width = img.naturalWidth
          let height = img.naturalHeight
          return [width, height]
        }
      },

      async initModel () {
        const img = new Image()
        img.src = this.sampleImgPath
        this.model = new KerasJS.Model({
          filepath: this.modelFilePath,
          gpu: true,
          filesystem: true
        })
        await this.model.ready()
        this.src_width = img.width
        this.src_height = img.height
        console.log(this.src_width, this.src_height)
      }
    }
  }
</script>

<style scoped>

</style>
