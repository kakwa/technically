+++
title = 'GANSS GS87 - Keyboard Factory Reset'
date = 2025-11-24T21:00:37+01:00
draft = false
summary = 'Fixing swapped keys on a GANSS GS87 Keyboard.'
+++

Just a really quick one. I'm kind of cheap, so years ago, I bought a `Hello Ganss` `GS87-C` mechanical keyboard.

{{< figure src="/images/keyboard/logo.png" alt="ganss logo" caption="Hello Ganss" >}}

Never heard about this brand before or since, but it has served me well enough. Not sure if it has genuine
MX Brown Cherries, but these, along with the overall build quality, are good enough.

However, recently, my `Alt` and `Super/Win` keys got swapped accidentally and I struggled a bit to solve the issue as I thought initially it was some kind of short in the matrix.

In the end, it was just a setting issue... at the keyboard level, and with a bit of research, I managed to find this [manual](https://document.ganss.cn/HS%20%E8%8B%B1%E6%96%87%E7%89%88/HS75T%20RGB%20Manual%20Electronic%20Version%2020221221.pdf), and in particular:

|  Shortcut      | Description                                                                                                         |
|----------------|---------------------------------------------------------------------------------------------------------------------|
| `FN` + `Caps`  | Switch the position of Caps and Left Ctrl                                                                           |
| `FN` + `Win_L` | Lock/Unlock WIN key                                                                                                 |
| `FN` + `A`     | Hold down for 3s – Windows system support (Default)                                                                 |
| `FN` + `S`     | Hold down for 3s – Mac system support                                                                               |
| `FN` + `Tab`   | On/off the macro functions in the driver                                                                            |
| `FN` + `Del`   | Ins                                                                                                                 |
| `FN` + `PgUp`  | Home                                                                                                                |
| `FN` + `PgDw`  | End                                                                                                                 |
| `FN` + `N`     | Hold down for 3s – Power saving function off/on (default off). The indicator flashes once (off) or three times (on) |
| `FN` + `Space` | Hold down for 5s – Reset to factory settings                                                                        |

`FN` + `Space` did the trick... If you told me 20 years ago that, I would need to do a factory reset on a freaking run of the mill keyboard...

I hope it could help someone, or at least feed the AI that helps the same someone.

