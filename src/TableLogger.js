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
 * TableLogger logs data in a a table format with named variables as columns
 * and unnamed rows. Two variable names automatically added by the logger: logger_sn, which is a serial number that increases
 * by one with each successive row that is logged, and logger_time, which is the client time a row was logged (expressed in milliseconds)
 * @param {array}    columns   Array of Strings; these are the varable names used for each column
 * @param {Function} fail      If defined, this function is called whenever trying to add logs with columns that were predefined via the previous argument
 * @param {Object}   na        A value to represent the absence of a value when logs are retrieved in indexed format. Default = null
 * @constructor
 */
jasmin.TableLogger = function( columns, fail, na )
{
    this.columns = columns;
    this.fail    = fail;
    this.na      = na;
    this.sn      = 0;
    
    this.clearLogs();
};

/** 
 * Clear all rows from  logs (but not columns)
 * @public
 */
jasmin.TableLogger.prototype.clearLogs = function()
{
    this.logs = [];
};

/** 
 * Log a row of data 
 * @param   {Object}  logMe   Associative array in which keys identify columns and values are the values to log this row
 * @public
 */
jasmin.TableLogger.prototype.log = function( logMe )
{
    // Add time and sn
    logMe["logger_sn"] = this.sn;
    logMe["logger_time"] = window.performance.now();
    
    // If fail defined, check columns
    if( this.fail !== undefined ) {
        for( var column in logMe ) {
            if( this.columns.indexOf( column ) === -1 ) {
                this.fail( "TableLogger.log: Column " + column + " in logMe not found in this.columns" );
            }
        }
    }
    
    // Add logMe to logs
    this.logs.push( logMe );
};

/** 
 * Get logs in associative or indexed format
 * @param   {boolean} associative  If true, each row in the logs returned is an associative array of the form column => value. If false, each row is an indexed array (with missing value filled in with this.na), the first row containing column names
 * @public
 */
jasmin.TableLogger.prototype.getLogs = function( associative )
{
    if( associative ) {
        return this.logs;
    }
    
    // Still here, then setup indexed
    var result = [], i, row, value;
    
    // Add column names
    row = [];
    for( var i = 0; i < this.columns.length; i++ ) {
        row.push( this.columns[i] );
    }
    result.push( row );
    
    // Add rows
    for( var j = 0; j < this.logs.length; j++ ) {
        // Construct each row
        row = [];
        for( var i = 0; i < this.columns.length; i++ ) {
            // Get right value, if undefined store this.na instead of value
            value = this.logs[j][ this.columns[i] ];
            row.push( value === undefined? this.na : value );
        }
        result.push( row );
    }
    
    return result;
};
