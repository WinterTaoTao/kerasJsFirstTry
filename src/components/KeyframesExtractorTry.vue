<template>

</template>

<script>
  const ffmpeg = require('ffmpeg')
  export default {
    name: 'key-frame-etractor-try',

    data: function () {
      return {
        sampleVideoPath: '/src/assets/sample-video/sample.mp4',
        outputPath: '/src/assets/sample-video/'
      }
    },

    mounted () {
      // eslint-disable-next-line
      let process = new ffmpeg(this.sampleVideoPath)
      console.log(process)
      // try {
      //   // eslint-disable-next-line
      //   let process = new ffmpeg(this.sampleVideoPath)
      //   console.log(process)
      // } catch (e) {
      //   console.log('Error:', e.code)
      //   console.log(e.msg)
      // }
      // ffmpeg.ffmpeg(this.sampleVideoPath, {
      //   width: 500,
      //   height: 500
      // }, this.output, function (progress) {
      //   console.log(progress)
      // }).success(function (json) {
      //   console.log(json)
      // }).error(function (error) {
      //   console.log(error)
      // })

      // this.sampleVideoPath += ''
      // extractKeyframes(this.sampleVideoPath).then(extractionProcess => {
      //   // Event fired when extraction process has begun.
      //   extractionProcess.on('start', function () {
      //     console.log('Started')
      //   }, false)
      //
      //   // Event fired when a keyframe is extracted
      //   extractionProcess.on('keyframe', function (data) {
      //     console.log('KEYFRAME:', data)
      //   })
      //
      //   // Event fired when all keyframes have been extracted from the video
      //   extractionProcess.on('finish', function (data) {
      //     console.log('Finish:', data)
      //   })
      // }).catch(err => {
      //   console.log('Error extracting keyframes:', err)
      // })
    }
  }
</script>

<style scoped>

</style>
