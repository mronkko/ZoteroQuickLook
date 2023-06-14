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
		# kill last process to prevent the new preview window from losing window focus
		# grep command checks include 'Previewer' processes that causes a new process with a name containing 'Preview' and 'grep' to be spawned
		# so we need grep with option -v to avoid kill itself 
		$awk_tmp = q{awk '{print $2}'};
		$kill_pid = "while [ ` pgrep -c -f org.gnome.NautilusPreviewer` -ge 2 ] ; do  kill -15 ` ps aux | grep org.gnome.NautilusPreviewer | grep -v grep | $awk_tmp ` ; sleep 1.0e-2 ;done ;";
		$dbus_preview = 'dbus-send --print-reply --dest=org.gnome.NautilusPreviewer /org/gnome/NautilusPreviewer org.gnome.NautilusPreviewer.ShowFile string:"file://%s" int32:0 boolean:false';
		$cmd = join(" ", $kill_pid, $dbus_preview);
		# sushi only support viewing single file
		system sprintf($cmd,File::Spec->rel2abs($files[0]));
	}
	elsif (-e '/usr/bin/gloobus-preview') { system('/usr/bin/gloobus-preview',@files); }
	else { print "No QuickLook application found"; }
}
