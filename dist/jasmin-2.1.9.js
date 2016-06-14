if (void 0 === jasmin) {
  var jasmin = function() {
  }
}
jasmin.ErrorManager = function(a, c) {
  this.callback = a;
  this.maxErrorCount = void 0 === c ? 10 : c;
  this.errorCount = 0;
};
jasmin.ErrorManager.prototype.callbackWindowError = function() {
  var a = this;
  return function(c, b, d, e, f) {
    f instanceof Object || (f = {});
    a.onError({from:"window.onerror", msg:c, url:b, line:d, col:e, stack:f.stack});
  };
};
jasmin.ErrorManager.prototype.onError = function(a) {
  this.errorCount < this.maxErrorCount && (this.errorCount++, this.callback(a));
};
jasmin.ErrorManager.prototype.callbackFail = function() {
  var a = this;
  return function(c) {
    a.onError({from:"fail", msg:c});
  };
};
jasmin.ErrorManager.errorToJasminHandler = function(a, c) {
  return function(b) {
    b = [{runId:c, requestId:"error", request:{namespace:"error", info:b}}];
    console.log(JSON.stringify(b));
    b = {url:a, dataType:"json", type:"POST", data:"data=" + encodeURI(JSON.stringify(b))};
    $.ajax(b);
  };
};
void 0 === jasmin && (jasmin = function() {
});
jasmin.EventManager = function() {
  this.responseManager = new jasmin.ResponseManager;
  this.syncTimer = new jasmin.SyncTimer;
  this.callbackDone = void 0;
};
jasmin.EventManager.ENDREASON_TIMEOUT = "timeout";
jasmin.EventManager.ENDREASON_RESPONSE = "response";
jasmin.EventManager.ENDREASON_CANCELED = "canceled";
jasmin.EventManager.prototype.start = function(a, c) {
  this.responseManager.attach(a);
  this.syncTimer.sync(function() {
    c();
  });
};
jasmin.EventManager.prototype.stop = function() {
  this.responseManager.detach();
  this.syncTimer.unsync();
};
jasmin.EventManager.prototype.startEvent = function(a, c, b, d, e, f) {
  this.clearLoggingVars();
  this.timeout = a;
  this.callbackDraw = c;
  this.callbackDone = b;
  this.buttonsActive = d;
  this.resetRt = void 0 !== e ? e : !0;
  this.name = void 0 !== f ? f : "noname";
  var g = this;
  this.responseManager.activate(d, function() {
    g.endEvent(jasmin.EventManager.ENDREASON_RESPONSE);
  }, this.name);
  this.syncTimer.setTimeout(a, function() {
    g.callbackDraw();
  }, function() {
    g.endEvent(jasmin.EventManager.ENDREASON_TIMEOUT);
  }, this.name);
};
jasmin.EventManager.prototype.endEvent = function(a) {
  this.responseManager.deactivate();
  a !== jasmin.EventManager.ENDREASON_TIMEOUT && this.syncTimer.cancelTimeout();
  this.resetRt && (this.timeRtStart = !1 === this.syncTimer.shown ? window.performance.now() : this.syncTimer.timeShown);
  if (a === jasmin.EventManager.ENDREASON_RESPONSE) {
    var c = this.responseManager.getResponseLog();
    this.rt = c.time - this.syncTimer.timeShown;
    this.responseLabel = c.label;
    this.responseId = c.id;
    this.responseModality = c.modality;
  }
  this.endReason = a;
  this.updateEventLog();
  a !== jasmin.EventManager.ENDREASON_CANCELED && this.callbackDone();
};
jasmin.EventManager.prototype.cancelEvent = function() {
  this.endEvent(jasmin.EventManager.ENDREASON_CANCELED);
};
jasmin.EventManager.prototype.updateEventLog = function() {
  this.eventLog = {name:this.name, rt:Math.round(1E3 * this.rt) / 1E3, endReason:this.endReason, responseLabel:this.responseLabel, modality:this.responseModality, id:this.responseId};
};
jasmin.EventManager.prototype.getEventLog = function() {
  return this.eventLog;
};
jasmin.EventManager.prototype.clearLoggingVars = function() {
  this.responseModality = this.responseId = this.responseLabel = this.endReason = this.rt = this.name = void 0;
};
void 0 === jasmin && (jasmin = function() {
});
jasmin.Loader = function(a, c) {
  this.requestManager = a;
  this.baseUrls = c;
};
jasmin.Loader.prototype.load = function(a, c, b) {
  this.allLoaded = c;
  this.progressCallback = void 0 === b ? function() {
  } : b;
  this.replies = {};
  this.loadTotal = this.loadCounter = 0;
  this.progressCallback(0);
  this.doRequests(a);
  var d = this;
  this.requestManager.flush(function() {
    d.allLoaded(d.replies);
  });
};
jasmin.Loader.prototype.doRequests = function(a) {
  var c = this, b;
  for (b in a) {
    this.loadTotal++, function(a, b, f, g) {
      var h;
      void 0 !== c.baseUrls && void 0 !== c.baseUrls[b] && (f = c.baseUrls[b] + f);
      switch(b) {
        case "css":
          h = jasmin.RequestManager.TYPE_AJAX;
          g = {url:f, dataType:"text"};
          break;
        case "img":
          h = jasmin.RequestManager.TYPE_IMG;
          g = f;
          break;
        default:
          h = jasmin.RequestManager.TYPE_AJAX, void 0 === g && (g = {}), g.dataType = b, g.url = f;
      }
      "font" === b && (g.dataType = "binary", g.processData = !1);
      DEBUG && console.log({what:"request", key:a, dataType:b, url:f, request:g});
      c.requestManager.request(h, g, function(h) {
        DEBUG && console.log({what:"reply", key:a, dataType:b, url:f, request:g, reply:h});
        "css" === b && $('<link rel="stylesheet" type="text/css" href="' + f + '" />').appendTo("head");
        "font" === b && $("head").prepend('<style type="text/css">@font-face {src : url("' + g.url + '");font-family : ' + g["font-family"] + ";font-weight : " + g["font-weight"] + ";font-style  : " + g["font-style"] + ";}");
        c.replies[a] = h;
        c.loadCounter++;
        c.progress();
      });
    }(b, a[b][0], a[b][1], a[b][2], a[b][3]);
  }
};
jasmin.Loader.prototype.progress = function() {
  this.progressCallback(Math.round(100 * this.loadCounter / this.loadTotal));
};
void 0 === jasmin && (jasmin = function() {
});
jasmin.ModalDialog = function(a) {
  this.spinner = $("<img>").css({"vertical-align":"middle", "margin-right":"10px"}).attr({src:"data:image/gif;base64,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"});
  this.dialogMessage = $("<span>").css({});
  this.dialogInner = $("<div>").css({margin:"20px"});
  this.dialogOuter = $("<div>").css({position:"absolute", top:"50%", left:"50%", transform:"translate(-50%, -50%)", "background-color":"#DDDDDD", "border-radius":"10px", display:"none"});
  this.dialogInner.append(this.spinner);
  this.dialogInner.append(this.dialogMessage);
  this.dialogOuter.append(this.dialogInner);
  a.append(this.dialogOuter);
};
jasmin.ModalDialog.prototype.show = function(a, c, b) {
  this.dialogMessage.html(a);
  c ? this.spinner.show() : this.spinner.hide();
  this.callback = b;
  if (void 0 !== b) {
    var d = this;
    this.dialogOuter.on("click", function(a) {
      d.hide();
      d.callback();
    });
  } else {
    this.dialogOuter.off("click");
  }
  this.dialogOuter.show();
};
jasmin.ModalDialog.prototype.hide = function() {
  this.dialogOuter.off("click");
  this.dialogOuter.hide();
};
void 0 === window.performance && (window.performance = {});
void 0 === window.performance.now && (window.performance.now = function() {
  return(new Date).getTime();
});
(function() {
  for (var a = 0, c = ["ms", "moz", "webkit", "o"], b = 0;b < c.length && !window.requestAnimationFrame;++b) {
    window.requestAnimationFrame = window[c[b] + "RequestAnimationFrame"], window.cancelAnimationFrame = window[c[b] + "CancelAnimationFrame"] || window[c[b] + "CancelRequestAnimationFrame"];
  }
  window.requestAnimationFrame || (window.requestAnimationFrame = function(c) {
    var b = (new Date).getTime(), f = Math.max(0, 16 - (b - a)), g = window.setTimeout(function() {
      c(b + f);
    }, f);
    a = b + f;
    return g;
  });
  window.cancelAnimationFrame || (window.cancelAnimationFrame = function(a) {
    clearTimeout(a);
  });
})();
void 0 === jasmin && (jasmin = function() {
});
jasmin.RequestManager = function(a, c, b, d, e, f, g) {
  this.fail = void 0 === a ? function(a) {
    alert(a);
  } : a;
  this.error = void 0 === c ? function() {
  } : c;
  this.report = void 0 === b ? function() {
  } : b;
  this.timeout = void 0 === d ? 4E3 : d;
  this.retries = void 0 === e ? 8 : e;
  this.active = void 0 === f ? !0 : f;
  this.checkInterval = void 0 === g ? 300 : g;
  this.flushing = !1;
  this.flushCallback = void 0;
  this.STATE_OPEN = 1;
  this.STATE_FAILED = 2;
  this.STATE_FIRST = 3;
  this.states = {};
  this.transactionCounter = this.stateCounter = 0;
  this.failed = !1;
  this.active && this.check();
};
jasmin.RequestManager.TYPE_AJAX = "ajax";
jasmin.RequestManager.TYPE_IMG = "img";
jasmin.RequestManager.prototype.request = function(a, c, b, d, e) {
  var f = this.stateCounter;
  this.states[f] = {type:a, request:c, callback:b, timeout:d, retries:e, state:this.STATE_FIRST, retryCounter:0, handled:!1};
  this.stateCounter++;
  this.report("RequestManager.request: ", "stateId " + f + JSON.stringify(c));
  this.active && this.sendOpenRequests();
  return f;
};
jasmin.RequestManager.prototype.sendOpenRequests = function() {
  if ((this.active || this.flushing) && !this.failed) {
    var a = this.statesToSend();
    if (0 < a.length) {
      var c, b;
      for (b in a) {
        c = a[b];
        transactionId = this.transactionCounter;
        switch(this.states[c].type) {
          case jasmin.RequestManager.TYPE_AJAX:
            this.ajaxRequest(c, transactionId);
            break;
          case jasmin.RequestManager.TYPE_IMG:
            this.imgRequest(c, transactionId);
        }
        this.transactionCounter++;
        this.states[c].state = this.STATE_OPEN;
        this.states[c].retryCounter++;
        this.states[c].attemptTime = (new Date).getTime();
      }
    }
  }
};
jasmin.RequestManager.prototype.statesToSend = function() {
  var a = (new Date).getTime(), c = [], b, d;
  for (d in this.states) {
    switch(this.states[d].state) {
      case this.STATE_FIRST:
        c.push(d);
        this.report("RequestManager.statesToSend: ", "stateId " + d + ". STATE_FIRST");
        break;
      case this.STATE_OPEN:
        b = void 0 === this.states[d].timeout ? this.timeout : this.states[d].timeout, a - this.states[d].attemptTime > b && (this.report("RequestManager.statesToSend", "stateId " + d + " open and timed out"), this.states[d].state = this.STATE_FAILED);
    }
    this.states[d].state === this.STATE_FAILED && (this.states[d].retryCounter >= this.retries ? (this.report("RequestManager.statesToSend", "stateId " + d + " failed; Exceeded " + this.retries + " attempts"), this.failed || (this.failed = !0, this.fail("RequestManager: Max attempts exceeded"))) : (this.report("RequestManager.statesToSend", "stateId " + d + " added to sendList"), c.push(d)));
  }
  return c;
};
jasmin.RequestManager.prototype.ajaxRequest = function(a, c) {
  var b = this.states[a].request;
  this.report("RequestManager.ajaxRequest", "stateId = " + a + ", transactionId = " + c + ", ajaxArgs = " + JSON.stringify(b));
  var d = this, b = $.ajax(b);
  b.done(function(b, f) {
    d.report("RequestManager AJAX done", "stateId " + a + ", transactionId " + c + ", status " + f + ", received:" + JSON.stringify(b));
    d.success(a, b);
  });
  b.fail(function(b, f) {
    d.error("RequestManager AJAX fail", "stateId " + a + ", transactionId " + c + ", status " + f + ", received:" + JSON.stringify(b));
  });
};
jasmin.RequestManager.prototype.imgRequest = function(a, c) {
  var b = this.states[a].request;
  this.report("RequestManager.imgRequest", "stateId = " + a + ", transactionId = " + c + ", url = " + JSON.stringify(b));
  var d = this;
  this.states[a].reply = $("<img>").attr("src", b).load(function() {
    d.report("RequestManager img load", "stateId " + a + ", transactionId " + c);
    d.success(a, d.states[a].reply);
  }).error(function() {
    d.error("RequestManager img error", "stateId " + a + ", transactionId " + c);
  });
};
jasmin.RequestManager.prototype.success = function(a, c) {
  if (void 0 !== this.states[a] && !this.states[a].handled) {
    this.states[a].handled = !0;
    if (void 0 !== this.states[a].callback) {
      try {
        this.states[a].callback(c);
      } catch (b) {
      }
    }
    delete this.states[a];
  }
  this.flushing && $.isEmptyObject(this.states) && (this.flushing = !1, void 0 !== this.flushCallback && this.flushCallback());
};
jasmin.RequestManager.prototype.check = function() {
  if ((this.active || this.flushing) && !this.failed) {
    this.sendOpenRequests();
    var a = this;
    setTimeout(function() {
      a.check();
    }, this.checkInterval);
  }
};
jasmin.RequestManager.prototype.flush = function(a) {
  this.flushing = !0;
  this.flushCallback = a;
  $.isEmptyObject(this.states) && void 0 !== this.flushCallback && this.flushCallback();
  this.check();
};
void 0 === jasmin && (jasmin = function() {
});
jasmin.ResponseManager = function() {
  this.active = !1;
  this.responseData = this.callbackResponse = this.buttonsActive = void 0;
};
jasmin.ResponseManager.prototype.attach = function(a) {
  this.buttonDefinitions = a;
  this.bindEvents(!0);
};
jasmin.ResponseManager.prototype.detach = function() {
  this.bindEvents(!1);
};
jasmin.ResponseManager.prototype.bindEvents = function(a) {
  var c = this, b = function(b, d, e) {
    var f = "all" !== d ? $(d) : $(window.document), g = function(a) {
      var f = window.performance.now();
      c.stopBubble(a);
      c.response(a, b, d, e, f, a.pageX, a.pageY);
    };
    a ? (f.off(b), f.on(b, g)) : f.off(b);
  };
  this.keyboardMapping = {keyup:{}, keydown:{}};
  var d = [], e = function(b) {
    if (-1 === d.indexOf(b)) {
      d.push(b);
      b = "all" !== b ? $(b) : $(window.document);
      var e = ["vmousecancel", "mousecancel", "touchcancel"], f, g;
      for (f in e) {
        g = e[f];
        var l = function(a) {
          c.stopBubble(a);
        };
        if (a) {
          b.on(g, l);
        } else {
          b.off(g);
        }
      }
    }
  };
  for (button_i in this.buttonDefinitions) {
    for (modality_i in button = this.buttonDefinitions[button_i], button.modalities) {
      modality = button.modalities[modality_i], "keyup" === modality.type || "keydown" === modality.type ? this.keyboardMapping[modality.type][modality.id] = button.label : (b(modality.type, modality.id, button.label), e(modality.id));
    }
  }
  var b = function(b) {
    var d = function(a) {
      var d = window.performance.now();
      c.stopBubble(a);
      var e = c.keyboardMapping[b][a.which], e = void 0 !== e ? e : c.keyboardMapping[b].all;
      c.response(a, b, a.which, e, d);
    };
    if (a) {
      $(window.document).on(b, d);
    } else {
      $(window.document).off(b);
    }
  }, e = ["keydown", "keyup"], f, g;
  for (f in e) {
    g = e[f], b(g);
  }
};
jasmin.ResponseManager.prototype.activate = function(a, c) {
  this.buttonsActive = a;
  this.callbackResponse = c;
  this.active = !0;
};
jasmin.ResponseManager.prototype.response = function(a, c, b, d, e, f, g) {
  var h = !1;
  this.active && void 0 !== this.buttonsActive && -1 !== this.buttonsActive.indexOf(d) && (h = !0);
  h && (this.responseData = {modality:c, id:b, label:d, time:e, x:f, y:g, event:a}, this.callbackResponse());
};
jasmin.ResponseManager.prototype.getResponseLog = function() {
  return this.responseData;
};
jasmin.ResponseManager.prototype.stopBubble = function(a) {
  a.stopPropagation();
  a.preventDefault();
};
jasmin.ResponseManager.prototype.deactivate = function() {
  this.active = !1;
};
void 0 === jasmin && (jasmin = function() {
});
jasmin.ScalableCanvas = function(a, c, b) {
  this.target = a;
  this.aspectRatio = c;
  this.rescaleInterval = void 0 === b ? 1E3 : b;
  this.sprites = {};
  this.lastWidth = !1;
};
jasmin.ScalableCanvas.prototype.start = function() {
  var a = this;
  a.rescale(!0);
  this.timer = setInterval(function() {
    a.rescale();
  }, a.rescaleInterval);
};
jasmin.ScalableCanvas.prototype.stop = function() {
  clearInterval(this.timer);
};
jasmin.ScalableCanvas.prototype.addSprite = function(a, c, b, d) {
  this.target.append(c);
  this.sprites[a] = {node:c, scale:b, children:d};
};
jasmin.ScalableCanvas.prototype.addSprites = function(a) {
  for (var c in a) {
    this.addSprite(c, a[c].node, a[c].scale, a[c].children);
  }
};
jasmin.ScalableCanvas.prototype.rescale = function(a) {
  if (this.target === $(document.body)) {
    var c = window.innerWidth, b = window.innerHeight
  } else {
    c = this.target.width(), b = this.target.height();
  }
  if (void 0 !== a || this.lastWidth !== c || this.lastHeight !== b) {
    this.lastWidth = c;
    this.lastHeight = b;
    this.offsetTop = this.offsetLeft = 0;
    c / b > this.aspectRatio ? (this.scale = b, this.offsetLeft = (c - this.scale * this.aspectRatio) / 2) : (this.scale = c / this.aspectRatio, this.offsetTop = (b - this.scale) / 2);
    for (var d in this.sprites) {
      this.rescaleSprite(this.sprites[d]);
    }
  }
};
jasmin.ScalableCanvas.prototype.rescaleSprite = function(a) {
  var c = {}, b, d;
  for (d in a.scale) {
    switch(d) {
      case "left":
        b = this.offsetLeft;
        break;
      case "top":
        b = this.offsetTop;
        break;
      default:
        b = 0;
    }
    "relative" === a.node.css("position") && (b = 0);
    b = a.scale[d] * this.scale + b;
    if ("left" === d || "top" === d || "width" === d || "height" === d) {
      b = Math.floor(b);
    }
    c[d] = b;
  }
  a.node.css(c);
  if (void 0 !== a.children) {
    for (var e in a.children) {
      this.rescaleSprite(a.children[e]);
    }
  }
};
jasmin.ScalableCanvas.prototype.spritesFromJSON = function(a, c) {
  var b = {}, d, e, f;
  for (e in a) {
    d = {};
    d.node = $(a[e].type).attr(a[e].attr).css(a[e].css);
    if (void 0 !== a[e]["class"]) {
      for (f in a[e]["class"]) {
        d.node.addClass(a[e]["class"][f]);
      }
    }
    d.scale = a[e].scale;
    void 0 !== a[e].children && (d.children = this.spritesFromJSON(a[e].children, d));
    b[e] = d;
    void 0 !== c && c.node.append(d.node);
  }
  return b;
};
jasmin.ScalableCanvas.prototype.removeSprites = function() {
  for (var a in this.sprites) {
    this.sprites[a].node.remove();
  }
};
void 0 === jasmin && (jasmin = function() {
});
jasmin.ScreenManager = function(a) {
  this.watchTimeout = void 0 === a ? 1E3 : a;
  this.callbacks = {};
  this.logger = new jasmin.TableLogger(["name", "phase", "time", "value"], function(a) {
    console.log(a);
  }, "NA");
  var c = this;
  this.logger.oldLog = this.logger.log;
  this.logger.log = function(a) {
    DEBUG && console.log({screenState:c.screenState});
    c.logger.oldLog(a);
  };
  this.requirements = [];
  this.satisfiedEach = this.satisfiedFirst = void 0;
  this.screenState = {orientation:$(window).width() >= $(window).height() ? "landscape" : "portrait", focus:!0, fullscreen:this.isFullscreen()};
  c = this;
  a = {orientationchange:{source:window, event:"orientationchange", on:function(a) {
    var b = $(window).width() >= $(window).height() ? "landscape" : "portrait";
    c.screenState.orientation = b;
    c.checkRequirements();
    return{"window.orientation":a.orientation};
  }}, focusout:{source:window, event:"focusout", on:function(a) {
    c.screenState.focus = !1;
    c.checkRequirements();
    return{};
  }}, focusin:{source:window, event:"focusin", on:function(a) {
    c.screenState.focus = !0;
    c.checkRequirements();
    return{};
  }}, resize:{source:window, event:"resize", on:function(a) {
    a = $(window).width() >= $(window).height() ? "landscape" : "portrait";
    c.screenState.orientation = a;
    c.checkRequirements();
    return{"window.width":$(window).width(), "window.height":$(window).height(), "avail.width":screen.availWidth, "avail.height":screen.availHeight};
  }}, beforeunload:{source:window, event:"beforeunload", on:function() {
    return{};
  }}, unload:{source:window, event:"unload", on:function() {
    return{};
  }}};
  screenfull && void 0 !== screenfull.raw && (a.fullscreenchange = {source:document, event:screenfull.raw.fullscreenchange, on:function() {
    var a = $(window).width() >= $(window).height() ? "landscape" : "portrait";
    c.screenState.orientation = a;
    c.checkRequirements();
    return{"window.width":$(window).width(), "window.height":$(window).height(), "avail.width":screen.availWidth, "avail.height":screen.availHeight, "screenfull.isFullscreen":screenfull.isFullscreen};
  }});
  var b, c = this, d, e;
  for (e in a) {
    b = a[e], d = function(a, b) {
      return function(d) {
        return c.changed(a, b, d);
      };
    }, $(b.source).on(b.event, d(e, b.on));
  }
  this.watching = {};
  this.logger.log({name:"init", phase:"start", time:1E3 * window.performance.now() / 1E3, value:{"screen.width":screen.width, "screen.height":screen.height, "avail.width":screen.availWidth, "avail.height":screen.availHeight, "window.width":$(window).width(), "window.height":$(window).height()}});
  c = this;
  setTimeout(c.updateWatch(), this.watchTimeout);
};
jasmin.ScreenManager.prototype.changed = function(a, c, b) {
  this.watch(a, c(b));
  var d;
  void 0 !== this.callbacks[a] && (d = this.callbacks[a](b));
  return d;
};
jasmin.ScreenManager.prototype.watch = function(a, c) {
  var b = 1E3 * window.performance.now() / 1E3;
  void 0 === this.watch[a] && this.logger.log({name:a, phase:"start", time:b, value:c});
  this.watch[a] = b;
};
jasmin.ScreenManager.prototype.updateWatch = function() {
  var a = 1E3 * window.performance.now() / 1E3, c;
  for (c in this.watch) {
    this.watch[c] + this.watchTimeout < a && (this.logger.log({name:c, phase:"end", time:this.watch[c], value:{}}), delete this.watch[c]), this.checkRequirements();
  }
  var b = this;
  setTimeout(function() {
    b.updateWatch();
  }, this.watchTimeout);
};
jasmin.ScreenManager.prototype.fullscreen = function(a, c, b) {
  this.fullscreenEnabled = a;
  this.fullscreenAsk = c;
  this.fullscreenDone = b;
  this.fullscreenEnabled && !this.isFullscreen() && (void 0 !== this.fullscreenAsk && this.fullscreenAsk(), this.attachFullscreenCallback());
  this.fullscreenEnabled || screenfull.exit();
};
jasmin.ScreenManager.prototype.isFullscreen = function() {
  return!screenfull || !screenfull.enabled || screenfull.isFullscreen;
};
jasmin.ScreenManager.prototype.attachFullscreenCallback = function() {
  var a = this;
  a.fullscreenCallback = function(a) {
    return function() {
      void 0 === this.fullScreenTarget ? screenfull.request() : screenfull.request(this.fullScreenTarget);
      a.screenState.fullscreen = !0;
      $(document).off("vmousedown", a.fullscreenCallback);
      a.checkRequirements();
    };
  }(this);
  this.isFullscreen() || this.attached || ($(document).on("vmousedown", function() {
    a.fullscreenCallback();
  }), this.attached = !0);
};
jasmin.ScreenManager.prototype.detachFullscreenCallback = function() {
  $(document).off("vmousedown", self.fullscreenCallback);
};
jasmin.ScreenManager.prototype.addCallback = function(a, c) {
  this.callbacks[a] = c;
};
jasmin.ScreenManager.prototype.checkRequirements = function() {
  var a, c, b = !1, d = !1;
  for (c in this.requirements) {
    d || (a = this.requirements[c], -1 === a.values.indexOf(this.screenState[a.req]) && (DEBUG && console.log({what:"requirement not satisfied", req:a.req, values:a.values, state:this.screenState[a.req]}), this.satisfied = !1, a.warn(), "fullscreen" === a.req && (b = !0, this.attachFullscreenCallback()), d = !0));
  }
  b || this.detachFullscreenCallback();
  d || (a = function() {
  }, this.satisfiedNever ? (DEBUG && console.log("callback to this.satisfiedFirst"), a = this.satisfiedFirst, this.satisfiedNever = !1) : this.satisfied || (DEBUG && console.log("callback to this.satisfiedEach"), a = this.satisfiedEach), this.satisfied = !0, a instanceof Function && a());
};
jasmin.ScreenManager.prototype.require = function(a, c, b, d) {
  this.requirements = a;
  this.satisfiedFirst = c;
  this.satisfiedEach = b;
  this.fullScreenTarget = d;
  this.satisfiedNever = !0;
  this.satisfied = !1;
  this.checkRequirements();
};
void 0 === jasmin && (jasmin = function() {
});
jasmin.Slideshow = function(a, c, b, d, e, f, g) {
  this.target = a;
  this.eventManager = c;
  this.translator = g;
  this.slideButtons = b;
  this.buttonDelay = void 0 !== d ? d : 0;
  this.buttonHide = void 0 !== e ? e : function() {
  };
  this.buttonShow = void 0 !== f ? f : function() {
  };
  void 0 === g ? (this.translator = {}, this.translator.translate = function(a) {
    return a;
  }) : this.translator = g;
  this.logger = new jasmin.TableLogger("set slide delay phase response rt modality id time_start time_buttons time_response".split(" "));
  this.buttonsActive = [];
  this.buttonMapping = {};
  a = ["next", "previous", "up"];
  var h, k;
  for (h in a) {
    for (k in c = a[h], d = b[c], d) {
      e = d[k], this.buttonsActive.push(e), this.buttonMapping[e] = c;
    }
  }
  DEBUG && console.log({"this.buttonMapping":this.buttonMapping});
};
jasmin.Slideshow.prototype.show = function(a, c, b) {
  0 === a.length ? c() : (this.slides = a, this.callbackDone = c, this.slideSet = void 0 !== b ? b : "noname", this.firstSlide = !0, this.slideCounter = 0, this.slideFurthest = -1, this.showSlide());
};
jasmin.Slideshow.prototype.nextSlide = function() {
  DEBUG && console.log("nextSlide");
  this.logSlideInfo("down");
  var a = this;
  this.eventManager.startEvent(-1, function() {
    a.target.hide();
  }, function() {
    a.showSlide();
  }, this.slideButtons.up, "released_silent");
};
jasmin.Slideshow.prototype.showSlide = function() {
  DEBUG && console.log("showSlide");
  this.firstSlide ? this.firstSlide = !1 : (this.timeResponse = window.performance.now(), this.logSlideInfo("up"));
  var a = this;
  this.slideCounter >= this.slides.length ? a.callbackDone() : (this.timeStart = window.performance.now(), 0 === this.buttonDelay ? this.showButtons() : this.slideFurthest >= this.slideCounter ? this.showButtons() : (this.slideFurthest = this.slideCounter, this.eventManager.startEvent(this.buttonDelay, function() {
    a.target.show();
    a.target.html(a.translator.translate(a.slides[a.slideCounter]));
    a.buttonHide();
  }, function() {
    a.showButtons();
  }, [], !0, "slide_nobutton_" + a.slideCounter)));
};
jasmin.Slideshow.prototype.showButtons = function() {
  this.timeButtons = window.performance.now();
  var a = this;
  this.eventManager.startEvent(-1, function() {
    a.target.html(a.translator.translate(a.slides[a.slideCounter]));
    a.target.show();
    a.buttonShow();
  }, function() {
    a.response();
  }, this.buttonsActive, "slide_nobutton_" + a.slideCounter);
};
jasmin.Slideshow.prototype.response = function() {
  this.timeResponse = window.performance.now();
  var a = this.buttonMapping[this.eventManager.responseLabel];
  "next" === a ? (this.slideCounter++, this.nextSlide()) : "previous" === a && 0 < this.slideCounter ? (this.slideCounter--, this.nextSlide()) : this.showSlide();
};
jasmin.Slideshow.prototype.logSlideInfo = function(a) {
  a = {set:this.slideSet, slide:this.slideCounter, delay:this.buttonDelay, phase:a, response:this.buttonMapping[this.eventManager.responseLabel], rt:Math.round(1E3 * this.eventManager.rt) / 1E3, modality:this.eventManager.responseManager.responseData.modality, id:this.eventManager.responseManager.responseData.id, time_start:Math.round(1E3 * this.timeStart) / 1E3, time_buttons:Math.round(1E3 * this.timeButtons) / 1E3, time_response:Math.round(1E3 * this.timeResponse) / 1E3};
  this.logger.log(a);
  DEBUG && console.log(a);
};
void 0 === jasmin && (jasmin = function() {
});
jasmin.Statistics = function() {
};
jasmin.Statistics.rep = function(a, c) {
  for (var b = [], d = 0;d < c;d += 1) {
    b.push(a);
  }
  return b;
};
jasmin.Statistics.fill = function(a, c) {
  for (var b = [], d = c;0 < d;) {
    if (d >= a.length) {
      b = b.concat(a), d -= a.length;
    } else {
      a = jasmin.Statistics.fisherYates(a);
      for (var e = 0;e < d;e++) {
        b.push(a[e]);
      }
      d = 0;
    }
  }
  return b;
};
jasmin.Statistics.seq = function(a, c, b, d) {
  b = void 0 === b ? 1 : b;
  d = void 0 === d ? 1 : d;
  for (var e = [], f;a <= c;a += b) {
    for (f = 0;f < d;f += 1) {
      e.push(a);
    }
  }
  return e;
};
jasmin.Statistics.fisherYates = function(a) {
  for (var c = a.length, b, d;c;) {
    d = Math.floor(Math.random() * c--), b = a[c], a[c] = a[d], a[d] = b;
  }
  return a;
};
jasmin.Statistics.randomInt = function(a, c) {
  var b = Math.random();
  return Math.floor(a + b * (c - a + 1));
};
jasmin.Statistics.repetitions = function(a, c, b) {
  if (2 > c) {
    return!0;
  }
  if (a.length < c) {
    return!1;
  }
  var d = 1, e = a[0], f, g;
  for (f = 1;f < a.length;f++) {
    void 0 === b ? g = a[f] : (e = e[b], g = a[f][b]);
    JSON.stringify(e) === JSON.stringify(g) ? d++ : d = 1;
    if (d >= c) {
      return!0;
    }
    e = a[f];
  }
  return!1;
};
jasmin.Statistics.mean = function(a) {
  var c = 0, b = 0, d;
  for (d in a) {
    c += a[d], b++;
  }
  return 0 >= b ? void 0 : c / b;
};
jasmin.Statistics.sum = function(a) {
  var c = 0, b;
  for (b in a) {
    c += a[b];
  }
  return c;
};
jasmin.Statistics.variance = function(a) {
  var c = jasmin.Statistics.mean(a), b = 0, d = 0, e;
  for (e in a) {
    b += Math.pow(a[e] - c, 2), d++;
  }
  return 1 >= d ? 0 : b / (d - 1);
};
jasmin.Statistics.sd = function(a) {
  return Math.sqrt(jasmin.Statistics.variance(a));
};
jasmin.Statistics.transformZ = function(a, c, b) {
  var d = jasmin.Statistics.similarArray(a), e;
  for (e in a) {
    d[e] = (parseInt(a[e]) - c) / b;
  }
  return d;
};
jasmin.Statistics.similarArray = function(a) {
  return a instanceof Array ? [] : {};
};
jasmin.Statistics.orderBy = function(a, c) {
  var b = [], d;
  for (d in c) {
    b.push(a[c[d]]);
  }
  return b;
};
jasmin.Statistics.applyRow = function(a, c) {
  var b, d;
  if (a instanceof Array) {
    b = [];
    for (var e in a) {
      d = c(a[e]), void 0 !== d && b.push(d);
    }
  } else {
    for (e in b = {}, a) {
      d = c(a[e]), void 0 !== d && (b[e] = d);
    }
  }
  return b;
};
jasmin.Statistics.balancedSequence = function(a, c, b, d, e, f, g) {
  f = void 0 === f ? "item" : f;
  g = void 0 === g ? "label" : g;
  var h = [];
  b = Math.floor(a.length * c * b);
  var k, n, m, l;
  for (n = 0;n < c;n++) {
    for (k in b >= a.length ? m = jasmin.Statistics.rep(d, a.length) : 0 >= b ? m = jasmin.Statistics.rep(e, a.length) : (m = jasmin.Statistics.fisherYates(jasmin.Statistics.rep(d, b).concat(jasmin.Statistics.rep(e, a.length - b))), console.log(m)), b -= a.length, a) {
      l = {}, l[f] = a[k], l[g] = m[k], h.push(l);
    }
  }
  return h;
};
void 0 === jasmin && (jasmin = function() {
});
jasmin.SyncTimer = function() {
  this.state = jasmin.SyncTimer.STATE_NOT_SYNCED;
  this.synchronousCallback = !1;
  this.callbackDrawList = [];
};
jasmin.SyncTimer.STATE_NOT_SYNCED = "not_synced";
jasmin.SyncTimer.STATE_WAITING = "waiting";
jasmin.SyncTimer.STATE_REQUESTED = "requested";
jasmin.SyncTimer.STATE_DRAWN = "drawn";
jasmin.SyncTimer.STATE_SHOWN = "shown";
jasmin.SyncTimer.STATE_DEACTIVATED = "deactivated";
jasmin.SyncTimer.prototype.clearLoggingVars = function() {
  this.canceled = this.timeStopped = this.timeShown = this.timeDrawn = this.timeRequested = void 0;
};
jasmin.SyncTimer.prototype.sync = function(a) {
  this.callbackDone = a;
  var c = this;
  window.requestAnimationFrame(function() {
    c.refreshFirst();
  });
};
jasmin.SyncTimer.prototype.unsync = function() {
  this.cancelTimeout();
  this.state = jasmin.SyncTimer.STATE_DEACTIVATED;
};
jasmin.SyncTimer.prototype.refreshFirst = function() {
  this.frameNow = window.performance.now();
  var a = this;
  window.requestAnimationFrame(function() {
    a.name = "sync";
    a.state = jasmin.SyncTimer.STATE_SHOWN;
    a.timeToErase = window.performance.now();
    a.refresh();
  });
};
jasmin.SyncTimer.prototype.refresh = function() {
  if (0 < this.callbackDrawList.length) {
    for (var a in this.callbackDrawList) {
      this.callbackDrawList[a]();
    }
    this.callbackDrawList = [];
  }
  if (this.state === jasmin.SyncTimer.STATE_DEACTIVATED) {
    this.state = jasmin.SyncTimer.STATE_NOT_SYNCED;
  } else {
    this.framePrev = this.frameNow;
    this.frameNow = window.performance.now();
    this.frameDur = this.frameNow - this.framePrev;
    switch(this.state) {
      case jasmin.SyncTimer.STATE_REQUESTED:
        this.callbackDraw();
        this.drawn = !0;
        this.timeDrawnNew = window.performance.now();
        this.state = jasmin.SyncTimer.STATE_DRAWN;
        break;
      case jasmin.SyncTimer.STATE_DRAWN:
        this.timeShownNew = window.performance.now(), this.realized = this.timeShownNew - this.timeShown, this.updateTimeoutLog(), this.timeRequested = this.timeRequestedNew, this.timeDrawn = this.timeDrawnNew, this.timeShown = this.timeShownNew, this.shown = !0, this.timeout = this.timeoutNew, this.name = this.nameNew, -1 !== this.timeout && (this.timeToErase = this.timeShown + this.timeout), this.state = jasmin.SyncTimer.STATE_SHOWN;
      case jasmin.SyncTimer.STATE_SHOWN:
        -1 !== this.timeout && this.frameNow > this.timeToErase - 1.5 * this.frameDur && (this.timeStopped = window.performance.now(), this.canceled = !1, this.state = jasmin.SyncTimer.STATE_WAITING, this.synchronousCallback = !0, this.callbackDone(), this.synchronousCallback = !1, this.timeDone = window.performance.now(), this.tear = this.timeDone - this.timeStopped > this.frameDur);
    }
    var c = this;
    window.requestAnimationFrame(function() {
      c.refresh();
    });
  }
};
jasmin.SyncTimer.prototype.setTimeout = function(a, c, b, d) {
  this.state === jasmin.SyncTimer.STATE_NOT_SYNCED && alert("SyncTimer.setTimeout called but state == NOT_SYNCED; call sync first");
  this.timeRequestedNew = window.performance.now();
  this.timeoutNew = a;
  this.callbackDraw = c;
  this.callbackDone = b;
  this.nameNew = void 0 === d ? "noname" : d;
  this.drawn = this.shown = !1;
  this.synchronousCallback ? (this.timeDrawnNew = this.timeRequestedNew, this.callbackDraw(), this.drawn = !0, this.state = jasmin.SyncTimer.STATE_DRAWN) : this.state = jasmin.SyncTimer.STATE_REQUESTED;
};
jasmin.SyncTimer.prototype.cancelTimeout = function() {
  this.timeStopped = window.performance.now();
  this.realized = this.timeStopped - this.timeShown;
  this.canceled = !0;
  this.state = jasmin.SyncTimer.STATE_WAITING;
  !1 === this.drawn && this.callbackDrawList.push(this.callbackDraw);
};
jasmin.SyncTimer.prototype.round = function(a, c) {
  return Math.round(a * c) / c;
};
jasmin.SyncTimer.prototype.updateTimeoutLog = function() {
  this.timeoutLog = {name:this.name, timeRequested:this.round(this.timeRequested, 1E3), timeDrawn:this.round(this.timeDrawn, 1E3), timeShown:this.round(this.timeShown, 1E3), timeStopped:this.round(this.timeStopped, 1E3), timeDone:this.round(this.timeStopped, 1E3), frameDur:this.frameDur, tear:this.tear, canceled:this.canceled, timeout:this.round(this.timeout, 1E3), realized:this.round(this.realized, 1E3)};
};
jasmin.SyncTimer.prototype.getPrevTimeoutLog = function() {
  return this.timeoutLog;
};
void 0 === jasmin && (jasmin = function() {
});
jasmin.TableLogger = function(a, c, b) {
  this.columns = a;
  this.columns.push("logger_sn");
  this.columns.push("logger_time");
  this.fail = c;
  this.na = b;
  this.sn = 0;
  this.clearLogs();
};
jasmin.TableLogger.prototype.clearLogs = function() {
  this.logs = [];
};
jasmin.TableLogger.prototype.log = function(a) {
  a.logger_sn = this.sn;
  a.logger_time = Math.round(1E3 * window.performance.now()) / 1E3;
  this.sn++;
  if (void 0 !== this.fail) {
    for (var c in a) {
      -1 === this.columns.indexOf(c) && this.fail("TableLogger.log: Column " + c + " in logMe not found in this.columns");
    }
  }
  this.logs.push(a);
};
jasmin.TableLogger.prototype.getLogs = function(a) {
  if (a) {
    return this.logs;
  }
  a = [];
  var c, b, d;
  b = [];
  for (c = 0;c < this.columns.length;c++) {
    b.push(this.columns[c]);
  }
  a.push(b);
  for (var e = 0;e < this.logs.length;e++) {
    b = [];
    for (c = 0;c < this.columns.length;c++) {
      d = this.logs[e][this.columns[c]], b.push(void 0 === d ? this.na : d);
    }
    a.push(b);
  }
  return a;
};
void 0 === jasmin && (jasmin = function() {
});
jasmin.TaskManager = function(a, c, b, d, e, f, g) {
  this.task = a;
  this.config = c;
  this.onCompleted = b;
  this.translator = d;
  this.eventManager = e;
  this.eventManager = void 0 !== e ? e : new jasmin.EventManager;
  this.translator = void 0 !== d ? d : new jasmin.Translator;
  this.logger = new jasmin.TableLogger(this.config.logging);
  this.state = f;
  this.state instanceof Object || (this.state = {block:0, trial:0, done:!1, results:[]});
  this.setState = void 0 === g ? function() {
  } : g;
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
  this.configTask = this.config.task_vars;
  this.task.taskSetup(this.configTask, this.canvas);
  var a = this;
  this.slideshow = new jasmin.Slideshow($(this.config.slideshow.slide_id), this.eventManager, this.config.slideshow.buttons, this.config.slideshow.button_delay, function() {
    a.task.slideshowButtonsHide();
  }, function() {
    a.task.slideshowButtonsShow();
  }, this.translator);
  a = this;
  this.eventManager.start(this.config.button_definitions, function() {
    a.blockSetup();
  });
};
jasmin.TaskManager.prototype.blockSetup = function() {
  if (this.state.block >= this.config.blocks.length) {
    this.done();
  } else {
    this.specsBlock = this.config.blocks[this.state.block];
    this.configBlock = this.specsBlock.block_vars;
    if (void 0 !== this.specsBlock.trial_rep) {
      var a = this.specsBlock.trials;
      this.specsBlock.trials = [];
      var c, b;
      for (b = 0;b < a.length;b++) {
        for (c = 0;c < this.specsBlock.trial_rep;c++) {
          this.specsBlock.trials.push(a[b]);
        }
      }
    }
    this.specsBlock.randomize && (this.specsBlock.trials = jasmin.Statistics.fisherYates(this.specsBlock.trials));
    this.task.blockSetup(this.configBlock);
    this.blockIntroduce();
  }
};
jasmin.TaskManager.prototype.blockIntroduce = function() {
  this.translator.setCallback("block_counter", function() {
    return a.block + 1;
  });
  this.translator.setCallback("block_total", function() {
    return a.config.blocks.length;
  });
  var a = this;
  this.task.slideshowShow();
  this.slideshow.show(this.specsBlock.intro_slides, function() {
    a.task.slideshowHide();
    a.trialStart();
  });
};
jasmin.TaskManager.prototype.blockNext = function() {
  this.state.trial = 0;
  this.state.block++;
  this.blockSetup();
};
jasmin.TaskManager.prototype.trialStart = function() {
  this.state.trial >= this.specsBlock.trials.length ? this.blockNext() : (this.state.attempt = 0, this.trial = this.state.trial, this.configTrial = this.specsBlock.trials[this.trial], this.task.trialSetup(this.configTrial), this.eventNow = "start", this.trialEventStart());
};
jasmin.TaskManager.prototype.trialEventStart = function(a) {
  var c = this.eventManager.getEventLog();
  a = this.task.trialEvent(this.eventNow, c, a);
  this.eventNext = a.next;
  void 0 !== a.log && (c = this.collectLogs(a.log), this.logger.log(c), this.state.results.push(c));
  a.retry && this.state.attempt++;
  var c = void 0 === this.configBlock.button_instruction ? "" : " " + this.configBlock.button_instruction, b = this;
  switch(a.type) {
    case jasmin.TaskManager.EVENT_NORESPONSE:
      this.eventManager.startEvent(a.dur, a.draw, function() {
        b.trialEventDone();
      }, [], this.event, a.resetRT);
      break;
    case jasmin.TaskManager.EVENT_RESPONSE:
      c = void 0 !== a.buttons ? a.buttons : "down";
      this.eventManager.startEvent(a.dur, a.draw, function() {
        b.trialEventDone();
      }, this.config.task_buttons[c], this.event, a.resetRT);
      break;
    case jasmin.TaskManager.EVENT_RELEASE:
      this.checkReleasedSilent(function() {
        b.trialEventDone();
      }, a.draw);
      break;
    case jasmin.TaskManager.EVENT_TOOSLOW:
      b.showFeedbackSlide(this.translator.translate(b.config.feedback.tooslow), a.draw, !1);
      break;
    case jasmin.TaskManager.EVENT_INVALID:
      b.showFeedbackSlide(this.translator.translate(b.config.feedback.invalid), a.draw);
      break;
    case jasmin.TaskManager.EVENT_INCORRECT:
      b.showFeedbackSlide(this.translator.translate(b.config.feedback.incorrect), a.draw);
      break;
    case jasmin.TaskManager.EVENT_CORRECT:
      b.showFeedbackSlide(this.translator.translate(b.config.feedback.correct), a.draw);
      break;
    case jasmin.TaskManager.EVENT_NEXT:
      b.trialEventDone();
      break;
    case jasmin.TaskManager.EVENT_TRIAL_NEXT:
      this.state.trial++;
      this.trialStart();
      break;
    case jasmin.TaskManager.EVENT_TRIAL_REPEAT:
      this.trialStart();
      break;
    default:
      console.log("TaskManager.trialEventStart, unrecognized eventType in eventConfig:"), console.log(a);
  }
};
jasmin.TaskManager.prototype.trialEventDone = function(a) {
  this.eventNow = this.eventNext;
  this.trialEventStart(a);
};
jasmin.TaskManager.prototype.checkReleasedSilent = function(a, c) {
  this.afterRelease = a;
  var b = this;
  this.eventManager.startEvent(b.config.task_buttons.release_timeout, c, function(c) {
    b.checkReleasedMessage(c, a);
  }, this.config.task_buttons.up, "released_silent");
};
jasmin.TaskManager.prototype.checkReleasedMessage = function(a, c) {
  a = this.eventManager.getEventLog();
  var b = this;
  a.endReason === jasmin.EventManager.ENDREASON_TIMEOUT ? this.eventManager.startEvent(-1, function() {
    $(b.config.slideshow.slide_id).html(b.translator.translate(b.config.feedback.release));
    b.task.slideshowShow();
  }, function() {
    c();
  }, this.config.task_buttons.up, "released_message") : c();
};
jasmin.TaskManager.prototype.showFeedbackSlide = function(a, c, b) {
  var d = this, e = function() {
    c();
    $(d.config.slideshow.slide_id).html(d.translator.translate(a));
    d.task.slideshowShow();
  };
  (void 0 !== b ? b : 1) ? this.eventManager.startEvent(1E3, e, function(a) {
    d.checkReleasedMessage(a, function() {
      d.shownFeedbackSlide(e);
    }, function() {
      d.task.slideshowHide();
    });
  }, this.config.task_buttons.up, "feedback") : this.shownFeedbackSlide(e);
};
jasmin.TaskManager.prototype.shownFeedbackSlide = function(a) {
  var c = this;
  this.eventManager.startEvent(-1, a, function(a) {
    var d = c.eventManager.getEventLog();
    c.checkReleasedSilent(function() {
      c.trialEventDone(d);
    }, function() {
      c.task.slideshowHide();
    });
  }, this.config.task_buttons.down, "feedback");
};
jasmin.TaskManager.prototype.restart = function() {
  this.blockSetup();
};
jasmin.TaskManager.prototype.done = function() {
  this.eventManager.stop();
  this.task.taskDone();
  this.onCompleted();
};
jasmin.TaskManager.prototype.collectLogs = function(a) {
  var c = {}, b = [];
  b.push(this.configTask);
  b.push(this.configBlock);
  b.push(this.configTrial);
  b.push(this.state);
  b.push(a);
  var d, e, f, g;
  for (e in this.config.logging) {
    d = this.config.logging[e];
    g = !1;
    for (f = 0;!g && f < b.length;) {
      a = b[f], void 0 !== a[d] && (g = !0, c[d] = a[d]), f++;
    }
    g || (c[d] = "NA");
  }
  return c;
};
jasmin.TaskManager.pictureUrlsToRequests = function(a, c) {
  var b = {};
  c = void 0 === c ? "" : c;
  for (var d in a) {
    b[d] = ["img", c + a[d]];
  }
  return b;
};
void 0 === jasmin && (jasmin = function() {
});
jasmin.Translator = function() {
  this.translations = {};
  this.honorific = void 0;
  this.callbacks = {};
};
jasmin.Translator.prototype.extend = function(a, c) {
  for (var b in c) {
    c.hasOwnProperty(b) && (a[b] = c[b]);
  }
  return a;
};
jasmin.Translator.prototype.setHonorific = function(a) {
  this.honorific = a;
};
jasmin.Translator.prototype.addTranslations = function(a) {
  this.translations = this.extend(this.translations, a);
};
jasmin.Translator.prototype.setCallback = function(a, c) {
  this.callbacks[a] = c;
};
jasmin.Translator.prototype.translateTerm = function(a, c) {
  c = void 0 === c ? !0 : c;
  if (void 0 !== this.callbacks[a]) {
    return this.translate(this.callbacks[a](), c);
  }
  var b;
  void 0 !== this.honorific && (b = this.translations[this.honorific + "_" + a]);
  void 0 === b && (b = this.translations[a]);
  return void 0 === b ? c ? "!" + a + "!" : void 0 : this.translate(b, c);
};
jasmin.Translator.prototype.translate = function(a, c) {
  for (var b = new RegExp(/[#]\[+[A-Za-z0-9-_ ]+?\]/), d, e = !0;null !== e;) {
    e = b.exec(a), null !== e && (d = new RegExp(/[A-Za-z0-9-_ ]+/g), d = d.exec(e), d = this.translateTerm(d), a = a.replace(b, d));
  }
  return a;
};

