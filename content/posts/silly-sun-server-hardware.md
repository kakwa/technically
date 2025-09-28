+++
title = 'My Silly Sun Server - The Hardware'
date = 2025-09-20T19:01:49+02:00
draft = true
summary = 'Recommissioning an Old Sun V100 Server - The Hardware'
+++

# A Hardware Reinvention

In the [introduction](/posts/silly-sun-server-intro/), we outlined the four goals we have for our server.

In this part, we will deal with goals 1 and 2, i.e., the hardware rework — PSU, hard drive, cooling, and creating a custom enclosure that nods to Sun’s original design.

# New Parts!

## The Shopping List

Here is the shopping list to reach our goals:

* The original IDE hard drives are too big and noisy, so I'm replacing them with a [SanDisk 64 GB CF card](https://shop.sandisk.com/products/memory-cards/cfast-cfexpress-compactflash/sandisk-extreme-compactflash?sku=SDCFXSB-064G-G46) + [adapter thingy](https://www.startech.com/en-us/hdd/35baycf2ide) (CF cards are generally pin-compatible with IDE, giving good odds that it will work with decent performance).
* The original PSU is quite bulky, but relatively small at 80 W. So I will also try my luck with a [PicoPSU](https://www.rgeek.com/portfolio-item/rgeek-pico-dc-psu-rp-120lq-dc-12v-24pin-power-supply-module/) + external 12 V power brick.
* Let's also try our luck with a [GaN USB‑C charger](https://www.anker.com/products/b2679-nano-100w-usb-c-charger) + [USB‑C PD trigger board](https://aliexpress.com/item/1005004356272196.html) + [Wide Input 12–25 V PicoPSU](https://www.mini-itx.com/~picoPSU-120-WI-25). On paper, it could provide us with a great little PSU instead of a rather large and sketchy black brick from an unknown manufacturer.
* The original 40 × 40 mm 12 V fans are getting the [Noctua treatment](https://noctua.at/en/products/fan/nf-a4x20-flx).

I also want to design a new and far more compact case for our cute server.

If you ask: yes, all that is not cheap, but saving money isn't the goal here. If you need a budget‑friendly option, a second‑hand Dell/HP/Lenovo micro PC or an ARM SBC is far cheaper, reliable, efficient, and powerful.


## Hard Drive

TODO CF CARD IDE, mostly compatible

{{< figure src="/images/sun-ide-cf.jpg" alt="ide adapter + cf card" caption="Hard Drive replacement" >}}

TODO Perf looks ok, but unsure about durability. if issue industrial SLC CF cards exists.

## PSU

The Sun V100 uses an 80 W PSU. It has the usual Molex IDE and 20‑pin ATX
connectors of the PCs from its era. While it could probably be made quieter with the Noctua treatment, it’s simply too bulky.

So I chose to replace it. I initially tried to use a 120 W 12 V PicoPSU board combined,
with a USB‑C PD trigger board and a GaN charger.

Unfortunately I didn’t read the fine print closely enough. While
[USB‑C Power Delivery](https://en.wikipedia.org/wiki/USB_hardware#USB_Power_Delivery)
does define a 12 V level, it’s optional and seems uncommon — at least in the
very scientific sample size of two chargers I had on hand.

{{< figure src="/images/sun-trigger-board.jpg" alt="USB-C Trigger Board" caption="USB-C Trigger Board" >}}

Worse, despite being set to 12 V, when I plugged the trigger board into the
PSU, it delivered 15 V… Lesson learned: always check the output voltage on these.

So it was back to a cheap no‑name 12 V brick. But this option is still not quite right.
The server often fails to start (switch-on current surge?), and need to be unplugged/plugged several times to get it working.

I will need to revisit the PSU part, this time a multi‑voltage model PicoPSU.
Being able to use USB-C would be really nice, both to get quality chargers and
maybe to use USB-C power banks as makeshift UPS.

But for now, let’s forge ahead.

# Case Modeling

## Caveman Meets CAD

I’m a firm believer in open source (and maybe a bit of a masochist), so FreeCAD it is, even if it can be a tad frustrating at times.

Truth be told, FreeCAD is the only CAD software I’ve ever dabbled in, and even then mostly in a "smash some basic shapes together and call it a model" kind of way.

I'm kind of CAD‑illiterate, and my experience so far has felt like being a caveman wandering into a machinist’s workshop with all its lathes, mills, saws, and drills… only to end up bashing them together like rocks.

This project is actually a good excuse to finally learn CAD properly and move beyond my caveman methods.

Side note: If you are also on that path, I highly recommend the great & numerous tutorials from [Mango Jelly's YouTube channel](https://www.youtube.com/@MangoJellySolutions).

## Panels

TODO

* Dimension choices
* Scanner technique for the back panel cut‑outs
* 2 mm PMMA (?) -> too weak -> 3 mm minimum
* Switch to 3 mm + recess if necessary.

{{< figure src="/images/sun-back-panel.jpg" alt="scanning board IO ports" caption="Is it physical nmap?" >}}

{{< figure src="/images/sun-back-panel.jpg" alt="back panel design in CAD" caption="Using the scan for the design" >}}

{{< figure src="/images/sun-cracked-2mm-pmma.jpg" alt="Cracked 2mm PMMA panel" caption="2 mm PMMA cracked – too flimsy" >}}

{{< figure src="/images/sun-3mm-panel.jpg" alt="3mm panel + reliefs" caption="Switching to 3mm + reliefs" >}}

## Air Duct

TODO

* re-use the radiator, but not the fan shroud (to noisy)
* need air duct to replace it
* most complex geometry of the project (limited room, cables)
* Required to mock board

I ended-up with this design:

{{< figure src="/images/sun-duct-design.png" alt="Fan Duct Design" caption="Final Fan Duct Design" >}}

## Bezel

In all honesty, I don't quite like the V100 front bezel. I don't know, maybe it's a bit too stubby, or too cheap?
I much prefer the V210/V240 front, so I chose to model my bezel after it:

{{< figure src="/images/sun-V210-bezel.jpg" alt="V210 Front Bezel" caption="V210 Front Bezel" >}}

To get the basic shape, I imported the front image, resized to fit 254 × 44.50 mm, and then sketched out the front and back outline:

{{< figure src="/images/sun-bezel-design1.png" alt="Sketches Bezel" caption="Sketches for bezel" >}}

From there, it was just a matter of lofting the two sketches:

{{< figure src="/images/sun-bezel-design2.png" alt="Bezel Lofting" caption="Loft between the two sketches" >}}

And finally, adding the remaining features (holes, fillets, cut‑out for the logo):

{{< figure src="/images/sun-bezel-design3.png" alt="Bezel Final" caption="Bezel final design" >}}

I'm quite happy with the result. I'm actually wondering if the concept could be extended to other servers (Dell, HP, Fujitsu, IBM) to pimp out 10‑inch racks.

## Logo

TODO

* Take SVG (Wikipedia)

{{< figure src="/images/Sun-Logo.svg" alt="sun logo svg" caption="Sun Microsystems SVG Logo" >}}

* Close path
* FreeCAD
* Print with filament change (M400).

{{< figure src="/images/sun-logo-3dprint.jpg" alt="3D printed Sun logo" caption="3D‑printed Sun logo with filament color change" >}}

## Final Design & Assembly

TODO lose ends about the design (corner bracket, standoff for the board), planned to use epoxy glue to fix the board.

{{< figure src="/images/sun-case-design.png" alt="Sun V100 Case Design" caption="Final Case Design" >}}

{{< figure src="/images/sun-parts.jpg" alt="Sun V100 10‑inch parts" caption="All the parts" >}}

TODO

* Inserts
* hack for the air duct insert
* standoff glues
* cable management photo

## Final Result

Overall, I’m really happy with the result. This new case is much more compact, quiet, and fit to be used in my small apartment.

Plus, it still looks like a Sun Server:

{{< figure src="/images/sun-final-front.jpg" alt="SunFire V100 Custom Case - Front" caption="Silly Sun Server - Front" >}}

Round the back, the I/O cut‑outs also fit nicely:

{{< figure src="/images/sun-final-back.jpg"  alt="SunFire V100 Custom Case - Back" caption="Silly Sun Server - Back" >}}

The 3D CAD models are available here: [sun‑v100‑case](https://github.com/kakwa/sun-v100-case).

To be honest, it’s not perfect. The top/bottom panels still flex a bit and the CPU temperature is somewhat high at ~70 °C.
Also, on the power‑consumption side, it's “not great — not terrible”.
This server draws 20–25 W, vs 5–10 W for a more typical mini‑PC or old laptop.

But these are far from deal‑breakers, and now this server can actually become useful… if we manage to install something onto it,
and believe it or not, [it's exactly what we will address in the next post](/posts/silly-sun-server-software/).

## Links

* [Post 1 - Introduction](/posts/silly-sun-server-intro/).
* [Post 3 - Software](/posts/silly-sun-server-software/).
* [Case 3D models](https://github.com/kakwa/sun-v100-case).
