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
if( jasmin === undefined ) { var jasmin = function() {}; }

/**
 * Provides various statistics functions, for instance for 
 * randomizations, permutations, means, and standard errors.
 * @constructor
 */
jasmin.Statistics = function() {};

/**
 * Repeats value x rep times
 * @param {Object} x    Value to repeat
 * @param {int}    reps number of times to repeat value
 * @public
 */
jasmin.Statistics.rep = function( x, reps ) {
    var result = [];
    for( var i = 0; i < reps; i += 1 )
    {
        result.push( x );
    }
    return result;
};

/**
 * Create a sequence of numbers running from from, to to with increments of of step
 * @param {int}  from      Starting value
 * @param {int}  to        Ending value
 * @param {int}  step      Amount to increment/decrement value each step
 * @param {int}  reps      Number of times to repeat value in output each step
 * @public
 */
jasmin.Statistics.seq = function( from, to, step, reps ) {
    step = step === undefined? 1 : step;
    reps = reps === undefined? 1 : reps;
    
    var result = [], i, j;
    for( i = from; i <= to; i += step )
    {
        for( var j = 0; j < reps; j += 1 )
        {        
            result.push( i );
        }
    }
    return result;
};

/**
 * Returns array shuffled following the Fisher-Yates shuffle
 * @param {Array} array Array to shuffle
 * @public
 */
jasmin.Statistics.fisherYates = function( array ) {
  var m = array.length, t, i;

  // While there remain elements to shuffleâ€¦
  while( m ) {

    // Pick a remaining elementâ€¦
    i = Math.floor( Math.random() * m-- );

    // And swap it with the current element.
    t = array[m];
    array[m] = array[i];
    array[i] = t;
  }

  return array;
};

/**
 * Check on repeating elements in array. The elements of array may be primitive types
 * (String, int, float, bool), indexed arrays or associative arrays. However, array
 * needs to be able to be expressed in JSON.
 * @param {Array}  array      Array to check
 * @param {int}    repLength  Number of elements forming one repetition (e.g. "888" forms a repetition with 3 elements)
 * @param {String} index      If defined, the elements of array are themselves indexed or associative arrays; as element, as value, use the value indexed by index in element array
 * @returns true if array contains a repetition of repLength or longer
 */
jasmin.Statistics.repetitions = function( array, repLength, index ) {
    // repLength < 2? return true
    if( repLength < 2  ) {
        return true;
    }
    
    // Less elements in array than repLength? return false
    if( array.length < repLength ) {
        return false;
    }

    // Count repetitions via repCounter
    var repCounter  = 1;
    var prevElement = array[0];
    var i, left, right;
    
    // Keep comparing current element with previous element
    for( var i = 1; i < array.length; i++ )
    {
        // Get left and right values to compare
        if( index === undefined )
        {
            left  = prevElement;
            right = array[ i ];
        } else {
            left  = prevElement[ index ];
            right = array[ i ][ index ];
        }
        
        // Left and right are equal? Increase counter, else reset
        if( JSON.stringify( left ) === JSON.stringify( right) )
        {
            repCounter++;
        } else {
            repCounter = 1;
        }
        
        // repCounter at length or more? return true
        if( repCounter >= repLength )
        {
            return true;
        }
        
        // Make current element previous element
        prevElement = array[i];
    }
    
    // Still here? No reps found
    return false;
};

