+++
title = 'My Silly Sun Server - The Hardware'
date = 2025-09-20T19:01:49+02:00
draft = true
summary = 'Recommissioning an Old Sun V100 Server - The Hardware'
+++

# A Hardware Re-invention

In the [introduction](/posts/silly-sun-server-intruduction/), we outlined the four goals we have for our server.

In this part, we will deal with goals 1. and 2., aka the hardware rework — PSU, hard drive, cooling and creating a custom enclosure that nods to Sun’s original design.

# New Parts!

Here is the shopping list to reach our goals:

* The original IDE HDs are too big & noisy, so I'm replacing them with a [SanDisk 64GB CF Card](https://shop.sandisk.com/products/memory-cards/cfast-cfexpress-compactflash/sandisk-extreme-compactflash?sku=SDCFXSB-064G-G46) + [adapter thingy](https://www.startech.com/en-us/hdd/35baycf2ide) (CF cards are generally pin-compatible with IDE, giving good odds of it working with decent performance).
* The original PSU is quite bulky, but relatively small at 80 W. So I will also try my luck with a [PicoPSU](https://www.rgeek.com/portfolio-item/rgeek-pico-dc-psu-rp-120lq-dc-12v-24pin-power-supply-module/) + external 12 V power brick.
* Let's also try our luck with a [GaN USB-C charger](https://www.anker.com/products/b2679-nano-100w-usb-c-charger) + [USB-C PD trigger board](https://aliexpress.com/item/1005004356272196.html) + [Wide Input 12-25V PicoPSU](https://www.mini-itx.com/~picoPSU-120-WI-25). On paper, it could provide us with a great little PSU instead of a rather large and sketchy black brick from an unknown manufacturer.
* The original 40×40 mm 12 V fans are getting the [Noctua treatment](https://noctua.at/en/products/fan/nf-a4x20-flx).

I will also redesign a new and far more compact case for it.

And yes, it ended-up being quite expensive. But this project isn’t about saving money.
If you do want a cheap option, you’re much better off with a second-hand micro PC from Dell/HP/Lenovo, or even an ARM SBC: cheaper, more reliable, more energy-efficient, and far more powerful.

# Case Modeling

## Caveman meets CAD

I’m a firm believer in Open Source (and maybe a bit of a masochist), so FreeCAD it is, even if it can be a tad frustrating at times.

Truth be told, FreeCAD is the only CAD software I’ve ever dabbled in, and even then mostly in a "smash some basic shapes together and call it a model" kind of way.

I'm kind of CAD illiterate and my experience so far has felt like being a caveman wandering into a machinist’s workshop with all its lathe, mill, saws, or drills... only to end-up bashing them together like rocks.

This project is actually a good excuse to finally learn CAD properly and move beyond my caveman methods.

Side note: If you also are on that path, I highly recommend the numerous tutorial videos from [Mango Jelly's Youtube channel](https://www.youtube.com/@MangoJellySolutions).

## Panels

TODO

* Dimension choices
* Scanner technique for the back panel cutouts
* 2 mm PMMA (?) -> too weak -> 3 mm minimum
* Switch to 3 mm + recess if necessary.

{{< figure src="/images/sun-cracked-2mm-pmma.jpg" alt="Cracked 2mm PMMA panel" caption="2 mm PMMA cracked – too flimsy" >}}

## Brackets

TODO

* Nut corner bracket -> bad idea
* Switch to inserts

## Bezel

In all honesty, I don't quite like the V100 front bezel. I don't know, maybe it's a bit too stubby, or too cheap?
I much prefer the V210/V240 front, so I chose to model my bezel after it:

{{< figure src="/images/sun-V210-bezel.jpg" alt="V210 Front Bezel" caption="V210 Front Bezel" >}}

To get the basic shape, I imported the front image, resized to fit 254 x 44.50mm, and then sketched out the front and back outline:

{{< figure src="/images/sun-bezel-design1.png" alt="Sketches Bezel" caption="Sketches for bezel" >}}

From there, it was just a matter of lofting the two sketches:

{{< figure src="/images/sun-bezel-design2.png" alt="Bezel Lofting" caption="Loft between the two sketches" >}}

And finally, adding the remaining features (holes, fillets, cutout for the logo):

{{< figure src="/images/sun-bezel-design3.png" alt="Bezel Final" caption="Bezel final design" >}}

I'm quite happy with the result. I'm actually wondering if the concept could be extended to other servers (Dell, HP, Fujitsu, IBM) to pimp-out 10 inch racks.

## Logo

TODO

* Take SVG (Wikipedia)
* Close path
* FreeCAD
* Print with filament change (M400).

{{< figure src="/images/sun-logo-3dprint.jpg" alt="3D printed Sun logo" caption="3D‑printed Sun logo with filament color change" >}}

# Other Parts

## Hard Drive Replacement

TODO

## PSU

The Sun V100 uses an 80 W PSU. It has the usual Molex IDE and 20‑pin ATX
connectors of the PCs from its era.

While it could probably be made quieter with the Noctua treatment, it wouldn’t
fix the other issue: it’s simply too big.

To replace it, I used a 120 W 12V PicoPSU board combined, at first, with USB‑C PD
trigger board with a GaN power brick.

Unfortunately I didn’t read the fine print closely enough. While
[USB‑C Power Delivery](https://en.wikipedia.org/wiki/USB_hardware#USB_Power_Delivery)
does define a 12 V level, it’s optional and seems uncommon — at least in my
very scientific sample size of two chargers I had on hand.

Worse, despite being set to 12 V, when I plugged the trigger board into the
PSU, it delivered 15 V… Lesson learned: always measure the output of these
boards before connecting anything valuable.

So it was back to a cheap no‑name 12 V brick. At least this one is rated for
120 W and is not below the original 80 W, unlike the USB‑C option at 60 W would
have been.

But, in truth, the 12 V brick option is still not quite right. The server often fails
to start, and I may have to unplug/plug several times to get it to work.

I might try my luck with another PicoPSU, this time a multi‑voltage model, and
explore the USB‑C option again. I would really like if this option worked —
compact GaN USB‑C PSUs are easy to find these days.

I will need to revisit this topic in the future, but for now, let’s forge
ahead.

## Assembly

{{< figure src="/images/sun-parts.jpg" alt="sun v100 10 inch parts" caption="All the parts" >}}

TODO

* Inserts
* hack for the air duct insert
* standoff glues
* cable management photo

## Final Result

{{< figure src="/images/sun-final-front.jpg" alt="SunFire V100 Custom Case - Front" caption="Silly Sun Server - Front" >}}
{{< figure src="/images/sun-final-back.jpg"  alt="SunFire V100 Custom Case - Back" caption="Silly Sun Server - Back" >}}

TODO quite please, but not perfect (top panel flexes a bit to much, may fix with some glued-on ribbs, noise level OK but not perfect, a bit hot (~70). Power Consumption not great not terrible (20-25W vs 5-10W mini-PC/laptop).

TODO link to sun case 3d model.

If you missed it, start with the
[intro](/posts/silly-sun-server-intro/). Next up is the
[software side →](/posts/silly-sun-server-software/).
