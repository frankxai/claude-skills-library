"""Regression tests: recursive deletes always require approval, never execute commands."""
import importlib.util
import pathlib
import unittest

HOOK = pathlib.Path(__file__).resolve().parent / "estate-guard-gate.py"
spec = importlib.util.spec_from_file_location("estate_guard_gate", HOOK)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class RecursiveDeleteSafetyTests(unittest.TestCase):
    def test_recursive_delete_requires_approval(self):
        cases = [
            "rm -rf /tmp/build-cache",
            "rm -rf /tmp/safe/*/secret",
            "rm -rf $TMPDIR/build-cache",
            "rm -rf ${TMPDIR}/build-cache",
            "rm -rf /private/tmp/work",
            "rm -rf /var/tmp/work",
            "rm -rf /tmp/one /home/user/documents",
            "rm -rf /tmp/work && echo complete",
            "echo complete; rm -rf /tmp/work",
        ]
        for command in cases:
            with self.subTest(command=command):
                action, reason = module.decision(command)
                self.assertIn(action, ("ask", "deny"), (command, action, reason))

    def test_root_delete_stays_denied(self):
        action, _ = module.decision("rm -rf /")
        self.assertEqual(action, "deny")

    def test_non_destructive_command_unaffected(self):
        action, _ = module.decision("printf hello")
        self.assertIsNone(action)


if __name__ == "__main__":
    unittest.main()
