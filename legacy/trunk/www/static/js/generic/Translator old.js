/* 
 * Translator Constructor
 * #constructor
 * @param   report          Report callback (see reporter)
 */
function Translator( report )
{
    this.report       = report;
    this.translations = {};
    this.honorific    = undefined;
    
	this.report(
		"Translator.construct",
        ""
	);        
}

/* 
 * Set honorific ("t" for tu, du, jij; "v" for vous, usted, ihr, u)
 * @param honorific
 */
Translator.prototype.setHonorific = function( honorific )
{
    this.honorific = honorific;
}

/* 
 * Add a set of translations
 * @param   translations       Array of translations to add. Each key is a term, the values having keys: value for translation and status for status of translation
 */
Translator.prototype.addTranslations = function( translations )
{
    // Add/overwrite existing translations with new (first arg true = deep copy)
    $.extend( true, this.translations, translations );
    //this.substitute();
    //alert( vardump( this.translations ) );    
}

/* 
 * Translate a term 
 * @param   term       Term to translate
 * @param   callbacks  list of terms with callbacks; if a callback exists for a term, and it returns a value, then use that value instead of the translation
 * @param   pretty     Default true: If true, return term surrounded with "!", if false return undefined
 */
Translator.prototype.translate = function( term, callbacks, pretty )
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

/* 
 * Find terms, replace each by its translation
 * @param   haystack   Text containing 
 * @param   callbacks  list of terms with callbacks; see Translator.translate
 */
Translator.prototype.substitute = function( haystack, callbacks )
{
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
            translation = this.translate( term, callbacks );
            
            // Replace tag by translated term
            haystack = haystack.replace( regExpTerm, translation );
        }
    }
    
    return haystack;
}