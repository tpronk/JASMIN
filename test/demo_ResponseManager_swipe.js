// Copyright 2014, Thomas Pronk
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License. 

// ****************
// *** demo_ResponseManager_swipe
//
// Demonstrates how the ResponseManager can be used for dragging and dropping

// Name of this demo
var demoName = "demo_ResponseManager_swipe.js";
var canvas, sprites;
var startCoordinates;
var dragThresholdX = 0.2;
var dragging = false;
var thresholdExceeded = false;
var initialCoordinates = {"left" : 0.78, "top": 0.48};

// Called on page load
load = function () {
  getScripts(
    [
      pathExt + "jquery.mobile-1.4.5.js",
      pathExt + "TweenMax-1.19.10.js",
      pathSrc + "polyfills.js",
      pathSrc + "ResponseManager.js",
      pathSrc + "ScalableCanvas.js"
    ],
    setupDemo
    );
};

// Initialise pointer fields and create eventManager
setupDemo = function () {
  var spritesJSON = {
    "background": {
      "type": "<div>",
      "attr": {},
      "css": {
        "z-index": 1,
        "background-color": "#000000",
        "position": "absolute"
      },
      "scale": {
        "width": 1.6,
        "height": 1,
        "left": 0,
        "top": 0
      }
    },
    "cursor": {
      "type": "<div>",
      "attr": {
        "id": "cursor"
      },
      "css": {
        "z-index": 10,
        "background-color": "blue",
        "position": "absolute"
      },
      "scale": {
        "width": .04,
        "height": .04,
        "left": .78,
        "top": .48
      }
    },
    "threshold": {
      "type": "<div>",
      "attr": {},
      "css": {
        "z-index": 2,
        "background-color": "grey",
        "position": "absolute"
      },
      "scale": {
        "width": 2 * dragThresholdX,
        "height": 1,
        "left": 0.8 - dragThresholdX,
        "top": 0
      }
    },
    "stimulus_container": {
      "type": "<div>",
      "attr": {},
      "css": {
        "z-index": 1,
        "background-color": "transparent",
        "position": "absolute",
        "overflow": "hidden"
      },
      "scale": {
        "width": 1.6,
        "height": 1,
        "left": 0,
        "top": 0
      },
      "children": {
        "stimulus": {
          "type": "<div>",
          "attr": {
            "id": "stimulus"
          },
          "css": {
            "z-index": 3,
            "background-color": "yellow",
            "position": "relative"
          },
          "scale": {
            "width": .8,
            "height": .8,
            "left": .4,
            "top": .1
          }
        }
      }
    }
  };
  
  $( "#form_here" ).hide();
  $( "#graphics_here" ).hide();
  $( "#text_here" ).hide();
  $("html").css({
      "width"  : "100%",
      "height" : "100%",
      "margin" : "0px"        
  });
  $("html").css({
    "overflow" : "hidden"
  });
  $(document.body).css({
    "overflow" : "hidden"
  });
  
  $(document.body).css({
    "width"  : "100%",
    "height" : "100%",
    "margin" : "0px"
  });
  canvas = new jasmin.ScalableCanvas(
    $(document.body),
    1.6                
  );
console.log("UUU");
  sprites = canvas.spritesFromJSON(spritesJSON);
  console.log("XXXXX");
  canvas.addSprites(sprites);
  canvas.start();
  sprites["background"]["node"].show();
  sprites["cursor"]["node"].show();
  sprites["threshold"]["node"].show();
  sprites["stimulus_container"]["node"].show();

  // all buttons managed by this ResponseManager instance
  var buttonDefinitions = [
    {
      "label": "down",
      "modalities": [
        {"type": "mousedown", "id": "all"},
        {"type": "touchstart", "id": "all"}
      ]
    },
    {
      "label": "up",
      "modalities": [
        {"type": "mouseup", "id": "all"},
        {"type": "touchend", "id": "all"}
      ]
    },
    {
      "label": "over",
      "modalities": [
        {"type": "mouseover", "id": "#cursor"}
      ]
    },
    {
      "label": "out",
      "modalities": [
        {"type": "mouseout", "id": "#cursor"}
      ]
    }
  ];

  // Create a ResponseManager (with an override on the escape key)
  responseManager = new jasmin.ResponseManager({
    "type": "keydown",
    "id": 27,
    "callback": function () {
      alert("Pressed ESC key");
    }
  });
  // Attach event handlers
  console.log("Attaching ResponseManager");
  responseManager.attach(buttonDefinitions);

  dragging = false;
  window.requestAnimationFrame(dragAnimation);
  start();
};

