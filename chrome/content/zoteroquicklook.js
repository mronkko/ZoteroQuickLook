//This is hopefully not needed in the future.
const INTEGRATION_TYPE_ITEM = 1;

Zotero.ZoteroQuickLook = {
	initialized: false,
	proc:null,
	customviewcommand:null,
    isBrowseMode:false,
    viewerExecutable:null,
    viewerBaseArguments:null,

	init: async function () {
		document.getElementById('zotero-itemmenu').addEventListener("popupshowing", this.showQuickLookMenu, false);
		document.getElementById('zotero-items-tree').addEventListener("keydown",this.onKey,false);

		if (!this.initialized) {
			Zotero.debug("ZoteroQuickLook: starts init",3);

			//Trim the preference to avoid problems of extra spaces
			this.customviewcommand = this.getPref('customviewcommand').replace(/^\s+|\s+$/g, '');

			//Check that the custom view command exists and show an alert if it does not.

			if(this.customviewcommand!=""){
				this.viewerExecutable = Zotero.File.pathToFile(this.customviewcommand);
                this.viewerBaseArguments=[''];

				if(this.viewerExecutable.exists() === false){
					alert("You have specified a non-existing file ("+this.customviewcommand
					+") as a custom view command for Zotero Quick Look. The default view command will be used for this session.");
					this.customviewcommand="";
				}
			}

			// Get the path of the embedded Perl script (Mac/Linux) or QuickLook bridge executable (Win)
			if (this.customviewcommand == "") {
				await new Promise(function (resolve) {
					var MY_ID = "zoteroquicklook@gmail.com";
					Components.utils.import("resource://gre/modules/AddonManager.jsm");
					AddonManager.getAddonByID(MY_ID, async function (addon) {
						let scriptURI = addon.getResourceURI("chrome/content");
						await this.initScripts(scriptURI.spec);
						resolve();
					}.bind(this));
				}.bind(this));
			} else {
				this.initExecutable();
			}

			// Initialize the word processor integration
			// Disabled due to removal of script menu in Word 2016+
			//Zotero.ZoteroQuickLook.initIntegration();

			Zotero.debug("ZoteroQuickLook: finished init",3);
			
			this.initialized = true;
		}
	},

	/**
	 * Initializes external scripts
	 */
	initScripts: async function (scriptURL) {
		if (!Zotero.isWin) {
			let path = await this.copyURLToTempDir(scriptURL + "/zoteroquicklook.pl");
			Zotero.debug("ZoteroQuickLook: Copying zoteroquicklook.pl file to: " + path);
			Zotero.ZoteroQuickLook.initExecutable(path);
		} else {
			let path = await this.copyURLToTempDir(scriptURL + "/Bridge.exe");
			Zotero.debug("ZoteroQuickLook: Copying Bridge.exe file to: " + path);
			Zotero.ZoteroQuickLook.initExecutable(path);
		}
		
		/*
		// Check if the word processor integration for Zotero is installed and install the quicklook word processor script
		// Disabled due to removal of script menu in Word 2016+
		if (Zotero.isMac) {
			let zoteroScriptsPath = Zotero.File.pathToFile(
				"~/Library/Application Support/Microsoft/Office/Word Script Menu Items/Zotero"
			);
			if (zoteroScriptsPath.exists()) {
				Zotero.debug("ZoteroQuickLook: Found Zotero word processor integration scripts");

				var zoteroQL = Zotero.File.pathToFile(
					"~/Library/Application Support/Microsoft/Office/Word Script Menu Items/Zotero/ZoteroQuickLook/coq.scpt"
				);
				if (!zoteroQL.exists()){
					Zotero.debug("ZoteroQuickLook: Did not find ZoteroQuickLook integration script, attempting to install.");
					
					let sourceScript = await this.copyURLToTempDir(scriptURL + "ZoteroQuickLook/coq.scpt");

					Zotero.debug("ZoteroQuickLook: Compiling script. "
						+ "Source: " + sourceScript + " "
						+ "Target: " + zoteroScriptsPath.path + "/ZoteroQuickLook/coq.scpt"
					);

					var userAgent = Components.classes["@mozilla.org/xre/app-info;1"].getService(Components.interfaces.nsIXULRuntime).OS;

					Zotero.debug("ZoteroQuickLook: Determining OS version: " + userAgent);

					await Zotero.Utilities.Internal.exec(
						"/usr/bin/osacompile",
						[
							"-t", "osas",
							"-c", "ToyS",
							"-o", zoteroScriptsPath.path + "/ZoteroQuickLook/coq.scpt",
							sourceScript
						]
					);
					
					await OS.File.remove(sourceScript);

				}
				else{
					Zotero.debug("ZoteroQuickLook: Found ZoteroQuickLook integration script.");
				}
			}
			else{
				Zotero.debug("ZoteroQuickLook: Did not find Zotero word processor integration scripts");
			}
		}
		*/
	},

	/*
	initIntegration: function(){

		Zotero.Integration.Interface.prototype.quickLook = function() {

			Zotero.debug("ZoteroQuickLook: Executing integration function");

			var me = this;

			if(Zotero.ZoteroQuickLook.isActive()){
				Zotero.ZoteroQuickLook.closeQuickLook();
				return;
			}
			else{
				return this._getSession(true, false).then(function() {
					var field = me._doc.cursorInField(me._session.data.prefs['fieldType'])
					if(!field) {
						throw new Zotero.Exception.Alert("integration.error.notInCitation", [],
							"integration.error.title");
					}

					var code = field.getCode();
					fieldGetter = new Zotero.Integration.Fields(me._session, me._doc);
					var [type, content] = fieldGetter.getCodeTypeAndContent(code);

					if(type !== 1) {
						throw new Zotero.Exception.Alert("integration.error.notInCitation", [],
							"integration.error.title");
					}

					var citation = me._session.unserializeCitation(content);
					me._session.lookupItems(citation);

					var zoteroItems = [];

					for (let citationItem of citation.citationItems) {
						zoteroItem = false;
						if(citationItem.uris) {
							[zoteroItem, ] = me._session.uriMap.getZoteroItemForURIs(citationItem.uris);
						} else if(citationItem.key) {
							zoteroItem = Zotero.Items.getByKey(citationItem.key);
						}
						if(zoteroItem) zoteroItems.push(zoteroItem);
					}

					Zotero.ZoteroQuickLook.openQuickLook(zoteroItems);
					return;
				});
			}
		}
	},
	*/

	initExecutable: function(scriptLocation) {
		Zotero.debug("ZoteroQuickLook: Script location is " + scriptLocation, 3);
		
	//Initialize the command that is used.

		//TODO: The script fails when custom view command is bogus.

		if(Zotero.ZoteroQuickLook.customviewcommand!=""){
			this.viewerExecutable = Zotero.File.pathToFile(Zotero.ZoteroQuickLook.customviewcommand);
			if(this.viewerExecutable.exists() === false){
				alert("The custom view command  " + Zotero.ZoteroQuickLook.customviewcommand + " does not exits.");
			}

			if (/maComfort.exe/g.exec(this.viewerExecutable.path)){
				this.viewerBaseArguments=['-ql'];
			}

		}


		// Mac and Linux use the same wrapper file for calling QuickLook or Gloobus

		else if(Zotero.isMac || Zotero.isLinux){


			if(Zotero.isLinux){
				this.viewerExecutable = Zotero.File.pathToFile("/usr/bin/gloobus-preview");
				if(this.viewerExecutable.exists() === false){
					alert("/usr/bin/gloobus-preview is missing. Please install Gloobus or specify a custom view command instead.");
					return;
				}
			}

			if (this.getPref("usefilenameworkaround")) {


				Zotero.debug("Path to perl script is " + scriptLocation,3);

				//Run the script with perl to avoid permission issues
				this.viewerExecutable = Zotero.File.pathToFile("/usr/bin/perl");

				this.viewerBaseArguments=[scriptLocation];
			}
			else{
				if(Zotero.isLinux){
					this.viewerExecutable = Zotero.File.pathToFile("/usr/bin/gloobus-preview");
				}
				else{
					this.viewerExecutable = Zotero.File.pathToFile("/usr/bin/qlmanage");
					this.viewerBaseArguments=['-p'];
				}

			}

		}

		else if(Zotero.isWin){			
			/* TODO: Checking for existence of Windows Store Apps isn't working
			// Check if QuickLook is installed. 
			localappdata = Components.classes["@mozilla.org/file/directory_service;1"].getService(Components.interfaces.nsIProperties).get("LocalAppData", Components.interfaces.nsIFile).path;
			qlMsiLocation = Zotero.File.pathToFile(localappdata + "\\Programs\\QuickLook\\QuickLook.exe");
			winApps = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile).initWithPath("C:\\Program Files\\WindowsApps\\").directoryEntries;
			winAppsArray = [];
			while(winApps.hasMoreElements()) {
				var entry = winApps.getNext();
				entry.QueryInterface(Components.interfaces.nsIFile);
				winAppsArray.push(entry);
			}
			qlPublisher = /PaddyXu\.QuickLook/g ;
			qlWinStoreInstalled = winAppsArray.some(e => qlPublisher.test(e));
			if(qlMsiLocation.exists() === false && qlWinStoreInstalled === false){
				alert("QuickLook not found. Please install QuickLook (http://pooi.moe/QuickLook/) or specify a custom view command instead.");
				return;
			}
			*/
			
			this.viewerExecutable = Zotero.File.pathToFile(scriptLocation);
			this.viewerBaseArguments=[''];		
		}
	},

	getPref: function (pref) {
		return Zotero.Prefs.get('extensions.zoteroquicklook.' + pref, true);
	},

	copyURLToTempDir: async function (url) {
		var tmpDir = OS.Path.join(Zotero.getTempDirectory().path, 'ZoteroQuickLook')
		await OS.File.makeDir(tmpDir);
		var filename = url.match(/\/([^\/]+)$/)[1];
		var path = OS.Path.join(tmpDir, filename);
		await Zotero.File.download(url, path);
		return path;
	},

	cleanFileName: function(filename) {
		//TODO is this still needed?
		//This is a workaround for firefox bug. See https://www.zotero.org/trac/ticket/957
		//The workaround can be disabled with a hidden preference.
		//This feature is not supported on Windows and enabling it would just cause problems.
		if (this.getPref("usefilenameworkaround") && ! Zotero.isWin){
			filename=filename.replace(/[^A-Z0-9.:\/\\_\- ]/gi,'*');
		}
		return filename;
	},

	closeQuickLook: function(){
		Zotero.debug("ZoteroQuickLook: is killing quicklook viewer.");
		Zotero.ZoteroQuickLook.proc.kill();
		Zotero.ZoteroQuickLook.proc=null;
	},

	/*

	Checks if quicklook is active.

	*/

	isActive: function(){
		//On windows checking for the process to be active is not currently supported.
		//For some reason the software freezes on Linux if we try to check Zotero.ZoteroQuickLook.proc.isRunning
		return ! Zotero.isLinux && Zotero.ZoteroQuickLook.proc!==null &&  Zotero.ZoteroQuickLook.proc.isRunning;
	},

/*

Cleans old notes from cahce directory if found.

*/

	cleanOldNotes: function(){

		// Delete the ZoteroQuickLook directory if found
		var file = Components.classes["@mozilla.org/file/directory_service;1"].getService(Components.interfaces.nsIProperties).get("TmpD", Components.interfaces.nsIFile);
		file.append("ZoteroQuickLook");
		if(file.exists()) {   // if a cache directory exists, remove it
			file.remove(true);
		}
	},
/*

Checks the attachment file or writes a content of a note to a file and then pushes this to args.

*/

	pushItemToArgs: async function(args,item){

		if(item.isAttachment()){

			if (item.attachmentLinkMode == Zotero.Attachments.LINK_MODE_LINKED_URL) {
				return;
			}
			
			let isLinkedFile = !item.isImportedAttachment();
			let path = item.getFilePath();
			if (!path) {
				ZoteroPane_Local.showAttachmentNotFoundDialog(
					item.id,
					path,
					{
						noLocate: true,
						notOnServer: true,
						linkedFile: isLinkedFile
					}
				);
				return;
			}
			let fileExists = await OS.File.exists(path);

			// If the file is an evicted iCloud Drive file, launch that to trigger a download.
			// As of 10.13.6, launching an .icloud file triggers the download and opens the
			// associated program (e.g., Preview) but won't actually open the file, so we wait a bit
			// for the original file to exist and then continue with regular file opening below.
			//
			// To trigger eviction for testing, use Cirrus from https://eclecticlight.co/downloads/
			if (!fileExists && Zotero.isMac && isLinkedFile) {
				// Get the path to the .icloud file
				let iCloudPath = Zotero.File.getEvictedICloudPath(path);
				if (await OS.File.exists(iCloudPath)) {
					// Launching qlmanage should trigger an iCloud download
					Zotero.debug("ZoteroQuickLook: Triggering download of iCloud file");
					await args.push(Zotero.ZoteroQuickLook.cleanFileName(path));	
					return;
				}
			}
			
			if (fileExists) {
				await args.push(Zotero.ZoteroQuickLook.cleanFileName(path));	
				return;
			}
			
			if (isLinkedFile || !Zotero.Sync.Storage.Local.getEnabledForLibrary(item.libraryID)) {
				this.showAttachmentNotFoundDialog(
					itemID,
					path,
					{
						noLocate: noLocateOnMissing,
						notOnServer: false,
						linkedFile: isLinkedFile
					}
				);
				return;
			}
			
			try {
				await Zotero.Sync.Runner.downloadFile(item);
			}
			catch (e) {
				// TODO: show error somewhere else
				Zotero.debug(e, 1);
				ZoteroPane_Local.syncAlert(e);
				return;
			}
			
			if (!await item.getFilePathAsync()) {
				ZoteroPane_Local.showAttachmentNotFoundDialog(
					item.id,
					path,
					{
						noLocate: noLocateOnMissing,
						notOnServer: true
					}
				);
				return;
			} else {
				// Try previeviewing file after download
				await args.push(Zotero.ZoteroQuickLook.cleanFileName(path));	
			}

		}
		else if(item.isNote()){

			// Write the content of the note to a temporary file

			var file = Components.classes["@mozilla.org/file/directory_service;1"].getService(Components.interfaces.nsIProperties).get("TmpD", Components.interfaces.nsIFile);
			file.append("ZoteroQuickLook");
			// If the directory does not exists, create it
			if( !file.exists() || !file.isDirectory() ) {   // if it doesn't exist, create
			   file.create(Components.interfaces.nsIFile.DIRECTORY_TYPE, 0777);
			}
			file.append(item.getNoteTitle()+".html");
			file.createUnique(Components.interfaces.nsIFile.NORMAL_FILE_TYPE, 0666);

			//Source https://developer.mozilla.org/en/Code_snippets/File_I%2F%2FO

			// file is nsIFile, data is a string
			var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"].
			createInstance(Components.interfaces.nsIFileOutputStream);
			// use 0x02 | 0x10 to open file for appending.
			foStream.init(file, 0x02 | 0x08 | 0x20, 0666, 0);
			// write, create, truncate
			// In a c file operation, we have no need to set file mode with or operation,
			// directly using "r" or "w" usually.

			// if you are sure there will never ever be any non-ascii text in data you can
			// also call foStream.writeData directly
			var converter = Components.classes["@mozilla.org/intl/converter-output-stream;1"].createInstance(Components.interfaces.nsIConverterOutputStream);
			converter.init(foStream, "UTF-8", 0, 0);
			converter.writeString(item.getNote());
			converter.close(); // this closes foStream

			args.push(Zotero.ZoteroQuickLook.cleanFileName(file.path));
		}
	},

	/*

	Opens the quick look window with the currently active items.

	*/

	openQuickLook: async function(items) {

		Zotero.debug("ZoteroQuickLook: opening viewer",3);

		var args=this.viewerBaseArguments.slice();

		// A boolean indicating if we have notes this far.
		var notesFound=false;
		var filesFound=false;

		if (!Zotero.isWin || this.customviewcommand !== "") {

		} else {
			
		}

		// Combine all filenames into an array
		// Note that for default Windows behavior, only the first time will be displayed

		for (item in items){

			if (items[item].isAttachment() || items[item].isNote()){
				if(items[item].isNote() &! notesFound){
					this.cleanOldNotes();
					notesFound=true;
				}
				await this.pushItemToArgs(args,items[item]);
				filesFound=true;
			}

			//See if it has children and add them. Best attachment comes first.
			//Notes come after attachments

			else{

				var attachments=items[item].getAttachments(false);
				var notes=items[item].getNotes(false);

				if(notes!==false &! notesFound){
					this.cleanOldNotes();
					notesFound=true;
				}

				children=new Array();
				if(attachments!=false) children=children.concat(attachments);
				if(notes!=false) children=children.concat(notes);

				for (childID in children){
					var child = Zotero.Items.get(children[childID]);
					await this.pushItemToArgs(args,child);
					filesFound=true;
				}

			}
		}


		///If no files are specified, exit.
		
		if (! filesFound ) {
			Zotero.debug("ZoteroQuickLook: thinks that no files are selected",3);
			return false;
		}

		// Custom view commmand does not have base arguments but other view commands have one base argument.
		
		var argsString="";

		for( i in args){
			argsString=argsString+" "+args[i];
		}

		var baseArgs = this.viewerBaseArguments.slice();
		var baseArgsString="";
		
		for( i in baseArgs){
			baseArgsString = baseArgsString+" "+baseArgs[i];
		}
		
		// If no file arguments were added to the base arguments, exit. 
		if (argsString == baseArgsString) {
			Zotero.debug("ZoteroQuickLook: Only linked URLs are selected",3);
			return false;
		}

		//Write to debug what is called
		Zotero.debug("ZoteroQuickLook: calling a shell command: " +this.viewerExecutable.path +argsString,3);
		
		Zotero.ZoteroQuickLook.proc = Components.classes["@mozilla.org/process/util;1"].
		createInstance(Components.interfaces.nsIProcess);
		Zotero.ZoteroQuickLook.proc.init(Zotero.ZoteroQuickLook.viewerExecutable);
		Zotero.ZoteroQuickLook.proc.runw(false, args, args.length);
		return true;
	},

	onKey: function(event) {
		return Zotero.ZoteroQuickLook.handleKeyPress(event,ZoteroPane.getSelectedItems());
	},

	/*

	This function is the actual key listener that decides what to do when a key press event is
	received. It calls the functions to open or close the quicklook window.

	*/
	handleKeyPress: function(event,items){

		var key = String.fromCharCode(event.which);

		if ((key == ' ' && !(event.ctrlKey || event.altKey || event.metaKey)) || (key == 'y' && event.metaKey && !(event.ctrlKey || event.altKey))) {

			//Toggle the quicklook
			if(Zotero.ZoteroQuickLook.isActive()){
				Zotero.ZoteroQuickLook.closeQuickLook();
			}
			else{
				Zotero.ZoteroQuickLook.openQuickLook(items);
			}
			Zotero.ZoteroQuickLook.isBrowseMode=false;
		}
		// Esc
		else if(event.keyCode==27){
			if(Zotero.ZoteroQuickLook.isActive()){
				Zotero.ZoteroQuickLook.closeQuickLook();
			}
			Zotero.ZoteroQuickLook.isBrowseMode=false;
		}
		// 38 is arrow up and 40 is arrow down. If quick look is active, we will close it and open it again with the new selection.
		else if((event.keyCode==38 || event.keyCode==40)&& !(event.ctrlKey || event.altKey || event.metaKey) && (Zotero.ZoteroQuickLook.isActive() || Zotero.ZoteroQuickLook.isBrowseMode)) {
			Zotero.debug("ZoteroQuickLook: is browsing");
			if (! Zotero.ZoteroQuickLook.isBrowseMode) Zotero.ZoteroQuickLook.closeQuickLook();
			success=Zotero.ZoteroQuickLook.openQuickLook(items);
			// If the items were not found, the viewer stays closed. However, if we are browsing through a list of items, we want to reopen the viewer when we hit the next item that has an attachment.
			Zotero.ZoteroQuickLook.isBrowseMode = ! success;
			Zotero.debug("ZoteroQuickLook: has browse mode set to " + Zotero.ZoteroQuickLook.isBrowseMode,3);

		}
		return;

	},

	/*

	A small function that determines if the quicklook option should be visible in the context menu
	for the currently active items.

	*/

	showQuickLookMenu: function(event) {
		var doshow = false;

		var items = ZoteroPane.getSelectedItems();

		doshow = items.length==1 && items[0].isAttachment() && ! Zotero.ZoteroQuickLook.isActive();


		document.getElementById("zoteroquicklook").hidden = !doshow;
	}



};

function mydump(arr,level) {
    var dumped_text = "";
    if(!level) level = 0;

    var level_padding = "";
    for(var j=0;j<level+1;j++) level_padding += "    ";

    if(typeof(arr) == 'object') {
        for(var item in arr) {
            var value = arr[item];

            if(typeof(value) == 'object') {
                dumped_text += level_padding + "'" + item + "' ...\n";
                dumped_text += dump(value,level+1);
            } else {
                dumped_text += level_padding + "'" + item + "' => \"" + value + "\"\n";
            }
        }
    } else {
        dumped_text = "===>"+arr+"<===("+typeof(arr)+")";
    }
    return dumped_text;
}
