+++
title = 'My Silly Sun Server - The Hardware'
date = 2025-09-20T19:01:49+02:00
draft = true
summary = 'Recommissioning an Old Sun V100 Server - The Hardware'
+++

# Hardware Rework

TODO remind goals + Small Intro

## New Parts

Here is the shopping list to reach our goals:

* The original IDE HDs are too big & noisy, so I'm replacing them with a [SanDisk 32GB CF Card](https://shop.sandisk.com/products/memory-cards/cfast-cfexpress-compactflash/sandisk-extreme-compactflash?sku=SDCFXSB-032G-G46) + [adapter thingy](https://www.startech.com/en-us/hdd/35baycf2ide) (CF cards are generally pin-compatible with IDE, giving good odds of it working with decent performance).
* The original PSU is quite bulky, but relatively small at 80 W. So I will also try my luck with a [PicoPSU](https://www.rgeek.com/portfolio-item/rgeek-pico-dc-psu-rp-120lq-dc-12v-24pin-power-supply-module/) + external 12 V power brick.
* Let's also try our luck with a [GaN USB-C charger](https://www.anker.com/products/b2679-nano-100w-usb-c-charger) + [USB-C PD trigger board](https://aliexpress.com/item/1005004356272196.html) + [Wide Input 12-25V PicoPSU](https://www.mini-itx.com/~picoPSU-120-WI-25). On paper, it could provide us with a great little PSU instead of a rather large and sketchy black brick from an unknown manufacturer.
* The original 40×40 mm 12 V fans are getting the [Noctua treatment](https://noctua.at/en/products/fan/nf-a4x20-flx).

I will also redesign a new and far more compact case for it.

And yes, it’s expensive. But this project isn’t about saving money.
If you do want a cheap option, you’re much better off with a second-hand micro PC from Dell/HP/Lenovo, or even an ARM SBC: cheaper, more reliable, more energy-efficient, and far more powerful.

## PSU

The Sun V100 uses an 80 Watts PSU. It has the usual Molex IDE and 20 Pins ATX connectors of the PCs from its era.

While it could probably be made quieter with the Noctua treatment, but it would not fix it's other issue: it's simply too big.

So to replace it. I tried my luck with a 120W PicoPSU board and, at first, also with USB-C trigger board and power brick.

But unfortunately, I didn't read the fine prints close enough. While [USB-C Power Delivery](https://en.wikipedia.org/wiki/USB_hardware#USB_Power_Delivery) does have a 12V level, it's optional and seems to not be commonly implemented, at least on the fully representative size of 2 PSUs I have on hands.

And worse, despite being set at 12V, when I plugged the trigger board to the PSU, it started outputting 15V... Lesson learned: always check the voltage with these boards.

So it was back to a cheap noname 12V brick. At least this one is rated for 120W and is not bellow the original 80W, unlike the USB-C option at 60W would have been.

But the 12V brick option is not quite right either. The server frequently fails to start, and I have to cycle unplug/plug several times to get the server to work. Maybe the PicoPSU is a bit too weak and cannot deliver some startup current spike, but I lack the skills and equipment to properly diagnose this one.

I might try my luck with another PicoPSU, this time, a multi-voltage one and explore the USB-C option again. I would really if the option worked, good and compact GaN USB-C PSUs are quite easy to get these days.

I will need to revisit this topic in the future, but for now, let's forge ahead.

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

TODO quite please, but not perfect (top panel flexes a bit to much, may fix with some glued-on ribbs, noise level OK but not perfect).

TODO next part.
