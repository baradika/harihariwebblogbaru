---
title: Catatan harian biasa kok
category: Web Exploitation
tags:
completedDuringEvent: true
submitted: true
points: 100
flag: cyberwave{keknya_salah_flagnya_CTF_11224#0}
draft: false
---

![](desc.png)

# Walktrough

DIberikan sebuah link website, begini tampilannya saat dibuka

![](tampilan.png)

di fitur search, kita dapat melihat bahwa web ini menggunakan parameter `q`

![](query.png)

dan meload salah satu file yang tersedia, dan muncul parameter `f`

![](pram.png)

langsung masukin payload LFI dasar `../../../etc/passwd`

![](etcpasswd.png)

tinggal ganti `/etc/passwd` dengan `/flag.txt`

![](flagenc.png)

decode base64 nya

![](flag.png)
