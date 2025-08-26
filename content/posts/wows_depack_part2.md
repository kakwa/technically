+++
title = 'Reversing WoWs Resource Format - Part 2: Getting The Metadata'
date = 2024-06-29T22:50:48+02:00
draft = true
+++

> Series navigation
> - All parts: [/posts/wows_depack_index/](/posts/wows_depack_index/)
> - Previous: Part 1 — Searching The Data → [/posts/wows_depack_part1/](/posts/wows_depack_part1/)
> - Next: Part 3 — Reading The Database → [/posts/wows_depack_part3/](/posts/wows_depack_part3/)
>
> Quick recap (from Part 1)
> - Data lives in `res_packages/` as custom `.pkg` archives.
> - Each `.pkg` is a sequence of DEFLATE-compressed blobs separated by 64-bit IDs with zero padding.
> - No file names inside `.pkg`; names/paths must exist elsewhere (in indexes).

# Give Me The Metadata

In Part 1, we found the actual data and where it was stored, but it would be nice to have the whole file & directory structure.

So it's back to looking at the game files.

## More exploring

Hopefully the resources metadata are not embedded directly in the WoWs executable or one of its library.

Let's look:

```shell
# List all files
# then remove uninteresting bits like replays, crash, dlls, logs, .pkg or cef stuff (embedded Chrome used for the armory, inventory dockyard and clan base))

kakwa@linux Games/World of Warships » find ./ -type f | grep -v cef | grep -v replays | grep -v crashes | grep -v '.pkg' | grep -v '.dll' | grep -v '.log'  | grep -v '\.exe' | less
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


Ohhh, these `.idx` files look promissing, specially their names match quite well the pkg files:

```
spaces_dock_hsf.idx -> spaces_dock_hsf_0001.pkg
ehicles_level9_ned.idx -> vehicles_level9_ned_0001.pkg
etc
```

Let's take a look:

```shell
kakwa@linux bin/6775398/idx » strings -n 5 system_data.idx
#%B'E
#%B'E
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
helpers
FoamMapLowFreq.dds
tritanopia.dds
color_correct_default.dds
Color.dds
Shimmer.dds
highlight_noise.dds
space_variation_dummy.dds
waves_heights0.dds
4F$)p
E)zjp
 |5*y
FM'lp
k4|W8
%}n:p
(	?A+
c|'lp
LrL)t
atw|$
:M+Xp
F?mep
wsystem_data_0001.pkg
```

Bingo, we have all the file names, and at the end, the name of the corresponding `.pkg` file.

These `.idx` files, as the extension indicates, are our indexes containing all the file names and metadata.

Also, note that we have a few names (like `maps` or `helpers`) without extensions, these are probably directory names.

### bin directory and Game versions

There are a few things to note about the `./bin` directory: it contains several sub-directory looking like that:

```shell
kakwa@linux World of Warships/bin » du -hd 1 | sort -h
12K	./5241351
12K	./6081105
12K	./6223574
592M	./6623042
594M	./6775398
```

This look a lot like incrementa build numbers, with WoWs keeping the latest published build 'N' and 'N-1' (the mostly empty directories are only containing left overs like logs or mods).

We will need to take this into account, using the highest numbered sub-directory to get the most up to date indexes.

### Index (.idx) general layout

So next, lets look at one of these index files.

```shell
kakwa@linux 6775398/idx » hexdump -C system_data.idx | less

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
00002660  53 15 00 00 00 00 00 00  a4 eb 1b 3e 50 21 d8 74  |S..........>P!.t|
00002670  38 e6 83 3c 74 a7 20 b2  0a 00 00 00 00 00 00 00  |8..<t. .........|
00002680  37 15 00 00 00 00 00 00  e7 c6 0b ae d5 31 51 55  |7............1QU|
00002690  a4 eb 1b 3e 50 21 d8 74  0c 00 00 00 00 00 00 00  |...>P!.t........|
000026a0  21 15 00 00 00 00 00 00  00 40 cc c7 49 c4 54 09  |!........@..I.T.|
000026b0  a4 eb 1b 3e 50 21 d8 74  14 00 00 00 00 00 00 00  |...>P!.t........|
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
00002760  5f 6d 61 70 70 69 6e 67  00 61 75 74 6f 74 65 73  |_mapping.autotes|
00002770  74 73 5f 64 72 61 77 5f  67 75 69 5f 73 65 74 74  |ts_draw_gui_sett|
00002780  69 6e 67 73 2e 78 6d 6c  00 48 6f 75 73 65 46 72  |ings.xml.HouseFr|
00002790  6f 6e 74 2e 64 64 73 00  70 72 65 73 65 74 5f 6b  |ont.dds.preset_k|
000027a0  65 79 62 6f 61 72 64 5f  31 2e 78 6d 6c 00 69 6e  |eyboard_1.xml.in|
000027b0  74 65 72 66 61 63 65 73  00 76 65 72 64 61 6e 61  |terfaces.verdana|
000027c0  5f 73 6d 61 6c 6c 2e 66  6f 6e 74 00 73 70 61 63  |_small.font.spac|
000027d0  65 5f 64 65 66 73 00 61  69 64 5f 6e 75 6c 6c 2e  |e_defs.aid_null.|
000027e0  64 64 73 00 63 61 6d 6f  75 66 6c 61 67 65 73 2e  |dds.camouflages.|
000027f0  78 6d 6c 00 63 68 75 6e  6b 2e 64 64 73 00 66 6f  |xml.chunk.dds.fo|
00002800  6e 74 63 6f 6e 66 69 67  2e 78 6d 6c 00 46 6f 61  |ntconfig.xml.Foa|
00002810  6d 4d 61 70 2e 64 64 73  00 42 75 69 6c 64 69 6e  |mMap.dds.Buildin|
00002820  67 2e 64 65 66 00 63 6f  6e 66 69 67 2e 78 6d 6c  |g.def.config.xml|
00002830  00 67 61 6d 65 5f 77 69  6e 64 5f 6e 6f 69 73 65  |.game_wind_noise|
00002840  2e 64 64 73 00 47 61 6d  65 50 61 72 61 6d 73 2e  |.dds.GameParams.|
00002850  64 61 74 61 00 44 65 62  75 67 44 72 61 77 45 6e  |data.DebugDrawEn|
00002860  74 69 74 79 2e 64 65 66  00 63 6f 6e 74 65 6e 74  |tity.def.content|
00002870  00 4c 6f 77 65 72 46 6f  72 77 61 72 64 54 72 61  |.LowerForwardTra|
00002880  6e 73 2e 64 64 73 00 55  49 50 61 72 61 6d 73 2e  |ns.dds.UIParams.|
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
00003c90  00 00 00 00 00 00 8e c7  6a 58 7c 86 62 33 70 11  |........jX|.b3p.|
00003ca0  03 07 0d 33 ed 77 e0 23  00 00 00 00 00 00 05 00  |...3.w.#........|
00003cb0  00 00 01 00 00 00 65 00  00 00 f1 d2 87 5a d2 00  |......e......Z..|
00003cc0  00 00 00 00 00 00 8e 43  3d e9 cf 49 52 a4 70 11  |.......C=..IR.p.|
00003cd0  03 07 0d 33 ed 77 4d 1f  6a 05 00 00 00 00 05 00  |...3.wM.j.......|
00003ce0  00 00 01 00 00 00 bb 19  00 00 f7 53 4a b1 38 ab  |...........SJ.8.|
00003cf0  00 00 00 00 00 00 0e 3c  9a 6d 22 de 7b da 70 11  |.......<.m".{.p.|
00003d00  03 07 0d 33 ed 77 55 24  00 00 00 00 00 00 05 00  |...3.wU$........|
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
* A all the file name strings `\0` separated, but also a few strings without extensions, probably directory names.
* A second chunk of metadata

