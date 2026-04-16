+++
title = 'Cloud @Home'
date = 2026-02-01T16:55:15+01:00
draft = true
summary = "Few Tidbits About Managing VMs With Tofu/Terraform"
+++

# Introduction

These days, @Work, we don't really have to care about server racking, cabling, powering, and the many other \*ings.

Logistic companies like Amazon/AWS have managed to hide all that behind a convinient API. 

That's only valid in a professional context however. @Home, unless you are really motivated, and well-off financially (see [these](https://www.reddit.com/r/aws/comments/lbqcos/my_forgotten_account_has_a_20000_bill_how_screwed/) [billing](https://www.reddit.com/r/googlecloud/comments/1kimlc8/ddos_98k_firebase_bill_guy_the_billing_support/) [horror](https://www.reddit.com/r/nextjs/comments/1o1zs2u/unexpected_1100_vercel_bill_im_just_an_employee_i/) [stories](https://www.youtube.com/watch?v=ihnGot4nUS4)), putting your credit card into an AWS, GCP or Azure subscription, is not great.

The "old rig in the closet" or "10 inch rack of refurb Lenovo mini-PCs" are often more sensible options.

{{< figure src="/images/cloud-at-home/meme.jpg" alt="meme cloud at home" caption="Cloud @Home" >}}

But not having a Cloud API hidding people racking servers makes things a bit more hands-on, manual and less convinient... or so it seems...

We can actually re-use most of these tools reasonably easily at home and this article will focus on one of them (or its fork): **Terraform/Tofu**.

Wouldn't it be nice to be able to manage our `libvirt`/`kvm` VMs and networks in `HLC` like we would on an AWS account?

Well, thanks to dmacvivar's [libvirt provider](https://registry.terraform.io/providers/dmacvicar/libvirt/latest/docs), we can, and this article with show how.

# Creating Stuff

## Network

TODO

## Base Image

We could install the VM using an `.iso` or with `pxe`, but the more convenient option is to directly download the official Debian cloud image, a bit like if we were using an AMI on AWS:

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

From there, we can bootstrap the VM (maybe for [Ansible](https://docs.ansible.com/) or [Salt](https://docs.saltproject.io/en/latest/contents.html)), using [`cloud-init`](https://docs.cloud-init.io/en/latest/index.html) to:

* create a bootstrapping account `admin` with sudoers and an ssh key
* configure the network interfaces (including static IP)
* install and enable `qemu-guest-agent` (necessary to report back the static IP to the tf provider via `libvirtd`)


The `cloud-init` payload can be managed directly by the Tofu `libvirt` provider.

The provider, at `apply`, will create a small (< 1MB) `.iso` volume which can be attached to the VM, and consumed by the base image:

```hcl
# Cloud-init configuration for the utility VM
resource "libvirt_cloudinit_disk" "utility_seed" {
  name = "utility-cloudinit"

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
    instance-id: utility
    local-hostname: utility
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
resource "libvirt_volume" "utility_seed_volume" {
  name = "utility-cloudinit.iso"
  pool = "slow-pool"
  create = {
    content = {
      url = "file://${libvirt_cloudinit_disk.utility_seed.path}"
    }
  }
}
```

## VM Creation

Once we have the base OS image and sone cloud-init configuration, we can create the VM itself.

Let's start with the main disk:

```hcl
resource "libvirt_volume" "utility_disk" {
  name     = "utility-disk.qcow2"
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
resource "libvirt_domain" "utility" {
  name      = "utility"
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
            pool   = libvirt_volume.utility_disk.pool
            volume = libvirt_volume.utility_disk.name
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
            volume = "utility-cloudinit.iso"
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

Honestly, after struggling a bit (my fault, I was using an old buggy version, make sure you are on v0.9), I was surprised how well I manage to get it working. Being able to nuke entire stacks and re-create them at will, with just a `tofu destroy;tofy apply` is extremely convinient.

Plus the setup is extremely simple: just a base headless Debian with `libvirtd` installed.

Sure I could have installed Proxmox, use the [Proxmox Tofu Provider](https://registry.terraform.io/providers/Terraform-for-Proxmox/proxmox/latest/docs) provider, and have something more ressembling AWS or GPC. But, in truth, this simple setup is already more than enough to cosplay as a Cloud Engineer working at bigtech, and it surely helped me a lot when deploying my own [k8s cluster](TODO/link).

Kudos to [Duncan Mac-Vicar P.](https://www.mac-vicar.eu/) for hi
