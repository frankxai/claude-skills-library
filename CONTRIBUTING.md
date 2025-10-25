# Contributing to Claude Skills Library

Thank you for your interest in contributing! We welcome contributions to the **free skills** in this repository.

## What Can You Contribute?

### Free Skills (Open for Contributions)
- 🏛️ Greek Philosopher
- ⚔️ Spartan Warrior
- 🔌 MCP Architecture Expert
- 🎨 UI/UX Design Expert
- 📱 Social Media Strategy

You can contribute:
- **Bug fixes**: Typos, formatting issues, broken examples
- **Improvements**: Better examples, clearer explanations, updated research
- **Documentation**: Usage guides, tutorials, case studies
- **Translations**: Non-English versions of skills (pending)

### Premium Skills (Not Open for Contributions)
Premium skills are proprietary and not open for community contributions.

## How to Contribute

### 1. Fork the Repository
Click the "Fork" button at the top right of this repository.

### 2. Clone Your Fork
```bash
git clone https://github.com/YOUR_USERNAME/claude-skills-library.git
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
1. Install the skill locally:
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
- ❌ Changes to premium skills (proprietary)
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

- 💬 Open a [Discussion](https://github.com/yourusername/claude-skills-library/discussions)
- 🐛 Report bugs via [Issues](https://github.com/yourusername/claude-skills-library/issues)
- 📧 Email: support@claudeskillslibrary.com

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

By contributing to this project, you agree that your contributions will be licensed under the MIT License (for free skills only).

---

**Thank you for making the Claude Skills Library better!** 🙏

Every contribution, no matter how small, helps the community. We appreciate your time and effort.
