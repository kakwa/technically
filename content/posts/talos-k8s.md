+++
title = 'K8s at home - Over-Engineered Self-Hosting'
date = 2026-02-01T16:55:15+01:00
draft = true
+++

# Introduction

## I'm Bad At CV Driven Development

Working at a (second tier) "Big Tech" company has it's perks:
because of the scale such company operates at,
there are a lot of base services like DNS, Authentication or DNS,
managed by dedicated core/infrastructure teams.

On one hand, it's great, because these core services require a lot
of baby sitting and eat a lot of the bandwidth which would be better
used elsewhere, like implementing higher level services closer to the
business & client needs.

On the other, it's not great for CV-driven development. Specially if you have a
somewhat SRE/infrastructure dominant profil like me, as it tends to leave gaps
in the usual "required skills" when job hunting.

One such skill I'm missing currently is deploying & managing Kubernetes.

To be honest, I kind of avoided diving into K8s. Maybe it's an unfounded bias on my part,
but having quickly look into it, and barely touched some HELM templates at work,
Kubernetes always felt a bit overcomplicated, clunky and not very pleasant to manage.

But, well, I need to fill this gap in my CV, and I'm not willing to do it on my employer's time
Fortunatly, through the magic of Open Source, the Internet and a 12 years old PC
with 32GB of RAM (actually quite valuable these days :p), I should be able to fill-in this gap by
deploying the most over-engineered solution for self-hosting at home.

## What I Want Out Of This

By the end of this process, I want:

* Mostly automated base KVM hybervisor deployment
* The Base Kubernetes Cluster, with all the control plane bits
* HTTPs Load Balancer + DNS
* CI/CD with Argo (and integration with GitHub)
* Docker/Container Registry

Optionally, I might also try to get:

* Network Load Balancer
* Prometheus Monitoring
* Ways to manage persistency (iSCSI?)

In the end, we will validate our setup with a Q&D AI generated Tinder4Cats or something.

# The KVM Host

This old computer, is well, old, so it required a bit of maintenance:

* TODO link to PCIx1 GPU
* Various disk mounts brackets this [5.25" to 3.5 adapter (TPU)"](https://www.printables.com/model/1306664-35-to-525-hdd-silencer-bracket) to silence the spinning rust disks and [3.5" to 2.5" adapter](https://www.printables.com/model/229753-small-hdd-adapter-35-inch-to-25-inch) to finally deal with the "ducktape based" mounts.
* OZC Velodrive Storage Card [Firmware Update](https://gist.github.com/kakwa/45b7ac675ea28fe0468dec3efdcd271c)

Aside from that, I installed the latest Debian (13/Trixie at the time of this writting) and configured it through [following Ansible playbook](https://github.com/kakwa/ansible-hypervisor/).

This playbook configures:

* Base tools I like (zsh, btop, nmap, etc)
* Avahi for local mDNS resolution (`kvm.local`)
* LVM setup for the various drives in the machine, in 3 tiers: slow (spinning rust), medium (base SSD), fast (OCZ VeloDrive).
* [LibVirtD](https://libvirt.org/docs.html), with these 3 pools
* Some Serial Console just in case
