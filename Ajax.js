/**
 * Automatic ajax validation
 *
 * @see http://drupal.org/project/ajax
 * @see irc://freenode.net/#drupy
 * @depends Drupal 6
 * @author brendoncrawford
 * @note This file uses a 79 character width limit.
 *
 */

var Ajax = new Object;

Ajax.conf = {
  jquery_ver : '1.2.0'
}

Ajax.pass = true;

/**
 * Preprocessor
 * 
 * @return {Bool}
 */
Ajax.preprocess = function() {
  var v, i, _i, j_ver, jq_current_ver, pass;
  jq_current_ver = jQuery.fn.jquery.toString();
  v = jq_current_ver.split('.');
  j_ver = Ajax.conf.jquery_ver.split('.');
  for (i = 0, _i = j_ver.length; i < _i; i++) {
    if (parseInt(v[i]) < parseInt(j_ver[i])) {
      window.alert(
        "Required minumum jquery version is " +
        Ajax.conf.jquery_ver + ". The version currently installed " +
        "is " + jq_current_ver + ". Please follow the instructions " +
        "which were provided with the jQuery Update Module for upgrading " +
        "jQuery. The jQuery Update homepage can be found at " +
        "http://drupal.org/project/jquery_update. Until jQuery is upgraded, " +
        "AJAX validation will not be activated for this form.");
      Ajax.pass = false;
    }
  }
  return true;
}

/**
 * TinyMCE Trigger
 * 
 * @return {Bool}
 */
Ajax.tinyMCE = function() {
  if (window.tinyMCE && window.tinyMCE.triggerSave) {
    tinyMCE.triggerSave();
  }
  return true;
}

/**
 * Handles submission
 * 
 * @param {Object} submitter_
 * @return {Bool}
 */
Ajax.go = function(submitter_) {
  var data, loadingBox, formObj, data, submitter, submitterVal, thisForm;
  if (!Ajax.pass) {
    return false;
  }
  else {
    Ajax.tinyMCE();
    formObj = $(submitter_.form);
    submitter = $(submitter_);
    submitterVal = submitter.val();
    data = formObj.serializeArray();
    data[data.length] = {
      name: submitter.attr('name'),
      value: submitterVal
    };
    data[data.length] = {
      name: 'ajax',
      value: 1
    };
    submitter.val('Loading...');
    $.ajax({
      url: formObj[0].getAttribute('action'),
      data: data,
      type: 'POST',
      async: true,
      dataType: 'json',
      success: function(data){
        submitter.val(submitterVal);
        Ajax.response(submitter, formObj, data);
      }
      
    })
    return false;
  }
}

/**
 * Handles scroller
 * 
 * @param {Object} submitter
 * @return {Bool}
 */
Ajax.scroller = function(submitter) {
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
  return true;
}

/**
 * Handles return message
 * 
 * @param {Object} messages
 * @param {Object} type
 * @param {Object} formObj
 * @param {Object} submitter
 * @return {Bool}
 */
Ajax.message = function(messages, type, formObj, submitter) {
  var i, _i, thisItem, log, errBox, h;
  // Cleanups
  $('.messages, .ajax-preview', formObj).remove();
  $('input, textarea').removeClass('error status warning required');
  // Preview
  if (type === 'preview') {
    log = $('<div>').addClass('ajax-preview');
    log.html(messages);
    formObj.prepend(log);
  }
  // Status, Error, Message
  else {
    log = $('<ul>');
    errBox = $(".messages." + type, formObj[0])
    for (i = 0, _i = messages.length; i < _i; i++) {
      thisItem = $('#' + messages[i].id, formObj[0])
      thisItem.addClass(type);
      if (messages[i].required) {
        thisItem.addClass('required');
      }
      log.append('<li>' + messages[i].value + '</li>');
    }
    if (errBox.length === 0) {
      errBox = $("<div class='messages " + type + "'>");
      formObj.prepend(errBox);
    }
    errBox.html(log);
  }
  Ajax.scroller(submitter[0]);
  return true;
}

/**
 * Updates message containers
 * 
 * @param {Object} updaters
 * @return {Bool}
 */
Ajax.updater = function(updaters) {
  var i, _i, elm;
  for (i = 0, _i = updaters.length; i < _i; i++) {
    elm = $(updaters[i].selector);
    if (updaters[i].type === 'html_in') {
      elm.html(updaters[i].value);
    }
    else if (updaters[i].type === 'html_out') {
      elm.replaceWith(updaters[i].value);
    }
    else if (updaters[i].type === 'field') {
      elm.val(updaters[i].value);
    }
  }
  return true;
}

/**
 * Handles data response
 * 
 * @param {Object} submitter
 * @param {Object} formObj
 * @param {Object} data
 * @return {Bool}
 */
Ajax.response = function(submitter, formObj, data){
  var newSubmitter;
  /**
   * Failure
   */
  if (data.status === false) {
    Ajax.updater(data.updaters);
    Ajax.message(data.messages_error, 'error', formObj, submitter);
  }
  /**
   * Success
   */
  else {
    // Display preview
    if (data.preview !== null) {
      Ajax.message(decodeURIComponent(data.preview), 'preview',
        formObj, submitter);
    }
    // If no redirect, then simply show messages
    else if (data.redirect === null) {
      if (data.messages_status.length > 0) {
        Ajax.message(data.messages_status, 'status', formObj, submitter);
      }
      if (data.messages_warning.length > 0) {
        Ajax.message(data.messages_warning, 'warning', formObj, submitter);
      }
      if (data.messages_status.length === 0 &&
          data.messages_warning.length === 0) {
        Ajax.message([{
          id : 0,
          value : 'Submission Complete.'
        }], 'status', formObj, submitter);
      }
    }
    // Redirect
    else {
      //console.log(data.redirect);
      window.location.href = data.redirect;
    }
  }
  return true;
}

Ajax.preprocess();
