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
    const uploade_path_div = document.createElement("div");
    const uploade_path_text = document.createElement("input");
    const uploader_file_label = document.createElement("label");
    const uploader_file_input = document.createElement("input");

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
    uploade_path_div.style.width = "100%"
    uploade_path_div.style.backgroundColor = "rgb(13, 17, 23)";
    uploade_path_div.style.color = "white";
    uploade_path_text.style.backgroundColor = "rgb(13, 17, 23)";

    uploader_file_input.onchange = function(evt) {
        if (evt.target.files.length !== 0) {
            let xhr = new XMLHttpRequest();
            let fd = new FormData();
            for (let i= 0; i<evt.target.files.length; i++) {
                fd.append("files",evt.target.files[i]);
            }
            xhr.open("post","/uploader_tab/api/upload",true);
            xhr.setRequestHeader("upload_path",uploade_path_text.value);
            uploader_file_label.disabled = true;
            xhr.send(fd);
            xhr.onload = function() {
                uploader_file_label.disabled = false;
            }
        }
    }
    uploade_path_div.appendChild(uploade_path_text);
    uploade_path_div.appendChild(uploader_file_input);
    uploade_path_div.appendChild(uploader_file_label);


    setTimeout(function() {
        const uploader_tab = document.getElementById("tab_extension_uploader");
        uploader_tab.insertBefore(uploade_path_div,uploader_tab.children[0]);
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
