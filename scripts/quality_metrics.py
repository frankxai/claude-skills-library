#!/usr/bin/env python3
"""Generate quality metrics for all skills in the library.

Calculates comprehensive quality scores based on:
- Completeness (has examples, tests, references)
- Depth (word count, sections, code blocks)
- Readability (structure, formatting)
- Documentation quality
- Maintenance indicators (recent updates)

Usage:
    python3 scripts/quality_metrics.py
    python3 scripts/quality_metrics.py --output metrics.json
    python3 scripts/quality_metrics.py --format markdown
"""
from __future__ import annotations
import argparse
import json
import os
import re
from datetime import datetime
from pathlib import Path
from typing import Dict, List

ROOT = Path(__file__).parent.parent / "free-skills"

FM_RE = re.compile(r"^\ufeff?---\s*\n(.*?)\n?---", re.S)


class SkillQualityAnalyzer:
    """Analyze and score skill quality."""
    
    def __init__(self, skill_path: Path):
        self.skill_path = skill_path
        self.skill_name = skill_path.name
        self.skill_md = skill_path / "SKILL.md"
        
        if not self.skill_md.exists():
            raise FileNotFoundError(f"SKILL.md not found in {skill_path}")
        
        self.content = self.skill_md.read_text(encoding='utf-8', errors='ignore')
        self.frontmatter = self._parse_frontmatter()
    
    def _parse_frontmatter(self) -> Dict:
        """Extract YAML frontmatter."""
        m = FM_RE.match(self.content)
        if not m:
            return {}
        
        fm = {}
        for line in m.group(1).splitlines():
            kv = re.match(r"^([A-Za-z_]+):\s*(.*)$", line)
            if kv:
                fm[kv.group(1)] = kv.group(2).strip().strip('"')
        return fm
    
    def calculate_metrics(self) -> Dict:
        """Calculate comprehensive quality metrics."""
        return {
            "name": self.skill_name,
            "frontmatter_name": self.frontmatter.get("name", ""),
            "completeness": self._score_completeness(),
            "depth": self._score_depth(),
            "readability": self._score_readability(),
            "documentation": self._score_documentation(),
            "overall_score": 0.0,  # Calculated after
            "components": self._list_components(),
            "stats": self._calculate_stats(),
        }
    
    def _score_completeness(self) -> float:
        """Check for all recommended components (0-1 scale)."""
        score = 0.0
        components = {
            "SKILL.md": 0.30,
            "examples": 0.25,
            "references": 0.20,
            "tests": 0.15,
            "README.md": 0.10,
        }
        
        for component, weight in components.items():
            component_path = self.skill_path / component
            if component_path.exists():
                # For directories, check if they contain files
                if component_path.is_dir():
                    if any(component_path.iterdir()):
                        score += weight
                else:
                    score += weight
        
        return round(score, 2)
    
    def _score_depth(self) -> float:
        """Measure content depth (0-1 scale)."""
        # Remove frontmatter for content analysis
        content = FM_RE.sub('', self.content)
        
        words = len(content.split())
        sections = len(re.findall(r'^#{1,4}\s+\w', content, re.MULTILINE))
        code_blocks = len(re.findall(r'```', content)) // 2
        lists = len(re.findall(r'^\s*[-*]\s', content, re.MULTILINE))
        
        depth_score = 0.0
        
        # Word count scoring (40%)
        if words > 5000:
            depth_score += 0.40
        elif words > 3000:
            depth_score += 0.30
        elif words > 1500:
            depth_score += 0.20
        elif words > 500:
            depth_score += 0.10
        
        # Sections scoring (30%)
        if sections > 15:
            depth_score += 0.30
        elif sections > 10:
            depth_score += 0.20
        elif sections > 5:
            depth_score += 0.10
        
        # Code blocks scoring (20%)
        if code_blocks > 10:
            depth_score += 0.20
        elif code_blocks > 5:
            depth_score += 0.15
        elif code_blocks > 2:
            depth_score += 0.10
        
        # Lists scoring (10%)
        if lists > 20:
            depth_score += 0.10
        elif lists > 10:
            depth_score += 0.05
        
        return round(min(depth_score, 1.0), 2)
    
    def _score_readability(self) -> float:
        """Score structure and formatting (0-1 scale)."""
        content = FM_RE.sub('', self.content)
        score = 0.0
        
        # Has clear sections
        if re.search(r'^## ', content, re.MULTILINE):
            score += 0.25
        
        # Has subsections
        if re.search(r'^### ', content, re.MULTILINE):
            score += 0.15
        
        # Has code examples
        if '```' in content:
            score += 0.20
        
        # Has lists for organization
        if re.search(r'^\s*[-*]\s', content, re.MULTILINE):
            score += 0.15
        
        # Has blockquotes or callouts
        if re.search(r'^>\s', content, re.MULTILINE):
            score += 0.10
        
        # Good paragraph structure (not too long)
        paragraphs = [p for p in content.split('\n\n') if p.strip()]
        if paragraphs:
            avg_para_length = sum(len(p.split()) for p in paragraphs) / len(paragraphs)
            if 30 < avg_para_length < 150:
                score += 0.15
        
        return round(min(score, 1.0), 2)
    
    def _score_documentation(self) -> float:
        """Score documentation quality (0-1 scale)."""
        score = 0.0
        
        # Has description in frontmatter
        if self.frontmatter.get('description'):
            desc = self.frontmatter['description']
            if len(desc) > 50:  # Meaningful description
                score += 0.30
            else:
                score += 0.15
        
        # Has version
        if self.frontmatter.get('version'):
            score += 0.20
        
        # Has README
        if (self.skill_path / "README.md").exists():
            score += 0.20
        
        # Has examples directory with content
        examples_dir = self.skill_path / "examples"
        if examples_dir.exists() and any(examples_dir.iterdir()):
            score += 0.15
        
        # Has references directory with content
        refs_dir = self.skill_path / "references"
        if refs_dir.exists() and any(refs_dir.iterdir()):
            score += 0.15
        
        return round(min(score, 1.0), 2)
    
    def _list_components(self) -> Dict[str, bool]:
        """List which components exist."""
        return {
            "skill_md": self.skill_md.exists(),
            "readme": (self.skill_path / "README.md").exists(),
            "examples": (self.skill_path / "examples").exists() 
                       and any((self.skill_path / "examples").iterdir()),
            "references": (self.skill_path / "references").exists()
                         and any((self.skill_path / "references").iterdir()),
            "tests": (self.skill_path / "tests").exists()
                    and any((self.skill_path / "tests").iterdir()),
            "scripts": (self.skill_path / "scripts").exists()
                      and any((self.skill_path / "scripts").iterdir()),
        }
    
    def _calculate_stats(self) -> Dict:
        """Calculate basic statistics."""
        content = FM_RE.sub('', self.content)
        
        return {
            "total_words": len(content.split()),
            "total_lines": len(content.splitlines()),
            "sections": len(re.findall(r'^#{1,4}\s+\w', content, re.MULTILINE)),
            "code_blocks": len(re.findall(r'```', content)) // 2,
            "lists": len(re.findall(r'^\s*[-*]\s', content, re.MULTILINE)),
            "file_size_kb": round(len(self.content.encode('utf-8')) / 1024, 2),
        }


