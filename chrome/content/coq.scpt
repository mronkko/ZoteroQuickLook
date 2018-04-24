try
	do shell script "PIPE=\"/Users/Shared/.zoteroIntegrationPipe_$LOGNAME\";  if [ ! -e \"$PIPE\" ]; then PIPE='~/.zoteroIntegrationPipe'; fi; if [ -e \"$PIPE\" ]; then echo 'MacWord2008 quickLook '" & quoted form of POSIX path of (path to current application) & " > \"$PIPE\"; else exit 1; fi;"
on error
	display alert "Word could not communicate with Zotero. Please ensure that Firefox is open and try again." as critical
end try
