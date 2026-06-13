# 🎯 Claude Skills Library
### Professional-Grade Skills for Claude Code & Claude AI
> Transform Claude into a domain expert with comprehensive, research-backed skills

[![GitHub stars](https://img.shields.io/github/stars/yourusername/claude-skills-library?style=social)](https://github.com/yourusername/claude-skills-library)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

---

## 🚀 What is This?

The most comprehensive, research-backed skill library for Claude Code and Claude AI. Unlike basic examples that offer 500 words of generic guidance, **each skill is a 3,000-6,000 word expert system** grounded in 2025 best practices, latest research, and proven methodologies.

### Free Skills Include:
- 🏛️ **Greek Philosopher** - Socratic questioning and Stoic wisdom
- ⚔️ **Spartan Warrior** - Discipline, courage, and relentless action
- 🔌 **MCP Architecture Expert** - Model Context Protocol server design
- 🎨 **UI/UX Design Expert** - WCAG 2.2 compliance, design systems, accessibility
- 📱 **Social Media Strategy** - Platform tactics and engagement optimization *(coming soon)*

**Sharing note (per SHARING.md + SIP):** Free skills here are core/shared (propagated via claude-code-config junctions to ACOS/SIS/.claude/.grok compat). Kenya-magical (personal excellence like certain health/creative/soul) stay in personal/.grok/FrankX overlays only — never auto in this library or ACOS core. Use /sip-share-audit + tags before any sync.

### Premium Skills Available:
- 🎵 **Suno AI Mastery** - Professional music generation
- 🤖 **AI Agent Development Suite** - 6 framework experts (OpenAI, Claude, Oracle, LangGraph, MCP, Agent Spec)
- ☁️ **Oracle Enterprise Suite** - OCI Services, Database, ADK
- 💪 **Health & Wellness Mastery** - Exercise science + nutrition + philosophy
- 🎬 **Creative Production Bundle** - Music, video, social media
- And more...

[👉 See Full Premium Catalog](#premium-skills)

---

## ⚡ Quick Start

### Installation

**Method 1: Manual Installation** (Recommended for testing)
```bash
# Clone the repository
git clone https://github.com/yourusername/claude-skills-library.git

# Copy free skills to Claude Code
cp -r claude-skills-library/free-skills/* ~/.claude/skills/

# Restart Claude Code (if running)
```

**Method 2: Symlink** (Recommended for development)
```bash
# Clone the repository
git clone https://github.com/yourusername/claude-skills-library.git

# Create symlinks
ln -s ~/claude-skills-library/free-skills/greek-philosopher ~/.claude/skills/greek-philosopher
ln -s ~/claude-skills-library/free-skills/spartan-warrior ~/.claude/skills/spartan-warrior
# Repeat for other skills...
```

**Method 3: Claude Code Plugin** *(coming soon)*
```bash
/plugin install claude-skills-library
```

### Usage

Skills activate automatically when relevant, or invoke explicitly:

```
"Use the Greek Philosopher skill to examine my career decision"

"Apply the Spartan Warrior approach to my discipline problem"

"Help me implement WCAG 2.2 accessibility using the UI/UX Design Expert skill"

"Design an MCP server with the MCP Architecture Expert"
```

---

## 📚 Free Skills Documentation

### 🏛️ Greek Philosopher

**Transform Claude into a Socratic philosopher with poetic wisdom**

#### What You Get:
- **Socratic Questioning Method**: Elenchus technique for examining beliefs
- **Stoic Philosophy**: Four cardinal virtues (Wisdom, Courage, Justice, Temperance)
- **Philosophical Frameworks**: Decision-making through ancient wisdom
- **Poetic Communication**: Ultra-high-quality language and metaphors

#### Use Cases:
- Life decisions and career choices
- Examining assumptions and beliefs
- Deep thinking on complex problems
- Philosophical inquiry and self-examination

#### Sample Interaction:
```
User: "Should I quit my job to start a business?"

Greek Philosopher: "Ah, dear friend, let us walk together through this
inquiry, as Socrates walked with his companions in the Agora...

Tell me first: when you speak of 'should,' do you ask what is safe,
or what is true to your nature? For the oak does not ask whether it
should grow toward the sun—it simply grows. What within you grows
toward this venture, and what shrinks from it? Let us examine both
with equal care, for wisdom lies not in certainty, but in honest
examination of what we truly seek."
```

**[📖 Full Documentation](free-skills/greek-philosopher/SKILL.md)** | **[⭐ See Examples](#examples)**

---

### ⚔️ Spartan Warrior

**Direct, uncompromising discipline and action**

#### What You Get:
- **Laconic Wisdom**: Short, powerful statements that cut through excuses
- **Five Spartan Principles**: Discipline, Courage, Brotherhood, Excellence, Resilience
- **Warrior Mentality**: Hardship as forge for strength
- **Action-Oriented Guidance**: No philosophizing, just execution

#### Use Cases:
- Overcoming procrastination
- Building discipline and habits
- Cutting through excuses and fear
- Motivation for difficult challenges

#### Sample Interaction:
```
User: "I'm thinking about starting my workout program tomorrow..."

Spartan Warrior: "Tomorrow is for cowards. Start now.

You speak as if you need permission. You don't. You speak as if you
need the perfect plan. You don't. You need only to begin.

The Spartans didn't wait for perfect conditions to train. They trained
in all conditions, which is why conditions didn't matter in battle.

Do one push-up. Now. Not tomorrow. Now. That is the Spartan way.

MOLON LABE - Come and take it. Let resistance try to stop you."
```

**[📖 Full Documentation](free-skills/spartan-warrior/SKILL.md)** | **[⭐ See Examples](#examples)**

---

### 🔌 MCP Architecture Expert

**Build production-grade Model Context Protocol servers**

#### What You Get:
- **Complete MCP Specification**: Resources, Tools, Prompts
- **Security Best Practices**: Authentication, authorization, data protection
- **Architecture Patterns**: Server design, integration strategies
- **Implementation Guides**: TypeScript, Python examples
- **N+M Solution**: Any agent × any MCP server

#### Use Cases:
- Building MCP servers for custom data sources
- Enterprise AI-to-data integration
- Standardizing AI tool access
- Multi-agent system integration

#### Key Capabilities:
```
MCP SERVERS COMPONENTS:
- Resources: Expose data (files, databases, APIs)
- Tools: Enable actions (search, CRUD operations)
- Prompts: Provide templates and workflows

BEST PRACTICES:
- Stateless server design
- Proper error handling
- Rate limiting and caching
- Comprehensive logging
```

**[📖 Full Documentation](free-skills/mcp-architecture/SKILL.md)** | **[⭐ See Examples](#examples)**

---

### 🎨 UI/UX Design Expert

**Master WCAG 2.2 compliance for the 2025 EAA deadline**

#### What You Get:
- **WCAG 2.2 Complete Guide**: All success criteria explained
- **European Accessibility Act (EAA)**: June 28, 2025 compliance deadline
- **Design Systems**: Component libraries, design tokens, atomic design
- **User Research**: Qualitative and quantitative methodologies
- **Figma Workflows**: Best practices for design and handoff
- **2025 Design Trends**: AI integration, inclusive design

#### Use Cases:
- Ensuring WCAG 2.2 / EAA compliance
- Building accessible design systems
- Conducting user research
- Creating inclusive interfaces
- Design-to-development handoff

#### Critical Compliance Features:
```
WCAG 2.2 REQUIREMENTS:
- Contrast: 4.5:1 for text, 3:1 for UI components
- Keyboard Navigation: All interactive elements accessible
- Touch Targets: 44×44px minimum (WCAG 2.2)
- Screen Readers: Proper ARIA labels and semantic HTML
- Forms: Visible labels, clear errors, autocomplete

EAA DEADLINE: June 28, 2025
Non-compliance = legal consequences
```

**[📖 Full Documentation](free-skills/ui-ux-design-expert/SKILL.md)** | **[⭐ See Examples](#examples)**

---

### 📱 Social Media Strategy *(Coming Soon)*

**Platform-specific tactics for 2025 algorithms**

#### What You'll Get:
- **Platform Mastery**: LinkedIn, Twitter/X, Instagram, TikTok, YouTube
- **Content Calendars**: Planning and scheduling frameworks
- **Analytics & Optimization**: Metrics that matter, A/B testing
- **Engagement Strategies**: Community building, algorithm understanding
- **2025 Algorithm Updates**: Latest changes across platforms

**[🔔 Get Notified When Available](#newsletter)**

---

## 💎 Premium Skills

### 🤖 AI Agent Development Suite - $149
**Master 6 AI agent frameworks**

**Includes:**
- OpenAI AgentKit Expert ($39)
- Claude SDK Expert ($39)
- Oracle ADK Expert ($49)
- Oracle Agent Spec Expert ($39)
- LangGraph Patterns Expert ($39)
- MCP Architecture Expert (FREE - included)

**Value:** $235 → **Save $86 (37% off)**

**Perfect for:**
- AI engineers building production agents
- Consultants needing multi-framework expertise
- Teams standardizing on agentic workflows

**[🛒 Purchase AI Agent Development Suite](#pricing)**

---

### ☁️ Oracle Enterprise Suite - $179
**Complete Oracle Cloud & AI expertise**

**Includes:**
- Oracle ADK Expert ($49)
- OCI Services Expert ($49)
- Oracle Database Expert ($49)
- Oracle Agent Spec Expert ($39)

**Value:** $186 → **Optimized Bundle Pricing**

**Perfect for:**
- Oracle Cloud architects
- DBAs and database developers
- Enterprises on OCI
- Oracle AI agent development

**[🛒 Purchase Oracle Enterprise Suite](#pricing)**

---

### 🎬 Creative Production Bundle - $99
**Music, video, and social media mastery**

**Includes:**
- Suno AI Mastery ($29)
- Video Production Workflow ($29)
- Social Media Strategy (FREE - included)

**Perfect for:**
- Content creators and influencers
- Marketing professionals
- Video producers and editors
- Musicians using AI

**[🛒 Purchase Creative Production Bundle](#pricing)**

---

### 💪 Health & Wellness Mastery - $89
**Complete mind-body optimization**

**Includes:**
- Gym & Training Expert ($29) - 2025 exercise science
- Health & Nutrition Expert ($29) - Longevity and metabolic health
- Greek Philosopher (FREE - included)
- Spartan Warrior (FREE - included)

**Perfect for:**
- Fitness enthusiasts and athletes
- Health coaches and trainers
- Anyone optimizing performance
- Longevity and wellness focus

**[🛒 Purchase Health & Wellness Mastery](#pricing)**

---

### 🌟 Complete Library - $299
**All 22+ skills + lifetime updates**

**Includes:**
- All current skills (17 created)
- All future skills (5 in development)
- 1 year of updates (latest research, new features)
- Priority support
- Commercial license

**Value if purchased separately:** $500+
**Savings:** $201+ (40% off)

**Perfect for:**
- Consultants and agencies
- Power users across multiple domains
- Enterprises standardizing on Claude Code
- Anyone wanting the complete ecosystem

**[🛒 Purchase Complete Library](#pricing)**

---

## 🏆 Why This Library is Different

### vs. Basic Examples
| Feature | Basic Examples | Our Skills |
|---------|---------------|------------|
| Depth | 500-1,000 words | 3,000-6,000 words |
| Research | Generic advice | 2025 best practices |
| Frameworks | None | Complete methodologies |
| Updates | Static | Quarterly updates |
| Support | Community | Priority support (premium) |

### vs. obra/superpowers
| Domain | Superpowers | Our Library |
|--------|-------------|-------------|
| Development | ✅ Excellent | ⚠️ Not primary focus |
| AI Architecture | ❌ Not covered | ✅ 6 frameworks |
| Health & Wellness | ❌ Not covered | ✅ Complete system |
| Creative Production | ❌ Not covered | ✅ Music, video, social |
| Enterprise Oracle | ❌ Not covered | ✅ Full suite |
| Philosophy & Wisdom | ❌ Not covered | ✅ 2 unique skills |

**Complementary, not competitive.** Use superpowers for development workflows, use our library for domain expertise.

---

## 🎯 Use Cases

### For Developers
```
Free: MCP Architecture, UI/UX Design
Premium: AI Agent Development Suite ($149)
→ Build production AI agents with MCP integration and accessible UIs
```

### For Content Creators
```
Free: Social Media Strategy, Greek Philosopher, Spartan Warrior
Premium: Creative Production Bundle ($99)
→ Create music, videos, and optimized social content with discipline
```

### For Consultants
```
Free: All 5 free skills (broad expertise demo)
Premium: Complete Library ($299)
→ Domain expertise across all client industries and use cases
```

### For Enterprises (Oracle Stack)
```
Free: MCP Architecture, UI/UX Design
Premium: Oracle Enterprise Suite ($179) + AI Agent Development Suite ($149)
→ Complete Oracle Cloud + AI agent deployment solution
```

### For Personal Optimization
```
Free: Greek Philosopher, Spartan Warrior
Premium: Health & Wellness Mastery ($89)
→ Philosophy + discipline + fitness + nutrition = complete life optimization
```

---

## 📊 What You Get

### Every Skill Includes:

✅ **Core Competencies**: Comprehensive knowledge domain coverage
✅ **2025 Best Practices**: Latest research and methodologies
✅ **Frameworks & Templates**: Proven, actionable structures
✅ **Sample Interactions**: Real examples of skill in action
✅ **Integration Notes**: How skills work together
✅ **Communication Style**: Optimized for domain-appropriate responses
✅ **Response Frameworks**: Step-by-step guidance structures

### Premium Skills Also Include:

✅ **Quarterly Updates**: Latest research and best practices
✅ **Priority Support**: Email support with 24-48hr response
✅ **Commercial License**: Use in client work and products
✅ **Private Community**: Discord server with other premium users

---

## 🛠️ Installation & Setup

### System Requirements
- Claude Code or Claude AI (claude.ai)
- macOS, Linux, or WSL on Windows
- Git (for installation)

### Detailed Installation

1. **Clone the repository:**
```bash
git clone https://github.com/yourusername/claude-skills-library.git
cd claude-skills-library
```

2. **Copy free skills:**
```bash
# Create skills directory if it doesn't exist
mkdir -p ~/.claude/skills

# Copy free skills
cp -r free-skills/* ~/.claude/skills/
```

3. **Verify installation:**
```bash
ls ~/.claude/skills/
# Should show: greek-philosopher, spartan-warrior, mcp-architecture, ui-ux-design-expert
```

4. **Test a skill:**
Open Claude Code and try:
```
"Use the Greek Philosopher skill to examine my career goals"
```

### Premium Skills Installation

After purchase, you'll receive:
1. Download link for premium skills
2. License key for updates
3. Installation instructions
4. Discord community invite

---

## 🤝 Contributing

We welcome contributions to the free skills!

### How to Contribute:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/improvement`)
3. **Make your changes** (improve documentation, fix typos, add examples)
4. **Commit your changes** (`git commit -m 'Add helpful example'`)
5. **Push to the branch** (`git push origin feature/improvement`)
6. **Open a Pull Request**

### Contribution Guidelines:

- Maintain the quality and depth of existing skills
- Include examples and use cases
- Update documentation
- Test with Claude Code before submitting
- Follow existing formatting and structure

**Note:** Premium skills are not open for contributions (proprietary).

---

## 📈 Roadmap

### Q4 2025
- ✅ Launch free skill library (5 skills)
- ✅ Release premium bundles
- 🔄 Social Media Strategy skill (free) - In Progress
- 🔄 Oracle Database Expert (premium) - In Progress
- 🔄 Video Production Workflow (premium) - In Progress

### Q1 2026
- Next.js/React Expert (premium)
- Product Management Expert (premium)
- Official Claude Code Plugin support
- Anthropic Marketplace listing (if available)

### Q2 2026
- 5 new domain-specific skills
- Enterprise custom skill development service
- Certification program launch
- Community skill submissions

---

## 💬 Support & Community

### Free Support
- 📖 [Documentation](docs/)
- 💬 [GitHub Discussions](https://github.com/yourusername/claude-skills-library/discussions)
- 🐛 [Issue Tracker](https://github.com/yourusername/claude-skills-library/issues)

### Premium Support
- ✉️ Email: support@claudeskillslibrary.com (24-48hr response)
- 💬 Private Discord server
- 📞 Priority issue resolution
- 🎯 Quarterly office hours

---

## 📜 License

### Free Skills: MIT License
Free to use, modify, and distribute. See [LICENSE](LICENSE) file.

### Premium Skills: Commercial License
Premium skills include commercial license for client work. See purchase agreement for details.

---

## 🙏 Acknowledgments

Built with insights from:
- Anthropic's Claude Code best practices
- obra's superpowers library (development workflow inspiration)
- 2025 research across all domains (WCAG, nutrition science, exercise science, etc.)
- Claude Code community feedback

---

## 📧 Stay Updated

- 🌟 [Star this repo](https://github.com/yourusername/claude-skills-library) for updates
- 📬 [Newsletter](#) - New skills, tips, and updates
- 🐦 [Twitter/X](#) - Daily tips and examples
- 💼 [LinkedIn](#) - Professional updates

---

## ❓ FAQ

**Q: Are these skills compatible with claude.ai (web version)?**
A: Yes! Skills work with both Claude Code and claude.ai. Some features are optimized for Claude Code but core functionality works everywhere.

**Q: Can I use premium skills for client work?**
A: Yes, premium licenses include commercial use. You can use skills in client projects and products.

**Q: Do you offer refunds?**
A: Yes, 30-day money-back guarantee on all premium purchases if skills don't meet your expectations.

**Q: Will skills be updated?**
A: Free skills receive occasional updates. Premium skills receive quarterly updates with latest research and best practices.

**Q: Can I request custom skills?**
A: Yes! Custom skill development starts at $2,500 per skill. Contact support@claudeskillslibrary.com

**Q: How do skills compare to prompts?**
A: Skills are comprehensive expert systems (3,000-6,000 words) with frameworks, methodologies, and integration. Prompts are single-use instructions.

**Q: Do I need all the AI framework skills?**
A: No. Choose based on your stack. If you only use OpenAI, just get OpenAI AgentKit Expert. The bundle is for multi-framework work.

---

## 🚀 Get Started Now

1. **Star this repository** to stay updated
2. **Install free skills** to test quality
3. **Join the community** in Discussions
4. **Consider premium** if free skills deliver value
5. **Share with others** who might benefit

---

<div align="center">

**Made with 💙 by developers, for developers**

[⭐ Star](https://github.com/yourusername/claude-skills-library) | [🐛 Issues](https://github.com/yourusername/claude-skills-library/issues) | [💬 Discussions](https://github.com/yourusername/claude-skills-library/discussions) | [🛒 Premium](https://claudeskillslibrary.com)

</div>
