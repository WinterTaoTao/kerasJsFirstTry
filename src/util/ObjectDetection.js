import ndarray from 'ndarray'
import ops from 'ndarray-ops'
import _ from 'lodash'
import { imagenetClasses } from '../data/imagenet'

const position = {
  INDEPENDENT: 0,
  INTERSECTION: 1,
  CONTAINED: 2,
  CONTAIN: 3
}

let items = []
let notCheckList = []

// Scan Image
export async function objectDetectionScan (
  img,
  detectionModel,
  inputSize,
  threshold = 0.5
) {
  const start = new Date().getTime()

  // original picture
  const srcImgWidth = img.width
  const srcImgHeight = img.height
  let inputImgX = 0
  let inputImgY = 0
  let inputImgW = srcImgWidth
  let inputImgH = srcImgHeight

  await objectDetectionForScanner(
    img,
    detectionModel,
    inputSize,
    inputImgX, inputImgY,
    inputImgW, inputImgH,
    threshold)

  let scannerSize = srcImgWidth < srcImgHeight ? srcImgWidth : srcImgHeight
  let scannerLayer = 0

  // scan parts of picture
  while (scannerSize > 32 && scannerLayer < 3) {
    inputImgY = 0
    let stepSize = scannerSize / 2

    for (inputImgY; inputImgY < srcImgHeight; inputImgY += stepSize) {
      inputImgX = 0
      inputImgH = scannerSize

      if (inputImgY + scannerSize > srcImgHeight) {
        inputImgH = srcImgHeight - inputImgY
      }

      for (inputImgX; inputImgX < srcImgWidth; inputImgX += stepSize) {
        inputImgW = scannerSize

        if (inputImgX + scannerSize > srcImgWidth) {
          inputImgW = srcImgWidth - inputImgX
        }

        await objectDetectionForScanner(
          img,
          detectionModel,
          inputSize,
          inputImgX, inputImgY,
          inputImgW, inputImgH,
          threshold)
      }
    }

    scannerLayer++
    scannerSize /= 2
  }

  const end = new Date().getTime()
  console.log('Total Scan Time: ', end - start, 'ms')

  return items
}

async function objectDetectionForScanner (
  srcImg,
  detectionModel,
  inputSize,
  imgX = 0, imgY = 0,
  imgW = srcImg.width, imgH = srcImg.height,
  threshold = 0.5) {
  // get image data for detection
  let imageData = getImgData(
    srcImg,
    inputSize,
    imgX, imgY,
    imgW, imgH
  )

  const output = await runModel(detectionModel, imageData, 1)
  const result = output[0]

  console.log(result.name, result.probability)

  if (result.probability > threshold) {
    const item = {
      item_name: result.name,
      probability: result.probability,
      boundary: {
        x: imgX,
        y: imgY,
        width: imgW,
        height: imgH
      }
    }
    await addItem(
      srcImg,
      detectionModel,
      inputSize,
      item,
      threshold)
  }
}

function getImgData (
  srcImg,
  canvasSize,
  imgX = 0, imgY = 0,
  imgW = canvasSize, imgH = canvasSize) {
  // create a new canvas
  const canvas = document.createElement('canvas')
  canvas.className = 'scanned-imgs'
  canvas.width = canvasSize
  canvas.height = canvasSize

  let cvX = 0
  let cvY = 0
  let cvW = canvasSize
  let cvH = canvasSize

  if (imgW > imgH) {
    cvH = canvasSize * (imgH / imgW)
    cvY += (canvasSize - cvH) / 2
  } else if (imgW < imgH) {
    cvW = canvasSize * (imgW / imgH)
    cvX += (canvasSize - cvW) / 2
  }

  const ctx = canvas.getContext('2d')
  ctx.drawImage(
    srcImg,
    imgX,
    imgY,
    imgW,
    imgH,
    cvX,
    cvY,
    cvW,
    cvH
  )
  return ctx.getImageData(0, 0, canvasSize, canvasSize)
}

