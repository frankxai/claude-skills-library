#!/usr/bin/env python3
import math
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from core import easing

class TestEasing(unittest.TestCase):
    def test_linear(self):
        self.assertEqual(easing.linear(0.0), 0.0)
        self.assertEqual(easing.linear(0.5), 0.5)
        self.assertEqual(easing.linear(1.0), 1.0)

    def test_ease_in_quad(self):
        self.assertEqual(easing.ease_in_quad(0.0), 0.0)
        self.assertEqual(easing.ease_in_quad(0.5), 0.25)
        self.assertEqual(easing.ease_in_quad(1.0), 1.0)

    def test_ease_out_quad(self):
        self.assertEqual(easing.ease_out_quad(0.0), 0.0)
        self.assertEqual(easing.ease_out_quad(0.5), 0.75)
        self.assertEqual(easing.ease_out_quad(1.0), 1.0)

    def test_ease_in_out_quad(self):
        self.assertEqual(easing.ease_in_out_quad(0.0), 0.0)
        self.assertEqual(easing.ease_in_out_quad(0.25), 0.125)
        self.assertEqual(easing.ease_in_out_quad(0.75), 0.875)
        self.assertEqual(easing.ease_in_out_quad(1.0), 1.0)

    def test_get_easing(self):
        self.assertEqual(easing.get_easing('linear'), easing.linear)
        self.assertEqual(easing.get_easing('ease_in'), easing.ease_in_quad)
        # Default fallback is linear
        self.assertEqual(easing.get_easing('unknown'), easing.linear)

    def test_interpolate(self):
        self.assertEqual(easing.interpolate(10, 20, 0.5, 'linear'), 15.0)
        self.assertEqual(easing.interpolate(10, 20, 0.5, 'ease_in'), 12.5)

    def test_apply_squash_stretch(self):
        self.assertEqual(easing.apply_squash_stretch((1.0, 1.0), 1.0, 'vertical'), (1.5, 0.5))
        self.assertEqual(easing.apply_squash_stretch((1.0, 1.0), 1.0, 'horizontal'), (0.5, 1.5))
        self.assertEqual(easing.apply_squash_stretch((1.0, 1.0), 1.0, 'both'), (0.7, 0.7))

    def test_calculate_arc_motion(self):
        self.assertEqual(easing.calculate_arc_motion((0.0, 0.0), (10.0, 0.0), 5.0, 0.0), (0.0, 0.0))
        self.assertEqual(easing.calculate_arc_motion((0.0, 0.0), (10.0, 0.0), 5.0, 0.5), (5.0, -5.0))
        self.assertEqual(easing.calculate_arc_motion((0.0, 0.0), (10.0, 0.0), 5.0, 1.0), (10.0, 0.0))

if __name__ == '__main__':
    unittest.main()
