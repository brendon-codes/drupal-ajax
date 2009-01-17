/**
 * Automatic ajax validation
 *
 * @see http://drupal.org/project/ajax
 * @see irc://freenode.net/#drupy
 * @depends Drupal 6
 * @author brendoncrawford
 * @note This file uses a 79 character width limit.
 * 
 *
 */

Drupal.Ajax = new Object;

Drupal.Ajax.plugins = {};

Drupal.Ajax.firstRun = false;

/**
 * Init function.
 * This is being executed by Drupal behaviours.
 * See bottom of script.
 * 
 * @param {HTMLElement} context
 * @return {Bool}
 */
Drupal.Ajax.init = function(context) {
  var f, s;
  if (f = $('.ajax-form', context)) {
    if (!Drupal.Ajax.firstRun) {
      Drupal.Ajax.invoke('init');
      Drupal.Ajax.firstRun = true;
    }
    s = $('input[type="submit"]', f);
    s.click(function(){
      this.form.ajax_activator = $(this);
      return true;
    });
    f.each(function(){
      this.ajax_activator = null;
      $(this).submit(function(){
        if (this.ajax_activator === null) {
          this.ajax_activator = $('#edit-submit', this);
        }
        if (this.ajax_activator.hasClass('ajax-trigger')) {
          Drupal.Ajax.go($(this), this.ajax_activator);
          return false;
        }
        else {
          return true;
        }
      });
      return true;
    });
  }
  return false;
}

/**
 * Invokes plugins
 * 
 * @param {Object} formObj
 * @param {Object} submitter
 */
Drupal.Ajax.invoke = function(hook, args) {
  var plugin, r;
  for (plugin in Drupal.Ajax.plugins) {
    r = Drupal.Ajax.plugins[plugin](hook, args);
    if (r === false) {
      return false;
    }
  }
  return true;
}

/**
 * Handles submission
 * 
 * @param {Object} submitter_
 * @return {Bool}
 */
Drupal.Ajax.go = function(formObj, submitter) {
  var submitterVal, submitterName, extraData;
  Drupal.Ajax.invoke('submit');
  submitterVal = submitter.val();
  submitterName = submitter.attr('name');
  submitter.val(Drupal.t('Loading...'));
  extraData = {};
  extraData[submitterName] = submitterVal;
  extraData['drupal_ajax'] = '1';
  formObj.ajaxSubmit({
    extraData : extraData,
    beforeSubmit : function(data) {
      data[data.length] = {
        name : submitterName,
        value : submitterVal
      }
      data[data.length] = {
        name : 'drupal_ajax',
        value : '1'
      }
      return true;
    },
    dataType : 'json',
    error: function (XMLHttpRequest, textStatus, errorThrown) {
      window.alert(Drupal.t('ajax.module: An unknown error has occurred.'));
      if (window.console) {
        console.log('error', arguments);
      }
      return true;
    },
    success: function(data){
      submitter.val(submitterVal);
      Drupal.Ajax.response(submitter, formObj, data);
      return true;
    },
  });
  return false;
}

/**
 * Handles scroller
 * 
 * @param {Object} submitter
 * @return {Bool}
 */
Drupal.Ajax.scroller = function(submitter) {
  var scroll_weight, box, found, timer;
  scroll_weight = 100;
  timer = window.setInterval(function() {
    box = submitter;
    found = false;
    // Watch for thickbox
    while (box.parentNode !== null &&
        Drupal.Ajax.invoke('scrollFind', {container:box})) {
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
Drupal.Ajax.message = function(messages, type, formObj, submitter) {
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
  Drupal.Ajax.scroller(submitter[0]);
  return true;
}

/**
 * Updates message containers
 * 
 * @param {Object} updaters
 * @return {Bool}
 */
Drupal.Ajax.updater = function(updaters) {
  var i, _i, elm;
  for (i = 0, _i = updaters.length; i < _i; i++) {
    elm = $(updaters[i].selector);
    // HTML:IN
    if (updaters[i].type === 'html_in') {
      elm.html(updaters[i].value);
    }
    // HTML:OUT
    else if (updaters[i].type === 'html_out') {
      elm.replaceWith(updaters[i].value);
    }
    // FIELD
    else if (updaters[i].type === 'field') {
      elm.val(updaters[i].value);
    }
    // REMOVE
    else if(updaters[i].type === 'remove') {
      elm.remove();
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
Drupal.Ajax.response = function(submitter, formObj, data){
  var newSubmitter;
  /**
   * Failure
   */
  if (data.status === false) {
    Drupal.Ajax.updater(data.updaters);
    Drupal.Ajax.message(data.messages_error, 'error', formObj, submitter);
  }
  /**
   * Success
   */
  else {
    // Display preview
    if (data.preview !== null) {
      Drupal.Ajax.updater(data.updaters);
      Drupal.Ajax.message(decodeURIComponent(data.preview), 'preview',
        formObj, submitter);
    }
    // If no redirect, then simply show messages
    else if (data.redirect === null) {
      if (data.messages_status.length > 0) {
        Drupal.Ajax.message(data.messages_status, 'status', formObj, submitter);
      }
      if (data.messages_warning.length > 0) {
        Drupal.Ajax.message(data.messages_warning, 'warning', formObj, submitter);
      }
      if (data.messages_status.length === 0 &&
          data.messages_warning.length === 0) {
        Drupal.Ajax.message([{
          id : 0,
          value : Drupal.t('Submission Complete')
        }], 'status', formObj, submitter);
      }
    }
    // Redirect
    else {
      window.location.href = data.redirect;
    }
  }
  return true;
}

Drupal.behaviors.Ajax = Drupal.Ajax.init;