// run object detection model
async function runModel (model, imageData, num) {
  const start = new Date().getTime()

  // preprocess image data
  const preprocessedData = preprocess(imageData)
  const inputName = model.inputLayerNames[0]
  const outputName = model.outputLayerNames[0]
  const inputData = {
    [inputName]: preprocessedData
  }

  // recognize
  const outputData = await model.predict(inputData)
  let output = outputData[outputName]
  output = imagenetClassesTopK(output, num)

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

async function addItem (
  srcImg,
  detectionModel,
  inputSize,
  item,
  threshold) {
  if (!inNotCheckList(item.boundary, notCheckList)) {
    let shouldAdd = true
    for (let index = 0; index < items.length; index++) {
      const compareItem = items[index]
      const itemName = item.item_name
      const _itemName = compareItem.item_name

      if (itemName === _itemName) {
        const probability = item.probability
        const _probability = compareItem.probability

        const boundary = item.boundary
        const _boundary = compareItem.boundary

        const pos = positionRelationship(boundary, _boundary)

        if (pos === position.CONTAINED || pos === position.CONTAIN) {
          if (probability >= _probability) {
            items.splice(index, 1)
            index--
          } else {
            shouldAdd = false
          }
        } else if (pos === position.INTERSECTION) {
          notCheckList.push(boundary)
          if (shouldAdd) {
            items.push(item)
            shouldAdd = false
          }

          // detect intersection part
          const intersectionX = Math.max(boundary.x, _boundary.x)
          const intersectionY = Math.max(boundary.y, _boundary.y)
          const intersectionW = Math.min(boundary.x + boundary.width, _boundary.x + _boundary.width) - intersectionX
          const intersectionH = Math.min(boundary.y + boundary.height, _boundary.y + _boundary.height) - intersectionY
          await objectDetectionForScanner(
            srcImg,
            detectionModel,
            inputSize,
            intersectionX, intersectionY,
            intersectionW, intersectionH,
            threshold)

          // detect union part
          const unionX = Math.min(boundary.x, _boundary.x)
          const unionY = Math.min(boundary.y, _boundary.y)
          const unionW = Math.max(boundary.x + boundary.width, _boundary.x + _boundary.width) - unionX
          const unionH = Math.max(boundary.y + boundary.height, _boundary.y + _boundary.height) - unionY
          await objectDetectionForScanner(
            srcImg,
            detectionModel,
            inputSize,
            unionX, unionY,
            unionW, unionH,
            threshold)
        }
      }
    }
    if (shouldAdd) {
      items.push(item)
    }
  }
}

function inNotCheckList (boundary, notCheckList) {
  for (let i = 0; i < notCheckList.length; i++) {
    const _boundary = notCheckList[i]
    if (boundary.x === _boundary.x &&
      boundary.y === _boundary.y &&
      boundary.width === _boundary.width &&
      boundary.height === _boundary.height
    ) {
      return true
    }
  }
  return false
}

// Justify the position relationship between two detected items
function positionRelationship (itemBoundary, compareItemBoundary) {
  const xStart = itemBoundary.x
  const yStart = itemBoundary.y
  const xEnd = xStart + itemBoundary.width
  const yEnd = yStart + itemBoundary.height
  const _xStart = compareItemBoundary.x
  const _yStart = compareItemBoundary.y
  const _xEnd = _xStart + compareItemBoundary.width
  const _yEnd = _yStart + compareItemBoundary.height

  if (xStart >= _xEnd || yStart >= _yEnd || _xStart >= xEnd || _yStart >= yEnd) {
    return position.INDEPENDENT // two independent items
  } else if (xStart >= _xStart && yStart >= _yStart && xEnd <= _xEnd && yEnd <= _yEnd) {
    return position.CONTAINED // item is contained by compareItem
  } else if (xStart <= _xStart && yStart <= _yStart && xEnd >= _xEnd && yEnd >= _yEnd) {
    return position.CONTAIN // item contains compareItem
  } else {
    return position.INTERSECTION // two intersection items
  }
}
