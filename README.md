# Amp Workshop: Learn by Doing

Welcome to the Amp interactive workshop! This hands-on repository contains 6 core exercises and 1 stretch goal designed to teach you Amp's powerful AI coding capabilities through practical challenges.

## 🚀 Quick Setup

```bash
# Clone this repository
git clone <repository-url>
cd amp-workshop

# Verify your environment
npm run verify

# Install all dependencies (one command for everything!)
npm run setup-all
```

## 📋 Prerequisites

- **Node.js >= 18.0.0** and **npm >= 8.0.0**
- **Git**
- **Amp** (VS Code extension or CLI)
- macOS/Linux or Windows with bash

## 🗂️ Repository Structure

```
amp-workshop/
├── apps/                    # Core exercises (01-06)
│   ├── 01-hello-amp/       # Warm-up exercise
│   ├── 02-broken-todo/     # Debug a React app
│   ├── 03-mystery-codebase/# Explore unknown code
│   ├── 04-build-refactor/  # Build & refactor
│   ├── 05-test-coverage/   # Test generation
│   └── 06-automate-ui/     # Browser automation
├── stretch-goals/           # Advanced challenges
│   └── parallel-processing/ # Parallel agents
└── scripts/                 # Helper scripts
```

## 🎯 Core Exercises

### Exercise 01: Hello Amp (5 min)
**Goal:** Get comfortable with Amp basics
```bash
cd apps/01-hello-amp
npm start  # Visit http://localhost:3000
```
**Task:** Ask Amp to make the app interactive!

### Exercise 02: Broken Todo (10 min)
**Goal:** Fix bugs in a React TypeScript app
```bash
cd apps/02-broken-todo
npm start  # Fix the broken todo app
npm test   # Make all tests pass
```

### Exercise 03: Mystery Codebase (15 min)
**Goal:** Explore and understand unknown code
```bash
cd apps/03-mystery-codebase
npm start  # Discover what this API does
```
**Challenge:** Create API documentation without prior knowledge!

### Exercise 04: Build & Refactor (20 min)
**Two Parts:**
- **Part A:** Build a REST API from scratch
- **Part B:** Refactor legacy code to modern standards
```bash
cd apps/04-build-refactor/part-b-refactor
npm start  # Run the legacy app
```

### Exercise 05: Test Coverage (15 min)
**Goal:** Generate comprehensive tests to reach 80%+ coverage
```bash
cd apps/05-test-coverage
npm test              # Run tests
npm run test:coverage # Check coverage (starts at 0%)
```

### Exercise 06: Browser Automation (10 min)
**Goal:** Automate UI testing with Amp's browser tools
```bash
cd apps/06-automate-ui
npm start  # Serves on http://localhost:3000
```
**Task:** Have Amp test the form validation automatically!

## 🌟 Stretch Goal

### Parallel Processing (10-15 min)
**Goal:** Use multiple Amp agents working in parallel
```bash
cd stretch-goals/parallel-processing
```
**Challenge:** Style 10 components simultaneously using the Task tool!

## 🛠️ Useful Commands

From repository root:
```bash
npm run verify      # Check your environment
npm run setup-all   # Install all dependencies
npm run reset-all   # Reset exercises to initial state
```

From each exercise directory:
```bash
npm start           # Run the application
npm test            # Run tests
npm run dev         # Development mode (where available)
```

## 💡 Tips for Success

1. **Start Simple:** Begin with Exercise 01 and progress sequentially
2. **Read READMEs:** Each exercise has specific instructions
3. **Use Amp Actively:** Don't just fix bugs—ask Amp to explain, refactor, and improve
4. **Experiment:** Try different prompting strategies
5. **Parallel Power:** For Exercise 05 and the stretch goal, use Amp's Task tool for parallel execution

## 🎓 Workshop Flow

**Total Time: 90 minutes**
- 5 min: Introduction & Setup verification
- 85 min: Hands-on exercises
  - Exercises 1-6: 75 minutes
  - Stretch goal: 10 minutes (if time permits)

## 📚 Resources

- **Amp Manual:** https://ampcode.com/manual
- **VS Code Extension:** Search "Amp by Sourcegraph" in marketplace
- **Workshop Support:** Check AGENTS.md for project conventions

## 🚦 Getting Started

1. Open VS Code in the workshop directory
2. Start with Exercise 01
3. Open Amp chat and say: "Let's start with exercise 01"
4. Follow Amp's guidance and experiment!

---

**Remember:** The goal isn't just to complete exercises—it's to explore Amp's capabilities. Try different approaches, ask questions, and have fun learning!

## 🧰 Toolboxes (Amp CLI)

Toolboxes let Amp run small, local executables without an MCP server. This workshop includes an end-of-life checker you can call from the CLI before you start.

- Location: [`.agents/toolbox/end_of_life.py`](/amp-workshop/.agents/toolbox/end_of_life.py#L1-L200)
- Requires: Python 3 (stdlib only)

### Setup

```bash
# From the repo root
export AMP_TOOLBOX="$PWD/amp-workshop/.agents/toolbox"
# If you add new scripts, make them executable
chmod +x amp-workshop/.agents/toolbox/*
```

### Verify Node runtime status (before running exercises)

Ask Amp (CLI) to use the toolbox to check Node.js on endoflife.date, then summarize:

```bash
amp -x "Use the end_of_life toolbox to check Node.js EOL info (product: nodejs). Summarize current LTS and EOL dates and tell me if Node 18 is OK for this workshop."
```

### Monorepo-wide EOL report (optional example)

You can add a helper toolbox (workshop_eol_report.py) that scans the repo for common runtimes (nodejs, sqlite, mysql, react) and calls endoflife.date for a consolidated report.

- Suggested path: `amp-workshop/.agents/toolbox/workshop_eol_report.py`
- After adding it and making it executable, run:

```bash
amp -x "Run workshop_eol_report on this repo and summarize which products are close to EOL within 90 days."
```

Tip: Keep toolbox scripts stdlib-only and repo-local. They’re great for repeatable checks like environment validation, perf/security scans, and dev database helpers.

