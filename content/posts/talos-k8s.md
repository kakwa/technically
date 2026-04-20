+++
title = 'Over-Engineered My Self-Hosting with Kubernetes'
date = 2026-04-19T16:55:15+01:00
draft = true
summary = "Is 'just use a vps' wrong?"
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
about gratuitously over-engineering things just to learn new tools/frameworks
at your employer's expense on the job.

One such gap I currently have is deploying and managing Kubernetes Clusters.

To be honest, I kind of avoided diving into K8s. Maybe it's an unfounded bias on my part,
but Kubernetes always felt a bit overcomplicated, clunky and not very pleasant to manage.

But, well, it's what the cool kids are doing, so I need to fill this gap in my CV.

Through the magic of Open Source, the Internet and a 12-year-old PC
with 32GB of RAM (actually quite valuable these days :p), I should be able to manage.

{{< figure src="/images/talos-k8s/talos-k8s-intro-stock.jpg" alt="Complex Highway Interchange" caption="Is complexity always justified?" >}}

## What I Wanted Out Of This

By the end of this process, I want:

* A mostly automated base KVM hypervisor deployment
* The Base Kubernetes Cluster, with all the control plane bits
* HTTPS load balancer + DNS
* CI/CD with Argo (and integration with GitHub)
* Docker/Container Registry

This infrastructure should also be managed through the usual "configuration as code" tools, namely Ansible, Tofu and a bit of scripting.

I'm making the code available [here](https://github.com/kakwa/home.tf).
But be aware it might be tighly coupled to my infrastructure, and not be easily reusable.

# Kubernetes Basics

## Choosing A Kubernetes Distribution

Like chocolate, k8s comes in various flavors. I contemplated deploying it on a traditional distribution, maybe dusting off my Gentoo skills for example.

But in the end, I ended up taking the easier path of picking a specialized distribution.

I considered the following ones:

**Talos Linux** is an immutable, API-driven operating system built specifically and exclusively for Kubernetes. It has no SSH access, no shell, and everything is configured through declarative configs and the `talosctl` CLI.

