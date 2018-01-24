<template>
  <div>
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
          contentType: false,
          success: function (data) {
            console.log(data.msg)
          }
        }).done(function (res) {
          console.log('yes')
        }).fail(function (res) {
          console.log('no')
        })
      }
    }
  }
</script>

<style scoped>

</style>
