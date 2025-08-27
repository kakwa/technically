+++
title = 'My Silly Sun Server'
date = 2025-08-27T19:01:49+02:00
draft = true
+++

# Obsolete Tech In A Modern Age

## Something Old Is New Again

One of my pet peeves is to bring new life into old hardware.
Here, I'm not thinking in a retro-computing kind of way, software is not exactly fine wine in my opinion: it doesn't age well.
Also, old software tend to be isolated in its own bubble, amusing, but unless you are [G.R.R. Martin rocking along WordStar 4.0](https://www.youtube.com/watch?v=X5REM-3nWHg), that's not really useful.

I prefer the challenge of installing modern software that can actually talk to the outside, and actually do something useful.
It will not run a k8s cluster, but generally these old machines generally still have enough humff for light weight dedicated usecases like:

- Spotify/Webradio Receiver/MPD servers hooked to old analog Hi-Fi Systems.
- Basic (Static) Hosting
- Test Machines
- Firewalls/Routers

## The Little Server That Could (not)

Enters the Sun v100, the entry level server from 2001 sold by Sun Microsystems.

It boasts impressive specs such as:
- 2x 80GB IDE Hard Drives
- No GPU whatsover (not great for IA I guess :p)
- 2GB RAM (if maxed out)
- ~500MHz Sparc CPU
- Two 100Mbits/s NICs
- LOMlite Management over Serial + second Serial Port

In truth, this beast is a little asthmatic, but I find the Sparc CPU interesting, particularly for testing endianess and alignment issues. And it doesn't need huge amounts of power (~15 Watts TDP) to run unlike many other servers.

I bought this v100 about 15 years ago secondhand, but in truth, never did something really useful with it.
This thing is simply a bit too big and too loud and it sat in my cupboard for ages. But let's try to change that.

## A Two Fronts Project

So, yes, I aim to do something of this cute little server from another time. Challenging, but not undoable... probably.

But to acheive that, two main topics needs to be addressed:

1. Make this server smaller and quieter
2. Find and install a modern OS and some up to date pieces of software for it

# The Hardware Side

TODO

# The Software Side

## Operating System Choice

TODO: explain choice of OpenBSD.

## Installation

### LOMLite access

TODO Picture + Cisco Cable + Serial/USB Adapter + screen & tty settings.

Also mention the `#.` keys combo.

### Factory Reset

I initially had issue getting to [Open Firmware](https://en.wikipedia.org/wiki/Open_Firmware). In its past life, it seems this server was configured to not share LOM and tty onto the same Serial port. I was getting the LOM onto the upper port all right, but the OF/OS on lower Port remained silent.

```
lom> console
Console not shared.
lom> break
Console not shared.
```

I tried a few things to make it talk, but ended-up settling on trying to reset the server firmware to factory default.
However even that prove to be challenging. I tried to use procedures [like this one](https://dogemicrosystems.ca/pub/Sun/System_Handbook/Sun_syshbk_V3.4/collections/PROBLEMRESOLUTIONSURE/1-72-1018251.1-1.html), without luck. I also tried using the `bootmode -u` flag, against, without luck.

I was about to give-up when I stubbled [uppon this email](https://marc.info/?l=classiccmp&m=123195610818394) from a former Sun employee. (Thanks Mr. Andy for posting this on a random mailing 16 years ago, the internet is truly amazing sometimes).

So as indicated by this mail, I ran the following commands to reset the eeprom:

```
lom>set extra-cmds on
Extra commands are reserved for SUN service personnel.
Unauthorised use invalidates machine service warranty.

lom>eepromreset
lom>reset -l
```

And bingo, I was in buziness. I was getting the `ok` prompt, and was able to switch between LOM and the actual server tty with the `#.` combo.

### Installation

TODO, rarp + tftp.
