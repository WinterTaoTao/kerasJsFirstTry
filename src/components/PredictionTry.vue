<template>
  <div>
    <div v-for="m in msg.split('\n')">
      {{m}}<br>
    </div>
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
    // methods: {
    //   forLoopPrediction: async function (num) {
    //     for (let i = 1; i < num; i++) {
    //       await this.model.ready()
    //         .then(() => {
    //           // const sample = [2]
    //           const inputData = {
    //             'input': new Float32Array([i])
    //           }
    //           // console.log(inputData)
    //           return this.model.predict(inputData)
    //         })
    //         .then(outputData => {
    //           console.log(i + ': ' + typeof (outputData.output[0]) + ' ' + outputData.output[0])
    //           this.msg += '\n' + i + ': ' + outputData.output[0]
    //         })
    //     }
    //   }
    // },
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
          // .then(() => {
          //   // const sample = [2]
          //   const inputData = {
          //     'input': new Float32Array([i])
          //   }
          //   // console.log(inputData)
          //   return this.model.predict(inputData)
          // })
          // .then(outputData => {
          //   console.log(i + ': ' + typeof (outputData.output[0]) + ' ' + outputData.output[0])
          //   this.msg += '\n' + i + ': ' + outputData.output[0]
          // })
      //     .catch(err => {
      //       this.msg = 'Error: Can\'t Predict'
      //     })
      }
      //
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
