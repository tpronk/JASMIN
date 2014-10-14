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
// 
// 
// ****************
// *** demo_Translator
//
// Demonstrates how the Translator translates terms, incorporates custom callbacks,
// and supports honorifics (such as t-form and v-form)

// Name of this demo
var demoName   = "demo_Translator.js";

// Called on page load
load = function() {
    getScripts( [
            jasminPath + "jasmin_core/Translator.js"
        ],
        translateStuff
    );
}

// Set of translations to load into the Translator, every key is a term; every
// value is the corresponding translation
var translations = {
    "intro"       : "This a Translator demo",
    "intro2"      : "Terms in translations are themselves translated, like this one: #[intro]",
    "score"       : "Congratulations; you've scored #[points] points!",
    "v_hello"     : "Hoe gaat het met u?  Co&#769;mo esta&#769;?  Comment allez-vous? Wie geht es Ihnen?",
    "t_hello"     : "Hoe gaat het met je? Co&#769;mo esta&#769;s? Comment vas-tu?     Wie geht es dir?",
    "nohonorific" : "This sentence does not differ across honorifics"
};

// Run the actual demo's
translateStuff = function() {
    // Construct new instance
    translator = new jasmin.Translator();
    
    // Loads translations into translator
    translator.addTranslations( translations );
        
    // Show a simple translation
    report( demoName, translator.translateTerm( "intro" ) );

    // Note that the result is the same as
    report( demoName, translator.translate( "#[intro]" ) );
    
    // Show that terms in translations are translated too
    report( demoName, translator.translateTerm( "intro2" ) );
    
    // Add a callback 
    translator.setCallback( "points", function() {
        return "1000";
    } );
    
    // Now "#[points]" is replaced by "1000"
    report( demoName, translator.translateTerm( "score" ) );

    // Set honorific to v-form -> v_hello is used (if available)
    translator.setHonorific( "v" );
    report( demoName, translator.translateTerm( "hello" ) );
     
    // Set honorific to t-form -> t_hello is used (if available)
    translator.setHonorific( "t" );
    report( demoName, translator.translateTerm( "hello" ) );
    
    // For nohonorific there is no t- or v-form available; just use nohonorific
    translator.setHonorific( "t" );
    report( demoName, translator.translateTerm( "nohonorific" ) );    
          
};