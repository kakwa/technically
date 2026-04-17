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

## Networks

First we need some LAN segments to put our VMs in. And also, usually, it could be nice to gaave these VMs access to our home network.

The `libvirt` provider can manage these networks with its `libvirt_network` resources. 

Here, we simply declare a private network:

```hcl
variable "network_name" { type = string default = "homelab-nat" }
variable "network_cidr" { type = string default = "192.168.150.0/24" }
variable "bridge_name" { type = string default = "br0" }

resource "libvirt_network" "MY_NETWORK" {
  name      = var.network_name
  autostart = true
  forward   = { mode = "nat" }
  bridge = {
    name  = "virbr1"
    stp   = "on"
    delay = "0"
  }
  ips = [{
    address  = cidrhost(var.network_cidr, 1)
    netmask  = cidrnetmask(var.network_cidr)
    dhcp = {
      ranges = [{
        start = cidrhost(var.network_cidr, 50)
        end   = cidrhost(var.network_cidr, 254)
      }]
    }
  }]
}
```

We will also leverage a `br0` NIC bridge (created outside of this tutorial) to give some of our VM LAN access to our home network. 

## Base VM Image

We could install the VM using a modified `.iso` or with `pxe` netboot setup, like we would with bare metal machines.

But, since we are already past the bare metal, a more convenient option is to directly download and use official images from [Debian](https://cloud.debian.org/images/cloud/), [Rocky](https://download.rockylinux.org/pub/rocky/10/images/x86_64/) or your preferred distribution.

By just pointing atthe URL, the `libvirt` `Tofu` module can download and register these base image in our hypervisor's libvirt:

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
  pool     = "disk-pool" # CHANGE to your pool
  capacity = 53687091200 # 50GB
  backing_store = {
    path   = libvirt_volume.debian_base.path # Base VM Image we downloaded earlier.
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
            volume = "YOUR_VM-cloudinit.iso" # Use the cloud-init iso/image we defined earlier
          }
        }
        target = { dev = "sda", bus = "sata" }
      }
    ]
    # Two network interfaces: bridge + MY_NETWORK
    interfaces = [
      {
        type  = "bridge"
        model = { type = "virtio" }
        source = { bridge = { bridge = "br0" } }
        wait_for_ip = { timeout = 300, source = "any" }
      },
      {
        type  = "network"
        model = { type = "virtio" }
        source = {
          network = {
            network = libvirt_network.MY_NETWORK.name
          }
        }
        wait_for_ip = { timeout = 300, source = "any" }
      }
    ]
  }
}
```

## DNS Records

Lastly, as it's nicer to deal with proper hostname rather than IP addresses, let's configure a Tofu DNS provider.

First, you need to configure have a DNS server allowing **RFC 2136** dynamic updates to a zone.

I will not detail the DNS server configuration here, but with `Bind`/`Named`, it could be done like that:

.1 First, generate a key:
```bash
$ dnssec-keygen -a HMAC-SHA512 -b 512 -n HOST example.com.
# it creates two files:
$ ls K*
Kexample.com.+165+27879.key  Kexample.com.+165+27879.private

# content
$ cat K*.private
[...]
Key: dGVzdC1leGFtcGxlLXRzaWctc2VjcmV0
[...]
```

.2 Second, allow the zone to be updated by said key: 
```json
key example.com. {
    algorithm       hmac-sha512;
    secret "odGVzdC1leGFtcGxlLXRzaWctc2VjcmV0";
};

zone "example.com" {
    type master;
    file "/var/lib/bind/db.example.com";
    allow-update { key "example.com."; };

    // In case you have an 'allow-transfer { "none"; };' in options
    //allow-transfer { <dnscherry ip>; };
};
```

You can once again use Tofu, and its [`dns`](https://registry.terraform.io/providers/hashicorp/dns/latest/docs) provider to manage the DNS zone.

```hcl
variable "dns_zone" { type = string default = "hexample.com." }

provider "dns" {
  update {
    server        = "192.168.1.25" # host that accepts RFC 2136 updates (BIND master, router, …)
    port          = 53
    key_name      = "terraform-homelab"
    key_algorithm = "hmac-sha256"
    key_secret    = "dGVzdC1leGFtcGxlLXRzaWctc2VjcmV0" # base64 TSIG secret from your nameserver config
  }
}

locals {
  # Short hostnames under var.dns_zone (trailing dot on the zone is normal for this provider).
  # Pick the interface index that matches the address you care about (here: first NIC = LAN bridge).
  my_hosts = {
    "your-vm" = libvirt_domain.YOUR_VM.devices.interfaces[0].ip[0].address
  }
}

resource "dns_a_record_set" "lan" {
  for_each  = local.my_hosts
  zone      = var.dns_zone
  name      = each.key
  addresses = [each.value]
  ttl       = 300
}

resource "dns_cname_record" "alias" {
  zone  = var.dns_zone
  name  = "registry"
  cname = "utility.${var.dns_zone}"
  ttl   = 300
}
```

## Generating Ansible Inventory

The last bit I like to do to link Terraform and Ansible (my go to infra CMS) is to have Terraform generate an inventory file.

It's nothing fancy, just a basic template leveraging the output of the other resources:

```hcl
locals {
  your_vm_ip = libvirt_domain.YOUR_VM.devices.interfaces[0].ip[0].address
}

resource "local_file" "inventory" {
  content = templatefile("${path.module}/inventory.ini.tpl", {
    your_vm_ip        = local.your_vm_ip
    debian_admin_user = var.debian_admin_user
  })
  filename          = "../ansible/inventory/inventory.ini"
  file_permission   = "0644"
}
```

```ini
# inventory.ini.tpl
[debian_vms]
your-vm ansible_host=${your_vm_ip} ansible_user=${debian_admin_user}
```

# Closing Thoughs

Honestly, after struggling a bit (my fault, I was using an old buggy version, make sure you are at least on `v0.9`), I was surprised how well I manage to get it working.

Being able to nuke entire stacks and re-create them at will, with just a `tofu destroy;tofy apply` is extremely convinient and satisfying.

Plus, the setup is extremely simple: just a base headless Debian with `libvirtd` installed.

Sure, I could have installed Proxmox, use the [Proxmox Tofu Provider](https://registry.terraform.io/providers/Terraform-for-Proxmox/proxmox/latest/docs) provider, and have something more ressembling AWS or GPC. But, in truth, this simple setup is already more than enough to cosplay as a bigtech Cloud Engineer, and it surely helped me a lot when deploying my @home [k8s cluster](TODO/link).

Kudos to [Duncan Mac-Vicar P.](https://www.mac-vicar.eu/) for sharing this provider.
