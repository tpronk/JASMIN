//Copyright 2014, Thomas Pronk
//
//Licensed under the Apache License, Version 2.0 (the "License");
//you may not use this file except in compliance with the License.
//You may obtain a copy of the License at
//
//http://www.apache.org/licenses/LICENSE-2.0
//
//Unless required by applicable law or agreed to in writing, software
//distributed under the License is distributed on an "AS IS" BASIS,
//WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//See the License for the specific language governing permissions and
//limitations under the License. 

/** 
 * Init JASMIN namespace
 * @private
 */
if (jasmin === undefined) { var jasmin = function() {}; }

/**
 * ResponseManager manages keyboard, touch, and mouse responses.
 * @param {Object} override This response overrides normal ResponseManager behavior by calling the corresponding callback regardless of the state of the ResponseManager
 * @requires jasmin_ext/jquery.js
 * @requires jasmin_ext/jquery.mobile.js
 * @requires window.performance.now
 * @constructor
 */
jasmin.ResponseManager = function(override) {
   this.override = override;
   // Initial state
   this.active = false;  
   this.buttonsActive = undefined;
   this.callbackResponse = undefined;
   this.responseData = undefined;
   
   // Gamepad handling
   this.gamepadEnabled = false;
   this.gamepadAxes = [];
   this.gamepadAxisLimits = [];

   // Gyroscope handling
   this.gyroscopeEnabled = false;
   this.gyroscopeAxisLimits = [];

   // Speech handling
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
   this.pollingRequest = requestAnimationFrame(
      function() { self.polling(); }
   );   
};

/**
 * Checks gyroscope. If anything changed, call eventCallback and check whether any of the axis limits were exceeded. 
 * If so, call response
 */
jasmin.ResponseManager.prototype.pollGyroscope = function (data, available) {
   var availabilityMap = {
      "do" : {
         "alpha" : "deviceOrientationAvailable",
         "beta"  : "deviceOrientationAvailable",
         "gamma" : "deviceOrientationAvailable",
      },
      "dm"    : {
         "x"     : "accelerationAvailable",
         "y"     : "accelerationAvailable",
         "z"     : "accelerationAvailable",
         "gx"    : "accelerationIncludingGravityAvailable",
         "gy"    : "accelerationIncludingGravityAvailable",
         "gz"    : "accelerationIncludingGravityAvailable",
         "alpha" : "rotationRate",
         "beta"  : "rotationRate",
         "gamma" : "rotationRate",
      }
   };
   for (var i = 0; i < this.gyroscopeAxisLimits.length; i++) {
      var limit = this.gyroscopeAxisLimits[i];
      var isAvailable = available[availabilityMap[limit["id"]][limit["id2"]]];
      var value;
      if (isAvailable) {
         //console.log(limit);
         value = data[limit["id"]][limit["id2"]];
         if ((limit["max"] >= limit["min"] && (value >= limit["min"] && value <= limit["max"])) ||
             (limit["min"] >  limit["max"] && (value >= limit["min"] || value <= limit["max"]))
         ) {
            this.response(
               "gyroscopechange", 
               "gyroscope", 
               i, 
               limit["label"], 
               window.performance.now(), 
               value                   
            );
         }
      }
   }
};

/**
 * Checks gamepad axes for changes. If anything changed, call eventCallback and check whether any of the axis limits were exceeded. 
 * If so, call response
 */
jasmin.ResponseManager.prototype.pollGamepad = function () {
   this.gamepad = undefined;
   var gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : []);
   for (var i = 0; i < gamepads.length && this.gamepad === undefined; i++) {
      if (gamepads[i] !== null) {
         this.gamepad = gamepads[i];
      }
   }
   if (this.gamepad !== undefined) {
      var i, j;
      for (i = 0; i < this.gamepadAxes.length && i < this.gamepadAxisLimits.length; i++) {
         if (this.gamepadAxes[i] !== this.gamepad.axes[i]) {
            this.gamepadAxes[i] = this.gamepad.axes[i];
            if (this.active && this.callbackEvent !== undefined) {
               this.callbackEvent(
                  "axischange", 
                  "gamepadaxis", 
                  i, 
                  undefined, 
                  window.performance.now(), 
                  this.gamepadAxes[i]
               );
            }
            for (j = 0; j < this.gamepadAxisLimits[i].length; j++) {
               // If current axis i is in the min/max range gamepadAxisLimits[i][j], then call response
               if ((this.gamepadAxisLimits[i][j]["max"] >= this.gamepadAxisLimits[i][j]["min"] && this.gamepad.axes[i] >= this.gamepadAxisLimits[i][j]["min"] && this.gamepad.axes[i] <= this.gamepadAxisLimits[i][j]["max"]) ||
                   (this.gamepadAxisLimits[i][j]["min"] >  this.gamepadAxisLimits[i][j]["max"] && (this.gamepad.axes[i] >= this.gamepadAxisLimits[i][j]["min"] || this.gamepad.axes[i] <= this.gamepadAxisLimits[i][j]["max"]))
                  
               ) {
                  this.response(
                     "axischange", 
                     "gamepadaxis", 
                     i, 
                     this.gamepadAxisLimits[i][j]["label"], 
                     window.performance.now(), 
                     this.gamepadAxes[i]                     
                  );
               }
            }
         }
      }
   }   
};

