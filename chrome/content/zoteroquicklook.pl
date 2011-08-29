#!/usr/bin/perl

print "\n\nThis file contains debug information\n\n";

my @files=();

foreach $argnum (0 .. $#ARGV) {
	my $path=$ARGV[$argnum];
		
	#If path contains * wildcards, expand these
	if($path =~ /\*/){
		#If path contains spaces put quotes around it
		if($path =~ / /){
			$path="\"$path\"";
		}

		push(@files,glob($path));
	}
	else{
		push(@files,$path);
	}
}

#
# Because Gloobus and OS X QuickLook are quite different applications, we must run one with exec and the other with system.
#


if (-e '/usr/bin/qlmanage') { exec('/usr/bin/qlmanage','-p',@files); }
elsif (-e '/usr/bin/gloobus-preview') { system('/usr/bin/gloobus-preview',@files); }
else { print "No QuickLook application found"; }
