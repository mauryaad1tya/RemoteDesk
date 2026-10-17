# Remote Access & Private Mesh Networking Guide

RemoteDesk enables accessing your Windows laptop from a smartphone or other device across any internet connection—including cellular mobile data, public Wi-Fi, or hotel networks.

---

## Why Private Mesh Networking (Tailscale)?

Directly exposing Windows Remote Desktop (port 3389) or management APIs to the public internet using router port forwarding creates serious security vulnerabilities:
- Shodan and automated bots scan public IP addresses for open RDP ports 24/7.
- Brute-force attacks against Windows credentials.
- Exposure to unpatched network protocol vulnerabilities.

**Tailscale** solves this completely:
- Creates a private, encrypted peer-to-peer WireGuard mesh between your authorized devices.
- Devices communicate directly via stable `100.x.y.z` private IP addresses.
- Works automatically through NAT, firewalls, and mobile carrier networks.
- Requires **zero router port forwarding** and **zero exposed public ports**.

---

## Step-by-Step Configuration

### Step 1: Install Tailscale on your Windows Laptop
1. Download and install Tailscale for Windows from [tailscale.com/download](https://tailscale.com/download).
2. Sign in with your account.
3. Open PowerShell and run:
   ```powershell
   tailscale ip -4
   ```
   Note down your laptop's 100.x.y.z IP address (e.g., `100.85.120.45`).

### Step 2: Install Tailscale on your Smartphone
1. Install Tailscale from the iOS App Store or Google Play Store.
2. Sign in with the exact same account as your laptop.
3. Toggle the VPN switch to **Connected**.

### Step 3: Access the RemoteDesk Web Dashboard
1. On your phone's web browser (Safari, Chrome, Firefox), open:
   ```
   http://100.85.120.45:5173
   ```
   (Replace with your laptop's actual Tailscale IP).
2. Sign in with your owner credentials (`admin@remotedesk.local`).
3. You now have full management control of your laptop!

---

## Interactive Remote Desktop Setup

### Option 1: Native Windows Remote Desktop (Windows Pro / Enterprise)
1. On your laptop: Open `Settings > System > Remote Desktop` and turn **Enable Remote Desktop** on.
2. On your smartphone: Install **Microsoft Remote Desktop** from the App Store / Google Play.
3. Add PC: Enter your laptop's Tailscale IP (`100.x.y.z`).
4. Enter your Windows account username and password when prompted.

### Option 2: Windows Home Edition Setup
Windows Home edition does not include the native RDP host server. If your laptop runs Windows Home:
- Use **RustDesk** or **MeshCentral** over your private Tailscale network.
- RustDesk can be downloaded as an open-source portable client from [rustdesk.com](https://rustdesk.com) and paired with your phone.
