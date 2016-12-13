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
 * @param {Object} x    Value (or set of values) to repeat
 * @param {int}    reps Number of times to repeat value
 * @public
 */
jasmin.Statistics.rep = function( x, reps ) {
   var result = [];
   if (typeof x !== "object") {
      x = [x];
   }
   for (var i in x) {
      for (var j = 0; j < reps; j += 1) {
         result.push(x[i]);
      }
   }
   return result;
};

/**
 * Creates a sequence of length length, filled with items, such that the number
 * of occurances of each item in the sequence is as similar as possible (differs
 * at most by 1 across items)
 * @param {Array}  items    Value to repeat
 * @param {int}    length   Length of desired sequence
 * @public
 */
jasmin.Statistics.fill = function (items, length) {
   var result = [];
   var remaining = length;
   while (remaining > 0) {
      if (remaining >= items.length) {
         result = result.concat(JSON.parse(JSON.stringify(items)));
         remaining -= items.length;
      } else {
         items = jasmin.Statistics.fisherYates(items);
         for (var i = 0; i < remaining; i++) {
            result.push(JSON.parse(JSON.stringify(items[i])));
         }
         remaining = 0;
      }
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
 * Creates an array that contains all combinations of elements of two other arrays
 * @param {int}  left      One array to combine
 * @param {int}  right     Another array to combine
 * @param {int}  keyLeft   Optional. If present, elements in result from left will get this key.
 * @param {int}  keyRight  Optional. If present, elements in result from right will get this key.
 * @public
 */
jasmin.Statistics.combine = function (left, right, keyLeft, keyRight) {
   var result = [], current;
   var i, j;
   for (i = 0; i < left.length; i++) {
      for (j = 0; j < right.length; j++) {
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

/**
 * Returns array shuffled following the Fisher-Yates shuffle
 * @param {Array} array Array to shuffle
 * @public
 */
jasmin.Statistics.fisherYates = function (array) {
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
 * Returns array shuffled following the Fisher-Yates shuffle, but limiting the 
 * number of repetitions.
 * @param {Array} array Array to shuffle
 * @param {integer} repetitionCount maximum number of times a value may be repeated in in array
 * @public
 */
jasmin.Statistics.fisherYatesRestrictReps = function (array, repetitionCount) {
   var accepted = false, candidate;
   while (!accepted) {
      candidate = jasmin.Statistics.fisherYates(array);
      accepted = !jasmin.Statistics.repetitions(candidate, repetitionCount + 1);
   }
   return (candidate);
}

/**
 * Similar to jasmin.Statistics.fisherYatesRestrictReps but for applying multiple
 * repetition restrictions on an array of objects.
 * @param {Array} array Array of objects to shuffle
 * @param {object} repetitionCounts Keys represent properties of the objects contained in array, with corresponding values representing the number of times these properties may be repeated (across successive alements of array)
 * @public
 */
jasmin.Statistics.fisherYatesRestrictRepsNested = function (array, repetitionCounts) {
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
   return (candidate);
}


/**
 * Returns random int between min and max (inclusive)
 * uniform distribution
 * 
 * @param {type} min minimum value
 * @param {type} max maximum value
 * @returns {int} resulting integer
 * @author j.g.wijnen
 */

jasmin.Statistics.randomInt = function (min, max){
    var x = Math.random();
    var diff = max- min + 1;
    var r = min + x * diff;
    return Math.floor(r);
        
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

/**
 * Calculates mean of an indexed array of scores
 * @param {Array} scores Scores to calculate mean of
 * @returns mean
 */
jasmin.Statistics.mean = function( scores ) {
    var sum = 0, count = 0;
    for( var i in scores )
    {
        sum += scores[i];
        count++;
    }

    // If count === 0, mean is undefined
    if( count <= 0 )
    {
        return undefined;
    }
        
    
    return sum / count;
};

/**
 * Calculates sum of an array of scores
 * @param {Object} scores Scores to calculate sum of
 * @returns sum
 */
jasmin.Statistics.sum = function( scores ) {
    var sum = 0;
    for( var i in scores )
    {
        sum += scores[i];
    }
    return sum;
};

/**
 * Calculates unbiased estimator of sample variance (divide by n - 1)
 * @param {Array} scores Scores to calculate variance of
 * @returns variance
 */

jasmin.Statistics.variance = function( scores ) {
    var mean         = jasmin.Statistics.mean( scores );
    var sumOfSquares = 0, count = 0;
    for( var i in scores )
    {
        sumOfSquares += Math.pow( scores[i] - mean, 2 );
        count++;
    }
    
    // If count <= 1, variance is zero
    if( count <= 1 )
    {
        return 0;
    }
    
    return sumOfSquares / ( count - 1 );
};

/**
 * Calculates standard deviation of an indexed array of scores (based on 
 * unbiased estimator of sample variance)
 * @param {Array} scores Scores to calculate standard deviation of
 * @returns standard deviation
 */
jasmin.Statistics.sd = function( scores ) {
    return Math.sqrt( jasmin.Statistics.variance( scores ) );
};


/**
 * Performs a Z transformation on supplied scores 
 * @param {Array} scores Scores to transform
 * @param {int}   mean   Z mean
 * @param {int}   sd     Z sd
 * @returns Z transformed scores
 */
jasmin.Statistics.transformZ = function( scores, mean, sd ) {
    var result = jasmin.Statistics.similarArray( scores );
    
    for( var i in scores )
    {
        result[i] = ( parseInt( scores[i] ) - mean ) / sd;
    }
    return result;
};

/*
 * Create an empty array. indexed if source is indexed, associative if source is associative
 * @param {int} source array to be used as model
 * @returns indexed or associative array
 */
jasmin.Statistics.similarArray = function( source ){
    if( source instanceof Array )
    {
        return [];
    }
    
    return {};
};


/*
 * Creates an indexed array that contains the elements of associative or indexed array values, 
 * ordering the elements according to the values of the indexed array indexes
 * @param {array} values  values to order
 * @param {int}   indexes indexes to order by
 * @returns ordered indexed array
 */
jasmin.Statistics.orderBy = function( values, indexes ){
    var result = [];
    for( var i in indexes )
    {
        result.push( values[ indexes[ i ] ] );
    }
    return result;
};


/*
 * Loops trough each element of an indexed/associatvie array source, applies function fun to this array
 * and collects only the values returned by fun into an array of the same type, but only for those
 * cases where this value is not undefined;
 * @param {Object}   source  source array
 * @param {Function} fun     funcation to apply to source
 * @returns results of fun applied to source
 */
jasmin.Statistics.applyRow = function (source, fun){
    var results, result;
    if (source instanceof Array) {
        // indexed case
        results = [];
        for (var i in source) {
            result = fun(source[i]);
            if (result !== undefined) {
                results.push(result);
            }
        }        
    } else {
        // associative case
        results = {};
        for (var i in source) {
            result = fun(source[i]);
            if (result !== undefined) {
                results[i] = result;
            }
        }
    }
    return (results);
};

/*
 * Generates a sequence of items, in which each item is repeated reps times. A proportion of
 * elements in the sequence gets labelA, while the remainder get labelB. These labels are
 * applied such that they are balanced as much as possible across the items. Note that if 
 * proportionA * #items * reps does not result in a whole number, this number is rounded down.
 * @param {array}  items         items to repeat in sequence
 * @param {int}    reps          number of times to repeat each item
 * @param {float}  proportionA   proportion of labelA
 * @param {string} labelA        label A
 * @param {string} labelB        label B
 * @param {string} itemKey       (optional) Key to use for item; "item" by default
 * @param {string} labelKey      (optional) Key to use for label; "label" by default
 * @returns {array} Sequence, in which each element is an associative array with a key "item" for the item and "label" for the label
 */
jasmin.Statistics.balancedSequence = function (items, reps, proportionA, labelA, labelB, itemKey, labelKey) {
    itemKey = itemKey === undefined? "item": itemKey;
    labelKey = labelKey === undefined? "label": labelKey;
    
    var result = [];
    var countA = Math.floor(items.length * reps * proportionA);
    
    var i, j, labels, newElement;
    for (j = 0; j < reps; j++) {   
        // So long as there are more labels A to apply than items, give every item labelA
        if (countA >= items.length) {
            labels = jasmin.Statistics.rep(labelA, items.length);
        // No labels A left? Give every item labelB
        } else if (countA <= 0) {
            labels = jasmin.Statistics.rep(labelB, items.length);
        // Less labels A to apply than items? Shuffle remaining labels A and B
        } else {
            labels = jasmin.Statistics.fisherYates(
                jasmin.Statistics.rep(labelA, countA).concat(
                    jasmin.Statistics.rep(labelB, items.length - countA)
                )
            );
            console.log(labels);
        }
        countA -= items.length;
        for (i in items) {
            newElement = {};
            newElement[itemKey] = items[i];
            newElement[labelKey] = labels[i];
            result.push(newElement);
        }
    }
    
    return (result);
};