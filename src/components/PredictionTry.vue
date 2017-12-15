<template>
    <div>
      {{msg}}
    </div>
</template>

<script>
  // import * as KerasJS from 'keras'
  // import * as KerasJS from 'keras-js-new'
  const MODEL_PATH = '/src/models/'
  const KerasJS = require('keras-js')

  export default {
    name: 'prediction-try',
    data () {
      return {
        model: KerasJS.Model,
        msg: 'Predicting...'
      }
    },
    created: function () {
      this.model = new KerasJS.Model({
        filepath: MODEL_PATH + 'model.bin',
        filesystem: true
      })
      // this.model = new KerasJS.Model({
      //   filepaths: {
      //     model: MODEL_PATH + 'model.json',
      //     weights: MODEL_PATH + 'model_weights.buf',
      //     metadata: MODEL_PATH + 'model_metadata.json'
      //   },
      //   filesystem: true
      // })
      for (let i = 1; i < 6; i++) {
        this.model.ready()
          .then(() => {
            // const sample = [2]
            const inputData = {
              'input': new Float32Array([i])
            }
            // console.log(inputData)
            return this.model.predict(inputData)
          })
          .then(outputData => {
            console.log(typeof (outputData.output[0]))
            this.msg += '\n' + i + ': ' + outputData.output[0]
          })
          // .catch(err => {
          //   this.msg = 'Error: Can\'t Predict'
          // })
      }

      // this.model.ready()
      //   .then(() => {
      //     // const sample = [2]
      //     const inputData = {
      //       'input': new Float32Array([2])
      //     }
      //     // console.log(inputData)
      //     return this.model.predict(inputData)
      //   })
      //   .then(outputData => {
      //     this.msg = ' ' + outputData.output
      //   })
    }
  }
</script>

<style scoped>

</style>
