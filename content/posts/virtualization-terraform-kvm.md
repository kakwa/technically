+++
title = 'Cloud @Home'
date = 2026-04-17T16:55:15+01:00
draft = true
summary = "Tidbits About Managing KVM Hypervisor With Tofu/Terraform"
+++

# Introduction

These days, @Work, we don't really have to care about server racking, cabling, powering, and the many other \*ings required when dealing with hardware. Logistic companies like Amazon/AWS have managed to hide it all behind a convenient API, and frankly, do it better.

That's only valid in a professional context however. @Home, unless you are /r/wallstreetbets inclined financially, putting your credit card into Vercel, AWS or GCP is a bit risky for your bank account (see [these](https://www.reddit.com/r/aws/comments/lbqcos/my_forgotten_account_has_a_20000_bill_how_screwed/) [billing](https://www.reddit.com/r/googlecloud/comments/1kimlc8/ddos_98k_firebase_bill_guy_the_billing_support/) [horror](https://www.reddit.com/r/nextjs/comments/1o1zs2u/unexpected_1100_vercel_bill_im_just_an_employee_i/) [stories](https://www.youtube.com/watch?v=ihnGot4nUS4)). Homelabing with an old rig in the closet or a fancy 10" rack of refurb mini-PCs is often a more sensible option.

{{< figure src="/images/cloud-at-home/meme.jpg" alt="meme cloud at home" caption="Cloud @Home" >}}

But it seems to come at a cost: things are no longer hidden behind convenient Cloud APIs...

... or so it seems...

In reality, we can actually re-use at home most of the same tools available for the Cloud.

This post will present one of them: **Terraform/Tofu** and show how it can manage a simple `LibVirtd`/`KVM` hypervisor.

# Creating Stuff

Making an hypervisor out of a Debian install is extremely easy: just run `apt install libvirt-daemon`.

But past that, wouldn't it be nice to be able to manage our `libvirt`/`kvm` hypervisor in `HCL` like we would on an AWS account?

Well, thanks to dmacvivar's [libvirt provider](https://registry.terraform.io/providers/dmacvicar/libvirt/latest/docs), we can, and here is how.

TODO: as note  > Don't hesitate to play with this code, you can download the full [main.tf](/files/kvm-terraform/main.tf), and with a few tweaks, you should be able to apply it.
               > to apply, run `tufo apply` as root. 
               > tofu can be installed <link>

## Provider Setup

First, declare the `libvirt` provider and point it at the local hypervisor:

```hcl
terraform {
  required_providers {
    libvirt = {
      source  = "dmacvicar/libvirt"
      version = "~> 0.9.7"
    }
  }
}

provider "libvirt" {
  uri = "qemu:///system"
}
```

`qemu:///system` connects to the local hypervisor. You can also point it at a remote host over SSH with `qemu+ssh://<USER>@<HOST>/system`.
But be aware that it could make image management fiddly (local FS vs remote FS).

## Networks

First we need some LAN segments to put our VMs in. And also, usually, it could be nice to give these VMs access to our home network.

The `libvirt` provider can manage these networks with its `libvirt_network` resources. 

Here, we simply declare a private network:

```hcl
locals {
  network_name = "homelab-nat"
  network_cidr = "192.168.150.0/24"
  bridge_name  = "br0"
}

resource "libvirt_network" "MY_NETWORK" {
  name      = local.network_name
  autostart = true
  forward   = { mode = "nat" }
  bridge = {
    name  = "virbr1"
    stp   = "on"
    delay = "0"
  }
  ips = [{
    address  = cidrhost(local.network_cidr, 1)
    netmask  = cidrnetmask(local.network_cidr)
    dhcp = {
      ranges = [{
        start = cidrhost(local.network_cidr, 50)
        end   = cidrhost(local.network_cidr, 254)
      }]
    }
  }]
}
```

Outside of Tofu & libvirt we will also create `br0` NIC bridge to give some of our VMs direct access to our home network.

To create it temporarily:

```bash
ip link add name br0 type bridge
ip link set br0 up
```

To make it persistent on Debian, edit `/etc/network/interfaces`:

```
auto br0
iface br0 inet dhcp
    bridge_ports eth0
    bridge_stp off
    bridge_fd 0
```

Replace `eth0` with your actual physical NIC.

## Storage Pools

Before creating any volumes, we need storage pools to hold them. A pool is just a directory (or LVM VG, NFS share, …) that `libvirt` manages.

Here we declare three pools that the rest of the configuration will reference:

```hcl
resource "libvirt_pool" "MY_DISK_POOL" {
  name = "MY_DISK_POOL"
  type = "dir"
  target = {
    path = "/var/lib/libvirt/images/MY_DISK_POOL"
  }
}
```

`type = "dir"` is the simplest option: `libvirt` will create the directory if it doesn't exist and track volumes inside it. You can use `"logical"` for LVM-backed pools or `"netfs"` for NFS if you want something more elaborate.

## Base VM Image

We could install the VM using a modified `.iso` or with `pxe` netboot setup, like we would with bare metal machines.

