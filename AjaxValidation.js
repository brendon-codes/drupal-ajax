/**
 * Ajax form validation
 * 
 * @author BrendonC
 */

var AjaxValidation = new Object;

AjaxValidation.conf = {
  jquery_ver : '1.2.0'
}

AjaxValidation.pass = true;

AjaxValidation.preprocess = function() {
  var v, i, _i, j_ver, jq_current_ver, pass;
  jq_current_ver = jQuery.fn.jquery.toString();
  v = jq_current_ver.split('.');
  j_ver = AjaxValidation.conf.jquery_ver.split('.');
  for (i = 0, _i = j_ver.length; i < _i; i++) {
    if (parseInt(v[i]) < parseInt(j_ver[i])) {
      window.alert(
        "Required minumum jquery version is " +
        AjaxValidation.conf.jquery_ver + ". The version currently installed " +
        "is " + jq_current_ver + ". Please follow the instructions " +
        "which were provided with the jQuery Update Module for upgrading " +
        "jQuery. The jQuery Update homepage can be found at " +
        "http://drupal.org/project/jquery_update. Until jQuery is upgraded, " +
        "AJAX validation will not be activated for this form.");
      AjaxValidation.pass = false;
    }
  }
}


AjaxValidation.go = function(submitter_) {
  var data, loadingBox, formObj, data, submitter, submitterVal, thisForm;
  if (!AjaxValidation.pass) {
    return false;
  }
  else {
    formObj = $(submitter_.form);
    submitter = $(submitter_);
    submitterVal = submitter.val();
    data = formObj.serializeArray();
    data[data.length] = {
      name: submitter.attr('name'),
      value: submitterVal
    };
    data[data.length] = {
      name: 'ajax-validation',
      value: 1
    };
    submitter.val('Loading...');
    /**
     * Eventually we may want to append the submit hidden
     * field to the form list
     */
    $.ajax({
      url: formObj[0].getAttribute('action'),
      data: data,
      type: 'POST',
      async: true,
      dataType: 'json',
      success: function(data){
        submitter.val(submitterVal);
        AjaxValidation.response(submitter, formObj, data);
      }
      
    })
    return false;
  }
}


AjaxValidation.scroller = function(submitter) {
  var scroll_weight, box, found, timer;
  scroll_weight = 100;
  timer = window.setInterval(function() {
    box = submitter;
    found = false;
    // Watch for thickbox
    while (box.parentNode !== null && box.id !== 'TB_window') {
      box = box.parentNode;
      // Document
      if (box === document) {
        if (box.documentElement.scrollTop &&
            box.documentElement.scrollTop > 0) {
          box.documentElement.scrollTop -= scroll_weight;
          found = true;
        }
      }
      // Body
      else if (box === document.body) {
        if (box.scrollTop &&
            box.scrollTop > 0) {
          box.scrollTop -= scroll_weight;
          found = true;
        }
      }
      // Window
      else if (box === window) {
        if ((window.pageYOffset && window.pageYOffset > 0) ||
            (window.scrollY && window.scrollY > 0)) {
          window.scrollBy(0, -scroll_weight);
          found = true;
        }
      }
      // Any other element
      else {
        if (box.scrollTop &&
            box.scrollTop > 0) {
          box.scrollTop -= scroll_weight;
          found = true;
        }
      }
    }
    // Check if completed
    if (!found) {
      window.clearInterval(timer);
    }
    return true;
  }, 100);
}


AjaxValidation.response = function(submitter, formObj, data){
  var i, _i, thisItem, log, errBox, h;
  log = $('<ul>');
  /**
   * Failure
   */
  if (data.status === false) {
    errBox = $(".messages.error", formObj[0])
    for (i = 0, _i = data.errors.length; i < _i; i++) {
      thisItem = $('#' + data.errors[i].id, formObj[0])
      thisItem.addClass('error');
      if (data.errors[i].required) {
        thisItem.addClass('required');
      }
      log.append('<li>' + data.errors[i].error + '</li>');
    }
    if (errBox.length === 0) {
      errBox = $("<div class='messages error'>");
      formObj.prepend(errBox);      
    }
    errBox.html(log);
    AjaxValidation.scroller(submitter[0]);
  }
  /**
   * Success
   */
  else {
    /**
     * If no redirect, then simply show messages
     */
    if (data.redirect === null) {
      console.log(data.messages);
    }
    /**
 * If redirect, then perform redirect
 */
    else {
      window.location.href = '/' + data.redirect;
    }
  }
}

AjaxValidation.preprocess();
