+++
title = 'K8s at home - Over-Engineered Self-Hosting'
date = 2026-02-01T16:55:15+01:00
draft = true
summary = "How to have more microservices than users"
+++

# Introduction

## Too Honest For CV Driven Development

Working at a "Big Tech" company has its perks: because of the scale such company operates at,
there are a lot of base services like DNS, Authentication, or Load Balancing, are
managed by dedicated core/infrastructure teams.

On one hand, it's great, because these core services require a lot
of baby sitting and eat a lot of the bandwidth which would be better
used elsewhere, like implementing higher level services closer to the
business & client needs.

On the other, it can leave gaps in your CV, especially if, like me, you have scruples about gratuitously over-engineering things at your employer's expense just to play with new and "not really relevant for the task" tech.

One such gap I currently have is deploying & managing Kubernetes Clusters.

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

## Base Archiecture

TODO: add a diagram with the most basic K8s "production" setup possible (control plane & its components, workers, Gateway API).

## Talos Nodes Creation

The Nodes were deployed using OpenTofu/Terraform. The [full code is available on GitHub](https://github.com/kakwa/home.tf/tree/main/terraform) and leverages the (somewhat clunky) [KVM/libvirt](https://registry.terraform.io/providers/dmacvicar/libvirt/latest/docs) and the [Talos](https://registry.terraform.io/providers/siderolabs/talos/latest/docs/resources/image_factory_schematic) Terraform/Tofu providers.

### Talos Image Factory

Talos has an [Image Factory](https://factory.talos.dev/) that enables creating custom images with specific versions, architectures, and extensions. The Terraform provider is used to configure and download the custom image:

```hcl
# Create a schematic with custom extensions
resource "talos_image_factory_schematic" "this" {
  schematic = yamlencode({
    customization = {
      systemExtensions = {
        officialExtensions = [
          "siderolabs/binfmt-misc",
        ]
      }
    }
  })
}

# Build the image URL from the schematic
locals {
  talos_version   = "v1.12.3"
  talos_image_url = "https://factory.talos.dev/image/${talos_image_factory_schematic.this.id}/${local.talos_version}/nocloud-amd64.qcow2"
}

# Download the image directly into libvirt
resource "libvirt_volume" "talos_base" {
  name = "talos-base.qcow2"
  pool = "mid-pool"
  create = {
    content = {
      url = local.talos_image_url
    }
  }
  target = {
    format = { type = "qcow2" }
  }
}
```

### Cluster Network

The cluster runs in its own isolated natted network with DHCP:

```hcl
resource "libvirt_network" "talos_network" {
  name      = "talos-network"
  autostart = true
  forward   = { mode = "nat" }
  bridge = {
    name  = "virbr1"
    stp   = "on"
    delay = "0"
  }
  ips = [{
    address  = "192.168.100.1"
    netmask  = "255.255.255.0"
    dhcp = {
      ranges = [{
        start = "192.168.100.50"
        end   = "192.168.100.254"
      }]
    }
  }]
}
```
### cloud-init Configuration

To bootstrap the nodes, in particular the network configuration, we need to pass cloud-init parameters:

```hcl
resource "libvirt_cloudinit_disk" "cp_seed" {
  for_each = local.control_plane_nodes

  name = "${each.key}-cloudinit"

  user_data = <<-EOF
    #cloud-config
    chpasswd:
      list: |
        root:password
      expire: false
    ssh_pwauth: true
    packages:
      - openssh-server
    timezone: UTC
  EOF

  meta_data = <<-EOF
    instance-id: ${each.key}
    local-hostname: ${each.key}
  EOF

  network_config = <<-EOF
    version: 2
    ethernets:
      eth0:
        dhcp4: true
  EOF
}

# Convert cloud-init to ISO volume
resource "libvirt_volume" "cp_seed_volume" {
  for_each = local.control_plane_nodes

  name = "${each.key}-cloudinit.iso"
  pool = "slow-pool"
  create = {
    content = {
      url = "file://${libvirt_cloudinit_disk.cp_seed[each.key].path}"
    }
  }
}
```

### Control Plane Nodes

The control plane uses 3 nodes with the minimal specs Talos (2 cores, 2GB RAM). For resiliency in production, this number can be increased to 5.

On paper this could be further increased to any odd value, but at the cost of latency. Keep in mind that the cluster stats are backed by the [raft](https://en.wikipedia.org/wiki/Raft_(algorithm))-based, strongly consistent, [Etcd](https://etcd.io/) key/value store.

Here is the definition of the nodes:

```hcl
locals {
  control_plane_nodes = {
    for i in range(3) : "talos-cp-${i + 1}" => {
      memory_mb = 2048
      vcpu      = 2
    }
  }
}

# Each node gets its own disk backed by the base image
resource "libvirt_volume" "cp_disk" {
  for_each = local.control_plane_nodes

  name     = "${each.key}-disk.qcow2"
  pool     = "mid-pool"
  capacity = 107374182400 # 100GB
  backing_store = {
    path   = libvirt_volume.talos_base.path
    format = { type = "qcow2" }
  }
  target = {
    format = { type = "qcow2" }
  }
}

resource "libvirt_domain" "control_plane" {
  for_each = local.control_plane_nodes

  name      = each.key
  memory    = each.value.memory_mb * 1024
  vcpu      = each.value.vcpu
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
            pool   = libvirt_volume.cp_disk[each.key].pool
            volume = libvirt_volume.cp_disk[each.key].name
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
            volume = "${each.key}-cloudinit.iso"
          }
        }
        target = { dev = "sda", bus = "sata" }
      }
    ]
    interfaces = [
      {
        type  = "network"
        model = { type = "virtio" }
        source = {
          network = {
            network = libvirt_network.talos_network.name
          }
        }
        wait_for_ip = { timeout = 300, source = "any" }
      }
    ]
  }
}
```

### Worker Nodes

Similarly, 6 worker nodes are deployed with the same specifications, a similar cloud-init iso and the same disk image:

```hcl
locals {
  worker_nodes = {
    for i in range(6) : "talos-worker-${i + 1}" => {
      memory_mb = 2048
      vcpu      = 2
    }
  }
}

# Boot disk per worker VM
resource "libvirt_volume" "worker_disk" {
  for_each = local.worker_nodes

  name     = "${each.key}-disk.qcow2"
  pool     = "mid-pool"
  capacity = 107374182400 # 100GB
  backing_store = {
    path   = libvirt_volume.talos_base.path
    format = { type = "qcow2" }
  }
  target = {
    format = { type = "qcow2" }
  }
}

resource "libvirt_domain" "workers" {
  for_each = local.worker_nodes

  name      = each.key
  memory    = each.value.memory_mb * 1024
  vcpu      = each.value.vcpu
  running   = true
  autostart = true

  # same hardware definition
}
```

## Debian Utility Node

In addition to the Talos nodes, for infrastructure services such as Ldap, I've created a small Debian VMs.

It's a bit out of topic, but I think this bootstrapping is interesting on its own.

We could install the VM using an `.iso` or with `pxe`, but the more convinient option is to directly download the official Debian cloud image, a bit like if we were using and AMI on AWS:

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

From there, we can bootstrap the VM using [`cloud-init`](https://docs.cloud-init.io/en/latest/index.html), doing the minimum for allowing further setup with [Ansible](https://docs.ansible.com/):
* create a boostrapping account `admin` with sudoers and an ssh key
* configure the network interfaces (including static IP)
* install and enable `qemu-guest-agent` (necessary to report back the static IP to the tf provider via `libvirtd`)

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

From there, create the Debian VM:

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
