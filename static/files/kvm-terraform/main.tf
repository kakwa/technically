# ============================================================
# Providers
# ============================================================

terraform {
  required_providers {
    libvirt = {
      source  = "dmacvicar/libvirt"
      version = "~> 0.9.7"
    }
  }
}

provider "libvirt" {
  # Local hypervisor. For remote use qemu+ssh://user@host/system,
  # but note that disk image paths are resolved on the remote machine.
  uri = "qemu:///system"
}

# ============================================================
# Locals
# ============================================================

locals {
  network_name      = "homelab-nat"
  network_cidr      = "192.168.150.0/24"
  bridge_name       = "br0"
  dns_zone          = "example.com."
  debian_admin_user = "admin"
  debian_image_url  = "https://cloud.debian.org/images/cloud/trixie/latest/debian-13-generic-amd64.qcow2"
}

provider "dns" {
  update {
    server        = "192.168.1.25" # host that accepts RFC 2136 updates (BIND master, router, …)
    port          = 53
    key_name      = "terraform-homelab."
    key_algorithm = "hmac-sha256"
    key_secret    = "dGVzdC1leGFtcGxlLXRzaWctc2VjcmV0" # base64 TSIG secret from your nameserver config
  }
}

# ============================================================
# Networks
# ============================================================

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

# ============================================================
# Storage Pool
# ============================================================

resource "libvirt_pool" "MY_DISK_POOL" {
  name = "MY_DISK_POOL"
  type = "dir"
  target = {
    path = "/var/lib/libvirt/images/MY_DISK_POOL"
  }
}

# ============================================================
# Base VM Image
# ============================================================

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

# ============================================================
# Cloud-Init
# ============================================================

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
          - 10.100.100.100/24
        nameservers:
          addresses:
            - 8.8.8.8
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

# ============================================================
# VM Disk + Domain
# ============================================================

resource "libvirt_volume" "YOUR_VM_disk" {
  name     = "YOUR_VM-disk.qcow2"
  pool     = libvirt_pool.MY_DISK_POOL.name
  capacity = 53687091200 # 50GB
  backing_store = {
    path   = libvirt_volume.debian_base.path
    format = { type = "qcow2" }
  }
  target = {
    format = { type = "qcow2" }
  }
}

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
    firmware     = "efi"
  }

  cpu = {
    mode = "host-passthrough"
  }

  features = {
    acpi = true
    apic = {}
  }

  devices = {
    pci = [
      { type = "pci", model = "pcie-root" }
    ]
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
            volume = libvirt_volume.YOUR_VM_seed_volume.name
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
    channels = [
      {
        target = { virt_io = { name = "org.qemu.guest_agent.0" } }
        source = { unix = { mode = "bind" } }
      }
    ]

    consoles = [
      {
        type   = "pty"
        target = { type = "serial", port = "0" }
      }
    ]
    videos = [
      { model = { type = "virtio", heads = 1, primary = "yes" } }
    ]
    graphics = [
      {
        spice = {
          autoport = "no"
          port     = 5930
          listen   = var.vm_spice_listen
          listeners = [
            {
              type = "address"
              address = {
                address = var.vm_spice_listen
              }
            }
          ]
        }
      }
    ]
  }
}

# ============================================================
# IP address retrieval (requires qemu-guest-agent in the VM)
# ============================================================

data "libvirt_domain_interface_addresses" "YOUR_VM" {
  domain = libvirt_domain.YOUR_VM.name
  source = "agent"
}

locals {
  your_vm_ip = data.libvirt_domain_interface_addresses.YOUR_VM.interfaces[2].addrs[0].addr
  my_hosts = {
    "your-vm" = local.your_vm_ip
  }
}

variable "vm_spice_listen" {
  description = "SPICE listen address (127.0.0.1 = localhost only; use SSH port-forward to connect remotely)"
  type        = string
  default     = "127.0.0.1"
}

# ============================================================
# DNS Records
# ============================================================

#resource "dns_a_record_set" "lan" {
#  for_each  = local.my_hosts
#  zone      = local.dns_zone
#  name      = each.key
#  addresses = [each.value]
#  ttl       = 300
#}
#
#resource "dns_cname_record" "alias" {
#  zone  = local.dns_zone
#  name  = "registry"
#  cname = "utility.${local.dns_zone}"
#  ttl   = 300
#}

# ============================================================
# Ansible Inventory
# ============================================================

resource "local_file" "inventory" {
  content = <<-EOF
    [debian_vms]
    your-vm ansible_host=${local.your_vm_ip} ansible_user=${local.debian_admin_user}
  EOF
  filename        = "../ansible/inventory/inventory.ini"
  file_permission = "0644"
}
