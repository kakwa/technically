+++
title = 'Reversing WoWs Resource Format - Part 1: Searching The Data'
date = 2025-08-24T01:00:00+02:00
draft = false
summary = 'Reversing WoWs Resource Format - Part 1: analyzing the game files'
+++

- Part 1 — [Searching The Data](/posts/wows_depack_part1/)
- Part 2 — [Looking For The Metadata](/posts/wows_depack_part2/)
- Part 3 — [Dissecting The Index](/posts/wows_depack_part3/)
- Part 4 — [Reading Everything](/posts/wows_depack_part4/)
- Part 5 — [Tidying-Up The Project](/posts/wows_depack_part5/)

# Introduction

Firstly, a disclaimer: this is the first time I'm doing this kind of exercise, so the process described here is far from ideal, and the tools used are probably less than adequate.

Also, I'm writing this after various findings, so the process seems quite straightforward. In reality, it was full of dead ends and flows of ideas (good and bad) that came up while staring at hexdumps for hours.

## Motivation

I've always wanted to play around with World of Warships game content for various reasons, from extracting things like armor layouts or in-game parameters to the 3D models themselves.

There is already a closed-source Windows tool doing that: [wows-unpack](https://forum.worldofwarships.eu/topic/113847-all-wows-unpack-tool-unpack-game-client-resources/)

But being a pro-OSS Linux user, this tool doesn't suit me well as it is annoying to use (`Wine`) and cannot be readily integrated into other programs.

I also wanted to do it as an intellectual & learning exercise of reverse engineering.

## Goals

* Reverse engineer the format sufficiently for data extraction
* Document the specification for others to build upon
* Create an OSS CLI tool
* Develop a reusable OSS library

# Reverse Engineering Process

## Initial Analysis

### Game File Structure

Unfortunately, I only have very fuzzy memories of the initial steps I took since they came from an initial effort 2 years before the bulk of the reversing.

The gist of it was to look at the game files and see where most of the data was:

```shell
kakwa@linux Games/World of Warships » ls
```

```
[...] api-ms-win-crt-runtime-l1-1-0.dll  concrt140.dll             msvcp140_codecvt_ids.dll  Reports               vcruntime140_1.dll
[...] api-ms-win-crt-stdio-l1-1-0.dll    crashes                   msvcp140.dll              res_packages          vcruntime140.dll
[...] api-ms-win-crt-time-l1-1-0.dll     GameCheck                 placeholder.txt           screenshot            WorldOfWarships.exe
[...] bin                                msvcp140_atomic_wait.dll  replays                   user_preferences.xml
```

```shell
kakwa@linux Games/World of Warships » du -hd 1 | sort -h
```

```
4.0K  ./Reports
12K   ./patche
2.8M  ./Wallpapers
4.2M  ./GameCheck
4.4M  ./screenshot
49M   ./replays
55M   ./lib
464M  ./profile
593M  ./crashes
1.2G  ./bin
62G   ./res_packages
73G  .
```

So here, most of the data is in the `res_packages/` directory. Let's take a closer look:

```shell
kakwa@linux Games/World of Warships » ls res_packages
```

```
[...]
spaces_dock_1_april_0001.pkg          spaces_faroe_0001.pkg                spaces_ridge_0001.pkg
vehicles_level10_panamerica_0001.pkg  vehicles_level3_panasia_0001.pkg     vehicles_level6_jap_0001.pkg
vehicles_level8_it_0001.pkg           z_vehicles_events_0001.pkg
[...]
```

Let's use `file` to see what type of files we are dealing with:

```shell
kakwa@linux Games/World of Warships » cd res_packages
kakwa@linux World of Warships/res_packages » file *
```

```
[...]
spaces_dock_ny_0001.pkg:              data
spaces_dock_ocean_0001.pkg:           data
spaces_dock_prem_0001.pkg:            Microsoft DirectDraw Surface (DDS): 4 x 4, compressed using DX10
spaces_dock_rio_0001.pkg:             data
spaces_dock_spb_0001.pkg:             data
spaces_exterior_0001.pkg:             data
spaces_faroe_0001.pkg:                OpenPGP Secret Key
spaces_labyrinth_0001.pkg:            data
spaces_lepve_0001.pkg:                data
spaces_military_navigation_0001.pkg:  data
spaces_naval_base_0001.pkg:           DOS executable (COM), maybe with interrupt 22h, start instruction 0x8cbc075c 534dd337
spaces_naval_defense_0001.pkg:        data
[...]
```

So mostly `data` (i.e., unknown binary format), and looking at the files which are not `data`, they are in fact most likely false positives. So we are dealing with a custom format.

### File Analysis

Next, let's try to see if we have some clear-text strings in the files using the `strings` utility:

```shell
kakwa@linux World of Warships/res_packages » strings *
```

```
YyHIKzR
+!?<
m:C-
h4.1
~s3o
]2bm
]$ }
O=z$
<27P
=C=k]
dQz{4
$Zm|
$ZOc
nV&
<4n5
r>Zs%
6?Iw
KqM&u
[...]
```

Nada, that's just garbage. So we are dealing with a completely binary format.

Next, let's try to compress a file:

```shell
# Size before
kakwa@linux World of Warships/res_packages » ls -l vehicles_level4_usa_0001.pkg
-rwxr-xr-x 1 kakwa kakwa 15356139 Jan 17 19:01 vehicles_level4_usa_0001.pkg

# Compress
kakwa@linux World of Warships/res_packages » gzip vehicles_level4_usa_0001.pkg

# Size After
ls -l vehicles_level4_usa_0001.pkg.gz

-rwxr-xr-x 1 kakwa kakwa 15332196 Jan 17 19:01 vehicles_level4_usa_0001.pkg.gz
```

Ok, barely any change in size, which means the data is probably compressed (not a big surprise since a lot of formats such as images are compressed).

Then, the process is a little fuzzy in my memory. But if I recall correctly, I did the following:

```shell
kakwa@linux World of Warships/res_packages » hexdump -C vehicles_level4_usa_0001.pkg | less
```

```
00000000  95 58 7f 50 9b e7 7d 7f  f4 2a 24 e2 55 64 7c bb  |.X.P..}..*$.Ud|.|
00000010  a4 be 5b 77 8d e6 45 0e  08 83 ba 5d b1 b7 b8 35  |..[w..E....]...5|
00000020  4a 2f e9 71 d9 3f c4 e5  45 2a 05 a1 92 eb 9d 2a  |J/.q.?..E*.....*|
00000030  77 41 73 43 ab c3 31 bc  c8 97 3b 41 c2 d0 f5 82  |wAsC..1...;A....|
00000040  fd 2e 69 e3 77 22 84 97  57 01 d1 b4 04 82 8d 90  |..i.w"..W.......|
00000050  f1 fe 68 bc 76 f3 ed ac  c0 75 ae 51 c9 b9 21 72  |..h.v....u.Q..!r|
00000060  1d 58 36 05 59 46 7a f7  fd 3c 90 6d d7 6d 7f 4c  |.X6.YFz..<.m.m.L|
00000070  77 f8 e3 e7 f7 f7 c7 e7  f9 7e bf cf fb e4 93 5f  |w........~....._|
[...]
```

I hexdumped one of the files, looking for some pattern that would help me determine the type of compression used. I was looking for things like padding or signatures repeating within the `.pkg` file. I'm not sure how, but I finally determined the compression used was `DEFLATE` (RFC 1951) (I vaguely remember `7f f0` being a marker, but I might be mistaken).

In any case, [The Wikipedia page listing file signatures](https://en.wikipedia.org/wiki/List_of_file_signatures) is really useful, as well as Googling around candidate patterns.

I ended up creating [this tool](https://github.com/kakwa/brute-force-deflate) which tries to brute-force deflate all the sections of the file, and sure enough, I was able to extract some interesting files:

```shell
# Extracting stuff
kakwa@linux World of Warships/res_packages » bf-deflate -i system_data_0001.pkg -o systemout

# Look at the file types we just extracted
kakwa@linux World of Warships/res_packages » file systemout/* | tail
```

```
systemout/000A15D8ED-000A15D8F3: ISO-8859 text, with no line terminators
systemout/000A15D8F7-000A15EF9A: XML 1.0 document, ASCII text
systemout/000A15EF9E-000A15EFA7: ISO-8859 text, with CR line terminators
systemout/000A15EFAA-000A15F919: XML 1.0 document, ASCII text
systemout/000A15F929-000A162634: exported SGML document, Unicode text, UTF-8 text, with CRLF line terminators
systemout/000A162644-000A165D7C: ASCII text, with CRLF line terminators
systemout/000A165D8C-000A16C774: ASCII text, with CRLF line terminators
systemout/000A16C784-000A16D41A: exported SGML document, ASCII text, with CRLF line terminators
systemout/000A16D41E-000A16D426: data
systemout/bf-Xe4fzss:            empty
```

```shell
# Look if we indeed got what "file" says it is
kakwa@linux World of Warships/res_packages » cat systemout/000A15EFAA-000A15F919
```

```
<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<root>
    <Implements>
        <Interface>VisionOwner</Interface>
        <Interface>AtbaOwner</Interface>
        <Interface>AirDefenceOwner</Interface>
        <Interface>BattleLogicEntityOwner</Interface>
        <Interface>DamageDealerOwner</Interface>
        <Interface>DebugDrawEntity</Interface>
    </Implements>
</root>
```

Okay, we actually are able to extract real files!

...But without the names, it's not that interesting.

Note that in my "brute-force deflate" tool, I chose to name the files I managed to extract with the (approximate) corresponding start and end offsets of what my tool managed to uncompress (ex: `000A165D8C-000A16C774`, start offset is `000A165D8C`, end is `000A16C774`). This makes it simpler to correlate each extracted file to a section in the original file.

Going back to the reverse engineering, that was progress, but I then lost interest and didn't follow up for two years.

### Follow-up

Two years later, I regained interest when I finally tested the Windows `wows_unpack` tool. It revealed that files have individual names and paths—indicating a custom archive format probably similar to a `.zip` file and most likely containing:

* Compressed data blobs
* Index containing file paths, types, IDs, and offsets

### PKG File Format

Let's stare at more hexdumps:

```shell
kakwa@linux World of Warships/res_unpack » hexdump -C system_data_0001.pkg | less
```

```
[...]
000021e0  b7 df f2 d7 ff e4 4f bd  52 f6 39 be f5 4a 92 2f  |......O.R.9..J./|
000021f0  d9 8a f4 ff 01 00 00 00  00 bf 00 45 5c 6c 36 00  |...........E\l6.|
00002200  00 00 00 00 00 dd 97 cf  6e e2 30 10 c6 cf 54 ea  |........n.0...T.|
00002210  3b 44 79 00 20 09 09 20  41 a5 22 ca 9f 83 b7 08  |;Dy. .. A.".....|
00002220  38 ec cd 72 93 61 6b 6d  6c 47 ce a4 85 b7 5f 3b  |8..r.akmlG...._;|
00002230  25 0b 6d 29 d5 ae ba 12  9b 63 26 33 e3 df f7 79  |%.m).....c&3...y|
00002240  ec 28 03 26 b9 60 08 09  e1 79 9c 37 b7 22 bd b9  |.(.&.`...y.7."..|
[...]
000023b0  92 a0 6d bc 47 a6 f3 58  03 13 17 37 f7 16 d0 3b  |..m.G..X...7...;|
000023c0  06 1c 31 44 f3 55 fa 2f  dd af 44 bf fe 2f f9 05  |..1D.U./..D../..|
000023d0  00 00 00 00 6d b9 de c1  ad 0c 00 00 00 00 00 00  |....m...........|
000023e0  7d cf cd 0d 80 20 0c 80  d1 b3 26 ce c2 02 84 8b  |}.... ....&.....|
000023f0  c6 01 dc 00 b5 fe 24 85  12 5a f6 57 8c 92 70 f1  |......$..Z.W..p.|
00002400  f8 b5 ef d0 ea 48 24 a6  6b 1b 0d de ce 08 ab 19  |.....H$.k.......|
00002410  2d 32 68 f5 e5 b3 42 70  e0 85 73 94 32 5b 4c 2c  |-2h...Bp..s.2[L,|
00002420  c9 f5 78 86 9b bf c3 4a  2c e4 82 65 fe 11 7c 9c  |..x....J,..e..|.|
00002430  61 20 c4 1f b2 27 3f 91  58 a1 98 11 57 aa 44 3e  |a ...'?.X...W.D>|
00002440  4d ab e7 97 0b 00 00 00  00 f1 d2 87 5a d2 00 00  |M...........Z...|
00002450  00 00 00 00 00 ad 9c db  6e db b8 16 86 af 67 03  |........n.....g.|
00002460  fb 1d 3c b9 2f 3a 3e e4  50 20 0d c0 48 8c ad 89  |..<./:>.P ..H...|
00002470  2c 69 28 c9 4e 7a 23 b8  89 3b 35 26 89 03 c7 99  |,i(.Nz#..;5&....|
00002480  ee be fd 26 75 32 29 2e  52 4b 72 2f 0a a4 16 fd  |...&u2).RKr/....|
00002490  7f bf 28 72 69 f1 e4 cb  d7 dd fa 6d bd bf fa ef  |..(ri......m....|
[...]
```

I noticed the 128 bits pattern `00 00 00 00 | xx xx xx xx | xx xx 00 00 | 00 00 00 00` repeating within the file (`|` used to cut every 32 bits).

The starts and ends of these small sections line up pretty well with the data sections I managed to extract:

```
0000000001-00000021F6
0000002206-00000023D1
00000023E1-0000002446
0000002456-00000031C8
```

We indeed have the first `00 00 [...]` pattern starting at offset 000021f4 and ending 00002205, which nearly matches 00000021F6 (end of first extracted file) and 0000002206 (start of second extracted file).
The next pattern starts at 000023d0 and ends at 000023df, which again lines up roughly with 00000023D1 and 00000023E1. And so on for all the sections.

Note, my brute-force tool is most likely a bit buggy and probably adds a few +1 offsets here and there; also it is likely that the uncompression overflows a bit beyond the actual compressed data. But it is good enough for the purpose.

Looking at the end of the file, we have this pattern repeating one final time at the very end:

```
0a16d3c0  79 b0 e2 a0 8e e3 a8 3c  4b d5 d4 51 a0 7b b2 a1  |y......<K..Q.{..|
0a16d3d0  32 6b 36 bf fc ce 46 b6  1e d6 2d b8 94 98 ea 74  |2k6...F...-....t|
0a16d3e0  ac 57 92 19 a0 2f 7a c5  43 23 1e 46 0e 1d a8 6f  |.W.../z.C#.F...o|
0a16d3f0  9a fe f2 85 0e 6c 2f a4  8b 87 71 d4 5e 9a 8f d4  |.....l/...q.^...|
0a16d400  41 0f eb 85 aa b4 41 f7  ab af 86 39 6a d7 db af  |A.....A....9j...|
0a16d410  2a 24 8b 8f 8d 7f 6a f6  3f 00 00 00 00 6b ba c9  |*$....j.?....k..|
0a16d420  70 eb 6c 00 00 00 00 00  00                       |p.l......|
0a16d429
(END)
```

Furthermore, the first uncompressed block seems to start right at the beginning of the file, so there is probably no header section.

### PKG Structure

Looking at a few other `.pkg`, this pattern seems to be shared across all files.

So we can deduce the `.pkg` format is a concatenated list of sections like the following:

```
+~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~+
|                                                                               |
|                       Compressed Data (RFC 1951/Deflate)                      |
|                                                                               |
+~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~+
+====+====+====+====+====+====+====+====+====+====+====+====+====+====+====+====+
| 00 | 00 | 00 | 00 | XX | XX | XX | XX | XX | XX | 00 | 00 | 00 | 00 | 00 | 00 |
+====+====+====+====+====+====+====+====+====+====+====+====+====+====+====+====+
|<---- 0 padding -->|<--------- some kind of ID ----------->|<--- 0 padding --->|
```

Note that by this point, I'm making a lot of assumptions:

* I'm assuming that `0 padding` 32-bit blocks are actually padding, but they could be fields that happened to be set to 0 most of the time
* I'm a bit puzzled by the 16-bit `00 00` at the end of `some kind of ID`
* I'm also not completely sure if the block containing the data is always compressed using DEFLATE
* I'm not even sure if this general file format is actually shared across all files.

But let's go forward, this format seems common enough to still yield good results. Plus we can always go back and revisit this interpretation.

### Understanding IDs

The 64-bit values between data blocks appear random and high-value—too short for hashes, too large for offsets. These are likely simple random unique identifiers:

```
00 00 00 00 | bf 00 45 5c | 6c 36 00 00 | 00 00 00 00
00 00 00 00 | 6d b9 de c1 | ad 0c 00 00 | 00 00 00 00
00 00 00 00 | f1 d2 87 5a | d2 00 00 00 | 00 00 00 00
00 00 00 00 | 83 0a 72 88 | a3 5c 00 00 | 00 00 00 00
00 00 00 00 | 92 ab 31 63 | 91 2a 00 00 | 00 00 00 00
```

### Recap

We've identified the data storage format:
- Game data resides in `res_packages/` directory
- `.pkg` files are custom archives containing (mostly) DEFLATE-compressed blobs separated by 64-bit IDs
- File names and paths are probably stored separately

Getting the file metadata will be explored in [the next part](/posts/wows_depack_part2/) of this series.
