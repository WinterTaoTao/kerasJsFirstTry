<template>
  <div>
    <div v-for="m in msg.split('\n')">
      {{m}}<br>
    </div>
    <!--<hello-world></hello-world>-->
  </div>
</template>

<script>
  // import HelloWorld from './HelloWorld'

  // import ObjectDetectionTry from './ObjectDetectionTry'
  //
  const MODEL_PATH = '/src/models/'
  const KerasJS = require('keras-js')

  export default {
    // components: {HelloWorld},
    name: 'prediction-try',
    data () {
      return {
        model: KerasJS.Model,
        msg: 'Predicting...'
      }
    },
    created: async function () {
      this.model = new KerasJS.Model({
        filepath: MODEL_PATH + 'model.bin',
        filesystem: true
      })
      // this.forLoopPrediction(6)
      for (let i = 0; i < 5; i++) {
        await this.model.ready()
        const inputData = {
          input: new Float32Array([i])
        }
        console.log(i)
        const outputData = await this.model.predict(inputData)
        console.log(i, outputData.output[0])
        this.msg += '\n' + i + ': ' + outputData.output[0]
      }
    }
  }
</script>

<style scoped>

</style>
