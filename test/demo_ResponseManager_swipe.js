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
var dragThresholdX = 0.4;
var dragging = false;
var thresholdExceeded = false;
var initialCoordinates = {"left" : 0.78, "top": 0.48};

// Called on page load
load = function () {
  getScripts(
    [
      pathExt + "jquery.mobile-1.4.5.js",
      pathSrc + "polyfills.js",
      pathSrc + "ResponseManager.js",
      pathSrc + "ScalableCanvas.js"
    ],
    setupDemo
    );
};

// Initialise pointer fields and create eventManager
setupDemo = function () {
  sprites = {
    "background": {
      "node":
        $("<div>").css({
        "z-index": 1,
        "background-color": "#000000",
        "opacity": 1,
        "position": "absolute"
      }),
      "scale": {
        "width": 1.6,
        "height": 1,
        "left": 0,
        "top": 0
      }
    },
    "stimulus": {
      "node":
        $("<div>").attr({
          "id": "stimulus"
        }).css({
        "z-index": 2,
        "background-color": "grey",
        "position": "absolute"
      }).css({
        "vertical-align": "middle",
        "text-align": "center",
        "display": "table-cell"
      }),
      "scale": {
        "width": .04,
        "height": .04,
        "left": .78,
        "top": .48
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
  $(document.body).css({
    "width"  : "100%",
    "height" : "100%",
    "margin" : "0px"
  });
  canvas = new jasmin.ScalableCanvas(
    $(document.body),
    1.6                
  );
  canvas.addSprites(sprites);
  canvas.start();
  sprites["background"]["node"].show();
  sprites["stimulus"]["node"].show();

  // all buttons managed by this ResponseManager instance
  var buttonDefinitions = [
    {
      "label": "down",
      "modalities": [
        {"type": "mousedown", "id": "#stimulus"},
        {"type": "touchstart", "id": "#stimulus"}
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
        {"type": "mouseover", "id": "#stimulus"}
      ]
    },
    {
      "label": "out",
      "modalities": [
        {"type": "mouseout", "id": "#stimulus"}
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
  if (label === "over") {
    $("#stimulus").css({"background-color": "blue"});
  }
  if (!dragging && label === "out") {
    $("#stimulus").css({"background-color": "grey"});
  }
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
    // Reposition stimulus
    var canvasCoordinates = canvas.mapToCanvas(mouseX - dragX, mouseY - dragY);
    sprites["stimulus"]["scale"]["left"] = canvasCoordinates["x"];
    sprites["stimulus"]["scale"]["top"] = canvasCoordinates["y"];
    canvas.rescaleSprite(sprites["stimulus"]);
    // Determine drag distance in canvas metrics
    canvasCoordinates = canvas.mapToCanvas(mouseX, mouseY);
    var deltaX = canvasCoordinates["x"] - startCoordinates["x"];
    var deltaY = canvasCoordinates["y"] - startCoordinates["y"];
    var response = "none";
    if (deltaX < -0.4) {
      response = "left";
    } else if (deltaX > 0.4) {
      response = "right";      
    }
    thresholdExceeded = response != "none";
    if (thresholdExceeded) {
      $("#stimulus").css({"background-color": "green"})
      console.log(response);
    }
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
    dragX = responseLog["x"] - $("#stimulus").offset()["left"];
    dragY = responseLog["y"] - $("#stimulus").offset()["top"];
    mouseX = responseLog["x"];
    mouseY = responseLog["y"];
    startCoordinates = canvas.mapToCanvas(mouseX, mouseY);
    dragging = true;
    // On up, stop dragging  
  } else {
    tresholdExceeded = false;
    dragging = false;
    sprites["stimulus"]["scale"]["left"] = initialCoordinates["left"];
    sprites["stimulus"]["scale"]["top"] = initialCoordinates["top"];
    canvas.rescaleSprite(sprites["stimulus"]);
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

// 'down' response made
upDone = function (eventData) {
  // Deactivate; stop registering responses
  responseManager.deactivate();
  // Report response data
  console.log("Up response registered, responseLog:");
  var responseLog = responseManager.getResponseLog();
  console.log(responseLog);

  // Make buttons green again
  $("#stimulus").css({"background-color": "green"});
  $("#stimulus_right").css({"background-color": "green"});

  downStart();
  // Detach event handlers
  // console.log("Detaching ResponseManager");    
  // responseManager.detach();
};
