+++
title = 'My Silly Sun Server'
date = 2025-08-27T19:01:49+02:00
draft = true
+++

# Links

- [Project's git (scripts & 3D models)](https://github.com/kakwa/silly-sunv100-server).
- [Sun's V100 Official documentation](https://dogemicrosystems.ca/pub/Sun/System_Handbook/Sun_syshbk_V3.4/Systems/SunFireV100/SunFireV100.html).
- [Sun's LOMLite2 official documentation](https://docs.oracle.com/cd/E19102-01/n20.srvr/806-7334-13/LW2+User.LOM.html)
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
- UltraSPARC-IIe CPU @548MHz
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

### Smaller

This tiny server is well... a server. If it fits onto a small and standard 1U height (44.50mm), it's also kind of big in the other dimensions: 19"/482.60mm by 17.55"/445mm.

Fortunately, once opened, the server looks like that:

{{< figure src="/images/sun-inside.jpg" alt="Sun Fire V100 opened showing mainboard and layout in original case" caption="Sun Fire V100 with top cover removed – original layout" >}}

We are in luck, this cute beast could probably be a lot more compact.

In particular the main board, including the RAM sticks, is 250x190mm.
If we ditch the original (and noisy) Hard Drives & PSU, and cheat a little we could even make it fit into a 254mm(/10") case able to be used in these fancy small [10 inch racks](https://mini-rack.jeffgeerling.com/).

### Quieter

Aside from that, we also need to silence this small beast.

In particular we need to take care of these little bastards:

{{< figure src="/images/sun-fan.jpg" alt="Sun V100 40x40mm 12V fan" caption="Original 40×40 mm 12V fan" >}}

But here again, we have options, specially the one beginning with an 'N'.

## New Parts

To make it fit, I'm replacing the following parts:

* The original IDE HDs are too big & noisy, so I'm replacing them with a [SanDisk 32GB CF Card](https://shop.sandisk.com/products/memory-cards/cfast-cfexpress-compactflash/sandisk-extreme-compactflash?sku=SDCFXSB-032G-G46) + [adapter thingy](https://www.startech.com/en-us/hdd/35baycf2ide) (CF cards are generally pin-compatible with IDE, giving good odds of it working with decent performance).
* The original PSU is quite bulky, but relatively small at 80 Watts. So I will also try my luck with a [Pico PSU](https://www.rgeek.com/portfolio-item/rgeek-pico-dc-psu-rp-120lq-dc-12v-24pin-power-supply-module/) + external 12V Power Brick.
* Let's also try our luck with a GaN USB-C charger + [trigger board](https://www.aliexpress.com/p/tesla-landing/index.html?scenario=c_ppc_item_bridge&productId=1005004356272196&_immersiveMode=true&withMainCard=true&src=google&aff_platform=true&isdl=y). On paper, it could provide us with a great little PSU instead of a rather large and sketchy black brick from an unknown manufacturer.
* The original 40x40mm 12V fans are getting the [Noctua treatment](https://noctua.at/en/products/fan?size=2645&connector=10&voltage=12).

Note: I'm not doing this project to save money.
If you want a cheap option, secondhand micro PCs (ex: ThinkCentre Ms) or RPi like SBC are the way to go.

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

{{< figure src="/images/sun-cracked-2mm-pmma.jpg" alt="Cracked 2mm PMMA panel" caption="2 mm PMMA cracked – too flimsy" >}}

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

{{< figure src="/images/sun-logo-3dprint.jpg" alt="3D printed Sun logo" caption="3D‑printed Sun logo with filament color change" >}}

### Final Result

{{< figure src="/images/sun-front-opened.jpg" alt="Sun Fire V100 Custom Tiny" caption="Sun Tiny Custom Case" >}}


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

## LOMLite2

### Intro

LOM stands for Lights Out Management. Not sure if it fulfills the [IPMI](https://en.wikipedia.org/wiki/Intelligent_Platform_Management_Interface) spec, but it has the same role.

It's a small Baseboard Management Controller (BMC), similar to HP's iLO or Dell iDRAC, monitoring the hardware (fans, PSUs), setting the boot sequence, and of course, [turning it off and on again](https://www.youtube.com/watch?v=5UT8RkSmN4k).

On this V100, we have the LOMLite2 version, which is only accessible through Serial (bigger & newer servers, like V210s or T2000s, have ALOM & ILOM with network & telnet/ssh capabilities).

### Serial Cabling

To access LOM, you need one of these blue "Cisco cable" with DB9 + RJ45 connectors and a serial adapter:

{{< figure src="/images/sun-cable-serial-usb.jpg" alt="DB9 to RJ45 console cable with USB serial adapter" caption="Blue Cisco console cable with USB serial adapter" >}}

Connect it to the upper port on the server, and use your favorite serial terminal software.

{{< figure src="/images/sun-serial-port.jpg" alt="Sun V100 RJ45 serial console port" caption="Upper RJ45 serial console (LOM) on the Sun V100 rear panel" >}}

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

```shell
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

I was getting the `ok>` prompt and could switch back and forth between `lom>` and `ok>`

However, when trying to `boot net`, I was getting:

```shell
ok boot net
Fast Data Access MMU Miss
```

The following reset seems to have solved the issue:

```shell
ok set-defaults
Setting NVRAM parameters to default values.
ok reset-all
```

## Open Firmware

TODO presentation & link.

### Usefull Comands

TODO, explainations

```shell
ok help

Enter 'help command-name' or 'help category-name' for more help
(Use ONLY the first word of a category description) 
Examples:  help select   -or-   help line
    Main categories are: 
[...]
System and boot configuration parameters
[...]
nvramrc (making new commands permanent)
```

Sub-help (note: need to lower case)
```shell
ok help system

devalias                 - Display all device aliases
devalias <name> <value>  - Create or change a device alias
printenv      Show all configuration parameters
                numbers are shown in decimal
setenv <name> <value>   Change a configuration parameter
         changes are permanent but only take effect after a reset
   Examples:
     setenv input-device ttya         - use ttya input next time
     setenv screen-#rows 0x1e         - use 30 rows of display ( hex 1e )
     setenv boot-device net           - specify network as boot device
     setenv auto-boot? false          - disable automatic boot
set-defaults    Revert to factory configuration
See also: nvramrc
```

list dev aliases (boot device):
```
ok devalias

dload                    /pci@1f,0/ethernet@c:,
net0                     /pci@1f,0/ethernet@c
net                      /pci@1f,0/ethernet@c
cdrom                    /pci@1f,0/ide@d/cdrom@3,0:f
disk3                    /pci@1f,0/ide@d/disk@3,0
disk2                    /pci@1f,0/ide@d/disk@2,0
disk1                    /pci@1f,0/ide@d/disk@1,0
disk0                    /pci@1f,0/ide@d/disk@0,0
[...]
```

get the current env var
```
printenv
auto-boot?            true                           true
watchdog-reboot?      false                          false
diag-file                                            
diag-device           net                            net
boot-file                                            
boot-device           disk0                          disk net
local-mac-address?    false                          false
net-timeout           0                              0
ansi-terminal?        true                           true
screen-#columns       80                             80
screen-#rows          34                             34
silent-mode?          false                          false
```

Change the boot device (permanent)
```
ok setenv boot-device disk0

boot-device =         disk0

ok reset
```

Boot on another device

```
ok boot net
```


## Open Firmware Netboot Server


Open Firmware on these machines is able to boot over the network a bit like PXE.

{{< figure src="/images/sun-install-setup.jpg" alt="Network install setup with cables" caption="Ad‑hoc netboot lab setup for Open Firmware testing" >}}

The major difference is the lack of DHCP support: it instead relies on RARP (static MAC -> IP mapping).

Also the netboot server needs to be on the same LAN subnet (or plugged directly to) as our cute sun server.
And the netboot server must also be a TFTP server hosting the boot file at a set location (derived from the IP
we give to our sun server)

### Netboot Server Setup - The Annoying & Legacy Way

Let's set up a netboot server (Debian/Ubuntu based) as our Sunny God intended.

First, get a `root` terminal:

```shell
# pick your poison
sudo -i
# or
su -i
```

Install the necessary software
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

Download & put the boot image in the correct TFTP location (IP address in hex):
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

Launch rarpd in the foreground

```shell
rarpd -e -dv ${BOOT_SERVER_NIC}
```

From the LOM connected console, start the V100:
```shell
# Set bootmode to ok/ofw prompt
# Note: if nothing is installed, defaults to boot net anyway
lom> bootmode forth
lom> reset
# if necessary
lom> poweron
```

After a few minutes, you should get the following prompt:
```shell
LOM event: +3h36m30s host power on
Aborting startup sequence because of lom bootmode "forth".
Input and output on ttya.
Type  fexit  to resume normal startup sequence.
Type  help  for more information
ok 
```

From the `ok>` prompt, enter the following to initiate the netbooting
```shell
ok boot net
Timeout waiting for ARP/RARP packet
```

You should see log messages like:
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
Boot device: /pci@1f,0/ethernet@c  File and args: 
27a00 >> kakwa's OFW BOOT 1.29
Using RARP protocol: ip address: 172.24.42.1, netmask: 255.255.0.0, server: 172.24.42.150
TFTP IP address: 172.24.42.150
Fast Data Access MMU Miss
```

It works! Not sure if we have created Paradise or Hell however...

### Netboot Server Setup - The Modern & Masochist Way

In truth, I'm an atheist, I don't believe in God, even the Sunnier ones.

And I find this setup really messy, and I'm kind of sorry if you read
through it... or worse, if you actually tried to implement it. Also, spoiler, 
for our NetBSD/OpenBSD netbooting target, even more similar setup is likely required.

So I've committed blasphemy and created my [own, all-in-one, Golang simple netboot server](https://github.com/kakwa/ofw-install-server) directly providing the RARP + TFTP combo (plus, spoiler, also BOOTP + NFSv2).

I must confess I've sinned even more by letting the twin d(a)emons
Claude & ChatGPT do most of the work, especially the network protocol implementation.
So, expect a few bugs.

On top of that, this netboot server is, by design, very limited.
It only provides a single bootstrap path/set of boot files
and should only be used within a dedicated LAN segment.
Don't rely on this server if you are still bootstrapping hundreds of SPARC servers like in the good old [Jumpstart](https://docs.oracle.com/cd/E26505_01/html/E28039/customjumpsample-5.html#scrolltoc) days.
However for the onesies/twosies like here, let the temptation win you over, and give it a try.

But enough about why my masochism tendancies led me to develop a full netboot server for such a dead platform.
here is how to set up this damn piece of software.

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

# Retrieve something to boot:
wget https://technically.kakwalab.ovh/files/ofwboot.kakwa.test

# Start the server
sudo ./ofw-install-server -iface ${BOOT_SERVER_NIC}  -rarp \
    -tftp -tftp-file ./ofwboot.kakwa.test
```

## Netbooting & Installing an OS

### Netbooting Debian 6

Just for reference, here is how to get and netboot the last working Debian installer:

```shell
# Recover the boot.img file from the netboot installer `.deb` package.
wget https://archive.debian.org/debian/pool/main/d/debian-installer-netboot-images/debian-installer-6.0-netboot-sparc_20110106.squeeze4.b6_all.deb
mkdir debtmp && dpkg-deb -x *.deb debtmp/
find ./debtmp/ -name 'boot.img' -exec cp {} ./boot-debian-6.img \;
rm -rf -- debian-installer-6.0-netboot-sparc_20110106.squeeze4.b6_all.deb ./debtmp/

# Start the server with the debian boot image
sudo ./ofw-install-server -iface ${BOOT_SERVER_NIC}  -rarp \
    -tftp -tftp-file ./boot-debian-6.img
```

From there, you should be able to install Debian 6, albeit with a few headaches like pointing to the archive.debian.org repository or handling expired GPG keys.

Note that there is a Debian 7 version of the installer, but it kernel-oopsed on me.

### Netbooting OpenBSD/NetBSD

#### More Netboot Setup...

TODO

Yay... More if this stuff.

link to diskless.

Mention bootparamd -> never quite managed to make to make it work.

Mention Bootp/DHCP.

Mention NFSv2 (and its deprecation).

Mention -> more service added to our netboot server

Mention ofwboot.net being a bit finiky, specially the OpenBSD one, while the NetBSD one seems a bit more modern.
-> use the ofwboot.net for both.

Link to the Source of the OpenBSD on (mention attempt to make it TFTP only), mention the netbsd one might do it be not able to manage it.

```
sudo ./ofw-install-server -rarp -tftp -tftp-file ./ofwboot.net -bootp -nfs -nfs-file ./netbsd
```

```
sudo ./ofw-install-server -rarp -tftp -tftp-file ./ofwboot.net -bootp -nfs -nfs-file ./bsd.rd -http -http-file ./openbsd-install.conf 
```

Mention OpenBSD auto_install file & server (at this point, adding http on 80 is a not much).


Usefull:

```
setenv boot-device disk0
reset
```

# Few bits of NetBSD

TODO document how to setup a basic web hosting & reverse & certbot & install packages.

Show it's serving the SUN documenation.
