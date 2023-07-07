import gradio as gr
import os
import subprocess
from zipfile import ZipFile
from fastapi import FastAPI

from modules import script_callbacks

def uploadeFile(files,path):
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

def getSDOutputsFolder():
    SDPath = __file__.split("/extensions")[0]
    if os.path.exists(os.path.join(SDPath,"/stable-diffusion-webui/outputs")):
        return os.path.join(SDPath,"/stable-diffusion-webui/outputs")
    elif os.path.exists(os.path.join(SDPath,"/stable-diffusion-webui")):
        return os.path.join(SDPath,"/stable-diffusion-webui")
    else:
        return SDPath

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
            download_path_Text = gr.Text(label=f"输入下载的目录{getSDOutputsFolder()}")

            label_output = gr.Text(label="输出")
            fileOut = gr.File(label="文件输出")
        download_path_Text.submit(fn=runZipToDownload,inputs=[download_path_Text],outputs=fileOut)
        uploader.change(fn=uploadeFile, inputs=[uploader,text], outputs=[label_output])
        cmd_text.submit(fn=runCmd,inputs=[cmd_text],outputs=label_output)
        return [(ui_component, "uploader", "extension_uploader_tab")]
    
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []
        self.user_count = 0
        self.ip_pool = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

def on_app_started(_: gr.Blocks, app: FastAPI) -> None:
    @app.websocket("/ws/{ip_addr}")
    async def websocket_endpoint(websocket: WebSocket,ip_addr:str):
        await manager.connect(websocket)
        if not ip_addr in manager.ip_pool:
            manager.user_count +=1
            manager.ip_pool.add(ip_addr)
            await manager.broadcast(f"ip_count:{manager.user_count}\nws_count:{len(manager.active_connections)}")
        try:
            while True:
                data = await websocket.receive_text()
                await manager.send_personal_message(f"You wrote: {data}", websocket)
        except WebSocketDisconnect:
            manager.disconnect(websocket)
            manager.user_count -=1
            await manager.broadcast(f"ip_count:{manager.user_count}\nws_count:{len(manager.active_connections)}")


script_callbacks.on_ui_tabs(on_ui_tabs)
script_callbacks.on_app_started(on_app_started)
