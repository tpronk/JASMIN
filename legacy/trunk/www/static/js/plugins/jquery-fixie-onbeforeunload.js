(function($) {
   $(document).ready(function() {
 
       $('a').filter(function() {
           return (/^javascript\:/i).test($(this).attr('href'));
       }).each(function() {
           var hrefscript = $(this).attr('href');
           hrefscript = hrefscript.substr(11);
           $(this).data('hrefscript', hrefscript);
       }).click(function() {
           var hrefscript = $(this).data('hrefscript');
           eval(hrefscript);
           return false;
       }).attr('href', '#');
 
   });
})(jQuery);