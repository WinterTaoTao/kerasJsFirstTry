<template>
  <div id="rootDiv">
    <form id="uploadForm" enctype="multipart/form-data">
      <input type="file" name="filetoupload"/><br>
      <!--<input type="submit"/>-->
      <button id="upload" type="button" v-on:click="upload">upload</button>
    </form>
  </div>
</template>

<script>
  import $ from 'jquery'
  export default {
    name: 'scan-image',

    mounted () {
    },

    methods: {
      upload () {
        $.ajax({
          url: 'http://localhost:3000/fileupload',
          type: 'POST',
          cache: false,
          data: new FormData($('#uploadForm')[0]),
          processData: false,
          contentType: false
          // success: function (data) {
          //   let img = document.createElement('img')
          //   img.src = 'data:image/jpeg;base64,' + btoa(data)
          //   document.getElementById('rootDiv').appendChild(img)
          // }
        }).done(function (data) {
          console.log('successful to get response')
          let img = document.createElement('img')
          img.src = 'data:image/jpeg;base64,' + btoa(data)
          document.getElementById('rootDiv').appendChild(img)
        }).fail(function (res) {
          console.log('failed to get response')
        })
      }
    }
  }
</script>

<style scoped>

</style>
