#!/usr/bin/env python3
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from core import color_palettes

class TestColorPalettes(unittest.TestCase):
    def test_get_palette(self):
        self.assertEqual(color_palettes.get_palette('vibrant'), color_palettes.VIBRANT)
        self.assertEqual(color_palettes.get_palette('pastel'), color_palettes.PASTEL)
        self.assertEqual(color_palettes.get_palette('unknown'), color_palettes.VIBRANT)

    def test_get_text_color_for_background(self):
        # Light background -> black text
        self.assertEqual(color_palettes.get_text_color_for_background((255, 255, 255)), (0, 0, 0))
        # Dark background -> white text
        self.assertEqual(color_palettes.get_text_color_for_background((0, 0, 0)), (255, 255, 255))

    def test_get_complementary_color(self):
        self.assertEqual(color_palettes.get_complementary_color((255, 0, 0)), (0, 255, 255))
        self.assertEqual(color_palettes.get_complementary_color((0, 255, 0)), (255, 0, 255))

    def test_lighten_color(self):
        self.assertEqual(color_palettes.lighten_color((100, 100, 100), 0.5), (177, 177, 177))
        self.assertEqual(color_palettes.lighten_color((0, 0, 0), 1.0), (255, 255, 255))
        self.assertEqual(color_palettes.lighten_color((255, 255, 255), 0.5), (255, 255, 255))

    def test_darken_color(self):
        self.assertEqual(color_palettes.darken_color((100, 100, 100), 0.5), (50, 50, 50))
        self.assertEqual(color_palettes.darken_color((255, 255, 255), 1.0), (0, 0, 0))
        self.assertEqual(color_palettes.darken_color((0, 0, 0), 0.5), (0, 0, 0))

    def test_blend_colors(self):
        self.assertEqual(color_palettes.blend_colors((255, 0, 0), (0, 0, 255), 0.5), (127, 0, 127))
        self.assertEqual(color_palettes.blend_colors((0, 0, 0), (255, 255, 255), 0.0), (0, 0, 0))
        self.assertEqual(color_palettes.blend_colors((0, 0, 0), (255, 255, 255), 1.0), (255, 255, 255))

    def test_create_gradient_colors(self):
        gradient = color_palettes.create_gradient_colors((0, 0, 0), (255, 255, 255), 3)
        self.assertEqual(len(gradient), 3)
        self.assertEqual(gradient[0], (0, 0, 0))
        self.assertEqual(gradient[1], (127, 127, 127))
        self.assertEqual(gradient[2], (255, 255, 255))

        # Test 1 step (edge case)
        gradient_1 = color_palettes.create_gradient_colors((0, 0, 0), (255, 255, 255), 1)
        self.assertEqual(len(gradient_1), 1)
        self.assertEqual(gradient_1[0], (0, 0, 0))

    def test_get_impact_color(self):
        self.assertEqual(color_palettes.get_impact_color('flash'), color_palettes.IMPACT_COLORS['flash'])
        self.assertEqual(color_palettes.get_impact_color('unknown'), color_palettes.IMPACT_COLORS['flash'])

    def test_get_emoji_palette(self):
        self.assertEqual(color_palettes.get_emoji_palette('simple'), color_palettes.EMOJI_PALETTES['simple'])
        self.assertEqual(color_palettes.get_emoji_palette('unknown'), color_palettes.EMOJI_PALETTES['simple'])

if __name__ == '__main__':
    unittest.main()
