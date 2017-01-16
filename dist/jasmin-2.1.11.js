if (jasmin === undefined) {
  var jasmin = function() {
  }
}
jasmin.ErrorManager = function(callback, maxErrorCount) {
  this.callback = callback;
  this.maxErrorCount = maxErrorCount === undefined ? 10 : maxErrorCount;
  this.errorCount = 0;
};
jasmin.ErrorManager.prototype.callbackWindowError = function() {
  var self = this;
  return function(msg, url, line, col, error) {
    if (!(error instanceof Object)) {
      error = {};
    }
    var errorPackage = {"from":"window.onerror", "msg":msg, "url":url, "line":line, "col":col, "stack":error.stack};
    self.onError(errorPackage);
  };
};
jasmin.ErrorManager.prototype.onError = function(errorPackage) {
  if (this.errorCount < this.maxErrorCount) {
    this.errorCount++;
    this.callback(errorPackage);
  }
};
jasmin.ErrorManager.prototype.callbackFail = function() {
  var self = this;
  return function(msg) {
    var errorPackage = {"from":"fail", "msg":msg};
    self.onError(errorPackage);
  };
};
jasmin.ErrorManager.errorToJasminHandler = function(url, runId) {
  return function(errorPackage) {
    var lotusRequests = [{"runId":runId, "requestId":"error", "request":{"namespace":"error", "info":errorPackage}}];
    console.log(JSON.stringify(lotusRequests));
    var ajaxArgs = {"url":url, "dataType":"json", "type":"POST", "data":"data=" + encodeURI(JSON.stringify(lotusRequests))};
    $.ajax(ajaxArgs);
  };
};
if (jasmin === undefined) {
  var jasmin = function() {
  }
}
jasmin.EventManager = function(override) {
  this.responseManager = new jasmin.ResponseManager(override);
  this.syncTimer = new jasmin.SyncTimer;
  this.callbackDone = undefined;
};
jasmin.EventManager.ENDREASON_TIMEOUT = "timeout";
jasmin.EventManager.ENDREASON_RESPONSE = "response";
jasmin.EventManager.ENDREASON_CANCELED = "canceled";
jasmin.EventManager.prototype.start = function(buttonDefinitions, callbackSynced) {
  this.responseManager.attach(buttonDefinitions);
  this.syncTimer.sync(function() {
    callbackSynced();
  });
};
jasmin.EventManager.prototype.stop = function() {
  this.responseManager.detach();
  this.syncTimer.unsync();
};
jasmin.EventManager.prototype.startEvent = function(timeout, callbackDraw, callbackDone, buttonsActive, resetRt, name, callbackEvent) {
  this.clearLoggingVars();
  this.timeout = timeout;
  this.callbackDraw = callbackDraw;
  this.callbackDone = callbackDone;
  this.buttonsActive = buttonsActive;
  this.resetRt = resetRt !== undefined ? resetRt : true;
  this.name = name !== undefined ? name : "noname";
  this.callbackEvent = callbackEvent;
  var self = this;
  this.responseManager.activate(buttonsActive, function() {
    self.endEvent(jasmin.EventManager.ENDREASON_RESPONSE);
  }, this.callbackEvent);
  this.syncTimer.setTimeout(timeout, function() {
    self.callbackDraw();
  }, function() {
    self.endEvent(jasmin.EventManager.ENDREASON_TIMEOUT);
  }, this.name);
};
jasmin.EventManager.prototype.endEvent = function(endReason) {
  this.responseManager.deactivate();
  if (endReason !== jasmin.EventManager.ENDREASON_TIMEOUT) {
    this.syncTimer.cancelTimeout();
  }
  if (this.resetRt) {
    if (this.syncTimer.shown === false) {
      this.timeRtStart = window.performance.now();
    } else {
      this.timeRtStart = this.syncTimer.timeShown;
    }
  }
  if (endReason === jasmin.EventManager.ENDREASON_RESPONSE) {
    var responseLog = this.responseManager.getResponseLog();
    this.rt = responseLog["time"] - this.syncTimer.timeShown;
    this.responseLabel = responseLog["label"];
    this.responseId = responseLog["id"];
    this.responseModality = responseLog["modality"];
  }
  this.endReason = endReason;
  this.updateEventLog();
  if (endReason !== jasmin.EventManager.ENDREASON_CANCELED) {
    this.callbackDone();
  }
};
jasmin.EventManager.prototype.cancelEvent = function() {
  this.endEvent(jasmin.EventManager.ENDREASON_CANCELED);
};
jasmin.EventManager.prototype.updateEventLog = function() {
  this.eventLog = {"name":this.name, "rt":Math.round(this.rt * 1E3) / 1E3, "endReason":this.endReason, "responseLabel":this.responseLabel, "modality":this.responseModality, "id":this.responseId};
};
jasmin.EventManager.prototype.getEventLog = function() {
  return this.eventLog;
};
jasmin.EventManager.prototype.clearLoggingVars = function() {
  this.name = undefined;
  this.rt = undefined;
  this.endReason = undefined;
  this.responseLabel = undefined;
  this.responseId = undefined;
  this.responseModality = undefined;
};
if (jasmin === undefined) {
  var jasmin = function() {
  }
}
jasmin.Loader = function(requestManager, baseUrls) {
  this.requestManager = requestManager;
  this.baseUrls = baseUrls;
};
jasmin.Loader.prototype.load = function(requests, allLoaded, progressCallback) {
  this.allLoaded = allLoaded;
  this.progressCallback = progressCallback === undefined ? function() {
  } : progressCallback;
  this.replies = {};
  this.loadCounter = 0;
  this.loadTotal = 0;
  this.progressCallback(0);
  this.doRequests(requests);
  var self = this;
  this.requestManager.flush(function() {
    self.allLoaded(self.replies);
  });
};
jasmin.Loader.prototype.doRequests = function(requests) {
  var self = this;
  for (var key in requests) {
    this.loadTotal++;
    var closure = function(key, dataType, url, request) {
      var requestType, request;
      if (self.baseUrls !== undefined && self.baseUrls[dataType] !== undefined) {
        url = self.baseUrls[dataType] + url;
      }
      switch(dataType) {
        case "css":
          requestType = jasmin.RequestManager.TYPE_AJAX;
          request = {"url":url, "dataType":"text"};
          break;
        case "img":
          requestType = jasmin.RequestManager.TYPE_IMG;
          request = url;
          break;
        default:
          requestType = jasmin.RequestManager.TYPE_AJAX;
          if (request === undefined) {
            request = {};
          }
          request["dataType"] = dataType;
          request["url"] = url;
          break;
      }
      if (dataType === "font") {
        request["dataType"] = "binary";
        request["processData"] = false;
      }
      DEBUG && console.log({"what":"request", "key":key, "dataType":dataType, "url":url, "request":request});
      self.requestManager.request(requestType, request, function(reply) {
        DEBUG && console.log({"what":"reply", "key":key, "dataType":dataType, "url":url, "request":request, "reply":reply});
        if (dataType === "css") {
          $('<link rel="stylesheet" type="text/css" href="' + url + '" />').appendTo("head");
        }
        if (dataType === "font") {
          $("head").prepend('<style type="text/css">@font-face {' + 'src : url("' + request["url"] + '");' + "font-family : " + request["font-family"] + ";" + "font-weight : " + request["font-weight"] + ";" + "font-style  : " + request["font-style"] + ";" + "}");
        }
        self.replies[key] = reply;
        self.loadCounter++;
        self.progress();
      });
    };
    closure(key, requests[key][0], requests[key][1], requests[key][2], requests[key][3]);
  }
};
jasmin.Loader.prototype.progress = function() {
  this.progressCallback(Math.round(100 * this.loadCounter / this.loadTotal));
};
if (jasmin === undefined) {
  var jasmin = function() {
  }
}
jasmin.ModalDialog = function(target) {
  this.spinner = $("<img>").css({"vertical-align":"middle", "margin-right":"10px"}).attr({"src":"data:image/gif;base64,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"});
  this.dialogMessage = $("<span>").css({});
  this.dialogInner = $("<div>").css({"margin":"20px", "text-align":"center"});
  this.dialogOuter = $("<div>").css(jasmin.ModalDialog.DIALOG_OUTER_CSS);
  this.dialogContainer = $("<div>").css({"position":"relative", "width":"100%", "height":"100%"});
  this.dialogBackground = $("<div>").css({"background-color":"#000000", "opacity":.85, "position":"absolute", "left":"0px", "top":"0px", "width":"100%", "height":"100%", "z-index":9998, "display":"none"});
  this.dialogInner.append(this.spinner);
  this.dialogInner.append(this.dialogMessage);
  this.dialogOuter.append(this.dialogInner);
  this.dialogContainer.append(this.dialogOuter);
  target.append(this.dialogBackground);
  target.append(this.dialogContainer);
};
jasmin.ModalDialog.DIALOG_OUTER_CSS = {"position":"absolute", "top":"50%", "left":"50%", "transform":"translate(-50%, -50%)", "background-color":"#DDDDDD", "opacity":1, "border-radius":"10px", "z-index":9999, "display":"none"};
jasmin.ModalDialog.prototype.show = function(message, spinner, callback, outerCss) {
  this.dialogMessage.html(message);
  if (spinner) {
    this.spinner.show();
  } else {
    this.spinner.hide();
  }
  this.callback = callback;
  if (callback !== undefined) {
    var self = this;
    this.dialogBackground.on("click", function(e) {
      self.hide();
      self.callback();
    });
  } else {
    this.dialogBackground.off("click");
  }
  this.dialogOuter.css(jasmin.ModalDialog.DIALOG_OUTER_CSS);
  if (outerCss !== undefined) {
    this.dialogOuter.css(outerCss);
  }
  this.dialogBackground.show();
  this.dialogOuter.show();
};
jasmin.ModalDialog.prototype.hide = function() {
  this.dialogBackground.off("click");
  this.dialogBackground.hide();
  this.dialogOuter.hide();
};
if (window.performance === undefined) {
  window.performance = new Object;
}
if (window.performance.now === undefined) {
  window.performance.now = function() {
    return(new Date).getTime();
  };
}
(function() {
  var lastTime = 0;
  var vendors = ["ms", "moz", "webkit", "o"];
  for (var x = 0;x < vendors.length && !window.requestAnimationFrame;++x) {
    window.requestAnimationFrame = window[vendors[x] + "RequestAnimationFrame"];
    window.cancelAnimationFrame = window[vendors[x] + "CancelAnimationFrame"] || window[vendors[x] + "CancelRequestAnimationFrame"];
  }
  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = function(callback) {
      var currTime = (new Date).getTime();
      var timeToCall = Math.max(0, 16 - (currTime - lastTime));
      var id = window.setTimeout(function() {
        callback(currTime + timeToCall);
      }, timeToCall);
      lastTime = currTime + timeToCall;
      return id;
    };
  }
  if (!window.cancelAnimationFrame) {
    window.cancelAnimationFrame = function(id) {
      clearTimeout(id);
    };
  }
})();
if (jasmin === undefined) {
  var jasmin = function() {
  }
}
jasmin.RequestManager = function(fail, timeout, retries, active, checkInterval) {
  this.fail = fail === undefined ? function() {
  } : fail;
  this.timeout = timeout === undefined ? 4E3 : timeout;
  this.retries = retries === undefined ? 8 : retries;
  this.active = active === undefined ? true : active;
  this.checkInterval = checkInterval === undefined ? 300 : checkInterval;
  this.flushing = false;
  this.flushCallback = undefined;
  this.STATE_OPEN = 1;
  this.STATE_FAILED = 2;
  this.STATE_FIRST = 3;
  this.states = {};
  this.stateCounter = 0;
  this.transactionCounter = 0;
  this.errorLogs = [];
  this.failed = false;
  if (this.active) {
    this.check();
  }
};
jasmin.RequestManager.prototype.error = function(errorMessage) {
  this.errorLogs.push(errorMessage);
};
jasmin.RequestManager.TYPE_AJAX = "ajax";
jasmin.RequestManager.TYPE_IMG = "img";
jasmin.RequestManager.prototype.request = function(type, request, callback, timeout, retries) {
  var counter = this.stateCounter;
  this.states[counter] = {"type":type, "request":request, "callback":callback, "timeout":timeout, "retries":retries, "state":this.STATE_FIRST, "retryCounter":0, "handled":false};
  this.stateCounter++;
  DEBUG && console.log("RequestManager.request, stateId " + counter);
  DEBUG && console.log(request);
  if (this.active) {
    this.sendOpenRequests();
  }
  return counter;
};
jasmin.RequestManager.prototype.sendOpenRequests = function() {
  if (!((this.active || this.flushing) && !this.failed)) {
    return;
  }
  var stateIds = this.statesToSend();
  if (stateIds.length > 0) {
    var stateId;
    for (var i in stateIds) {
      stateId = stateIds[i];
      transactionId = this.transactionCounter;
      switch(this.states[stateId]["type"]) {
        case jasmin.RequestManager.TYPE_AJAX:
          this.ajaxRequest(stateId, transactionId);
          break;
        case jasmin.RequestManager.TYPE_IMG:
          this.imgRequest(stateId, transactionId);
          break;
      }
      this.transactionCounter++;
      this.states[stateId]["state"] = this.STATE_OPEN;
      this.states[stateId]["retryCounter"]++;
      this.states[stateId]["attemptTime"] = (new Date).getTime();
    }
  }
};
jasmin.RequestManager.prototype.statesToSend = function() {
  var time = (new Date).getTime();
  var sendList = new Array;
  var timeout, retries;
  for (var i in this.states) {
    switch(this.states[i]["state"]) {
      case this.STATE_FIRST:
        sendList.push(i);
        DEBUG && console.log("RequestManager.statesToSend, stateId " + i + ", STATE_FIRST");
        break;
      case this.STATE_OPEN:
        timeout = this.states[i]["timeout"] === undefined ? this.timeout : this.states[i]["timeout"];
        if (time - this.states[i]["attemptTime"] > timeout) {
          DEBUG && console.log("RequestManager.statesToSend, stateId " + i + " open and timed out");
          this.states[i]["state"] = this.STATE_FAILED;
        }
        break;
    }
    if (this.states[i]["state"] === this.STATE_FAILED) {
      retries = this.states[i]["retries"] === undefined ? this.retries : this.states[i]["retries"];
      if (this.states[i]["retryCounter"] >= this.retries) {
        DEBUG && console.log("RequestManager.statesToSend, stateId " + i + " failed; Exceeded " + this.retries + " attempts");
        if (!this.failed) {
          this.failed = true;
          this.error("Max attempts exceeded");
          this.fail(this.errorLogs);
        }
      } else {
        DEBUG && console.log("RequestManager.statesToSend, stateId " + i + " added to sendList");
        sendList.push(i);
      }
    }
  }
  return sendList;
};
jasmin.RequestManager.prototype.ajaxRequest = function(stateId, transactionId) {
  var ajaxArgs = this.states[stateId]["request"];
  ajaxArgs["cache"] = false;
  DEBUG && console.log("RequestManager.ajaxRequest, stateId = " + stateId + ", transactionId = " + transactionId);
  DEBUG && console.log(ajaxArgs);
  var self = this;
  var ajax = $.ajax(ajaxArgs);
  ajax.done(function(response, status) {
    DEBUG && console.log("RequestManager ajax.done, stateId " + stateId + ", transactionId " + transactionId + ", status " + status);
    DEBUG && console.log(ajaxArgs);
    DEBUG && console.log(response);
    self.success(stateId, response);
  });
  ajax.fail(function(response, status) {
    DEBUG && console.log("RequestManager ajax.fail, stateId " + stateId + ", transactionId " + transactionId + ", status " + status);
    DEBUG && console.log(ajaxArgs);
    DEBUG && console.log(response);
    self.error("ajax.fail, stateId " + stateId + ", transactionId " + transactionId + ", status " + status + ", ajaxArgs: " + JSON.stringify(ajaxArgs) + ", response:" + JSON.stringify(response));
  });
};
jasmin.RequestManager.prototype.imgRequest = function(stateId, transactionId) {
  var url = this.states[stateId]["request"];
  DEBUG && console.log("RequestManager.imgRequest, stateId = " + stateId + ", transactionId = " + transactionId + ", url = " + url);
  var self = this;
  this.states[stateId]["reply"] = $("<img>").attr("src", url + "?_=" + (new Date).getTime()).load(function() {
    if (self.states[stateId]["reply"] === undefined) {
      self.error("img reply undefined, stateId " + stateId + ", transactionId " + transactionId + ", url " + url);
    }
    DEBUG && console.log("RequestManager img load, stateId " + stateId + ", transactionId " + transactionId);
    self.success(stateId, self.states[stateId]["reply"]);
  }).error(function() {
    self.error("img error, stateId " + stateId + ", transactionId " + transactionId + ", url " + url);
  });
};
jasmin.RequestManager.prototype.success = function(stateId, reply) {
  if (this.states[stateId] !== undefined && !this.states[stateId]["handled"]) {
    this.states[stateId]["handled"] = true;
    if (this.states[stateId]["callback"] !== undefined) {
      try {
        this.states[stateId]["callback"](reply);
      } catch (e) {
      }
    }
    delete this.states[stateId];
  }
  if (this.flushing && $.isEmptyObject(this.states)) {
    this.flushing = false;
    if (this.flushCallback !== undefined) {
      this.flushCallback();
    }
  }
};
jasmin.RequestManager.prototype.check = function() {
  if ((this.active || this.flushing) && !this.failed) {
    this.sendOpenRequests();
    var self = this;
    setTimeout(function() {
      self.check();
    }, this.checkInterval);
  }
};
jasmin.RequestManager.prototype.flush = function(flushCallback) {
  this.flushing = true;
  this.flushCallback = flushCallback;
  if ($.isEmptyObject(this.states)) {
    if (this.flushCallback !== undefined) {
      this.flushCallback();
    }
  }
  this.check();
};
if (jasmin === undefined) {
  var jasmin = function() {
  }
}
jasmin.ResponseManager = function(override) {
  this.override = override;
  this.active = false;
  this.buttonsActive = undefined;
  this.callbackResponse = undefined;
  this.responseData = undefined;
  this.gamepadEnabled = false;
  this.gamepadAxes = [];
  this.gamepadAxisLimits = [];
  this.gyroscopeEnabled = false;
  this.gyroscopeAxisLimits = [];
  this.speechAvailable = false;
  this.speechCommands = false;
};
jasmin.ResponseManager.prototype.polling = function() {
  if (this.gamepadEnabled) {
    this.pollGamepad();
  }
  if (this.gyroscopeEnabled) {
    this.pollGamepad();
  }
  var self = this;
  this.pollingRequest = requestAnimationFrame(function() {
    self.polling();
  });
};
jasmin.ResponseManager.prototype.pollGyroscope = function(data, available) {
  var availabilityMap = {"do":{"alpha":"deviceOrientationAvailable", "beta":"deviceOrientationAvailable", "gamma":"deviceOrientationAvailable"}, "dm":{"x":"accelerationAvailable", "y":"accelerationAvailable", "z":"accelerationAvailable", "gx":"accelerationIncludingGravityAvailable", "gy":"accelerationIncludingGravityAvailable", "gz":"accelerationIncludingGravityAvailable", "alpha":"rotationRate", "beta":"rotationRate", "gamma":"rotationRate"}};
  for (var i = 0;i < this.gyroscopeAxisLimits.length;i++) {
    var limit = this.gyroscopeAxisLimits[i];
    var isAvailable = available[availabilityMap[limit["id"]][limit["id2"]]];
    var value;
    if (isAvailable) {
      value = data[limit["id"]][limit["id2"]];
      if (limit["max"] >= limit["min"] && (value >= limit["min"] && value <= limit["max"]) || limit["min"] > limit["max"] && (value >= limit["min"] || value <= limit["max"])) {
        this.response("gyroscopechange", "gyroscope", i, limit["label"], window.performance.now(), value);
      }
    }
  }
};
jasmin.ResponseManager.prototype.pollGamepad = function() {
  this.gamepad = undefined;
  var gamepads = navigator.getGamepads ? navigator.getGamepads() : navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : [];
  for (var i = 0;i < gamepads.length && this.gamepad === undefined;i++) {
    if (gamepads[i] !== null) {
      this.gamepad = gamepads[i];
    }
  }
  if (this.gamepad !== undefined) {
    var i, j;
    for (i = 0;i < this.gamepadAxes.length && i < this.gamepadAxisLimits.length;i++) {
      if (this.gamepadAxes[i] !== this.gamepad.axes[i]) {
        this.gamepadAxes[i] = this.gamepad.axes[i];
        if (this.active && this.callbackEvent !== undefined) {
          this.callbackEvent("axischange", "gamepadaxis", i, undefined, window.performance.now(), this.gamepadAxes[i]);
        }
        for (j = 0;j < this.gamepadAxisLimits[i].length;j++) {
          if (this.gamepadAxisLimits[i][j]["max"] >= this.gamepadAxisLimits[i][j]["min"] && this.gamepad.axes[i] >= this.gamepadAxisLimits[i][j]["min"] && this.gamepad.axes[i] <= this.gamepadAxisLimits[i][j]["max"] || this.gamepadAxisLimits[i][j]["min"] > this.gamepadAxisLimits[i][j]["max"] && (this.gamepad.axes[i] >= this.gamepadAxisLimits[i][j]["min"] || this.gamepad.axes[i] <= this.gamepadAxisLimits[i][j]["max"])) {
            this.response("axischange", "gamepadaxis", i, this.gamepadAxisLimits[i][j]["label"], window.performance.now(), this.gamepadAxes[i]);
          }
        }
      }
    }
  }
};
jasmin.ResponseManager.prototype.attach = function(buttonDefinitions) {
  this.buttonDefinitions = buttonDefinitions;
  this.bindEvents(true);
};
jasmin.ResponseManager.prototype.detach = function() {
  this.bindEvents(false);
  cancelAnimationFrame(this.pollingRequest);
};
jasmin.ResponseManager.prototype.bindEvents = function(on) {
  var self = this;
  var pointerCallback = function(type, id, label) {
    var target = id !== "all" ? $(id) : $(window.document);
    var callback = function(event) {
      var time = window.performance.now();
      self.stopBubble(event);
      var pageX, pageY;
      if (type === "touchstart" || type === "touchend" || type === "touchmove" || type === "touchcancel") {
        var touch = event.originalEvent.touches[0] || event.originalEvent.changedTouches[0];
        pageX = touch.pageX;
        pageY = touch.pageY;
      } else {
        pageX = event.pageX;
        pageY = event.pageY;
      }
      self.response(event, type, id, label, time, pageX, pageY);
    };
    if (on) {
      target.off(type);
      target.on(type, callback);
    } else {
      target.off(type);
    }
  };
  this.keyboardMapping = {"keyup":{}, "keydown":{}};
  var attachedCancel = [];
  var stopCancelBubble = function(id) {
    if (attachedCancel.indexOf(id) === -1) {
      attachedCancel.push(id);
      var target = id !== "all" ? $(id) : $(window.document);
      var cancelTypes = ["vmousecancel", "mousecancel", "touchcancel"], cancelType_i, cancelType;
      for (cancelType_i in cancelTypes) {
        cancelType = cancelTypes[cancelType_i];
        var callback = function(event) {
          self.stopBubble(event);
        };
        if (on) {
          target.on(cancelType, callback);
        } else {
          target.off(cancelType);
        }
      }
    }
  };
  this.speechEnabled = false;
  this.speechCommands = {};
  this.gamepadEnabled = false;
  this.gamepadAxisLimits = [];
  for (var i = 0;i < 8;i++) {
    this.gamepadAxisLimits[i] = [];
    this.gamepadAxes[i] = 0;
  }
  this.gyroscopeEnabled = false;
  this.gyroscopeAxisLimits = [];
  var button, button_i, modality, modality_i;
  for (button_i in this.buttonDefinitions) {
    button = this.buttonDefinitions[button_i];
    for (modality_i in button["modalities"]) {
      modality = button["modalities"][modality_i];
      if (modality["type"] === "keyup" || modality["type"] === "keydown") {
        this.keyboardMapping[modality["type"]][modality["id"]] = button["label"];
      } else {
        if (modality["type"] === "speech") {
          this.speechEnabled = true;
          this.speechCommands[modality["id"]] = button["label"];
        } else {
          if (modality["type"] === "gamepadaxis") {
            this.gamepadEnabled = true;
            this.gamepadAxisLimits[modality["id"]].push({"min":modality["min"], "max":modality["max"], "label":button["label"]});
          } else {
            if (modality["type"] === "gyroscope") {
              this.gyroscopeEnabled = true;
              if (this.gyroscopeAxisLimits[modality["id"]] === undefined) {
                this.gyroscopeAxisLimits[modality["id"]] = [];
              }
              this.gyroscopeAxisLimits.push({"id":modality["id"], "id2":modality["id2"], "min":modality["min"], "max":modality["max"], "label":button["label"]});
            } else {
              pointerCallback(modality["type"], modality["id"], button["label"]);
              stopCancelBubble(modality["id"]);
            }
          }
        }
      }
    }
  }
  var self = this;
  if (this.gyroscopeEnabled) {
    this.gn = new GyroNorm;
    this.gn.init().then(function() {
      self.gn.start(function(data) {
        self.pollGyroscope(data, self.gn.isAvailable());
      });
    });
  }
  if (this.speechEnabled) {
    this.setupSpeechRecognition(on);
  }
  var keyboardCallback = function(type) {
    var callback = function(event) {
      var time = window.performance.now();
      self.stopBubble(event);
      var id = event.which;
      var keyLabel = self.keyboardMapping[type][id];
      keyLabel = keyLabel !== undefined ? keyLabel : self.keyboardMapping[type]["all"];
      self.response(event, type, event.which, keyLabel, time);
    };
    if (on) {
      $(window.document).on(type, callback);
    } else {
      $(window.document).off(type);
    }
  };
  var keyboardTypes = ["keydown", "keyup"], keyboardType_i, keyboardType;
  for (keyboardType_i in keyboardTypes) {
    keyboardType = keyboardTypes[keyboardType_i];
    keyboardCallback(keyboardType);
  }
  var self = this;
  this.pollingRequest = requestAnimationFrame(function() {
    self.polling();
  });
};
jasmin.ResponseManager.prototype.setupSpeechRecognition = function(on) {
  var self = this;
  if (!on && self.speechRecognition !== undefined) {
    self.speechRecognition.stop();
  }
  var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition;
  var SpeechGrammarList = SpeechGrammarList || webkitSpeechGrammarList;
  var SpeechRecognitionEvent = SpeechRecognitionEvent || webkitSpeechRecognitionEvent;
  self.speechRecognition = new SpeechRecognition;
  self.speechRecognition.continuous = false;
  self.speechRecognition.lang = "en-US";
  self.speechRecognition.interimResults = false;
  self.speechRecognition.maxAlternatives = 1;
  self.speechRecognition.onresult = function(event) {
    var last = event.results.length - 1;
    var word = event.results[last][0].transcript;
    if (self.speechCommands[word] !== undefined) {
      self.response(event, "speech", undefined, self.speechCommands[word], self.soundStartTime);
    }
  };
  self.speechRecognition.onsoundstart = function(event) {
    self.soundStartTime = window.performance.now();
  };
  self.speechRecognition.onsoundend = function(event) {
  };
  self.speechRecognition.onend = function(event) {
    self.speechRecognition.start();
  };
  self.speechRecognition.start();
};
jasmin.ResponseManager.prototype.activate = function(buttonsActive, callbackResponse, callbackEvent) {
  this.buttonsActive = buttonsActive;
  this.callbackResponse = callbackResponse;
  this.active = true;
  this.callbackEvent = callbackEvent;
};
jasmin.ResponseManager.prototype.response = function(event, modality, id, label, time, x, y) {
  var callCallback = false;
  if (this.active && this.callbackEvent !== undefined) {
    this.callbackEvent(event, modality, id, label, time, x, y);
  }
  if (this.override !== undefined && this.override["type"] === modality && this.override["id"] === id) {
    this.override["callback"]();
  }
  if (this.active && this.buttonsActive !== undefined && this.buttonsActive.indexOf(label) !== -1) {
    callCallback = true;
  }
  if (callCallback) {
    this.responseData = {"modality":modality, "id":id, "label":label, "time":time, "x":x, "y":y, "event":event};
    this.callbackResponse();
  }
};
jasmin.ResponseManager.prototype.getResponseLog = function() {
  return this.responseData;
};
jasmin.ResponseManager.prototype.stopBubble = function(event) {
  event.stopPropagation();
  event.preventDefault();
};
jasmin.ResponseManager.prototype.deactivate = function() {
  this.active = false;
};
if (jasmin === undefined) {
  var jasmin = function() {
  }
}
jasmin.ScalableCanvas = function(target, aspectRatio, rescaleInterval) {
  this.target = target;
  this.aspectRatio = aspectRatio;
  this.rescaleInterval = rescaleInterval === undefined ? 1E3 : rescaleInterval;
  this.sprites = {};
  this.lastWidth = false;
};
jasmin.ScalableCanvas.prototype.start = function() {
  var self = this;
  self.rescale(true);
  this.timer = setInterval(function() {
    self.rescale();
  }, self.rescaleInterval);
};
jasmin.ScalableCanvas.prototype.stop = function() {
  clearInterval(this.timer);
};
jasmin.ScalableCanvas.prototype.addSprite = function(key, node, scale, children) {
  this.target.append(node);
  this.sprites[key] = {"node":node, "scale":scale, "children":children};
};
jasmin.ScalableCanvas.prototype.addSprites = function(sprites) {
  for (var i in sprites) {
    this.addSprite(i, sprites[i]["node"], sprites[i]["scale"], sprites[i]["children"]);
  }
};
jasmin.ScalableCanvas.prototype.rescale = function(force) {
  if (this.target === $(document.body)) {
    var targetWidth = window.innerWidth;
    var targetHeight = window.innerHeight;
  } else {
    var targetWidth = this.target.width();
    var targetHeight = this.target.height();
  }
  if (force === undefined && this.lastWidth === targetWidth && this.lastHeight === targetHeight) {
    return;
  } else {
    this.lastWidth = targetWidth;
    this.lastHeight = targetHeight;
  }
  this.offsetLeft = 0;
  this.offsetTop = 0;
  if (targetWidth / targetHeight > this.aspectRatio) {
    this.scale = targetHeight;
    this.offsetLeft = (targetWidth - this.scale * this.aspectRatio) / 2;
    this.canvasHeight = targetHeight;
    this.canvasWidth = targetHeight * this.aspectRatio;
  } else {
    this.scale = targetWidth / this.aspectRatio;
    this.offsetTop = (targetHeight - this.scale) / 2;
    this.canvasHeight = targetWidth / this.aspectRatio;
    this.canvasWidth = targetWidth;
  }
  for (var i in this.sprites) {
    this.rescaleSprite(this.sprites[i]);
  }
};
jasmin.ScalableCanvas.prototype.rescaleSprite = function(sprite) {
  var css = {}, offset, scaledValue;
  for (var j in sprite["scale"]) {
    switch(j) {
      case "left":
        offset = this.offsetLeft;
        break;
      case "top":
        offset = this.offsetTop;
        break;
      default:
        offset = 0;
        break;
    }
    if (sprite["node"].css("position") === "relative") {
      offset = 0;
    }
    scaledValue = sprite["scale"][j] * this.scale + offset;
    if (j === "left" || j === "top" || j === "width" || j === "height") {
      scaledValue = Math.floor(scaledValue);
    }
    css[j] = scaledValue;
  }
  sprite["node"].css(css);
  if (sprite["children"] !== undefined) {
    for (var child_i in sprite["children"]) {
      this.rescaleSprite(sprite["children"][child_i]);
    }
  }
};
jasmin.ScalableCanvas.prototype.spritesFromJSON = function(spritesJSON, parent) {
  var sprites = {}, sprite, key, cssClass, cssClass_i;
  for (var key in spritesJSON) {
    sprite = {};
    sprite["node"] = $(spritesJSON[key]["type"]).attr(spritesJSON[key]["attr"]).css(spritesJSON[key]["css"]);
    if (spritesJSON[key]["class"] !== undefined) {
      for (cssClass_i in spritesJSON[key]["class"]) {
        sprite["node"].addClass(spritesJSON[key]["class"][cssClass_i]);
      }
    }
    sprite["scale"] = spritesJSON[key]["scale"];
    if (spritesJSON[key]["children"] !== undefined) {
      sprite["children"] = this.spritesFromJSON(spritesJSON[key]["children"], sprite);
    }
    sprites[key] = sprite;
    if (parent !== undefined) {
      parent["node"].append(sprite["node"]);
    }
  }
  return sprites;
};
jasmin.ScalableCanvas.prototype.removeSprites = function() {
  for (var i in this.sprites) {
    this.sprites[i]["node"].remove();
  }
};
jasmin.ScalableCanvas.prototype.mapToCanvas = function(x, y) {
  return{"x":(x - this.offsetLeft) / this.canvasWidth * this.aspectRatio, "y":(y - this.offsetTop) / this.canvasHeight};
};
if (jasmin === undefined) {
  var jasmin = function() {
  }
}
jasmin.ScreenManager = function(watchTimeout) {
  this.watchTimeout = watchTimeout === undefined ? 1E3 : watchTimeout;
  this.callbacks = {};
  this.logger = new jasmin.TableLogger(["name", "phase", "time", "value"], function(message) {
    console.log(message);
  }, "NA");
  var self = this;
  this.logger.oldLog = this.logger.log;
  this.logger.log = function(logMe) {
    DEBUG && console.log({"screenState":self.screenState});
    self.logger.oldLog(logMe);
  };
  this.requirements = [];
  this.satisfiedFirst = undefined;
  this.satisfiedEach = undefined;
  this.screenState = {"orientation":$(window).width() >= $(window).height() ? "landscape" : "portrait", "focus":true, "fullscreen":this.isFullscreen()};
  var self = this;
  var watchThese = {"orientationchange":{"source":window, "event":"orientationchange", "on":function(event) {
    var orientation = $(window).width() >= $(window).height() ? "landscape" : "portrait";
    self.screenState["orientation"] = orientation;
    self.checkRequirements();
    return{"window.orientation":event.orientation};
  }}, "focusout":{"source":window, "event":"focusout", "on":function(event) {
    self.screenState["focus"] = false;
    self.checkRequirements();
    return{};
  }}, "focusin":{"source":window, "event":"focusin", "on":function(event) {
    self.screenState["focus"] = true;
    self.checkRequirements();
    return{};
  }}, "resize":{"source":window, "event":"resize", "on":function(event) {
    var orientation = $(window).width() >= $(window).height() ? "landscape" : "portrait";
    self.screenState["orientation"] = orientation;
    self.checkRequirements();
    return{"window.width":$(window).width(), "window.height":$(window).height(), "avail.width":screen.availWidth, "avail.height":screen.availHeight};
  }}, "beforeunload":{"source":window, "event":"beforeunload", "on":function() {
    return{};
  }}, "unload":{"source":window, "event":"unload", "on":function() {
    return{};
  }}};
  if (screenfull && screenfull.raw !== undefined) {
    watchThese["fullscreenchange"] = {"source":document, "event":screenfull.raw.fullscreenchange, "on":function() {
      var orientation = $(window).width() >= $(window).height() ? "landscape" : "portrait";
      self.screenState["orientation"] = orientation;
      self.checkRequirements();
      return{"window.width":$(window).width(), "window.height":$(window).height(), "avail.width":screen.availWidth, "avail.height":screen.availHeight, "screenfull.isFullscreen":screenfull.isFullscreen};
    }};
  }
  var watchThis, self = this, closure;
  for (var e in watchThese) {
    watchThis = watchThese[e];
    var closure = function(param1, param2) {
      return function(event) {
        return self.changed(param1, param2, event);
      };
    };
    $(watchThis["source"]).on(watchThis["event"], closure(e, watchThis["on"]));
  }
  this.watching = {};
  this.logger.log({"name":"init", "phase":"start", "time":1E3 * window.performance.now() / 1E3, "value":{"screen.width":screen.width, "screen.height":screen.height, "avail.width":screen.availWidth, "avail.height":screen.availHeight, "window.width":$(window).width(), "window.height":$(window).height()}});
  var self = this;
  setTimeout(self.updateWatch(), this.watchTimeout);
};
jasmin.ScreenManager.prototype.changed = function(name, logThis, event) {
  this.watch(name, logThis(event));
  var result;
  if (this.callbacks[name] !== undefined) {
    result = this.callbacks[name](event);
  }
  return result;
};
jasmin.ScreenManager.prototype.watch = function(name, value) {
  var now = 1E3 * window.performance.now() / 1E3;
  if (this.watch[name] === undefined) {
    this.logger.log({"name":name, "phase":"start", "time":now, "value":value});
  }
  this.watch[name] = now;
};
jasmin.ScreenManager.prototype.updateWatch = function() {
  var now = 1E3 * window.performance.now() / 1E3;
  for (var w in this.watch) {
    if (this.watch[w] + this.watchTimeout < now) {
      this.logger.log({"name":w, "phase":"end", "time":this.watch[w], "value":{}});
      delete this.watch[w];
    }
    this.checkRequirements();
  }
  var self = this;
  setTimeout(function() {
    self.updateWatch();
  }, this.watchTimeout);
};
jasmin.ScreenManager.prototype.fullscreen = function(fullscreenEnabled, fullscreenAsk, fullscreenDone) {
  this.fullscreenEnabled = fullscreenEnabled;
  this.fullscreenAsk = fullscreenAsk;
  this.fullscreenDone = fullscreenDone;
  if (this.fullscreenEnabled && !this.isFullscreen()) {
    if (this.fullscreenAsk !== undefined) {
      this.fullscreenAsk();
    }
    this.attachFullscreenCallback();
  }
  if (!this.fullscreenEnabled) {
    screenfull.exit();
  }
};
jasmin.ScreenManager.prototype.isFullscreen = function() {
  return!screenfull || !screenfull.enabled || screenfull.isFullscreen;
};
jasmin.ScreenManager.prototype.attachFullscreenCallback = function() {
  var callback = function(self) {
    return function() {
      if (this.fullScreenTarget === undefined) {
        screenfull.request();
      } else {
        screenfull.request(this.fullScreenTarget);
      }
      self.screenState["fullscreen"] = true;
      $(document).off("vmousedown", self.fullscreenCallback);
      self.checkRequirements();
    };
  };
  var self = this;
  self.fullscreenCallback = callback(this);
  if (!this.isFullscreen() && !this.attached) {
    $(document).on("vmousedown", function() {
      self.fullscreenCallback();
    });
    this.attached = true;
  }
};
jasmin.ScreenManager.prototype.detachFullscreenCallback = function() {
  $(document).off("vmousedown", self.fullscreenCallback);
};
jasmin.ScreenManager.prototype.addCallback = function(name, callback) {
  this.callbacks[name] = callback;
};
jasmin.ScreenManager.prototype.checkRequirements = function() {
  var requirement, i, fullscreenOn = false, failedRequirement = false;
  for (i in this.requirements) {
    if (!failedRequirement) {
      requirement = this.requirements[i];
      if (requirement["values"].indexOf(this.screenState[requirement["req"]]) === -1) {
        DEBUG && console.log({"what":"requirement not satisfied", "req":requirement["req"], "values":requirement["values"], "state":this.screenState[requirement["req"]]});
        this.satisfied = false;
        requirement["warn"]();
        if (requirement["req"] === "fullscreen") {
          fullscreenOn = true;
          this.attachFullscreenCallback();
        }
        failedRequirement = true;
      }
    }
  }
  if (!fullscreenOn) {
    this.detachFullscreenCallback();
  }
  if (!failedRequirement) {
    var callback = function() {
    };
    if (this.satisfiedNever) {
      DEBUG && console.log("callback to this.satisfiedFirst");
      callback = this.satisfiedFirst;
      this.satisfiedNever = false;
    } else {
      if (!this.satisfied) {
        DEBUG && console.log("callback to this.satisfiedEach");
        callback = this.satisfiedEach;
      }
    }
    this.satisfied = true;
    if (callback instanceof Function) {
      callback();
    }
  }
};
jasmin.ScreenManager.prototype.require = function(requirements, satisfiedFirst, satisfiedEach, fullScreenTarget) {
  this.requirements = requirements;
  this.satisfiedFirst = satisfiedFirst;
  this.satisfiedEach = satisfiedEach;
  this.fullScreenTarget = fullScreenTarget;
  this.satisfiedNever = true;
  this.satisfied = false;
  this.checkRequirements();
};
if (jasmin === undefined) {
  var jasmin = function() {
  }
}
jasmin.Slideshow = function(target, eventManager, slideButtons, buttonDelay, buttonHide, buttonShow, translator) {
  this.target = target;
  this.eventManager = eventManager;
  this.translator = translator;
  this.slideButtons = slideButtons;
  this.buttonDelay = buttonDelay !== undefined ? buttonDelay : 0;
  this.buttonHide = buttonHide !== undefined ? buttonHide : function() {
  };
  this.buttonShow = buttonShow !== undefined ? buttonShow : function() {
  };
  if (translator === undefined) {
    this.translator = {};
    this.translator.translate = function(term) {
      return term;
    };
  } else {
    this.translator = translator;
  }
  this.logger = new jasmin.TableLogger(["set", "slide", "delay", "phase", "response", "rt", "modality", "id", "time_start", "time_buttons", "time_response"]);
  this.buttonsActive = [];
  this.buttonMapping = {};
  var slideRoles = ["next", "previous", "up"], slideRole_i, slideRole, slideRoleButtons, slideRoleButton_i, slideRoleButton;
  for (slideRole_i in slideRoles) {
    slideRole = slideRoles[slideRole_i];
    slideRoleButtons = slideButtons[slideRole];
    for (slideRoleButton_i in slideRoleButtons) {
      slideRoleButton = slideRoleButtons[slideRoleButton_i];
      this.buttonsActive.push(slideRoleButton);
      this.buttonMapping[slideRoleButton] = slideRole;
    }
  }
  DEBUG && console.log({"this.buttonMapping":this.buttonMapping});
};
jasmin.Slideshow.prototype.show = function(slides, callbackDone, slideSet) {
  if (slides.length === 0) {
    callbackDone();
    return;
  }
  this.slides = slides;
  this.callbackDone = callbackDone;
  this.slideSet = slideSet !== undefined ? slideSet : "noname";
  this.firstSlide = true;
  this.slideCounter = 0;
  this.slideFurthest = -1;
  this.showSlide();
};
jasmin.Slideshow.prototype.nextSlide = function() {
  DEBUG && console.log("nextSlide");
  this.logSlideInfo("down");
  var self = this;
  this.eventManager.startEvent(-1, function() {
    self.target.hide();
  }, function() {
    self.showSlide();
  }, this.slideButtons["up"], "released_silent");
};
jasmin.Slideshow.prototype.showSlide = function() {
  DEBUG && console.log("showSlide");
  if (!this.firstSlide) {
    this.timeResponse = window.performance.now();
    this.logSlideInfo("up");
  } else {
    this.firstSlide = false;
  }
  var self = this;
  if (this.slideCounter >= this.slides.length) {
    self.callbackDone();
    return;
  }
  this.timeStart = window.performance.now();
  if (this.buttonDelay === 0) {
    this.showButtons();
  } else {
    if (this.slideFurthest >= this.slideCounter) {
      this.showButtons();
    } else {
      this.slideFurthest = this.slideCounter;
      this.eventManager.startEvent(this.buttonDelay, function() {
        self.target.show();
        self.target.html(self.translator.translate(self.slides[self.slideCounter]));
        self.buttonHide();
      }, function() {
        self.showButtons();
      }, [], true, "slide_nobutton_" + self.slideCounter);
    }
  }
};
jasmin.Slideshow.prototype.showButtons = function() {
  this.timeButtons = window.performance.now();
  var self = this;
  this.eventManager.startEvent(-1, function() {
    self.target.html(self.translator.translate(self.slides[self.slideCounter]));
    self.target.show();
    self.buttonShow();
  }, function() {
    self.response();
  }, this.buttonsActive, "slide_nobutton_" + self.slideCounter);
};
jasmin.Slideshow.prototype.response = function() {
  this.timeResponse = window.performance.now();
  var buttonPressed = this.buttonMapping[this.eventManager.responseLabel];
  if (buttonPressed === "next") {
    this.slideCounter++;
    this.nextSlide();
  } else {
    if (buttonPressed === "previous" && this.slideCounter > 0) {
      this.slideCounter--;
      this.nextSlide();
    } else {
      this.showSlide();
    }
  }
};
jasmin.Slideshow.prototype.logSlideInfo = function(phase) {
  var modality = this.eventManager.responseManager.responseData["modality"] !== undefined;
  var slideLogs = {"set":this.slideSet, "slide":this.slideCounter, "delay":this.buttonDelay, "phase":phase, "response":this.buttonMapping[this.eventManager.responseLabel], "rt":Math.round(1E3 * this.eventManager.rt) / 1E3, "modality":this.eventManager.responseManager.responseData["modality"], "id":this.eventManager.responseManager.responseData["id"], "time_start":Math.round(1E3 * this.timeStart) / 1E3, "time_buttons":Math.round(1E3 * this.timeButtons) / 1E3, "time_response":Math.round(1E3 * this.timeResponse) / 
  1E3};
  this.logger.log(slideLogs);
  DEBUG && console.log(slideLogs);
};
if (jasmin === undefined) {
  var jasmin = function() {
  }
}
jasmin.Statistics = function() {
};
jasmin.Statistics.rep = function(x, reps) {
  var result = [];
  if (typeof x !== "object") {
    x = [x];
  }
  for (var i in x) {
    for (var j = 0;j < reps;j += 1) {
      result.push(x[i]);
    }
  }
  return result;
};
jasmin.Statistics.fill = function(items, length) {
  var result = [];
  var remaining = length;
  while (remaining > 0) {
    if (remaining >= items.length) {
      result = result.concat(JSON.parse(JSON.stringify(items)));
      remaining -= items.length;
    } else {
      items = jasmin.Statistics.fisherYates(items);
      for (var i = 0;i < remaining;i++) {
        result.push(JSON.parse(JSON.stringify(items[i])));
      }
      remaining = 0;
    }
  }
  return result;
};
jasmin.Statistics.seq = function(from, to, step, reps) {
  step = step === undefined ? 1 : step;
  reps = reps === undefined ? 1 : reps;
  var result = [], i, j;
  for (i = from;i <= to;i += step) {
    for (var j = 0;j < reps;j += 1) {
      result.push(i);
    }
  }
  return result;
};
jasmin.Statistics.combine = function(left, right, keyLeft, keyRight) {
  var result = [], current;
  var i, j;
  for (i = 0;i < left.length;i++) {
    for (j = 0;j < right.length;j++) {
      if (keyLeft !== undefined && keyRight !== undefined) {
        current = {};
        current[keyLeft] = left[i];
        current[keyRight] = right[j];
      } else {
        current = [left[i], right[j]];
      }
      result.push(current);
    }
  }
  return result;
};
jasmin.Statistics.fisherYates = function(array) {
  var m = array.length, t, i;
  while (m) {
    i = Math.floor(Math.random() * m--);
    t = array[m];
    array[m] = array[i];
    array[i] = t;
  }
  return array;
};
jasmin.Statistics.fisherYatesRestrictReps = function(array, repetitionCount) {
  var accepted = false, candidate;
  while (!accepted) {
    candidate = jasmin.Statistics.fisherYates(array);
    accepted = !jasmin.Statistics.repetitions(candidate, repetitionCount + 1);
  }
  return candidate;
};
jasmin.Statistics.fisherYatesRestrictRepsNested = function(array, repetitionCounts) {
  var accepted = false, candidate, key, repetitionCount, values;
  while (!accepted) {
    candidate = jasmin.Statistics.fisherYates(array);
    accepted = true;
    for (key in repetitionCounts) {
      repetitionCount = repetitionCounts[key];
      accepted = !jasmin.Statistics.repetitions(candidate, repetitionCount + 1, key);
      if (!accepted) {
        break;
      }
    }
  }
  return candidate;
};
jasmin.Statistics.randomInt = function(min, max) {
  var x = Math.random();
  var diff = max - min + 1;
  var r = min + x * diff;
  return Math.floor(r);
};
jasmin.Statistics.repetitions = function(array, repLength, index) {
  if (repLength < 2) {
    return true;
  }
  if (array.length < repLength) {
    return false;
  }
  var repCounter = 1;
  var prevElement = array[0];
  var i, left, right;
  for (var i = 1;i < array.length;i++) {
    if (index === undefined) {
      left = prevElement;
      right = array[i];
    } else {
      left = prevElement[index];
      right = array[i][index];
    }
    if (JSON.stringify(left) === JSON.stringify(right)) {
      repCounter++;
    } else {
      repCounter = 1;
    }
    if (repCounter >= repLength) {
      return true;
    }
    prevElement = array[i];
  }
  return false;
};
jasmin.Statistics.mean = function(scores) {
  var sum = 0, count = 0;
  for (var i in scores) {
    sum += scores[i];
    count++;
  }
  if (count <= 0) {
    return undefined;
  }
  return sum / count;
};
jasmin.Statistics.sum = function(scores) {
  var sum = 0;
  for (var i in scores) {
    sum += scores[i];
  }
  return sum;
};
jasmin.Statistics.variance = function(scores) {
  var mean = jasmin.Statistics.mean(scores);
  var sumOfSquares = 0, count = 0;
  for (var i in scores) {
    sumOfSquares += Math.pow(scores[i] - mean, 2);
    count++;
  }
  if (count <= 1) {
    return 0;
  }
  return sumOfSquares / (count - 1);
};
jasmin.Statistics.sd = function(scores) {
  return Math.sqrt(jasmin.Statistics.variance(scores));
};
jasmin.Statistics.transformZ = function(scores, mean, sd) {
  var result = jasmin.Statistics.similarArray(scores);
  for (var i in scores) {
    result[i] = (parseInt(scores[i]) - mean) / sd;
  }
  return result;
};
jasmin.Statistics.similarArray = function(source) {
  if (source instanceof Array) {
    return[];
  }
  return{};
};
jasmin.Statistics.orderBy = function(values, indexes) {
  var result = [];
  for (var i in indexes) {
    result.push(values[indexes[i]]);
  }
  return result;
};
jasmin.Statistics.applyRow = function(source, fun) {
  var results, result;
  if (source instanceof Array) {
    results = [];
    for (var i in source) {
      result = fun(source[i]);
      if (result !== undefined) {
        results.push(result);
      }
    }
  } else {
    results = {};
    for (var i in source) {
      result = fun(source[i]);
      if (result !== undefined) {
        results[i] = result;
      }
    }
  }
  return results;
};
jasmin.Statistics.balancedSequence = function(items, reps, proportionA, labelA, labelB, itemKey, labelKey) {
  itemKey = itemKey === undefined ? "item" : itemKey;
  labelKey = labelKey === undefined ? "label" : labelKey;
  var result = [];
  var countA = Math.floor(items.length * reps * proportionA);
  var i, j, labels, newElement;
  for (j = 0;j < reps;j++) {
    if (countA >= items.length) {
      labels = jasmin.Statistics.rep(labelA, items.length);
    } else {
      if (countA <= 0) {
        labels = jasmin.Statistics.rep(labelB, items.length);
      } else {
        labels = jasmin.Statistics.fisherYates(jasmin.Statistics.rep(labelA, countA).concat(jasmin.Statistics.rep(labelB, items.length - countA)));
      }
    }
    countA -= items.length;
    for (i in items) {
      newElement = {};
      newElement[itemKey] = items[i];
      newElement[labelKey] = labels[i];
      result.push(newElement);
    }
  }
  return result;
};
jasmin.Statistics.balancedSequence2 = function(items, count, proportionA, labelA, labelB, itemKey, labelKey) {
  itemKey = itemKey === undefined ? "item" : itemKey;
  labelKey = labelKey === undefined ? "label" : labelKey;
  var result = [];
  var countA = Math.floor(count * proportionA);
  var countB = count - countA;
  var addToResult = function(item, label) {
    var newElement = {};
    newElement[itemKey] = item;
    newElement[labelKey] = label;
    result.push(newElement);
  };
  var i;
  while (countA > items.length) {
    for (i in items) {
      addToResult(items[i], labelA);
    }
    countA -= items.length;
  }
  while (countB > items.length) {
    for (i in items) {
      addToResult(items[i], labelB);
    }
    countB -= items.length;
  }
  var remaining = jasmin.Statistics.fill(items, countA + countB);
  var item1, item2, foundDuplicate = true;
  while (countA > 0 && countB > 0 && foundDuplicate) {
    remaining = jasmin.Statistics.fisherYates(remaining);
    foundDuplicate = false;
    for (item1 = 0;item1 < remaining.length && !foundDuplicate;!foundDuplicate && item1++) {
      for (item2 = item1 + 1;item2 < remaining.length && !foundDuplicate;!foundDuplicate && item2++) {
        if (remaining[item1] == remaining[item2]) {
          foundDuplicate = true;
        }
      }
    }
    if (foundDuplicate) {
      addToResult(remaining[item1], labelA);
      addToResult(remaining[item2], labelB);
      remaining.splice(item2, 1);
      remaining.splice(item1, 1);
      countA--;
      countB--;
    }
  }
  while (countA > 0) {
    addToResult(remaining.shift(), labelA);
    countA--;
  }
  while (countB > 0) {
    addToResult(remaining.shift(), labelB);
    countB--;
  }
  return result;
};
if (jasmin === undefined) {
  var jasmin = function() {
  }
}
jasmin.SyncTimer = function() {
  this.state = jasmin.SyncTimer.STATE_NOT_SYNCED;
  this.synchronousCallback = false;
  this.callbackDrawList = [];
};
jasmin.SyncTimer.STATE_NOT_SYNCED = "not_synced";
jasmin.SyncTimer.STATE_WAITING = "waiting";
jasmin.SyncTimer.STATE_REQUESTED = "requested";
jasmin.SyncTimer.STATE_DRAWN = "drawn";
jasmin.SyncTimer.STATE_SHOWN = "shown";
jasmin.SyncTimer.STATE_DEACTIVATED = "deactivated";
jasmin.SyncTimer.prototype.clearLoggingVars = function() {
  this.timeRequested = undefined;
  this.timeDrawn = undefined;
  this.timeShown = undefined;
  this.timeStopped = undefined;
  this.canceled = undefined;
};
jasmin.SyncTimer.prototype.sync = function(callbackSynced) {
  this.callbackDone = callbackSynced;
  var self = this;
  window.requestAnimationFrame(function() {
    self.refreshFirst();
  });
};
jasmin.SyncTimer.prototype.unsync = function() {
  this.cancelTimeout();
  this.state = jasmin.SyncTimer.STATE_DEACTIVATED;
};
jasmin.SyncTimer.prototype.refreshFirst = function() {
  this.frameNow = window.performance.now();
  var self = this;
  window.requestAnimationFrame(function() {
    self.name = "sync";
    self.state = jasmin.SyncTimer.STATE_SHOWN;
    self.timeToErase = window.performance.now();
    self.refresh();
  });
};
jasmin.SyncTimer.prototype.refresh = function() {
  if (this.callbackDrawList.length > 0) {
    for (var i in this.callbackDrawList) {
      this.callbackDrawList[i]();
    }
    this.callbackDrawList = [];
  }
  if (this.state === jasmin.SyncTimer.STATE_DEACTIVATED) {
    this.state = jasmin.SyncTimer.STATE_NOT_SYNCED;
    return;
  }
  this.framePrev = this.frameNow;
  this.frameNow = window.performance.now();
  this.frameDur = this.frameNow - this.framePrev;
  switch(this.state) {
    case jasmin.SyncTimer.STATE_REQUESTED:
      this.callbackDraw();
      this.drawn = true;
      this.timeDrawnNew = window.performance.now();
      this.state = jasmin.SyncTimer.STATE_DRAWN;
      break;
    case jasmin.SyncTimer.STATE_DRAWN:
      this.timeShownNew = window.performance.now();
      this.realized = this.timeShownNew - this.timeShown;
      this.updateTimeoutLog();
      this.timeRequested = this.timeRequestedNew;
      this.timeDrawn = this.timeDrawnNew;
      this.timeShown = this.timeShownNew;
      this.shown = true;
      this.timeout = this.timeoutNew;
      this.name = this.nameNew;
      if (this.timeout !== -1) {
        this.timeToErase = this.timeShown + this.timeout;
      }
      this.state = jasmin.SyncTimer.STATE_SHOWN;
    case jasmin.SyncTimer.STATE_SHOWN:
      if (this.timeout !== -1 && this.frameNow > this.timeToErase - 1.5 * this.frameDur) {
        this.timeStopped = window.performance.now();
        this.canceled = false;
        this.state = jasmin.SyncTimer.STATE_WAITING;
        this.synchronousCallback = true;
        this.callbackDone();
        this.synchronousCallback = false;
        this.timeDone = window.performance.now();
        this.tear = this.timeDone - this.timeStopped > this.frameDur;
      }
      break;
  }
  var self = this;
  window.requestAnimationFrame(function() {
    self.refresh();
  });
};
jasmin.SyncTimer.prototype.setTimeout = function(timeout, callbackDraw, callbackDone, name) {
  if (this.state === jasmin.SyncTimer.STATE_NOT_SYNCED) {
    alert("SyncTimer.setTimeout called but state == NOT_SYNCED; call sync first");
  }
  this.timeRequestedNew = window.performance.now();
  this.timeoutNew = timeout;
  this.callbackDraw = callbackDraw;
  this.callbackDone = callbackDone;
  this.nameNew = name === undefined ? "noname" : name;
  this.shown = false;
  this.drawn = false;
  if (this.synchronousCallback) {
    this.timeDrawnNew = this.timeRequestedNew;
    this.callbackDraw();
    this.drawn = true;
    this.state = jasmin.SyncTimer.STATE_DRAWN;
  } else {
    this.state = jasmin.SyncTimer.STATE_REQUESTED;
  }
};
jasmin.SyncTimer.prototype.cancelTimeout = function() {
  this.timeStopped = window.performance.now();
  this.realized = this.timeStopped - this.timeShown;
  this.canceled = true;
  this.state = jasmin.SyncTimer.STATE_WAITING;
  if (this.drawn === false) {
    this.callbackDrawList.push(this.callbackDraw);
  }
};
jasmin.SyncTimer.prototype.round = function(number, precision) {
  return Math.round(number * precision) / precision;
};
jasmin.SyncTimer.prototype.updateTimeoutLog = function() {
  this.timeoutLog = {"name":this.name, "timeRequested":this.round(this.timeRequested, 1E3), "timeDrawn":this.round(this.timeDrawn, 1E3), "timeShown":this.round(this.timeShown, 1E3), "timeStopped":this.round(this.timeStopped, 1E3), "timeDone":this.round(this.timeStopped, 1E3), "frameDur":this.frameDur, "tear":this.tear, "canceled":this.canceled, "timeout":this.round(this.timeout, 1E3), "realized":this.round(this.realized, 1E3)};
};
jasmin.SyncTimer.prototype.getPrevTimeoutLog = function() {
  return this.timeoutLog;
};
if (jasmin === undefined) {
  var jasmin = function() {
  }
}
jasmin.TableLogger = function(columns, fail, na) {
  this.columns = columns;
  this.columns.push("logger_sn");
  this.columns.push("logger_time");
  this.fail = fail;
  this.na = na;
  this.sn = 0;
  this.clearLogs();
};
jasmin.TableLogger.prototype.clearLogs = function() {
  this.logs = [];
};
jasmin.TableLogger.prototype.log = function(logMe) {
  logMe["logger_sn"] = this.sn;
  logMe["logger_time"] = Math.round(window.performance.now() * 1E3) / 1E3;
  this.sn++;
  if (this.fail !== undefined) {
    for (var column in logMe) {
      if (this.columns.indexOf(column) === -1) {
        this.fail("TableLogger.log: Column " + column + " in logMe not found in this.columns");
      }
    }
  }
  this.logs.push(logMe);
};
jasmin.TableLogger.prototype.getLogs = function(associative) {
  if (associative) {
    return this.logs;
  }
  var result = [], i, row, value;
  row = [];
  for (var i = 0;i < this.columns.length;i++) {
    row.push(this.columns[i]);
  }
  result.push(row);
  for (var j = 0;j < this.logs.length;j++) {
    row = [];
    for (var i = 0;i < this.columns.length;i++) {
      value = this.logs[j][this.columns[i]];
      row.push(value === undefined ? this.na : value);
    }
    result.push(row);
  }
  return result;
};
if (jasmin === undefined) {
  var jasmin = function() {
  }
}
jasmin.TaskManager = function(task, config, onCompleted, translator, eventManager, state, setState) {
  this.task = task;
  this.config = config;
  this.onCompleted = onCompleted;
  this.translator = translator;
  this.eventManager = eventManager;
  this.eventManager = eventManager !== undefined ? eventManager : new jasmin.EventManager;
  this.translator = translator !== undefined ? translator : new jasmin.Translator;
  this.logger = new jasmin.TableLogger(this.config["logging"]);
  this.state = state;
  if (!(this.state instanceof Object)) {
    this.state = {"block":0, "trial":0, "done":false, "results":[], "block_attempt":0, "block_correct":0, "block_trial_count":0, "task_trial_count":0, "task_trial":0};
  }
  this.setState = setState === undefined ? function() {
  } : setState;
};
jasmin.TaskManager.RESPONSE_NONE = 0;
jasmin.TaskManager.RESPONSE_CORRECT = 1;
jasmin.TaskManager.RESPONSE_INCORRECT = 2;
jasmin.TaskManager.RESPONSE_TIMEOUT = 3;
jasmin.TaskManager.RESPONSE_INVALID = 4;
jasmin.TaskManager.EVENT_RESPONSE = "response";
jasmin.TaskManager.EVENT_NORESPONSE = "noresponse";
jasmin.TaskManager.EVENT_CORRECT = "correct";
jasmin.TaskManager.EVENT_INCORRECT = "incorrect";
jasmin.TaskManager.EVENT_INVALID = "invalid";
jasmin.TaskManager.EVENT_TOOSLOW = "tooslow";
jasmin.TaskManager.EVENT_NEXT = "next";
jasmin.TaskManager.EVENT_RELEASE = "release";
jasmin.TaskManager.EVENT_TRIAL_NEXT = "trial_next";
jasmin.TaskManager.EVENT_TRIAL_REPEAT = "trial_repeat";
jasmin.TaskManager.prototype.start = function() {
  this.configTask = this.config["task_vars"];
  this.task.taskSetup(this.configTask, this.canvas);
  for (var i in this.config["blocks"]) {
    this.state["task_trial_count"] += this.config["blocks"][i]["trials"].length;
  }
  console.log(this.state);
  var self = this;
  this.slideshow = new jasmin.Slideshow($(this.config["slideshow"]["slide_id"]), this.eventManager, this.config["slideshow"]["buttons"], this.config["slideshow"]["button_delay"], function() {
    self.task.slideshowButtonsHide();
  }, function() {
    self.task.slideshowButtonsShow();
  }, this.translator);
  var self = this;
  this.eventManager.start(this.config["button_definitions"], function() {
    self.blockSetup();
  });
};
jasmin.TaskManager.prototype.blockSetup = function() {
  if (this.state["block"] >= this.config.blocks.length) {
    this.done();
    return;
  }
  this.specsBlock = this.config["blocks"][this.state["block"]];
  this.configBlock = this.specsBlock["block_vars"];
  if (this.specsBlock["trial_rep"] !== undefined) {
    var sourceTrials = this.specsBlock["trials"];
    this.specsBlock["trials"] = [];
    var rep_i, trial_i;
    for (trial_i = 0;trial_i < sourceTrials.length;trial_i++) {
      for (rep_i = 0;rep_i < this.specsBlock["trial_rep"];rep_i++) {
        this.specsBlock["trials"].push(sourceTrials[trial_i]);
      }
    }
  }
  if (this.specsBlock["randomize"]) {
    this.specsBlock["trials"] = jasmin.Statistics.fisherYates(this.specsBlock["trials"]);
  }
  this.state["block_trial_count"] = this.specsBlock["trials"].length;
  this.task.blockSetup(this.configBlock);
  this.blockIntroduce();
};
jasmin.TaskManager.prototype.blockIntroduce = function() {
  var self = this;
  this.translator.setCallback("block_counter", function() {
    return self.state["block"] + 1;
  });
  this.translator.setCallback("block_total", function() {
    return self["config"]["blocks"].length;
  });
  this.task.slideshowShow();
  this.slideshow.show(this.specsBlock["intro_slides"], function() {
    self.task.slideshowHide();
    self.trialStart();
  });
};
jasmin.TaskManager.prototype.blockNext = function() {
  if (this.configBlock["min_correct"] === undefined || this.state["block_correct"] / this.state["trial"] >= this.configBlock["min_correct"] && (this.configBlock["max_attempts"] === undefined || this.state["block_attempt"] < this.configBlock["max_attempts"])) {
    this.state["block_attempt"] = 0;
    this.state["block"]++;
  } else {
    this.state["block_attempt"]++;
  }
  this.state["block_correct"] = 0;
  this.state["trial"] = 0;
  this.blockSetup();
};
jasmin.TaskManager.prototype.trialStart = function() {
  var trialsInBlock = this.specsBlock["trials"].length;
  if (this.state["trial"] >= trialsInBlock) {
    this.blockNext();
  } else {
    this.state["attempt"] = 0;
    this.trial = this.state["trial"];
    this.configTrial = this.specsBlock["trials"][this.trial];
    this.task.trialSetup(this.configTrial, this.state);
    this.eventNow = "start";
    this.trialEventStart();
  }
};
jasmin.TaskManager.prototype.trialEventStart = function(feedbackLog) {
  var eventLog = this.eventManager.getEventLog();
  var eventConfig = this.task.trialEvent(this.eventNow, eventLog, feedbackLog);
  this.eventNext = eventConfig["next"];
  if (eventConfig["log"] !== undefined) {
    var logRow = this.collectLogs(eventConfig["log"]);
    this.logger.log(logRow);
    this.state["results"].push(logRow);
  }
  if (eventConfig["response"] === jasmin.TaskManager.RESPONSE_CORRECT && this.state["attempt"] === 0) {
    this.state["block_correct"]++;
  }
  if (eventConfig["retry"]) {
    this.state["attempt"]++;
  }
  var buttons = this.configBlock["button_instruction"] === undefined ? "" : " " + this.configBlock["button_instruction"];
  var self = this;
  switch(eventConfig["type"]) {
    case jasmin.TaskManager.EVENT_NORESPONSE:
      this.eventManager.startEvent(eventConfig["dur"], eventConfig["draw"], function() {
        self.trialEventDone();
      }, [], eventConfig["resetRT"], eventConfig["name"], eventConfig["callbackEvent"]);
      break;
    case jasmin.TaskManager.EVENT_RESPONSE:
      var buttons = eventConfig["buttons"] !== undefined ? eventConfig["buttons"] : "down";
      this.eventManager.startEvent(eventConfig["dur"], eventConfig["draw"], function() {
        self.trialEventDone();
      }, this.config["task_buttons"][buttons], eventConfig["resetRT"], eventConfig["name"], eventConfig["callbackEvent"]);
      break;
    case jasmin.TaskManager.EVENT_RELEASE:
      this.checkReleasedSilent(function() {
        self.trialEventDone();
      }, eventConfig["draw"]);
      break;
    case jasmin.TaskManager.EVENT_TOOSLOW:
      self.showFeedbackSlide(this.translator.translate(self.config["feedback"]["tooslow"]), eventConfig["draw"], false);
      break;
    case jasmin.TaskManager.EVENT_INVALID:
      self.showFeedbackSlide(this.translator.translate(self.config["feedback"]["invalid"]), eventConfig["draw"]);
      break;
    case jasmin.TaskManager.EVENT_INCORRECT:
      self.showFeedbackSlide(this.translator.translate(self.config["feedback"]["incorrect"]), eventConfig["draw"]);
      break;
    case jasmin.TaskManager.EVENT_CORRECT:
      self.showFeedbackSlide(this.translator.translate(self.config["feedback"]["correct"]), eventConfig["draw"]);
      break;
    case jasmin.TaskManager.EVENT_NEXT:
      self.trialEventDone();
      break;
    case jasmin.TaskManager.EVENT_TRIAL_NEXT:
      this.state["trial"]++;
      this.state["task_trial"]++;
      this.trialStart();
      break;
    case jasmin.TaskManager.EVENT_TRIAL_REPEAT:
      this.trialStart();
      break;
    default:
      console.log("TaskManager.trialEventStart, unrecognized eventType in eventConfig:");
      console.log(eventConfig);
  }
};
jasmin.TaskManager.prototype.trialEventDone = function(feedbackLog) {
  this.eventNow = this.eventNext;
  this.trialEventStart(feedbackLog);
};
jasmin.TaskManager.prototype.checkReleasedSilent = function(afterRelease, draw) {
  this.afterRelease = afterRelease;
  var self = this;
  this.eventManager.startEvent(self.config["task_buttons"]["release_timeout"], draw, function(eventLog) {
    self.checkReleasedMessage(eventLog, afterRelease);
  }, this.config["task_buttons"]["up"], "released_silent");
};
jasmin.TaskManager.prototype.checkReleasedMessage = function(eventLog, afterRelease) {
  var eventLog = this.eventManager.getEventLog();
  var self = this;
  if (eventLog["endReason"] === jasmin.EventManager.ENDREASON_TIMEOUT) {
    this.eventManager.startEvent(-1, function() {
      $(self.config["slideshow"]["slide_id"]).html(self.translator.translate(self.config["feedback"]["release"]));
      self.task.slideshowShow();
    }, function() {
      afterRelease();
    }, this.config["task_buttons"]["up"], "released_message");
  } else {
    afterRelease();
  }
};
jasmin.TaskManager.prototype.showFeedbackSlide = function(message, draw, waitForUp) {
  var self = this;
  var drawCallback = function() {
    draw();
    $(self.config["slideshow"]["slide_id"]).html(self.translator.translate(message));
    self.task.slideshowShow();
  };
  waitForUp = waitForUp !== undefined ? waitForUp : true;
  if (!waitForUp) {
    this.shownFeedbackSlide(drawCallback);
  } else {
    this.eventManager.startEvent(1E3, drawCallback, function(eventLog) {
      self.checkReleasedMessage(eventLog, function() {
        self.shownFeedbackSlide(drawCallback);
      }, function() {
        self.task.slideshowHide();
      });
    }, this.config["task_buttons"]["up"], "feedback");
  }
};
jasmin.TaskManager.prototype.shownFeedbackSlide = function(drawCallback) {
  var self = this;
  this.eventManager.startEvent(-1, drawCallback, function(eventLog) {
    var feedbackLog = self.eventManager.getEventLog();
    self.checkReleasedSilent(function() {
      self.trialEventDone(feedbackLog);
    }, function() {
      self.task.slideshowHide();
    });
  }, this.config["task_buttons"]["down"], "feedback");
};
jasmin.TaskManager.prototype.restart = function() {
  this.blockSetup();
};
jasmin.TaskManager.prototype.done = function() {
  this.eventManager.stop();
  this.task.taskDone();
  this.onCompleted();
};
jasmin.TaskManager.prototype.collectLogs = function(eventLog) {
  var result = {};
  var haystacks = [];
  haystacks.push(this.configTask);
  haystacks.push(this.configBlock);
  haystacks.push(this.configTrial);
  haystacks.push(this.state);
  haystacks.push(eventLog);
  var haystack, key, i, j, found;
  for (i in this.config["logging"]) {
    key = this.config["logging"][i];
    found = false;
    j = 0;
    while (!found && j < haystacks.length) {
      haystack = haystacks[j];
      if (haystack[key] !== undefined) {
        found = true;
        result[key] = haystack[key];
      }
      j++;
    }
    if (!found) {
      result[key] = "NA";
    }
  }
  return result;
};
jasmin.TaskManager.pictureUrlsToRequests = function(pictures, baseUrl) {
  var requests = {};
  baseUrl = baseUrl === undefined ? "" : baseUrl;
  for (var p in pictures) {
    requests[p] = ["img", baseUrl + pictures[p]];
  }
  return requests;
};
if (jasmin === undefined) {
  var jasmin = function() {
  }
}
jasmin.Translator = function() {
  this.translations = {};
  this.honorific = undefined;
  this.callbacks = {};
};
jasmin.Translator.prototype.extend = function(destination, source) {
  for (var property in source) {
    if (source.hasOwnProperty(property)) {
      destination[property] = source[property];
    }
  }
  return destination;
};
jasmin.Translator.prototype.setHonorific = function(honorific) {
  this.honorific = honorific;
};
jasmin.Translator.prototype.addTranslations = function(translations) {
  this.translations = this.extend(this.translations, translations);
};
jasmin.Translator.prototype.setCallback = function(term, callback) {
  this.callbacks[term] = callback;
};
jasmin.Translator.prototype.translateTerm = function(term, pretty) {
  pretty = pretty === undefined ? true : pretty;
  if (this.callbacks[term] !== undefined) {
    return this.translate(this.callbacks[term](), pretty);
  }
  var translation;
  if (this.honorific !== undefined) {
    translation = this.translations[this.honorific + "_" + term];
  }
  if (translation === undefined) {
    translation = this.translations[term];
  }
  if (translation === undefined) {
    if (!pretty) {
      return undefined;
    }
    return "!" + term + "!";
  } else {
    return this.translate(translation, pretty);
  }
};
jasmin.Translator.prototype.translate = function(haystack, pretty) {
  pretty = pretty === undefined ? true : pretty;
  var regExpTerm = new RegExp(/[#]\[+[A-Za-z0-9-_ ]+?\]/);
  var regExpTag;
  var tag = true;
  var tag, term, translation;
  while (tag !== null) {
    tag = regExpTerm.exec(haystack);
    if (tag !== null) {
      regExpTag = new RegExp(/[A-Za-z0-9-_ ]+/g);
      term = regExpTag.exec(tag);
      translation = this.translateTerm(term);
      haystack = haystack.replace(regExpTerm, translation);
    }
  }
  return haystack;
};

