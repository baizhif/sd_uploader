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
        new_uploader_ws(client_url);
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
    const uploader_run_cmd_submit = document.createElement("button")
    const uploader_file_button = document.createElement("button");
    const uploader_file_input = document.createElement("input");
    const uploader_progress_bar_div = document.createElement("div");
    const uploader_progress_bar = document.createElement("progress");
    const uploader_download_model = document.createElement("div");
    const uploader_download_url = document.createElement("input");
    const uploader_download_type = document.createElement("select");
    const uploader_download_type_checkpoint = document.createElement("option");
    const uploader_download_type_lora = document.createElement("option");
    const uploader_download_type_custom = document.createElement("option");
    uploader_download_type_checkpoint.innerText = "checkpoint"
    uploader_download_url.placeholder = "输入模型链接"
    uploader_download_type_lora.innerText = "lora"
    uploader_download_type_custom.innerText = "custom"
    uploader_download_type.appendChild(uploader_download_type_checkpoint);
    uploader_download_type.appendChild(uploader_download_type_lora);
    uploader_download_type.appendChild(uploader_download_type_custom);
    uploader_download_model.appendChild(uploader_download_url);
    uploader_download_model.appendChild(uploader_download_type);

    uploader_run_cmd.placeholder = "输入要执行的命令"
    uploade_path_text.type = "text";
    uploader_run_cmd.type = "text";
    uploade_path_text.value = "/kaggle";
    uploade_path_text.placeholder = "输入要上传到指定的路径";
    uploader_run_cmd_submit.innerText = "执行";
    uploader_file_input.type = "file";
    uploader_file_input.multiple = "multiple";
    uploader_file_input.id = "uploader_file_input";
    uploader_file_button.innerText = "上传";
    count_div.style.backgroundColor = uploader_backgroung_color;
    count_div.style.color = fontColor;

    uploader_download_url.style.width = "95%";
    uploader_download_type.style.width = "5%";
    uploader_download_model.style.backgroundColor = fontColor;
    upload_path_div_1.style.display = "flex";
    upload_path_div_main.style.justifyContent = "space-between";
    upload_path_div_1.style.width = "100%";
    uploade_path_text.style.width = "95%";
    uploader_run_cmd.style.backgroundColor = uploader_backgroung_color;
    uploader_run_cmd.style.width = "95%";
    uploader_file_input.style.display = "none";
    uploader_file_button.style.cursor = "pointer";
    uploader_run_cmd_submit.style.cursor = "pointer";
    uploader_file_button.style.width = "5%";
    uploader_run_cmd_submit.style.width = "5%";
    uploader_run_cmd_submit.style.height = "100%";
    upload_path_div_main.style.backgroundColor = uploader_backgroung_color;
    upload_path_div_main.style.color = fontColor;
    uploade_path_text.style.backgroundColor = uploader_backgroung_color;
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
    upload_path_div_1.appendChild(uploader_file_button);
    upload_path_div_2.appendChild(uploader_run_cmd);
    upload_path_div_2.appendChild(uploader_run_cmd_submit);
    upload_path_div_main.appendChild(upload_path_div_1);
    upload_path_div_main.appendChild(uploader_progress_bar_div);
    upload_path_div_main.appendChild(upload_path_div_2);
    upload_path_div_main.appendChild(uploader_run_cmd_output_div);
    upload_path_div_main.appendChild(uploader_download_model);

    function uploaderForUpload(files) {
        if (files.length !== 0) {
            let xhr = new XMLHttpRequest();
            let fd = new FormData();
            for (let i = 0; i < files.length; i++) {
                fd.append("files", files[i]);
            }
            xhr.open("post", "/uploader_tab/api/upload", true);
            xhr.setRequestHeader("upload_path", uploade_path_text.value);
            uploader_file_button.disabled = true;
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
                    uploader_file_button.disabled = false;
                    uploader_progress_bar_div.style.display = "none";
                    uploader_progress_bar.value = 0;
                }
            };
    
            xhr.send(fd);
        }
    }
    uploader_run_cmd.onkeyup = function(evt){
        if (evt.key == 'Enter') {
            if (uploader_run_cmd.value === "clear" || uploader_run_cmd.value === "cls"){
                uploader_run_cmd_output_div.innerText = "";
                uploader_run_cmd_output_div.style.display = "none";
                return;
            }
            uploader_ws.send("runcmd" + uploader_run_cmd.value)
        }
    }
    uploader_file_button.addEventListener("click",function(){uploader_file_input.click()})
    upload_path_div_1.addEventListener("drop", function(event) {
        event.preventDefault();
        upload_path_div_1.addEventListener("dragover", preventDefaultHandler);
        upload_path_div_1.style.backgroundColor = uploader_backgroung_color;
        uploade_path_text.style.backgroundColor = uploader_backgroung_color;
        const files = event.dataTransfer.files;
        uploaderForUpload(files);
        upload_path_div_1.removeEventListener("dragover", preventDefaultHandler);
    });
    
    upload_path_div_1.addEventListener("dragover", handleDragOver);
    upload_path_div_1.addEventListener("dragleave", handleDragLeave);
    
    function handleDragOver(event) {
        event.preventDefault();
        upload_path_div_1.style.backgroundColor = "lightblue";
        uploade_path_text.style.backgroundColor = "lightblue";
    }
    
    function handleDragLeave(event) {
        event.preventDefault();
        upload_path_div_1.style.backgroundColor = uploader_backgroung_color;
        uploade_path_text.style.backgroundColor = uploader_backgroung_color;
    }
    
    function preventDefaultHandler(event) {
        event.preventDefault();
    }

    let resizeable = false;
    let clientY;
    
    uploader_run_cmd_output_div.addEventListener("mousemove",function(evt){
        const dir = getDirection(evt)
        if (dir !== '') {
            uploader_run_cmd_output_div.style.cursor = dir + '-resize';
        } else{
            uploader_run_cmd_output_div.style.cursor = "default";
        }
    })
    uploader_run_cmd_output_div.addEventListener("mouseup",function(evt){
        uploader_tab.removeEventListener("mousemove",uploader_move);
        resizeable = false;
    })
    uploader_run_cmd_output_div.addEventListener("mousedown",function(evt){
        const dir = getDirection(evt)
        if (dir !== '') {
            uploader_tab.addEventListener("mousemove",uploader_move)
            resizeable = true;
            clientY = evt.clientY;
        }else{
            uploader_tab.removeEventListener("mousemove",uploader_move);
        }
    })
    uploader_run_cmd_output_div.addEventListener("mouseleave",function(evt){
        uploader_tab.removeEventListener("mousemove",uploader_move)
        resizeable = false;
    })
    function uploader_move(evt){
        if (resizeable) {
            uploader_run_cmd_output_div.style.height = uploader_run_cmd_output_div.offsetHeight + evt.clientY-clientY + "px"
            clientY = evt.clientY
        }
    }
    function getDirection(evt) {
        let xP, yP, offset, dir;
        dir = '';
        xP = evt.offsetX;
        yP = evt.offsetY;
        offset = 20;

        if (yP < offset) dir += 'n';
        else if (yP > uploader_run_cmd_output_div.offsetHeight - offset) dir += 's';

        return dir;
    }

    uploader_download_url.onkeyup = function(evt){
        if (evt.key === "Enter"){
            xhr = new XMLHttpRequest();
            xhr.open("get","/uploader_tab/api/downloader",true);
            xhr.setRequestHeader("target_model_url",uploader_download_url.value);
            xhr.setRequestHeader("target_model_type",uploader_download_type.options[uploader_download_type.selectedIndex].text);
            xhr.send();
            xhr.onload = function () {
                let cmd = xhr.responseText;
                uploader_download_url.innerText = cmd;
                uploader_ws.send("runcmd" + cmd);
            }
        }
    }
    
    uploader_run_cmd_submit.addEventListener("click",function(){
        if (uploader_run_cmd.value === "clear" || uploader_run_cmd.value === "cls"){
            uploader_run_cmd_output_div.innerText = "";
            uploader_run_cmd_output_div.style.display = "none";
            return;
        }
        uploader_ws.send("runcmd" + uploader_run_cmd.value);
    })

    
    let uploader_tab;
    setTimeout(function() {
        document.body.appendChild(count_div)
        uploader_tab = document.getElementById("tab_extension_uploader");
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
