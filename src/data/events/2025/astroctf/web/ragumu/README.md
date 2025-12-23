---
title: Ragumu Rugimu
category: Web Exploitation
tags: 
completedDuringEvent: true
submitted: true
flag: ASTROXNFSCC{J4n9aN_M4in_7ud0L}
points: 250
draft: false
---

![](deskripsi.png)

# Walkthrough

DIberikan link suatu website dan source nya, langsung gw review source nya


![](sc1.png)

## Analisa
Disini server sudah menginisalisasi flag nya di dalam variabel flag, jadi disini cukup memangil dengan `{{flag}}`

## Solve
Jadi disini gw solve menggunkana curl, pertama gw init session 

![](initsess.png)


Lalu ekskusi SSTI dengan memanggil variabel flag


![](flag.png)