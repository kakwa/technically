+++
title = 'Nut Embedding in 3D prints'
date = 2025-10-07T02:27:43+02:00
draft = true
+++

# Nut Embedding: the threading solution for people too cheap to buy inserts

Just a quick one this time.

While the usual way to add threads to a 3D printing part is to use threaded inserts, another option is nut embedding.

Threading inserts are often the best options, but for onezies/twozies it can be annoying to buy and wait a whole bag to arrive. Specially when the average tickerer most likely already has perfectly serviceable nuts of the correct size.

In such cases, nut embedding is the solution, and it works like this:

* leave a pocket in the model for the Nut (+ some tolerances).
* in the slicer, introduce a pause at the top of the pocket layer.
* during the print, when the pause is reached, insert the nut into the pocket manually.
* continue the print, and let the printer cover the nut.

# How to do it

## Part Design

Designing it is quite easy, just measure your nut, add a pocket for it with ~0.5mm tolerances.

In addition, I recommend adding one thin (~0.2mm) "sacrificial layer" in the model directly.

This sacrificial layer is here to ease bridging over the nut once the latter as been inserted, this layer will be punch through when screwing the bolt for the first time.

{{< figure src="/images/nut-embedding/model-pocket-sacrificical-layer.png" alt="3d model for nut insert" caption="3D model with pocket + sacrificial layer" >}}

Some slicers filling in voids and cavities by default, no doubt there is an option somewhere, but an easy hack to avoid that is to insert a really tiny (~1µm) hole in the sacrificial layer.

{{< figure src="/images/nut-embedding/model-hole-hack.png" alt="tiny hole hack in sacrificial layer" caption="Put a tiny like 1µm hole to avoid slicer filling" >}}

## Slicing and Printing

Once your model is done, import it in your slicer, slice it, and add a `PAUSE` at the top of the nut pocket/start of sacrificial layer.

The way to do it varies from slicer to slicer, but here is how to do it in pruseSlicer:

* Click `Slice now`.
* Using the vertical slider, move up to the sacrificial layer.
* Right Click on the `+` icon + `Add Pause`
* Export G-code

{{< figure src="/images/nut-embedding/slicer-sacrificial-layer.png" alt="slicer (prusa), add pause" caption="Adding a Pause" >}}

Note: the `PAUSE` is at the start of the selected layer. Don't be confused by the default horizontal curser, i.e. to the end of the layer.

Note: make sure your tool head move out of the way, either through your printer PAUSE macro, or using a gcode like:

```lisp
M25                     ; pause SD print
G91                     ; switch to relative positioning
G1 X25 Y25 Z25 F3000    ; move nozzle +25mm in X, Y, and Z (away from print)
M0                      ; wait for user to press button / resume
G1 X-25 Y-25 Z-25 F3000 ; move nozzle back -25mm to original position
G90                     ; return to absolute positioning
M24                     ; resume SD print
```

or, more simply, if you printer supports it:

```lisp
M600 X25 Y25 Z25        ; "color change" without retractation.
```

Once you have your gcode, start the print, and wait for the `PAUSE`.

Once there, insert the nut (just be cautious to not detach the part from the plate... don't ask me how I know...).

{{< figure src="/images/nut-embedding/print-pause.jpg" alt="pause + insert nut" caption="" >}}

Then click resume, the printer should then add the sacrifical layer, and bridge over the nut.

{{< figure src="/images/nut-embedding/print-sacrificial.jpg" alt="printing sacrifical layer" caption="" >}}

Let it complete.

If everything goes well, you should end up with a nice part, and an invisible threading/nut.

{{< figure src="/images/nut-embedding/print-end.jpg" alt="printed part" caption="" >}}

# Conclusion

Embbeding nuts in prints is a nice trick. It's definitely useful in a pinch. It can also be marginally [more resistant](https://www.cnckitchen.com/blog/helicoils-threaded-insets-and-embedded-nuts-in-3d-prints-strength-amp-strength-assessment).

Plus, this technic is not limited to nuts, it can be leveraged in other situation, for example to add mass to a part, insert magnets, or to add rebar/reinforcement.

Hoped you found this technic interresting, and happy printing!

# Links

* [Marlin GCode Documentation](https://marlinfw.org/docs/gcode/M600.html)
* [CNC Kitchen's insert testing article/video](https://www.cnckitchen.com/blog/helicoils-threaded-insets-and-embedded-nuts-in-3d-prints-strength-amp-strength-assessment)
* [3D Printing Nerd's magnet embedding video](https://www.youtube.com/watch?v=oF1SdIR-Kow)