**Flatcar Container Linux** is a fork of the original CoreOS Container Linux backed by [Kinvolk](https://kinvolk.io/), now part of Microsoft. It's a minimal and immutable distribution but with SSH access.

**OpenShift & Fedora CoreOS** is Red Hat's successor to the original CoreOS.

I ended up choosing **Talos Linux**. It looked like the most common option on [/r/kubernetes](https://www.reddit.com/r/kubernetes/), and it's not linked (yet) to the usual corporate vampires.

## Kubernetes Base Architecture

Kubernetes has three main categories of components. First is the `Control Plane`, which coordinates the cluster. Second are the `Workers`, i.e. the nodes actually running stuff.
The third and last category are the Cluster `Add-Ons` adding optional (but often deployed) things like public DNS record management, load-balancing or audit tools.

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
                     Worker/Apps Runtime                      |         Control Plane
                 ┌──────────────────────────┐                 |
                 │         Internet         │                 |
                 └────────────┬─────────────┘                 |
                 ┌────────────▼─────────────┐                 |
                 │    Gateway API (Traefik) │                 | ┌────────────────────────────┐
                 │--------------------------│                 | │      Control Plane Nodes   │
                 │ - HTTP / TCP Routing     │                 | │----------------------------│
                 │ - TLS Termination        │                 | │ kube-apiserver             │
                 └────────────┬─────────────┘                 | │ - Kubernetes HTTP API      │
          ┌───────────────────┼────────────────────┐          | │ - AuthN/AuthZ/Admission    │
 ┌────────▼─────────┐┌────────▼─────────┐┌─────────▼────────┐ | │                            │
 │  Worker Node 1   ││  Worker Node 2   ││  Worker Node N   │ | │ kube-scheduler             │
 │------------------││------------------││------------------│ | │                            │
 │ kubelet          ││ kubelet          ││ kubelet          │ | │ kube-controller-manager    │
 │ containerd       ││ containerd       ││ containerd       │ | │ - Namespace controller     │
 │                  ││                  ││                  │ | │ - Replication controller   │
 │ Pods             ││ Pods             ││ Pods             │ | │                            │
 │ - App containers ││ - App containers ││ - App containers │ | │ etcd (cluster state store) │
 │ - Sidecars       ││                  ││                  │ | │                            │
 └────────┬─────────┘└────────┬─────────┘└─────────┬────────┘ | └─────────────┬──────────────┘
          └───────────────────┴────────────────────┴─ Kubernetes API (mTLS) ──┘
                                                              |
```

The cluster components talk to each other using http & gRPC and usually authenticate each other using mutual TLS certificates.

In addition, Talos adds its own [components (apid, machined, etc)](https://docs.siderolabs.com/talos/v1.6/learn-more/components) to configure the cluster and manage its idiosyncrasies (custom init, etc).

# Non-K8s Bits

This K8s deployment also required a few bits outside of the cluster itself.

First, there was the recommissioning of my old rig itself (i5 2500k/32GB DDR3) which required a bit of work, like installing some new storage with 3d printed adapters ([5.25" to 3.5"](https://www.printables.com/model/1306664-35-to-525-hdd-silencer-bracket) + [3.5" to 2.5"](https://www.printables.com/model/229753-small-hdd-adapter-35-inch-to-25-inch))
I also did some power consumption optimization (CPU down-clocking, removing/disabling unnecessary cards) to not have the thing draw ~120W continuously. It still draws ~50W however, which is... "not great, not terrible"...
(I might consider replacing it with a mini-pc or old laptop to be honest).

After that, I installed the latest Debian and applied [the following Ansible playbook](https://github.com/kakwa/home.tf/blob/main/ansible/hypervisor.yml) to make a basic hypervisor out of it.

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
resource "libvirt_volume" "worker_seed_volume" {
  for_each = local.worker_nodes
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

## Remember Remember, The IPs Of Our Cluster

Once we have our VMs, it would be nice to not have to go fishing for the IPs of our cluster nodes.

So, through a simple template like:

```tpl
export CONTROL_PLANE_IP=(${join(" ", [for ip in control_plane_ips : "${"\""}${ip}${"\""}"])})
export WORKER_IP=(${join(" ", [for ip in worker_ips : "${"\""}${ip}${"\""}"])})
export CONTROL_PLANE_VIP="${control_plane_vip}"
```

And a bit of Terraform code leveraging the [data.libvirt_domain_interface_addresses](https://search.opentofu.org/provider/dmacvicar/libvirt/latest/docs/datasources/domain_interface_addresses) Tofu datasource:

```hcl
# Recovery of the IPs
# might need some modification (FIXME hard coded indices are sketchy)
locals {
  provider_talos_cp_ips = {
    for k in keys(local.control_plane_nodes) :
    k => try(data.libvirt_domain_interface_addresses.control_plane[k].interfaces[1].addrs[0].addr, "")
  }
  talos_worker_ips = {
    for k in keys(local.worker_nodes) :
    k => try(data.libvirt_domain_interface_addresses.workers[k].interfaces[1].addrs[0].addr, "")
  }
}

# We also define a VIP for the cluster, to more easily access it in the future.
variable "control_plane_vip" {
  description = "Virtual IP for the Talos/Kubernetes control plane API"
  type        = string
  default     = "192.168.100.10"
}

# Use the template and the IPs to generate the talos-env.sh inventory file
resource "local_file" "env" {
  content = templatefile("${path.module}/env.tpl", {
    control_plane_ips      = local.provider_talos_cp_ips
    worker_ips             = local.talos_worker_ips
    control_plane_vip      = var.control_plane_vip
  })
  filename        = ".//talos-env.sh"
  file_permission = "0644"
}
```

We can let Tofu create an env file which once sourced, will provide convenient variables for the rest of this setup.

# At Last, K8S & Talos Setup

## Cluster Configuration Deployment

After a while, you should have a bunch of new VMs, booted-up into an unconfigured Talos.

If you use virt-manager, you should see a dashboard like that in the first tty of each VM:

{{< figure src="/images/talos-k8s/talos-unconfigured.png" alt="Talos dashboard on an unconfigured node: TYPE unknown, STAGE maintenance, CLUSTER n/a" caption="Fresh Talos VM in maintenance mode before apply-config" >}}

Note that on all nodes, currently, `Type` is `unknown`, `Stage` is `Maintenance`, `Cluster` and various other parameters are `n/a`.

This means that right now, we have just a bunch of individual nodes not talking to each other.

Also note that the cluster is in a vulnerable state at this point, with anybody able to take control of your freshly provisioned nodes.

We must configure all the nodes in order to have a properly functioning and secured k8s cluster.

### Generating The Cluster Config

So, the first step is to generate a configuration auto-magically using `talosctl gen config`

```bash
# Set some variables
source ./talos-env.sh
CLUSTER_NAME="kakwalab-talos-cluster"
BOOTSTRAP_CP="${CONTROL_PLANE_IP[0]}"
TEMP_ENDPOINT="https://${BOOTSTRAP_CP}:6443"

talosctl gen config "${CLUSTER_NAME}" "${TEMP_ENDPOINT}"
```

This creates a base configuration consisting of `controlplane.yaml`, `worker.yaml`, and `talosconfig`.

And for the most part, these mainly serve to create mTLS key pairs (the Certificate Authority) for authentication. And they also configure some internal network stuff for the cluster.


### Configuration bootstrapping

Apply the generated config to all nodes (control planes first, then workers), then bootstrap the cluster once:

```bash
# If not already done
source ./talos-env.sh

# Apply control planes configuration
for ip in "${CONTROL_PLANE_IP[@]}"; do
  talosctl apply-config --insecure --nodes "${ip}" --file controlplane.yaml
done

# Apply workers configuration
for ip in "${WORKER_IP[@]}"; do
  talosctl apply-config --insecure --nodes "${ip}" --file worker.yaml
done

# Wait for nodes to come back up
sleep 120

# Bootstrap (only once, on the first control plane)
talosctl bootstrap --endpoints "${BOOTSTRAP_CP}" --nodes "${BOOTSTRAP_CP}"
```

While nodes restart and synchronize after `apply-config`, the nodes could stay in booting state for a few minutes:

{{< figure src="/images/talos-k8s/talos-worker-booting.png" alt="Talos worker dashboard during boot: STAGE booting, Kubernetes components not yet healthy" caption="Worker node still coming up after configuration" >}}

After the bootstrap, check the cluster health, and fetch the `kubeconfig` file for `kubectl` once it's healthy:

```bash
talosctl health --endpoints "${BOOTSTRAP_CP}" --nodes "${BOOTSTRAP_CP}" \
  --control-plane-nodes "$(IFS=,; echo "${CONTROL_PLANE_IP[*]}")" \
  --worker-nodes "$(IFS=,; echo "${WORKER_IP[*]}")" \
  --wait-timeout 5m

talosctl kubeconfig . --endpoints "${BOOTSTRAP_CP}" --nodes "${BOOTSTRAP_CP}"
```

On a control node node TTY, a healthy dashboard looks like this:

{{< figure src="/images/talos-k8s/talos-cp-ok.png" alt="Talos dashboard: control plane talos-cp-1 running, READY true, kubelet and API server healthy" caption="Healthy control plane after bootstrap" >}}

Workers should show a similar status in the dasboard dashboard:

{{< figure src="/images/talos-k8s/talos-worker-ok.png" alt="Talos dashboard: healthy worker node with kubelet and container runtime ready" caption="Healthy worker node" >}}

From there, you should be able to run kubectl, and see your cluster:

```bash
export KUBECONFIG=$(pwd)/kubeconfig

kubectl get nodes

NAME             STATUS   ROLES           AGE   VERSION
talos-cp-1       Ready    control-plane   65m   v1.35.0
talos-cp-2       Ready    control-plane   65m   v1.35.0
talos-cp-3       Ready    control-plane   65m   v1.35.0
talos-worker-1   Ready    <none>          64m   v1.35.0
talos-worker-2   Ready    <none>          64m   v1.35.0
talos-worker-3   Ready    <none>          64m   v1.35.0
talos-worker-4   Ready    <none>          64m   v1.35.0
talos-worker-5   Ready    <none>          64m   v1.35.0
talos-worker-6   Ready    <none>          64m   v1.35.0
```

### VIP for kubectl

It's optional, but let's add a virtual IP on the control plane nodes to ease management.

First, let's patch the control plane node configuration to use this VIP:

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

After VIP election, we can then set the control plane endpoint to it

```bash
for ip in "${CONTROL_PLANE_IP[@]}"; do
  talosctl patch mc --endpoints "${ip}" --nodes "${ip}" --patch "
cluster:
  controlPlane:
    endpoint: https://${CONTROL_PLANE_VIP}:6443
"
done

```

And grab an updated kubeconfig

```
talosctl kubeconfig . --endpoints "${BOOTSTRAP_CP}" --nodes "${BOOTSTRAP_CP}"
```

# (Not So) Optional K8S plugins

## DNS Management

Usually, if you host a service on K8S, you want to give it a public DNS name.
It could be managed separatly from k8s, maybe with a bit glue scripting against the DNS providers APIs.

But it's way nicer to have K8S directly manage these records and have them directly in the helm template description.

To achieve that, the most common solution at the moment seems to be [ExternalDNS](https://kubernetes-sigs.github.io/external-dns/latest/), which integrates with tons of DNS providers (Route53, Gandi, OVH, etc).

In my case, I use the RFC2136/TSIG integration to let it manage records in a provite int.kakwalab.ovh zone.

To enable `ExternalDNS`, first, you need a base configuratin template for the deployment, with the necessary parameters (zone name, key algorithm, dns server IP and port, etc)

```yaml
provider:
  name: rfc2136

#  Replace with your DNS server
extraArgs:
  - --rfc2136-host=192.168.1.25
  - --rfc2136-port=5353
  - --rfc2136-zone=int.kakwalab.ovh
  - --rfc2136-tsig-secret-alg=hmac-sha512

env:
  - name: EXTERNAL_DNS_RFC2136_TSIG_SECRET
    valueFrom:
      secretKeyRef:
        name: external-dns-rfc2136
        key: rfc2136-tsig-secret
  - name: EXTERNAL_DNS_RFC2136_TSIG_KEYNAME
    valueFrom:
      secretKeyRef:
        name: external-dns-rfc2136
        key: rfc2136-tsig-keyname

txtOwnerId: talos-home-tf

#  Replace with your DNS zone
domainFilters:
  - int.kakwalab.ovh

sources:
  - service
  - ingress

policy: upsert-only

logLevel: info
interval: 1m

rbac:
  create: true

resources:
  requests:
    cpu: 50m
    memory: 64Mi
  limits:
    memory: 128Mi
```

From there, we can prepare a namespace and some secrets with ou TSIG key for it:

```shell
export KUBECONFIG="./kubeconfig"

export EXTERNAL_DNS_NAMESPACE="external-dns"

# TSIG credentials (replace with your own)
DNS_TSIG_KEY_SECRET="LTEzODcyLTE0NzIxCgLTEzODcyLTE0NzIxCgLTEzODcyLTE0NzIxCgQ=="
TSIG_KEYNAME="sec1_key"

# Create namespace for ExternalDNS
kubectl create namespace "$EXTERNAL_DNS_NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -

# Create the service secrets
kubectl -n "$EXTERNAL_DNS_NAMESPACE" create secret generic external-dns-rfc2136 \
  --from-literal=rfc2136-tsig-secret="$DNS_TSIG_KEY_SECRET" \
  --from-literal=rfc2136-tsig-keyname="$TSIG_KEYNAME" \
  --dry-run=client -o yaml | kubectl apply -f -
```

And finally, use `helm` to deploy this add-on:

```
# Add Helm Repository
helm repo add external-dns https://kubernetes-sigs.github.io/external-dns/ >/dev/null
helm repo update external-dns >/dev/null

# Install it, using the upstream helm template and our configuration
helm upgrade --install external-dns external-dns/external-dns \
  --namespace "$EXTERNAL_DNS_NAMESPACE" \
  -f "./external-dns-helm-values.yaml"
```

## Traefik Deployment

TODO


# Closing Thoughts

## Our First App!

TODO

## Conclusion

Not yet deployed:
CI/CD ArgoCD
Management UI TODO link
RBAC and access control TODO link
Persistent iSCSI Volumes TODO link
Log Centralization TODO links (ELK or maybe ClickHouse)
Prometheus (TODO link)

TODO
