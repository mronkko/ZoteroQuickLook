#!/usr/bin/perl

use File::Spec;
use IPC::Open2;

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


if (scalar @files > 0) {
	if (-e '/usr/bin/qlmanage') { exec('/usr/bin/qlmanage','-p',@files); }
	elsif (-e '/usr/bin/sushi') {
		# we pass an entire string, instead of a list of args, to `system` because dbus-send needs to run in an actual shell
		$cmd = 'dbus-send --print-reply --dest=org.gnome.NautilusPreviewer /org/gnome/NautilusPreviewer org.gnome.NautilusPreviewer.ShowFile string:"file://%s" int32:0 boolean:false';
		# sushi only support viewing single file
		system sprintf($cmd,File::Spec->rel2abs($files[0]));
	}
	elsif (-e '/usr/bin/gloobus-preview') { system('/usr/bin/gloobus-preview',@files); }
	else { print "No QuickLook application found"; }
}
