+++
title = 'My Silly Sun Server'
date = 2025-08-27T19:01:49+02:00
draft = true
+++

# Links

- [Project's git (scripts & 3d models)](https://github.com/kakwa/silly-sunv100-server).
- [Sun's official documentation](https://dogemicrosystems.ca/pub/Sun/System_Handbook/Sun_syshbk_V3.4/Systems/SunFireV100/SunFireV100.html).
- Eerie Linux's [blog post 1](https://eerielinux.wordpress.com/2019/09/22/a-sparc-in-the-night-sunfire-v100-exploration/) and [post 2](https://eerielinux.wordpress.com/2019/10/30/illumos-v9os-on-sparc64-sunfire-v100/) about his v100.
- [Obligatory ClabRetro video](https://www.youtube.com/watch?v=5OyGwbWKWZU).

# Obsolete Tech In A Modern Age

## Something Old Is New Again

One of my pet peeves is to bring new life into old hardware.

Here, I'm not thinking in a retro-computing kind of way, software is not exactly fine wine in my opinion: it doesn't age well.

Also, old software tend to be isolated in its own bubble, amusing, but unless you are [G.R.R. Martin rocking along WordStar 4.0](https://www.youtube.com/watch?v=X5REM-3nWHg), that's not really useful.

I prefer the challenge of installing modern software on it, being able interact with the worldwide Internet, and actually do something useful.

Sure, it will not run a k8s cluster, but these old machines generally still have enough humff for light weight usecases like, for example:

- Spotifyd/Webradio Receiver/MPD servers hooked to old analog Hi-Fi Systems.
- Basic Web Hosting
- Mail Server
- Test Machines
- Firewalls/Routers

## The Little Server That Could (Not)

Enters the Sun v100, the entry level server from 2001 sold by Sun Microsystems.

It boasts impressive specs such as:
- ~500MHz Sparc CPU
- No GPU whatsover (not great for IA I guess :p)
- 2GB RAM (if maxed out)
- 2x 80GB IDE Hard Drives
- Two 100Mbits/s NICs
- LOMlite Management over Serial + second Serial Port

In truth, this beast is a little asthmatic, but I find the Sparc CPU interesting, particularly for testing endianess and alignment issues.
And it doesn't need huge amounts of power (~15 Watts TDP) to run, unlike most servers from that period.

I bought this v100 about 15 years ago secondhand, but in truth, never did anything really useful with it.
It's simply a bit too big and loud and it sat in my cupboard for ages.

But let's try to change that and learn a few stuff along the way.

## A Two Fronts Project

So, yes, I aim to do something of this cute little server from another time.
Not very rational and somewhat challenging, yet fun... at least in my eyes.

But enough said! Now we need to address the two broad complains we had about this relic:

1. Make this server way smaller and quieter
2. Find and install a modern OS + up-to-date software to make it useful

# The Hardware Side

## Starting Point & End Goal

This tiny server is well... a server. If it fits onto a small and standard 1U height (44.50mm), it's also kind of big in the other dimensions: 19"/482.60mm by 17.55"/445mm.

However, once inside, the content looks like this:

TODO photo inside of V100 CASE

We are in luck, this cute beast could probably be a lot more compact. In particular the main board, including the RAM sticks, is 250x190mm.
If ditch the original (and noisy) Hard Drives & PSU, and cheat a little we could even make it fit into a 254mm(/10") case able to be used in these fancy small [10 inch racks](https://mini-rack.jeffgeerling.com/).

Aside from that, We also need to silence this small beast.

In particular we need to take care of these little bastards:

TODO photo small 40x40 FAN

Replacing these with Noctua fans could probably help.

## New Parts

To make it fit, I'm replacing the following parts:

* The original IDE HDs are too big & noisy, so I'm replacing them with a [SanDisk 32GB CF Card](https://shop.sandisk.com/products/memory-cards/cfast-cfexpress-compactflash/sandisk-extreme-compactflash?sku=SDCFXSB-032G-G46) + [adapter thinggy](https://www.startech.com/en-us/hdd/35baycf2ide) (CF cards are generally pin-compatible with IDE, giving good odds of it working with decent performances).
* The original PSU is quite bulky, but relatively small at 80 Watts. So I will also try my luck with a [Pico PSU](https://www.rgeek.com/portfolio-item/rgeek-pico-dc-psu-rp-120lq-dc-12v-24pin-power-supply-module/) + external 12V Power Brick.
* Let's also try our luck with a GaN USB-C charger + [trigger board](https://www.aliexpress.com/p/tesla-landing/index.html?scenario=c_ppc_item_bridge&productId=1005004356272196&_immersiveMode=true&withMainCard=true&src=google&aff_platform=true&isdl=y). On paper, it could provide us with a great little PSU instead of a rather large and sketchy black brick from an unknown manufacturer.
* The original 40x40mm 12V fans are getting the [Noctua treatment](https://noctua.at/en/products/fan?size=2645&connector=10&voltage=12).

Note: I'm not doing this project to save money. Secondhand micro PCs like ThinkCentre Ms or RPi like SBC are cheaper.

## Modeling

### Case

TODO

### Brackets

TODO

### Bezel

TODO

### Logo

TODO

## Mistakes & Reworks

TODO

# The Software Side

## Operating System Choice

The sad reality is Sparc is a dying architecture. So our choices, as of 2025, are limited:

* (Open)Solaris -> dead
* Illumos (OpenSolaris successor) -> [Support is being dropped](https://github.com/illumos/ipd/blob/master/ipd/0019/README.md)
* Linux -> Sparc64 is still supported by the kernel, but nearly no mainstream distribution supports it ([Debian unofficially](https://wiki.debian.org/Sparc64), and [Gentoo](https://wiki.gentoo.org/wiki/Project:SPARC)).
* FreeBSD -> Support dropped with [FreeBSD 13](https://www.freebsd.org/platforms/sparc/)

This leaves more or less two choices:

* [NetBSD](https://wiki.netbsd.org/ports/sparc64/)
* [OpenBSD](https://www.openbsd.org/sparc64.html)

Let's go with OpenBSD.

## Installation

### LOMLite2

LOM stands for Lights Out Management. Not sure if it fullfils the [IPMI](https://en.wikipedia.org/wiki/Intelligent_Platform_Management_Interface) spec, but it has the same role.

It's a small Baseboard Management Controller (BMC), similar to HP's Ilo or Dell iDRAC, monitoring the hardware (fan, psus), setting the boot sequence, and of course, [turning it off and on again](https://www.youtube.com/watch?v=5UT8RkSmN4k).

On this V100, we have the LOMLite2 version, which is only accessible through Serial (bigger & newer servers, like V210/T1000, have ALOM & ILOM with network & telnet/ssh capabilities).

### Serial Cabling

To access LOM, you need one of these blue "Cisco Cable" with DB9 + RJ45 connectors and a serial adapter:

TODO Picture of cables

Connect it to the upper port on the server, and use your favorite serial terminal software.

TODO Picture of port

### It's Alive! (hopefully)

The serial connections settings are the common `9600 bauds`, `no parity`, `one stop bit` and `full duplex` mode (should be the default of your prefered software).

Because I'm lazy, I'm using good old `screen` but you could use something else like `minicom`.

```shell
screen /dev/ttyUSB0
```

You should getting something like (when plugging-in the server), or at least a `lom>` prompt:

```shell
LOMlite starting up.

CPU type: H8/3437S, mode 3
Ram-test: 2048 bytes OK
Initialising i2c bus: OK
Searching for EEPROMs: 50(cfg) 
I2c eeprom @50: OK
i2c bus speed code 01... OK
Probing for lm80s: none
Probing for lm75s: 48
System functions: PSUs fans breakers rails gpio temps host CLI ebus clock 

LOMlite console
lom>
LOM event: +0h0m0s LOM booted
lom>
```

If your box came installed, it's possible you are seeing Open Firmware (the "Bios/UEFI" of these machines) or a Solaris serial prompt.

By default the Serial Port is shared between the LOM and the main server.

```
There are three prompts.
  ok>   -------------------- (normal prompt when the OS is not running)
  lom>  -------------------- (available whether OS is running or not)
  #     -------------------- (the OS prompt)

To move between the "ok>" prompt and the "lom>" prompt, type:
  ok> #.      There must be less than 1 second between the "#" and "."
  lom>        ------>      This is the prompt you get

To move between the "lom>" prompt and the "ok>" prompt type:
  lom> console
```

### Factory EEPROM Reset

I initially had issue getting to [Open Firmware](https://en.wikipedia.org/wiki/Open_Firmware).
In its past life, it seems this server was configured to not share LOM and tty onto the same Serial port.

I was getting LOM access via the upper port all right, but the Open Firmware/OS on lower Port remained silent.

```
lom> break
Console not shared.

lom> console -f
Console not shared.
```

I settled on attempting a factory reset, but it proved somewhat challenging. I tried to use procedures [like this one](https://dogemicrosystems.ca/pub/Sun/System_Handbook/Sun_syshbk_V3.4/collections/PROBLEMRESOLUTIONSURE/1-72-1018251.1-1.html), without luck.

I also tried using the `bootmode -u` and `console -f` flags, again, without luck.

I was about to give-up when I stubbled [uppon this email](https://marc.info/?l=classiccmp&m=123195610818394) from a former Sun employee.
(Thanks Mr. Andy for posting this on a random mailing 16 years ago, the Internet is truly amazing sometimes).

So, as indicated by this mail, I ran the following commands to reset the eeprom:

```shell
lom> set extra-cmds on

Extra commands are reserved for SUN service personnel.
Unauthorised use invalidates machine service warranty.

lom> eepromreset
lom> reset -l
```

And bingo, I was in buziness.

I was getting the `ok` prompt, and was able to switch between LOM and the actual server tty with the `#.` combo.

### Installation

TODO, rarp + tftp.
