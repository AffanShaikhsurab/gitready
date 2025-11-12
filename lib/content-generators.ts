// Sample generated content templates with personality

export const generateReadme = (repoName: string, language: string): string => {
  return `# ${repoName}

## Overview

${repoName} is a ${language}-based project. Use this README to understand the goals, setup, and maintenance workflow.

## Features

- Clear project structure and predictable scripts
- Environment-driven configuration
- Testing baseline and CI-ready pipeline

## Requirements

- ${language}
- Node.js 18+ and npm (or your language-specific toolchain)

## Installation

\`\`\`bash
git clone https://github.com/<your-github>/${repoName}.git
cd ${repoName}
npm install
\`\`\`

## Usage

\`\`\`bash
# Development
npm run dev

# Production build
npm run build

# Start
npm start
\`\`\`

## Configuration

Create a \`.env.local\` file and set required variables. Keep secrets out of source control.

## Testing

\`\`\`bash
npm test
\`\`\`

Add tests under \`tests/\` and follow the project conventions.

## Continuous Integration

This repository is compatible with GitHub Actions. A starter workflow runs install, lint, tests, and build.

## Project Structure

\`\`\`
src/            # Application source
tests/          # Test files
.github/workflows/ci.yml  # CI pipeline
\`\`\`

## Contributing

1. Fork the repository
2. Create a feature branch: \`git checkout -b feature/your-change\`
3. Commit with clear messages
4. Open a Pull Request describing the change and impact

## License

MIT
`
}

export interface ReadmeDetails {
  repoName: string
  language: string
  description?: string | null
  frameworks?: string[]
  usesTypeScript?: boolean
  hasTests?: boolean
  hasCI?: boolean
  topics?: string[]
  packageManager?: 'npm' | 'yarn' | 'pnpm' | 'bun' | 'pip' | 'poetry' | 'pipenv' | 'unknown'
  scripts?: {
    dev?: string
    build?: string
    start?: string
    test?: string
    lint?: string
  }
  structure?: string[]
}

export const generateReadmeProfessional = (d: ReadmeDetails): string => {
  const pm = d.packageManager || 'npm'
  const run = (script?: string) => (script ? `${pm} run ${script}` : `${pm} run <script>`)
  const hasScript = (name: keyof NonNullable<ReadmeDetails['scripts']>) => !!d.scripts && !!d.scripts[name]

  const techStack: string[] = []
  if (d.language) techStack.push(d.language)
  if (d.usesTypeScript) techStack.push('TypeScript')
  if (d.frameworks && d.frameworks.length) techStack.push(...d.frameworks)

  const features: string[] = []
  if (d.usesTypeScript) features.push('Type-safe code with TypeScript')
  if (hasScript('lint')) features.push('Consistent code style with linting')
  if (d.hasTests) features.push('Test baseline in place')
  if (d.hasCI) features.push('CI pipeline for build/test checks')
  if (features.length === 0) features.push('Clean project structure and straightforward scripts')

  const structure = (d.structure && d.structure.length) ? d.structure : ['src/', 'tests/', '.github/workflows/']

  const scriptsHelp: string[] = []
  if (hasScript('dev')) scriptsHelp.push(`Development: \`${run(d.scripts?.dev)}\``)
  if (hasScript('build')) scriptsHelp.push(`Build: \`${run(d.scripts?.build)}\``)
  if (hasScript('start')) scriptsHelp.push(`Start: \`${run(d.scripts?.start)}\``)
  if (hasScript('test')) scriptsHelp.push(`Test: \`${pm === 'pip' ? 'pytest' : run(d.scripts?.test)}\``)
  if (hasScript('lint')) scriptsHelp.push(`Lint: \`${run(d.scripts?.lint)}\``)

  const usageBlock = scriptsHelp.length
    ? scriptsHelp.map((l) => `- ${l}`).join('\n')
    : `- Development: \`${pm} run dev\`\n- Build: \`${pm} run build\`\n- Start: \`${pm} start\`\n- Test: \`${pm} test\``

  const pmInstall = pm === 'yarn' ? 'yarn' : pm === 'pnpm' ? 'pnpm install' : pm === 'bun' ? 'bun install' : pm === 'pip' ? 'pip install -r requirements.txt' : 'npm install'

  const desc = d.description ? `\n${d.description}\n` : ''

  return `# ${d.repoName}

## Overview

${d.repoName} is a ${techStack.join(', ')} project.${desc} This README covers goals, setup, usage, and maintenance in a concise, professional format.

## Tech Stack

- ${techStack.join('\n- ')}
${d.topics && d.topics.length ? `\n> Topics: ${d.topics.join(', ')}` : ''}

## Features

${features.map((f) => `- ${f}`).join('\n')}

## Requirements

- Node.js 18+${d.language.toLowerCase() === 'python' ? ' (if applicable)' : ''}
- ${pm.toUpperCase()} or preferred package manager

## Installation

\`\`\`bash
git clone https://github.com/<your-github>/${d.repoName}.git
cd ${d.repoName}
${pmInstall}
\`\`\`

## Usage

${usageBlock}

## Project Structure

\`\`\`
${structure.join('\n')}
\`\`\`

## Testing

${d.hasTests ? 'This repository includes a test baseline.' : 'Add tests under `tests/` (or your framework convention) to establish coverage.'}

${hasScript('test') ? `Run tests with \`${run(d.scripts?.test)}\`.` : ''}

