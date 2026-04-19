+++
title = 'K8s at home - Over-Engineered Self-Hosting'
date = 2026-02-01T16:55:15+01:00
draft = true
summary = "How to have more microservices than users"
+++

# Introduction

## Too Honest For CV Driven Development

Working at a "Big Tech" company has its perks: because of the scale such company operates at,
you typically don't have to deal with basic services like DNS, authentication or CI/CD as
these services are managed by dedicated core teams.

On one hand, it's great: badly deployed on the side by an over-worked ops or dev,
these core services require a lot of babysitting, cause tons of context switching
to fix minor issues and in the end, eat a lot of time which should actually be used
to solve the problems our customers pay us for.

On the other, it can leave gaps in your CV, especially if like me, you have scruples
about gratuitously over-engineering things just to learn new tools/framework 
at your employer's expense on the job.

One such gap I currently have is deploying and managing Kubernetes Clusters.

To be honest, I kind of avoided diving into K8s. Maybe it's an unfounded bias on my part,
but Kubernetes always felt a bit overcomplicated, clunky and not very pleasant to manage.

But, well, it's what the cool kids are doing, so I need to fill this gap in my CV.

Through the magic of Open Source, the Internet and a 12-year-old PC
with 32GB of RAM (actually quite valuable these days :p), I should be able to manage.

## What I Want Out Of This

By the end of this process, I want:

* Mostly automated base KVM hypervisor deployment
* The Base Kubernetes Cluster, with all the control plane bits
* HTTPS load balancer + DNS
* CI/CD with Argo (and integration with GitHub)
* Docker/Container Registry

This infrastructure should be managed through the usual "configuration as code" tools like Ansible, Tofu and a bit of scripting.

