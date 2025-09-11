+++
title = 'Reversing WoWs Resource Format - Part 4: Tidying-Up The Project'
date = 2025-08-27T00:04:00+02:00
draft = false
+++

- Part 1 — [Searching The Data](/posts/wows_depack_part1/)
- Part 2 — [Getting The Metadata](/posts/wows_depack_part2/)
- Part 3 — [Reading Everything](/posts/wows_depack_part3/)
- Part 4 — [Tidying-Up The Project](/posts/wows_depack_part4/)

# Tidying-Up The Project

In the last part we got a first rough implementation.

In this final part, we will clean up things, correct a few shortcuts we took, and create an actual project out of this.

## Creating Unit Tests

I did this project right around the release of ChatGPT 3.5. Initially I didn't plan to add unit tests. But after giving the struct definitions and the format documentation, ChatGPT was able to generate test cases which, while not completely functional, were close enough to start with. It seems evident now, but at the time I was kind of blown away by it.

In the end, you can probably thank our AI overlords for the unit tests of this project. And it was a lifesaver when I significantly reworked the data loading from `mmap` to a proper unpacking taking endianness into account.

Also, I've used the usual suspects of GitHub Actions + CUnit + lcov for CI and code coverage measurement.

## Fuzzing

C being the both-ways shotgun it is, you are most likely to get things wrong, especially in the unhappy paths.

