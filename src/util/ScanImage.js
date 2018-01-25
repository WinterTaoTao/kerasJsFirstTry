import { objectDetection } from './ObjectDetection'

export async function scan (
  img,
  detectionModel,
  inputSize,
  threshold = 0.5) {
  // try {
  const start = new Date().getTime()
  let items = []
  let notCheckList = []

  // original picture
  const srcImgWidth = img.width
  const srcImgHeight = img.height
  let inputImgX = 0
  let inputImgY = 0
  let inputImgW = srcImgWidth
  let inputImgH = srcImgHeight

  await objectDetection(
    img,
    detectionModel,
    inputSize,
    inputImgX, inputImgY,
    inputImgW, inputImgH,
    items,
    notCheckList,
    threshold)

  let scannerSize = srcImgWidth < srcImgHeight ? srcImgWidth : srcImgHeight
  let scannerLayer = 0

  // scan parts of picture
  while (scannerSize > 32 && scannerLayer < 1) {
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

        await objectDetection(
          img,
          detectionModel,
          inputSize,
          inputImgX, inputImgY,
          inputImgW, inputImgH,
          items,
          notCheckList,
          threshold)
      }
    }

    scannerLayer++
    scannerSize /= 2
  }

  // for (let index = 0; index < items.length; index++) {
  //   let item = items[index]
  //   if (item.probability < threshold2) {
  //     items.splice(index, 1)
  //     index = index - 1
  //   }
  // }

  const end = new Date().getTime()
  console.log('Total Scan Time: ', end - start, 'ms')

  console.log(items)

  return items // return the result of detected items
  // } catch (err) {
  //   console.log(err.message)
  // }
}
