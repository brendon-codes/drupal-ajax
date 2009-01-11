/**
 * Ajax Tinymce Plugin
 *
 * @see http://drupal.org/project/ajax
 * @see irc://freenode.net/#drupy
 * @depends Drupal 6
 * @author brendoncrawford
 * @note This file uses a 79 character width limit.
 *
 */

/**
 * TinyMCE Trigger
 * 
 * @return {Bool}
 */
Drupal.Ajax.plugins.tinyMCE = function(hook, args) {
  if (hook === 'submit') {
    if (window.tinyMCE && window.tinyMCE.triggerSave) {
      tinyMCE.triggerSave();
    }
  }
  return true;
}
