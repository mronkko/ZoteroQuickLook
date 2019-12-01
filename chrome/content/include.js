

Zotero.debug("ZoteroQuickLook loading",3);

Components.classes["@mozilla.org/moz/jssubscript-loader;1"].getService(Components.interfaces.mozIJSSubScriptLoader).loadSubScript("chrome://zoteroquicklook/content/zoteroquicklook.js");


Zotero.Schema.schemaUpdatePromise.then(() => {
	Zotero.ZoteroQuickLook.init();
	Zotero.debug("ZoteroQuickLook loaded",3);
});
