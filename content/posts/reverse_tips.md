+++
title = 'Reverse Engineering Tips'
date = 2024-06-29T22:01:30+02:00
draft = true
+++

## Data types

These are more rule of thumbs patterns and need to be used looking at the surronding data.

### Unsigned integers

32 bits integers generally look like: `02 2F 00 00`: higher bytes tend to be `00`, lower tend to be used.

Same thing applies to 64 bits integers.

They are typilcally used to describe the following elements:

* counts
* size
* offsets

Offsets tend to have values divided by 4 or 8 (32 or 64 bits blocks), they also tend to be 64 bits these days (`size_t`).

32 bits low value integers tend to be counts or string sizes.

### Float

32 bits Floats are generally have all 4 bytes used, with nearly no 4 bits zeros, for example: `b1 61 33 78`.

### RGBA

RGBA look like: `7f 7f fe 00` or `00 ff fe 00`. It's an array of 4 bytes `{R,G,B,A}` which tend to have recurring values, and often with 1 or 2 bytes in the extreme (`00` or `ff`).

example:

```
0000b9a0  7f 7f fe 00 82 4b f0 3e  11 f7 02 3f 98 11 9e bf  |.....K.>...?....|
0000ba00  7f 7f 00 00 67 cf c5 3e  10 f7 02 3f 98 11 9e bf  |....g..>...?....|
0000ba10  00 7f 7f 00 67 cf c5 3e  15 f7 02 3f 36 e0 8c bf  |....g..>...?6...|
```

here `7f 7f fe 00`, `7f 7f 00 00` and `00 7f 7f 00` are like RGBA values (the rest being floats).

### strings

Bunch of printables charactes, often `00` terminated.

```
00015280  7f fe 7f 00 43 4d 5f 50  41 5f 75 6e 69 74 65 64  |....CM_PA_united|
00015290  2e 61 72 6d 6f 72 00                              |.armor.|
```

## Format sections

### what to expect

While not systematic, in a file format, you will generally have:

* an header
* one or several data sections
* an optional footer

### Hexdump Usage

For a general fill, don't hesitate to quickly

It can also be used to compare the start of a file
```bashe
find ./ -name '*.geometry' | while read file;
do
    hexdump -C $file | head -n 6;
done
```
