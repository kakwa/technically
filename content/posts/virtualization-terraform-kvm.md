+++
title = 'Cloud @Home'
date = 2026-01-30T16:55:15+01:00
draft = true
summary = "Tidbits About Managing KVM Hypervisor With Tofu/Terraform"
+++

# Introduction

These days, @Work, we don't really have to care about server racking, cabling, powering, and the many other \*ings required when dealing with hardware. Logistic companies like Amazon/AWS have managed to hide it all behind a convinient API, and frankly, do it better.

That's only valid in a professional context however. @Home, unless you are /r/wallstreetbets inclined financially, putting your credit card into Vercel, AWS or GCP is a bit risky for your bank account (see [these](https://www.reddit.com/r/aws/comments/lbqcos/my_forgotten_account_has_a_20000_bill_how_screwed/) [billing](https://www.reddit.com/r/googlecloud/comments/1kimlc8/ddos_98k_firebase_bill_guy_the_billing_support/) [horror](https://www.reddit.com/r/nextjs/comments/1o1zs2u/unexpected_1100_vercel_bill_im_just_an_employee_i/) [stories](https://www.youtube.com/watch?v=ihnGot4nUS4)). Homelabing with an old rig in the closet or a fancy 10" rack of refurb mini-PCs is often a more sensible option.

{{< figure src="/images/cloud-at-home/meme.jpg" alt="meme cloud at home" caption="Cloud @Home" >}}

But it seems to come at a cost: things are no longer hidden behind convinient Cloud APIs... 

... or so it seems...

In reality, we can actually re-use at home most of the same tools availabnle for the Cloud.

This post will present one of them: **Terraform/Tofu** and show how it can manage a simple `LibVirtd`/`KVM` hypervisor.

# Creating Stuff

Wouldn't it be nice to be able to manage our `libvirt`/`kvm` hypervisor in `HLC` like we would on an AWS account?

Well, thanks to dmacvivar's [libvirt provider](https://registry.terraform.io/providers/dmacvicar/libvirt/latest/docs), we can, and here is how.

## Network

TODO

## Base Image

We could install the VM using a modified `.iso` or with `pxe` netboot setup, like we would with bare metal machines.

