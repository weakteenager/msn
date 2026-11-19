(function () {
  var sessionId = "";
  var lastMessageId = 0;
  var chatArea = document.getElementById("chat-area");
  var username = document.getElementById("username");
  var onlineCount = document.getElementById("online-count");
  var form = document.getElementById("message-form");
  var input = document.getElementById("message-input");
  var sendButton = document.getElementById("send-button");
  var busy = false;

  function request(method, url, data, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) return;
      var result = null;
      try { result = JSON.parse(xhr.responseText); } catch (e) {}
      callback(xhr.status, result);
    };
    xhr.send(data ? JSON.stringify(data) : null);
  }

  function addMessage(message) {
    if (!message || message.id <= lastMessageId) return;
    lastMessageId = message.id;

    var wrap = document.createElement("div");
    wrap.className = "message";
    var head = document.createElement("div");
    head.className = "message-head";
    var name = document.createElement("span");
    name.className = "message-name";
    name.textContent = message.name;
    var time = document.createElement("span");
    time.className = "message-time";
    time.textContent = message.time || "";
    var body = document.createElement("div");
    body.className = "message-text";
    body.textContent = message.text;
    head.appendChild(name);
    head.appendChild(time);
    wrap.appendChild(head);
    wrap.appendChild(body);
    chatArea.appendChild(wrap);
    chatArea.scrollTop = chatArea.scrollHeight;
  }

  function updateOnline(count) {
    onlineCount.textContent = count + (count === 1 ? " kişi çevrimiçi" : " kişi çevrimiçi");
  }

  function poll() {
    if (!sessionId) return;
    request("GET", "/api/state?id=" + encodeURIComponent(sessionId) + "&after=" + lastMessageId, null, function (status, data) {
      if (status === 200 && data) {
        updateOnline(data.online);
        for (var i = 0; i < data.messages.length; i++) addMessage(data.messages[i]);
      } else if (status === 401) {
        location.reload();
      }
    });
  }

  function join() {
    request("POST", "/api/join", {}, function (status, data) {
      if (status !== 200 || !data) {
        username.textContent = "Bağlantı kurulamadı";
        return;
      }
      sessionId = data.id;
      username.textContent = data.name;
      for (var i = 0; i < data.messages.length; i++) addMessage(data.messages[i]);
      updateOnline(data.online);
      input.disabled = false;
      sendButton.disabled = false;
      input.focus();
      setInterval(poll, 1800);
      setInterval(function () {
        request("POST", "/api/ping", { id: sessionId }, function (code, result) {
          if (code === 200 && result) updateOnline(result.online);
        });
      }, 12000);
    });
  }

  form.onsubmit = function (event) {
    if (event && event.preventDefault) event.preventDefault();
    var text = input.value.replace(/^\s+|\s+$/g, "");
    if (!text || !sessionId || busy) return false;
    busy = true;
    sendButton.disabled = true;
    request("POST", "/api/message", { id: sessionId, text: text }, function (status, data) {
      busy = false;
      sendButton.disabled = false;
      if (status === 200 && data && data.message) {
        input.value = "";
        addMessage(data.message);
        input.focus();
      } else if (data && data.error) {
        alert(data.error);
      }
    });
    return false;
  };

  join();
}());
