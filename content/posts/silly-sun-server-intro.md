+++
title = 'My Silly Sun Server - Introduction'
date = 2025-08-27T19:01:49+02:00
draft = false
summary = 'Recommissioning an Old Sun V100 Server - Introduction'
+++

# Obsolete Tech In A Modern Age

## Something Old Is New Again

One of my pet peeves is to bring new life into old hardware.

Here, I'm not thinking in a retro‑computing kind of way. Software is not exactly like fine wine, in my opinion—it usually doesn't age well.

Also, old software tends to be isolated in its own bubble—amusing, but unless you are [George R. R. Martin rocking WordStar 4.0 on MS‑DOS](https://www.youtube.com/watch?v=X5REM-3nWHg), it's not really useful.

I prefer the challenge of trying to install modern software on these antiquities, make them able to interact with the internet, and do something useful with them.

Sure, it will not run a Kubernetes cluster, but these old machines generally still have enough oomph for lightweight use cases such as:

- MPD/Music server (for example, coupled with an analog hi‑fi system)
- Basic web hosting (blog, RSS aggregator, etc)
- Mail server
- Test/lab machines

## The Little Server That Could (Not)

Enter the Sun V100, the 2001 entry‑level server from Sun Microsystems.

It boasts impressive specs such as:
- UltraSPARC‑IIe CPU @ 548 MHz
- No GPU whatsoever (not great for AI, I guess :p)
- 2 GB RAM (if maxed out)
- 2 × 80 GB IDE hard drives
- Two 100 Mbit/s NICs
- LOMlite management over serial
- Second serial port

In truth, this beast is a little asthmatic, even by 2001 standards.
Still, the SPARC CPU is interesting, especially for testing endianness and memory alignment issues.
And unlike most servers of that era, it doesn’t need a huge amount of power (~15 W TDP).

I got a few of these years ago for cheap, but, in truth, never did anything really useful with them.
While not as bad as other monsters from the era, these cuties are simply a bit too big and loud.
So, they sat in my cupboard for ages, in the dark, lonely, unused and far away from the information highways.

But let's try to change that, have a fun project, and maybe learn a few things along the way.

# A Two-Front Project

So yes, I aim to do something with this cute little server from another time.
Not very rational and probably a bit challenging—but that's what makes it fun!

But enough said! Now, we need to address the two broad complaints we have about this relic:

1. Make this server way smaller and quieter
2. Find and install a modern OS + up‑to‑date software to make it useful

## The Hardware Side

### Make It Smaller

This (not so) tiny server is well... a server. If it fits onto a small and standard 1U height (44.50 mm), it's also kind of big in the other dimensions: 19"/482.60 mm by 17.55"/445 mm.

Fortunately, once opened, the server looks like this:

{{< figure src="/images/sun/sun-inside.jpg" alt="Sun Fire V100 opened showing mainboard and layout in original case" caption="Sun Fire V100 with top cover removed – original layout" >}}

This cute beast could probably be a lot more compact. The main board, including the RAM sticks (low‑height variant), is 250 × 190 mm.
If we ditch the original (and noisy) hard drives and PSU and cheat a little, we could even make it fit into a 254 mm (10") case and mount it in one of these fancy small [10‑inch racks](https://mini-rack.jeffgeerling.com/)... if we also manage to make it short enough (less than 300 mm).

This gives goal number one:

* make it fit into 254 × 250 × 44 mm.

And also, if possible, as goal number one‑bis:

* retain the original "Sun vibe" look.

### Make It Quieter

Aside from that, we also need to silence this small beast.

In particular, we need to take care of these little bastards:

{{< figure src="/images/sun/sun-fan.jpg" alt="Sun V100 40×40 mm 12 V fan" caption="Original 40×40 mm 12 V fan" >}}

And also their lord and master:

{{< figure src="/images/sun/sun-cpu-fan.jpg" alt="Sun V100 CPU 12 V fan" caption="Original CPU 12 V fan" >}}

Fortunately, we have options here—especially one that begins with an N.

Since I live in a small apartment, noise levels need to be reasonable—roughly at small NAS or fan‑cooled Wi‑Fi router levels.

That's goal number two:

* bring the noise down to something fit for a living space.

## The Software Side

### Operating System Choice

The sad reality is SPARC is a dying architecture. So our choices, as of 2025, are limited:

* (Open)Solaris -> dead
* Illumos (OpenSolaris successor) -> [Support is being dropped](https://github.com/illumos/ipd/blob/master/ipd/0019/README.md)
* Linux -> SPARC64 is still supported by the kernel, but hardly any mainstream distribution supports it ([Debian unofficially](https://wiki.debian.org/Sparc64) and [Gentoo](https://wiki.gentoo.org/wiki/Project:SPARC)).
* FreeBSD -> Support dropped with [FreeBSD 13](https://www.freebsd.org/platforms/sparc/)

This leaves more or less two choices:

* [NetBSD](https://wiki.netbsd.org/ports/sparc64/)
* [OpenBSD](https://www.openbsd.org/sparc64.html)

Since burning CDs is kind of annoying, and given we will probably ditch the CD drive anyway, we will need to net‑install the OS.

That's goal number three:

* Deploy a net‑install server (similar to a [JumpStart](https://docs.oracle.com/cd/E26505_01/html/E28039/customjumpsample-5.html#scrolltoc) setup) and install NetBSD and/or OpenBSD.

### Do Something Useful

Here, nothing fancy: we will go for basic web hosting (nginx, Let's Encrypt, maybe a bit of Postgres & PHP), but since I'm an infra guy who likes infrastructure‑as‑code, let's set goal number four:

* Create a bit of Ansible to do something with our new toy.

# The Next Steps

So to recap, we have the following four goals:

1. Make the server quieter
2. Make the server smaller
3. Net‑install NetBSD and/or OpenBSD
4. Configure some basic web hosting

Next, we'll focus on the [hardware track](/posts/silly-sun-server-hardware/) (1 and 2): taming the noise and re‑housing the V100 into a compact 10‑inch chassis while keeping the original Sun aesthetic.

After that, we'll dive into the [software track](/posts/silly-sun-server-software/) (3 and 4): net‑installing NetBSD/OpenBSD and automating a minimal web stack (nginx, Let's Encrypt, maybe a dash of Postgres/PHP) with Ansible.
