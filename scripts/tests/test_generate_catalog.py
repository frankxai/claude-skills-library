#!/usr/bin/env python3
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from generate_catalog import categorize, render


class TestGenerateCatalog(unittest.TestCase):

    def test_categorize_matches_pattern(self):
        # Matches r"nextjs|tailwind|^three$|framer|web-design|ui-ux|css-animations|animejs|gsap|lottie|waapi|defuddle" -> "Web, Frontend & Animation"
        self.assertEqual(categorize("nextjs-agent-ui"), "Web, Frontend & Animation")

        # Matches r"agentic|swarm|hive-mind|stream-chain|model-routing|reasoningbank|memory-prune|opus-extended|sparc|pair-programming|nextjs-agent-team|^ai-architect-review$" -> "AI Agents & Orchestration"
        self.assertEqual(categorize("agentic-swarm"), "AI Agents & Orchestration")

        # Matches r"brand|book|newsletter|social-media|content-strategy|creator|prompt-hub|internal-comms" -> "Content, Writing & Brand"
        self.assertEqual(categorize("brand-voice"), "Content, Writing & Brand")

    def test_categorize_default_other(self):
        # Fails all regexes
        self.assertEqual(categorize("unknown-weird-skill"), "Other")

    def test_render_empty_skills(self):
        content = render({})
        self.assertIn("# 📚 Skills Catalog", content)
        self.assertIn("**0 skills**", content)

    def test_render_with_skills(self):
        skills = {
            "agentic-swarm": ("free-skills/agentic-swarm/SKILL.md", "An agentic swarm skill."),
            "nextjs-ui": ("free-skills/nextjs-ui/SKILL.md", "A UI skill with a very very long description that goes on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on."),
            "unknown-skill": ("free-skills/unknown-skill/SKILL.md", "multi\nline\ndescription|with|pipes")
        }
        content = render(skills)

        # Check totals
        self.assertIn("**3 skills**", content)

        # Check categories are present
        self.assertIn("## AI Agents & Orchestration", content)
        self.assertIn("## Web, Frontend & Animation", content)
        self.assertIn("## Other", content)

        # Check specific entries and links
        self.assertIn("[`agentic-swarm`](../free-skills/agentic-swarm/SKILL.md)", content)

        # Check description formatting (newlines replaced by spaces, pipes escaped)
        self.assertIn("multi line description\\|with\\|pipes", content)

        # Check truncation for descriptions > 180 chars
        # The description is 279 characters long.
        self.assertIn("...", content)


if __name__ == '__main__':
    unittest.main()
