Zotero.debug("ZoteroQuickLookQuickFormat loading",3);

Components.classes["@mozilla.org/moz/jssubscript-loader;1"].getService(Components.interfaces.mozIJSSubScriptLoader).loadSubScript("chrome://zoteroquicklook/content/zoteroquicklookquickformat.js");


window.addEventListener('load', function(e) { Zotero.ZoteroQuickLookQuickFormat.init(); }, false);
	
Zotero.debug("ZoteroQuickLookQuickFormat loaded",3);

