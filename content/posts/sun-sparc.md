+++
title = 'My Silly Sun Server'
date = 2025-08-27T19:01:49+02:00
draft = true
+++

# Obsolete Tech In A Modern Age

## Something Old Is New Again

One of my pet peeves is to bring new life into old hardware.

Here, I'm not thinking in a retro-computing kind of way, software is not exactly like fine wine in my opinion: it usually doesn't age well.

Also, old software tends to be isolated in its own bubble, amusing, but unless you are [G.R.R. Martin rocking along WordStar 4.0](https://www.youtube.com/watch?v=X5REM-3nWHg), that's not really useful.

I prefer the challenge of trying to install modern software on these antiquities, make them able to interact with the internet, and do something useful with them.

Sure, it will not run a k8s cluster, but these old machines generally still have enough oomph for lightweight use cases like, for example:

- MPD/Music server (in an analog Hi-Fi setup).
- Basic Web Hosting (Blog, RSS aggregator, etc)
- Mail Server
- Test/Lab Machines

## The Little Server That Could (Not)

Enters the Sun V100, the 2001 entry-level server from Sun Microsystems.

It boasts impressive specs such as:
- UltraSPARC-IIe CPU @548MHz
- No GPU whatsoever (not great for AI, I guess :p)
- 2GB RAM (if maxed out)
- 2 x 80GB IDE Hard Drives
- Two 100 Mbit/s NICs
- LOMlite Management over Serial
- Second Serial Port

In truth, this beast is a little asthmatic, it already was at the time, but I find the SPARC CPU interesting, particularly for testing endianness and alignment issues.
And it doesn't need huge amounts of power (~15W TDP) to run, unlike most servers from that period.

I bought this V100 about 15 years ago secondhand, played a bit, but never did anything really useful with it.
While not as bad as other monsters from the era, it's simply a bit too big and loud.
Consequently, it sat in my cupboard for ages, in the dark, lonely and unused, away from the information highways.

But let's try to change that and maybe learn a few things along the way.

## A Two-Front Project

So, yes, I aim to do something with this cute little server from another time.
Not very rational and somewhat challenging, yet fun... at least in my eyes.

But enough said! Now we need to address the two broad complaints we had about this relic:

1. Make this server way smaller and quieter
2. Find and install a modern OS + up-to-date software to make it useful

# The Hardware Side

## The Goals

### Make It Smaller

This tiny server is well... a server. If it fits onto a small and standard 1U height (44.50 mm), it's also kind of big in the other dimensions: 19"/482.60 mm by 17.55"/445 mm.

Fortunately, once opened, the server looks like that:

{{< figure src="/images/sun-inside.jpg" alt="Sun Fire V100 opened showing mainboard and layout in original case" caption="Sun Fire V100 with top cover removed – original layout" >}}

We are in luck, this cute beast could probably be a lot more compact.

In particular the main board, including the RAM sticks, is 250×190 mm.
If we ditch the original (and noisy) hard drives and PSU, plus, if we cheat a little, we could even make it fit into a 254 mm (10") case able to be used in one of these fancy small [10‑inch racks](https://mini-rack.jeffgeerling.com/).

Given these racks are also quite short, 300 mm and often less, this gives goal number one: make it fit into 254x190-300x44mm.

And also, if possible, retain the original "Sun Vibe".

### Quieter

Aside from that, we also need to silence this small beast.

In particular we need to take care of these little bastards:

{{< figure src="/images/sun-fan.jpg" alt="Sun V100 40×40 mm 12 V fan" caption="Original 40×40 mm 12 V fan" >}}

And also their lord and master:

TODO pic CPU fan.

But here again, we have options, especially the one beginning with an 'N'.

I'm aiming for a noise level in the low thirties in terms of DBs, aka something you don't really notice unless you really are paying attention. It should also remain properly cooled and with no alarm LED being triggered.

That's goal number two.

## New Parts

To make it fit, I'm replacing the following parts:

* The original IDE HDs are too big & noisy, so I'm replacing them with a [SanDisk 32GB CF Card](https://shop.sandisk.com/products/memory-cards/cfast-cfexpress-compactflash/sandisk-extreme-compactflash?sku=SDCFXSB-032G-G46) + [adapter thingy](https://www.startech.com/en-us/hdd/35baycf2ide) (CF cards are generally pin-compatible with IDE, giving good odds of it working with decent performance).
* The original PSU is quite bulky, but relatively small at 80 W. So I will also try my luck with a [Pico PSU](https://www.rgeek.com/portfolio-item/rgeek-pico-dc-psu-rp-120lq-dc-12v-24pin-power-supply-module/) + external 12 V power brick.
* Let's also try our luck with a GaN USB-C charger + [trigger board](https://www.aliexpress.com/p/tesla-landing/index.html?scenario=c_ppc_item_bridge&productId=1005004356272196&_immersiveMode=true&withMainCard=true&src=google&aff_platform=true&isdl=y). On paper, it could provide us with a great little PSU instead of a rather large and sketchy black brick from an unknown manufacturer.
* The original 40×40 mm 12 V fans are getting the [Noctua treatment](https://noctua.at/en/products/fan?size=2645&connector=10&voltage=12).

I will also redesign a new and far more compact case for it.

Note: I'm not doing this project to save money.
If you want a cheap option, secondhand micro PCs from Dell HP or Lenovo, or simply a Raspberry Pies, are better options.

## PSU

The Sun V100 uses an 80 Watts PSU Following the ATX standard. It has the usual Molex IDE and 20 Pins connectors of the PCs from the era.

It could probably be made quieter with the Noctua treatment, but it would not fix it's other issue: it's simply too big.

So to replace it. I tried my luck with a 120W PicoPSU board and, at first, also with USB-C trigger board and power brick.

But unfortunately, I didn't read the fine prints close enough. While USB-C Power Delivery (TODO wiki) does have a 12V level, it's optional and seems to not be commonly implemented, at least on the fully representative size of 2 PSUs I have on hands.

And worse, despite being set at 12V, when I plugged the trigger board to the PSU, it started outputing 15V... Lesson learned: always check the voltage with these boards.

So it was back to a cheap noname 12V brick. At least this one is rated for 120W and is not bellow the original 80W unlike the USB C option at 60W would have been.

But in truth, this option is not quite right either. The PSU too frequently fails to start, and I have to cycle unplug/plug several times to get the server to start. Maybe the PicoPSU is a bit to light and cannot deliver the starting spike, but I lack the skills and equipment to properly diagnos this one.

I might try my luck with another PicoPSU, this time, a multi-voltage one and explore the USB-C option again. I would really if the option worked, good and compact GaN USB-C PSUs are quite easy to get these days.

But for now, let's forge ahead.

## Modeling

### A Caveman And A CAD

I'm a masochist and a fervent OSS believer.
So FreeCAD it is... even if this option is let's say frustrating...

In truth it's the only CAD software I ever used and let's say I've never really gone beyond the most basic features. I'm really CAD illiterate, brute forcing my way to a half-assed model like a caveman.

Actually, this project is also an excuse/motivation to properly learn CAD beyond the caveman's usage I had until now.

### Case

TODO

* Dimension choices
* Scanner technique for the back panel cutouts
* 2 mm PMMA (?) -> too weak -> 3 mm minimum
* Switch to 3 mm + recess if necessary.

{{< figure src="/images/sun-cracked-2mm-pmma.jpg" alt="Cracked 2mm PMMA panel" caption="2 mm PMMA cracked – too flimsy" >}}

### Brackets

TODO

* Nut corner bracket -> bad idea
* Switch to inserts

### Bezel

TODO

* Start from Photo of V210 (prettier than V100)
* Two outlines: front + back
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

## LOMlite2

### Intro

LOM stands for Lights Out Management. Not sure if it fulfills the [IPMI](https://en.wikipedia.org/wiki/Intelligent_Platform_Management_Interface) spec, but it has the same role.

It's a small Baseboard Management Controller (BMC), similar to HP's iLO or Dell iDRAC, monitoring the hardware (fans, PSUs), setting the boot sequence, and of course, [turning it off and on again](https://www.youtube.com/watch?v=5UT8RkSmN4k).

On this V100, we have the LOMlite2 version, which is only accessible through serial (bigger & newer servers, like V210s or T2000s, have ALOM & ILOM with network & telnet/ssh capabilities).

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

[Open Firmware](https://github.com/openbios/openfirmware) is the Forth-powered (a fun little language) boot firmware used by Sun servers and other non‑x86 platforms from that period, like PowerPC Macs and IBM POWER servers.
FYI, Sun had its own implementation: [OpenBoot](https://github.com/openbios/openboot).

### Useful Commands

Here are a few useful commands:

Main help:
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

Sub-help (note: need to use lowercase):
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

List device aliases (boot devices):
```shell
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

Get the current environment variables:
```shell
ok printenv

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

Set the boot device (persistent):
```shell
ok setenv boot-device disk0

boot-device =         disk0

ok reset
```

One-time boot of another device:

```shell
ok boot net
```


## Open Firmware Netboot Server


Open Firmware on these machines is able to boot over the network a bit like PXE.

{{< figure src="/images/sun-install-setup.jpg" alt="Network install setup with cables" caption="Ad‑hoc netboot lab setup for Open Firmware testing" >}}

The major difference is the lack of DHCP support: it instead relies on RARP (static MAC -> IP mapping).

Also, the netboot server needs to be on the same LAN subnet (or plugged directly into) as our cute Sun server.
And the netboot server must also be a TFTP server hosting the boot file at a set location (derived from the IP
we give to our Sun server)

### Netboot Server Setup - The Annoying & Legacy Way

Let's set up a netboot server (Debian/Ubuntu based) as our Sunny God intended.

First, get a `root` terminal:

```shell
# pick your poison
sudo -i
# or
su -
```

Install the necessary software:
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

Launch rarpd in the foreground:

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

From the `ok>` prompt, enter the following to initiate netbooting:
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
# Note: could be any name, just avoid collisions
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

I find this setup really messy, and I'm kind of sorry if you read
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

But enough about why my masochism tendencies led me to develop a full netboot server for such a dead platform.
Here is how to set up this damn piece of software.

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

# Start the server with the Debian boot image
sudo ./ofw-install-server -iface ${BOOT_SERVER_NIC}  -rarp \
    -tftp -tftp-file ./boot-debian-6.img
```

From there, you should be able to install Debian 6, albeit with a few headaches like pointing to the archive.debian.org repository or handling expired GPG keys.

Note that there is a Debian 7 version of the installer, but it kernel-oopsed on me.

### Netbooting OpenBSD/NetBSD

#### More Netboot Setup...

For [NetBSD](https://www.netbsd.org/docs/network/netboot/)/[OpenBSD](https://ftp.openbsd.org/pub/OpenBSD/7.7/sparc64/INSTALL.sparc64), this is "slightly" more complex than the Debian case:
* Open Firmware first RARPs & TFTP‑loads a tiny second‑stage loader (`ofwboot.net`).
* That loader then speaks BOOTPARAMS and/or BOOTP to learn its IP and the NFS root path
* It then mounts that root over good old NFSv2,
* And finally [loads the kernel & ramdisk](https://www.netbsd.org/docs/network/netboot/local.install.html#diskimage) from there.

Yes: RARP + TFTP + BOOTP + NFSv2 on the same poor L2 segment.

Oh, and to add a bit of fun, NFSv2 is kind of obsolete (removed from Debian since `2022/03/13` & `nfs-utils (1:2.6.1-1~exp1)`):

But once again, with a bit of vibe coding and a few tweaks, we are able to add these services to our custom netboot server.

But at least, we are skipping the BOOTPARAMS RPC bits. According to the `diskless` documentation from OpenBSD and the source code of `ofwboot.net`, BOOTP could be replaced by `bootparamd`. It's still the first option used by OpenBSD’s `ofwboot.net` and I tried to make it work, but I finally gave up.

I also tried to implement a version of `ofwboot.net` using the same RARP + TFTP protocols as the first stage, but without luck. If you want to give it a try, the code is available [here](https://github.com/kakwa/silly-sunv100-server/tree/main/ofwboot) and can be built under Linux (see README.md instructions).


#### OpenBSD Install

In the end, I opted for NetBSD so I didn't fully install OpenBSD. But given I managed to start the installer, I'm fairly confident I would be able to install it if needed.

Also, just for kicks, given all the services we have in our netboot server, I've taken the liberty to add one last bit: an HTTP server to serve an OpenBSD [autoinstall](https://man.openbsd.org/autoinstall.8) configuration file.

Lastly, it's worth mentioning that the OpenBSD version of `ofwboot.net` gave me quite a lot of headaches. I never quite managed to pass it the NFS server IP and file path/name given by BOOTP (typo? bug? wrong BOOTP option? magic values?).

So in the end, I chose to use the NetBSD's `ofwboot.net` version for both NetBSD and OpenBSD.

FYI, both versions come from the same source, but the NetBSD one seems marginally more modern.

```shell
# If you want to try your luck with the OpenBSD ofwboot.net
# wget https://ftp.openbsd.org/pub/OpenBSD/7.7/sparc64/ofwboot.net

# Recover bootloader from NetBSD
wget https://cdn.netbsd.org/pub/NetBSD/NetBSD-10.1/sparc64/installation/netboot/ofwboot.net
# Recover OpenBSD install RamDisk
wget https://ftp.openbsd.org/pub/OpenBSD/7.7/sparc64/bsd.rd
# Recover an autoinstall file
wget https://raw.githubusercontent.com/kakwa/silly-sun-server/refs/heads/main/misc/openbsd-autoinstall.conf
```

Start the install server:

```shell
sudo ./ofw-install-server -rarp -tftp -tftp-file ./ofwboot.net -bootp -nfs -nfs-file ./bsd.rd -http -http-file ./openbsd-install.conf 
```

#### NetBSD Install

So in the end, I finally settled on installing NetBSD:

Recover & prepare the files:

```shell
wget https://cdn.netbsd.org/pub/NetBSD/NetBSD-10.1/sparc64/installation/netboot/ofwboot.net
wget https://cdn.netbsd.org/pub/NetBSD/NetBSD-10.1/sparc64/binary/kernel/netbsd-INSTALL.gz
gunzip netbsd-INSTALL.gz
```

Start the server:

```shell
sudo ./ofw-install-server -rarp -tftp -tftp-file ./ofwboot.net -bootp -nfs -nfs-file ./netbsd-INSTALL
```

TODO mention ofwboot seems to support TFTP?

#### One Last Bit

And then I just did this final tweak to make it boot on disk persistently:

```shell
setenv boot-device disk0
reset
```
Not sure why the default boot-device config (`disk net`) didn't work. Maybe the `disk` dev alias was missing?

But frankly, by this point, I could not care less.

This cute little Sun server is finally working!


# Wrapping up

## A Bit of NetBSD SysAdmin

TODO this is not a blog post about NetBSD administration, but here are a few useful commands:

### SSHD

Service /etc/rc.conf

SSH:
```
echo "sshd=YES" >>/etc/rc.conf
/etc/rc.d/sshd start
```

### NTP

NTP (got stuck on weird SSL errors, server in 2024... certificate not yet valid, `openssl s_client cdn.netbsd.org:443`)
```
ntpdate 2.netbsd.pool.ntp.org
echo "ntpd=YES" >>/etc/rc.conf
/etc/rc.d/ntpd start
```

### Hardware Monitoring

```shell
netra-x1# envstat
               Current  CritMax  WarnMax  WarnMin  CritMin  Unit
[admtemp0]
   internal:    37.000   95.000                    -55.000  degC
   external:    58.000  105.000                    -55.000  degC
[lom0]
  Fault LED:     FALSE
     Alarm1:     FALSE
     Alarm2:     FALSE
     Alarm3:      TRUE
```

### Getting A Package Manager

```
pkg_add https://cdn.NetBSD.org/pub/pkgsrc/packages/NetBSD/`uname -m`/`uname -r`/All/pkgin
```

```
pkgin update
```

```
pkgin search neovim
```

# Links

- [Project's git (scripts & 3D models)](https://github.com/kakwa/silly-sunv100-server).
- [Sun's V100 Official documentation](https://dogemicrosystems.ca/pub/Sun/System_Handbook/Sun_syshbk_V3.4/Systems/SunFireV100/SunFireV100.html).
- [Sun's LOMlite2 official documentation](https://docs.oracle.com/cd/E19102-01/n20.srvr/806-7334-13/LW2+User.LOM.html)
- Eerie Linux's [blog post 1](https://eerielinux.wordpress.com/2019/09/22/a-sparc-in-the-night-sunfire-v100-exploration/) and [post 2](https://eerielinux.wordpress.com/2019/10/30/illumos-v9os-on-sparc64-sunfire-v100/) about his V100.
- [Obligatory Clabretro's video](https://www.youtube.com/watch?v=5OyGwbWKWZU).

# Conclusion

> TODO Long Project
> Significantly improved CAD skills
> Side Projects (printers)
> Fancy Deploy server

TODO > Put to good use, personal stuff... but also fitting to host Sun docs.


