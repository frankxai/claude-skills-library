#!/usr/bin/env bash
# Stranger install walkthrough: follow ONLY the public README of frankxai/claude-skills-library
# (branch agent/hyperagent/eval-pack-rc1, "The tested pack (release candidate)") on a fresh HOME.
# Every command below runs for real; nothing is faked or hard-coded.
set -u

# Tools live in the real user's ~/.local/bin; resolve that BEFORE switching HOME.
export PATH="$HOME/.local/bin:$PATH"

# Brand-new empty HOME for this take.
STRANGER=$(mktemp -d /agent/workspace/g2-rec/home-XXXX)
mkdir -p "$STRANGER/.codex"
export HOME="$STRANGER"
export CODEX_HOME="$STRANGER/.codex"
cd "$HOME" || exit 1

BRANCH=agent/hyperagent/eval-pack-rc1
CWD='~'
p() { printf '\n\033[1;32mstranger@fresh-machine:%s$\033[0m %s\n' "$CWD" "$1"; }
note() { printf '\033[1;36m# %s\033[0m\n' "$1"; }

note "a. Where am I? A machine that has never seen this project."
p 'date -u'
date -u
echo "# exit $?"

p 'echo $HOME'
echo $HOME
echo "# exit $?"

p 'ls -A $HOME'
ls -A $HOME
echo "# exit $?"

p 'claude --version'
claude --version
echo "# exit $?"

p 'codex --version'
codex --version
echo "# exit $?"

p "git ls-remote https://github.com/frankxai/claude-skills-library refs/heads/$BRANCH"
git ls-remote https://github.com/frankxai/claude-skills-library refs/heads/$BRANCH
echo "# exit $?"

note "b. Claude Code: the tested pack, from the PUBLIC remote, exactly as the README says."
p "claude plugin marketplace add frankxai/claude-skills-library#$BRANCH"
claude plugin marketplace add frankxai/claude-skills-library#$BRANCH
echo "# exit $?"

p 'claude plugin install skills-with-evals@claude-skills-library'
claude plugin install skills-with-evals@claude-skills-library
echo "# exit $?"

p 'claude plugin details skills-with-evals@claude-skills-library'
claude plugin details skills-with-evals@claude-skills-library
echo "# exit $?"

note "c. Codex: the tested pack, as the README says."
p "codex plugin marketplace add frankxai/claude-skills-library@$BRANCH"
codex plugin marketplace add frankxai/claude-skills-library@$BRANCH
echo "# exit $?"

p 'codex plugin add skills-with-evals@claude-skills-library'
codex plugin add skills-with-evals@claude-skills-library
echo "# exit $?"

note "Model-visible skill list. OUTPUT IS FILTERED to the pack's lines (grep) and cut to 105 columns."
p "codex debug prompt-input \"Review this pull request diff before I merge it\" | sed 's/\\\\n/\\n/g' | grep -E '^- skills-with-evals:' | cut -c1-105   # FILTERED"
codex debug prompt-input "Review this pull request diff before I merge it" | sed 's/\\n/\n/g' | grep -E '^- skills-with-evals:' | cut -c1-105
echo "# exit $? (pipeline: ${PIPESTATUS[*]})"

p "codex debug prompt-input \"Review this pull request diff before I merge it\" | sed 's/\\\\n/\\n/g' | grep -c '^- skills-with-evals:'   # FILTERED count"
codex debug prompt-input "Review this pull request diff before I merge it" | sed 's/\\n/\n/g' | grep -c '^- skills-with-evals:'
echo "# exit $? (pipeline: ${PIPESTATUS[*]})"

note "d. Fresh clone, plugin validation, and the repo's own install test."
p "git clone --depth 1 --branch $BRANCH https://github.com/frankxai/claude-skills-library.git \$HOME/clone"
git clone --depth 1 --branch $BRANCH https://github.com/frankxai/claude-skills-library.git $STRANGER/clone
echo "# exit $?"

p 'cd $HOME/clone'
cd $STRANGER/clone
echo "# exit $?"
CWD='~/clone'

p 'git --no-pager log -1 --format="%H %cd" --date=iso-strict'
git --no-pager log -1 --format="%H %cd" --date=iso-strict
echo "# exit $?"

p 'claude plugin validate .'
claude plugin validate .
echo "# exit $?"

p 'node scripts/install-test.mjs'
node scripts/install-test.mjs
echo "# exit $?"

p 'date -u'
date -u
echo "# exit $?"
note "End of walkthrough. HOME was $HOME"
