onmessage = async function (e) {
  const imageData = e.data
  this.postMessage(imageData)
}
