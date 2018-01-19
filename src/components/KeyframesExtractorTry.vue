<template>

</template>

<script>
  const ffmpeg = require('ffmpeg')
  // const fs = require('browserify-fs')
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
      // process.screenshots({
      //   count: 4,
      //   folder: this.outputPath
      // })
      // console.log(process)
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
    }
  }
</script>

<style scoped>

</style>
