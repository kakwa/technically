+++
title = 'K8s at home - Over-Engineered Self-Hosting'
date = 2026-02-01T16:55:15+01:00
draft = true
summary = "How to have more microservices than users"
+++

# Introduction

## Too Honest For CV Driven Development

Working at a "Big Tech" company has its perks: because of the scale such company operates at,
there are a lot of base services like DNS, authentication, or load balancing that are
managed by dedicated core/infrastructure teams.

On one hand, it's great, because these core services require a lot
of babysitting and eat a lot of the bandwidth which would be better
used elsewhere, namely implementing higher level services closer to the
business & client needs.

On the other, it can leave gaps in your CV, especially if, like me, you have scruples
about gratuitously over-engineering things at your employer's expense just to learn new
(irrelevant to the project) tools/framework on the job.

One such gap I currently have is deploying and managing Kubernetes Clusters.

To be honest, I kind of avoided diving into K8s. Maybe it's an unfounded bias on my part,
but Kubernetes always felt a bit overcomplicated, clunky and not very pleasant to manage.

But, well, it's what the cool kids are doing, so I need to fill this gap in my CV.

Through the magic of Open Source, the Internet and a 12 years old PC
with 32GB of RAM (actually quite valuable these days :p), I should be able to manage.

## What I Want Out Of This

By the end of this process, I want:

* Mostly automated base KVM hypervisor deployment
* The Base Kubernetes Cluster, with all the control plane bits
* HTTPS load balancer + DNS
* CI/CD with Argo (and integration with GitHub)
* Docker/Container Registry

# Kubernetes Basics

## Chosing A Kubernetes Distribution

Like chocolate, k8s comes in various flavors. I contemplated deploying it on a traditional distribution, maybe dusting off my Gentoo skills for example.

But in the end, I ended taking the easier path of picking a specialized distribution.

I considered the following ones:

**Talos Linux** is an immutable, API-driven operating system built specifically and exclusively for Kubernetes. It has no SSH access, no shell, and everything is configured through declarative configs and the `talosctl` CLI.

