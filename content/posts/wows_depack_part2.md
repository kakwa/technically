+++
title = 'Reversing WoWs Resource Format - Part 2/5: Looking For The Metadata'
date = 2025-08-25T00:02:00+02:00
draft = false
summary = 'Reversing WoWs Resource Format - Part 2: searching and general analysis of the metadata'
+++

- Part 1 — [Searching The Data](/posts/wows_depack_part1/)
- Part 2 — [Looking For The Metadata](/posts/wows_depack_part2/)
- Part 3 — [Dissecting The Index](/posts/wows_depack_part3/)
- Part 4 — [Reading Everything](/posts/wows_depack_part4/)
- Part 5 — [Tidying-Up The Project](/posts/wows_depack_part5/)

# Searching & Reading The Metadata

In Part 1, we discovered:

- Data lives in `res_packages/` as custom `.pkg` archives.
- Each `.pkg` is a sequence of DEFLATE-compressed blobs separated by 64-bit IDs with zero padding.
- No file names inside `.pkg`; names/paths must exist elsewhere (in indexes).

Now we need to find where and how the file and directory structure is stored.

## Back To File Exploration

The metadata hopefully isn't embedded in executables. Let's search:

```shell
# List all files
# then remove uninteresting bits like replays, crashes, DLLs, logs, .pkg
# or CEF stuff (embedded Chrome used for the armory, inventory, dockyard and clan base))

kakwa@linux Games/World of Warships » find ./ -type f | grep -v cef | grep -v replays \
    | grep -v crashes | grep -v '.pkg' | grep -v '.dll' | grep -v '.log' \
    | grep -v '\.exe' | less
```

```
[...]
./bin/6775398/res/texts/pl/LC_MESSAGES/global.mo
./bin/6775398/res/texts/zh_tw/LC_MESSAGES/global.mo
./bin/6775398/res/texts/fr/LC_MESSAGES/global.mo
./bin/6775398/res/texts/zh_sg/LC_MESSAGES/global.mo
./bin/6775398/res/camerasConsumer.xml
./bin/6775398/bin32/paths.xml
./bin/6775398/bin32/Licenses.txt
./bin/6775398/bin32/monitor_config.json
./bin/6775398/bin64/paths.xml
./bin/6775398/bin64/Licenses.txt
./bin/6775398/bin64/monitor_config.json
[...]
./bin/6775398/idx/spaces_dock_dry.idx
./bin/6775398/idx/spaces_dock_hsf.idx
./bin/6775398/idx/spaces_sea_hope.idx
./bin/6775398/idx/vehicles_pve.idx
./bin/6775398/idx/vehicles_level8_fr.idx
./bin/6775398/idx/vehicles_level5_panasia.idx
[...]
```

The `.idx` files look promising, especially their names match the `.pkg` files:
- `spaces_dock_hsf.idx` → `spaces_dock_hsf_0001.pkg`
- `vehicles_level9_ned.idx` → `vehicles_level9_ned_0001.pkg`

## Checking We Have The Metadata

Let's take a look:

```shell
kakwa@linux bin/6775398/idx » strings -n 5 system_data.idx
```

```
#%B'E
E)zj'
FM'lb
%}n:b
(	?A+
c|'lY
zc78'
tKDStorage.bin
waves_heights1.dds
animatedMiscs.xml
LowerDeck.dds
[...]
maps
highlight_noise.dds
space_variation_dummy.dds
waves_heights0.dds
4F$)p
:M+Xp
F?mep
wsystem_data_0001.pkg
[...]
```

Bingo, we have all the file names, and at the end, the name of the corresponding `.pkg` file.

These `.idx` files, as the extension indicates, are our indexes containing all the file names and metadata.

Also, note that we have a few names (like `maps` or `helpers`) without extensions, these are probably directory names.

**Note**: `bin/` directory and game versions

The `./bin` directory contains build-numbered subdirectories (5241351, 6081105, etc.), with WoWs keeping the current and previous builds. We'll use the highest number for the latest indexes.

## General Layout Of the Index File

Let's examine an index file:

```shell
kakwa@linux 6775398/idx » hexdump -C system_data.idx | less
```

