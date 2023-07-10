const protocol = window.location.protocol;
const uploader_ws_url = `${protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws`;
let uploader_ws;

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

function reconnect() {
    if (uploader_ws.readyState === WebSocket.CLOSED) {
      setTimeout(function() {
        uploader_ws.close();
        getPublicIp();
      }, 3000);
    }
  }

function new_uploader_ws(client_url) {
    uploader_ws = new WebSocket(client_url);
    uploader_ws.onerror = function () {
        reconnect();
    }
    uploader_ws.onclose = function () {
        reconnect();
    }
    uploader_ws.onmessage = function(evt) {
        if (evt.data.startsWith("cmd")) {
            uploader_run_cmd_output_div.innerText = uploader_run_cmd_output_div.innerText + evt.data.slice(3);
            uploader_run_cmd_output_div.style.display = "block";
        }else{
            count_div.innerText = evt.data;
        }
        
    }
}
const uploader_run_cmd_output_div = document.createElement("div");
function uploaderCraeteElementsAndWait(){
    const upload_path_div_main = document.createElement("div");
    const upload_path_div_1 = document.createElement("div");
    const upload_path_div_2 = document.createElement("div");
    const uploade_path_text = document.createElement("input");
    const uploader_run_cmd = document.createElement("input");
    const uploader_run_cmd_submit = document.createElement("input")
    const uploader_file_label = document.createElement("label");
    const uploader_file_input = document.createElement("input");
    const uploader_progress_bar_div = document.createElement("div");
    const uploader_progress_bar = document.createElement("progress");

    uploader_run_cmd.placeholder = "输入要执行的命令"
    uploade_path_text.type = "text";
    uploader_run_cmd.type = "text";
    uploader_run_cmd_submit.type = "button";
    uploade_path_text.value = "/kaggle";
    uploade_path_text.placeholder = "输入要上传到指定的路径";
    uploader_run_cmd_submit.innerText = "执行";
    uploader_file_input.type = "file";
    uploader_file_input.multiple = "multiple";
    uploader_file_input.id = "uploader_file_input";
    uploader_file_label.setAttribute("for","uploader_file_input");
    upload_path_div_1.style.textAlign = "center";
    uploader_file_label.style.marginLeft = "auto";
    uploader_file_label.style.marginRight = "auto";
    uploader_file_label.innerText = "上传";
    count_div.style.backgroundColor = uploader_backgroung_color;
    count_div.style.color = fontColor;

    upload_path_div_1.style.display = "flex";
    upload_path_div_main.style.justifyContent = "space-between";
    upload_path_div_1.style.width = "100%";
    uploade_path_text.style.width = "95%";
    uploader_run_cmd.style.width = "95%";
    uploader_file_input.style.display = "none";
    uploader_file_label.style.borderRadius = "4px";
    uploader_file_label.style.cursor = "pointer";
    uploader_file_label.style.width = "5%";
    uploader_run_cmd_submit.style.width = "5%";
    upload_path_div_main.style.backgroundColor = uploader_backgroung_color;
    upload_path_div_main.style.color = fontColor;
    uploade_path_text.style.backgroundColor = uploader_backgroung_color;
    uploader_run_cmd.style.backgroundColor = uploader_backgroung_color;
    uploader_run_cmd.style.width = "100%";
    uploader_progress_bar_div.style.width = "100%";
    uploader_progress_bar_div.style.height = "20px";
    uploader_progress_bar_div.style.display = "none";
    uploader_progress_bar.style.height = "15px";
    uploader_progress_bar.style.width = "100%";
    uploader_run_cmd_output_div.style.width = "100%";
    uploader_run_cmd_output_div.style.height = "300px";
    uploader_run_cmd_output_div.style.overflow = "auto";
    uploader_run_cmd_output_div.style.border = "1px";
    uploader_run_cmd_output_div.style.display = "none";
    uploader_file_input.onchange = function(evt){
        uploaderForUpload(evt.target.files);
    };
    uploader_progress_bar_div.appendChild(uploader_progress_bar);
    upload_path_div_1.appendChild(uploade_path_text);
    upload_path_div_1.appendChild(uploader_file_input);
    upload_path_div_1.appendChild(uploader_file_label);
    upload_path_div_2.appendChild(uploader_run_cmd);
    upload_path_div_2.appendChild(uploader_run_cmd_submit);
    upload_path_div_main.appendChild(upload_path_div_1);
    upload_path_div_main.appendChild(uploader_progress_bar_div);
    upload_path_div_main.appendChild(upload_path_div_2);
    upload_path_div_main.appendChild(uploader_run_cmd_output_div);

    function uploaderForUpload(files) {
        if (files.length !== 0) {
            let xhr = new XMLHttpRequest();
            let fd = new FormData();
            for (let i = 0; i < files.length; i++) {
                fd.append("files", files[i]);
            }
            xhr.open("post", "/uploader_tab/api/upload", true);
            xhr.setRequestHeader("upload_path", uploade_path_text.value);
            uploader_file_label.disabled = true;
            uploader_progress_bar_div.style.display = "block";
    
            // 处理上传进度
            xhr.upload.onprogress = function (event) {
                if (event.lengthComputable) {
                    const progress = (event.loaded / event.total);
                    uploader_progress_bar.value = progress; // 更新进度条的值
                }
            };
    
            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    uploader_file_label.disabled = false;
                    uploader_progress_bar_div.style.display = "none";
                    uploader_progress_bar.value = 0;
                }
            };
    
            xhr.send(fd);
        }
    }
    uploader_run_cmd.onkeyup = function(evt){
        if (evt.key == 'Enter') {
            uploader_ws.send("runcmd" + uploader_run_cmd.value)
        }
    }
    upload_path_div_main.addEventListener("drop", function(event) {
        event.preventDefault();
        upload_path_div_main.addEventListener("dragover", preventDefaultHandler);
        upload_path_div_main.style.backgroundColor = uploader_backgroung_color;
        uploade_path_text.style.backgroundColor = uploader_backgroung_color;
        const files = event.dataTransfer.files;
        uploaderForUpload(files);
        upload_path_div_main.removeEventListener("dragover", preventDefaultHandler);
    });
    
    upload_path_div_main.addEventListener("dragover", handleDragOver);
    upload_path_div_main.addEventListener("dragleave", handleDragLeave);
    
    function handleDragOver(event) {
        event.preventDefault();
        upload_path_div_main.style.backgroundColor = "lightblue";
        uploade_path_text.style.backgroundColor = "lightblue";
    }
    
    function handleDragLeave(event) {
        event.preventDefault();
        upload_path_div_main.style.backgroundColor = uploader_backgroung_color;
        uploade_path_text.style.backgroundColor = uploader_backgroung_color;
    }
    
    function preventDefaultHandler(event) {
        event.preventDefault();
    }

    let = resizeable = false;
    let clientY;
    uploader_run_cmd_output_div.onmousedown = function(evt){
        if (evt.buttons == 2){
            evt.preventDefault();
            resizeable = true;
            clientY = evt.clientY;
        } else{
            evt.removeEventListener("onmousedown",preventDefaultHandler);
        }
    }
    uploader_run_cmd_output_div.onmouseup = function(evt){
        if (resizeable){
        uploader_run_cmd_output_div.style.height = uploader_run_cmd_output_div.offsetHeight + (evt.clientY - clientY) + 'px';
        clientY = evt.clientY;
    }}
    uploader_run_cmd_submit.onclick = function(){
        uploader_ws.send(uploader_run_cmd.value);
    }
    
    setTimeout(function() {
        document.body.appendChild(count_div)
        const uploader_tab = document.getElementById("tab_extension_uploader");
        uploader_tab.insertBefore(upload_path_div_main,uploader_tab.children[0]);
    },1000*25);
}

let uploader_backgroung_color = "";
let fontColor = "";
document.addEventListener('DOMContentLoaded', (event) => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches || window.location['href'].endsWith('__theme=dark')) {
        // 系统主题为黑暗模式
        uploader_backgroung_color = "rgb(13, 17, 23)";
        fontColor = "white";
      }else{
        uploader_backgroung_color = "white";
        fontColor = "black";
      }
    getPublicIp();
    uploaderCraeteElementsAndWait();
});
