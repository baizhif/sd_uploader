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
    if (uploader_ws & !uploader_ws.CLOSED) {
        uploader_ws.close()
    }
    uploader_ws = new WebSocket(client_url);
    uploader_ws.onerror = function () {
        getPublicIp();
    }
    uploader_ws.onmessage = function setCount(evt) {
        
        if (document.body.className == "dark") {
            count_div.style = "background:rgb(13, 17, 23);color:white"
        }
        document.body.appendChild(count_div)
        count_div.innerText = evt.data
    }
}

getPublicIp();
