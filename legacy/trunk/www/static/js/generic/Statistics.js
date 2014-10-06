function Statistics() {}

/*
 * Mean
 */
Statistics.mean = function( scores )
{
    var sum = 0, count = 0;
    for( i in scores )
    {
        sum += parseInt( scores[i] );
        count++;
    }

    // If count <= 0, mean is zero
    if( count <= 0 )
    {
        return 0;
    }
        
    
    return sum / count;
}

/*
 * Variance
 */
Statistics.variance = function( scores )
{
    var mean         = Statistics.mean( scores );
    var sumOfSquares = 0, count = 0;
    for( i in scores )
    {
        sumOfSquares += Math.pow( parseInt( scores[i] ) - mean, 2 );
        count++;
    }
    
    // If count <= 1, variance is zero
    if( count <= 1 )
    {
        return 0;
    }
    
    return sumOfSquares / ( count - 1 );
}

/*
 * Standard deviation
 */
Statistics.sd = function( scores )
{
    return Math.sqrt( Statistics.variance( scores ) );
}

/*
 * Z transformation 
 */
Statistics.zTransform = function( scores, mean, sd )
{
    var result = Statistics.similarArray( scores );
    
    for( i in scores )
    {
        result[i] = ( parseInt( scores[i] ) - mean ) / sd;
    }
    return result
}

/*
 * Create an empty array. indexed if source is indexed, assoc if source is assoc
 */
Statistics.similarArray = function( source )
{
    if( source instanceof Array )
    {
        return [];
    }
    
    return {};
}

/*
 * Shuffle the elements of an array
 * @param array      Array to shuffle
 * @param repLength  If defined: in the shuffle result, the same element may not be repeated within repLength positions
 */
Statistics.shuffle = function( array, repLength )
{
    if( repLength === undefined )
    {
        return Statistics.fisherYates( array );
    }
    
    var accepted = false, result, i, j;
    while( !accepted )
    {
        result = Statistics.fisherYates( array )
        accepted = true;
        for( 
            i = 0; 
            accepted && i < result.length; 
            i++ 
        ) {
            for( 
                j = i+1; 
                accepted && j <= Math.min( i + repLength, result.length - 1 ); 
                j++ 
            ) {
                if( result[i] == result[j] )
                {
                    accepted = false;
                }
            }
        }
    }
    
    return result;
}


/*
 * Check on repeating elements
 * @param array      Array to check
 * @param repLength  Number of elements forming one repetition (e.g. "888" forms a repetition with 3 elements)
 * @param index      If defined, the elements of array are associative arrays; as element, use the value indexed in this associative array
 * @returns true if an element in the array forms a repetition of repLength or longer
 */
Statistics.repetitions = function( array, repLength, index )
{
    // Invalid repLength; don't report any repetitions
    if( repLength < 2 || array.length < repLength )
    {
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
        if( left == right )
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
}


// Returned array shuffled via fisherYates    
Statistics.fisherYates = function( array )    
{
  var m = array.length, t, i;

  // While there remain elements to shuffle…
  while( m ) {

    // Pick a remaining element…
    i = Math.floor( Math.random() * m-- );

    // And swap it with the current element.
    t = array[m];
    array[m] = array[i];
    array[i] = t;
  }

  return array;
}    

/*
 * Create a sequence from from, to to with steps of step
 */
Statistics.seq = function( from, to, step )
{
    if( step == undefined )
    {
        step = 1;
    }
    
    var result = [];
    for( var i = from; i <= to; i += step )
    {
        result.push( i );
    }
    return result;
}

/*
 * Repeat the value x rep times
 */
Statistics.rep = function( x, rep )
{
    var result = [];
    for( var i = 0; i < rep; i += 1 )
    {
        result.push( x );
    }
    return result;
}

/*
 * Creates an indexed array that contains the elements of associative array values, 
 * ordering the elements according to the values of the indexed array indexes
 */
Statistics.orderBy = function( values, indexes )
{
    var result = [];
    for( var i in indexes )
    {
        result.push( values[ indexes[ i ] ] );
    }
    return result;
}


/*
 * Create a new array that contains all combinations of the values of left and right
 */
Statistics.combine = function( left, name, right )
{
    var result = [];

    
    var i_left, i_left_2, i_right, combination;

    // Loop over all values of left and right
    for( i_right in right )
    {
        for( i_left in left )
        {
            // deep copy array left
            combination = {};            
            for( i_left_2 in left[ i_left ] )
            {
                combination[ i_left_2 ] = left[ i_left ][ i_left_2 ];
            }
            combination[ name ] = right[ i_right ];
            result.push( combination );
        }
    }        

    return result;
}