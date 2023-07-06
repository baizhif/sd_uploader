const uploader_file_input = document.getElementById("uploader_file_input").getElementsByTagName("input")

uploader_file_input.onchange = evt => {
    files = evt.target.files;
    if (files.length === 0) {
      return
    }
    else {
        console.log(files);
    }
  }
