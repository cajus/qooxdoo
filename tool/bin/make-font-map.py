#!/usr/bin/env python
import sys
import json
import fontforge

def generate_map(source, target):
    font = fontforge.open("fontawesome-webfont.ttf") 
    
    fontmap = {}
    fontmap[font.familyname] = {}
    
    for glyph in font:
        _glyph = font[glyph]
        if _glyph.unicode > 0:
            fontmap[font.familyname][_glyph.glyphname] = _glyph.unicode
    
    with open(target, "w") as out:
        out.write(json.dumps(fontmap))

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print "Usage: make-font-map.py <source-font> <output.json>"
        print
        exit(1)
 
    generate_map(sys.argv[1], sys.argv[2])
