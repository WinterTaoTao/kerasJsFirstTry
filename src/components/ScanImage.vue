<template>
  <div>
    <a href="#/objectDetection">Object Detection Demo</a><br/>
    <a href="#/ky">Key Frames Etractor Demo</a><br/>

    <div id="src-img-div">
      <!--<img id="src-img" v-bind:src="sampleImgPath" style="position: absolute">-->
    </div>

    <button id="scan-button" @click="scanImg">Scan</button><br/>
    <div id="scan-img-root"></div>
  </div>
</template>

<script>
  import { objectDetectionScan } from '../util/ObjectDetection'

  const KerasJS = require('keras-js')

  export default {
    name: 'scan-image',

    data: function () {
      return {
        modelFilePath: '/src/models/squeezenet_v1.1.bin',
        sampleImgPath: '/src/assets/sample-images/photo5.jpg',
        canvasSize: 227,
        model: null,
        srcImg: new Image(),
        items: [],
        threshold1: 0.5,
        threshold2: 0.8
      }
    },

    mounted () {
      // this.srcImg.src = this.sampleImgPath
      let img = document.createElement('img')
      img.src = this.sampleImgPath
      img.id = 'src-img'
      img.style.position = 'absolute'
      // img.height = 800
      // let img = this.srcImg
      img.onload = function () {
        let srcImgDiv = document.getElementById('src-img-div')
        // console.log(img.width, img.height)
        srcImgDiv.style.width = img.width + 'px'
        srcImgDiv.style.height = img.height + 'px'
        srcImgDiv.appendChild(img)
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

      async scanImg () {
        let srcImg = document.getElementById('src-img')
        this.items = await objectDetectionScan(
          srcImg,
          this.model,
          this.canvasSize,
          this.threshold1,
          this.threshold2
        )

        this.drawItems(srcImg)
      },

      drawItems (srcImg) {
        for (let index = 0; index < this.items.length; index++) {
          let item = this.items[index]

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
          const g = Math.floor(item.boundary.x / srcImg.width * 255)
          const b = Math.floor(item.boundary.y / srcImg.height * 255)
          const backColor = 'rgba(' + r + ',' +
            g + ', ' +
            b + ', 0.8)'

          const textColor = 'rgb(' + (255 - r) + ',' +
            (255 - g) + ', ' +
            (255 - b) + ')'

          objectRectangles.style.borderColor = backColor
          objectText.style.backgroundColor = backColor
          objectText.style.color = textColor
        }
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
