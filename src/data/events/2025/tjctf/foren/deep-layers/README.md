---
title: deep-layers
category: Forensics
tags: 
completedDuringEvent: true
submitted: true
points : 112
flag: tjctf{p0lygl0t_r3bb1t_h0l3}
draft: false
---
So we got a .png file, and the word `layers` is means we need to use `zsteg` again,

![](deplayer.png)

as you can see, there is zip file and also some `base64` pattern, so lets just decode the `base64` first,

![](deplayerbes.png)

then i dumped the zip file inside the image using `foremost` and extract it

![](deplayerextract.png)

we got a file called `secret.gz`, decompress it with command `gzip -d`, and u will get the flag
