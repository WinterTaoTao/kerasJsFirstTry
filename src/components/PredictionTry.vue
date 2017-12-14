<template>
    <div>
      {{msg}}
    </div>
</template>

<script>
  // import * as KerasJS from 'keras'
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
        filepaths: {
          model: MODEL_PATH + 'model.json',
          weights: MODEL_PATH + 'model_weights.buf',
          metadata: MODEL_PATH + 'model_metadata.json'
        },
        filesystem: true
      })
      for (let i = 0; i < 5; i++) {
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
            console.log(i + ':' + outputData.output)
            this.msg += ' ' + outputData.output
          })
        // .catch(err => {
        //   this.msg = 'Error: Can\'t Predict'
        // })
      }
    }
  }
</script>

<style scoped>

</style>
