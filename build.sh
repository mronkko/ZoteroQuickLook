#!/bin/bash

"C:\Program Files (x86)\Microsoft Visual Studio\2019\BuildTools\MSBuild\Current\Bin\Roslyn\csc.exe" /target:winexe /out:./chrome/content/Bridge.exe "./chrome/content/Bridge.cs"
zip -r builds/zoteroquicklook.zoteroplugin chrome defaults install.rdf chrome.manifest -x .*
