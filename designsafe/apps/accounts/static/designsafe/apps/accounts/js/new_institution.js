jQuery(function($) {
  function updateNewInstitutionFieldStatus() {
    var $inst = $('#id_institutionId');
    if ($inst.val() === '-1') {
      $('#id_institution').parent().removeClass('hide').addClass('required');
      $('#id_institution').attr('required', 'required');
    } else {
      $('#id_institution').parent().addClass('hide').removeClass('required');
      $('#id_institution').attr('required', null);
    }
  }
  $('#id_institutionId').on('change', updateNewInstitutionFieldStatus);
  updateNewInstitutionFieldStatus();

  $('#id_institutionId').children().last().wrap('<optgroup label="Not Listed"></optgroup>');
  $('#id_institutionId').parent().after('<p><a tabindex="-1" href="#" id="id_institutionNotListed"><i class="fa fa-question-circle"></i> My Institution is not listed</a></p>')

  $('#id_institutionNotListed').on('click', function(e) {
    e.preventDefault();
    $('#id_institutionId').val(-1).trigger('change');
  });

});