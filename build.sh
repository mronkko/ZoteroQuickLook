#!/bin/bash

zip -r builds/zoteroquicklook.zoteroplugin chrome defaults install.rdf chrome.manifest -x .*
mv install.rdf install-base.rdf
mv install-altwindows.rdf install.rdf
zip -r builds/zoteroquicklook-altwindows.zoteroplugin chrome defaults install.rdf chrome.manifest -x .*
mv install.rdf install-altwindows.rdf
mv install-base.rdf install.rdf