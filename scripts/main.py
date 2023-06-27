import gradio as gr
import os
import subprocess

from modules import script_callbacks

def uploadeFile(files,path):
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

def runCmd(cmd):
    sub_stdout = ''
    p = subprocess.Popen(cmd, shell = True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    while True:
        r = p.stdout.read().decode('gbk')
        if r:
            sub_stdout +=r
        if subprocess.Popen.poll(p) != None and not r:
            break
    return sub_stdout

def on_ui_tabs():
    with gr.Blocks(analytics_enabled=False) as ui_component:
        with gr.Column():
            text = gr.Text("/kaggle")
            text = gr.Text(label="上传路径", value="/kaggle")
            uploader = gr.File(file_count="multiple")
            cmd_text = gr.Text(label="执行命令")
            label_output = gr.Text()

        uploader = uploader
        uploader.change(fn=uploadeFile, inputs=[uploadeFile,text], outputs=[label_output])
        cmd_text.submit(fn=runCmd,inputs=[cmd_text],outputs=label_output)
        return [(ui_component, "uploader", "extension_uploader_tab")]

script_callbacks.on_ui_tabs(on_ui_tabs)
