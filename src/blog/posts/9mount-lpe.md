---
title: "Linux Privilege Escalation via 9mount"
date: 2026-07-13
description: "How two user-controlled 9mount flags combine with debugfs to escalate from an unprivileged user to root."
image: /img/plan9.png
---

![Plan 9 from User Space](/img/plan9.png)

I spent some time last month writing scripts to scan the Debian archive en masse in hopes of
finding vulnerable software. One of these scripts simply flagged packages that install SUID/SGID binaries 
and reported findings. While debugging the script after a quick run, I noticed a 
report for the `9mount` package.

I'd never heard of `9mount` before, and the name immediately brought to mind *Plan 9 from Outer Space*,
so I looked it up out of curiosity. Turns out that's not a coincidence. `9mount` mounts 9P filesystems, a
protocol that originated in Plan 9 from Bell Labs, a research operating system whose name is itself a
[reference](https://en.wikipedia.org/wiki/Plan_9_from_Bell_Labs) to the movie. This was enough to draw me in for a closer look at the package.

---

## What Is 9mount?

`9mount` is a small utility that lets unprivileged users mount [Plan 9 (9P)](https://en.wikipedia.org/wiki/9P_(protocol))
filesystems. 9P is a network filesystem protocol originally from Bell Labs' Plan 9 OS, though the
Linux kernel has supported it natively for years.

Because `mount` is a privileged syscall, `9mount` runs as SUID root. Its job is to validate the
user's arguments, construct a safe set of mount options, and call `mount` on the user's behalf.
The Makefile is clear about it:

```makefile
chown root:users $(bindir)/9mount $(bindir)/9umount $(bindir)/9bind
chmod 4755 $(bindir)/9mount $(bindir)/9umount $(bindir)/9bind
```

Which confirms the report my scan generated for the package:

```text
=== Package: /tmp/suid_scan_9mount_upxkh2yq/9mount_1.3+hg20170412-2+b1_arm64.deb ===
[SUID] -rwsr-xr-x root:root ./usr/bin/9bind
[SUID] -rwsr-xr-x root:root ./usr/bin/9mount
[SUID] -rwsr-xr-x root:root ./usr/bin/9umount
```

---

## A Closer Look

`9mount.c` is short, around 300 lines. The main function parses arguments, builds a mount option
string, and calls `mount` as root. The flag parser:

{% githubCode "sqweek/9mount", "9mount.c", "ef2a2a0d82235e8163ccec319710f63f95b57fb6", 125, 130, "c" %}

And where mount options get assembled:

{% githubCode "sqweek/9mount", "9mount.c", "ef2a2a0d82235e8163ccec319710f63f95b57fb6", 255, 263, "c" %}

`nosuid` is always added for non-root users. `nodev` is only added when `-v` is not passed, making
it fully user-controlled. `-u` sets `dotu = 1`, enabling the [9P2000.u](https://ericvh.github.io/9p-rfc/rfc9p2000.u.html) Unix extension protocol.

A device node isn't a real file. It doesn't hold any data of its own, just a pair of numbers
(major and minor) that tell the kernel which driver to hand you when you open it. For example, `/dev/sda1`
works because its numbers point to the driver for your first disk's first partition. Anyone who
can create a node with those same numbers gets the same access, whether that node lives in `/dev`
or somewhere else entirely.

That's exactly what `nodev` is meant to stop. On a filesystem mounted with `nodev`, opening a
device node fails outright ("permission denied"), no matter what numbers it carries. Without
`nodev`, the kernel doesn't care where the node lives: a homemade `./foo/sda1` with the same
major/minor as the real `/dev/sda1` opens the actual disk, not some harmless stand-in.

Allowing devices on a user-controlled mount sounds dangerous, but it's not obviously a bug yet.
It depends on who controls what's on the 9P filesystem.

---

## Finding the Vulnerability

On a normal, locally-backed filesystem, the kernel manages what device nodes can exist. An
unprivileged user can't create a block device node pointing at `/dev/sda` without `CAP_MKNOD`.

9P is a network protocol. The filesystem content comes from a server. When `9mount` calls `mount`
as root, the kernel accepts device nodes reported by the server and creates them in the VFS.

So, if I run my own malicious 9P server, I control the entire filesystem. I can serve an entry that 
says "this file is a block device with major 254, minor 1" and when `9mount -v` mounts it without `nodev`,
the kernel creates a working block device node on the mount point. Owned by root, because root
called `mount`. Permissions are whatever I put in the 9P stat response.

The `-u` flag completes the exploit chain. While standard 9P (9P2000) has no way to specify device major/minor
numbers, the 9P2000.u `extension` can. 

Neither flag alone does anything dangerous. `-v` without `-u` means you can't tell the server
what device to expose. `-u` without `-v` means device nodes on the mount are inert. Together,
they let any user with a local socket create a world-readable block device node pointing at the
root filesystem.

---

## The Exploit Chain

The full chain:

1. Read the root filesystem's block device major/minor numbers.
2. Start a malicious 9P server serving a single block device entry with the major/minor numbers with permissions `0666`
   and an extension field pointing to the root device.
3. Call `9mount -v -u tcp!127.0.0.1!9999 ./foo`, which mounts as root without `nodev`.
4. The kernel creates `./foo/sda1` as a live, world-writable block device backed by the root filesystem.
5. Use `debugfs -w` to write `/bin/bash` into `/var/tmp/pwn` on the raw device, then set its inode
   mode to `04755` (SUID root) and uid/gid to `0`.
6. Execute `/var/tmp/pwn -p` to get a root shell.

A world-readable block device node pointing at the root filesystem is access, not yet a root
shell. Getting from one to the other means writing to that raw device in a way that lands as a
working, privileged file. [debugfs](https://man7.org/linux/man-pages/man8/debugfs.8.html) is what makes that possible.

Opening the device node is the only permission check involved, and the fake node returned from the malicious server with `0666` mode
already answered it. From there, `debugfs` creates files and sets their owner by editing the
filesystem's own structures directly, skipping the checks a normal mounted filesystem would enforce.

As we saw earlier, 9mount enforces `nosuid` on the 9P mount which prevents running a SUID binary directly off it. However, 
writing to the root filesystem's block device bypasses that entirely. The resulting file lives on `/`, which doesn't set
`nosuid`, so the SUID bit is honored.

---

## Exploit PoC Walkthrough

### Step 1: Getting the Root Device Numbers

{% githubCode "masterwok/9mount-lpe", "poc.py", "e6f74e0", 12, 16, "python" %}

`os.stat('/')` returns a stat structure for the root directory. `st_dev` encodes both the major and
minor device number as a single integer. `os.major()` and `os.minor()` split it back out. These are
the numbers the fake server uses to claim to be that device.

---

### Step 2: Implementing a Minimal 9P2000.u Server

**Disclaimer**: I used Claude to generate the server implementation from the [9P2000.u](https://ericvh.github.io/9p-rfc/rfc9p2000.u.html) specification. The breakdown
below is my understanding of what each message handler does and why.

The 9P protocol is message-based. Every message has a 7-byte header: a 4-byte size, a 1-byte type,
and a 2-byte tag. The server only needs to handle the message types that `mount` will send during
negotiate, attach, and list the directory.

**Tversion / Rversion**: negotiate protocol version and message size:

{% githubCode "masterwok/9mount-lpe", "poc.py", "e6f74e0", 53, 55, "python" %}

We echo back the client's proposed message size and confirm we speak `9P2000.u`. 

**Tattach / Rattach**: attach a client to the filesystem root:

{% githubCode "masterwok/9mount-lpe", "poc.py", "e6f74e0", 56, 59, "python" %}

A `fid` is a file handle. We record that this fid refers to `/` and return a QID (a unique file
identifier) with type `0x80`, which means "directory".

**Twalk / Rwalk**: navigate the directory tree and clone fids:

{% githubCode "masterwok/9mount-lpe", "poc.py", "e6f74e0", 60, 79, "python" %}

Twalk is how the kernel both navigates paths and clones fids. A walk with zero names is a clone.
We parse each path component and track where the new fid ends up. Walking to `sda1` gets a
non-directory QID; anything else gets a directory QID.

**Tstat / Rstat**: stat a file by fid:

{% githubCode "masterwok/9mount-lpe", "poc.py", "e6f74e0", 80, 89, "python" %}

When the kernel stats `sda1`, we return:

- **QID type `0`**: non-directory file, which signals a special file
- **Mode `0x00800000 | 0o666`**: in 9P2000.u, `0x00800000` is the block device mode bit; `0o666`
  sets world-read/write permissions
- **Extension `"b {major} {minor}"`**: the Unix extension string specifying which block device this
  entry represents

The kernel reads this and creates the device node.

**Topen / Ropen**: open a fid for I/O:

{% githubCode "masterwok/9mount-lpe", "poc.py", "e6f74e0", 90, 97, "python" %}

Before reading from a fid the kernel opens it. We return the file's QID and an I/O unit size of
8192 bytes. No additional state is tracked since we don't distinguish between open and not-open.

**Tread / Rread on `/`**: directory listing, which causes the kernel to enumerate our fake directory:

{% githubCode "masterwok/9mount-lpe", "poc.py", "e6f74e0", 98, 106, "python" %}

On the first read of `/` (offset 0), we return one directory entry: `sda1`. Any subsequent read
returns zero bytes, signaling end-of-directory. That's enough for the kernel to create `./foo/sda1`
in the VFS.

---

### Step 3: Mounting and Exploiting

{% githubCode "masterwok/9mount-lpe", "poc.py", "e6f74e0", 154, 154, "python" %}

`9mount` connects to our server, negotiates 9P2000.u, attaches, reads the directory, and calls
`mount` as root without `nodev`. The kernel processes our stat responses and creates
`./foo/sda1` as a real block device with `brw-rw-rw- root root 254, 1`.

{% githubCode "masterwok/9mount-lpe", "poc.py", "e6f74e0", 160, 163, "python" %}

`debugfs -w -R "write /bin/bash /var/tmp/pwn"` copies the bash binary directly into the ext4 block
device at the inode path `/var/tmp/pwn`, bypassing all filesystem-level permission checks. The `sif`
(set inode field) commands modify the inode directly: mode `0o104755` is `S_ISUID | 0755`,
uid/gid `0` is root.

We're writing at the block device level. The `nosuid` restriction on the 9P mount is irrelevant
because the file ends up on the root filesystem, not on the mount.

{% githubCode "masterwok/9mount-lpe", "poc.py", "e6f74e0", 173, 173, "python" %}

`bash -p` preserves the effective UID instead of dropping it back to the real UID. Root shell.

![Exploit demonstration](/img/exploit.gif)

---

## Root Cause

The issue is two user-controlled flags that are individually reasonable but dangerous in combination:

- `-v` removes the `nodev` mount restriction, allowing device nodes on the 9P filesystem to be
  treated as real devices by the kernel.
- `-u` enables 9P2000.u Unix extensions, giving the server a protocol-level way to declare
  device major/minor numbers.

The 9P server is fully user-controlled. Passing both flags lets any user create arbitrary device
nodes in the VFS, backed by any device on the system, via a root-level mount call.

`nosuid` is correctly enforced unconditionally. `nodev` needed the same treatment.

---

## Timeline

- 6/01/26 - Debian ships an independent partial fix, [`1.3+hg20170412-3`](https://salsa.debian.org/debian/9mount/-/blob/debian%2F1.3%2Bhg20170412-3/debian/patches/security-fix-when-passing-nodev-and-nosu.patch), credited to Georgii Shutiaev, wiring `nodev`/`nosuid` into `mount()`'s flags for the default, no-flags case. Does not affect the `-v -u` chain in this post.
- 6/05/26 - Reported this exploit chain (`-v`/`-u` combined with `debugfs`) to the `9mount` upstream maintainer
- 6/12/26 - Maintainer pushes fix [`220d490751cd068790ade5723969b8b3af2a2871`](https://github.com/sqweek/9mount/commit/220d490751cd068790ade5723969b8b3af2a2871), gating `nodev`/`nosuid` to root regardless of flags passed
- 6/13/26 - Maintainer pushes [`1.5`](https://github.com/sqweek/9mount/tree/1.5) release
- 6/29/26 - Maintainer approves publishing findings