/**
 * Attach event handlers 
 * @public
 * @param {Object} buttonDefinitions Responses handled by ResponseManager
 */
jasmin.ResponseManager.prototype.attach = function(buttonDefinitions) {
    this.buttonDefinitions = buttonDefinitions;
    this.bindEvents(true);
};

/**
 * Detach event handlers 
 * @public
 */
jasmin.ResponseManager.prototype.detach = function() {
    this.bindEvents(false);
    cancelAnimationFrame(this.pollingRequest);
};
    
/**
 * Bind or unbind event handlers
 * @public
 * @param {boolean} on If true, attach, if false detach
 */    
jasmin.ResponseManager.prototype.bindEvents = function(on) {    
   var self = this;    

   // attach event handler to a button, binds type, label, and id 
   var pointerCallback = function(type, id, label) {
       // if id is "all", attach to document
       var target = id !== "all"? $(id): $(window.document);
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

   // keyboardMapping maps keyboard event type and keycode to button label
   this.keyboardMapping = {
       "keyup"   : {},
       "keydown" : {}
   };

   // elements to which we already attached cancel event handlers
   var attachedCancel = [];
   // attach stopbubble to cancel events, if not done already
   var stopCancelBubble = function(id) {
       if (attachedCancel.indexOf(id) === -1) {
           attachedCancel.push(id);
           var target = id !== "all"? $(id): $(window.document);
           // cancel events; stop these in event handler
           var cancelTypes = ["vmousecancel","mousecancel","touchcancel"], cancelType_i, cancelType;
           for (cancelType_i in cancelTypes) {
               cancelType = cancelTypes[cancelType_i];
               // pointer event; attach event handler
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

   // Speech Commands
   this.speechEnabled = false;
   this.speechCommands = {};

   // 8 gamepad axes
   this.gamepadEnabled = false;
   this.gamepadAxisLimits = [];
   for (var i = 0; i < 8; i++) {
      this.gamepadAxisLimits[i] = [];
      this.gamepadAxes[i] = 0;
   }
   
   // gyroscope
   this.gyroscopeEnabled = false;
   this.gyroscopeAxisLimits = [];

   var button, button_i, modality, modality_i;
   for (button_i in this.buttonDefinitions) {
       button = this.buttonDefinitions[button_i];
       for (modality_i in button["modalities"]) {
           modality = button["modalities"][modality_i];  

           // keyboard event; add to keyboardMapping
           if (modality["type"] === "keyup" || modality["type"] === "keydown") {
              this.keyboardMapping[modality["type"]][modality["id"]] = button["label"];
           // speech event
           } else if (modality["type"] === "speech") {
              this.speechEnabled = true;
              this.speechCommands[modality["id"]] = button["label"];
           // gamepad event
           } else if (modality["type"] === "gamepadaxis") {
              this.gamepadEnabled = true;
              this.gamepadAxisLimits[modality["id"]].push({
                 "min" : modality["min"],
                 "max" : modality["max"],
                 "label" : button["label"]
              });
           // gyroscope event
           } else if (modality["type"] === "gyroscope") {
              this.gyroscopeEnabled = true;
              if(this.gyroscopeAxisLimits[modality["id"]] === undefined) {
                 this.gyroscopeAxisLimits[modality["id"]] = [];
              }
              this.gyroscopeAxisLimits.push({
                 "id" : modality["id"],
                 "id2" : modality["id2"],
                 "min" : modality["min"],
                 "max" : modality["max"],
                 "label" : button["label"]
              });           // pointer event; attach event handler               
           } else {
               pointerCallback(
                   modality["type"],
                   modality["id"],
                   button["label"]
               );                
               // Stop cancel bubble
               stopCancelBubble(modality["id"]);
           }
       }
   }

   // Start gyroscope
   var self = this;
   self.gn = new GyroNorm();
   if (this.gyroscopeEnabled) {
      self.gn.init().then(function () {
         self.gn.start(function (data) {
            self.pollGyroscope(data, self.gn.isAvailable());
         });
      });
   }
   
   // Start speech recognition
   if (this.speechEnabled) {
     this.setupSpeechRecognition(on);
   }    
   
   // Attach keyboard event handlers
   var keyboardCallback = function(type) {
       var callback = function(event) {
           var time = window.performance.now();
           self.stopBubble(event);
           var id = event.which;

           // Map keylabel via keyboardMapping
           var keyLabel = self.keyboardMapping[type][id];
           // No keylabel found? try "all" key
           keyLabel = keyLabel !== undefined? keyLabel: self.keyboardMapping[type]["all"];
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
   
   // Start polling
   var self = this;
   this.pollingRequest = requestAnimationFrame(
      function() { self.polling(); }
   );   
};

jasmin.ResponseManager.prototype.setupSpeechRecognition = function(on) {
   var self = this;
   
   if (!on && self.speechRecognition !== undefined) {
      self.speechRecognition.stop();
   }
   
   var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition;
   var SpeechGrammarList = SpeechGrammarList || webkitSpeechGrammarList;
   var SpeechRecognitionEvent = SpeechRecognitionEvent || webkitSpeechRecognitionEvent;

   self.speechRecognition = new SpeechRecognition();
   
   self.speechRecognition.continuous = false;
   self.speechRecognition.lang = 'en-US';
   //self.speechRecognition.lang = 'nl';
   self.speechRecognition.interimResults = false;
   self.speechRecognition.maxAlternatives = 1;

   self.speechRecognition.onresult = function(event) {
      var last = event.results.length - 1;
      var word = event.results[last][0].transcript;
      if (self.speechCommands[word] !== undefined) {
         self.response(
            event,
            "speech",
            undefined,
            self.speechCommands[word],
            self.soundStartTime
         );
      }
      //console.log(event.results[0][0].confidence);
   };

   self.speechRecognition.onsoundstart = function(event) {
      self.soundStartTime = window.performance.now();
   };
   self.speechRecognition.onsoundend = function(event) {
   };
   self.speechRecognition.onend = function (event) {
      self.speechRecognition.start();
   };
   self.speechRecognition.start();   
};


/**
 * ResponseManager calls callbackResponse if a response was given that
 * matches the specifications of buttonsActive
 * @public
 * @param {Array}     buttonsActive     An associative array defining responses that stop the event (if any). See <a href="../source/jasmin_demos/demo_choose.html">these demos </a> for examples.
 * @param {Function}  callbackResponse  Callback called upon a response
 * @param {Function}  callbackEvent     Function called upon each response event (a more finegrained way of processing responses without deactivating ResponseManager
 */
jasmin.ResponseManager.prototype.activate = function(
   buttonsActive,    
   callbackResponse,
   callbackEvent
) {
   this.buttonsActive    = buttonsActive;
   this.callbackResponse = callbackResponse;
   this.active           = true;
   this.callbackEvent    = callbackEvent;
};

/**
 * Every keyboard and registered touch event triggers a callback to response
 * In response we determine whether we should call callbackResponse
 * @private
 * @param {Object}    event        Event as received by JS event handler
 * @param {String}    modality     Type of response (keydown, vmouseup etc.) 
 * @param {String}    id           ID of HTMLElement or keycode
 * @param {String}    label        Button label, if any
 * @param {String}    time         Time of response in ms (via window.performance.now())
 * @param {String}    x            If pointer: pageX 
 * @param {String}    y            If pointer: pageY 
 */
jasmin.ResponseManager.prototype.response = function(event, modality, id, label, time, x, y) {
   var callCallback = false;

   // Check on callbackEvent
   if (this.active && this.callbackEvent !== undefined) {
      this.callbackEvent(event, modality, id, label, time, x, y);
   }

   // Check on override
   if (this.override !== undefined && this.override["type"] === modality && this.override["id"] === id) {
      this.override["callback"]();
   }
   
   // register response if the response was an active button
   if (this.active && this.buttonsActive !== undefined && this.buttonsActive.indexOf(label) !== -1) {
       callCallback = true;
   }

   if(callCallback) {
       // Setup responseData
       this.responseData = {
           "modality" : modality,
           "id"       : id,
           "label"    : label,
           "time"     : time,
           "x"        : x,
           "y"        : y,
           "event"    : event            
       };    

       // Do callback
       this.callbackResponse();
   }
};

/**
 * Provides response data of previous response
 * @returns {Object} response data
 * @public
 */
jasmin.ResponseManager.prototype.getResponseLog = function() {
    return this.responseData;
};

// Stop event bubbling 
jasmin.ResponseManager.prototype.stopBubble = function(event) {
    event.stopPropagation(); 
    event.preventDefault();
};

/**
 * Deactivate; don't call responseCallback on any response anymore
 * @public
 */
jasmin.ResponseManager.prototype.deactivate = function() {
    // Stop event
    this.active = false;    
};