Lets look for the IDs we found in the corresponding `.pkg` (here `system_data_0001.pkg`), for example `00 00 00 00 | bf 00 45 5c | 6c 36 00 00 | 00 00 00 00`.

```
[......................] 00 8f 0c  9a ba 4f 40 b6 93 70 11  |0.dds.....O@..p.|
00003c10  03 07 0d 33 ed 77 00 00  00 00 00 00 00 00 05 00  |...3.w..........|
00003c20  00 00 01 00 00 00 f5 21  00 00 bf 00 45 5c 6c 36  |.......!....E\l6|
00003c30  00 00 00 00 00 00 8f ec [...]
```

Ok, it's there, in the second chunk. And it also works if we test for other IDs. We have at least a link by ID between the `.idx` and the `.pkg` file.

We will come back later to the second chunk, remembering that, but lets focus on the first chunk for now.

### Format of the first metadata chunk of the '.idx' file

Lets try to understand the first part of the .idx file structure.

```shell
kakwa@linux 6775398/idx » hexdump -C system_data.idx | less

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

00002690  a4 eb 1b 3e 50 21 d8 74  0c 00 00 00 00 00 00 00  |...>P!.t........|
000026a0  21 15 00 00 00 00 00 00  00 40 cc c7 49 c4 54 09  |!........@..I.T.|
000026b0  a4 eb 1b 3e 50 21 d8 74  14 00 00 00 00 00 00 00  |...>P!.t........|
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
```

Staring at the hexdump long enough and we can start to see some patterns.

At regular interval, every 256 bits, we get a 64 bits integer with a relatively low value, hinting at individual metadata sets of 256 bits.

This look suspeciously like some kind of constant enum coded into a 64 bits integer.
My best guess right now would be some kind of file type code, itself define as a constant in the game engine like that:

```C
#define FILE_TYPE_1 0x01
#define FILE_TYPE_2 0x02
// [...]
```

Let's call it `file_type` for now.

Looking at the end of the first chunk (right before we get `KDStorage.bin`), we have to go back 4 x 64 bits to get something that looks like a `file_type`.

This means `file_type` is the first field in the 256 bits structure.

Let's look at the next 64 bits: `ce 26 00 00 00 00 00 00`, `c1 26 00 00 00 00 00 00`, `80 26 00 00 00 00 00 00`, etc. These values are again rather small.

Also these values, at least for the first ones, are suspeciously close to `00002718`, e.i right where the section containing the file names starts.

The last ones, `01 15 00 00 00 00 00 00`, `fb 14 00 00 00 00 00 00`, etc, are smaller, and suspiciously, they have similar value to the lenght of the file name section (approximately `0x00003c00 - 0x00002710 = 0x0000014f0`).

The second field is then probably some kind of offset. Most likely from the start of one 256 bits chunk to the start of one of the file names.

Looking at other `.idx` files seems to confirm that.

Let's call it `offset` for now.

Next, let's look at the remaining 128 bits.

```
8f 0c 9a ba 4f 40 b6 93 | 27 b9 08 b1 d1 a1 b1 db
8f ec 87 4a 28 d0 f7 c7 | a4 eb 1b 3e 50 21 d8 74
ad 70 a2 e7 ac 2c 4f 6b | 27 b9 08 b1 d1 a1 b1 db
4e 84 a5 6a 94 dc 1f 7f | 62 f5 aa 4b 5e 15 7f 93
4e b0 fe 23 62 40 a5 65 | 27 b9 08 b1 d1 a1 b1 db
8e c7 6a 58 7c 86 62 33 | 27 b9 08 b1 d1 a1 b1 db
```

First thing to note, all the bits are used. which disqualifies offsets or simple enum ids like before.

Right now, we are not even if sure these 128 bits are part of one 128 bits field (for example a hash), two 64 bits integers, four 32 integers, or any combination of 16, 32 or 64 bits that ends-up making a 128 bits chunk.

Looking at it more closely, the first 64 bits looks rather random, the last 64 bits however? we see quite a few values repeating themselves (ex: `27 b9 08 b1 d1 a1 b1 db`).

Lets check the whole file:


```shell
kakwa@linux 6775398/idx » hexdump -C system_data.idx| grep '00 00 00 00 00 00 00' | sed 's/^..........//' | sed 's/  .*//' | sort  | uniq -c | sort -n

# note: first number is the number of occurance
      1 00 00 00 00 00 00 00 af
      1 1c 6a 8d 7f df 8e b3 35
      1 28 00 00 00 00 00 00 00
      1 36 71 00 00 00 00 00 00
      1 37 01 00 00 1c 01 00 00
      1 7d e3 1c a4 35 3e 98 8b
      1 e0 95 53 f6 cc 08 c0 46
      2 12 46 58 36 c8 ec 47 8b
      2 4e b0 fe 23 62 40 a5 65
      2 d0 d7 a5 ce a8 86 0e ae
      3 1a aa c7 3c 4e 76 ad 94
      3 4c d1 2e 30 73 38 d9 13
      3 4c f0 ea c1 d5 5a 8d 12
      3 88 57 fc 1c 72 f3 84 fa
      3 ac 82 d5 f6 9e db 47 f9
      3 b1 86 45 dc 7a 63 37 38
      3 fc 27 83 2d 44 46 30 a3
      6 76 83 17 b5 cf dd b7 0e
      8 06 cf 85 bd 69 99 e2 46
      9 09 28 f1 df 2d 04 93 de
     10 a4 eb 1b 3e 50 21 d8 74
     10 d7 22 2f fc 0a 67 7a 0d
     14 aa db f0 18 01 89 b6 d8
     15 df 61 50 67 c7 3a dd 7a
     18 19 ac 65 3f 91 78 97 dc
     19 38 e6 83 3c 74 a7 20 b2
     19 59 dc e0 43 fc 88 b7 7c
     23 d3 9e 86 23 25 42 27 45
     24 0e 48 58 ea 50 44 1a 47
     33 d7 19 f3 03 3e 6e 59 03
     34 27 b9 08 b1 d1 a1 b1 db
     38 62 f5 aa 4b 5e 15 7f 93
```

