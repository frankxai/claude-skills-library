#!/usr/bin/env python3
import os
import sys
import unittest
import tempfile

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
import _skillmeta

class TestSkillMeta(unittest.TestCase):

    def test_parse_frontmatter_basic(self):
        text = "---\nname: test-skill\ndescription: A basic test skill\n---\n\nbody here"
        fm = _skillmeta.parse_frontmatter(text)
        self.assertEqual(fm, {"name": "test-skill", "description": "A basic test skill"})

    def test_parse_frontmatter_block_scalar(self):
        text = "---\nname: multi-line\ndescription: |\n  line one\n  line two\n\n  line three\n---\nbody"
        fm = _skillmeta.parse_frontmatter(text)
        self.assertEqual(fm, {"name": "multi-line", "description": "line one\nline two\n\nline three"})

    def test_parse_frontmatter_invalid(self):
        self.assertIsNone(_skillmeta.parse_frontmatter("no frontmatter here"))
        self.assertIsNone(_skillmeta.parse_frontmatter("---\nunclosed frontmatter\nbody"))

    def test_read_text_utf8(self):
        with tempfile.NamedTemporaryFile(delete=False, suffix=".md") as tmp:
            tmp.write("hello world ✨".encode("utf-8"))
            tmp_path = tmp.name

        try:
            content = _skillmeta.read_text(tmp_path)
            self.assertEqual(content, "hello world ✨")
        finally:
            os.remove(tmp_path)

    def test_read_text_invalid_utf8(self):
        with tempfile.NamedTemporaryFile(delete=False, suffix=".md") as tmp:
            tmp.write(b"invalid \x80 utf8")
            tmp_path = tmp.name

        try:
            with self.assertRaises(UnicodeDecodeError):
                _skillmeta.read_text(tmp_path)
        finally:
            os.remove(tmp_path)

if __name__ == '__main__':
    unittest.main()
