# Contributing to Claude Skills Library

Thank you for your interest in contributing! This is an open, MIT-licensed library and we welcome
contributions to **any** skill, as well as brand-new skills.

## What Can You Contribute?

- **New skills**: A new `free-skills/<skill-name>/SKILL.md` for a domain not yet covered.
- **Bug fixes**: Typos, formatting issues, broken examples or links.
- **Improvements**: Better examples, clearer explanations, updated research.
- **Documentation**: Usage guides, tutorials, case studies.
- **Translations**: Non-English versions of skills.

Browse the full [skills catalog](docs/CATALOG.md) to see what already exists before adding a new skill.

## The Skill Standard

The full authoring standard — frontmatter rules, progressive disclosure, and a PR-review quality
checklist — lives in [`spec/README.md`](spec/README.md). Start a new skill by copying
[`template/`](template/). In short, every skill **must** pass
[`scripts/validate_skills.py`](scripts/validate_skills.py). Concretely, each `SKILL.md` must:

- Be named exactly `SKILL.md`, be valid UTF-8, and not be empty.
- Start with YAML frontmatter containing `name` and `description` (the two required fields). An
  optional `version` is fine but not required.
- Use a `name` that is lowercase, hyphenated, ≤ 64 characters, and matches `^[a-z0-9][a-z0-9-]*$`
  (conventionally identical to the skill's folder name).
- Provide a specific, non-empty `description` (≤ 1024 chars) that tells the model **what the skill
  does AND when** to use it, in the third person, with explicit trigger keywords.

```yaml
---
name: my-new-skill
description: What this skill does and the situations in which the agent should load it. Use when ...
---
```

Keep the body under ~500 lines and push depth into `references/` (the validator warns past 500).

Run the validator before opening a PR:

```bash
python3 scripts/validate_skills.py
```

If you add, rename, or remove a skill, regenerate the catalog so `docs/CATALOG.md` stays in sync:

```bash
python3 scripts/generate_catalog.py
```

## How to Contribute

### 1. Fork the Repository
Click the "Fork" button at the top right of this repository.

### 2. Clone Your Fork
```bash
git clone https://github.com/YOUR_USERNAME/claude-skills-library.git  # your fork
cd claude-skills-library
```

### 3. Create a Branch
```bash
git checkout -b feature/your-improvement-name
```

Use descriptive branch names:
- `fix/typo-in-greek-philosopher`
- `improve/mcp-examples`
- `docs/add-usage-guide`

### 4. Make Your Changes

**For Skill Improvements:**
- Edit the `SKILL.md` file in the appropriate `free-skills/` directory
- Maintain the existing structure and formatting
- Add examples if helpful
- Ensure accuracy (cite sources if adding research)

**For Documentation:**
- Update `README.md` or create new docs in `docs/`
- Keep language clear and concise
- Include code examples where relevant

### 5. Test Your Changes

Before submitting:
1. Validate frontmatter:
   ```bash
   python3 scripts/validate_skills.py
   ```

2. Install the skill locally:
   ```bash
   cp -r free-skills/[skill-name] ~/.claude/skills/
   ```

2. Test with Claude Code:
   - Ask relevant questions
   - Verify skill activates correctly
   - Check that responses are accurate
   - Test edge cases

3. Review formatting:
   - Markdown renders correctly
   - Code blocks are properly formatted
   - Links work

### 6. Commit Your Changes

Write clear, descriptive commit messages:

```bash
git add .
git commit -m "Fix: Correct WCAG 2.2 contrast ratio in UI/UX skill"
```

**Good commit messages:**
- `Fix: Typo in Greek Philosopher Stoic principles`
- `Improve: Add MCP server authentication example`
- `Docs: Add installation troubleshooting guide`
- `Update: Include 2025 accessibility research in UI/UX skill`

**Bad commit messages:**
- `fix stuff`
- `update`
- `changes`

### 7. Push to Your Fork

```bash
git push origin feature/your-improvement-name
```

### 8. Open a Pull Request

1. Go to the original repository
2. Click "New Pull Request"
3. Select your fork and branch
4. Fill out the PR template (see below)
5. Submit!

## Pull Request Guidelines

### PR Title Format:
```
[Type] Brief description of change

Examples:
[Fix] Correct Socratic elenchus definition in Greek Philosopher
[Improve] Add comprehensive ARIA examples to UI/UX Design Expert
[Docs] Create quickstart installation guide
[Update] Include 2025 MCP best practices
```

### PR Description Template:
```markdown
## What does this PR do?
Brief description of the changes.

## Why is this change needed?
Explain the problem you're solving or improvement you're making.

## What skill(s) does this affect?
- [ ] Greek Philosopher
- [ ] Spartan Warrior
- [ ] MCP Architecture Expert
- [ ] UI/UX Design Expert
- [ ] Social Media Strategy
- [ ] Documentation
- [ ] Other (specify)

## Testing done:
- [ ] Tested skill locally in Claude Code
- [ ] Verified examples work as expected
- [ ] Checked markdown formatting
- [ ] Reviewed for typos and clarity

## Screenshots (if applicable):
Add screenshots showing the improvement (before/after if applicable).

## Additional context:
Any other information that would be helpful for reviewers.
```

## Contribution Standards

### Code Quality:
- ✅ **Accuracy**: Ensure all information is factually correct
- ✅ **Clarity**: Write in clear, concise language
- ✅ **Examples**: Include practical examples when adding features
- ✅ **Formatting**: Follow existing markdown structure
- ✅ **Citations**: Reference sources for research-based claims

### What We Look For:
- **Value**: Does this improve the skill meaningfully?
- **Accuracy**: Is the information correct and up-to-date?
- **Clarity**: Is it easy to understand?
- **Consistency**: Does it match the existing style?
- **Testing**: Has it been tested in Claude Code?

### What We Don't Accept:
- ❌ Marketing or promotional content
- ❌ Unverified claims or opinions presented as facts
- ❌ Breaking changes without discussion
- ❌ Low-effort PRs (e.g., only fixing a single typo - batch these)

## Review Process

1. **Automated Checks**: Your PR will run through automated checks (if configured)
2. **Maintainer Review**: A maintainer will review your PR within 3-5 business days
3. **Feedback**: You may receive requests for changes or clarifications
4. **Merge**: Once approved, your PR will be merged!

## Recognition

Contributors will be:
- Listed in `CONTRIBUTORS.md`
- Mentioned in release notes (for significant contributions)
- Credited in skill documentation (for major improvements)

## Questions?

- 💬 Open a [Discussion](https://github.com/frankxai/claude-skills-library/discussions)
- 🐛 Report bugs via [Issues](https://github.com/frankxai/claude-skills-library/issues)

## Code of Conduct

### Our Standards

We are committed to providing a welcoming and inspiring community for all.

**Expected Behavior:**
- ✅ Be respectful and inclusive
- ✅ Welcome newcomers and help them learn
- ✅ Accept constructive criticism gracefully
- ✅ Focus on what's best for the community
- ✅ Show empathy towards others

**Unacceptable Behavior:**
- ❌ Harassment, discrimination, or hostile behavior
- ❌ Trolling, insulting, or derogatory comments
- ❌ Personal or political attacks
- ❌ Publishing others' private information
- ❌ Spam or self-promotion

**Enforcement:**
Violations may result in temporary or permanent ban from the project.

## License

By contributing to this project, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for making the Claude Skills Library better!** 🙏

Every contribution, no matter how small, helps the community. We appreciate your time and effort.