Indeed, the repetitions are quite frequent, and running the same command on other files yeild roughly the same values:

```shell
kakwa@linux 6775398/idx » hexdump -C particles.idx| grep '00 00 00 00 00 00 00' | sed 's/^..........//' | sed 's/  .*//' | sort  | uniq -c | sort -n 
      1 27 b9 08 b1 d1 a1 b1 db
      1 28 00 00 00 00 00 00 00
      1 8e ae 00 00 00 00 00 00
      1 bd 01 00 00 b7 01 00 00
      4 ca 2c b7 97 24 b8 1c 86
      5 1f 19 a6 0c a2 9b 7f b3
     16 94 a1 23 f4 c5 41 b8 42
     20 91 cc 55 52 25 2a 42 d4
     81 de 3e 45 0e 99 dc 30 14
    317 66 52 00 d6 89 64 1d 2e
```

More over, `sound_music.idx` wchi as the name implies probably only contains sound files returns mostly one type:

```shell
kakwa@linux 6775398/idx » hexdump -C sound_music.idx| grep '00 00 00 00 00 00 00' | sed 's/^..........//' | sed 's/  .*//' | sort  | uniq -c | sort -n
    513 93 63 67 56 c2 97 75 69
```

Note: these commands are by no mean accurate, they are likely to catch garbage and miscount. But these are quick and dirty ways to validate hypothesis.

So it seems we are dealing with another `file_type` field. Let's call it `file_type2`, and rename the first one `file_type1`.

So in the end, making a few assumptions, for now, we have figured out that the rough format of this section:

```
+====+====+====+====+====+====+====+====++====+====+====+====+====+====+====+====+
| T1 | T1 | T1 | T1 | T1 | T1 | T1 | T1 || OF | OF | OF | OF | OF | OF | OF | OF |
+====+====+====+====+====+====+====+====++====+====+====+====+====+====+====+====+
|<---------- file type 1 -------------->||<------------ offset ----------------->|
|               64 bits                 ||               64 bits                 |
+====+====+====+====+====+====+====+====++====+====+====+====+====+====+====+====+
| UN | UN | UN | UN | UN | UN | UN | UN || T2 | T2 | T2 | T2 | T2 | T2 | T2 | T2 |
+====+====+====+====+====+====+====+====++====+====+====+====+====+====+====+====+
|<------------ unknown ---------------->||<---------- file type 2 -------------->|
|               64 bits                 ||               64 bits                 |
```

### Header

Now, lets start analyzing the header part of the `.idx`.

Here is the first bytes on an `.idx` file.

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
````

These first bytes don't look like the `section` previously mentionned, we have a magic number (`ISFP`) and then the content doesn't look like a `section` at first (too many low value 32 bits integers).

This means we most likely have an header section containing things like:
* magic numbers
* types
* sizes
* number of entries/files

The first thing to determine is the size of the header. Looking at it, the first `section` starts at `0x38` (recognisable by they full 64 bits integers).

This means the header is 7 x 64 bits.

Lets analyze the content.

Looking at all the files, for the first 128 bits, we get:

```shell
kakwa@linux 6775398/idx » for i in *;do hexdump -C $i | head -n 1;done 
[...]
00000000  49 53 46 50 00 00 00 02  1b 73 f9 d5 40 00 00 00  |ISFP.....s..@...|
00000000  49 53 46 50 00 00 00 02  78 f0 2c 09 40 00 00 00  |ISFP....x.,.@...|
00000000  49 53 46 50 00 00 00 02  b8 fe ba b9 40 00 00 00  |ISFP........@...|
00000000  49 53 46 50 00 00 00 02  06 24 fa 2d 40 00 00 00  |ISFP.....$.-@...|
00000000  49 53 46 50 00 00 00 02  1e 7e f6 d9 40 00 00 00  |ISFP.....~..@...|
00000000  49 53 46 50 00 00 00 02  dd 21 74 c2 40 00 00 00  |ISFP.....!t.@...|
00000000  49 53 46 50 00 00 00 02  33 28 63 bd 40 00 00 00  |ISFP....3(c.@...|
00000000  49 53 46 50 00 00 00 02  cb 5c e2 0d 40 00 00 00  |ISFP.....\..@...|
00000000  49 53 46 50 00 00 00 02  cb e8 8a fd 40 00 00 00  |ISFP........@...|
00000000  49 53 46 50 00 00 00 02  6e 04 b1 62 40 00 00 00  |ISFP....n..b@...|
00000000  49 53 46 50 00 00 00 02  15 1c a2 f9 40 00 00 00  |ISFP........@...|
[...]
```

As we can see, the 1st, 2nd, and 4th 32 bits chunck are always the same, and looking at the values, we have respectively:
* a magic number (`ISFP`),
* `00 00 00 02` which is rather weird (it could be some kind of id, if we were little endian, but the format is big endian). Maybe it is actually part of the magic number. As it doesn't vary, it's not too important for the task at end there.
* `40 00 00 00` which like `type 1` looks like a low value enum, and given its position in the index file, within the header, we are most likely dealing with an archive type. Again, as it doesn't vary, it's not really important.

The 3rd 32 bits integer uses all the available bits, so it's unlikely a size. Maybe it's a CRC32 or a unique ID for the archives.

Edit: the `40 00 00 00` value upon closer inspection might not be an archive type, its value is 64 in decimal, which might be an header size, or simply storing the size of an integer.

So we have:
```
+====+====+====+====++====+====+====+====++====+====+====+====++====+====+====+====+
| MA | MA | MA | MA || 00 | 00 | 00 | 02 || ID | ID | ID | ID || 40 | 00 | 00 | 00 |
+====+====+====+====++====+====+====+====++====+====+====+====++====+====+====+====+
|<----- magic ----->||<----- ???? ------>||<---- id/crc ----->||<----- ??????? --->|
```