// Callback for mouseover over buttons
mouseOverHandler = function (event, modality, id, label, time, x, y) {
};

// Register a 'down' response
start = function () {
  console.log("Starting an event that registers down response");
  thresholdExceeded = false;
  responseManager.activate(
    ["down", "up"], // buttonsActive
    changeDragState, // callbackResponse
    mouseOverHandler
    );
};

$(document).mousemove(function (e) {
  mouseX = e.pageX;
  mouseY = e.pageY;
});
$(document).bind("touchmove", function (e) {
  var touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
  mouseX = touch.pageX;
  mouseY = touch.pageY;
  console.log(touch);
});


dragAnimation = function () {
  if (dragging) {
    // Reposition cursor
    var canvasCoordinates = canvas.mapToCanvas(mouseX - dragX, mouseY - dragY);
    sprites["cursor"]["scale"]["left"] = canvasCoordinates["x"];
    sprites["cursor"]["scale"]["top"] = canvasCoordinates["y"];
    canvas.rescaleSprite(sprites["cursor"]);
    // Determine drag distance in canvas metrics and whether threshold is exceeded
    canvasCoordinates = canvas.mapToCanvas(mouseX, mouseY);
    var deltaX = canvasCoordinates["x"] - startCoordinates["x"];
    var deltaY = canvasCoordinates["y"] - startCoordinates["y"];
    var response = "none";
    if (deltaX < -1 * dragThresholdX) {
      response = "left";
    } else if (deltaX > dragThresholdX) {
      response = "right";      
    }
    thresholdExceeded = response != "none";
    if (thresholdExceeded) {
      $("#cursor").css({"background-color": "red"})
      console.log(response);
    } else {
      $("#cursor").css({"background-color": "green"})
    }
    // Animate stimulus
    var stimulus = sprites["stimulus_container"]["children"]["stimulus"];
    stimulus["scale"]["left"] = 0.4 + 0.8 * (deltaX / dragThresholdX);
    stimulus["node"].css({
      "opacity": 1 - Math.abs(deltaX / dragThresholdX),
      "-webkit-transform": "rotate(" + 45 * (deltaX / dragThresholdX) + "deg)", // Chrome, Safari, Opera
      "transform": "rotate(" + 45 * (deltaX / dragThresholdX) + "deg)"
    });

    canvas.rescaleSprite(stimulus);
  }
  window.requestAnimationFrame(
    function () {
      dragAnimation();
    }
  );
};

// 'down' response made
changeDragState = function (eventData) {
  var responseLog = responseManager.getResponseLog();
  console.log(responseLog);
  // On down, determine grabbing point and start dragAnimation
  if (responseLog["label"] === "down") {
    $("#cursor").css({"background-color": "green"});
    dragX = responseLog["x"] - $("#cursor").offset()["left"];
    dragY = responseLog["y"] - $("#cursor").offset()["top"];
    mouseX = responseLog["x"];
    mouseY = responseLog["y"];
    startCoordinates = canvas.mapToCanvas(mouseX, mouseY);
    dragging = true;
    // On up, stop dragging  
  } else {
    $("#cursor").css({"background-color": "blue"});
    tresholdExceeded = false;
    dragging = false;
    // Reset cursor
    sprites["cursor"]["scale"]["left"] = initialCoordinates["left"];
    sprites["cursor"]["scale"]["top"] = initialCoordinates["top"];
    canvas.rescaleSprite(sprites["cursor"]);
    // Reset stimulus
    var stimulus = sprites["stimulus_container"]["children"]["stimulus"];
    stimulus["scale"]["left"] = 0.4;
    canvas.rescaleSprite(stimulus);
    stimulus["node"].css({
      "opacity": 1,
      "-webkit-transform": "rotate(0deg)", // Chrome, Safari, Opera
      "transform": "rotate(0deg)"
    });
  }
};

// Register an 'up' response
upStart = function () {
  console.log("Starting an event that registers up response");
  responseManager.activate(
    ["left_up", "right_up", "all_up"], // buttonsActive
    upDone                     // callbackResponse
    );
};

// 'up' response made. NEVER CALLED???
upDone = function (eventData) {
  console.log("upDone");
  
  // Deactivate; stop registering responses
  responseManager.deactivate();
  // Report response data
  console.log("Up response registered, responseLog:");
  var responseLog = responseManager.getResponseLog();
  console.log(responseLog);

  // Make buttons blueagain
  $("#cursor").css({"background-color": "blue"});
  downStart();
  // Detach event handlers
  // console.log("Detaching ResponseManager");    
  // responseManager.detach();
};
