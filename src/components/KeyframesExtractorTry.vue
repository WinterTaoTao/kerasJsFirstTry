<template>
  <div id="rootDiv">
    <form id="uploadForm" enctype="multipart/form-data">
      <input type="file" name="filetoupload"/><br>
      <!--<input type="submit"/>-->
      <button id="upload" @click="upload">upload</button>
      <button id="scan-button" @click="scanImg">Scan</button>
      <div id="keyFramesContainer"></div>
    </form>
  </div>
</template>

<script>
  import $ from 'jquery'
  import { objectDetectionScan } from '../util/ObjectDetection'

  const KerasJS = require('keras-js')

  export default {
    name: 'scan-image',

    data () {
      return {
        modelFilePath: '/src/models/squeezenet_v1.1.bin',
        canvasSize: 227,
        model: null,
        items: [],
        threshold1: 0.5,
        threshold2: 0.8
      }
    },

    mounted () {
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
      },

      upload () {
        document.getElementById('keyFramesContainer').innerHTML = ''
        document.getElementById('upload').disabled = true
        $.ajax({
          // send video file to the server
          url: 'http://localhost:3000/fileupload',
          type: 'POST',
          cache: false,
          data: new FormData($('#uploadForm')[0]),
          processData: false,
          contentType: false
        }).done(function (data) {
          // if successfully get response, draw keyframes
          console.log('successful to get response')
          let keyframes = data.keyframes
          for (let index = 0; index < keyframes.length; index++) {
            let img = document.createElement('img')
            img.className = 'keyframes'
            img.src = 'data:image/jpeg;base64,' + btoa(data.keyframes[index])
            img.style.height = '1000px'
            document.getElementById('keyFramesContainer').appendChild(img)
          }
          document.getElementById('upload').disabled = false
          document.getElementById('scan-button').disabled = false
        }).fail(function (res) {
          console.log('failed to get response')
          document.getElementById('upload').disabled = false
        })
      },

      async scanImg () {
        let keyframes = document.getElementsByClassName('keyframes')
        console.log(keyframes[0].height)
        for (let i = 0; i < 1; i++) {
          await objectDetectionScan(
            keyframes[i],
            this.model,
            this.canvasSize,
            this.threshold1,
            this.threshold2
          )
        }
      },

      drawItems (items) {
        for (let index = 0; index < items.length; index++) {
          let item = items[index]
          console.log(item.item_name, item.probability)

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
        }
      }
    }
  }
</script>

<style scoped>

</style>
