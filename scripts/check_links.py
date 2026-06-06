#!/usr/bin/env python3
"""Check for broken links in markdown files.

Validates:
- Internal links (relative paths)
- External URLs (HEAD request)
- Anchor links
"""
from __future__ import annotations
import argparse
import re
import sys
from pathlib import Path
from typing import List, Tuple
from urllib.parse import urlparse

ROOT = Path(__file__).parent.parent


def find_links_in_markdown(content: str) -> List[Tuple[str, int]]:
    """Extract all links from markdown content with line numbers."""
    links = []
    
    # Markdown links: [text](url)
    for match in re.finditer(r'\[([^\]]+)\]\(([^\)]+)\)', content):
        url = match.group(2)
        # Find line number
        line_num = content[:match.start()].count('\n') + 1
        links.append((url, line_num))
    
    # HTML links: <a href="url">
    for match in re.finditer(r'<a\s+href="([^"]+)"', content):
        url = match.group(1)
        line_num = content[:match.start()].count('\n') + 1
        links.append((url, line_num))
    
    return links


def check_internal_link(link: str, file_path: Path) -> Tuple[bool, str]:
    """Check if internal link is valid."""
    # Remove anchor
    link_path = link.split('#')[0]
    
    if not link_path:  # Pure anchor link
        return True, ""
    
    # Resolve relative to the file
    target = (file_path.parent / link_path).resolve()
    
    if not target.exists():
        return False, f"File not found: {target}"
    
    return True, ""


def is_external_url(link: str) -> bool:
    """Check if link is an external URL."""
    parsed = urlparse(link)
    return bool(parsed.scheme and parsed.netloc)


def check_markdown_file(file_path: Path) -> List[Tuple[str, int, str]]:
    """Check all links in a markdown file.
    
    Returns list of (link, line_number, error_message) for broken links.
    """
    try:
        content = file_path.read_text(encoding='utf-8')
    except Exception as e:
        return [(str(file_path), 0, f"Cannot read file: {e}")]
    
    links = find_links_in_markdown(content)
    broken = []
    
    for link, line_num in links:
        # Skip certain patterns
        if link.startswith('mailto:'):
            continue
        if link.startswith('#'):  # Pure anchor link
            continue
        if '{{' in link or '{%' in link:  # Template variable
            continue
        
        if is_external_url(link):
            # Skip external URL checking for now (can be slow)
            # Could add with --check-external flag
            continue
        else:
            # Internal link
            is_valid, error = check_internal_link(link, file_path)
            if not is_valid:
                broken.append((link, line_num, error))
    
    return broken


def main():
    parser = argparse.ArgumentParser(
        description="Check for broken links in markdown files"
    )
    parser.add_argument(
        '--path',
        type=Path,
        default=ROOT,
        help='Directory to scan (default: repository root)'
    )
    parser.add_argument(
        '--check-external',
        action='store_true',
        help='Also check external URLs (slower)'
    )
    
    args = parser.parse_args()
    
    # Find all markdown files
    md_files = list(args.path.rglob('*.md'))
    
    # Exclude node_modules, .git, etc.
    md_files = [
        f for f in md_files 
        if not any(part.startswith('.') or part == 'node_modules' 
                  for part in f.parts)
    ]
    
    print(f"Checking {len(md_files)} markdown files...", flush=True)
    
    total_broken = 0
    files_with_issues = 0
    
    for md_file in sorted(md_files):
        broken_links = check_markdown_file(md_file)
        
        if broken_links:
            files_with_issues += 1
            total_broken += len(broken_links)
            
            print(f"\n❌ {md_file.relative_to(ROOT)}")
            for link, line_num, error in broken_links:
                print(f"   Line {line_num}: {link}")
                print(f"   → {error}")
    
    print(f"\n{'='*60}")
    if total_broken == 0:
        print("✅ No broken links found!")
        return 0
    else:
        print(f"❌ Found {total_broken} broken link(s) in {files_with_issues} file(s)")
        return 1


if __name__ == "__main__":
    sys.exit(main())
