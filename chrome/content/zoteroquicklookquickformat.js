Zotero.ZoteroQuickLookQuickFormat = {

	init: function() {

		Zotero.debug("ZoteroQuickLookQuickFormat starts init",3);

		//Zotero Quick Look takes priority in event listeners, so we need to remove and readd the original.
		var originalListener=Zotero_QuickFormat._onQuickSearchKeyPress;
		
		document.getElementById('quick-format-entry').addEventListener("keypress",this.onKey,true);
		
		//Override ESC key for the panel to prevent it closing if quick look is open. In this case the first esc press should close the quicklook and second should close the panel
		
		document.getElementById("quick-format-reference-list").addEventListener("keypress",this.captureEsc,true);
		Zotero.debug("ZoteroQuickLookQuickFormat finished init",3)

	},
	onKey: function(event) {

		var key = String.fromCharCode(event.which);
		
		// Only capture cmd+y and arrow keys (no space) for the QuickFormat dialog

		Zotero.debug("ZoteroQuickLook: Got key code "+event.keyCode+" char is "+key);
		
		if ((key == 'y' && event.metaKey && !(event.ctrlKey || event.altKey)) || event.keyCode==38 || event.keyCode==40 ) {
			
			//If we are not in the browse mode, do nothing on arrows
			if((event.keyCode==38 || event.keyCode==40) &&
				! (Zotero.ZoteroQuickLook.isActive() || Zotero.ZoteroQuickLook.isBrowseMode)) return;
			
			Zotero.debug("ZoteroQuickLook: Got key cmd+y, up arrow or down arrow. Start looking for item.");
			
			var referenceBox = document.getElementById("quick-format-reference-list");
			
			if(! referenceBox.hasChildNodes() || !referenceBox.selectedItem) return;
			
			//This is an ugly workaround to capture Esc. If quick look is open, we do not want to close on Esc
			//referenceBox.selectedItem.addEventListener("keypress",this.captureEsc,false);

			var items = Zotero.Items.get([referenceBox.selectedItem.getAttribute("zotero-item")]);
			
			return Zotero.ZoteroQuickLook.handleKeyPress(event,items);
		}
		//Esc
		else if(event.keyCode==27){
			//If QuickLook is open, stop event propagation
			Zotero.debug("ZoteroQuickLook: Got esc");
			
			if (Zotero.ZoteroQuickLook.isActive()){
				event.stopPropagation();
				event.preventDefault();
				Zotero.ZoteroQuickLook.handleKeyPress(event,null);
				return false;
			}
	
			return true;
		}
	},
	
	captureEsc: function(event){
	
		Zotero.debug("ZoteroQuickLook: Capturing Esc");
		
		if (Zotero.ZoteroQuickLook.isActive()){
			event.stopPropagation();
			event.preventDefault();
			Zotero.ZoteroQuickLook.handleKeyPress(event,null);
			return false;
		}
		return true;
	}
	
}