The code is available [here](https://github.com/kakwa/home.tf)

# Kubernetes Basics

## Choosing A Kubernetes Distribution

Like chocolate, k8s comes in various flavors. I contemplated deploying it on a traditional distribution, maybe dusting off my Gentoo skills for example.

But in the end, I ended taking the easier path of picking a specialized distribution.

I considered the following ones:

**Talos Linux** is an immutable, API-driven operating system built specifically and exclusively for Kubernetes. It has no SSH access, no shell, and everything is configured through declarative configs and the `talosctl` CLI.

**Flatcar Container Linux** is a fork of the original CoreOS Container Linux backed by [Kinvolk](https://kinvolk.io/) now part of Microsoft. It's a minimal and immutable distribution but with SSH access.

**OpenShift & Fedora CoreOS** is Red Hat's successor to the original CoreOS.

I ended up choosing **Talos Linux**. It looked like the most common option on [/r/kubernetes](https://www.reddit.com/r/kubernetes/), and it's not linked (yet) to the usual corporate vampires.

## Kubernetes Base Architecture

Kubernetes has three main categories of components. First is the Control Plane, which coordinates the cluster. Second are the Workers, i.e. the nodes actually running stuff.
The third and last category are the `Cluster Add-Ons` adding optional (but nearly always deployed) things like public DNS record management, load-balancing or audit tools.

Control Plane Components:

* [etcd](https://etcd.io/) (third party): Consistent and highly-available key value store for all API server data & states.
* [kube-apiserver](https://kubernetes.io/docs/reference/command-line-tools-reference/kube-apiserver/): The core component server that exposes the Kubernetes HTTP API.
* [kube-scheduler](https://kubernetes.io/docs/reference/command-line-tools-reference/kube-scheduler/): Looks for Pods not yet bound to a node, and assigns each Pod (~container execution) to a suitable node.
* [kube-controller-manager](https://kubernetes.io/docs/reference/command-line-tools-reference/kube-controller-manager/): Runs the controller loops (replication, namespace, endpoint, etc).

Worker Components:

* [kubelet](https://kubernetes.io/docs/reference/command-line-tools-reference/kubelet/): Ensures that Pods are running, including their containers.
* container runtime (third party): Software responsible for running containers, in our case [containerd](https://containerd.io/), but others are possible

Cluster Add-ons (non-exhaustive):

* [Gateway API](https://kubernetes.io/docs/concepts/services-networking/gateway/) (third party): OSI Layer 4 and 7 load balancer to connect our Pods to the outside, here, we will use Traefik, but [other implementations are available](https://gateway-api.sigs.k8s.io/implementations/#gateway-controller-implementation-status). It replaces the old [Ingress Controllers](https://kubernetes.io/docs/concepts/services-networking/ingress-controllers/).
* [ExternalDNS](https://kubernetes-sigs.github.io/external-dns/latest) (third party): DNS record manager, which integrates with various DNS providers' APIs (AWS Route53, GCP DNS, OVH, Gandi, RFC2136) and gives names to your exposed services.

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
          ┌─────────────────────┼──────────────────────┐             |    │                              │
 ┌────────▼─────────┐  ┌────────▼─────────┐  ┌─────────▼────────┐    |    │ kube-scheduler               │
 │  Worker Node 1   │  │  Worker Node 2   │  │   Worker Node N  │    |    │                              │
 │ kubelet          │  │ kubelet          │  │  kubelet         │    |    │ kube-controller-manager      │
 │ containerd       │  │ containerd       │  │  containerd      │    |    │ - Namespace controller       │
 │ ---------------- │  │ ---------------  │  │  --------------- │    |    │ - Replication controller     │
 │ Pods             │  │ Pods             │  │  Pods            │    |    │                              │
 │ - App containers │  │ - App containers │  │ - App containers │    |    │ etcd (cluster state storage) │
 │ - Sidecars       │  │                  │  │                  │    |    │                              │
 └────────┬─────────┘  └────────┬─────────┘  └─────────┬────────┘    |    └───────────────┬──────────────┘
          └─────────────────────┴──────────────────────┴── Kubernetes API (mTLS)──────────┘
                                                                     |
```

The cluster components talk to each other using http & gRPC and usually authenticate each other using mutual TLS certificates.

In addition, Talos adds its own [components (apid, machined, etc)](https://docs.siderolabs.com/talos/v1.6/learn-more/components) to configure the cluster and manage their idiosyncrasies (custom init, etc).

# Non-K8s Bits

This K8s deployment required also a few bits outside of the cluster itself.

First, there was the recommissioning of my old rig itself (i5 2500k/32GB DDR3) which required a bit of work, like installing some new storage with 3d printed adapters ([5.25" to 3.5"](https://www.printables.com/model/1306664-35-to-525-hdd-silencer-bracket) + [3.5" to 2.5"](https://www.printables.com/model/229753-small-hdd-adapter-35-inch-to-25-inch))
I also did some power consumption optimization (CPU down-clocking, removing/disabling unnecessary cards) to not have the thing draw ~120W continuously. It still draws ~50W however, which is... "not great, not terrible"...
(I might consider replacing it with a mini-pc or old laptop to be honest).

After that, I installed the latest Debian and applied [the following Ansible playbook](https://github.com/kakwa/home.tf/blob/main/ansible/hypervisor.yml) to make it a basic hypervisor out of it.

I also deployed an [internal DNS](https://github.com/kakwa/ansible-openbsd) server with TSIG/RFC 2136 dynamic zones on a [Sparc V100](/posts/silly-sun-server-software) using OpenBSD for funsies.

And finally, I've created a Debian `utility` VM for support services like a Docker image `registry` or an `ldap` server directory (VM created like in [Cloud @Home](/posts/virtualization-terraform-kvm) and configured through this [utility.yml](https://github.com/kakwa/home.tf/blob/main/ansible/utility.yml) ansible playbook).

# Deploy That Damn Cluster Already!

Like the Debian utility VM, I've also used Tofu to create the k8s/Talos Cluster, except this time, we are "simply" creating nine nodes (3 control plane + 6 workers) instead of one (and I do mean "simply", the `for(each)` loop really feels like cheating sometimes).

The [full code is available on GitHub](https://github.com/kakwa/home.tf/tree/main/terraform) and leverages the [KVM/libvirt](https://search.opentofu.org/provider/dmacvicar/libvirt/latest/docs), the [Talos](https://search.opentofu.org/provider/siderolabs/talos/latest/docs/resources/image_factory_schematic) and the [`dns`](https://search.opentofu.org/provider/hashicorp/dns/latest/docs) Tofu providers.

Be aware that unlike the Tofu code from [Hyperscaler Cloud @Home](posts/virtualization-terraform-kvm), it's more tied to my home network environment, and would need a fair bit of tweaking to run on your setup.

## Talos Image Management

Talos has an [Image Factory](https://factory.talos.dev/) for creating custom images with specific versions, architectures, and extensions.

In my case, I left it nearly vanilla, but you can add things if you have special needs, for example, completely at random in these AI days, NVIDIA drivers for CUDA workloads.

To get the list of customization/versions, simply go through the form and grab the generated `schematic` at the end.

The schematic can be used to configure and download the Talos image in the Tofu provider, and register it in Libvirt:

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

It's not k8s, but we need a network for our cluster.

Let's create one quickly, behind a NAT and with DHCP:

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


## Control Plane Nodes

Our Kubernetes control plane will use 3 nodes with the minimal Talos specs, i.e. 2 cores+2GB RAM as we are fairly limited in space here.

For resiliency in production, this number is usually increased to 5.
On paper this could be further increased to any odd value, but at the cost of latency.
Underneath all that, the cluster states are backed by the [raft](https://en.wikipedia.org/wiki/Raft_(algorithm))-based, strongly consistent, [etcd](https://etcd.io/) key/value store, which explains this behavior.

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
```

To bootstrap the nodes, in particular the network configuration, we need to pass a few `cloud-init` parameters, which we can create with the [`libvirt_cloudinit_disk`](https://search.opentofu.org/provider/dmacvicar/libvirt/latest/docs/resources/cloudinit_disk) resource from the libvirt Tofu provider:

```hcl
resource "libvirt_cloudinit_disk" "cp_seed" {
  for_each = local.control_plane_nodes

  name = "${each.key}-cloudinit"
  user_data = <<-EOF
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

We also need some disks for our nodes, using the Talos image as a base:

```hcl
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
```

And finally, we can create the VMs themselves, reusing these disks:

```hcl
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

Similarly, we will deploy 6 nodes which will be used as workers.

Here is a rough outline of the code, but since it's mostly identical to the control plane, this is a cut down version of the code as it's just more of the same:

```hcl
locals {
  worker_nodes = {
    for i in range(6) : "talos-worker-${i + 1}" => {
      [...]
    }
  }
}

resource "libvirt_cloudinit_disk" "worker_seed" {
  for_each = local.worker_nodes
  name = "${each.key}-cloudinit"
  [...]
}

# Convert cloud-init to ISO volume
resource "libvirt_volume" "cp_seed_volume" {
  for_each = local.control_plane_nodes
  name = "${each.key}-cloudinit.iso"
  [...]
}

# main worker VM disks
resource "libvirt_volume" "worker_disk" {
  for_each = local.worker_nodes
  [...]
}

resource "libvirt_domain" "workers" {
  for_each = local.worker_nodes
  [...]
}
```

# At Last, K8S & Talos Setup

## Cluster Configuration Deployment

After the VMs are up, we need to drive Talos from a machine that can reach them.

The [home.tf](https://github.com/kakwa/home.tf/tree/main/terraform) setup uses a small script plus an environment file so the steps are explicit; the same could be done from Terraform (e.g. `null_resource` + `local-exec`), but a script makes the sequence easier to follow and re-run by hand.

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


## Persistent iSCSI Volumes

TODO

## Log Centralization

TODO

## Prometheus

TODO