In that regard, leveraging fuzzing & [AFL++](https://github.com/AFLplusplus/AFLplusplus) greatly helps in catching memory issues. It works by taking a collection of valid input files (here, the `.idx` files) and tweaking them to try triggering crashes.

Here is the gist of using it:

- Install AFL++ and build with AFL++ Instrumentation:
```shell
# Debian/Ubuntu
apt install afl-clang

cmake -DCMAKE_C_COMPILER=afl-clang -DCMAKE_CXX_COMPILER=afl-clang++ .
make
```

- Run with a collection of valid `.idx` files
```shell
INDEX_DIR="/path/to/WoWs/bin/6831266/idx/"
afl-fuzz -i "$INDEX_DIR" -o ./out -t 10000 -- ./wows-depack-cli -i '@@'
```

Crashes go to `out/crashes/` and can then be investigated using `gdb`, and potentially used as test/non-regression tests.


## API Documentation

Here, we simply call good old [Doxygen](https://doxygen.nl/) to the rescue.

The Doxygen annotations are easy to write these days using LLMs: if your naming scheme is decent enough, simply feeding the header definitions (structs and functions) will get you 90% of the way there. Add a few fixes, and you are in business.

Prettier docs are also slightly more likely to be read, so I'm using [this nice theme](https://github.com/jothepro/doxygen-awesome-css). Just point to it in `Doxyfile.in` (`HTML_EXTRA_STYLESHEET`).

And lastly, to keep it up to date, I simply combined GitHub Actions & GitHub Pages to maintain and publish it.


## Proper Unpacking

Initially, I did the unpacking using `mmap` + "casting" to structs. While it works, it's a bit dangerous as endianness can become an issue, as is data alignment in structs (forces `#pragma pack 1` which might not work on every architecture).

So I significantly reworked the project to properly read the file field by field, handling endianness along the way. It was a bit painful to do (having unit tests helped a lot in avoiding regressions there), but now the project is much cleaner on that front.

# Annex 1 - A Few Links

- **Game**: [WoWs](https://store.steampowered.com/app/552990/World_of_Warships/)
- **Closed Source Utility**: [wowsunpack.exe](https://raw.githubusercontent.com/wowsinfo/wowsunpack/refs/heads/master/src/wowsunpack/wowsunpack.exe)
- **My Project**: [wows-depack (GitHub)](https://github.com/kakwa/wows-depack)
- **Similar Project in Rust**: [wowsunpack (GitHub)](https://github.com/landaire/wowsunpack)

# Annex 2 - Misc Reverse Engineering Tips

## Data Type Identification

These are more rule-of-thumb patterns and need to be used while looking at the surrounding data.

### Unsigned integers

32-bit integers generally look like: `02 2F 00 00`: higher bytes tend to be `00`, lower bytes tend to be used.

The same thing applies to 64-bit integers.

They are typically used to describe the following elements:

- counts
- size
- offsets

Offsets tend to have values divided by 4 or 8 (32 or 64 bits blocks), they also tend to be 64 bits these days (`size_t`).

32-bit low-value integers tend to be counts or string sizes.

### Float

32-bit floats generally have all 4 bytes used, with nearly no zero nibbles, for example: `b1 61 33 78`.

These are difficult to distinguish from random ints at a glance; they need to be parsed and checked to see if the values are consistent (similar to other fields, within set boundaries, etc.).

### RGBA

RGBA look like: `7f 7f fe 00` or `00 ff fe 00`. It's an array of 4 bytes `{R,G,B,A}` which tend to have recurring values, and often with 1 or 2 bytes in the extreme (`00` or `ff`).

example:

```
0000b9a0  7f 7f fe 00 82 4b f0 3e  11 f7 02 3f 98 11 9e bf  |.....K.>...?....|
0000ba00  7f 7f 00 00 67 cf c5 3e  10 f7 02 3f 98 11 9e bf  |....g..>...?....|
0000ba10  00 7f 7f 00 67 cf c5 3e  15 f7 02 3f 36 e0 8c bf  |....g..>...?6...|
```

Here `7f 7f fe 00`, `7f 7f 00 00` and `00 7f 7f 00` are like RGBA values (the rest being floats).

### Strings

A bunch of printable characters, often `00`-terminated.

```
00015280  7f fe 7f 00 43 4d 5f 50  41 5f 75 6e 69 74 65 64  |....CM_PA_united|
00015290  2e 61 72 6d 6f 72 00                              |.armor.|
```

## Tools

### File

Just a very simple utility to check for known file signatures:

```bash
file *
```

### Strings

Tool to try extracting the strings contained in a given file:

```bash
strings -n <MIN_STR_LENGTH> <FILE>
```

There will be a bit of noise (increasing MIN_STR_LENGTH reduces it), but it should give you interesting human-readable strings contained in a given file.

### Hexdump
hexdump is my go-to tool for investigating binary data. I especially like the `hexdump -C FILE | less` combo:

```bash
hexdump -C <FILE> | less
```

If you are investigating a specific section of a file, you can start at a given offset with the `-s <SKIPPED_BYTES>` option; this will make things easier to read and navigate and help determine the data alignment:

```bash
hexdump -s <SKIPPED_BYTES> -C <FILE> | less
```


To get a general feel, don't hesitate to loop over files and display the first bits of a collection:
```bash
find ./ -name '*.geometry' | while read file;
do
    hexdump -C $file | head -n 6;
done
```

### ImHex

While I've not used it here, you should give a try to [ImHex](https://github.com/WerWolv/ImHex). I've used it in subsequent works, and it's an amazing tool that greatly helps in determining and validating the data structure of binary files.

# Annex 3 - File Specification

## General Information

The WoWs resources are packed into something similar to a `.zip` archive (WoTs and WoWPs actually use ZIP files).

Each archive is actually separated into two files:

- a `.pkg` containing the compressed files concatenated together. This file is in the `res_packages/` directory.
- a `.idx` containing the index of the files contained in the `.pkg` and their metadata (name, path, type, etc). This file is located in the `./bin/<build_number>/idx/` directory.

## Convention

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

## Misc

Integers (offset and size in particular) are `Big Endian`.

Strings seem limited to ASCII and are `\0` terminated.

## Index file

### General Layout

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

### Header

#### Layout
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

#### Field descriptions

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

### File Metadata

This section is repeated for each file and directory (`header->file_dir_count`).

#### Layout
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

#### Field descriptions

| Field                  | Size    | Description                                                                               |
|------------------------|---------|-------------------------------------------------------------------------------------------|
| `file_name_size`       | 64 bits | Size of the file name string                                                              |
| `offset_idx_file_name` | 64 bits | Offset from the start of the current metadata record to the start of the file name string |
| `id`                   | 64 bits | Unique ID of the metadata record                                                          |
| `parent_id`            | 64 bits | ID of the potential parent record (in particular, a directory record)                     |

### File names section

This section is just `\0` separated list of strings:

#### Layout
```
+~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~+====+
|             file name string         | 00 |
+~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~+====+
[...repeat...]
```

### File ".pkg" Pointers

This section  is repeated for each file (`header->file_count`).

#### Layout
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

#### Field Descriptions

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

### Footer

#### Layout
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

#### Field descriptions

| Field                | Size    | Description                                       |
|----------------------|---------|---------------------------------------------------|
| `pkg_file_name_size` | 64 bits | Size of the corresponding `.pkg` file name string |
| `unknown_7`          | 64 bits | unknown, looks like an ID                         |
| `id`                 | 64 bits | ID of the footer entry                            |

## PKG format

### PKG Entry

The `.pkg` format is rather simple, it's bunch of concatenated compressed (RFC 1951/Deflate) or raw/uncompressed data blobs (one for each file) separated by an ID.

#### Layout
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

#### Field descriptions

| Field         | Size    | Description         |
|---------------|---------|---------------------|
| `padding_1`   | 32 bits | Always `0x00000000` |
| `id_pkg_data` | 64 bits | ID of the data blob |
| `padding_2`   | 32 bits | Always `0x00000000` |
