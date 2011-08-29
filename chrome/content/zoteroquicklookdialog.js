Zotero.ZoteroQuickLookDialog = {

	init: function() {

		Zotero.debug("ZoteroQuickLookDialog starts init",3);
	
		document.getElementById('zotero-items-tree').addEventListener("keypress",this.onKey,false);
		
		Zotero.debug("ZoteroQuickLookDialog finished init",3)

	},
	onKey: function(event) {
		return Zotero.ZoteroQuickLook.handleKeyPress(event,itemsView.getSelectedItems());
	}
}
