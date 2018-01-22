<template>

</template>

<script>
  const ffmpeg = require('fluent-ffmpeg')
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
      const p = ffmpeg(this.sampleVideoPath)
      console.log(p)
    }
  }
</script>

<style scoped>

</style>