Now, lets look at the next 128 bits (second line in hexdump).

```shell
kakwa@linux 6775398/idx » for i in *;do hexdump -C $i | head -n 2 | tail -n 1;done                                                                                                                                                                                                                                    130 ↵
00000010  bd 01 00 00 b7 01 00 00  01 00 00 00 00 00 00 00  |................|
00000010  35 01 00 00 1d 01 00 00  01 00 00 00 00 00 00 00  |5...............|
00000010  5b 00 00 00 57 00 00 00  01 00 00 00 00 00 00 00  |[...W...........|
00000010  5c 00 00 00 58 00 00 00  01 00 00 00 00 00 00 00  |\...X...........|
00000010  10 18 00 00 ff 17 00 00  01 00 00 00 00 00 00 00  |................|
00000010  29 3b 00 00 0b 3b 00 00  01 00 00 00 00 00 00 00  |);...;..........|
00000010  04 02 00 00 02 02 00 00  01 00 00 00 00 00 00 00  |................|
00000010  1e 05 00 00 c2 03 00 00  01 00 00 00 00 00 00 00  |................|
00000010  a5 01 00 00 36 01 00 00  01 00 00 00 00 00 00 00  |....6...........|
00000010  13 04 00 00 fb 02 00 00  01 00 00 00 00 00 00 00  |................|
00000010  79 03 00 00 a9 02 00 00  01 00 00 00 00 00 00 00  |y...............|
``` 

