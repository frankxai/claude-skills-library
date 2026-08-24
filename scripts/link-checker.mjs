import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { URL } from 'url';

const repos = [
    "C:/Users/frank/starlight/repos/awesome-agent-operating-systems/README.md",
    "C:/Users/frank/starlight/repos/awesome-agentic-income/README.md",
    "C:/Users/frank/starlight/repos/awesome-ai-coe/README.md",
    "C:/Users/frank/starlight/repos/awesome-automation-agent-skills/README.md",
    "C:/Users/frank/starlight/repos/awesome-cosmos-ai-agents/README.md",
    "C:/Users/frank/starlight/repos/awesome-design-agent-skills/README.md",
    "C:/Users/frank/starlight/repos/awesome-gamification-agent-skills/README.md",
    "C:/Users/frank/starlight/repos/awesome-hermes-agents/README.md",
    "C:/Users/frank/awesome-hermes-agents/README.md",
    "C:/Users/frank/starlight/repos/awesome-investor-agent-skills/README.md",
    "C:/Users/frank/starlight/repos/awesome-motion-design-agent-skills/README.md",
    "C:/Users/frank/starlight/repos/awesome-sustainability-agent-skills/README.md",
    "C:/Users/frank/starlight/repos/awesome-wealth-agent-skills/README.md",
    "C:/Users/frank/repos/awesome-suno-agent-skills/README.md",
    "C:/Users/frank/mind-intelligence-swarm/awesome-mind-agent-skills/README.md"
];

const urlRegex = /https?:\/\/[^\s)\]"';,]+/g;

function checkUrl(targetUrl) {
    return new Promise((resolve) => {
        let parsedUrl;
        try {
            parsedUrl = new URL(targetUrl);
        } catch (e) {
            resolve({ url: targetUrl, status: 'INVALID_URL', error: e.message });
            return;
        }

        const client = parsedUrl.protocol === 'https:' ? https : http;
        const options = {
            method: 'HEAD',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 5000
        };

        const request = client.request(targetUrl, options, (res) => {
            if (res.statusCode >= 200 && res.statusCode < 400) {
                resolve({ url: targetUrl, status: 'OK', code: res.statusCode });
            } else if (res.statusCode === 405 || res.statusCode === 403) {
                // If HEAD method is not allowed or forbidden, retry with GET
                options.method = 'GET';
                const getReq = client.request(targetUrl, options, (getRes) => {
                    if (getRes.statusCode >= 200 && getRes.statusCode < 400) {
                        resolve({ url: targetUrl, status: 'OK', code: getRes.statusCode });
                    } else {
                        resolve({ url: targetUrl, status: 'FAIL', code: getRes.statusCode });
                    }
                });
                getReq.on('error', (err) => resolve({ url: targetUrl, status: 'ERROR', error: err.message }));
                getReq.on('timeout', () => {
                    getReq.destroy();
                    resolve({ url: targetUrl, status: 'TIMEOUT' });
                });
                getReq.end();
            } else {
                resolve({ url: targetUrl, status: 'FAIL', code: res.statusCode });
            }
        });

        request.on('error', (err) => {
            resolve({ url: targetUrl, status: 'ERROR', error: err.message });
        });

        request.on('timeout', () => {
            request.destroy();
            resolve({ url: targetUrl, status: 'TIMEOUT' });
        });

        request.end();
    });
}

async function run() {
    console.log("Starting Link Checker across awesome repositories...\n");
    const allUrls = new Set();
    const repoUrls = {};

    repos.forEach(repoPath => {
        if (!fs.existsSync(repoPath)) {
            console.warn(`[WARNING] Repository file not found: ${repoPath}`);
            return;
        }
        const content = fs.readFileSync(repoPath, 'utf-8');
        let match;
        repoUrls[repoPath] = [];
        while ((match = urlRegex.exec(content)) !== null) {
            let cleanUrl = match[0];
            // Remove trailing dot if it's a punctuation
            if (cleanUrl.endsWith('.')) {
                cleanUrl = cleanUrl.slice(0, -1);
            }
            allUrls.add(cleanUrl);
            repoUrls[repoPath].push(cleanUrl);
        }
    });

    console.log(`Found ${allUrls.size} unique URLs to verify.\n`);

    const urlArray = Array.from(allUrls);
    const urlResults = {};
    
    // Process URLs in batches of 10 to avoid socket resource exhaustion
    const batchSize = 10;
    for (let i = 0; i < urlArray.length; i += batchSize) {
        const batch = urlArray.slice(i, i + batchSize);
        console.log(`Checking URLs ${i + 1} to ${Math.min(i + batchSize, urlArray.length)}...`);
        const promises = batch.map(url => checkUrl(url).then(res => {
            urlResults[url] = res;
        }));
        await Promise.all(promises);
    }

    console.log("\n========================================");
    console.log("Broken or Suspicious Links Report:");
    console.log("========================================\n");

    let brokenCount = 0;
    
    repos.forEach(repoPath => {
        if (!repoUrls[repoPath] || repoUrls[repoPath].length === 0) return;
        const filename = path.basename(repoPath);
        const dirname = path.basename(path.dirname(repoPath));
        const displayName = `${dirname}/${filename}`;
        
        let repoHasIssues = false;
        
        repoUrls[repoPath].forEach(url => {
            const res = urlResults[url];
            if (res && res.status !== 'OK') {
                if (!repoHasIssues) {
                    console.log(`Repo: ${displayName}`);
                    repoHasIssues = true;
                }
                console.log(`  - [${res.status}] ${url} (Code: ${res.code || 'N/A'}, Error: ${res.error || 'None'})`);
                brokenCount++;
            }
        });
    });

    console.log("\n========================================");
    console.log(`Link Verification Complete. Total Issues Found: ${brokenCount}`);
    console.log("========================================");
}

run();
