import fs from 'fs';
import path from 'path';

const skillsDir = 'C:/Users/frank/starlight/repos/claude-skills-library/free-skills';

if (!fs.existsSync(skillsDir)) {
    console.error(`Error: Skills directory not found at ${skillsDir}`);
    process.exit(1);
}

const folders = fs.readdirSync(skillsDir).filter(name => {
    return fs.statSync(path.join(skillsDir, name)).isDirectory();
});

console.log(`Found ${folders.length} skills to validate under free-skills/...\n`);

let passedCount = 0;
let failedCount = 0;
const results = [];

folders.forEach(folder => {
    const skillPath = path.join(skillsDir, folder, 'SKILL.md');
    if (!fs.existsSync(skillPath)) {
        console.warn(`[WARNING] Skill ${folder} has no SKILL.md`);
        results.push({ name: folder, status: 'MISSING_SKILL_MD', errors: ['SKILL.md file not found'] });
        failedCount++;
        return;
    }

    const content = fs.readFileSync(skillPath, 'utf-8');
    const lines = content.split(/\r?\n/);
    const errors = [];
    const warnings = [];

    // 1. Validate YAML Frontmatter
    let hasFrontmatter = false;
    let frontmatterData = {};
    if (lines[0] && lines[0].trim() === '---') {
        let closingIndex = -1;
        for (let i = 1; i < lines.length; i++) {
            if (lines[i] && lines[i].trim() === '---') {
                closingIndex = i;
                break;
            }
        }
        if (closingIndex > -1) {
            hasFrontmatter = true;
            const frontmatterLines = lines.slice(1, closingIndex);
            frontmatterLines.forEach(line => {
                const colonIdx = line.indexOf(':');
                if (colonIdx > -1) {
                    const key = line.substring(0, colonIdx).trim();
                    const value = line.substring(colonIdx + 1).trim().replace(/^["']|["']$/g, '');
                    frontmatterData[key] = value;
                }
            });
        }
    }

    if (!hasFrontmatter) {
        errors.push('Missing valid YAML frontmatter (starts/ends with ---)');
    } else {
        if (!frontmatterData.name) {
            errors.push('Frontmatter missing required field: name');
        }
        if (!frontmatterData.description) {
            errors.push('Frontmatter missing required field: description');
        }
    }

    // 2. Validate File Length (Progressive Disclosure warning)
    if (lines.length > 800) {
        warnings.push(`File is long (${lines.length} lines). Recommend splitting or truncating below 800 lines to preserve context.`);
    }

    // 3. Scan for potential hardcoded credentials / secrets
    const secretRegexes = [
        /sk-[a-zA-Z0-9]{32,}/i,               // OpenAI API Keys
        /AIzaSy[a-zA-Z0-9_-]{33}/i,           // Google API Keys
        /ghp_[a-zA-Z0-9]{36,}/i,              // GitHub Tokens
        /password\s*[:=]\s*['"][^\s'"]{6,}['"]/i, // Plain password assignment
        /api[-_]?key\s*[:=]\s*['"][a-zA-Z0-9_-]{16,}['"]/i // Generic API Key assignment
    ];

    lines.forEach((line, idx) => {
        secretRegexes.forEach(regex => {
            if (regex.test(line)) {
                errors.push(`Potential credential/secret detected on line ${idx + 1}: "${line.trim()}"`);
            }
        });
    });

    // 4. Verify no broken code blocks
    let insideCodeBlock = false;
    lines.forEach((line, idx) => {
        if (line.trim().startsWith('```')) {
            insideCodeBlock = !insideCodeBlock;
        }
    });
    if (insideCodeBlock) {
        errors.push('Unclosed code block (```) detected at the end of the file.');
    }

    // 5. Output results
    if (errors.length === 0) {
        console.log(`[PASS] ${folder} (${frontmatterData.name || 'Unnamed'})`);
        if (warnings.length > 0) {
            warnings.forEach(w => console.log(`       - [WARN] ${w}`));
        }
        passedCount++;
        results.push({ name: folder, status: 'PASS', warnings });
    } else {
        console.log(`[FAIL] ${folder}`);
        errors.forEach(e => console.log(`       - [ERROR] ${e}`));
        if (warnings.length > 0) {
            warnings.forEach(w => console.log(`       - [WARN] ${w}`));
        }
        failedCount++;
        results.push({ name: folder, status: 'FAIL', errors, warnings });
    }
});

console.log(`\n========================================`);
console.log(`Validation Summary:`);
console.log(`- Total Checked: ${folders.length}`);
console.log(`- Passed: ${passedCount}`);
console.log(`- Failed: ${failedCount}`);
console.log(`========================================`);

if (failedCount > 0) {
    process.exit(1);
} else {
    process.exit(0);
}
