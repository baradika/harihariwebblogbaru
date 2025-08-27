---
title: hidden-canvas
category: Web Exploitation
tags: 
completedDuringEvent: true
submitted: true
points : 357
flag: tjctf{H1dd3n_C@nv@s_D3c0d3d_4nd_R3nd3r3d!}
draft: false
---
So we got a web serivce that can upload a image

![](tampilanweb.png)

Initially, I thought that we need to upload `webshell` with all its bypass techniques, but there is this one error that indicates that this is a vulnerability in file upload, but does not use `webshell`..

![](eror.png)

`Incorrect MIME type`, this indicates that the server is validating the image inputed by the user, so even though I have done all kinds of bypasses here from naming the webshell `webshell.jpg.php` to changing the magic byte, it still doesn't get through because the server validates all the content in the image entered by the user.

So here I try to just upload random image with the addition of variables in the metadata

![](exiftool1.png)

![](res1.png)

`[Caption Error: Invalid Base64 data ('utf-8' codec can't decode byte 0x93 in position 2: invalid start byte)]` This shows that the server, in addition to extracting extra metadata on the image, also decodes it as base64, so the way to do this is by first encoding the payload in the metadata with base64

![](res2.png)

then now, i tried to test it with `SSTI` payload `{{7*7}}`

![](res3.png)

then use SSTI RCE payload `{{ cycler.__init__.__globals__.os.popen('ls').read() }}`

![](res4.png)

then cat the `flag.txt`

![](flag.png)