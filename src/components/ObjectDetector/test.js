onmessage = async function (evt) {
  var d = evt.data
  this.postMessage(d + 'yes')
}
