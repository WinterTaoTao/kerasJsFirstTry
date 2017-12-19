<template>
  <div id="scan-image-root">
    <img id="img1" style="display: none" v-bind:src="sampleImgPath"/>
    <a href="#/objectDetection">Object Detection Demo</a><br/>
  </div>
</template>

<script>
  import loadImage from 'blueimp-load-image'
  export default {
    name: 'scan-image',
    data () {
      return {
        sampleImgPath: '/src/assets/sample-images/dog1.jpg',
        canvasSize: 227
      }
    },

    mounted () {
      this.insertNewCanva(
        this.sampleImgPath, this.canvasSize,
        0, 0, 960, 480
      )
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
        // file.appendChild(canvas)
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
      }
    }
  }
</script>

<style scoped>

</style>
