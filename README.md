ZoteroQuickLook
===============

This open source project implements QuickLook in Zotero.

# Status

This plugin is not currently being actively maintained. It may not work with current or beta versions of Zotero. If someone is interested in taking over maintenance of the plugin, please contact @bwiernik. 

# Installing

To install ZoteroQuickLook, download the latest version of `zoteroquicklook.zoteroplugin` from the Releases section of this GitHub repo. In **Zotero** (not in Firefox), open Tools -> Add-ons. Then drag the `zoteroquicklook.zoteroplugin` file onto the Zotero Add-ons window.

Note for __Zotero 6.0__: Replace `zoteroquicklook.zoteroplugin` above, download `zoteroquicklook.xpi` from te Release section then follow the instructions above.

## Installing on Mac
On Mac, ZoteroQuickLook uses macOS's native QuickLook functionality. Check path `/usr/bin/qlmanage` and make sure it exists. No additional steps are needed.

## Installing on Linux

On Linux, considering that __Gloobus-Preview__ is unmaintained now, it is recommanded to install __Gnome Sushi__ as the QuickLook preview software first. Run the command below to install it in terminal:

```
sudo apt install gnome-sushi # Debian User
run sudo dnf install sushi # Fedora User
```

After the installation is complete, check path `/usr/bin/sushi` and make sure it exists.

If you want to install [Gloobus-Preview](https://launchpad.net/gloobus-preview), a QuickLook-like preview software. On Ubuntu you can do this by running the following commands in terminal:

```
sudo add-apt-repository ppa:gloobus-dev/gloobus-preview
sudo apt-get update
sudo apt-get upgrade
sudo apt-get install gloobus-preview
```
After the installation is complete, check path `/usr/bin/gloobus-preview` and make sure it exists.


For other distributions and versions the installation might be different.

If you do not like Gloobus, you can define a custom QuickLook command:
 1. Install the software you want to use for previewing files. The software must be able to take a file name as a command line parameter.
 1. Open the Config Editor in Zotero's Advanced preferences pane.
 1. Search for `extensions.zoteroquicklook.customviewcommand`. Set the value for this config to the full path of the executable that you want to use to show the files.

## Installing on Windows

On Windows, you must first install a QuickLook tool. By default, ZoteroQuickLook is set up to work with [QuickLook](https://github.com/QL-Win/QuickLook/releases). Note that you must install QuickLook using either the `.msi` installer or through the Windows Store. If you use the `.zip` version of QuickLook, you must also set up a custom view command.

Alternative QuickLook tools for Windows include [Seer](http://1218.io), [WinQuickLook](https://github.com/shibayan/WinQuickLook), and the paid software [MaComfort](https://leonardo.re/macomfort/). In my experience, the default option, QuickLook, is the most stable and powerful and least resource intensive option. You can choose another QuickLook program if you like. The software must be able to take a file name as a command line parameter.

After installing a QuickLook program, set ZoteroQuickLook to use this program:
 1. Open the Config Editor in Zotero's Advanced preferences pane.
 1. Search for `extensions.zoteroquicklook.customviewcommand`. Set the value for this config to the full path of the executable that you want to use to show the files.

### Alternative build for Windows

Installing the extension on Windows sometimes fails with the error message: "ZoteroQuickLook cannot be installed because Zotero cannot modify the needed file." This is a Windows specific problem caused by the 256 character filename length limitation. This limit is reached during unpacking the xpi archive when installing the extension. Mozilla has fixed the issue by eliminating unpacking of extensions by default and running them directly from the xpi archive. However, this solution does not work for ZoteroQuickLook because on Mac and Linux, the extension uses executable files that need to be unpacked so that they can be run. These files are not used on Windows and there is a parallel version of ZoteroQuickLook that supports running directly from the xpi file. This version is called `zoteroquicklook-windows.xpi` and is available from the Releases section of this GitHub repo.

You can read more about the problem on [Stack Overflow](http://stackoverflow.com/questions/7872489/addon-cannot-be-installed-by-an-error-of-not-be-able-to-modify-the-needed-file) and the pages linked to from there.

# Getting support

Please post any questions or bugs to the Zotero forums. Include "ZoteroQuickLook" in the thread title. Also include the following information:
 - Operating system and version (e.g., macOS 10.13.2)
 - Zotero version
 - ZoteroQuickLook version
 - Detailed description of your problem
 - A link to a log file (see the next section)
 - If on windows, whether loading the alternative Windows build fixes the issue

## Log files

Log file will sometimes be helpful in diagnosing possible issues, so you need to submit a log file when asking for support.

To create a log file, in Zotero, follow these steps:
 1. Click Help -> Debug Output Logging -> Restart with Logging Enabled….
 1. After Zotero restarts, click Help -> View Output.
 1. Copy the content of the log that appears and paste it to (gist.github.com).
 1. Click "Create secret gist", then copy paste the URL of the gist to your thread on the Zotero forums.

The important information is in the beginning of the log. Here are example lines from the beginning of a log file. Make sure that your log file starts with similar lines to ensure that the log is complete.

```
zotero(3): Using data directory /Users/user/Zotero/

zotero(3): IPC: Initializing pipe at /Users/user/Zotero/pipes/1376326753918

zotero(3): Loading in full mode

zotero(3): Opening database 'zotero'
```
