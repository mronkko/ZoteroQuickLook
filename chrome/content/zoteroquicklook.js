//This is hopefully not needed in the future.
const INTEGRATION_TYPE_ITEM = 1;

Zotero.ZoteroQuickLook = {


	proc:null,
    prefs: null,
	customviewcommand:null,
    isBrowseMode:false,
    viewerExecutable:null,
    viewerBaseArguments:null,
    
	init: function() {


		document.getElementById('zotero-itemmenu').addEventListener("popupshowing", this.showQuickLookMenu, false);
		document.getElementById('zotero-items-tree').addEventListener("keydown",this.onKey,false);
	
		//If preferences are null, it means that this is the first call to init and we need to do some more intialization
	
		if(this.prefs==null){

			Zotero.debug("ZoterQuickLook: starts init",3);

			//set up preferences
			this.prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions.zoteroquicklook.");
			
			//Trim the preference to avoid problems of extra spaces
			this.customviewcommand=this.prefs.getCharPref("customviewcommand").replace(/^\s+|\s+$/g, '');
			
			//Check that the custom view command exists and show an alert if it does not.
			
			if(this.customviewcommand!=""){
				this.viewerExecutable = Components.classes["@mozilla.org/file/local;1"]
					.createInstance(Components.interfaces.nsILocalFile);
	            this.viewerExecutable.initWithPath(this.customviewcommand);
                this.viewerBaseArguments=[''];
				
				if(this.viewerExecutable.exists() === false){
					alert("You have specified a non-existing file ("+this.customviewcommand
					+") as a custom view command for Zotero Quick Look. The default view command will be used for this session.");
					this.customviewcommand="";
				}
			}
			//Location of the perl script that is used on linux and mac
			var scriptLocation;
		
			//Get the path of the  embedded shell script and word processor plugins scripts
		
			var MY_ID = "zoteroquicklook@gmail.com";  
			
			if(Components.interfaces.nsIExtensionManager){
				Zotero.debug("This is not Firefox 4 or later",3);
				//Earlier versions

				var em = Components.classes["@mozilla.org/extensions/manager;1"].getService(Components.interfaces.nsIExtensionManager);  

				scriptLocation=em.getInstallLocation(MY_ID).getItemFile(MY_ID, "chrome/content").path;

				Zotero.ZoteroQuickLook.initScripts(scriptLocation);
			}
			else{
				//Firefox 4
				Zotero.debug("ZoterQuickLook: detected Firefox 4 or later",3);

				Components.utils.import("resource://gre/modules/AddonManager.jsm");  

				AddonManager.getAddonByID(MY_ID, function(addon) {

				resourceURI=addon.getResourceURI("chrome/content");


				scriptLocation = resourceURI.QueryInterface(Components.interfaces.nsIFileURL).file.path;
				
				Zotero.ZoteroQuickLook.initScripts(scriptLocation);

				});

			}
				
			//Initialize the word processor integration.
			
			Zotero.ZoteroQuickLook.initIntegration();
			
			Zotero.debug("ZoterQuickLook: finished init",3);

		}
	},
	
	//Initializes external scripts.
	
	initScripts: function(scriptDir) {
	
		 if((Zotero.isMac || Zotero.isLinux) && this.customviewcommand==""){

			Zotero.ZoteroQuickLook.initExecutable(scriptDir+"/zoteroquicklook.pl")
		
		}
		// Check if the word processor integration for Zotero is installed and install the quicklook word processor script
		
		if(Zotero.isMac){
			
			var zoteroScriptsPath = Components.classes["@mozilla.org/file/local;1"]
                .createInstance(Components.interfaces.nsILocalFile);
		
			zoteroScriptsPath.initWithPath("~/Library/Application Support/Microsoft/Office/Word Script Menu Items/Zotero");

			if(zoteroScriptsPath.exists()){
				Zotero.debug("ZoteroQuickLook: Found Zotero word processor integration scripts");
	
				var zoteroQL = Components.classes["@mozilla.org/file/local;1"]
                .createInstance(Components.interfaces.nsILocalFile);
		
				zoteroQL.initWithPath("~/Library/Application Support/Microsoft/Office/Word Script Menu Items/Zotero/ZoteroQuickLook\\coq.scpt");
				if(zoteroQL.exists() === false){
					Zotero.debug("ZoteroQuickLook: Did not find ZoteroQuickLook integration script, attempting to install.");
					
					
					var proc = Components.classes["@mozilla.org/process/util;1"].createInstance(Components.interfaces.nsIProcess);
					
					var osacompile = Components.classes["@mozilla.org/file/local;1"]
					.createInstance(Components.interfaces.nsILocalFile);
		            osacompile.initWithPath("/usr/bin/osacompile");

					proc.init(osacompile);

					Zotero.debug("ZoteroQuickLook: Compiling script. Source:"+scriptDir+"/ZoteroQuickLook\\coq.scpt"+" Target: "+zoteroScriptsPath.path+"/ZoteroQuickLook\\coq.scpt");

					var userAgent = Components.classes["@mozilla.org/xre/app-info;1"].getService(Components.interfaces.nsIXULRuntime).OS; 

					Zotero.debug("ZoteroQuickLook: Determining OS version: " & userAgent);

					//Before lion
					if( /Mac OS X 10_6/.test(userAgent) || /Mac OS X 10_5/.test(userAgent) || /Mac OS X 10_4/.test(userAgent)){
						Zotero.debug("ZoteroQuickLook: Compiling for pre-Lion Mac OS X")
						proc.run(true, Array("-o",zoteroScriptsPath.path+"/ZoteroQuickLook\\coq.scpt",scriptDir+"/ZoteroQuickLook\\coq.scpt"), 3);
					}
					//Lion and after
					else{
						Zotero.debug("ZoteroQuickLook: Compiling for Lion or later Mac OS X")
						proc.run(true, Array("-t", "osas", "-c", "ToyS", "-o", zoteroScriptsPath.path+"/ZoteroQuickLook\\coq.scpt",scriptDir+"/ZoteroQuickLook\\coq.scpt"), 7);
					}

				}
				else{
					Zotero.debug("ZoteroQuickLook: Found ZoteroQuickLook integration script.");
				}
			}
			else{
				Zotero.debug("ZoteroQuickLook: Did not find Zotero word processor integration scripts");
			}
		}
	},

	initIntegration: function(){
	
		Zotero.Integration.Document.prototype.quickLook = function() {

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

					for each(var citationItem in citation.citationItems) {
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
	
	initExecutable: function(scriptLocation) {
	//Initialize the command that is used.

		this.viewerExecutable = Components.classes["@mozilla.org/file/local;1"]
                .createInstance(Components.interfaces.nsILocalFile);
		
		//TODO: The script fails when custom view command is bogus.
		
		if(Zotero.ZoteroQuickLook.customviewcommand!=""){
			this.viewerExecutable.initWithPath(Zotero.ZoteroQuickLook.customviewcommand);
			if(this.viewerExecutable.exists() === false){
				alert("The custom view command  " + Zotero.ZoteroQuickLook.customviewcommand + " does not exits.");
			}
		}

		
		// Mac and Linux use the same wrapper file for calling QuickLook or Gloobus

		else if(Zotero.isMac || Zotero.isLinux){
			

			if(Zotero.isLinux){
				this.viewerExecutable.initWithPath("/usr/bin/gloobus-preview");
				if(this.viewerExecutable.exists() === false){
					alert("/usr/bin/gloobus-preview is missing. Please install Gloobus or spesify a custom view command instead.");
					return;
				}
			}
			
			if(this.prefs.getBoolPref("usefilenameworkaround")){


				Zotero.debug("Path to perl script is " + scriptLocation,3);

				//Run the script with perl to avoid permission issues
				this.viewerExecutable.initWithPath("/usr/bin/perl");

				this.viewerBaseArguments=[scriptLocation];
			}
			else{
				if(Zotero.isLinux){
					this.viewerExecutable.initWithPath("/usr/bin/gloobus-preview");
				}
				else{
					this.viewerExecutable.initWithPath("/usr/bin/qlmanage");
					this.viewerBaseArguments=['-p'];
				}
			
			}

		}
		
		else if(Zotero.isWin){
			this.viewerExecutable.initWithPath("C:\\Program Files\\maComfort\\maComfort.exe");
			if(this.viewerExecutable.exists() === false){
				this.viewerExecutable.initWithPath("C:\\Program Files (x86)\\maComfort\\maComfort.exe");
				if(this.viewerExecutable.exists() === false){
					alert("MaComfort not found. Please install MaComfort or spesify a custom view command instead.");
				}
			}
			this.viewerBaseArguments=['-ql'];
		}
	},
	
	cleanFileName: function(filename) {
		//This is a workaround for firefox bug. See https://www.zotero.org/trac/ticket/957
		//The workaround can be disabled with a hidden preference. 
		//This feature is not supported on Windows and enabling it would just cause problems.
		if (this.prefs.getBoolPref("usefilenameworkaround") && ! Zotero.isWin){
			filename=filename.replace(/[^A-Z0-9.:\/\\_\- ]/gi,'*');
		}
		return filename;
	},
	
	closeQuickLook: function(){
		Zotero.debug("ZoterQuickLook: is killing quicklook viewer.");
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
	
	pushItemToArgs: function(args,item){
		
		if(item.isAttachment()){
			file=item.getFile();
			if(file!=false){
				args.push(Zotero.ZoteroQuickLook.cleanFileName(file.path));
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
	
	openQuickLook: function(items) {
	
		Zotero.debug("ZoterQuickLook: opening viewer",3);

		var args=this.viewerBaseArguments.slice();
		
		// A boolean indicating if we have notes this far.
		var notesFound=false;

		var filesFound=false;
		
		//Combine all filenames into an array

		for (item in items){
			
			if (items[item].isAttachment() || items[item].isNote()){
				if(items[item].isNote() &! notesFound){
					this.cleanOldNotes();
					notesFound=true;
				}
				this.pushItemToArgs(args,items[item]);
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
					this.pushItemToArgs(args,child);
					filesFound=true;
				}
				
			}
		}
		
		
		///If no files are specified, exit. Custom view commmand does not have base arguments but other view commands have one base argument.
		
		if (! filesFound ) {
			Zotero.debug("ZoterQuickLook: thinks that no files are selected",3);
			return false;
		}

		var argsString="";
		
		for( i in args){
			argsString=argsString+" "+args[i];
		}
		
		//Write to debug what is called
		Zotero.debug("ZoterQuickLook: calling a shell command: " +this.viewerExecutable.path +argsString,3);

		Zotero.ZoteroQuickLook.proc = Components.classes["@mozilla.org/process/util;1"].
		createInstance(Components.interfaces.nsIProcess);
	
		Zotero.ZoteroQuickLook.proc.init(Zotero.ZoteroQuickLook.viewerExecutable);
	
		Zotero.ZoteroQuickLook.proc.run(false, args, args.length);
		
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
			Zotero.debug("ZoterQuickLook: is browsing");
			if (! Zotero.ZoteroQuickLook.isBrowseMode) Zotero.ZoteroQuickLook.closeQuickLook();
			success=Zotero.ZoteroQuickLook.openQuickLook(items);
			// If the items were not found, the viewer stays closed. However, if we are browsing through a list of items, we want to reopen the viewer when we hit the next item that has an attachment.
			Zotero.ZoteroQuickLook.isBrowseMode = ! success;
			Zotero.debug("ZoterQuickLook: has browse mode set to " + Zotero.ZoteroQuickLook.isBrowseMode,3);
			
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
