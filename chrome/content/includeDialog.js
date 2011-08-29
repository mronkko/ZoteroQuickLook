Zotero.debug("ZoteroQuickLookDialog loading",3);

Components.classes["@mozilla.org/moz/jssubscript-loader;1"].getService(Components.interfaces.mozIJSSubScriptLoader).loadSubScript("chrome://zoteroquicklook/content/zoteroquicklookdialog.js");


window.addEventListener('load', function(e) { Zotero.ZoteroQuickLookDialog.init(); }, false);
	
Zotero.debug("ZoteroQuickLookDialog loaded",3);

