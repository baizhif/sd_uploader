let uploader_ws_url = '';
let uploader_ws = null;
let count_div = document.createElement("div");
const uploade_path_text = document.createElement("input");
const uploader_file_label = document.createElement("label");
const uploader_file_input = document.createElement("input");

function getPublicIp() {
  fetch("https://api.ipify.org/?format=json")
    .then(response => response.json())
    .then(data => {
      const public_ip = data.ip;
      const client_url = `${uploader_ws_url}/${public_ip.replace(/\./g, '_')}`;
      new_uploader_ws(client_url);
    })
    .catch(() => {
      setTimeout(getPublicIp, 3000);
    });
}

function new_uploader_ws(client_url) {
  if (uploader_ws && uploader_ws.readyState !== WebSocket.CLOSED) {
    uploader_ws.close();
  }

  uploader_ws = new WebSocket(client_url);
  uploader_ws.onerror = function() {
    uploader_ws.close();
    uploader_ws = null;
    setTimeout(getPublicIp, 3000);
  };
  uploader_ws.onclose = function() {
    uploader_ws.close();
    uploader_ws = null;
    setTimeout(getPublicIp, 3000);
  };
  uploader_ws.onmessage = function(evt) {
    count_div.innerText = evt.data;
  };
}

function handleFileUpload(evt) {
  if (evt.target.files.length !== 0) {
    const formData = new FormData();
    for (let i = 0; i < evt.target.files.length; i++) {
      formData.append("file", evt.target.files[i]);
    }

    fetch("/uploader_tab/api/upload", {
      method: "POST",
      body: formData,
      headers: {
        "path": uploade_path_text.value
      }
    })
      .then(response => {
        if (response.ok) {
          uploader_file_label.disabled = false;
        }
      })
      .catch(() => {
        uploader_file_label.disabled = false;
      });

    uploader_file_label.disabled = true;
  }
}

function uploaderCreateElementsAndWait() {
  uploade_path_text.type = "text";
  uploade_path_text.value = "/kaggle";
  uploader_file_input.type = "file";
  uploader_file_input.multiple = "multiple";
  uploader_file_input.id = "uploader_file_input";
  uploader_file_input.style.display = "none";
  uploader_file_label.setAttribute("for", "uploader_file_input");
  uploader_file_label.style.backgroundColor = "blue";
  uploader_file_label.style.cursor = "pointer";
  uploader_file_input.onchange = handleFileUpload;

  setTimeout(function() {
    const uploader_tab = document.getElementById("tab_extension_uploader");
    uploader_tab.insertBefore(uploader_file_input, uploader_tab.children[0]);
    uploader_tab.insertBefore(uploader_file_label, uploader_tab.children[0]);
    uploader_tab.insertBefore(uploade_path_text, uploader_tab.children[0]);
  }, 1000*50);
}

document.addEventListener("DOMContentLoaded", () => {
  if (window.location.href.endsWith("__theme=dark")) {
    count_div.style.background = "rgb(13, 17, 23)";
    count_div.style.color = "white";
  }

  document.body.appendChild(count_div);
  uploader_ws_url =
    window.location.protocol === "https:" ?
    `wss://${window.location.host}/ws` :
    `ws://${window.location.host}/ws`;

  getPublicIp();
  uploaderCreateElementsAndWait();
});
