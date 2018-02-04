<template>
  <div id="rootDiv">
    <a href="/objectDetection">Go to Single Object Detection Demo</a>
    <a href="/single-picture">Go to Single Picture Demo</a>
    <form id="uploadForm" enctype="multipart/form-data">
      <input type="file"
             name="filetoupload"
             accept="video/mp4,video/mpeg,video/mkv,video/avi,image/jpeg,image/jpg, image/png"
      /><br>
    </form>
    <button id="upload" @click="upload">upload</button>
    <button id="scan-button" @click="scanImg">Scan</button>
    <div id="keyFramesContainer"></div>
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

        if ($('input[name="filetoupload"]').val() === '') {
          alert('No file selected')
          document.getElementById('upload').disabled = false
        } else {
          $.ajax({
            // send video file to the server
            url: 'http://localhost:3000/fileupload',
            type: 'POST',
            cache: false,
            data: new FormData($('#uploadForm')[0]),
            processData: false,
            contentType: false,
            success: function (data) {
              console.log('successful to get response')
              // window.location.href = '/?filetoupload='
              let keyframes = data.keyframes
              for (let index = 0; index < keyframes.length; index++) {
                // create image div
                let imgDiv = document.createElement('div')
                imgDiv.className = 'keyframes-div'
                imgDiv.id = 'keyframe-div-' + index

                // create image html5 component
                let img = document.createElement('img')
                img.className = 'keyframes'
                img.src = 'data:image/jpeg;base64,' + btoa(data.keyframes[index])

                img.onload = function () {
                  // fix the height
                  img.height = 600
                  img.width = img.naturalWidth * (img.height / img.naturalHeight)
                  img.style.position = 'absolute'

                  // set image div's width and height
                  imgDiv.style.width = img.width + 'px'
                  imgDiv.style.height = img.height + 'px'

                  // add image to the page
                  imgDiv.appendChild(img)
                  document.getElementById('keyFramesContainer').appendChild(imgDiv)
                }
              }
              document.getElementById('upload').disabled = false
              document.getElementById('scan-button').disabled = false
            },
            error: function (e) {
              document.getElementById('upload').disabled = false
              console.log('Fail to get response')
            }
          })
        }
        return false
      },

      async scanImg () {
        const keyframes = document.getElementsByClassName('keyframes')
        for (let i = 0; i < keyframes.length; i++) {
          const items = await objectDetectionScan(
            keyframes[i],
            this.model,
            this.canvasSize,
            this.threshold1,
            this.threshold2
          )
          const frameDiv = document.getElementById('keyframe-div-' + i)
          this.drawItems(keyframes[i], items, frameDiv)
        }
      },

      drawItems (srcImg, items, frameDiv) {
        for (let index = 0; index < items.length; index++) {
          let item = items[index]

          const objectRectangles = document.createElement('div')
          const objectText = document.createElement('span')

          objectRectangles.appendChild(objectText)
          frameDiv.appendChild(objectRectangles)
          objectRectangles.className = 'object-rectangles'

          objectText.innerText = item.item_name + ' ' + item.probability

          objectRectangles.style.width = item.boundary.width + 'px'
          objectRectangles.style.height = item.boundary.height + 'px'
          objectRectangles.style.left = item.boundary.x + 'px'
          objectRectangles.style.top = item.boundary.y + 'px'

          const r = Math.floor(index / items.length * 255)
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
  .keyframes-div {
    /*margin-left: 50px;*/
    margin-left: auto;
    margin-right: auto;
    margin-bottom: 10px;
    text-align: left;
    padding: 0;
    position:relative;
    /*border: 2px solid darkred;*/
  }

  .object-rectangles {
    border: 3px solid;
    position: absolute;
    z-index: 1;
  }

</style>
