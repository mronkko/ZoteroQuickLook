

Zotero.debug("ZoteroQuickLook loading",3);

Components.classes["@mozilla.org/moz/jssubscript-loader;1"].getService(Components.interfaces.mozIJSSubScriptLoader).loadSubScript("chrome://zoteroquicklook/content/zoteroquicklook.js");


window.addEventListener('load', function(e) { Zotero.ZoteroQuickLook.init(); }, false);

Zotero.debug("ZoteroQuickLook loaded",3);