But, since we are already past the bare metal, a more convenient option is to directly download and use official images from [Debian](https://cloud.debian.org/images/cloud/), [Rocky](https://download.rockylinux.org/pub/rocky/10/images/x86_64/) or your preferred distribution.

By just pointing at the URL, the `libvirt` `Tofu` module can download and register these base image in our hypervisor's libvirt:

```hcl
locals {
  debian_image_url = "https://cloud.debian.org/images/cloud/trixie/latest/debian-13-generic-amd64.qcow2"
}

resource "libvirt_volume" "debian_base" {
  name = "debian-base.qcow2"
  pool = libvirt_pool.MY_DISK_POOL.name
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
  pool = libvirt_pool.MY_DISK_POOL.name
  create = {
    content = {
      url = "file://${libvirt_cloudinit_disk.YOUR_VM_seed.path}"
    }
  }
}
```

Note: we also install and enable `qemu-guest-agent` here. Installing it is necessary to have the VM report back its IP(s) to the Tofu `libvirt` provider, otherwise, the provider will error in timeout.

## VM Creation

Once we have the base OS image and some cloud-init configuration, we can create the VM itself.

Let's start with the main disk:

```hcl
resource "libvirt_volume" "YOUR_VM_disk" {
  name     = "YOUR_VM-disk.qcow2"
  pool     = libvirt_pool.MY_DISK_POOL.name
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
  type      = "kvm"
  memory    = 1048576  # 1GB (1024 * 1024)
  vcpu      = 2
  running   = true
  autostart = true

  os = {
    type         = "hvm"
    type_arch    = "x86_64"
    type_machine = "q35"

    # Wierdly in bios mode, virtio on disks was not working.
    # The VM was not booting completely.
    # So EFI it is.
    firmware     = "efi"
  }

  cpu = {
    mode = "host-passthrough"
  }

  # Necessary for EFI
  features = {
    acpi = true
    apic = {}
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
            pool   = libvirt_pool.MY_DISK_POOL.name
            volume = libvirt_volume.YOUR_VM_seed_volume.name # Use the cloud-init iso/image we defined earlier
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

    # Usefull to get a console without vnc/spice
    # run > sudo screen `virsh ttyconsole YOUR_VM`
    consoles = [
      {
        type   = "pty"
        target = { type = "serial", port = "0" }
      }
    ]

    # GUI/spice troubleshooting (through virt-manager for example)
    videos = [
      { model = { type = "virtio", heads = 1, primary = "yes" } }
    ]
    graphics = [
      {
        spice = {
          autoport = "no"
          port     = 5930
          listen   = "127.0.0.1"
          listeners = [
            {
              type = "address"
              address = {
                address =  "127.0.0.1"
              }
            }
          ]
        }
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
locals {
  dns_zone = "example.com."
  # Pick the interface index that matches the address you care about (here: first NIC = LAN bridge).
  my_hosts = {
    "your-vm" = libvirt_domain.YOUR_VM.network_interface[0].addresses[0] # FIXME should be recover another way
  }
}

provider "dns" {
  update {
    server        = "192.168.100.100" # DNS server that accepts RFC 2136 updates (BIND master, router, …)
    port          = 53
    key_name      = "terraform-homelab."
    key_algorithm = "hmac-sha512"
    key_secret    = "dGVzdC1leGFtcGxlLXRzaWctc2VjcmV0" # base64 TSIG secret from your nameserver config
  }
}

resource "dns_a_record_set" "lan" {
  for_each  = local.my_hosts
  zone      = local.dns_zone
  name      = each.key
  addresses = [each.value]
  ttl       = 300
}

resource "dns_cname_record" "alias" {
  zone  = local.dns_zone
  name  = "alias-myvm"
  cname = "myvm.${local.dns_zone}"
  ttl   = 300
}
```

## Generating Ansible Inventory

The last bit I like to do to link Terraform and Ansible (my go to infra CMS) is to have Terraform generate an inventory file.

It's nothing fancy, just a basic template leveraging the output of the other resources:

```hcl
locals {
  your_vm_ip = libvirt_domain.YOUR_VM.network_interface[0].addresses[0] # FIXME should be recover another way
}

resource "local_file" "inventory" {
  content = templatefile("${path.module}/inventory.ini.tpl", {
    your_vm_ip        = local.your_vm_ip
    debian_admin_user = local.debian_admin_user
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

# Closing Thoughts

Honestly, after struggling a bit (my fault, I was using an old buggy version, make sure you are at least on `v0.9`), I was surprised how well I manage to get it working.

Being able to nuke entire stacks and re-create them at will, with just a `tofu destroy;tofu apply` is extremely convenient and satisfying.

Plus, the setup is extremely simple: just a base headless Debian with `libvirtd` installed.

Sure, I could have installed Proxmox, use the [Proxmox Tofu Provider](https://registry.terraform.io/providers/Terraform-for-Proxmox/proxmox/latest/docs) provider, and have something more resembling AWS or GCP. But, in truth, this simple setup is already more than enough to cosplay as a bigtech Cloud Engineer, and it surely helped me a lot when deploying my @home [k8s cluster](TODO/link).


Once again, you can download the full [main.tf](/files/kvm-terraform/main.tf), and play with it.

Kudos to [Duncan Mac-Vicar P.](https://www.mac-vicar.eu/) for sharing this provider.
