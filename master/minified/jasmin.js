if (void 0 === jasmin) {
  var jasmin = function() {
  }
}
jasmin.EVENT_ENDREASON_TIMEOUT = 0;
jasmin.EVENT_ENDREASON_RESPONSE = 1;
jasmin.EVENT_ENDREASON_CANCEL = 2;
jasmin.EventManager = function(a) {
  this.responseManager = new jasmin.ResponseManager(a);
  this.syncTimer = new jasmin.SyncTimer;
  this.callbackDone = void 0;
};
jasmin.EventManager.prototype.sync = function(a) {
  this.syncTimer.sync(function() {
    a();
  });
};
jasmin.EventManager.prototype.startEvent = function(a, b, c, d, e) {
  this.clearLoggingVars();
  this.timeout = a;
  this.callbackDraw = b;
  this.callbackDone = c;
  this.activeResponses = d;
  this.name = void 0 === e ? "noname" : e;
  var f = this;
  this.responseManager.activate(d, function() {
    f.endEvent(jasmin.EVENT_ENDREASON_RESPONSE);
  }, this.name);
  this.syncTimer.setTimeout(a, function() {
    f.callbackDraw();
  }, function() {
    f.endEvent(jasmin.EVENT_ENDREASON_TIMEOUT);
  }, this.name);
};
jasmin.EventManager.prototype.endEvent = function(a) {
  this.responseManager.deactivate();
  a !== jasmin.EVENT_ENDREASON_TIMEOUT && this.syncTimer.cancelTimeout();
  a === jasmin.EVENT_ENDREASON_RESPONSE && (this.rt = this.responseManager.time - this.syncTimer.timeShown, this.responseLabel = this.responseManager.label, this.responseId = this.responseManager.id);
  this.endReason = a;
  this.updateEventLog();
  a !== jasmin.EVENT_ENDREASON_CANCEL && this.callbackDone();
};
jasmin.EventManager.prototype.cancelEvent = function() {
  this.endEvent(jasmin.EVENT_ENDREASON_CANCEL);
};
jasmin.EventManager.prototype.updateEventLog = function() {
  this.eventLog = {name:this.name, rt:this.rt, endReason:this.endReason, responseLabel:this.responseLabel, id:this.responseId};
};
jasmin.EventManager.prototype.getEventLog = function() {
  return this.eventLog;
};
jasmin.EventManager.prototype.clearLoggingVars = function() {
  this.responseLabel = this.endReason = this.rt = this.name = void 0;
};
void 0 === jasmin && (jasmin = function() {
});
jasmin.Loader = function(a) {
  this.requestManager = a;
};
jasmin.Loader.prototype.load = function(a, b, c) {
  this.allLoaded = b;
  this.progressCallback = void 0 == c ? function() {
  } : c;
  this.replies = {};
  this.loadTotal = this.loadCounter = 0;
  var d = this;
  this.makeRequests(a, function(a, b) {
    d.replies[a] = b;
  });
  this.progress();
  this.requestManager.flush(function() {
    d.allLoaded(d.replies);
  });
};
jasmin.Loader.prototype.makeRequests = function(a, b) {
  var c = this, d;
  for (d in a) {
    this.loadTotal++, function(a, b, d, l) {
      var h, k;
      switch(b) {
        case "js":
          h = jasmin.REQUEST_MANAGER_TYPE_AJAX;
          k = {url:d, dataType:"script"};
          break;
        case "css":
          h = jasmin.REQUEST_MANAGER_TYPE_AJAX;
          k = {url:d, dataType:"text"};
          break;
        case "img":
          h = jasmin.REQUEST_MANAGER_TYPE_IMG;
          k = d;
          break;
        default:
          h = jasmin.REQUEST_MANAGER_TYPE_AJAX, k = {url:d, dataType:b};
      }
      c.requestManager.request(h, k, function(h) {
        "css" === b && $('<link rel="stylesheet" type="text/css" href="' + d + '" />').appendTo("head");
        l(a, h);
        c.loadCounter++;
        c.progress();
      });
    }(d, a[d][0], a[d][1], b);
  }
};
jasmin.Loader.prototype.progress = function() {
  this.progressCallback(Math.round(100 * this.loadCounter / this.loadTotal));
};
void 0 === jasmin && (jasmin = function() {
});
jasmin.REQUEST_MANAGER_TYPE_AJAX = 1;
jasmin.REQUEST_MANAGER_TYPE_IMG = 2;
jasmin.RequestManager = function(a, b, c, d, e, f, g) {
  this.fail = void 0 === a ? function(a) {
    alert(a);
  } : a;
  this.error = void 0 === b ? function() {
  } : b;
  this.report = void 0 === c ? function() {
  } : c;
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
jasmin.RequestManager.prototype.request = function(a, b, c, d, e) {
  var f = this.stateCounter;
  this.states[f] = {type:a, request:b, callback:c, timeout:d, retries:e, state:this.STATE_FIRST, retryCounter:0, handled:!1};
  this.stateCounter++;
  this.active && this.sendOpenRequests();
  return f;
};
jasmin.RequestManager.prototype.sendOpenRequests = function() {
  if ((this.active || this.flushing) && !this.failed) {
    var a = this.statesToSend();
    if (0 < a.length) {
      var b, c;
      for (c in a) {
        b = a[c];
        transactionId = this.transactionCounter;
        switch(this.states[b].type) {
          case jasmin.REQUEST_MANAGER_TYPE_AJAX:
            this.ajaxRequest(b, transactionId);
            break;
          case jasmin.REQUEST_MANAGER_TYPE_IMG:
            this.imgRequest(b, transactionId);
        }
        this.transactionCounter++;
        this.states[b].state = this.STATE_OPEN;
        this.states[b].retryCounter++;
        this.states[b].attemptTime = (new Date).getTime();
      }
    }
  }
};
jasmin.RequestManager.prototype.statesToSend = function() {
  var a = (new Date).getTime(), b = [], c, d;
  for (d in this.states) {
    switch(this.states[d].state) {
      case this.STATE_FIRST:
        b.push(d);
        this.report("RequestManager.statesToSend: ", "stateId " + d + ". STATE_FIRST");
        break;
      case this.STATE_OPEN:
        c = void 0 === this.states[d].timeout ? this.timeout : this.states[d].timeout, a - this.states[d].attemptTime > c && (this.report("RequestManager.statesToSend", "stateId " + d + " open and timed out"), this.states[d].state = this.STATE_FAILED);
    }
    this.states[d].state === this.STATE_FAILED && (this.states[d].retryCounter >= this.retries ? (this.report("RequestManager.statesToSend", "stateId " + d + " failed; Exceeded " + this.retries + " attempts"), this.failed || (this.failed = !0, this.fail("RequestManager: Max attempts exceeded"))) : (this.report("RequestManager.statesToSend", "stateId " + d + " added to sendList"), b.push(d)));
  }
  return b;
};
jasmin.RequestManager.prototype.ajaxRequest = function(a, b) {
  var c = this.states[a].request;
  this.report("RequestManager.ajaxRequest", "stateId = " + a + ", transactionId = " + b + ", ajaxArgs = " + JSON.stringify(c));
  var d = this, c = $.ajax(c);
  c.done(function(c, f) {
    d.report("RequestManager AJAX done", "stateId " + a + ", transactionId " + b + ", status " + f + ", received:" + JSON.stringify(c));
    d.success(a, c);
  });
  c.fail(function(c, f) {
    d.error("RequestManager AJAX fail", "stateId " + a + ", transactionId " + b + ", status " + f + ", received:" + JSON.stringify(c));
  });
};
jasmin.RequestManager.prototype.imgRequest = function(a, b) {
  var c = this.states[a].request;
  this.report("RequestManager.imgRequest", "stateId = " + a + ", transactionId = " + b + ", url = " + JSON.stringify(c));
  var d = this;
  this.states[a].reply = $("<img>").attr("src", c).load(function() {
    d.report("RequestManager img load", "stateId " + a + ", transactionId " + b);
    d.success(a, d.states[a].reply);
  }).error(function() {
    d.error("RequestManager img error", "stateId " + a + ", transactionId " + b);
  });
};
jasmin.RequestManager.prototype.success = function(a, b) {
  if (void 0 !== this.states[a] && !this.states[a].handled) {
    this.states[a].handled = !0;
    if (void 0 !== this.states[a].callback) {
      try {
        this.states[a].callback(b);
      } catch (c) {
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
jasmin.POINTER_EVENTS = {vmouse:{down:"vmousedown", up:"vmouseup"}, mouse:{down:"mousedown", up:"mouseup"}, touch:{down:"touchstart", up:"touchend"}};
jasmin.ResponseManager = function(a) {
  this.active = !1;
  this.window = a;
  var b = this;
  this.window.$(this.window.document).keydown(function(a) {
    b.response("keydown", a);
  });
  this.window.$(this.window.document).keyup(function(a) {
    b.response("keyup", a);
  });
  this.pointerDeviceEventsList = [];
  for (var c in jasmin.POINTER_EVENTS) {
    for (var d in jasmin.POINTER_EVENTS[c]) {
      this.pointerDeviceEventsList.push(jasmin.POINTER_EVENTS[c][d]);
    }
  }
};
jasmin.ResponseManager.prototype.activate = function(a, b, c) {
  this.activeResponses = a;
  this.callbackResponse = b;
  this.name = void 0 === c ? "noname" : c;
  this.active = !0;
  this.clearLoggingVars();
  var d = this, e;
  for (e in this.pointerDeviceEventsList) {
    if (a = this.pointerDeviceEventsList[e], void 0 !== this.activeResponses[a]) {
      if ("all" === this.activeResponses[a].type) {
        var f = a;
        this.window.$(this.window.document).bind(a, "all", function(a) {
          d.response(f, a, "all", void 0);
        });
      }
      if (void 0 !== this.activeResponses[a].buttons) {
        for (var g in this.activeResponses[a].buttons) {
          b = function(a, b, c) {
            $(c).bind(a, b, function(e) {
              d.response(a, e, c, b);
            });
          }, b(a, this.activeResponses[a].buttons[g], g);
        }
      }
    }
  }
};
jasmin.ResponseManager.prototype.response = function(a, b, c, d) {
  this.active && this.parseResponse(a, b, c, d) && (b.stopPropagation(), b.preventDefault(), this.updateResponseLog(), this.callbackResponse());
};
jasmin.ResponseManager.prototype.parseResponse = function(a, b, c, d) {
  var e = window.performance.now(), f = !1;
  if (void 0 !== this.activeResponses[a]) {
    if ("keydown" === a || "keyup" === a) {
      c = b.which, void 0 !== this.activeResponses[a].buttons && void 0 !== this.activeResponses[a].buttons[b.which] && (d = this.activeResponses[a].buttons[c]), "all" === this.activeResponses[a].type ? f = !0 : void 0 !== d && (f = !0);
    }
    -1 !== this.pointerDeviceEventsList.indexOf(a) && (f = !0);
  }
  this.critical = f;
  this.mode = a;
  this.id = c;
  this.label = d;
  this.time = e;
  return f;
};
jasmin.ResponseManager.prototype.deactivate = function() {
  this.active = !1;
  this.updateResponseLog();
  if (void 0 !== this.activeResponses) {
    var a, b;
    for (b in this.pointerDeviceEventsList) {
      if (a = this.pointerDeviceEventsList[b], void 0 !== this.activeResponses[a]) {
        "all" === this.activeResponses[a].type && this.window.$(this.window.document).unbind(a);
        for (var c in this.activeResponses[a].buttons) {
          $(c).unbind(a);
        }
      }
    }
  }
};
jasmin.ResponseManager.prototype.updateResponseLog = function() {
  this.responseLog = {na:this.name, cr:this.critical, mo:this.mode, id:this.id, la:this.label, ti:this.time};
};
jasmin.ResponseManager.prototype.getResponseLog = function() {
  return this.responseLog;
};
jasmin.ResponseManager.prototype.clearLoggingVars = function() {
  this.time = this.label = this.id = this.mode = this.critical = void 0;
};
void 0 === jasmin && (jasmin = function() {
});
jasmin.ScalableCanvas = function(a, b, c) {
  this.target = a;
  this.aspectRatio = b;
  this.rescaleInterval = void 0 === c ? 1E3 : c;
  this.nodes = {};
  this.scalables = {};
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
jasmin.ScalableCanvas.prototype.addSprite = function(a, b, c) {
  b.css("position", "absolute");
  this.target.append(b);
  this.nodes[a] = b;
  this.scalables[a] = c;
};
jasmin.ScalableCanvas.prototype.addSprites = function(a) {
  for (var b in a) {
    this.addSprite(b, a[b].node, a[b].scale);
  }
};
jasmin.ScalableCanvas.prototype.getSprite = function(a) {
  return this.nodes[a];
};
jasmin.ScalableCanvas.prototype.rescale = function(a) {
  var b = window.innerWidth, c = window.innerHeight;
  if (void 0 !== a || this.lastWidth !== b || this.lastHeight !== c) {
    this.lastWidth = b;
    this.lastHeight = c;
    this.offsetTop = this.offsetLeft = 0;
    b / c > this.aspectRatio ? (this.scale = c, this.offsetLeft = (b - this.scale * this.aspectRatio) / 2) : (this.scale = b / this.aspectRatio, this.offsetTop = (c - this.scale) / 2);
    for (var d in this.nodes) {
      this.rescaleSprite(d);
    }
  }
};
jasmin.ScalableCanvas.prototype.rescaleSprite = function(a) {
  var b = {}, c, d;
  for (d in this.scalables[a]) {
    switch(d) {
      case "left":
        c = this.offsetLeft;
        break;
      case "top":
        c = this.offsetTop;
        break;
      default:
        c = 0;
    }
    c = this.scalables[a][d] * this.scale + c;
    if ("left" === d || "top" === d || "width" === d || "height" === d) {
      c = Math.floor(c);
    }
    b[d] = c;
  }
  this.nodes[a].css(b);
};
convertFileToTranslations = function(a) {
  a = a.split("\n");
  var b = rowToArray(a[0]), c = searchStringInArray("term", b), b = searchStringInArray("value", b);
  -1 == c && alert("Error: No terms found; no column in translations has the name 'term'");
  -1 == b && alert("Error: No translations found; no column in translations has the name 'value'");
  for (var d, e = {}, f = 1;f < a.length;f++) {
    d = rowToArray(a[f]), 1 != d.length && (e[d[c]] = d[b]);
  }
  return e;
};
jasmin.ScalableCanvas.prototype.extend = function(a, b) {
  for (var c in b) {
    b.hasOwnProperty(c) && (a[c] = b[c]);
  }
  return a;
};
jasmin.ScalableCanvas.prototype.spritesFromJSON = function(a, b) {
  var c = {}, d, e;
  for (e in a) {
    d = {}, d.node = $(a[e].type).attr(a[e].attr).css(a[e].css), d.scale = a[e].scale, void 0 !== a[e].children && this.spritesFromJSON(a[e].children, d), void 0 === b ? c[e] = d : b.node.append(d.node);
  }
  return c;
};
void 0 === jasmin && (jasmin = function() {
});
jasmin.Slideshow = function(a, b, c, d, e) {
  this.eventManager = b;
  this.target = a;
  this.activeResponses = c;
  this.buttonTexts = d;
  this.buttonDelay = void 0 === e ? 0 : e;
};
jasmin.Slideshow.prototype.show = function(a, b) {
  this.slides = a;
  this.callbackDone = b;
  this.slideCounter = 0;
  this.slideFurthest = -1;
  this.showSlide();
};
jasmin.Slideshow.prototype.showSlide = function() {
  if (this.slideCounter >= this.slides.length) {
    this.callbackDone();
  } else {
    if (0 === this.buttonDelay) {
      this.showButtons();
    } else {
      if (this.slideFurthest >= this.slideCounter) {
        this.showButtons();
      } else {
        this.slideFurthest = this.slideCounter;
        var a = this.slides[this.slideCounter], b = this;
        this.eventManager.startEvent(this.buttonDelay, function() {
          b.target.html(a);
        }, function() {
          b.showButtons();
        }, {}, "slide_nobutton_" + +b.slideCounter);
      }
    }
  }
};
jasmin.Slideshow.prototype.showButtons = function() {
  var a = this.slides[this.slideCounter];
  void 0 !== this.buttonTexts && (a += "<br /><br />" + (1 === this.slides.length ? this.buttonTexts.only : this.slideCounter === this.slides.length - 1 ? this.buttonTexts.last : 0 === this.slideCounter ? this.buttonTexts.first : this.buttonTexts.middle));
  var b = this;
  this.eventManager.startEvent(-1, function() {
    b.target.html(a);
  }, function() {
    b.response();
  }, this.activeResponses, "slide_nobutton_" + +b.slideCounter);
};
jasmin.Slideshow.prototype.response = function() {
  var a = eventManager.responseLabel;
  "next" === a && this.slideCounter++;
  "previous" === a && 0 < this.slideCounter && this.slideCounter--;
  this.showSlide();
};
void 0 === jasmin && (jasmin = function() {
});
jasmin.Statistics = function() {
};
jasmin.Statistics.rep = function(a, b) {
  for (var c = [], d = 0;d < b;d += 1) {
    c.push(a);
  }
  return c;
};
jasmin.Statistics.seq = function(a, b, c, d) {
  c = void 0 === c ? 1 : c;
  d = void 0 === d ? 1 : d;
  for (var e = [], f;a <= b;a += c) {
    for (f = 0;f < d;f += 1) {
      e.push(a);
    }
  }
  return e;
};
jasmin.Statistics.fisherYates = function(a) {
  for (var b = a.length, c, d;b;) {
    d = Math.floor(Math.random() * b--), c = a[b], a[b] = a[d], a[d] = c;
  }
  return a;
};
jasmin.Statistics.randomInt = function(a, b) {
  var c = Math.random();
  return Math.floor(a + c * (b - a + 1));
};
jasmin.Statistics.repetitions = function(a, b, c) {
  if (2 > b) {
    return!0;
  }
  if (a.length < b) {
    return!1;
  }
  var d = 1, e = a[0], f, g;
  for (f = 1;f < a.length;f++) {
    void 0 === c ? g = a[f] : (e = e[c], g = a[f][c]);
    JSON.stringify(e) === JSON.stringify(g) ? d++ : d = 1;
    if (d >= b) {
      return!0;
    }
    e = a[f];
  }
  return!1;
};
void 0 === jasmin && (jasmin = function() {
});
(function() {
  for (var a = 0, b = ["ms", "moz", "webkit", "o"], c = 0;c < b.length && !window.requestAnimationFrame;++c) {
    window.requestAnimationFrame = window[b[c] + "RequestAnimationFrame"], window.cancelAnimationFrame = window[b[c] + "CancelAnimationFrame"] || window[b[c] + "CancelRequestAnimationFrame"];
  }
  window.requestAnimationFrame || (window.requestAnimationFrame = function(b) {
    var c = (new Date).getTime(), f = Math.max(0, 16 - (c - a)), g = window.setTimeout(function() {
      b(c + f);
    }, f);
    a = c + f;
    return g;
  });
  window.cancelAnimationFrame || (window.cancelAnimationFrame = function(a) {
    clearTimeout(a);
  });
})();
jasmin.SYNC_TIMER_NOT_SYNCED = 0;
jasmin.SYNC_TIMER_WAITING = 1;
jasmin.SYNC_TIMER_REQUESTED = 2;
jasmin.SYNC_TIMER_DRAWN = 3;
jasmin.SYNC_TIMER_SHOWN = 4;
jasmin.SyncTimer = function() {
  this.report = void 0 === report ? function() {
  } : report;
  this.state = jasmin.SYNC_TIMER_NOT_SYNCED;
  this.synchronousCallback = !1;
};
jasmin.SyncTimer.prototype.clearLoggingVars = function() {
  this.canceled = this.timeStopped = this.timeShown = this.timeDrawn = this.timeRequested = void 0;
};
jasmin.SyncTimer.prototype.sync = function(a) {
  this.callbackDone = a;
  var b = this;
  window.requestAnimationFrame(function() {
    b.refreshFirst();
  });
};
jasmin.SyncTimer.prototype.refreshFirst = function() {
  this.frameNow = window.performance.now();
  var a = this;
  window.requestAnimationFrame(function() {
    a.name = "sync";
    a.state = jasmin.SYNC_TIMER_SHOWN;
    a.timeToErase = window.performance.now();
    a.refresh();
  });
};
jasmin.SyncTimer.prototype.refresh = function() {
  this.framePrev = this.frameNow;
  this.frameNow = window.performance.now();
  this.frameDur = this.frameNow - this.framePrev;
  switch(this.state) {
    case jasmin.SYNC_TIMER_REQUESTED:
      this.callbackDraw();
      this.timeDrawnNew = window.performance.now();
      this.state = jasmin.SYNC_TIMER_DRAWN;
      break;
    case jasmin.SYNC_TIMER_DRAWN:
      this.timeShownNew = window.performance.now(), this.realized = this.timeShownNew - this.timeShown, this.updateTimeoutLog(), this.timeRequested = this.timeRequestedNew, this.timeDrawn = this.timeDrawnNew, this.timeShown = this.timeShownNew, this.timeout = this.timeoutNew, this.name = this.nameNew, -1 !== this.timeout && (this.timeToErase = this.timeShown + this.timeout), this.state = jasmin.SYNC_TIMER_SHOWN;
    case jasmin.SYNC_TIMER_SHOWN:
      -1 !== this.timeout && this.frameNow > this.timeToErase - 1.5 * this.frameDur && (this.timeStopped = window.performance.now(), this.canceled = !1, this.state = jasmin.SYNC_TIMER_WAITING, this.synchronousCallback = !0, this.callbackDone(), this.synchronousCallback = !1);
  }
  var a = this;
  window.requestAnimationFrame(function() {
    a.refresh();
  });
};
jasmin.SyncTimer.prototype.setTimeout = function(a, b, c, d) {
  this.state === jasmin.SYNC_TIMER_NOT_SYNCED && alert("SyncTimer.setTimeout called but state == NOT_SYNCED; call sync first");
  this.timeRequestedNew = window.performance.now();
  this.timeoutNew = a;
  this.callbackDraw = b;
  this.callbackDone = c;
  this.nameNew = void 0 === d ? "noname" : d;
  this.synchronousCallback ? (this.timeDrawnNew = this.timeRequestedNew, this.callbackDraw(), this.state = jasmin.SYNC_TIMER_DRAWN) : this.state = jasmin.SYNC_TIMER_REQUESTED;
};
jasmin.SyncTimer.prototype.cancelTimeout = function() {
  this.timeStopped = window.performance.now();
  this.realized = this.timeStopped - this.timeShown;
  this.canceled = !0;
  this.state = jasmin.SYNC_TIMER_WAITING;
};
jasmin.SyncTimer.prototype.round = function(a, b) {
  return Math.round(a * b) / b;
};
jasmin.SyncTimer.prototype.updateTimeoutLog = function() {
  this.timeoutLog = {na:this.name, tr:this.round(this.timeRequested, 1E3), td:this.round(this.timeDrawn, 1E3), ts:this.round(this.timeShown, 1E3), tt:this.round(this.timeStopped, 1E3), ca:this.canceled, ti:this.round(this.timeout, 1E3), re:this.round(this.realized, 1E3)};
};
jasmin.SyncTimer.prototype.getPrevTimeoutLog = function() {
  return this.timeoutLog;
};
void 0 === jasmin && (jasmin = function() {
});
jasmin.TableLogger = function(a, b, c) {
  this.columns = a;
  this.fail = b;
  this.na = c;
  this.clearLogs();
};
jasmin.TableLogger.prototype.clearLogs = function() {
  this.logs = [];
};
jasmin.TableLogger.prototype.log = function(a) {
  if (void 0 !== this.fail) {
    for (var b in a) {
      -1 === this.columns.indexOf(b) && this.fail("TableLogger.log: Column " + b + " in logMe not found in this.columns");
    }
  }
  this.logs.push(a);
};
jasmin.TableLogger.prototype.getLogs = function(a) {
  if (a) {
    return this.logs;
  }
  a = [];
  var b, c, d;
  c = [];
  for (b = 0;b < this.columns.length;b++) {
    c.push(this.columns[b]);
  }
  a.push(c);
  for (var e = 0;e < this.logs.length;e++) {
    c = [];
    for (b = 0;b < this.columns.length;b++) {
      d = this.logs[e][this.columns[b]], c.push(void 0 === d ? this.na : d);
    }
    a.push(c);
  }
  return a;
};
void 0 === jasmin && (jasmin = function() {
});
jasmin.Translator = function() {
  this.translations = {};
  this.honorific = void 0;
  this.callbacks = {};
};
jasmin.Translator.prototype.extend = function(a, b) {
  for (var c in b) {
    b.hasOwnProperty(c) && (a[c] = b[c]);
  }
  return a;
};
jasmin.Translator.prototype.setHonorific = function(a) {
  this.honorific = a;
};
jasmin.Translator.prototype.addTranslations = function(a) {
  this.translations = this.extend(this.translations, a);
};
jasmin.Translator.prototype.setCallback = function(a, b) {
  this.callbacks[a] = b;
};
jasmin.Translator.prototype.translateTerm = function(a, b) {
  b = void 0 === b ? !0 : b;
  if (void 0 !== this.callbacks[a]) {
    return this.translate(this.callbacks[a](), b);
  }
  var c;
  void 0 !== this.honorific && (c = this.translations[this.honorific + "_" + a]);
  void 0 === c && (c = this.translations[a]);
  return void 0 === c ? b ? "!" + a + "!" : void 0 : this.translate(c, b);
};
jasmin.Translator.prototype.translate = function(a, b) {
  for (var c = new RegExp(/[#]\[+[A-Za-z0-9-_ ]+?\]/), d, e = !0;null !== e;) {
    e = c.exec(a), null !== e && (d = new RegExp(/[A-Za-z0-9-_ ]+/g), d = d.exec(e), d = this.translateTerm(d), a = a.replace(c, d));
  }
  return a;
};
void 0 === window.performance && (window.performance = {});
void 0 === window.performance.now && (window.performance.now = function() {
  return(new Date).getTime();
});
