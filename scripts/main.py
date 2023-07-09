import gradio as gr
import os
import subprocess
from zipfile import ZipFile

from modules import script_callbacks

def uploadeFile(files,path):
    if path.startswith("/kaggle/working"):
        return "你想干嘛?"
    path = path.strip()
    if files is None:
        return
    if not os.path.exists(path):
        os.makedirs(path)
    info = ''
    for file in files:
        with open(file.name,"rb") as f:
            ft = open(os.path.join(path,os.path.basename(file.name)), "wb")
            ft.write(f.read())
            ft.close()
            os.remove(file.name)
            info += file.name + "->" + os.path.join(path,os.path.basename(file.name)) + '\n'
    return info

def runZipToDownload(path):
    path = path.strip()
    if os.path.isdir(path):
        filein = os.path.join('./',os.path.basename(path) + ".zip")
        zip = ZipFile(filein, "w", 8)
        for path, _, filenames in os.walk(path):
            fpath = path.replace(path, '')
            for filename in filenames:
                zip.write(os.path.join(path, filename), os.path.join(fpath, filename))
        zip.close()
    else:
        if os.path.exists(path) is False:
            raise FileNotFoundError
        filein = path
    return filein

def runCmd(cmd):
    p = subprocess.run(cmd.strip(), shell = True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, stdin=subprocess.PIPE)
    try:
        return p.stdout.decode('gbk')
    except UnicodeDecodeError:
        return p.stdout.decode('utf-8')
def on_ui_tabs():
    with gr.Blocks(analytics_enabled=False) as ui_component:
        with gr.Column():
            text = gr.Text(label="上传路径", value="/kaggle")
            uploader = gr.File(file_count="multiple",elem_id="uploader_file_input")
            cmd_text = gr.Text(label="执行命令")
            download_path_Text = gr.Text(label="输入下载的目录如:\n/kaggle/stable-diffusion-webui/outputs")

            label_output = gr.Text(label="输出")
            fileOut = gr.File(label="文件输出")
        download_path_Text.submit(fn=runZipToDownload,inputs=[download_path_Text],outputs=fileOut)
        uploader.change(fn=uploadeFile, inputs=[uploader,text], outputs=[label_output])
        cmd_text.submit(fn=runCmd,inputs=[cmd_text],outputs=label_output)
        return [(ui_component, "uploader", "extension_uploader")]
    
from fastapi import FastAPI, WebSocket, WebSocketDisconnect,UploadFile,Header,File
from typing import List
from typing import Optional
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

    async def send_personal_message(self, message: str, websocket: WebSocket):
        if websocket.client_state == 1:
            await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in (ws for wss in self.ip_pool.values() for ws in wss):
            await connection.send_text(message)

manager = ConnectionManager()

def on_app_started(_: gr.Blocks, app: FastAPI) -> None:
    @app.websocket("/ws/{ip_addr}")
    async def websocket_endpoint(websocket: WebSocket,ip_addr:str):
        await manager.connect(websocket, ip_addr)
        await manager.broadcast(f"user_count:{manager.user_count}\tpage_count:{manager.ws_count}")
        try:
            while True:
                data = await websocket.receive_text()
                await manager.send_personal_message(f"You wrote: {data}", websocket)
        except WebSocketDisconnect:
            manager.disconnect(websocket,ip_addr)
            await manager.broadcast(f"user_count:{manager.user_count}\tpage_count:{manager.ws_count}")
    @app.post("/uploader_tab/api/upload")
    async def filesUploadProcess(files: List[UploadFile] = File(...), Path: Optional[str] = None):
        print(files,path)
        for file in files:
            with open(os.path.join(path,file.filename),"wb") as f:
                for chunk in iter(lambda:file.file.read(1024*1024*10),b''):
                    f.write(chunk)
            f.close()
        return {"succeed":[file.filename for file in files]}


script_callbacks.on_ui_tabs(on_ui_tabs)
script_callbacks.on_app_started(on_app_started)
