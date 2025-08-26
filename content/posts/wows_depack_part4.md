+++
title = 'Reversing WoWs Resource Format - Part 4: Putting It All Together'
date = 2024-06-29T22:50:48+02:00
draft = true
+++

> Series navigation
> - All parts: [/posts/wows_depack_index/](/posts/wows_depack_index/)
> - Previous: Part 3 — Reading The Database → [/posts/wows_depack_part3/](/posts/wows_depack_part3/)

# Putting It All Together

In this final part, we wire the parser to extraction logic, reconstruct full paths, and write files to disk. We also ensure safety (bounds checks), and add a simple CLI.

## Safety pass and endianess

- Add bounds checks on every offset and size before dereferencing.
- Validate section counts against file size and computed section boundaries.
- Normalize endianness where applicable.

## Build a filesystem view

- Use `id`/`parent_id` relationships from metadata to build a tree of directories and files.
- Reconstruct full paths from leaf nodes by walking `parent_id` up to the root.

## Hook `.pkg` extraction

- For each file entry, use `(offset_pkg_data, size_pkg_data, id_pkg_data)` to locate and extract the matching compressed blob from the referenced `.pkg`.
- Decompress DEFLATE blocks and write the resulting file to the reconstructed path.
- Respect `(type_1, type_2)` for compression handling when relevant.

## Minimal CLI

Examples:

```bash
# Extract one file
wows-depack-cli -W ~/Games/World\ of\ Warships/ \
  -e 'content/GameParams.data' -o GameParams.data

# Extract a whole subtree
wows-depack-cli -W ~/Games/World\ of\ Warships/ \
  -e 'content/' -O out/

# Parse a specific index directory (fast when you know the target)
wows-depack-cli -I ~/Games/World\ of\ Warships/bin/<build>/idx/ -p
```

## WoWs .pkg & .idx Format

### Introduction

The WoWs resources are packed into something similar to a `.zip` archive (WoTs and WoWPs actually use zip files).

Each archive is actually separated in two files:

- a `.pkg` containing the compressed files concatenated together. This file is in the `res_package/` directory.
- a `.idx` containing the index of the files contained in the `.pkg` and their metadata (name, path, type, etc). This file is located in the `./bin/<build_number>/idx/` directory.

### Disclaimer

This documentation has been created through reverse engineering, consequently errors and inaccuracies are not unlikely.

### Convention

A byte/8 bits is represented as follows:
``` 
+====+
| XX |
+====+
```

A variable length field (ex: strings) is represented as follows:

```
|~~~~~~~~~~~~~~~~~~~~~~~~~~~~|
|           Field            |
|~~~~~~~~~~~~~~~~~~~~~~~~~~~~|
```

The boundary between two fields is marked as follows:

```
...=++=...
    ||
...=++=...
```

### Misc

Integers (offset and size in particular) are `Big Endian`.

Strings seems limited to ASCII and are `\0` terminated.

### Index file

#### General format

The index file is composed of 5 sections:

```
|~~~~~~~~~~~~~~~~~~~~~~~~~~~~| ^
|           Header           | } index header (number of files, pointers to sections, etc)
|~~~~~~~~~~~~~~~~~~~~~~~~~~~~| v

|~~~~~~~~~~~~~~~~~~~~~~~~~~~~| ^
|       File metadata 1      | |
|----------------------------| |
|           [...]            | } metadata section (pointer to name, type, etc)
|----------------------------| |
|      File metadata Nfd     | |
|~~~~~~~~~~~~~~~~~~~~~~~~~~~~| v

|~~~~~~~~~~~~~~~~~~~~~~~~~~~~| ^
|        File Name 1         | |
|----------------------------| |
|           [...]            | } file names (`\0` separated strings)
|----------------------------| |
|        File Name Nfd       | |
|~~~~~~~~~~~~~~~~~~~~~~~~~~~~| v

|~~~~~~~~~~~~~~~~~~~~~~~~~~~~| ^
|   File `.pkg` pointers 1   | |
|----------------------------| |
|           [...]            | }  pkg pointers section in the `.pkg` file (offsets)
|----------------------------| |
|   File `.pkg` pointers Nf  | |
|~~~~~~~~~~~~~~~~~~~~~~~~~~~~| v

|~~~~~~~~~~~~~~~~~~~~~~~~~~~~| ^
|           Footer           | } index footer (corresponding `.pkg` file name)
|~~~~~~~~~~~~~~~~~~~~~~~~~~~~| V
```

