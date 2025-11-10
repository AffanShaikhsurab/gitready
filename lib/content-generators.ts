// Sample generated content templates with personality

export const generateReadme = (repoName: string, language: string): string => {
  return `# ${repoName}

> Because every repo deserves a README, even the ones from 3am hackathons 🌙

## What is this?

[Describe what your project does. Be honest - if it's a calculator, say it's a calculator. The world has enough "revolutionary" calculators.]

## Why does this exist?

[Explain the problem you solved. Or the problem you're trying to solve. Or just admit you were learning ${language}.]

## How do I use it?

\`\`\`bash
# Clone this bad boy
git clone https://github.com/yourusername/${repoName}.git

# Install dependencies (you know the drill)
npm install

# Run it (fingers crossed)
npm start
\`\`\`

## Tech Stack

- ${language}
- [Add other technologies]
- Coffee ☕
- Stack Overflow 🙏

## Contributing

Found a bug? Want to add a feature? PRs are welcome!

Just remember:
1. Fork it
2. Create your feature branch (\`git checkout -b feature/amazing\`)
3. Commit your changes (\`git commit -m 'Add amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing\`)
5. Open a Pull Request

## License

MIT - Do whatever you want, but don't blame me if it breaks 😅

---

**Made with ❤️ and way too much caffeine**
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
