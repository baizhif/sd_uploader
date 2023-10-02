import gradio as gr
import os
import subprocess
from zipfile import ZipFile

from modules import script_callbacks

extensions_path = __file__.split("/extensions")[0]

def runZipToDownload(path):
    if os.path.exists(path) is False:
        yield "下载路径既不是文件也不是目录"
        return
    path = path.strip()
    if os.path.isdir(path):
        tgt_folder = os.path.join(extensions_path,"temp")
        if os.path.exists(path) is False:
            os.makedirs(tgt_folder)
        filein = os.path.join(tgt_folder, os.path.basename(path) + ".zip")
        zip = ZipFile(filein, "w", 8)
        for path, _, filenames in os.walk(path):
            fpath = path.replace(path, '')
            for filename in filenames:
                yield os.path.join(path,filename)
                zip.write(os.path.join(path, filename), os.path.join(fpath, filename))
        zip.close()
    else:
        filein = path
    yield "文件位于: " + filein

def on_ui_tabs():
    with gr.Blocks(analytics_enabled=False) as ui_component:
        with gr.Column():
            pass
        return [(ui_component, "uploader", "extension_uploader")]
    
from fastapi import FastAPI, WebSocket, WebSocketDisconnect,UploadFile,Request,File
from typing import List
class ConnectionManager:
    def __init__(self):
        self.user_count = 0
        self.ws_count = 0
        self.ip_pool = dict()

    async def connect(self, websocket: WebSocket, ip_addr):
        await websocket.accept()
        if ip_addr in self.ip_pool:
            self.ip_pool[ip_addr].append(websocket)
        else:
            self.ip_pool[ip_addr] = [websocket]
            self.user_count +=1
        self.ws_count +=1

    def disconnect(self, websocket: WebSocket, ip_addr):
        self.ip_pool[ip_addr].remove(websocket)
        if self.ip_pool[ip_addr] == []:
            self.ip_pool.pop(ip_addr)
            self.user_count -= 1
        self.ws_count -= 1

    async def broadcast(self, message: str):
        for connection in (ws for wss in self.ip_pool.values() for ws in wss):
            await connection.send_text(message)

class someMethods:
    def runcmd(cmd:str):
        if not cmd:
            yield "\n"
            return
        if cmd.startswith("cd"):
            if os.path.isdir(cmd[2:].strip()):
                os.chdir(cmd[2:].strip())
                yield f"wkdir{cmd[2:].strip()}"
            else:
                yield "the " + cmd[2:].strip() + " dir not found! check your input."
            return
        p = subprocess.Popen(cmd, shell = True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
        for info in iter(p.stdout.readline, b''):
            yield info.decode('utf-8')
        

async def dataProcess(data:str,ws:WebSocket):
    try:
        if data.startswith("runcmd"):
            cmd = data[6:].strip()
            for info in someMethods.runcmd(cmd):
                await ws.send_text(("cmd" + info).strip())
            await ws.send_text("finshed")
        elif data.startswith("zipOutputs"):
            path = data[10:]
            for info in runZipToDownload(path):
                await ws.send_text("cmd" + info)
        elif data == "getOutputsPath":
            await ws.send_text("outputs_path:"+ os.path.join(extensions_path,'outputs'))
    except Exception as e:
        await ws.send_text("cmd出错了" + str(e))
manager = ConnectionManager()
models_path = {
    "Lora":os.path.join(extensions_path,"models/Lora"),
    "MainModel":os.path.join(extensions_path,"models/Stable-diffusion"),
    "VAE":os.path.join(extensions_path,"models/VAE"),
    "Controlnet":os.path.join(extensions_path,"extensions/sd-webui-controlnet/models"),
    "Embeddings":os.path.join(extensions_path,"embeddings"),
    "ESRGAN":os.path.join(extensions_path,"models/ESRGAN"),
}

import requests
def getSrcFileName(url):
    response = requests.get(url,stream=True)
    content_disposition = None
    if response.status_code == 200:
        content_disposition = response.headers.get('content-disposition')
        response.close()
    else:
        print(url, "获取文件名出错将以url尾部作为名字",response.status_code, response.headers)
    filename = content_disposition.split('filename="')[1].strip('";') if content_disposition else os.path.basename(url)
    return filename

def on_app_started(_: gr.Blocks, app: FastAPI) -> None:
    @app.websocket("/ws/{ip_addr}")
    async def websocket_endpoint(websocket: WebSocket,ip_addr:str):
        await manager.connect(websocket, ip_addr)
        await manager.broadcast(f"user_count:{manager.user_count}\tpage_count:{manager.ws_count}")
        try:
            while True:
                data = await websocket.receive_text()
                await dataProcess(data,websocket)
        except WebSocketDisconnect:
            manager.disconnect(websocket,ip_addr)
            await manager.broadcast(f"user_count:{manager.user_count}\tpage_count:{manager.ws_count}")
    @app.post("/uploader_tab/api/upload")
    async def filesUploadProcess(request: Request,files: List[UploadFile] = File(...)):
        path = request.headers.get("upload_path").strip()
        if os.path.exists(path) is False:
            os.makedirs(path)
        for file in files:
            with open(os.path.join(path,file.filename),"wb") as f:
                for chunk in iter(lambda:file.file.read(1024*1024*10),b''):
                    f.write(chunk)
            f.close()
        return {"succeed":[file.filename for file in files]}
    @app.get("/uploader_tab/api/downloader")
    async def downloadModelByUrl(request: Request):
        model_type = request.headers.get("target_model_type")
        model_url = request.headers.get("target_model").strip()
        if model_type == "Custom":
            model_url,tgt_path = model_url.split(' ')
        else:
            tgt_path = models_path[model_type]
        filename = getSrcFileName(model_url.strip())
        cmd = f"aria2c --console-log-level=error -c -x 16 -s 16 -k 1M {model_url.strip()} -d {tgt_path} -o {filename}"
        return cmd

script_callbacks.on_ui_tabs(on_ui_tabs)
script_callbacks.on_app_started(on_app_started)
