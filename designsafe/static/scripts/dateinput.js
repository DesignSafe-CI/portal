(function(window, $, Modernizr, undefined) {
    if (!Modernizr.inputtypes.date) {
        $('.dateinput > :input').datepicker({
            autoclose: true
        });
    }
})(window, jQuery, Modernizr);