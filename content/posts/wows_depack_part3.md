+++
title = 'Reversing WoWs Resource Format - Part 3: Reading The Database'
date = 2024-06-29T22:50:48+02:00
draft = true
+++


# Parts

- Part 1 — Searching The Data → [/posts/wows_depack_part1/](/posts/wows_depack_part1/)
- Part 2 — Getting The Metadata → [/posts/wows_depack_part2/](/posts/wows_depack_part2/)
- Part 3 — Reading The Database → [/posts/wows_depack_part3/](/posts/wows_depack_part3/)
- Part 4 — Putting It All Together → [/posts/wows_depack_part4/](/posts/wows_depack_part4/)

# The Implementation

In the last part, we discovered and got a fairly good idea of the metadata/idx format.

In this part, we will create a rough implementation to extract the content.

## Data Structures

First, define C structures matching our reverse-engineered format:

```
// INDEX file header
typedef struct {
    char magic[4];
    uint32_t unknown_1;
    uint32_t id;
    uint32_t unknown_2;
    uint32_t file_plus_dir_count;
    uint32_t file_count;
    uint64_t unknown_3;
    uint64_t header_size;
    uint64_t offset_idx_data_section;
    uint64_t offset_idx_footer_section;
} WOWS_INDEX_HEADER;
```

## Parser Implementation

**Note:** These examples omit error handling for clarity. Production code requires bounds checking and validation.

### File Mapping

Memory map the index file:

```C
// Open the index file
int fd = open(args.input, O_RDONLY);

// Recover the file size
struct stat s;
fstat(fd, &s);
size_t index_size = s.st_size;

// Map the whole content in memory
char *index_content = mmap(0, index_size, PROT_READ, MAP_PRIVATE, fd, 0);
```
The second is to have an entry point to actually parse the thing:

```C
    WOWS_CONTEXT context;
    context.debug = true;

    // Start the parsing
    return wows_parse_index(index_content, index_size, &context);
```

Here, I pass the memory mapped content of the index, its size (will be used in the futur to avoid overflows) and a `context` which will be used to pass parsing options and maintain "states" in the parsing if necessary.

### Parsing the Header Section


```C
int wows_parse_index(char *contents, size_t length, WOWS_CONTEXT *context) {
  // header section
  WOWS_INDEX_HEADER *header = (WOWS_INDEX_HEADER *)contents;
```

We can print it with a few `printf`:

```C
int print_header(WOWS_INDEX_HEADER *header) {
    printf("Index Header Content:\n");
    printf("* magic:                     %.4s\n", (char *)&header->magic);
    printf("* unknown_1:                 0x%x\n", header->unknown_1);
    [...]
    return 0;
}
```

Output
```
Index Header Content:
* magic:                     ISFP
* unknown_1:                 0x2000000
* id:                        0xb4399d91
* unknown_2:                 0x40
* file_plus_dir_count:       311
* file_count:                284
* unknown_3:                 1
* header_size:               40
* offset_idx_data_section:   0x3bf6
* offset_idx_footer_section: 0x7136
```

#### Metadata entries

Then, we can do a bunch of pointer arythmetic operation to extract the other sections of the index file:

```C
  // Recover the start of the metadata array
  WOWS_INDEX_METADATA_ENTRY *metadatas;
  metadatas =
      (WOWS_INDEX_METADATA_ENTRY *)(contents + sizeof(WOWS_INDEX_HEADER));
```

Then, we do something with these sections, like for example:

```C
    // Parse & print each entry in the metadata section
    for (i = 0; i < header->file_plus_dir_count; i++) {
        if (context->debug) {
            print_metadata_entry(&metadatas[i], i);
        }
    }
```

With `print_metadata_entry` looking like that:

```C
int print_metadata_entry(WOWS_INDEX_METADATA_ENTRY *entry, int index) {
    printf("Metadata entry %d:\n", index);
    printf("* file_type:                 %lu\n", entry->file_type_1);
    printf("* offset_idx_file_name:      0x%lx\n", entry->offset_idx_file_name);
    printf("* unknown_4:                 0x%lx\n", entry->unknown_4);
    printf("* file_type_2:               0x%lx\n", entry->file_type_2);
    return 0;
}
```

#### Re-Evaluating some of the fields meaning:

Once done, it gives us more confortable read:

```
[...]
Metadata entry 0:
* file_type:                 14
* offset_idx_file_name:      0x26e0
* unknown_4:                 0x93b6404fba9a0c8f
* file_type_2:               0xdbb1a1d1b108b927

Metadata entry 1:
* file_type:                 19
* offset_idx_file_name:      0x26ce
* unknown_4:                 0xc7f7d0284a87ec8f
* file_type_2:               0x74d821503e1beba4

Metadata entry 2:
* file_type:                 18
* offset_idx_file_name:      0x26c1
* unknown_4:                 0x6b4f2cace7a270ad
* file_type_2:               0xdbb1a1d1b108b927

Metadata entry 3:
[...]

Metadata entry 310:
* file_type:                 19
* offset_idx_file_name:      0x14fb
* unknown_4:                 0xce7afff48d1bd174
* file_type_2:               0x74d821503e1beba4
```

This permits to review our previous reverse and right away there are two interesting things to note:

* There was a bit of an unknown regarding the number of metadata chunck: was it `file_count` or `file_plus_dir_count`? Now we are more certain it's `file_plus_dir_count` as its the larger value. If it was not, we would try parse a section past the metadatas as metadata with funky results (garbage or crash). This is not the case.
* `file_type` in metadata is not a file type/enum. The value are small, but quite varied, it's more likely the length of the file name.

Lets check with the last entry:

```
Metadata entry 310:
* file_type:                 19
[...]
```

`hexdump -C system_data.idx| less`
[...]
00003be0  61 72 69 61 74 69 6f 6e  5f 64 75 6d 6d 79 2e 64  |ariation_dummy.d|
00003bf0  64 73 00 77 61 76 65 73  5f 68 65 69 67 68 74 73  |ds.waves_heights|
00003c00  30 2e 64 64 73 00 8f 0c  9a ba 4f 40 b6 93 70 11  |0.dds.....O@..p.|
00003c10  03 07 0d 33 ed 77 00 00  00 00 00 00 00 00 05 00  |...3.w..........|
```

The last file name is `waves_heights0.dds`, 18 characters long, with the `\0`, we have our 19 value.

So lets rename this field.

Now that we have fixed that, we can recover the file names of each entry:

```C
char *filename = (char *)entry;
filename += entry->offset_idx_file_name;

printf("* filename: %.*s\n", (int)entry->file_name_size, filename);
```

Nice:
```
Metadata entry 0:
* file_name_size:            14
* offset_idx_file_name:      0x26e0
* unknown_4:                 0x93b6404fba9a0c8f
* file_type_2:               0xdbb1a1d1b108b927
* filename:                  KDStorage.bin

Metadata entry 1:
* file_name_size:            19
* offset_idx_file_name:      0x26ce
* unknown_4:                 0xc7f7d0284a87ec8f
* file_type_2:               0x74d821503e1beba4
* filename:                  waves_heights1.dds
```

We have file names and directory names, for example:

```
[...]
Metadata entry 10:
* file_name_size:            11
* offset_idx_file_name:      0x2654
* unknown_4:                 0x46c008ccf65395e0
* file_type_2:               0x46e29969bd85cf06
* filename:                  space_defs

Metadata entry 11:
* file_name_size:            13
* offset_idx_file_name:      0x263f
* unknown_4:                 0x7213702d5e6899e0
* file_type_2:               0x13d93873302ed14c
* filename:                  aid_null.dds