```
00000000  49 53 46 50 00 00 00 02  91 9d 39 b4 40 00 00 00  |ISFP......9.@...|
00000010  37 01 00 00 1c 01 00 00  01 00 00 00 00 00 00 00  |7...............|
00000020  28 00 00 00 00 00 00 00  f6 3b 00 00 00 00 00 00  |(........;......|
00000030  36 71 00 00 00 00 00 00  0e 00 00 00 00 00 00 00  |6q..............|
00000040  e0 26 00 00 00 00 00 00  8f 0c 9a ba 4f 40 b6 93  |.&..........O@..|
00000050  27 b9 08 b1 d1 a1 b1 db  13 00 00 00 00 00 00 00  |'...............|
00000060  ce 26 00 00 00 00 00 00  8f ec 87 4a 28 d0 f7 c7  |.&.........J(...|
00000070  a4 eb 1b 3e 50 21 d8 74  12 00 00 00 00 00 00 00  |...>P!.t........|
00000080  c1 26 00 00 00 00 00 00  ad 70 a2 e7 ac 2c 4f 6b  |.&.......p...,Ok|
00000090  27 b9 08 b1 d1 a1 b1 db  0e 00 00 00 00 00 00 00  |'...............|
000000a0  b3 26 00 00 00 00 00 00  4e 84 a5 6a 94 dc 1f 7f  |.&......N..j....|
000000b0  62 f5 aa 4b 5e 15 7f 93  10 00 00 00 00 00 00 00  |b..K^...........|
000000c0  a1 26 00 00 00 00 00 00  4e b0 fe 23 62 40 a5 65  |.&......N..#b@.e|
000000d0  27 b9 08 b1 d1 a1 b1 db  20 00 00 00 00 00 00 00  |'....... .......|
000000e0  91 26 00 00 00 00 00 00  8e c7 6a 58 7c 86 62 33  |.&........jX|.b3|
000000f0  27 b9 08 b1 d1 a1 b1 db  0f 00 00 00 00 00 00 00  |'...............|
00000100  91 26 00 00 00 00 00 00  8e 43 3d e9 cf 49 52 a4  |.&.......C=..IR.|
00000110  62 f5 aa 4b 5e 15 7f 93  16 00 00 00 00 00 00 00  |b..K^...........|
00000120  80 26 00 00 00 00 00 00  0e 3c 9a 6d 22 de 7b da  |.&.......<.m".{.|
00000130  4e b0 fe 23 62 40 a5 65  0b 00 00 00 00 00 00 00  |N..#b@.e........|
00000140  76 26 00 00 00 00 00 00  0e 48 58 ea 50 44 1a 47  |v&.......HX.PD.G|
00000150  df 61 50 67 c7 3a dd 7a  13 00 00 00 00 00 00 00  |.aPg.:.z........|
00000160  61 26 00 00 00 00 00 00  e0 9f c3 bd d2 12 20 04  |a&............ .|
00000170  09 28 f1 df 2d 04 93 de  0b 00 00 00 00 00 00 00  |.(..-...........|
00000180  54 26 00 00 00 00 00 00  e0 95 53 f6 cc 08 c0 46  |T&........S....F|
00000190  06 cf 85 bd 69 99 e2 46  0d 00 00 00 00 00 00 00  |....i..F........|
000001a0  3f 26 00 00 00 00 00 00  e0 99 68 5e 2d 70 13 72  |?&........h^-p.r|
000001b0  4c d1 2e 30 73 38 d9 13  10 00 00 00 00 00 00 00  |L..0s8..........|
[...]
000026c0  0d 15 00 00 00 00 00 00  ce 6a 28 bc cf e7 79 c8  |.........j(...y.|
000026d0  a4 eb 1b 3e 50 21 d8 74  1a 00 00 00 00 00 00 00  |...>P!.t........|
000026e0  01 15 00 00 00 00 00 00  6c c0 c9 f7 7e 00 03 05  |........l...~...|
000026f0  a4 eb 1b 3e 50 21 d8 74  13 00 00 00 00 00 00 00  |...>P!.t........|
00002700  fb 14 00 00 00 00 00 00  74 d1 1b 8d f4 ff 7a ce  |........t.....z.|
00002710  a4 eb 1b 3e 50 21 d8 74  4b 44 53 74 6f 72 61 67  |...>P!.tKDStorag|
00002720  65 2e 62 69 6e 00 77 61  76 65 73 5f 68 65 69 67  |e.bin.waves_heig|
00002730  68 74 73 31 2e 64 64 73  00 61 6e 69 6d 61 74 65  |hts1.dds.animate|
00002740  64 4d 69 73 63 73 2e 78  6d 6c 00 4c 6f 77 65 72  |dMiscs.xml.Lower|
00002750  44 65 63 6b 2e 64 64 73  00 63 6f 6d 6d 61 6e 64  |Deck.dds.command|
[...]
00003bc0  2e 64 64 73 00 68 69 67  68 6c 69 67 68 74 5f 6e  |.dds.highlight_n|
00003bd0  6f 69 73 65 2e 64 64 73  00 73 70 61 63 65 5f 76  |oise.dds.space_v|
00003be0  61 72 69 61 74 69 6f 6e  5f 64 75 6d 6d 79 2e 64  |ariation_dummy.d|
00003bf0  64 73 00 77 61 76 65 73  5f 68 65 69 67 68 74 73  |ds.waves_heights|
00003c00  30 2e 64 64 73 00 8f 0c  9a ba 4f 40 b6 93 70 11  |0.dds.....O@..p.|
00003c10  03 07 0d 33 ed 77 00 00  00 00 00 00 00 00 05 00  |...3.w..........|
00003c20  00 00 01 00 00 00 f5 21  00 00 bf 00 45 5c 6c 36  |.......!....E\l6|
00003c30  00 00 00 00 00 00 8f ec  87 4a 28 d0 f7 c7 70 11  |.........J(...p.|
00003c40  03 07 0d 33 ed 77 1e 9b  ef 05 00 00 00 00 05 00  |...3.w..........|
00003c50  00 00 01 00 00 00 15 15  01 00 03 77 63 97 3e ab  |...........wc.>.|
00003c60  02 00 00 00 00 00 ad 70  a2 e7 ac 2c 4f 6b 70 11  |.......p...,Okp.|
00003c70  03 07 0d 33 ed 77 05 22  00 00 00 00 00 00 05 00  |...3.w."........|
00003c80  00 00 01 00 00 00 cb 01  00 00 6d b9 de c1 ad 0c  |..........m.....|
[...]
000070a0  00 00 01 00 00 00 90 24  00 00 62 c1 d9 06 f8 d8  |.......$..b.....|
000070b0  00 00 00 00 00 00 57 b3  82 06 56 f0 2a e6 70 11  |......W...V.*.p.|
000070c0  03 07 0d 33 ed 77 ea cc  15 0a 00 00 00 00 05 00  |...3.w..........|
000070d0  00 00 01 00 00 00 7c 01  00 00 84 a8 12 1d 61 04  |......|.......a.|
000070e0  00 00 00 00 00 00 57 64  91 29 c9 3c f0 96 70 11  |......Wd.).<..p.|
000070f0  03 07 0d 33 ed 77 a9 ef  15 0a 00 00 00 00 05 00  |...3.w..........|
00007100  00 00 01 00 00 00 6f 09  00 00 fc 56 94 f8 9a 37  |......o....V...7|
00007110  00 00 00 00 00 00 21 67  ac 70 22 ec ca b8 70 11  |......!g.p"...p.|
00007120  03 07 0d 33 ed 77 28 f9  15 0a 00 00 00 00 05 00  |...3.w(.........|
00007130  00 00 01 00 00 00 0b 2d  00 00 03 bd b0 50 67 e9  |.......-.....Pg.|
00007140  00 00 00 00 00 00 15 00  00 00 00 00 00 00 18 00  |................|
00007150  00 00 00 00 00 00 70 11  03 07 0d 33 ed 77 73 79  |......p....3.wsy|
00007160  73 74 65 6d 5f 64 61 74  61 5f 30 30 30 31 2e 70  |stem_data_0001.p|
00007170  6b 67 00                                          |kg.|
```

