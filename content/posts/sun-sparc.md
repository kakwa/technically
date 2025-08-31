+++
title = 'My Silly Sun Server'
date = 2025-08-27T19:01:49+02:00
draft = true
+++

# Links

- [Project's git (scripts & 3D models)](https://github.com/kakwa/silly-sunv100-server).
- [Sun's V100 Official documentation](https://dogemicrosystems.ca/pub/Sun/System_Handbook/Sun_syshbk_V3.4/Systems/SunFireV100/SunFireV100.html).
- [Sun's LOMLite2 official documenation](https://docs.oracle.com/cd/E19102-01/n20.srvr/806-7334-13/LW2+User.LOM.html)
- Eerie Linux's [blog post 1](https://eerielinux.wordpress.com/2019/09/22/a-sparc-in-the-night-sunfire-v100-exploration/) and [post 2](https://eerielinux.wordpress.com/2019/10/30/illumos-v9os-on-sparc64-sunfire-v100/) about his V100.
- [Obligatory Clabretro's video](https://www.youtube.com/watch?v=5OyGwbWKWZU).

# Obsolete Tech In A Modern Age

## Something Old Is New Again

One of my pet peeves is to bring new life into old hardware.

Here, I'm not thinking in a retro-computing kind of way, software is not exactly like fine wine in my opinion: it doesn't age well.

Also, old software tends to be isolated in its own bubble, amusing, but unless you are [G.R.R. Martin rocking along WordStar 4.0](https://www.youtube.com/watch?v=X5REM-3nWHg), that's not really useful.

I prefer the challenge of trying to install modern software on these antiquities, make them able to interact with the Worldwide Internet, and do something useful with them.

Sure, it will not run a k8s cluster, but these old machines generally still have enough oomph for lightweight use cases like, for example:

- Spotifyd/Webradio Receiver/MPD servers hooked to old analog Hi-Fi Systems.
- Basic Web Hosting
- Mail Server
- Test Machines
- Firewalls/Routers

## The Little Server That Could (Not)

Enter the Sun V100, the entry-level server from 2001 sold by Sun Microsystems.

It boasts impressive specs such as:
- UltraSPARC-IIe CUP @548MHz
- No GPU whatsoever (not great for AI, I guess :p)
- 2GB RAM (if maxed out)
- 2x 80GB IDE Hard Drives
- Two 100 Mbit/s NICs
- LOMlite Management over Serial + second Serial Port

In truth, this beast is a little asthmatic, but I find the SPARC CPU interesting, particularly for testing endianness and alignment issues.
And it doesn't need huge amounts of power (~15 Watts TDP) to run, unlike most servers from that period.

I bought this V100 about 15 years ago secondhand, but in truth, never did anything really useful with it.
While not as bad as other monsters from the era, it's still simply a bit too big and loud.
Consequently, it sat in my cupboard for ages, in the dark, lonely and unused, away from the information highways.

But let's try to change that and maybe learn a few things along the way.

## A Two-Front Project

So, yes, I aim to do something with this cute little server from another time.
Not very rational and somewhat challenging, yet fun... at least in my eyes.

But enough said! Now we need to address the two broad complaints we had about this relic:

1. Make this server way smaller and quieter
2. Find and install a modern OS + up-to-date software to make it useful

# The Hardware Side

## Starting Point & End Goal

This tiny server is well... a server. If it fits onto a small and standard 1U height (44.50mm), it's also kind of big in the other dimensions: 19"/482.60mm by 17.55"/445mm.

However, once inside, the content looks like this:

TODO photo inside of V100 CASE

We are in luck, this cute beast could probably be a lot more compact. In particular the main board, including the RAM sticks, is 250x190mm.
If we ditch the original (and noisy) Hard Drives & PSU, and cheat a little we could even make it fit into a 254mm(/10") case able to be used in these fancy small [10 inch racks](https://mini-rack.jeffgeerling.com/).

Aside from that, we also need to silence this small beast.

In particular we need to take care of these little bastards:

TODO photo small 40x40 FAN

Replacing these with Noctua fans could probably help.

## New Parts

To make it fit, I'm replacing the following parts:

* The original IDE HDs are too big & noisy, so I'm replacing them with a [SanDisk 32GB CF Card](https://shop.sandisk.com/products/memory-cards/cfast-cfexpress-compactflash/sandisk-extreme-compactflash?sku=SDCFXSB-032G-G46) + [adapter thingy](https://www.startech.com/en-us/hdd/35baycf2ide) (CF cards are generally pin-compatible with IDE, giving good odds of it working with decent performance).
* The original PSU is quite bulky, but relatively small at 80 Watts. So I will also try my luck with a [Pico PSU](https://www.rgeek.com/portfolio-item/rgeek-pico-dc-psu-rp-120lq-dc-12v-24pin-power-supply-module/) + external 12V Power Brick.
* Let's also try our luck with a GaN USB-C charger + [trigger board](https://www.aliexpress.com/p/tesla-landing/index.html?scenario=c_ppc_item_bridge&productId=1005004356272196&_immersiveMode=true&withMainCard=true&src=google&aff_platform=true&isdl=y). On paper, it could provide us with a great little PSU instead of a rather large and sketchy black brick from an unknown manufacturer.
* The original 40x40mm 12V fans are getting the [Noctua treatment](https://noctua.at/en/products/fan?size=2645&connector=10&voltage=12).

Note: I'm not doing this project to save money. Secondhand micro PCs like ThinkCentre Ms or RPi like SBC are cheaper.

## PSU

TODO

* Say it's standard ATX.
* PSA: Trigger Board + 12V -> not a given
* PSU might be a bit too weak.

## Modeling

TODO intro.

I'm a masochist, so FreeCAD it is. It enabled me to improve my CAD techniques and play with the new Assembly Workbench.

### Case

TODO

* Dimension choices
* Scanner technique for the back panel cutouts
* 2mm PMMA (?) -> too weak -> 3mm minimum
* Switch to 3mm + recess if necessary.

### Brackets

TODO

* Nut corner bracket -> bad idea
* Switch to inserts

### Bezel

TODO

* Start from Photo of V210 (prettier than V100)
* two Outlines: front + back
* lofting
* finishing features
* extend concept to other server fronts/bezels (Dell, HP, Fujitsu, IBM)

### Logo

TODO

* Take SVG (Wikipedia)
* Close path
* FreeCAD
* Print with filament change (M400).

# The Software Side

## Operating System Choice

The sad reality is SPARC is a dying architecture. So our choices, as of 2025, are limited:

* (Open)Solaris -> dead
* Illumos (OpenSolaris successor) -> [Support is being dropped](https://github.com/illumos/ipd/blob/master/ipd/0019/README.md)
* Linux -> SPARC64 is still supported by the kernel, but nearly no mainstream distribution supports it ([Debian unofficially](https://wiki.debian.org/Sparc64), and [Gentoo](https://wiki.gentoo.org/wiki/Project:SPARC)).
* FreeBSD -> Support dropped with [FreeBSD 13](https://www.freebsd.org/platforms/sparc/)

This leaves more or less two choices:

* [NetBSD](https://wiki.netbsd.org/ports/sparc64/)
* [OpenBSD](https://www.openbsd.org/sparc64.html)

Let's go with OpenBSD.

## LOMLite2

### Intro

LOM stands for Lights Out Management. Not sure if it fulfills the [IPMI](https://en.wikipedia.org/wiki/Intelligent_Platform_Management_Interface) spec, but it has the same role.

It's a small Baseboard Management Controller (BMC), similar to HP's iLO or Dell iDRAC, monitoring the hardware (fans, PSUs), setting the boot sequence, and of course, [turning it off and on again](https://www.youtube.com/watch?v=5UT8RkSmN4k).

On this V100, we have the LOMLite2 version, which is only accessible through Serial (bigger & newer servers, like V210s or T2000s, have ALOM & ILOM with network & telnet/ssh capabilities).

### Serial Cabling

To access LOM, you need one of these blue "Cisco Cable" with DB9 + RJ45 connectors and a serial adapter:

TODO Picture of cables

Connect it to the upper port on the server, and use your favorite serial terminal software.

TODO Picture of port

### It's Alive!

The serial connection settings are the common `9600 baud`, `no parity`, `one stop bit` and `full duplex` mode (should be the default of your preferred software).

Because I'm lazy, I'm using good old `screen` but you could use something else like `minicom`.

```shell
screen /dev/ttyUSB0
```

You should be getting something like (when plugging in the server), or at least a `lom>` prompt:

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

### Switching Between `ok>` & `lom>` Prompts

If your box came installed, it's possible you are seeing an Open Firmware (the "BIOS/UEFI" of these machines) or Solaris prompt.

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

I initially had issues getting to [Open Firmware](https://en.wikipedia.org/wiki/Open_Firmware).
In its past life, it seems this server was configured to not share LOM and tty on the same serial port.

I was getting LOM access via the upper port all right, but the Open Firmware/OS on the lower port remained silent.

```
lom> break
Console not shared.

lom> console -f
Console not shared.
```

I settled on attempting a factory reset, but it proved somewhat challenging. I tried to use procedures [like this one](https://dogemicrosystems.ca/pub/Sun/System_Handbook/Sun_syshbk_V3.4/collections/PROBLEMRESOLUTIONSURE/1-72-1018251.1-1.html), without luck.

I also tried using the `bootmode -u` and `console -f` flags, again, without luck.

I was about to give up when I stumbled [upon this email](https://marc.info/?l=classiccmp&m=123195610818394) from a former Sun employee.
(Thanks Mr. Andy for posting this on a random mailing list 16 years ago, the Internet is truly amazing sometimes).

So, as indicated by this mail, I ran the following commands to reset the eeprom:

```shell
lom> set extra-cmds on

Extra commands are reserved for SUN service personnel.
Unauthorised use invalidates machine service warranty.

lom> eepromreset

lom> reset -l
```

And bingo, I was in business.

I was getting the `ok` prompt, switch back and forth between `lom>` and `ok>`

However, when trying to `boot net`, I was getting:
```
ok boot net
Fast Data Access MMU Miss
```

The following reset seems to have solve the issue:
```
ok set-defaults
Setting NVRAM parameters to default values.
ok reset-all
```

## Network Install


Open Firmware on these machines is able to boot over the network a bit like PXE.

The major difference is the lack of DHCP support: it instead relies on rarp (static MAC -> IP mapping).

Also the netboot server needs to be on the same lan subnet (or plugged directly to) as our cute sun server.
And the netboot server must also be a tftp server hosting the boot file at a set location (derived from the IP
we give to our sun server)

### Netboot Server Setup - The Annoying Way

Let's setup a netboot server (Debian/Ubuntu based) as our Sunny God intended.

First, get a `root` terminal:

```shell
# pick your poison
sudo -i
# or
su -i
```

install the necessary software
```shell
apt install atftpd rarpd
```

```shell
# Set Server NIC & IPs
export BOOT_SERVER_NIC=enp0s25
export SUN_V100_IP=172.24.42.51

# Must be .150 (?)
export BOOT_SERVER_IP=172.24.42.150
```

Download & put the boot image in the correct TFTP location (IP Address in Hexa):
```shell
cd /srv/tftp/
wget https://technically.kakwalab.ovh/files/ofwboot.kakwa.test

# calculate the file name expected by Open Firmware (IP address in hexadecimal)
arg="`echo ${SUN_V100_IP} | sed 's/\./ /g'`"
img_name=`printf "%.2X%.2X%.2X%.2X\n" $arg`

# create hardlink to it
ln -f ofwboot.kakwa.test ${img_name}
```

Start the TFTP server:
```shell
systemctl start atftpd.service
```

Set the server IP:
```shell
ip addr add ${BOOT_SERVER_IP}/24 dev ${BOOT_SERVER_NIC}
```

Launch rarpd in the forground
```
rarpd -e -dv ${BOOT_SERVER_NIC}
```

From the LOM connected console, start the V100:
```shell
# Set bootmode to ok/ofw prompt
# Note: if notthing is installed, defaults to boot net anyway
lom> bootmode forth
lom> reset
# if necessary
lom> poweron
```

After a few minutes, you should get the following prompt:
```
LOM event: +3h36m30s host power on
Aborting startup sequence because of lom bootmode "forth".
Input and output on ttya.
Type  fexit  to resume normal startup sequence.
Type  help  for more information
ok 
```

From the `ok prompt`, enter the following to initiate the Netbooting
```
ok boot net
Timeout waiting for ARP/RARP packet
```

You should see log messages likes:
```shell
rarpd[16222]: RARP request from 00:03:ba:5b:ae:b3 on enp0s25
rarpd[16222]: not found in /etc/ethers
```

```shell
# Replace with your MAC address
export SUN_V100_MAC="00:03:ba:5b:ae:b3"

# Normalize MAC (uppercase, no colons)
MAC_UPPER=$(echo "$SUN_V100_MAC" | tr '[:lower:]' '[:upper:]')
MAC_NOPUNCT=$(echo "$MAC_UPPER" | tr -d ':')

# Generate a hostname for rarp & ethers/hosts mapping
# note: could be any name, just avoid collisions
HOSTNAME="sparc-${MAC_NOPUNCT}"

# Make sure ethers file exists
touch /etc/ethers

# Add to /etc/ethers if not already present
grep -q -F "$MAC_UPPER $HOSTNAME" /etc/ethers || \
    echo "$MAC_UPPER $HOSTNAME" | sudo tee -a /etc/ethers

# Add to /etc/hosts if not already present
grep -q -F "$SUN_V100_IP $HOSTNAME" /etc/hosts || \
    echo "$SUN_V100_IP $HOSTNAME" | sudo tee -a /etc/hosts
```

```shell
Timeout waiting for ARP/RARP packet
18e200 
```

It works! Not sure if we have created Paradise or Hell however...

### Netboot Server Setup - The Masochist Way

In truth, I'm atheist, I don't believe in God, even the Sunnier ones.

And I find this setup really messy, and I'm kind of sorry if you read
through it... or worse, if you actually tried to implement it. Also, spoiler, 
for our NetBSD/OpenBSD netbooting target, even more similar setup is likely required.

So I've committed blasphemy and created my [own, all in one, Golang simple netboot server](https://github.com/kakwa/ofw-install-server) directly providing the RARP + TFTP combo (plus, spoiler, also BOOTP + NFSv2).

I must confess I've sinned even more by letting the twin d(a)emons
Claude & ChatGPT do most of work, specially the network protocols implementation.
So, expect a few bugs.

On top of that, this netboot server is, by design, very limited.
It only provides a single bootstrap path/set of boot files
and should only be used within dedicated lan segment.
Don't rely on this server if you are still bootstrapping hundreds of SPARC servers like in the good old [Jumpstart](https://docs.oracle.com/cd/E26505_01/html/E28039/customjumpsample-5.html#scrolltoc) days.
However for the onezzies/twozzies like here, let the temptation win you over, and give it a try.

But enough talk, here how to setup this simplified netboot server.

Building the server:
```shell
# build dependencies
sudo apt install golang git make

# clone sources
git clone https://github.com/kakwa/ofw-install-server
cd ofw-install-server/
make

# check the help
./ofw-install-server -h
```

Start the server with the TFTP & RARP module enabled:

```shell
# NIC & IP to use for the boot server
export BOOT_SERVER_NIC=enp0s25
export BOOT_SERVER_IP=172.24.42.150
sudo ip addr add ${BOOT_SERVER_IP}/24 dev ${BOOT_SERVER_NIC}

# Recover something to boot:
wget https://technically.kakwalab.ovh/files/ofwboot.kakwa.test

# Start the server
sudo ./ofw-install-server -iface ${BOOT_SERVER_NIC}  -rarp \
    -tftp -tftp-file ./ofwboot.kakwa.test
```