Metadata entry 12:
* file_name_size:            16
* offset_idx_file_name:      0x262c
* unknown_4:                 0xa1a829d8713f89e0
* file_type_2:               0xdbb1a1d1b108b927
* filename:                  camouflages.xml
[...]
```

There is something which should enable us to differenciate between the twos, maybe one of the unknown field.

Also, we still need to figure out how the directory system works:

* How directories & sub directories are composed (to get `<dir>/<sub dir>/<sub sub dir>/` paths)
* How the path goes back to the root (`/`)

We will not look at it here, but that's something to keep in mind.

#### Footer Parsing

Extracting footer information:

```C
WOWS_INDEX_FOOTER *footer = (WOWS_INDEX_FOOTER *)(contents + header->offset_idx_footer_section);
print_footer(footer);
```

The results were incorrect due to offset miscalculation.

```
Index Footer Content:
* size_pkg_file_name:        50b0bd0300002d0b
* unknown_7:                 0xe967
* unknown_6:                 0x15
```

A file name size of `50b0bd0300002d0b` ? I don't think so.

So let's look at it more closely.

In the header, we have:

```
Index Header Content:
[...]
* offset_idx_footer_section: 0x7136
[...]
```
The hexdump gives:

```shell
kakwa@linux 6775398/idx » hexdump -s 6 -C system_data.idx| less
[...]
00007116  21 67 ac 70 22 ec ca b8  70 11 03 07 0d 33 ed 77  |!g.p"...p....3.w|
00007126  28 f9 15 0a 00 00 00 00  05 00 00 00 01 00 00 00  |(...............|
00007136  0b 2d 00 00 03 bd b0 50  67 e9 00 00 00 00 00 00  |.-.....Pg.......|

00007146  15 00 00 00 00 00 00 00  18 00 00 00 00 00 00 00  |................|
00007156  70 11 03 07 0d 33 ed 77  73 79 73 74 65 6d 5f 64  |p....3.wsystem_d|
00007166  61 74 61 5f 30 30 30 31  2e 70 6b 67 00           |ata_0001.pkg.|
```

If our previous interpretation was correct, a simple offset from the start of the index file should be `0x7146`, not `0x7136`.

Maybe we are missing some fields in the footer, but given the previous 128 bits at offset `0x7136` really look like the end of a pkg metadata entry, I doubt it.

A more plausible explaination is that the offset is relative to the header `id` field at `0x10`.
Maybe the `magic` + `unknown_1 bits`, i.e. the first 128 bits are considered to be a separate section.

Anyway, lets just offset by 128 bits.

```C
#define MAGIC_SECTION_OFFSET sizeof(uint32_t) * 4

// Get the footer section
WOWS_INDEX_FOOTER *footer = (WOWS_INDEX_FOOTER *)(contents + header->offset_idx_footer_section + MAGIC_SECTION_OFFSET);
```

That's better:
```
Index Footer Content:
* size_pkg_file_name:        23
* unknown_7:                 0x18
* unknown_6:                 0xb5a4fa9349d9fd0d
```

We can also recover the pkg file name as follows:

```C
char *pkg_filename = (char *)footer;
pkg_filename += sizeof(WOWS_INDEX_FOOTER);
printf("* pkg filename:              %.*s\n",
       (int)footer->size_pkg_file_name, pkg_filename);
```

#### Safety Considerations

The current implementation lacks bounds checking and trusts all offsets—this needs fixing in production code.

#### PKG Data Entries

Similar process for the data section:

And lets add the 128 bits from the start (hexdump gives us `0x3c06`, which is again a `0x10` difference with `0x3bf6`).

```C
    // Get pkg data pointer section
    WOWS_INDEX_DATA_FILE_ENTRY *data_file_entry =
        (WOWS_INDEX_DATA_FILE_ENTRY *)(contents +
                                       header->offset_idx_data_section +
                                       MAGIC_SECTION_OFFSET);
```

From there, we are not sure if we have `header->file_plus_dir_count` or `header->file_count` entries. The latter seems more likely as this section points to the pkg files, but that's not a given.

Also, we are unsure how one entry there is paired with a metadata entry. Maybe the order is simply the same in this array, maybe the matching is done through one of the unknown field.

But first, lets dump the content with some `printf`:

```
Data file entry [0]:
* unknown_5:                 0x93b6404fba9a0c8f
* unknown_6:                 0x77ed330d07031170
* offset_pkg_data_chunk:     0x0
* type_1:                    0x5
* type_2:                    0x1
* size_pkg_data_chunk:       0x21f5
* id_pkg_data_chunk:         0x366c
* padding:                   0x4a87ec8f

Data file entry [1]:
* unknown_5:                 0x77ed330d07031170
* unknown_6:                 0x5ef9b1e
* offset_pkg_data_chunk:     0x100000005
* type_1:                    0x11515
* type_2:                    0x97637703
* size_pkg_data_chunk:       0x2ab3e
* id_pkg_data_chunk:         0x6b4f2cace7a270ad
* padding:                   0x7031170
[...]
```

Humm, that doesn't look righ... Why is the padding not the expected `0x0`? Also why the first entry looks mostly ok, except the padding, and the rest is garbage.

First, I double-check the `WOWS_INDEX_DATA_FILE_ENTRY` field sizes, and it was ok.

Then, I remembered that compilers can add padding to have all the fields properly aligned in memory, this helps with performances.

To avoid that, we need to add:

```C
#pragma pack(1)
```

Now the output looks like that:

```
* unknown_5:                 0x93b6404fba9a0c8f
* unknown_6:                 0x77ed330d07031170
* offset_pkg_data_chunk:     0x0
* type_1:                    0x5
* type_2:                    0x1
* size_pkg_data_chunk:       0x21f5
* id_pkg_data_chunk:         0x366c5c4500bf
* padding:                   0x0

Data file entry [1]:
* unknown_5:                 0xc7f7d0284a87ec8f
* unknown_6:                 0x77ed330d07031170
* offset_pkg_data_chunk:     0x5ef9b1e
* type_1:                    0x5
* type_2:                    0x1
* size_pkg_data_chunk:       0x11515
* id_pkg_data_chunk:         0x2ab3e97637703
* padding:                   0x0

Data file entry [2]:
* unknown_5:                 0x6b4f2cace7a270ad
* unknown_6:                 0x77ed330d07031170
* offset_pkg_data_chunk:     0x2205
* type_1:                    0x5
* type_2:                    0x1
* size_pkg_data_chunk:       0x1cb
* id_pkg_data_chunk:         0xcadc1deb96d
* padding:                   0x0
```

That's much better.

But this small issue raises a number of issues with my method of parsing. Casting to structs comes with numerous issues, from overflows to endianess.

This is not that critical here since we are just trying to have a rough prototype, but on a more critical software, that's not a good idea.

After this prototype, it might be a good idea to start learning Rust ^^.

Also, if we try to parse `header->file_plus_dir_count` entries, we get the following:

```
Data file entry [283]:
* unknown_5:                 0xb8caec2270ac6721
* unknown_6:                 0x77ed330d07031170
* offset_pkg_data_chunk:     0xa15f928
* type_1:                    0x5
* type_2:                    0x1
* size_pkg_data_chunk:       0x2d0b
* id_pkg_data_chunk:         0xe96750b0bd03
* padding:                   0x0

Data file entry [284]:
* unknown_5:                 0x15
* unknown_6:                 0x18
* offset_pkg_data_chunk:     0x77ed330d07031170
* type_1:                    0x74737973
* type_2:                    0x645f6d65
* size_pkg_data_chunk:       0x5f617461
* id_pkg_data_chunk:         0x676b702e31303030
* padding:                   0x0

Data file entry [285]:
* unknown_5:                 0x0
* unknown_6:                 0x0
* offset_pkg_data_chunk:     0x0
* type_1:                    0x0
* type_2:                    0x0
* size_pkg_data_chunk:       0x0
* id_pkg_data_chunk:         0x0
* padding:                   0x0
```

The entry `283` is ok. This is 284th entry since we start at `0`, which is exactly `header->file_count`. The next one has weird values and the rest just `0`.

So `header->file_count` is indeed the number of entries in this section.

#### Entry Matching

The fact that from one side we have `header->file_count` and `header->file_plus_dir_count` on the other means it's not a simple index matching.

Lets investigate the unknown fields:

```
[...]
Data file entry [279]:
* unknown_5:                 0xce7afff48d1bd174
* unknown_6:                 0x77ed330d07031170
[...]

Data file entry [280]:
* unknown_5:                 0x199e99feb0c986f8
* unknown_6:                 0x77ed330d07031170
[...]
```

`unknown_6` is always the same, not really interesting.

`unknown_5` on the contrary is specific to each entry:

```shell
kakwa@linux GitHub/wows-depack (main) » ./wows-depack-cli -i ~/Games/World\ of\ Warships/bin/6775398/idx/system_data.idx | grep 'unknown_5' | sort | uniq -c
[...]
      1 * unknown_5:                 0x14b002d7c2835863
      1 * unknown_5:                 0x15a7b41a61f65f9c
      1 * unknown_5:                 0x15fcab5401f27f56
      1 * unknown_5:                 0x18a0d0dc4b05f8fa
      1 * unknown_5:                 0x192a05120f00553e
[...]
```

The values however are present two times, one in the Metadata entry, the other in the data file entry:

```
Metadata entry [72]:
[...]
* unknown_4:                 0x1011b17d9304bb39
[...]
```

```
Data file entry [65]:
[...]
* unknown_5:                 0x1011b17d9304bb39
[...]
```

So the link is established through these fields. These are simply random, unique ID for each entry.

In fact `unknown_4` and `unknown_5` are not the only fields leveraging this.

Looking at `file_type_2` values, we get something like that:


```shell
kakwa@linux GitHub/wows-depack (main *) » ./wows-depack-cli -i ~/Games/World\ of\ Warships/bin/6775398/idx/system_data.idx | grep '0x937f155e4baaf562\|filename:' | grep -A 1 '0x937f155e4baaf562'

[...]
--
* file_type_2:               0x937f155e4baaf562
* filename:                  LowerAftTrans.dds
--
* file_type_2:               0x937f155e4baaf562
* filename:                  MidBarbette.dds
--
* file_type_2:               0x937f155e4baaf562
* filename:                  Bulkhead.dds
--
* file_type_2:               0x937f155e4baaf562
* filename:                  MidBelt.dds
--
[...]
--
* unknown_4:                 0x937f155e4baaf562
* filename:                  armour
--
[...]
--
* file_type_2:               0x937f155e4baaf562
* filename:                  Bottom.dds
--
* file_type_2:               0x937f155e4baaf562
* filename:                  ConstrBig.dds
--
* file_type_2:               0x937f155e4baaf562
* filename:                  ConstrMid.dds
--
* file_type_2:               0x937f155e4baaf562
* filename:                  ConstrSm.dds
--
* file_type_2:               0x937f155e4baaf562
* filename:                  DoubleBottom.dds
--
[...]
```

Ok, `file_type_2` is not a file type at all, it's the `id` (`unknown_4` right now) of just one node that really looks like a directory.

`file_type_2` should probably renamed `parent_id` or something.

Also, `unknown_6` follows the same logic, it's the id of the footer entry (side note: maybe the format supports having one index for several files).


### Recap of the format

During these first steps in the implementation, we managed to figure out quite a bit about the format.

So lets recap the format at this point:

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

```
+====+====+====+====++====+====+====+====++====+====+====+====++====+====+====+====+
| MA | MA | MA | MA || 00 | 00 | 00 | 02 || ID | ID | ID | ID || 40 | 00 | 00 | 00 |
+====+====+====+====++====+====+====+====++====+====+====+====++====+====+====+====+
|<----- magic ----->||<--- unknown_1 --->||<------- id ------>||<--- unknown_2 --->|
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

| Field                      |  size   | Description                                                                                                                                     |
|----------------------------|---------|-------------------------------------------------------------------------------------------------------------------------------------------------|
| `magic`                    | 32 bits | Magic bytes, always "ISFP"                                                                                                                      |
| `unknown_1`                | 32 bits | Unknown, always 0x2000000                                                                                                                       |
| `id`                       | 32 bits | Unsure, unique per index file, not referenced anywhere else                                                                                     |
| `unknown_2`                | 32 bits | Unknown, always 0x40, maybe some offset                                                                                                         |
| `file_dir_count`           | 32 bits | Number of files + directories (Nfd), also number of entries in the metadata section and the file names section                                  |
| `file_count`               | 32 bits | Number of files (Nf), also the number of entries in the file pkg pointers section                                                               |
| `unknown_3`                | 64 bits | Unknown, always '1', maybe the number of `.pkg` file the index file references (the format hints that it might be supported, but it's not used) |
| `header_size`              | 64 bits | Most likely the header size, always 40                                                                                                          |
| `offset_idx_data_section`  | 64 bits | Offset to the pkg data section, the offset is computed from `file_plus_dir_count` so `0x10` needs to be added                                   |
| `offset_idx_footer_section`| 64 bits | Offset to the footer section, the offset is computed from `file_plus_dir_count` so  `0x10` needs to be added                                    |

#### File metadata

This section is repeated for each file and directory (`header->file_dir_count`).

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

| Field                  | Size    | Description                                                                               |
|------------------------|---------|-------------------------------------------------------------------------------------------|
| `file_name_size`       | 64 bits | Size of the file name string                                                              |
| `offset_idx_file_name` | 64 bits | Offset from the start of the current metadata record to the start of the file name string |
| `id`                   | 64 bits | Unique ID of the metadata record                                                          |
| `parent_id`            | 64 bits | ID of the potential parent record (in particular, a directory record)                     |

#### File names section

This section is just `\0` separated list of strings:
```
+~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~+====+
|             file name string         | 00 |
+~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~+====+
[...repeat...]
```
#### File ".pkg" pointers

This section  is repeated for each file (`header->file_count`).

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

| Field             | Size    | Description                                                     |
|-------------------|---------|-----------------------------------------------------------------|
| `metadata_id`     | 64 bits | ID of the corresponding metadata entry                          |
| `footer_id`       | 64 bits | ID of the footer entry (only one entry possible in practice)    |
| `offset_pkg_data` | 64 bits | Offset to the compressed data from the start of the `.pkg` file |
| `type_1`          | 32 bits | Some kind of type, role unknown                                 |
| `type_2`          | 32 bits | Some kind of type, role unknown                                 |
| `size_pkg_data`   | 32 bits | Size of the compressed data section in the `.pkg` file          |
| `id_pkg_data`     | 64 bits | ID of the data section in the `.pkg` file                       |
| `padding`         | 32 bits | Always `0x00000000`                                             |

#### Footer

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

| Field                | Size    | Description                                       |
|----------------------|---------|---------------------------------------------------|
| `pkg_file_name_size` | 64 bits | Size of the corresponding `.pkg` file name string |
| `unknown_7`          | 64 bits | unknown, looks like an ID                         |
| `id`                 | 64 bits | ID of the footer entry                            |

#### PKG format

The `.pkg` format is rather simple, it's bunch of concatenated compressed (RFC 1951/Deflate) data blobs (one for each file) separated by an ID.

```
+~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~+
|                                                                                 |
|                      Compressed Data (RFC 1951/Deflate)                         |
|                                                                                 |
+~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~+
+====+====+====+====++====+====+====+====+====+====+====+====++====+====+====+====+
| 00 | 00 | 00 | 00 || XX | XX | XX | XX | XX | XX | 00 | 00 || 00 | 00 | 00 | 00 |
+====+====+====+====++====+====+====+====+====+====+====+====++====+====+====+====+
|<--- padding_1 --->||<---------------- id ----------------->||<--- padding_2 --->|
|     32 bits       ||               64 bits                 ||      32 bits      |

[...repeat...]
```

| Field             | Size    | Description         |
|-------------------|---------|---------------------|
| `padding_1`       | 32 bits | Always `0x00000000` |
| `id_pkg_data`     | 64 bits | ID of the data blob |
| `padding_2`       | 32 bits | Always `0x00000000` |

### Back to the implementation

#### Small tangent

By this point, I was a bit intrigued by the `type_1` and `type_2` fields in the `pkg` pointer sections.

```shell
kakwa@linux GitHub/wows-depack (main) » for i in ~/Games/World\ of\ Warships/bin/6775398/idx/*;do ./wows-depack-cli -i "$i"| grep 'type_[12]:'  ;done | sort -n | uniq -c | sort -n

  57265 * type_1:                    0x0
  57265 * type_2:                    0x0
 232089 * type_1:                    0x5
 232089 * type_2:                    0x1
```

Ok, it seems that `(type_1, type_2)` can either have the `(0x0, 0x0)` values, or the `(0x5, 0x1)` values. In most cases, it's the latter.

Looking at a few `(0x0, 0x0)`, a common file with such values are `.png`.

It's a bit of a wild guess, but these might be compression levels. `(0x0, 0x0)`, i.e. no compression would be logical for `.png` as these files are already compressed. Compressing them would actually only cost CPU resources with no space gains.

For now, lets just keep that in mind, we will revisit it later.

#### Glueing the entries together

So, we have metadata entries which can be linked together, we have pkg pointer entries which are linked to metadata entries and footer entries.

It's time to link all that together.

To do that, the obvious choice is to feed these IDs into an hash map, this will make look-ups easier and quicker.

Once done, the output now looks like that:


```
File entry [259]:
* metadata_id:               0xc90b3d356989c551
* footer_id:                 0x77ed330d07031170
* offset_pkg_data:           0x5d30db8
* type_1:                    0x5
* type_2:                    0x1
* size_pkg_data:             0x89667
* id_pkg_data:               0xaab740ef4f6a6
* padding:                   0x0
* file_name_size:            18
* offset_idx_file_name:      0x164e
* id:                        0xc90b3d356989c551
* parent_id:                 0xeb7ddcfb5178376
* filename:                  snow_tiles_ah.dds
parent [1]:
* file_name_size:            8
* offset_idx_file_name:      0x19cf
* id:                        0xeb7ddcfb5178376
* parent_id:                 0xb220a7743c83e638
* filename:                  weather
parent [2]:
* file_name_size:            5
* offset_idx_file_name:      0x16a3
* id:                        0xb220a7743c83e638
* parent_id:                 0x3837637adc4586b1
* filename:                  maps
parent [3]:
* file_name_size:            7
* offset_idx_file_name:      0x1746
* id:                        0x3837637adc4586b1
* parent_id:                 0xdbb1a1d1b108b927
* filename:                  system
```

This entry is for the following path: `/system/maps/weather/snow_tiles_ah.dds`

This should be enough now to start thinking about the actual tool and how it will be implemented.

#### Another tangent

The goal is in the end is to parse all the index files, so it got me curious about the IDs across the different files.

Looking at the dumps, `content` is a fairly common directory name, present in a lot of the index files.

And if we look at these records, we get:


```
kakwa@linux GitHub/wows-depack (main *%) » for i in ~/Games/World\ of\ Warships/bin/6775398/idx/*;do echo $i; ./wows-depack-cli -i "$i" |grep -B 5  '* filename:                  content$';done|less                                                                                                                 130 ↵

/home/kakwa/Games/World of Warships/bin/6775398/idx/basecontent.idx
parent [5]:
* file_name_size:            8
* offset_idx_file_name:      0x470b7
* id:                        0xa33046442d8327fc
* parent_id:                 0xdbb1a1d1b108b927
* filename:                  content
--
parent [5]:
* file_name_size:            8
* offset_idx_file_name:      0x470b7
* id:                        0xa33046442d8327fc
* parent_id:                 0xdbb1a1d1b108b927
* filename:                  content
[...]
/home/kakwa/Games/World of Warships/bin/6775398/idx/camouflage.idx
parent [5]:
* file_name_size:            8
* offset_idx_file_name:      0xecae
* id:                        0xa33046442d8327fc
* parent_id:                 0xdbb1a1d1b108b927
* filename:                  content
--
parent [4]:
* file_name_size:            8
* offset_idx_file_name:      0xecae
* id:                        0xa33046442d8327fc
* parent_id:                 0xdbb1a1d1b108b927
* filename:                  content
--
parent [5]:
* file_name_size:            8
* offset_idx_file_name:      0xecae
* id:                        0xa33046442d8327fc
* parent_id:                 0xdbb1a1d1b108b927
* filename:                  content
[...]
```

Interestingly `id` is always `0xa33046442d8327fc` (and also `parent_id` is `0xdbb1a1d1b108b927`). This will make implementation a bit easier.

However, it raises an interesting question: how this `id` is generated? Is it completely random? Or is it derived from the path/name?

It's not really critical to read files, but might be important to write content if we ever get to that.

### File System Tree

Build a tree structure using:

1. **HashMap** for fast ID lookups ([hashmap.c](https://github.com/tidwall/hashmap.c))
2. **Inode types**: files and directories
3. **Tree construction**: Start with PKG data chunks (files), resolve names via metadata, build directory hierarchy using `parent_id` relationships

The result: a complete archive tree with root node and children.

With a bit more work, adding a path/tree printer function, I now get something like that:

```
/postfx_animations.xml
/settings/Default_v3.settings
/settings/Default_v1.settings
/settings/Default_v2.settings
/scripts/user_data_object_defs/Barge.def
/scripts/user_data_object_defs/SpatialUIDebugTool.def
/scripts/user_data_object_defs/FogPoint.def
/scripts/user_data_object_defs/StaticSoundEmitter.def
[...]
/helpers/maps/green_hemisphere.dds
/helpers/maps/lev_dirt01.dds
/helpers/maps/fat_disc_quarter.dds
/helpers/maps/lev_grass_01.dds
/helpers/maps/lev_grassflowers.dds
/helpers/maps/red_ruler.dds
/helpers/maps/hemisphere.dds
/helpers/maps/disc_quarter.dds
/helpers/maps/red_hemisphere_ring.dds
/server_stats.xml

```

Or that in (ugly) tree form:

```
-./
 |-* postfx_animations.xml
 |--settings/
 |  |-* Default_v3.settings
 |  |-* Default_v1.settings
 |  |-* Default_v2.settings
 |--scripts/
 |  |--user_data_object_defs/
 |  |  |-* Barge.def
 |  |  |-* SpatialUIDebugTool.def
 |  |  |-* FogPoint.def
 |  |  |-* StaticSoundEmitter.def
 |  |  |-* Minefield.def
 |  |  |-* SoundedEffect.def
 |  |  |-* SquadronReticleTool.def
 |  |  |-* Trigger.def
 |  |  |-* WayPoint.def
[...]
```

# Recap (Part 3)

- We define the C Struct for the metadata/index
- We resolved a few loose ends: filename lengths, parent IDs, unique identifiers for linking
- We implemented file tree using hashmaps and parent-child relationships
- We identified compression type patterns


In the [next and last part](/posts/wows_depack_part4/) we will tie things together and wrap up the implementation.
