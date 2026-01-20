+++
title = 'PCIe x16 to x1 GPU Adapter - Feels wrong, but does work'
date = 2026-01-02T18:29:53+01:00
draft = false
summary = "When you don't have enough ports, just use PCIe x16 to x1 adapter."
+++

# Why Would You Do That?

I have an old PC tower lying around that I use as a lab/KVM hypervisor from time to time. The thing is completely headless like a server should... but maybe a bit too headless actually.

The motherboard doesn't have any video port, and the two PCIEx16 ports are used by some old OCZ Velodrives storage cards, so there is no way to plug a screen.

To a degree, it's possible to make do with the serial port, but it gets old really fast when trying to troubleshoot pre-grub boot issues or reinstalling the OS.

# The Setup

I vaguely remember seeing some mining rigs using PCIe adapters (and even dremeling the cards themselves), so I tried my luck with one of [these from Amazon](https://www.amazon.com/cablecc-Extender-Converter-Extension-Graphics/dp/B0BYNH176D?crid=HG6EBTKK3OS7&dib=eyJ2IjoiMSJ9.EwnOUmfceQIKLekBlQwb7DhmqXkUDZoML0Z-INretXkaww0q6qO7xoX9isxXmQZlCoiKp00o3tYh5-Ip3B0qrKfeQ17aI6t0FqgW8Mh8Abc-3ssOW86xO-AzkEhdJgOQBHJTQ--8qid0rbXw-tvL0Ywf6DP8vGB7Q0QEasrv8NjEdFxiucDhMTTGlbE9Y_QtO-aT0xZ7PALB5etOItTPkf2nrrza_JhcIKN1aXLuCMQ.9yqEpdMJmknQ-CnYzQRt5RRSBE3iFHN-yWP7FzbfE2g&dib_tag=se&keywords=PCI-E%2BExpress%2B1%2Bx%2Bto%2B16%2Bx&qid=1768948246&sprefix=pci-e%2Bexpress%2B1%2Bx%2Bto%2B16%2Bx%2Caps%2C147&sr=8-2&th=1).

Next to the card I had lying around (an old Nvidia GT 710), it looks like that:

{{< figure src="/images/pciex1/parts.jpg" alt="New bracket design" caption="The card & the adapter" style="width: 25%;" >}}


With the added height the stock bracket no longer fitted, so I designed a new one.

I [started from this great collection](https://www.printables.com/model/599970-pc-extension-card-slot-brackets-in-30-variation-fo/) (from an absolute chad also using FreeCAD).

From there, the design was fairly straightforward, using a photo as refence for drawing the offsetted cutouts.

{{< figure src="/images/pciex1/new_bracket.jpg" alt="New bracket design" caption="new bracket" style="width: 25%;" >}}

With the new bracket, things looked like that.

{{< figure src="/images/pciex1/pciex1_slot.jpg" alt="PCIe x1 slot" caption="PCIEx1 GPU, Shiny!" style="width: 25%;" >}}

And here how it looks with all the cards back in the case:

{{< figure src="/images/pciex1/alotofcards.jpg" alt="Multiple GPU cards" caption="Yep, that's full" style="width: 25%;" >}}

# Some Closing Thoughts

It feels like it should not work, but it does!

That being said, be aware of the slot power limits. I'm not sure why (since additional PCIe lines don't add power pins), but [PCIe x1 slots](https://en.wikipedia.org/wiki/PCI_Express#Power) can draw significantly less power than PCIe x16 slots.
Consequently, I would only do it with the lowest power possible GPUs, like fanless & cheap Nvidia GT 710 or an AMD R5.

The cards also need to be low profile for this assembly to fit in the case.

With these caveats in place, this hack does work, however wrong it feels, and is definitely more convenient than having to open the case and juggle cards around whenever this machine is misbehaving.

In the unlikely case you are in the same boat (no video port, or some for AI setup maybe?), it's definitely an option worth trying as long as you are not hoping to play Crysis on the poor thing.