#### Header

##### Layout
```
+====+====+====+====++====+====+====+====++====+====+====+====++====+====+====+====+
| MA | MA | MA | MA || 00 | 00 | 00 | 02 || ID | ID | ID | ID || 40 | 00 | 00 | 00 |
+====+====+====+====++====+====+====+====++====+====+====+====++====+====+====+====+
|<----- magic ----->||<--- endianess --->||<------- id ------>||<--- unknown_2 --->|
|     32 bits       ||      32 bits      ||     32 bits       ||      32 bits      |

+====+====+====+====++====+====+====+====++====+====+====+====++====+====+====+====+
| FD | FD | FD | FD || FO | FO | FO | FO || 01 | 00 | 00 | 00 || 00 | 00 | 00 | 00 |
+====+====+====+====++====+====+====+====++====+====+====+====++====+====+====+====+
|<- file_dir_count >||<-- file_count --->||<-------------- unknown_3 ------------->|
|     32 bits       ||      32 bits      ||                64 bits                 |

+====+====+====+====+====+====+====+=====++=====+====+====+====+====+====+====+====+
| HS | HS | HS | HS | HS | HS | HS | HS  ||  OF | OF | OF | OF | OF | OF | OF | OF |
+====+====+====+====+====+====+====+=====++=====+====+====+====+====+====+====+====+
|<------------- header_size ------------>||<------- offset_idx_data_section ------>|
|                64 bits                 ||             64 bits                    |

+====+====+====+====+====+====+====+=====+
| OE | OE | OE | OE | OE | OE | OE | OE  |
+====+====+====+====+====+====+====+=====+
|<----- offset_idx_footer_section ------>|
|               64 bits                  |
```

##### Field descriptions

