/**
 * Ajax form validation
 * 
 * @author BrendonC
 */

var AjaxValidation = new Object;

AjaxValidation.conf = {
  jquery_ver : '1.2.0'
}

AjaxValidation.preprocess = function() {
  var v, i, _i, j_ver, jq_current_ver, pass;
  jq_current_ver = jQuery.fn.jquery.toString();
  v = jq_current_ver.split('.');
  j_ver = AjaxValidation.conf.jquery_ver.split('.');
  pass = true;
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
      pass = false;
    }
  }
  if (pass) {
    $(AjaxValidation.init);
  }
}

AjaxValidation.init = function() {
  var sub, i, _i;
  sub = "";
  for (i = 0, _i = AjaxValidation.submitters.length; i < _i; i++) {
    if (i > 0) {
      sub += ", ";
    }
    sub += "#" + AjaxValidation.submitters[i];
  }
  subs = $(sub)
  subs.click(function(){
    return AjaxValidation.go(this, this.form);
  });
}

AjaxValidation.go = function(submitter_, thisForm) {
  var data, loadingBox, formObj, data, submitter, submitterVal;
  formObj = $(thisForm);
  data = $('#node-form').serializeArray();
  data[data.length] = {
    name : 'ajax-validation',
    value : 1
  };
  submitter = $(submitter_);
  submitterVal = submitter.val();
  submitter.val('Loading...');
  $.ajax({
    url : formObj[0].getAttribute('action'),
    data : data,
    type : 'POST',
    async : true,
    dataType : 'json',
    success : function(data) {
      submitter.val(submitterVal);
      AjaxValidation.response(submitter, formObj, data);
    }
  })
  return false;
}


AjaxValidation.scroller = function(submitter) {
  var scroll_weight, box, found, timer;
  scroll_weight = 100;
  timer = window.setInterval(function() {
    box = submitter;
    found = false;
    // Watch for thickbox
    while (box.parentNode !== null && box.parentNode.id !== 'TB_window') {
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
    h = $('<input type="hidden">');
    h.attr('name', submitter.attr('name'));
    h.val(submitter.val());
    formObj.append(h);
    formObj[0].submit();
  }
}

AjaxValidation.preprocess();