def analyze_all_skills() -> List[Dict]:
    """Analyze all skills in the library."""
    results = []
    
    for skill_dir in sorted(ROOT.glob("*")):
        if not skill_dir.is_dir():
            continue
        
        # Skip hidden directories and special cases
        if skill_dir.name.startswith('.'):
            continue
        
        skill_md = skill_dir / "SKILL.md"
        if not skill_md.exists():
            # Check subdirectories (e.g., anthropic/)
            for subdir in skill_dir.glob("*/SKILL.md"):
                try:
                    analyzer = SkillQualityAnalyzer(subdir.parent)
                    metrics = analyzer.calculate_metrics()
                    results.append(metrics)
                except Exception as e:
                    print(f"Warning: Failed to analyze {subdir.parent}: {e}")
        else:
            try:
                analyzer = SkillQualityAnalyzer(skill_dir)
                metrics = analyzer.calculate_metrics()
                results.append(metrics)
            except Exception as e:
                print(f"Warning: Failed to analyze {skill_dir}: {e}")
    
    # Calculate overall scores
    for result in results:
        overall = (
            result['completeness'] * 0.30 +
            result['depth'] * 0.30 +
            result['readability'] * 0.20 +
            result['documentation'] * 0.20
        )
        result['overall_score'] = round(overall, 2)
    
    return results


