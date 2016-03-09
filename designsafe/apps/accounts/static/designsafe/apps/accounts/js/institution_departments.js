jQuery(function($) {

  function updateDepartmentStatus() {
    var $inst = $('#id_institutionId');
    var $dept = $('#id_departmentId');

    if ($inst.val() === '1') {
      $dept.parent().addClass('required');
      $dept.attr('required', 'required');
    } else {
      $dept.parent().removeClass('required');
      $dept.attr('required', null);
    }

    if ($dept.children().length > 1) {
      $dept.parent().removeClass('hide');
    } else {
      $dept.parent().addClass('hide');
    }
  }

  $('#id_institutionId').on('change', function(e) {
    var id = parseInt(this.value);
    if (id > 0) {
      $.ajax({
        url: '/account/departments.json',
        dataType: 'json',
        data: {institutionId: id}
      })
      .then(function(departments) {
        if (departments.length) {
          var opts = '<option value="">Choose One</option>';
          $.each(departments, function(i, o) {
            opts += '<option value="' + o.id + '">' + o.name + '</option>';
          });
          $('#id_departmentId').html(opts);
        } else {
          $('#id_departmentId').empty();
        }
        updateDepartmentStatus();
      });

    } else {
      $('#id_departmentId').empty();
      updateDepartmentStatus();
    }
  });

  updateDepartmentStatus();

});