| Field                      |  size   | Description                                                                                                                                    |
|----------------------------|---------|-------------------------------------------------------------------------------------------------------------------------------------------------|
| `magic`                    | 32 bits | Magic bytes, always "ISFP"                                                                                                                     |
| `endianess`                | 32 bits | Endianess marker, always 0x2000000 if LE                                                                                                       |
| `id`                       | 32 bits | Unsure, unique per index file, not referenced anywhere else                                                                                    |
| `unknown_2`                | 32 bits | Unknown, always 0x40, maybe some offset                                                                                                        |
| `file_dir_count`           | 32 bits | Number of files + directories (Nfd), also number of entries in the metadata section and the file names section                                 |
| `file_count`               | 32 bits | Number of files (Nf), also the number of entries in the file pkg pointers section                                                              |
| `unknown_3`                | 64 bits | Unknown, always '1', maybe the number of `.pkg` file the index file references (the format hints that it might be supported, but it's not used) |
| `header_size`              | 64 bits | Most likely the header size, always 40                                                                                                         |
| `offset_idx_data_section`  | 64 bits | Offset to the pkg data section, the offset is computed from `file_plus_dir_count` so `0x10` needs to be added                                  |
| `offset_idx_footer_section`| 64 bits | Offset to the footer section, the offset is computed from `file_plus_dir_count` so  `0x10` needs to be added                                   |

#### File metadata

This section is repeated for each file and directory (`header->file_dir_count`).

##### Layout
```
+====+====+====+====+====+====+====+=====++=====+====+====+====+====+====+====+====+
| NS | NS | NS | NS | NS | NS | NS | NS  ||  OF | OF | OF | OF | OF | OF | OF | OF |
+====+====+====+====+====+====+====+=====++=====+====+====+====+====+====+====+====+
|<---------- file_name_size ------------>||<-------- offset_idx_file_name -------->|
|               64 bits                  ||              64 bits                   |

+====+====+====+====+====+====+====+=====++=====+====+====+====+====+====+====+====+
| UN | UN | UN | UN | UN | UN | UN | UN  ||  T2 | T2 | T2 | T2 | T2 | T2 | T2 | T2 |
+====+====+====+====+====+====+====+=====++=====+====+====+====+====+====+====+====+
|<----------------- id ----------------->||<------------- parent_id  ------------->|
|                64 bits                 ||                64 bits                 |

[...repeat...]
```

#### File ".pkg" pointers

This section  is repeated for each file (`header->file_count`).

##### Layout
```
+====+====+====+====+====+====+====+====++=====+====+====+====+====+====+====+====+
| UO | UO | UO | UO | UO | UO | UO | UO ||  UT | UT | UT | UT | UT | UT | UT | UT |
+====+====+====+====+====+====+====+====++=====+====+====+====+====+====+====+====+
|<----------- metadata_id ------------->||<------------- footer_id -------------->|
|               64 bits                 ||                64 bits                 |

+====+====+====+====+====+====+====+====++====+====+====+====++====+====+====+====+
| OF | OF | OF | OF | OF | OF | OF | OF || T1 | T1 | T1 | T1 || T2 | T2 | T2 | T2 |
+====+====+====+====+====+====+====+====++====+====+====+====++====+====+====+====+
|<--------- offset_pkg_data ----------->||<---- type_1 ----->||<----- type_2 ---->|
|               64 bits                 ||     32 bits       ||      32 bits      |

+====+====+====+====++====+====+====+====+====+====+====+====++====+====+====+====+
| OE | OE | OE | OE || ID | ID | ID | ID | ID | ID | ID | ID || 00 | 00 | 00 | 00 |
+====+====+====+====++====+====+====+====+====+====+====+====++====+====+====+====+
|<- size_pkg_data ->||<------------ id_pkg_data ------------>||<---- padding ---->|
|     32 bits       ||               64 bits                 ||      32 bits      |
[...repeat...]
```

##### Field descriptions

| Field             | Size    | Description                                                     |
|-------------------|---------|-----------------------------------------------------------------|
| `metadata_id`     | 64 bits | ID of the corresponding metadata entry                          |
| `footer_id`       | 64 bits | ID of the footer entry (only one entry possible in practice)    |
| `offset_pkg_data` | 64 bits | Offset to the compressed data from the start of the `.pkg` file |
| `type_1`          | 32 bits | Compression param 1 (`0x0` for uncompressed, `0x5` for deflate) |
| `type_2`          | 32 bits | Compression param 2 (`0x0` for uncompressed, `0x1` for deflate) |
| `size_pkg_data`   | 32 bits | Size of the compressed data section in the `.pkg` file          |
| `id_pkg_data`     | 64 bits | ID of the data section in the `.pkg` file                       |
| `padding`         | 32 bits | Always `0x00000000`                                             |

#### Footer

##### Layout
```
+====+====+====+====+====+====+====+====++=====+====+====+====+====+====+====+====+
| UO | UO | UO | UO | UO | UO | UO | UO ||  U3 | U3 | U3 | U3 | U3 | U3 | U3 | U3 |
+====+====+====+====+====+====+====+====++=====+====+====+====+====+====+====+====+
|<--------- pkg_file_name_size -------->||<-------------- unknown_7 ------------->|
|               64 bits                 ||                64 bits                 |

+====+====+====+====+====+====+====+====++~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~...
| UT | UT | UT | UT | UT | UT | UT | UT ||             pkg_file_name_string
+====+====+====+====+====+====+====+====++~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~...
|<----------------- id ----------------->|
|                64 bits                 |
```

##### Field descriptions

| Field                | Size    | Description                                       |
|----------------------|---------|---------------------------------------------------|
| `pkg_file_name_size` | 64 bits | Size of the corresponding `.pkg` file name string |
| `unknown_7`          | 64 bits | unknown, looks like an ID                         |
| `id`                 | 64 bits | ID of the footer entry                            |

### PKG format

#### PKG Entry

The `.pkg` format is rather simple, it's bunch of concatenated compressed (RFC 1951/Deflate) or raw/uncompressed data blobs (one for each file) separated by an ID.

##### Layout
```
+~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~+
|                                                                                 |
|                   Compressed (RFC 1951/Deflate) or Raw Data                     |
|                                                                                 |
+~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~+
+====+====+====+====++====+====+====+====+====+====+====+====++====+====+====+====+
| 00 | 00 | 00 | 00 || XX | XX | XX | XX | XX | XX | 00 | 00 || 00 | 00 | 00 | 00 |
+====+====+====+====++====+====+====+====+====+====+====+====++====+====+====+====+
|<--- padding_1 --->||<---------------- id ----------------->||<--- padding_2 --->|
|     32 bits       ||               64 bits                 ||      32 bits      |

[...repeat...]
```

##### Field descriptions

| Field       | Size    | Description         |
|-------------|---------|---------------------|
| `padding_1` | 32 bits | Always `0x00000000` |
| `id_pkg_data` | 64 bits | ID of the data blob |
| `padding_2` | 32 bits | Always `0x00000000` |

## Reverse engineering tips

### Data types

These are more rule of thumbs patterns and need to be used looking at the surronding data.

#### Unsigned integers

32 bits integers generally look like: `02 2F 00 00`: higher bytes tend to be `00`, lower tend to be used.

Same thing applies to 64 bits integers.

They are typilcally used to describe the following elements:

- counts
- size
- offsets

Offsets tend to have values divided by 4 or 8 (32 or 64 bits blocks), they also tend to be 64 bits these days (`size_t`).

32 bits low value integers tend to be counts or string sizes.

#### Float

32 bits Floats are generally have all 4 bytes used, with nearly no 4 bits zeros, for example: `b1 61 33 78`.

#### RGBA

RGBA look like: `7f 7f fe 00` or `00 ff fe 00`. It's an array of 4 bytes `{R,G,B,A}` which tend to have recurring values, and often with 1 or 2 bytes in the extreme (`00` or `ff`).

example:

```
0000b9a0  7f 7f fe 00 82 4b f0 3e  11 f7 02 3f 98 11 9e bf  |.....K.>...?....|
0000ba00  7f 7f 00 00 67 cf c5 3e  10 f7 02 3f 98 11 9e bf  |....g..>...?....|
0000ba10  00 7f 7f 00 67 cf c5 3e  15 f7 02 3f 36 e0 8c bf  |....g..>...?6...|
```

here `7f 7f fe 00`, `7f 7f 00 00` and `00 7f 7f 00` are like RGBA values (the rest being floats).

#### strings

Bunch of printables charactes, often `00` terminated.

```
00015280  7f fe 7f 00 43 4d 5f 50  41 5f 75 6e 69 74 65 64  |....CM_PA_united|
00015290  2e 61 72 6d 6f 72 00                              |.armor.|
```

### Format sections

#### what to expect

While not systematic, in a file format, you will generally have:

- an header
- one or several data sections
- an optional footer

#### Hexdump Usage

For a general fill, don't hesitate to quickly

It can also be used to compare the start of a file
```bashe
find ./ -name '*.geometry' | while read file;
do
    hexdump -C $file | head -n 6;
done
```

##### Field descriptions

| Field                  | Size    | Description                                                                               |
|------------------------|---------|-------------------------------------------------------------------------------------------|
| `file_name_size`       | 64 bits | Size of the file name string                                                              |
| `offset_idx_file_name` | 64 bits | Offset from the start of the current metadata record to the start of the file name string |
| `id`                   | 64 bits | Unique ID of the metadata record                                                          |
| `parent_id`            | 64 bits | ID of the potential parent record (in particular, a directory record)                     |

#### File names section

This section is just `\0` separated list of strings:

##### Layout
```
+~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~+====+
|             file name string         | 00 |
+~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~+====+
[...repeat...]
```

## Recap (Part 4)

- Finalized safe parsing and path reconstruction.
- Implemented `.pkg` blob location and decompression.
- Added a small CLI for extraction and inspection.

----

Parts:
- Part 1 — Searching The Data → [/posts/wows_depack_part1/](/posts/wows_depack_part1/)
- Part 2 — Getting The Metadata → [/posts/wows_depack_part2/](/posts/wows_depack_part2/)
- Part 3 — Reading The Database → [/posts/wows_depack_part3/](/posts/wows_depack_part3/)
- Part 4 — Putting It All Together → [/posts/wows_depack_part4/](/posts/wows_depack_part4/)
- Back to Series Index → [/posts/wows_depack_index/](/posts/wows_depack_index/)
