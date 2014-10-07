/**
 * Translator translates texts via a term-rewrite system. Provides the option
 * to attach callbacks to terms and to set an honorific.
 * @constructor
 */
function Translator()
{
    this.translations = {};
    this.honorific    = undefined;
}

/**
 * Extend function based on Prototype: merge two (associative) arrays, named
 * destination and source. For any keys existing both in destination and source
 * the values of source is used.
 * @param {Object} destination 
 * @param {Object} source
 * @private
 */
// Extend function from Prototype, see:
// 
Translator.prototype.extend = function(destination, source) {
    for (var property in source) {
        if (source.hasOwnProperty(property)) {
            destination[property] = source[property];
        }
    }
    return destination;
};

/**
 * Set honorific ("t" for tu, du, jij; "v" for vous, usted, ihr, u). If a honorific
 * is set, then the Translator will look for terms prefixed with the honorific,
 * but fall back on any no-honorific form. For example, with honorific v, if 
 * Translator is requested to translate the term "hello", it will first look for
 * a translation of "v_hello"; if none exists it will just use "hello"
 * @param {String} honorific Honorific to use (can be any String)
 * @public
 */
Translator.prototype.setHonorific = function( honorific )
{
    this.honorific = honorific;
}

/**
 * Add a set of translations
 * @param {Object}  translations Associative array of translations to add. Each key is a term, the values having keys: value for translation and status for status of translation
 * @public
 */
Translator.prototype.addTranslations = function( translations )
{
    // Add/overwrite existing translations with new (first arg true = deep copy)
    // TP 201-10-02, moved to native JavaScript function so that Translator does
    // not require jQuery
    this.translations = this.extend( this.translations, translations );
    // $.extend( true, this.translations, translations );
    //this.substitute();
    //alert( vardump( this.translations ) );    
}

/**
 * Translate a single term 
 * @param   {String}  haystack   Text containing 0 or more terms
 * @param   {Object}  callbacks  list of terms with callbacks; if a callback exists for a term, and it returns a value, then use that value instead of the translation
 * @param   {Boolean} pretty     For any terms we cannot find translations of: if true, return term surrounded with "!", if false return undefined (default = true)
 * @public
 */
Translator.prototype.translateTerm = function( term, callbacks, pretty )
{
    // Pretty true by default
    pretty = pretty === undefined? true: pretty;
    
    // First look in callbacks
    if( callbacks !== undefined && callbacks[ term ] !== undefined )
    {
        // Callback found, use it to get translation
        return this.substitute(
            callbacks[ term ](),
            callbacks
        );
    }
    
    // No callback, next check translations
    
    // Check translation for honorific (if specified)
    var translation;
    if( this.honorific !== undefined )
    {
        translation = this.translations[ this.honorific + "_" + term ];
    }
    
    // If no translation found yet, try without honorific
    if( translation === undefined )
    {
        translation = this.translations[ term ];
    } 
    
    // Translation found?
    if( translation === undefined )
    {
        // If not pretty, return undefined
        if( !pretty )
        {
            return undefined;
        }
            
        // No, return original term in exclamation marks
        return "!" + term + "!";
    }
    else
    {
        // Tes, return substituted translation
        return this.substitute( 
            translation,
            callbacks
        );
    }
}

/**
 * Find terms in haystack, replace each by its translation, return haystack
 * @param   {String}  haystack   Text containing 0 or more terms
 * @param   {Object}  callbacks  list of terms with callbacks; if a callback exists for a term, and it returns a value, then use that value instead of the translation
 * @param   {Boolean} pretty     For any terms we cannot find translations of: if true, return term surrounded with "!", if false return undefined (default = true)
 * @public
 */
Translator.prototype.translate = function( haystack, callbacks, pretty )
{
    // Pretty true by default
    pretty = pretty === undefined? true: pretty;
    
    
    // *** Replace all hash tags
    // Regexp to Filter tag out of term
    var regExpTerm = new RegExp( /[#]\[+[A-Za-z0-9-_ ]+?\]/ ); 
    // Filter term out of tag
    var regExpTag;          

    // For each tag in the haystack, translate it
    var tag = true;
    var tag, term, translation;
    
    // More tags to go? 
    while( tag !== null )
    {
        // Get enxt tag
        tag = regExpTerm.exec( haystack );
        if( tag !== null )
        {
            // Tag found, get term
            regExpTag  = new RegExp( /[A-Za-z0-9-_ ]+/g );
            term = regExpTag.exec( tag );
            
            // Translate term
            translation = this.translateTerm( term, callbacks );
            
            // Replace tag by translated term
            haystack = haystack.replace( regExpTerm, translation );
        }
    }
    
    return haystack;
}