## Continuous Integration

${d.hasCI ? 'GitHub Actions workflows are configured under `.github/workflows`.' : 'You can add GitHub Actions workflows under `.github/workflows` to run install, lint, tests, and build on every push.'}

## Contributing

1. Fork the repository
2. Create a feature branch: \`git checkout -b feature/your-change\`
3. Commit with clear messages
4. Open a Pull Request describing the change and impact

## License

MIT
`
}

export const generateTests = (repoName: string, language: string): string => {
  const templates: Record<string, string> = {
    JavaScript: `// ${repoName}/tests/example.test.js
const { expect } = require('chai');

describe('Example Test Suite', () => {
  it('should pass this basic test', () => {
    expect(true).to.be.true;
  });

  it('should actually test something useful', () => {
    // TODO: Write actual tests
    // (Yes, we see you committing TODOs)
    expect(1 + 1).to.equal(2);
  });
});`,
    TypeScript: `// ${repoName}/tests/example.test.ts
import { describe, it, expect } from 'vitest';

describe('Example Test Suite', () => {
  it('should pass this basic test', () => {
    expect(true).toBe(true);
  });

  it('should actually test something useful', () => {
    // TODO: Write actual tests
    expect(1 + 1).toBe(2);
  });
});`,
    Python: `# ${repoName}/tests/test_example.py
import pytest

def test_basic():
    """This test always passes. You're welcome."""
    assert True

def test_something_useful():
    """TODO: Write actual tests"""
    assert 1 + 1 == 2`,
  }

  return templates[language] || templates.JavaScript
}

export const generateCI = (repoName: string): string => {
  return `# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'

    - name: Install dependencies
      run: npm ci

    - name: Run linter
      run: npm run lint

    - name: Run tests
      run: npm test

    - name: Build project
      run: npm run build

# Pro tip: Add this to your repo to show recruiters you care about quality 😎
`
}

export const generateProfileReadme = (username: string, topLanguage: string): string => {
  return `# Hi there, I'm ${username}! 👋

## 🚀 About Me

[Write something interesting about yourself. No, "passionate developer" doesn't count. Everyone says that.]

## 💻 Tech Stack

- **Languages**: ${topLanguage}, [add more]
- **Frameworks**: [React? Vue? Angular? Django? Express?]
- **Tools**: Git, VS Code, Stack Overflow Premium™

## 🔭 What I'm working on

[Current projects go here. Bonus points if they're not all TODO lists]

## 📊 GitHub Stats

![${username}'s GitHub stats](https://github-readme-stats.vercel.app/api?username=${username}&show_icons=true&theme=radical)

## 📫 How to reach me

- Email: [your.email@example.com]
- LinkedIn: [your-linkedin]
- Twitter: [@yourhandle]

---

💡 **Fun fact**: [Add something quirky. Like "I once debugged a problem for 3 hours. It was a missing semicolon."]

⚡ **Currently learning**: [Be honest - we're all always learning something]

🎯 **2024 Goals**: [Ship more code, write more tests, drink less coffee (just kidding)]
`
}
