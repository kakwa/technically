+++
title = 'K8s at home - Over-Engineered Self-Hosting'
date = 2026-02-01T16:55:15+01:00
draft = true
+++

# Introduction

## I'm Bad At CV Driven Development

Working at a "Big Tech" company has its perks, because of the scale such company operates at,
there are a lot of base services like DNS, Authentication, or Load Balancing,
managed by dedicated core/infrastructure teams.

On one hand, it's great, because these core services require a lot
of baby sitting and eat a lot of the bandwidth which would be better
used elsewhere, like implementing higher level services closer to the
business & client needs.

On the other, it's not great for CV-driven development. Especially if you have a
somewhat SRE/infrastructure dominant profile like me, as it tends to leave gaps
in the usual "required skills" when job hunting.

One such skill I'm missing currently is deploying & managing Kubernetes.

To be honest, I kind of avoided diving into K8s. Maybe it's an unfounded bias on my part,
but having quickly looked into it, and barely touched some HELM templates at work,
Kubernetes always felt a bit overcomplicated, clunky and not very pleasant to manage.

But, well, I need to fill this gap in my CV, and I'm not willing to do it on my employer's time.
Fortunately, through the magic of Open Source, the Internet and a 12 years old PC
with 32GB of RAM (actually quite valuable these days :p), I should be able to fill in this gap by
deploying the most over-engineered solution for self-hosting at home.

## What I Want Out Of This

By the end of this process, I want:

* Mostly automated base KVM hybervisor deployment
* The Base Kubernetes Cluster, with all the control plane bits
* HTTPs Load Balancer + DNS
* CI/CD with Argo (and integration with GitHub)
* Docker/Container Registry

# Base Setup

## The KVM Host

This old computer, is well, old, so it required a bit of maintenance:

* [PCIe x16 to x1 GPU adapter](/posts/gpu-pciex1/) to get a video output
* Various disk mounts brackets this [5.25" to 3.5 adapter (TPU)"](https://www.printables.com/model/1306664-35-to-525-hdd-silencer-bracket) to silence the spinning rust disks and [3.5" to 2.5" adapter](https://www.printables.com/model/229753-small-hdd-adapter-35-inch-to-25-inch) to finally deal with the "ducktape based" mounts.
* OZC Velodrive Storage Card [Firmware Update](https://gist.github.com/kakwa/45b7ac675ea28fe0468dec3efdcd271c)

Aside from that, I installed the latest Debian (13/Trixie at the time of this writting) and configured it through [following Ansible playbook](https://github.com/kakwa/home.tf/blob/main/ansible/hypervisor.yml).

This playbook configures:

* Base tools I like (zsh, btop, nmap, etc)
* `OpenTofu`, `kubectl`, `talosctl` (with its [packaging](https://github.com/kakwa/misc-pkg/tree/main/talosctl))
* Avahi for local mDNS resolution (`kvm.local`)
* LVM setup for the various drives in the machine, in 3 tiers: slow (spinning rust), medium (base SSD), fast (OCZ VeloDrive).
* [LibVirtD](https://libvirt.org/docs.html), with storage 3 pools, 1 private network, 1 bridge NIC.
* Some Serial Console just in case


In addition, I've also deployed an internel DNS server with TSIG/RFC 2136 for my own zone.

## Kubernetes Distribution Choice

For the base OS running the Kubernetes nodes, there are several options worth considering:

**Talos Linux** is an immutable, API-driven operating system built specifically and exclusively for Kubernetes. It has no SSH access, no shell, and everything is configured through declarative configs and the `talosctl` CLI.

**Flatcar Container Linux** is the community fork of the original CoreOS Container Linux. It's a minimal, immutable OS optimized for containers with a more traditional approach (SSH access, shell available). Uses ignition for declarative configuration.

**Fedora CoreOS** is Red Hat's successor to the original CoreOS, maintaining the container-focused philosophy with auto-updates and ignition provisioning.

I ended up choosing **Talos Linux**. It looked like the most common option, and it's also not linked (yet) to the usual corporate vampires.

## Kubernetes Nodes Creation

TODO rework to include the TF code example

The Nodes were deployed using OpenTofu/Terraform. The [following code](https://github.com/kakwa/home.tf/tree/main/terraform) leverages the [KMV/libvirt](https://registry.terraform.io/providers/dmacvicar/libvirt/latest/docs) and the [Talos](https://registry.terraform.io/providers/siderolabs/talos/latest/docs/resources/image_factory_schematic) providers.

Talos has an [Image Factory](https://factory.talos.dev/) enabling to create custom images with version, architecture, addons and other options. The TF Provider is used to [configure, create and download](https://github.com/kakwa/home.tf/blob/main/terraform/images-talos.tf) said image for our deployment.

Then, we deploy a small cluster with [3 control nodes](https://github.com/kakwa/home.tf/blob/main/terraform/vm-control-plane.tf) and [6 worker nodes](https://github.com/kakwa/home.tf/blob/main/terraform/vm-workers.tf) with minimal specification (2 cores, 2GB RAM for each node).

The cluster is deployed in it's [dedicated network](https://github.com/kakwa/home.tf/blob/main/terraform/networks.tf)
