let uploader_ws_url = 'ws://'+ window.location['host'] + '/ws'

let uploader_ws = new WebSocket(uploader_ws_url);
uploader_ws.onerror = function () {
    console.log("错误");
}