But, since we are already past the bare metal, a more convenient option is to directly download and use official images from [Debian](https://cloud.debian.org/images/cloud/), [Rocky](https://download.rockylinux.org/pub/rocky/10/images/x86_64/) or your preferred distribution.

By just pointing atthe URL, the `libvirt` `Tofu` module can download and register these base image in our hypervisor:

```hcl
locals {
  debian_image_url = "https://cloud.debian.org/images/cloud/trixie/latest/debian-13-generic-amd64.qcow2"
}

resource "libvirt_volume" "debian_base" {
  name = "debian-base.qcow2"
  pool = "mid-pool"
  create = {
    content = {
      url = local.debian_image_url
    }
  }
  target = {
    format = { type = "qcow2" }
  }
}
```

## Cloud Init

These cloud images usually ship with [`cloud-init`](https://docs.cloud-init.io/en/latest/index.html), which we can leverage to bootstrap the VMs.

At this stage, it's advisable to do as little as possible, but we will typically configure:

* some network settings
* a [Salt](https://docs.saltproject.io/en/latest/contents.html)/[Puppet](https://help.puppet.com/core/current/Content/PuppetCore/puppet_index.htm)/[Chef](https://docs.chef.io/) agent or some SSH credentials for [Ansible](https://docs.ansible.com/) for further configuration.
* usually, a default account for troubleshooting

The `cloud-init` payload can also be managed directly by the Tofu `libvirt` provider.


With `tofu apply`, this will create a small (< 1MB) `.iso` volume which can be attached to the VM, and consumed at first boot:

```hcl
# Cloud-init configuration for the YOUR_VM VM
resource "libvirt_cloudinit_disk" "YOUR_VM_seed" {
  name = "YOUR_VM-cloudinit"

  user_data = <<-EOF
    #cloud-config
    users:
      - name: admin
        groups: [sudo]
        shell: /bin/bash
        ssh_authorized_keys:
          - ssh-ed25519 AAAAC3... your-key-here

    write_files:
      - path: /etc/sudoers.d/admin
        permissions: '0440'
        content: |
          %admin ALL=(ALL:ALL) NOPASSWD: ALL

    chpasswd:
      list: |
        root:password
      expire: false

    ssh_pwauth: true

    packages:
      - openssh-server
      - qemu-guest-agent

    runcmd:
      - systemctl enable --now qemu-guest-agent

    timezone: UTC
  EOF

  meta_data = <<-EOF
    instance-id: YOUR_VM
    local-hostname: YOUR_VM
  EOF

  network_config = <<-EOF
    version: 2
    ethernets:
      enp1s0:
        addresses:
          - 192.168.1.13/24
        gateway4: 192.168.1.254
        nameservers:
          addresses:
            - 192.168.1.25
      enp2s0:
        dhcp4: true
  EOF
}

# create cloud-init to ISO volume
resource "libvirt_volume" "YOUR_VM_seed_volume" {
  name = "YOUR_VM-cloudinit.iso"
  pool = "slow-pool"
  create = {
    content = {
      url = "file://${libvirt_cloudinit_disk.YOUR_VM_seed.path}"
    }
  }
}
```

Note: we also install and enable `qemu-guest-agent` here. Installing it is necessary to have the VM report back its IP(s) to the Tofu `libvirt` provider, otherwise, the provider will error in timeout.

## VM Creation

Once we have the base OS image and sone cloud-init configuration, we can create the VM itself.

Let's start with the main disk:

```hcl
resource "libvirt_volume" "YOUR_VM_disk" {
  name     = "YOUR_VM-disk.qcow2"
  pool     = "mid-pool"
  capacity = 53687091200 # 50GB
  backing_store = {
    path   = libvirt_volume.debian_base.path
    format = { type = "qcow2" }
  }
  target = {
    format = { type = "qcow2" }
  }
}
```

And from there, we can create the VM:

```hcl
resource "libvirt_domain" "YOUR_VM" {
  name      = "YOUR_VM"
  memory    = 1048576  # 1GB (1024 * 1024)
  vcpu      = 2
  running   = true
  autostart = true

  os = {
    type         = "hvm"
    type_arch    = "x86_64"
    type_machine = "q35"
  }

  cpu = {
    mode = "host-passthrough"
  }

  devices = {
    disks = [
      {
        source = {
          volume = {
            pool   = libvirt_volume.YOUR_VM_disk.pool
            volume = libvirt_volume.YOUR_VM_disk.name
          }
        }
        target = { dev = "vda", bus = "virtio" }
        driver = { type = "qcow2" }
      },
      {
        device = "cdrom"
        source = {
          volume = {
            pool   = "slow-pool"
            volume = "YOUR_VM-cloudinit.iso"
          }
        }
        target = { dev = "sda", bus = "sata" }
      }
    ]
    # Two network interfaces: bridge + talos network
    interfaces = [
      {
        type  = "bridge"
        model = { type = "virtio" }
        source = { bridge = { bridge = "br0" } }
      },
      {
        type  = "network"
        model = { type = "virtio" }
        source = {
          network = {
            network = libvirt_network.talos_network.name
          }
        }
      }
    ]
  }
}
```

## DNS Records

TODO

## Generating Ansible Inventory

TODO

# Closing Thoughs

Honestly, after struggling a bit (my fault, I was using an old buggy version, make sure you are at least on `v0.9`), I was surprised how well I manage to get it working.

Being able to nuke entire stacks and re-create them at will, with just a `tofu destroy;tofy apply` is extremely convinient and satisfying.

Plus, the setup is extremely simple: just a base headless Debian with `libvirtd` installed.

Sure, I could have installed Proxmox, use the [Proxmox Tofu Provider](https://registry.terraform.io/providers/Terraform-for-Proxmox/proxmox/latest/docs) provider, and have something more ressembling AWS or GPC. But, in truth, this simple setup is already more than enough to cosplay as a bigtech Cloud Engineer, and it surely helped me a lot when deploying my @home [k8s cluster](TODO/link).

Kudos to [Duncan Mac-Vicar P.](https://www.mac-vicar.eu/) for sharing this provider.