def generate_report(results: List[Dict], format: str = 'text') -> str:
    """Generate quality report in specified format."""
    
    if format == 'json':
        return json.dumps({
            "generated_at": datetime.now().isoformat(),
            "total_skills": len(results),
            "skills": results,
            "summary": _calculate_summary(results),
        }, indent=2)
    
    elif format == 'markdown':
        return _generate_markdown_report(results)
    
    else:  # text
        return _generate_text_report(results)


def _calculate_summary(results: List[Dict]) -> Dict:
    """Calculate summary statistics."""
    if not results:
        return {}
    
    scores = [r['overall_score'] for r in results]
    
    return {
        "average_score": round(sum(scores) / len(scores), 2),
        "median_score": round(sorted(scores)[len(scores) // 2], 2),
        "highest_score": max(scores),
        "lowest_score": min(scores),
        "skills_with_examples": sum(1 for r in results if r['components']['examples']),
        "skills_with_tests": sum(1 for r in results if r['components']['tests']),
        "skills_with_references": sum(1 for r in results if r['components']['references']),
        "total_words": sum(r['stats']['total_words'] for r in results),
        "average_words_per_skill": round(sum(r['stats']['total_words'] for r in results) / len(results)),
    }


def _generate_text_report(results: List[Dict]) -> str:
    """Generate plain text report."""
    summary = _calculate_summary(results)
    
    lines = [
        "=" * 80,
        "CLAUDE SKILLS LIBRARY - QUALITY METRICS REPORT",
        "=" * 80,
        f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        f"Total Skills: {len(results)}",
        "",
        "SUMMARY STATISTICS",
        "-" * 80,
        f"Average Quality Score: {summary['average_score']:.2f}/1.00",
        f"Median Quality Score:  {summary['median_score']:.2f}/1.00",
        f"Highest Score:         {summary['highest_score']:.2f}/1.00",
        f"Lowest Score:          {summary['lowest_score']:.2f}/1.00",
        "",
        f"Skills with Examples:   {summary['skills_with_examples']} ({summary['skills_with_examples']/len(results)*100:.1f}%)",
        f"Skills with Tests:      {summary['skills_with_tests']} ({summary['skills_with_tests']/len(results)*100:.1f}%)",
        f"Skills with References: {summary['skills_with_references']} ({summary['skills_with_references']/len(results)*100:.1f}%)",
        "",
        f"Total Words: {summary['total_words']:,}",
        f"Average Words per Skill: {summary['average_words_per_skill']:,}",
        "",
        "TOP 10 SKILLS BY QUALITY SCORE",
        "-" * 80,
    ]
    
    # Sort by overall score
    top_skills = sorted(results, key=lambda x: x['overall_score'], reverse=True)[:10]
    
    for i, skill in enumerate(top_skills, 1):
        lines.append(
            f"{i:2}. {skill['name']:40} {skill['overall_score']:.2f}  "
            f"[C:{skill['completeness']:.2f} D:{skill['depth']:.2f} "
            f"R:{skill['readability']:.2f} Doc:{skill['documentation']:.2f}]"
        )
    
    lines.extend([
        "",
        "SKILLS NEEDING IMPROVEMENT (Score < 0.50)",
        "-" * 80,
    ])
    
    low_skills = [s for s in results if s['overall_score'] < 0.50]
    if low_skills:
        for skill in sorted(low_skills, key=lambda x: x['overall_score']):
            lines.append(
                f"- {skill['name']:40} {skill['overall_score']:.2f}  "
                f"Issues: "
                + (", ".join([
                    k for k, v in skill['components'].items() 
                    if not v and k in ['examples', 'tests', 'references']
                ]) or "Low content depth")
            )
    else:
        lines.append("✅ All skills have quality score ≥ 0.50")
    
    lines.extend(["", "=" * 80])
    
    return "\n".join(lines)


def _generate_markdown_report(results: List[Dict]) -> str:
    """Generate markdown report."""
    summary = _calculate_summary(results)
    
    lines = [
        "# 📊 Claude Skills Library - Quality Metrics Report",
        "",
        f"**Generated**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}  ",
        f"**Total Skills**: {len(results)}",
        "",
        "## Summary Statistics",
        "",
        f"- **Average Quality Score**: {summary['average_score']:.2f}/1.00",
        f"- **Median Quality Score**: {summary['median_score']:.2f}/1.00",
        f"- **Highest Score**: {summary['highest_score']:.2f}/1.00",
        f"- **Lowest Score**: {summary['lowest_score']:.2f}/1.00",
        "",
        f"- **Skills with Examples**: {summary['skills_with_examples']} ({summary['skills_with_examples']/len(results)*100:.1f}%)",
        f"- **Skills with Tests**: {summary['skills_with_tests']} ({summary['skills_with_tests']/len(results)*100:.1f}%)",
        f"- **Skills with References**: {summary['skills_with_references']} ({summary['skills_with_references']/len(results)*100:.1f}%)",
        "",
        f"- **Total Words**: {summary['total_words']:,}",
        f"- **Average Words per Skill**: {summary['average_words_per_skill']:,}",
        "",
        "## 🏆 Top 10 Skills by Quality Score",
        "",
        "| Rank | Skill | Score | Completeness | Depth | Readability | Documentation |",
        "|------|-------|-------|--------------|-------|-------------|---------------|",
    ]
    
    top_skills = sorted(results, key=lambda x: x['overall_score'], reverse=True)[:10]
    
    for i, skill in enumerate(top_skills, 1):
        medal = "🥇" if i == 1 else "🥈" if i == 2 else "🥉" if i == 3 else f"{i}."
        lines.append(
            f"| {medal} | `{skill['name']}` | **{skill['overall_score']:.2f}** | "
            f"{skill['completeness']:.2f} | {skill['depth']:.2f} | "
            f"{skill['readability']:.2f} | {skill['documentation']:.2f} |"
        )
    
    lines.extend([
        "",
        "## 🔧 Skills Needing Improvement (Score < 0.50)",
        "",
    ])
    
    low_skills = [s for s in results if s['overall_score'] < 0.50]
    if low_skills:
        lines.append("| Skill | Score | Missing Components |")
        lines.append("|-------|-------|--------------------|")
        for skill in sorted(low_skills, key=lambda x: x['overall_score']):
            missing = [
                k for k, v in skill['components'].items() 
                if not v and k in ['examples', 'tests', 'references']
            ]
            lines.append(
                f"| `{skill['name']}` | {skill['overall_score']:.2f} | "
                f"{', '.join(missing) or 'Low depth'} |"
            )
    else:
        lines.append("✅ All skills have quality score ≥ 0.50")
    
    lines.extend([
        "",
        "## 📈 Score Distribution",
        "",
        f"- **0.80-1.00 (Excellent)**: {sum(1 for s in results if s['overall_score'] >= 0.80)} skills",
        f"- **0.60-0.79 (Good)**: {sum(1 for s in results if 0.60 <= s['overall_score'] < 0.80)} skills",
        f"- **0.40-0.59 (Fair)**: {sum(1 for s in results if 0.40 <= s['overall_score'] < 0.60)} skills",
        f"- **0.00-0.39 (Needs Work)**: {sum(1 for s in results if s['overall_score'] < 0.40)} skills",
        "",
    ])
    
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(
        description="Generate quality metrics for Claude Skills Library"
    )
    parser.add_argument(
        '--output', '-o',
        help='Output file path (default: stdout)'
    )
    parser.add_argument(
        '--format', '-f',
        choices=['text', 'json', 'markdown'],
        default='text',
        help='Output format (default: text)'
    )
    
    args = parser.parse_args()
    
    print("Analyzing skills...", flush=True)
    results = analyze_all_skills()
    
    print(f"Analyzed {len(results)} skills", flush=True)
    
    report = generate_report(results, format=args.format)
    
    if args.output:
        Path(args.output).write_text(report)
        print(f"Report written to {args.output}")
    else:
        print(report)


if __name__ == "__main__":
    main()
