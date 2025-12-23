---
title: Bisik-Bisik Tetangga
category: Web Exploitation
tags: 
completedDuringEvent: true
submitted: true
flag: ASTROXNFSCC{SSTI_M4st3r_Pyth0n_H3x_Byp4ss}
points: 250
draft: false
---

![](deskripsi.png)

# Walkthrough
Diberikan suatu link website, yang memiliki form input, jadi gw langsung mencoba nya dengan SSTI payload `{{7*7}}`

Lalu gw mengambil referensi payload SSTI dari web ini (https://onsecurity.io/article/server-side-template-injection-with-jinja2/)

Dan gw berhasil untuk listing file current directory, tapi gw ga nemu flag.txt 


![](t1.png)



Lalu gw coba untuk melihat source dari `app.py`, tetapi


![](t2.png)

Terus gw coba untuk tetap cat `app.py` tetapi outputnya itu `base64`, kayak gini


![](t3.png)

sung decode

![](flag.png)