**Flatcar Container Linux** is a fork of the original CoreOS Container Linux backed by [Kinvolk](https://kinvolk.io/) now part of Microsoft. It's a minimal, immutable OS optimized for containers with a more traditional approach (SSH access, shell available).

**OpenShift & Fedora CoreOS** is Red Hat's successor to the original CoreOS.

I ended up choosing **Talos Linux**. It looked like the most common option on [/r/kubernetes](https://www.reddit.com/r/kubernetes/), and it's not linked (yet) to the usual corporate vampires.

## K8s Base Architecture

Control Plane Components:

* [etcd](https://etcd.io/) (third party): Consistent and highly-available key value store for all API server data & states.
* [kube-apiserver](https://kubernetes.io/docs/reference/command-line-tools-reference/kube-apiserver/): The core component server that exposes the Kubernetes HTTP API.
* [kube-scheduler](https://kubernetes.io/docs/reference/command-line-tools-reference/kube-scheduler/): Looks for Pods not yet bound to a node, and assigns each Pod (~container execution) to a suitable node.
* [kube-controller-manager](https://kubernetes.io/docs/reference/command-line-tools-reference/kube-controller-manager/): Runs the controller loops (replication, namespace, endpoint, etc).

Worker Components:

* [kubelet](https://kubernetes.io/docs/reference/command-line-tools-reference/kubelet/): Ensures that Pods are running, including their containers.
* container runtime (third party): Software responsible for running containers, in our case [containerd](https://containerd.io/), but others are possible

Load Balancer:

* [Gateway API](https://kubernetes.io/docs/concepts/services-networking/gateway/) (third party): OSI Layer 4 and 7 load balancer to connect our Pods to the outside, here, we will use Traefik, but [other implementations are available](https://gateway-api.sigs.k8s.io/implementations/#gateway-controller-implementation-status). It replaces the old [Ingress Controllers](https://kubernetes.io/docs/concepts/services-networking/ingress-controllers/).

```
                          Worker/Apps Runtime                        |            Control Plane
                                                                     |
                   ┌────────────────────────────┐                    |
                   │         Internet           │                    |
                   └────────────┬───────────────┘                    |
                                │                                    |
                   ┌────────────▼───────────────┐                    |    ┌──────────────────────────────┐
                   │    Gateway API (Traefik)   │                    |    │      Control Plane Nodes     │
                   │----------------------------│                    |    │------------------------------│
                   │ - HTTP / TCP Routing       │                    |    │ kube-apiserver               │
                   │ - TLS Termination          │                    |    │ - Kubernetes HTTP API        │
                   └────────────┬───────────────┘                    |    │ - AuthN / AuthZ / Admission  │
            ┌───────────────────┼───────────────────────┐            |    │                              │
 ┌──────────▼──────┐   ┌────────▼────────┐   ┌──────────▼───────┐    |    │ kube-scheduler               │
 │  Worker Node 1  │   │  Worker Node 2  │   │   Worker Node N  │    |    │                              │
 │ kubelet         │   │ kubelet         │   │  kubelet         │    |    │ kube-controller-manager      │
 │ containerd      │   │ containerd      │   │  containerd      │    |    │ - Namespace controller       │
 │ ----------------│   │ --------------- │   │  --------------- │    |    │ - Replication controller     │
 │ Pods            │   │ Pods            │   │  Pods            │    |    │                              │
 │ - App containers│   │ - App containers│   │ - App containers │    |    │ etcd (cluster state storage) │
 │ - Sidecars      │   │                 │   │                  │    |    │                              │
 └──────────┬──────┘   └────────┬────────┘   └──────────┬───────┘    |    └──────────────────┬───────────┘
            └───────────────────┴───────────────────────┴─Kubernetes API (mTLS)──────────────┘
                                                                     |
```

The cluster components talks to each other using http & gRPC and usually authenticate each other using mutual TLS certificates.

In addition, Talos adds its own [components (apid, machined, etc)](https://docs.siderolabs.com/talos/v1.6/learn-more/components) to configure the cluster and manage their idiosyncrasies (custom init, etc).

# A Few None-k8s Stuff

## KVM Host Setup

My old computer, is well, old. It required a bit of maintenance like a [hacky video card](/posts/gpu-pciex1/) to get a video output, some [5.25" to 3.5"](https://www.printables.com/model/1306664-35-to-525-hdd-silencer-bracket) and [3.5" to 2.5"](https://www.printables.com/model/229753-small-hdd-adapter-35-inch-to-25-inch) 3D printed adapters to install disks and some [Firmware Update](https://gist.github.com/kakwa/45b7ac675ea28fe0468dec3efdcd271c).

Aside from that, I installed the latest Debian (13/Trixie at the time of this writing) and configured it through [the following Ansible playbook](https://github.com/kakwa/home.tf/blob/main/ansible/hypervisor.yml).

This playbook configures:

* Basic tools I like to use (zsh, btop, nmap, etc)
* `OpenTofu`, `kubectl` and `talosctl` (with its [packaging](https://github.com/kakwa/misc-pkg/tree/main/talosctl))
* Avahi for local mDNS resolution (`kvm.local`)
* LVM setup for the various drives in the machine, in 3 tiers: slow (spinning rust), medium (base SSD), fast (OCZ VeloDrive) (lets ignore the fact the old OZC are actually slower than the SATA SSD...).
* [libvirt](https://libvirt.org/docs.html)
* Some Serial Console, just in case

In addition, on my other [Sparc V100](/posts/silly-sun-server-software) using OpenBSD, I've also deployed an [internal DNS](https://github.com/kakwa/ansible-openbsd) server with TSIG/RFC 2136.

## Debian Utility Node

In addition to the Talos nodes, for infrastructure services such as LDAP, I've created a small Debian VMs.

It's a bit out of topic, but I think this bootstrapping is interesting on its own.

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

From there, we can bootstrap the VM using [`cloud-init`](https://docs.cloud-init.io/en/latest/index.html), doing the minimum for allowing further setup with [Ansible](https://docs.ansible.com/):
* create a bootstrapping account `admin` with sudoers and an ssh key
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

# Deploy That Damn Cluster Already!

Like the Debian utily VM, the nodes were deployed using OpenTofu/Terraform.

The [full code is available on GitHub](https://github.com/kakwa/home.tf/tree/main/terraform) and leverages the (somewhat clunky) [KVM/libvirt](https://registry.terraform.io/providers/dmacvicar/libvirt/latest/docs) and the [Talos](https://registry.terraform.io/providers/siderolabs/talos/latest/docs/resources/image_factory_schematic) Terraform/Tofu providers.

## Talos Image Factory

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
  talos_version   = "v1.12.6"
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

## Cluster Network

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
## cloud-init Configuration

To bootstrap the nodes, in particular the network configuration, we need to pass cloud-init parameters:

```hcl
resource "libvirt_cloudinit_disk" "cp_seed" {
  for_each = local.control_plane_nodes

  name = "${each.key}-cloudinit"

  user_data = <<-EOF
    #cloud-config
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

## Control Plane Nodes

The control plane uses 3 nodes with the minimal specs Talos (2 cores, 2GB RAM). For resiliency in production, this number can be increased to 5.

On paper this could be further increased to any odd value, but at the cost of latency. Keep in mind that the cluster stats are backed by the [raft](https://en.wikipedia.org/wiki/Raft_(algorithm))-based, strongly consistent, [etcd](https://etcd.io/) key/value store.

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

## Worker Nodes

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

# At Last, K8S & Talos Setup

## Cluster Configuration Deployment

After the VMs are up, we need to drive Talos from a machine that can reach them. The [home.tf](https://github.com/kakwa/technically.kakwalab.ovh/tree/main/home.tf) setup uses a small script plus an environment file so the steps are explicit; the same could be done from Terraform (e.g. `null_resource` + `local-exec`), but a script makes the sequence easier to follow and re-run by hand.

### Environment file (`talos-env.sh`) from Terraform

Terraform generates `talos-env.sh` from the `env.tpl` template so the script knows control plane IPs, worker IPs, and the control-plane VIP. The IPs come from libvirt domain interface addresses (or a `virsh domifaddr` fallback when VMs are not running during `terraform apply`). The template looks like:

```hcl
# env.tpl (Terraform template)
# Generated from Terraform. Talos node IPs from virsh domifaddr when VMs are running.

export CONTROL_PLANE_IP=(${join(" ", [for ip in control_plane_ips : "${"\""}${ip}${"\""}"])})
export WORKER_IP=(${join(" ", [for ip in worker_ips : "${"\""}${ip}${"\""}"])})
export CONTROL_PLANE_VIP="${control_plane_vip}"
```

The `local_file.env` resource in `inventory.tf` renders this with `control_plane_ips`, `worker_ips`, and `control_plane_vip` (from `var.control_plane_vip`), and writes `terraform/talos-env.sh`. The init script sources it.

### Configuration init

From the directory where `talos-env.sh` and the script live, source the env and generate the Talos/Kubernetes config with a temporary endpoint (first control plane node):

```bash
source ./talos-env.sh
CLUSTER_NAME="kawkalab-talos-cluster"
BOOTSTRAP_CP="${CONTROL_PLANE_IP[0]}"
TEMP_ENDPOINT="https://${BOOTSTRAP_CP}:6443"

talosctl gen config "${CLUSTER_NAME}" "${TEMP_ENDPOINT}"
```

This creates `controlplane.yaml`, `worker.yaml`, and `talosconfig`. The script skips this if those files already exist.

### Configuration bootstrapping

Apply the generated config to all nodes (control planes first, then workers), then bootstrap the cluster once:

```bash
# Apply control planes
for ip in "${CONTROL_PLANE_IP[@]}"; do
  talosctl apply-config --insecure --nodes "${ip}" --file controlplane.yaml
done

# Apply workers
for ip in "${WORKER_IP[@]}"; do
  talosctl apply-config --insecure --nodes "${ip}" --file worker.yaml
done

# Wait for nodes to come back up
sleep 120

# Bootstrap (only once, on the first control plane)
talosctl bootstrap --endpoints "${BOOTSTRAP_CP}" --nodes "${BOOTSTRAP_CP}"
```

The script uses the node lists from `talos-env.sh` so it does not rely on Talos discovery. After bootstrap, it waits for cluster health (with a timeout) and then fetches the kubeconfig:

```bash
talosctl health --endpoints "${BOOTSTRAP_CP}" --nodes "${BOOTSTRAP_CP}" \
  --control-plane-nodes "$(IFS=,; echo "${CONTROL_PLANE_IP[*]}")" \
  --worker-nodes "$(IFS=,; echo "${WORKER_IP[*]}")" \
  --wait-timeout 5m

talosctl kubeconfig . --endpoints "${BOOTSTRAP_CP}" --nodes "${BOOTSTRAP_CP}"
```

### VIP for kubectl

To talk to the API through a single, stable address, the script enables a virtual IP on the control plane nodes and points the cluster endpoint at it. First it patches the machine config to add the VIP on the main interface:

```bash
for ip in "${CONTROL_PLANE_IP[@]}"; do
  talosctl patch mc --endpoints "${ip}" --nodes "${ip}" --patch "
machine:
  network:
    interfaces:
      - interface: eth0
        dhcp: true
        vip:
          ip: ${CONTROL_PLANE_VIP}
"
done
```

After a short wait for VIP election, it updates the cluster endpoint to use the VIP and regenerates the kubeconfig:

```bash
for ip in "${CONTROL_PLANE_IP[@]}"; do
  talosctl patch mc --endpoints "${ip}" --nodes "${ip}" --patch "
cluster:
  controlPlane:
    endpoint: https://${CONTROL_PLANE_VIP}:6443
"
done

talosctl kubeconfig . --endpoints "${BOOTSTRAP_CP}" --nodes "${BOOTSTRAP_CP}"
```

Then use the VIP for kubectl: `export KUBECONFIG=$(pwd)/kubeconfig` and `kubectl get nodes`. The control plane VIP is the same one used in DNS (e.g. RFC 2136) for the Talos/Kubernetes API hostname.

## DNS Manager

TODO

## Traefik Deployment

TODO

TODO VIP for k8s(?)

## Our First App!

TODO

# Additional Bits

## ArgoCD

TODO

## Management UI

TODO


## Persistant iSCSI Volumes

TODO

## Log Centralization

TODO

## Prometheus

TODO
