if (window.location.protocol == "https:") {
    uploader_ws_url = 'wss://'+ window.location['host'] + '/ws'
} else {
    uploader_ws_url = 'ws://'+ window.location['host'] + '/ws'
}

uploader_ws = ''

let count_div = document.createElement("div")

function getPublicIp(){
    var httpRequest = new XMLHttpRequest();
    httpRequest.open('GET', "https://api.ipify.org/?format=json", true);
    httpRequest.send();
    httpRequest.onload = function () {
        var json = httpRequest.responseText;
        let data=JSON.parse(json);
        public_ip = data.ip
        var client_url = uploader_ws_url + "/"+ public_ip.replace(/\./g,'_');
        new_uploader_ws(client_url)
    }
}

function new_uploader_ws(client_url) {
    // if (uploader_ws & !uploader_ws.CLOSED) {
    //     uploader_ws.close()
    //     delete uploader_ws
    // }
    uploader_ws = new WebSocket(client_url);
    uploader_ws.onerror = function () {
        uploader_ws.close();
        delete uploader_ws;
        setTimeout(function () {
            getPublicIp();
        },3000)
    }
    uploader_ws.onclose = function () {
        uploader_ws.close();
        delete uploader_ws;
        setTimeout(function () {
            getPublicIp();
        },3000)
    }
    uploader_ws.onmessage = function setCount(evt) {
        
        count_div.innerText = evt.data;
    }
}

function uploaderCraeteElementsAndWait(){
    const upload_path_div = document.createElement("div");
    const uploade_path_text = document.createElement("input");
    const uploader_file_label = document.createElement("label");
    const uploader_file_input = document.createElement("input");
    const uploader_progress_bar_div = document.createElement("div");
    const uploader_progress_bar = document.createElement("progress");

    uploade_path_text.type = "text";
    uploade_path_text.value = "/kaggle"
    uploader_file_input.type = "file";
    uploader_file_input.multiple = "multiple";
    uploader_file_input.id = "uploader_file_input";
    uploader_file_label.setAttribute("for","uploader_file_input");
    uploader_file_label.textContent = "上传";

    uploader_file_input.style.display = "none";
    uploader_file_label.style.backgroundColor = "blue";
    uploader_file_label.style.borderRadius = "4px";
    uploader_file_label.style.cursor = "pointer";
    upload_path_div.style.width = "100%"
    upload_path_div.style.backgroundColor = "rgb(13, 17, 23)";
    upload_path_div.style.color = "white";
    uploade_path_text.style.backgroundColor = "rgb(13, 17, 23)";
    uploader_progress_bar_div.style.backgroundColor = "rgb(13, 17, 23)";
    uploader_progress_bar_div.style.width = "100%"
    uploader_progress_bar_div.style.height = "20px";
    uploader_progress_bar_div.style.display = "none";
    uploader_progress_bar.style.height = "15px";
    uploader_progress_bar.style.backgroundColor = "rgb(13, 17, 23)";

    uploader_file_input.onchange = function(evt){
        uploaderForUpload(evt.target.files);
    };
    uploader_progress_bar_div.appendChild(uploader_progress_bar);
    upload_path_div.appendChild(uploade_path_text);
    upload_path_div.appendChild(uploader_file_input);
    upload_path_div.appendChild(uploader_file_label);
    upload_path_div.appendChild(uploader_progress_bar_div);

    function uploaderForUpload(files) {
        if (files.length !== 0) {
            let xhr = new XMLHttpRequest();
            let fd = new FormData();
            for (let i= 0; i<files.length; i++) {
                fd.append("files",files[i]);
            }
            xhr.open("post","/uploader_tab/api/upload",true);
            xhr.setRequestHeader("upload_path",uploade_path_text.value);
            uploader_file_label.disabled = true;
            uploader_progress_bar_div.style.display = "block";
            xhr.send(fd);
            xhr.onload = function() {
                uploader_file_label.disabled = false;
                uploader_progress_bar_div.style.display = "none";
                uploader_progress_bar.value = 0;
            };
            xhr.upload.onprogress = function(event) {
                if (event.lengthComputable) {
                  const progress = (event.loaded / event.total) * 100;
                  uploader_progress_bar.value = progress; // 更新进度条的值
                }
              };
        }
    }

    upload_path_div.addEventListener("drop", function(event) {
        event.preventDefault();
        upload_path_div.addEventListener("dragover", preventDefaultHandler);
        uploade_path_text.style.backgroundColor = "white";
        upload_path_div.style.backgroundColor = "rgb(13, 17, 23)";
        const files = event.dataTransfer.files;
        uploaderForUpload(files);
        upload_path_div.removeEventListener("dragover", preventDefaultHandler);
    });
    
    upload_path_div.addEventListener("dragover", handleDragOver);
    upload_path_div.addEventListener("dragleave", handleDragLeave);
    
    function handleDragOver(event) {
        event.preventDefault();
        uploade_path_text.style.backgroundColor = "lightblue";
        upload_path_div.style.backgroundColor = "lightblue";
    }
    
    function handleDragLeave(event) {
        event.preventDefault();
        upload_path_div.style.backgroundColor = "rgb(13, 17, 23)";
    }
    
    function preventDefaultHandler(event) {
        event.preventDefault();
    }
    


    setTimeout(function() {
        const uploader_tab = document.getElementById("tab_extension_uploader");
        uploader_tab.insertBefore(upload_path_div,uploader_tab.children[0]);
    },1000*50);
}

document.addEventListener('DOMContentLoaded', (event) => {
    if (window.location['href'].endsWith('__theme=dark')) {
        count_div.style = "background:rgb(13, 17, 23);color:white"
    }
    document.body.appendChild(count_div)
    getPublicIp();
    uploaderCraeteElementsAndWait();
});