The general layout of the file appears to be at least in 3 chunks:

* A first chunk of metadata
* All the file name strings `\0`-separated, but also a few strings without extensions, probably directory names
* A second chunk of metadata

Let's look for the IDs we found in the corresponding `.pkg` (here `system_data_0001.pkg`), for example `00 00 00 00 | bf 00 45 5c | 6c 36 00 00 | 00 00 00 00`.

```
[......................] 00 8f 0c  9a ba 4f 40 b6 93 70 11  |0.dds.....O@..p.|
00003c10  03 07 0d 33 ed 77 00 00  00 00 00 00 00 00 05 00  |...3.w..........|
00003c20  00 00 01 00 00 00 f5 21  00 00 bf 00 45 5c 6c 36  |.......!....E\l6|
00003c30  00 00 00 00 00 00 8f ec [...]
```

Ok, it's there, in the second chunk. And it also works if we test for other IDs. We have at least a link by ID between the `.idx` and the `.pkg` file.

We will come back later to the second chunk, remembering that, but let's focus on the first chunk for now.

# Recap (Part 2)

- Identified `.idx` files in `./bin/<latest>/idx/` as indexes for `.pkg` archives and matched them by name.
- Determine that that the index is constituted of 5 parts:
  - Header
  - Metadata section
  - Names
  - Records section
  - Footer

In [the next part](/posts/wows_depack_part3/) of this series we will reverse the index file format in details.
