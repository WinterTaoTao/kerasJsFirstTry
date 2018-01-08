import ndarray from 'ndarray'
import ops from 'ndarray-ops'
import _ from 'lodash'
import { imagenetClasses } from '../../data/imagenet'

onmessage = async function (e) {
  const d = e.data
  let output = runModel(d.model, d.imgData)
  this.postMessage(output)
}

async function runModel (model, imgData) {
  const start = new Date().getTime()
  // console.log('runModel', 2)

  // preprocess image data
  const preprocessedData = preprocess(imgData)
  const inputName = model.inputLayerNames[0]
  const outputName = model.outputLayerNames[0]
  const inputData = { [inputName]: preprocessedData }

  // recognize
  // console.log(inputData)
  const outputData = await model.predict(inputData)

  let output = outputData[outputName]
  // console.log(output)
  output = imagenetClassesTopK(output, 1)

  const end = new Date().getTime()
  console.log('Predict Time: ', end - start, 'ms')
  return output
}

function preprocess (imageData) {
  const {data, width, height} = imageData

  // data processing
  // see https://github.com/fchollet/keras/blob/master/keras/applications/imagenet_utils.py
  const dataTensor = ndarray(new Float32Array(data), [width, height, 4])
  const dataProcessedTensor = ndarray(new Float32Array(width * height * 3), [width, height, 3])

  ops.subseq(dataTensor.pick(null, null, 2), 103.939)
  ops.subseq(dataTensor.pick(null, null, 1), 116.779)
  ops.subseq(dataTensor.pick(null, null, 0), 123.68)
  ops.assign(dataProcessedTensor.pick(null, null, 0), dataTensor.pick(null, null, 2))
  ops.assign(dataProcessedTensor.pick(null, null, 1), dataTensor.pick(null, null, 1))
  ops.assign(dataProcessedTensor.pick(null, null, 2), dataTensor.pick(null, null, 0))

  return dataProcessedTensor.data
}

function imagenetClassesTopK (classProbabilities, k = 5) {
  const probs = _.isTypedArray(classProbabilities) ? Array.prototype.slice.call(classProbabilities) : classProbabilities

  const sorted = _.reverse(_.sortBy(probs.map((prob, index) => [prob, index]), probIndex => probIndex[0]))

  const topK = _.take(sorted, k).map(probIndex => {
    const iClass = imagenetClasses[probIndex[1]]
    return {
      id: iClass[0],
      index: parseInt(probIndex[1], 10),
      name: iClass[1].replace(/_/, ' '),
      probability: probIndex[0]
    }
  })
  return topK
}