So here, we recognize two 32 bits integers due to the `00 00`,  and then either a fixed 64 bits integer with always a `01 00 00 00 00 00 00 00` value, or something like two 32 bits integers with value `01 00 00 00` and `00 00 00 00` (as the value never varies, again, it's not that important).

Lets try to determine the two 32 bits values. Let's look at one of the files in particular:

```shell
kakwa@linux 6775398/idx » hexdump -C system_data.idx | less
[...]
00000010  37 01 00 00 1c 01 00 00  01 00 00 00 00 00 00 00  |7...............|
[...]

The first value is `37 01 00 00`, i.e. converted to decimal, `311`. Doing a strings `strings system_data.idx >listing` and remove manually the garbage (ex: `w6~n`) as best as possible, plus the `.pkg` file name, only keeping files and directory names, we get `310` entries, a remarquably close value.

Looking at other files, story is similar, this field roughly matches the number of strings we get from `strings` (never perfectly however, but if the names are too short, `strings` will ignore them, most likely explaining the small delta we have each time).

Consequently we can deduce it's most likely the number of entries (files and directories) in the index file.

Next, we have `1c 01 00 00`, i.e. converted to decimal, `284`. This value is suspisiously close to the previous value. As we have both directories and file names, this number probably represents the number of items which are actual files.

Let's validate that:

```shell
# Q&D filtering out names without an extension (no '.')
kakwa@linux 6775398/idx » cat listing | grep  '\.' | wc -l 
284
```

Bingo, we have the exact number we were looking for.

The last 64 bits could simply be ignored for now since they always have the same value.

So we have:

```
+====+====+====+====++====+====+====+====++====+====+====+====++====+====+====+====+
| FD | FD | FD | FD || FI | FI | FI | FI || 01 | 00 | 00 | 00 || 00 | 00 | 00 | 00 |
+====+====+====+====++====+====+====+====++====+====+====+====++====+====+====+====+
|<file + dir count >||<-- file count --->||<-------------- ???? ------------------>|
```

Next 128 bits:

```shell
kakwa@linux 6775398/idx » for i in *;do hexdump -C $i | head -n 3 | tail -n 1;done | less
[...]
00000020  28 00 00 00 00 00 00 00  58 8d 00 00 00 00 00 00  |(.......X.......|
00000020  28 00 00 00 00 00 00 00  7c 3f 02 00 00 00 00 00  |(.......|?......|
00000020  28 00 00 00 00 00 00 00  77 2f 00 00 00 00 00 00  |(.......w/......|
00000020  28 00 00 00 00 00 00 00  bc e9 01 00 00 00 00 00  |(...............|
00000020  28 00 00 00 00 00 00 00  c6 ea 02 00 00 00 00 00  |(...............|
00000020  28 00 00 00 00 00 00 00  a9 0f 00 00 00 00 00 00  |(...............|
00000020  28 00 00 00 00 00 00 00  c4 22 00 00 00 00 00 00  |(........"......|
00000020  28 00 00 00 00 00 00 00  b6 2b 00 00 00 00 00 00  |(........+......|
00000020  28 00 00 00 00 00 00 00  d6 41 00 00 00 00 00 00  |(........A......|
00000020  28 00 00 00 00 00 00 00  fd 21 00 00 00 00 00 00  |(........!......|
00000020  28 00 00 00 00 00 00 00  e1 25 00 00 00 00 00 00  |(........%......|
00000020  28 00 00 00 00 00 00 00  f5 31 00 00 00 00 00 00  |(........1......|
00000020  28 00 00 00 00 00 00 00  1e 42 00 00 00 00 00 00  |(........B......|
00000020  28 00 00 00 00 00 00 00  70 42 02 00 00 00 00 00  |(.......pB......|
[...]
```

So here, we have 2 64 bits integers, the first one is `28 00 00 00 00 00 00 00` and always has the same value, not sure what it represents, the value is somewhat close to the header size in bytes: 40 for this value, 56 for the full header size.

Maybe the header could vary in size in certain situations, and this represents its size minus some fixed part (like the first 16 bytes/128 bits). I'm also kind of betting that if the previous 64 bits integer (`01 00 00 00 00 00 00 00` changes, this will also change.

But as it never varies in the set of index files we have here, we cannot really make any deduction, only guesses. So once again, lets ignore it.

At this point, the idea of downloading other Wargaming games like World of Tanks or World of Warplanes popped-up, maybe this will give complementary information regarding the unknown fields that starts to pile-up.

But lets continue for now.

EDIT: It's no help, World of Tanks and World of Warplanes simply pack their resources in `.zip` files...
It's a wild guess, but I kind of expect WoWs to be the same in the futur.
The WoWs packing format feels in fact somewhat legacy, custom and far less efficient than a standard & run of the mill `.zip` file. Not to mention using `.zip` files means removing one bit of code to maintain.

The next value is again a 64 bits integer, it changes between each files.

lets focus on one file:

```
[...]
00000020  28 00 00 00 00 00 00 00  f6 3b 00 00 00 00 00 00  |(........;......|
[...]
```

At first, I though it might be a file size, but quickly checking the index file size, I got:

* index file size: 29043
* value of this field in decimal: 15350

Checking another file, I got 77461 and 44807.

So no, it's not the index size. However it is suspisously ~1/2 of the file size, and after having stared at hexdumps for hours, I had another idea.

The third chunk of the file is right after the bundle of dir/file name strings which varies in length wildly (e.i, it's not fixed length or a multiple of a fix length).

We probably need an offset pointing to the start of this section in the header.

And sure enough, looking where the bundle of strings stops, we get:

```
00003bd0  6f 69 73 65 2e 64 64 73  00 73 70 61 63 65 5f 76  |oise.dds.space_v|
00003be0  61 72 69 61 74 69 6f 6e  5f 64 75 6d 6d 79 2e 64  |ariation_dummy.d|
00003bf0  64 73 00 77 61 76 65 73  5f 68 65 69 67 68 74 73  |ds.waves_heights|
00003c00  30 2e 64 64 73 00 8f ec  87 4a 28 d0 f7 c7 70 11  |0.dds....J(...p.|
00003c10  03 07 0d 33 ed 77 1e 9b  ef 05 00 00 00 00 05 00  |...3.w..........|
```

Okay, the string bundle ends at 00003c05, that's quite near 3b f6, so this is certainly the offset to this third section or the end of the bundle of strings.

Most likely, the offset is not from the start of the file, but from a specific in the header (this field? end of header?), that's why we get a -15 difference (0x00003c05 - 0x3bf6 = 0xF = 15). This -15 value is constant between file.

So we have:
```
+====+====+====+====+====+====+====+====++====+====+====+====+====+====+====+====+
| HS | HS | HS | HS | HS | HS | HS | HS || OF | OF | OF | OF | OF | OF | OF | OF |
+====+====+====+====+====+====+====+====++====+====+====+====+====+====+====+====+
|<------------ header size (?) -------->||<---- offset third section start ----->|
```

Last 64 bits:


```shell
kakwa@linux 6623042/idx » for i in *;do hexdump -C $i | head -n 4 | tail -n 1;done | less
[...]
00000030  40 af 03 00 00 00 00 00  1b 00 00 00 00 00 00 00  |@...............|
00000030  54 8d 1f 00 00 00 00 00  21 00 00 00 00 00 00 00  |T.......!.......|
00000030  8e ae 00 00 00 00 00 00  17 00 00 00 00 00 00 00  |................|
00000030  02 81 00 00 00 00 00 00  13 00 00 00 00 00 00 00  |................|
00000030  c9 24 00 00 00 00 00 00  1f 00 00 00 00 00 00 00  |.$..............|
[...]
```

So, we have a 64 bits integer, which is relatively low value. This means it's most like a size or an offset.

If we pick one:

```
hexdump -C system_data.idx | less
[...]
00000030  36 71 00 00 00 00 00 00  13 00 00 00 00 00 00 00  |6q..............|
[...]
```

We can see that the `36 71 00 00 00 00 00 00`, 28982 once converted to decimal, is remarkably close to the file size (29043 bytes).

From their, we can guess it might be three things:

* the actual index file size
* an offset to something at the end of the file
* pointer to the end of the third section

Lets note that for now, and figure out the finer details at implementation time.

So, to recap, here is the header section format:

```
+====+====+====+====++====+====+====+====++====+====+====+====++====+====+====+====+
| MA | MA | MA | MA || 00 | 00 | 00 | 02 || ID | ID | ID | ID || 40 | 00 | 00 | 00 |
+====+====+====+====++====+====+====+====++====+====+====+====++====+====+====+====+
|<----- magic ----->||<----- ???? ------>||<---- id/crc ----->||<----- ??????? --->|

+====+====+====+====++====+====+====+====++====+====+====+====++====+====+====+====+
| FD | FD | FD | FD || FI | FI | FI | FI || 01 | 00 | 00 | 00 || 00 | 00 | 00 | 00 |
+====+====+====+====++====+====+====+====++====+====+====+====++====+====+====+====+
|<file + dir count >||<-- file count --->||<-------------- ???? ------------------>|

+====+====+====+====+====+====+====+=====++=====+====+====+====+====+====+====+====+
| HS | HS | HS | HS | HS | HS | HS | HS  ||  OF | OF | OF | OF | OF | OF | OF | OF |
+====+====+====+====+====+====+====+=====++=====+====+====+====+====+====+====+====+
|<------------ header size (?) --------->||<----- offset third section start ----->|

+====+====+====+====+====+====+====+=====+
| OE | OE | OE | OE | OE | OE | OE | OE  |
+====+====+====+====+====+====+====+=====+
|<---- offset third section end -------->|
```

### Format of the middle section

Not much to say there.

Here what it looks like:

```shell
kakwa@linux 6775398/idx » hexdump -C system_data.idx| less
[...]
00002700  fb 14 00 00 00 00 00 00  74 d1 1b 8d f4 ff 7a ce  |........t.....z.|
00002710  a4 eb 1b 3e 50 21 d8 74  4b 44 53 74 6f 72 61 67  |...>P!.tKDStorag|
00002720  65 2e 62 69 6e 00 77 61  76 65 73 5f 68 65 69 67  |e.bin.waves_heig|
00002730  68 74 73 31 2e 64 64 73  00 61 6e 69 6d 61 74 65  |hts1.dds.animate|
[...]
000028c0  74 73 2e 62 69 6e 00 6d  69 73 63 53 65 74 74 69  |ts.bin.miscSetti|
000028d0  6e 67 73 2e 78 6d 6c 00  64 61 6d 61 67 65 5f 64  |ngs.xml.damage_d|
000028e0  65 63 5f 32 5f 64 2e 64  64 32 00 64 61 6d 61 67  |ec_2_d.dd2.damag|
000028f0  65 5f 64 65 63 5f 31 5f  65 2e 64 64 73 00 63 72  |e_dec_1_e.dds.cr|
[...]
00003be0  61 72 69 61 74 69 6f 6e  5f 64 75 6d 6d 79 2e 64  |ariation_dummy.d|
00003bf0  64 73 00 77 61 76 65 73  5f 68 65 69 67 68 74 73  |ds.waves_heights|
00003c00  30 2e 64 64 73 00 8f 0c  9a ba 4f 40 b6 93 70 11  |0.dds.....O@..p.|
00003c10  03 07 0d 33 ed 77 00 00  00 00 00 00 00 00 05 00  |...3.w..........|
00003c20  00 00 01 00 00 00 f5 21  00 00 bf 00 45 5c 6c 36  |.......!....E\l6|
```

So it's a bunch of `\0` separated strings. The only thing interesting to note is that it's not a fixed size section.

### Format of the third section


Here what it looks like:

```shell
kakwa@linux 6775398/idx » hexdump -C system_data.idx| less
[...]
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
00003c90  00 00 00 00 00 00 8e c7  6a 58 7c 86 62 33 70 11  |........jX|.b3p.|
00003ca0  03 07 0d 33 ed 77 e0 23  00 00 00 00 00 00 05 00  |...3.w.#........|
00003cb0  00 00 01 00 00 00 65 00  00 00 f1 d2 87 5a d2 00  |......e......Z..|
00003cc0  00 00 00 00 00 00 8e 43  3d e9 cf 49 52 a4 70 11  |.......C=..IR.p.|
00003cd0  03 07 0d 33 ed 77 4d 1f  6a 05 00 00 00 00 05 00  |...3.wM.j.......|
00003ce0  00 00 01 00 00 00 bb 19  00 00 f7 53 4a b1 38 ab  |...........SJ.8.|
00003cf0  00 00 00 00 00 00 0e 3c  9a 6d 22 de 7b da 70 11  |.......<.m".{.p.|
00003d00  03 07 0d 33 ed 77 55 24  00 00 00 00 00 00 05 00  |...3.wU$........|
00003d10  00 00 01 00 00 00 72 0d  00 00 83 0a 72 88 a3 5c  |......r.....r..\|
00003d20  00 00 00 00 00 00 98 45  00 7a 16 6e 84 21 70 11  |.......E.z.n.!p.|
00003d30  03 07 0d 33 ed 77 73 ce  cb 06 00 00 00 00 05 00  |...3.ws.........|
00003d40  00 00 01 00 00 00 f9 b6  b7 00 ff 7e f7 7b 5b 30  |...........~.{[0|
00003d50  b8 00 00 00 00 00 98 51  4a 00 2c 12 71 ad 70 11  |.......QJ.,.q.p.|
00003d60  03 07 0d 33 ed 77 7e 63  75 05 00 00 00 00 05 00  |...3.w~cu.......|
[...]
00007100  00 00 01 00 00 00 6f 09  00 00 fc 56 94 f8 9a 37  |......o....V...7|
00007110  00 00 00 00 00 00 21 67  ac 70 22 ec ca b8 70 11  |......!g.p"...p.|
00007120  03 07 0d 33 ed 77 28 f9  15 0a 00 00 00 00 05 00  |...3.w(.........|
00007130  00 00 01 00 00 00 0b 2d  00 00 03 bd b0 50 67 e9  |.......-.....Pg.|
00007140  00 00 00 00 00 00 15 00  00 00 00 00 00 00 18 00  |................|
00007150  00 00 00 00 00 00 70 11  03 07 0d 33 ed 77 73 79  |......p....3.wsy|
00007160  73 74 65 6d 5f 64 61 74  61 5f 30 30 30 31 2e 70  |stem_data_0001.p|
00007170  6b 67 00                                          |kg.|
00007173
(END)
```


Right away, we can notice 3 things:

* like before, it looks cyclical
* it contains the IDs of the pkg file
* it ends with the `.pkg` file name.

One cycle probably contains other metadata about a packaged file.

Lets try to first determine the size of these cycles.

first, lets "reallign" the hexdump.

Here the last file name strings ends at 00003c05 (last '\0'), which means 6 bytes.

hexdump has a convinient `-s` (skip) option for that.

```shell
# lets skip the first 6 bytes to allign hexdump output
kakwa@linux 6775398/idx » hexdump -s 6 -C system_data.idx| less
[...]
00003be6  6f 6e 5f 64 75 6d 6d 79  2e 64 64 73 00 77 61 76  |on_dummy.dds.wav|
00003bf6  65 73 5f 68 65 69 67 68  74 73 30 2e 64 64 73 00  |es_heights0.dds.|
00003c06  8f 0c 9a ba 4f 40 b6 93  70 11 03 07 0d 33 ed 77  |....O@..p....3.w|
00003c16  00 00 00 00 00 00 00 00  05 00 00 00 01 00 00 00  |................|
00003c26  f5 21 00 00 bf 00 45 5c  6c 36 00 00 00 00 00 00  |.!....E\l6......|
00003c36  8f ec 87 4a 28 d0 f7 c7  70 11 03 07 0d 33 ed 77  |...J(...p....3.w|
00003c46  1e 9b ef 05 00 00 00 00  05 00 00 00 01 00 00 00  |................|
00003c56  15 15 01 00 03 77 63 97  3e ab 02 00 00 00 00 00  |.....wc.>.......|
00003c66  ad 70 a2 e7 ac 2c 4f 6b  70 11 03 07 0d 33 ed 77  |.p...,Okp....3.w|
[...]
```

Much nicer!

With that, we immediately notice some cycle, with the `70 11 03 07 0d 33 ed 77` value.

There are 6 x 64 = 384 bits between each `70 11 03 07 0d 33 ed 77` value.

let's try to confirm that with the IDs.

We are spotting the `bf 00 45 5c 6c 36` seen previously in the `.pkg` file. 384 bits later, we see `03 77 63 97 3e ab 02`.

With a bit of digging (it's right in the middle of the `.pkg` file, and this ID is not neetly in a 64 bits aligned chunk because of the variable size of the Deflate blocks), we indeed find it.

We have indeed a 384 bits cycle, which neetly fits in 3 lines of hexdump!

So each of these is one record:

```
00003c06  8f 0c 9a ba 4f 40 b6 93  70 11 03 07 0d 33 ed 77  |....O@..p....3.w|
00003c16  00 00 00 00 00 00 00 00  05 00 00 00 01 00 00 00  |................|
00003c26  f5 21 00 00 bf 00 45 5c  6c 36 00 00 00 00 00 00  |.!....E\l6......|
```

```
00003c36  8f ec 87 4a 28 d0 f7 c7  70 11 03 07 0d 33 ed 77  |...J(...p....3.w|
00003c46  1e 9b ef 05 00 00 00 00  05 00 00 00 01 00 00 00  |................|
00003c56  15 15 01 00 03 77 63 97  3e ab 02 00 00 00 00 00  |.....wc.>.......|
```

```
00003c66  ad 70 a2 e7 ac 2c 4f 6b  70 11 03 07 0d 33 ed 77  |.p...,Okp....3.w|
00003c76  05 22 00 00 00 00 00 00  05 00 00 00 01 00 00 00  |."..............|
00003c86  cb 01 00 00 6d b9 de c1  ad 0c 00 00 00 00 00 00  |....m...........|
```

```
00003c96  8e c7 6a 58 7c 86 62 33  70 11 03 07 0d 33 ed 77  |..jX|.b3p....3.w|
00003ca6  e0 23 00 00 00 00 00 00  05 00 00 00 01 00 00 00  |.#..............|
00003cb6  65 00 00 00 f1 d2 87 5a  d2 00 00 00 00 00 00 00  |e......Z........|
```

```
00003cc6  8e 43 3d e9 cf 49 52 a4  70 11 03 07 0d 33 ed 77  |.C=..IR.p....3.w|
00003cd6  4d 1f 6a 05 00 00 00 00  05 00 00 00 01 00 00 00  |M.j.............|
00003ce6  bb 19 00 00 f7 53 4a b1  38 ab 00 00 00 00 00 00  |.....SJ.8.......|
```

All these records are from the same file,

lets grab a few from other files:

File 2:

```
0000f6fd  58 fe 65 b4 59 b6 b0 77  a4 8c 78 6a 58 aa 65 84  |X.e.Y..w..xjX.e.|
0000f70d  00 00 00 00 00 00 00 00  05 00 00 00 01 00 00 00  |................|
0000f71d  bc 99 05 00 f4 3a 67 8b  80 00 08 00 00 00 00 00  |.....:g.........|
```

```
0000f72d  a0 e5 c7 22 cc 49 d3 31  a4 8c 78 6a 58 aa 65 84  |...".I.1..xjX.e.|
0000f73d  3e 9e 7e 05 00 00 00 00  05 00 00 00 01 00 00 00  |>.~.............|
0000f74d  79 c6 03 00 dc b8 5f 80  80 00 08 00 00 00 00 00  |y....._.........|
```


File 3:

```
00002d0c  ed cf 33 f8 a5 94 53 56  0d a7 9c b9 bf 60 f5 3e  |..3...SV.....`.>|
00002d1c  40 a8 08 07 00 00 00 00  00 00 00 00 00 00 00 00  |@...............|
00002d2c  38 ab 00 00 5d cf 4e b6  38 ab 00 00 00 00 00 00  |8...].N.8.......|
```

```
00002d3c  ed ea da 52 4e 8f 70 ed  0d a7 9c b9 bf 60 f5 3e  |...RN.p......`.>|
00002d4c  00 00 00 00 00 00 00 00  00 00 00 00 00 00 00 00  |................|
00002d5c  98 00 00 00 a4 63 f2 9b  98 00 00 00 00 00 00 00  |.....c..........|
```

Lets study:

```
00003c06  8f 0c 9a ba 4f 40 b6 93  70 11 03 07 0d 33 ed 77  |....O@..p....3.w|
00003c16  00 00 00 00 00 00 00 00  05 00 00 00 01 00 00 00  |................|
00003c26  f5 21 00 00 bf 00 45 5c  6c 36 00 00 00 00 00 00  |.!....E\l6......|
```

For the first 128 bits we get:

```
00003c06  8f 0c 9a ba 4f 40 b6 93  70 11 03 07 0d 33 ed 77  |....O@..p....3.w|
```

From the fact the last 64 bits are constant, we can deduce we have probably two 64 bits integers in the first 128 bits

Once again, these are using all the available bits and seem rather random. It's difficult to link these to their role, so... lets simply ignore these for now.

```
+====+====+====+====+====+====+====+====++====+====+====+====+====+====+====+====+
| UO | UO | UO | UO | UO | UO | UO | UO || UT | UT | UT | UT | UT | UT | UT | UT |
+====+====+====+====+====+====+====+====++====+====+====+====+====+====+====+====+
|<------------ unknown 1 -------------->||<------------- unknow 2 -------------->|
|               64 bits                 ||               64 bits                 |
```

Next 64 bits, we have a low value 64 bits integer, so most likely an offset. It is also suspiciously at `0x0` for the first record which is also the first data chunk in the `.pkg` file.

So, it's most likely the start of a data chunk in a `.pkg` file. Looking at other records confirms that.

Next, we have two extremely low value 32 bits (0x5 and 0x1). So once again, most likely some kind of enum, lets call them `type1` and `type2`.

```
+====+====+====+====+====+====+====+====++====+====+====+====++====+====+====+====+
| OF | OF | OF | OF | OF | OF | OF | OF || T1 | T1 | T1 | T1 || T2 | T2 | T2 | T2 |
+====+====+====+====+====+====+====+====++====+====+====+====++====+====+====+====+
|<----------start offset pkg ---------->||<---- type 1 ----->||<----- type 2 ---->|
|               64 bits                 ||     32 bits       ||      32 bits      |
```

For the Last 128 bits, we get the following:
```
00003c26  f5 21 00 00 bf 00 45 5c  6c 36 00 00 00 00 00 00  |.!....E\l6......|
```

So, here, we see our `.pkg` ID (`bf 00 45 5c  6c 36`) right in the middle. Given its size, this ID is probably stored on 64 bits.

After that, last 32 bits, we get a bunch of `00`, maybe a reserved field, but more likely some kind of padding.

Before that, we get a low value 32 bits integer. When comparing with the `.pkg` file, `f5 21 00 00` is the offset where the first data chunk ends.


So it's the end offset. But 32 bits seems rather small to store such offset (specially given the start offset is 64 bits. Also, for other data chunks, this doesn't line-up.

However, it could very much be a relative offset (to the start of the data chunk).

Lets validate that with the second record

Record
``` 
00003c36  8f ec 87 4a 28 d0 f7 c7  70 11 03 07 0d 33 ed 77  |...J(...p....3.w|
00003c46  1e 9b ef 05 00 00 00 00  05 00 00 00 01 00 00 00  |................|
00003c56  15 15 01 00 03 77 63 97  3e ab 02 00 00 00 00 00  |.....wc.>.......|
```
More hexdump! (searching the data chunk using the `03 77 63 97  3e ab 02` ID and the start offset `1e 9b ef 05 00 00 00 00`, or `0x05ef9b1e` once we take endianess into account):

```shell
kakwa@linux World of Warships/res_packages » hexdump -C system_data_0001.pkg | less
[...]
05ef9b10  00 00 17 4b 28 42 80 40  00 00 00 00 00 00 8c 7d  |...K(B.@.......}|
05ef9b20  3b 50 5d d9 b6 dd 7d b6  3e 76 15 b2 5f 20 89 04  |;P]...}.>v.._ ..|
05ef9b30  55 bd 00 44 82 aa ec 7a  9c bd f7 79 45 57 39 40  |U..D...z...yEW9@|
05ef9b40  90 d0 4e 8c c0 01 9d 21  48 e8 0c 41 a2 ce 10 24  |..N....!H..A...$|
[...]
05f0b010  d1 d7 52 b0 de cc fa 9c  2b 8d b5 57 a4 02 ff 1a  |..R.....+..W....|
05f0b020  43 5d 2d 43 3f cc d1 0b  f8 88 92 a8 9f 5a 70 64  |C]-C?........Zpd|
05f0b030  46 fb 7f 00 00 00 00 03  77 63 97 3e ab 02 00 00  |F.......wc.>....|
05f0b040  00 00 00 94 b7 67 90 db  68 9e e6 d9 1f 36 62 6f  |.....g..h....6bo|
05f0b050  6f 22 76 f6 62 e3 62 77  67 7a 7a ba ab bb 8c aa  |o"v.b.bwgzz.....|
05f0b060  4a 52 95 5c ca a5 cf 64  d2 24 bd 27 41 d0 00 04  |JR.\...d.$.'A...|
[...]
```

We indeed find the start of our data chunk at `05ef9b1e` (`8c` after a bunch of `00` on the first line).

And looking for the `00 00 00 00 ID ID [...]` pattern in between the data chunks, we can determine the end of this chunk to be at `0x05f0b032`.

Doing `0x05f0b032 - 0x05ef9b1e`, we get `0x11514`, that's almost our `15 15 01 00` once we swap endianess, and add `1`.

```
+====+====+====+====++====+====+====+====+====+====+====+====++====+====+====+====+
| OE | OE | OE | OE || ID | ID | ID | ID | ID | ID | ID | ID || 00 | 00 | 00 | 00 |
+====+====+====+====++====+====+====+====+====+====+====+====++====+====+====+====+
|<-- offset end --->||<------------- ID '.pkg' ------------->||<---- padding ---->|
|     32 bits       ||               64 bits                 ||      32 bits      |
```

So to recap, we have:

```
+====+====+====+====+====+====+====+====++=====+====+====+====+====+====+====+====+
| UO | UO | UO | UO | UO | UO | UO | UO ||  UT | UT | UT | UT | UT | UT | UT | UT |
+====+====+====+====+====+====+====+====++=====+====+====+====+====+====+====+====+
|<------------ unknown 1 -------------->||<-------------- unknown 2 ------------->|
|               64 bits                 ||                64 bits                 |
+====+====+====+====+====+====+====+====++====+====+====+====++====+====+====+====+
| OF | OF | OF | OF | OF | OF | OF | OF || T1 | T1 | T1 | T1 || T2 | T2 | T2 | T2 |
+====+====+====+====+====+====+====+====++====+====+====+====++====+====+====+====+
|<--------- start offset pkg ---------->||<---- type 1 ----->||<----- type 2 ---->|
|               64 bits                 ||     32 bits       ||      32 bits      |
+====+====+====+====++====+====+====+====+====+====+====+====++====+====+====+====+
| OE | OE | OE | OE || ID | ID | ID | ID | ID | ID | ID | ID || 00 | 00 | 00 | 00 |
+====+====+====+====++====+====+====+====+====+====+====+====++====+====+====+====+
|<-- offset end --->||<------------- ID '.pkg' ------------->||<---- padding ---->|
|     32 bits       ||               64 bits                 ||      32 bits      |
```

### The last bits

So, okay, we have the core of the 3 part of the file.

But we can see the last few bits don't follow this pattern (specially with the `.pkg` file name), which means we have a footer:

```
# Last block
00007116  21 67 ac 70 22 ec ca b8  70 11 03 07 0d 33 ed 77  |!g.p"...p....3.w|
00007126  28 f9 15 0a 00 00 00 00  05 00 00 00 01 00 00 00  |(...............|
00007136  0b 2d 00 00 03 bd b0 50  67 e9 00 00 00 00 00 00  |.-.....Pg.......|
# Footer
00007146  15 00 00 00 00 00 00 00  18 00 00 00 00 00 00 00  |................|
00007156  70 11 03 07 0d 33 ed 77  73 79 73 74 65 6d 5f 64  |p....3.wsystem_d|
00007166  61 74 61 5f 30 30 30 31  2e 70 6b 67 00           |ata_0001.pkg.|
```

If we look at the content, we have 3 * 64 bits before the name starts (`73 79 73 74 65 6d 5f 64` for `system_d` in)

Looking at it more closely, given all the `00`, it seems we have three 64 bits integers there.

* `15 00 00 00 00 00 00 00`
* `18 00 00 00 00 00 00 00`
* `70 11 03 07 0d 33 ed 77`

`70 11 03 07 0d 33 ed 77` is the "unknown 2" we saw previously, so still no luck, but lets name it the same way.


`18 00 00 00 00 00 00 00` seems to have the same value accross all files, so probably not that important.

The only one that varies accross files is the `15 00 00 00 00 00 00 00`, but always in the same kind of values around 0x15. in decimal it's 21.

Strangely, `system_data_0001.pkg` is 20 chars long, 21 if we include the `\0` at the end.

So we can deduce it's actually the `.pkg` file name string size.

So we have

```
+====+====+====+====+====+====+====+====++=====+====+====+====+====+====+====+====+
| UO | UO | UO | UO | UO | UO | UO | UO ||  U3 | U3 | U3 | U3 | U3 | U3 | U3 | U3 |
+====+====+====+====+====+====+====+====++=====+====+====+====+====+====+====+====+
|<--------- size pkg file name -------->||<-------------- unknown 3 ------------->|
|               64 bits                 ||                64 bits                 |
+=====+====+====+====+====+====+====+====+~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~...
|  UT | UT | UT | UT | UT | UT | UT | UT |             file name string
+=====+====+====+====+====+====+====+====+~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~...
|<-------------- unknown 2 ------------->|
|                64 bits                 |
```

---

Previous/Next
- Part 1 — Searching The Data → [/posts/wows_depack_part1/](/posts/wows_depack_part1/)
- Part 2 — Getting The Metadata → [/posts/wows_depack_part2/](/posts/wows_depack_part2/)
- Part 3 — Reading The Database → [/posts/wows_depack_part3/](/posts/wows_depack_part3/)
- Back to Series Index → [/posts/wows_depack_index/](/posts/wows_depack_index/)
