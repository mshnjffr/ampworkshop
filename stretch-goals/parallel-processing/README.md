# 🚀 Parallel Processing with Amp's Task Tool

## Objective
Learn how to use Amp's Task tool to run multiple sub-agents concurrently, dramatically speeding up development tasks that can be parallelized.

## The Challenge: CSS to Tailwind Migration
Convert 10 independent component CSS files to Tailwind utilities using parallel agents.

## Why This Exercise?
- **Real-world scenario**: CSS-to-Tailwind migration is a common modernization task
- **Perfect for parallelization**: Each component is independent
- **Measurable improvement**: Compare parallel vs sequential timing
- **Clear success criteria**: Visual appearance must remain identical

## Setup Instructions
```bash
npm install
npm run dev  # View the current app with CSS
npm run screenshot:before  # Capture baseline screenshots
```

## Files to Convert
Each component has its own isolated CSS and HTML files:
```
/components/
  ├── button/
  │   ├── button.css
  │   └── button.html
  ├── card/
  │   ├── card.css
  │   └── card.html
  ├── header/
  │   ├── header.css
  │   └── header.html
  ├── footer/
  │   ├── footer.css
  │   └── footer.html
  ├── nav/
  │   ├── nav.css
  │   └── nav.html
  ├── form/
  │   ├── form.css
  │   └── form.html
  ├── modal/
  │   ├── modal.css
  │   └── modal.html
  ├── table/
  │   ├── table.css
  │   └── table.html
  ├── sidebar/
  │   ├── sidebar.css
  │   └── sidebar.html
  └── hero/
      ├── hero.css
      └── hero.html
```

## How to Use the Task Tool

### Step 1: Understand the Task Tool
The Task tool spawns independent sub-agents that work simultaneously. Each agent:
- Has access to the same tools as Amp (read, write, search, etc.)
- Works independently without knowledge of other agents
- Returns a summary when complete

### Step 2: Launch Parallel Conversion
Use this prompt pattern to convert all components simultaneously:

```
"Use the Task tool to spawn 10 parallel agents for CSS to Tailwind conversion.

Each agent should handle one component:
- Agent 1: Convert components/button/ from CSS to Tailwind
- Agent 2: Convert components/card/ from CSS to Tailwind
- Agent 3: Convert components/header/ from CSS to Tailwind
- Agent 4: Convert components/footer/ from CSS to Tailwind
- Agent 5: Convert components/nav/ from CSS to Tailwind
- Agent 6: Convert components/form/ from CSS to Tailwind
- Agent 7: Convert components/modal/ from CSS to Tailwind
- Agent 8: Convert components/table/ from CSS to Tailwind
- Agent 9: Convert components/sidebar/ from CSS to Tailwind
- Agent 10: Convert components/hero/ from CSS to Tailwind

Each agent should:
1. Read the CSS file in their component directory
2. Convert all styles to Tailwind utility classes
3. Update the HTML file with the new Tailwind classes
4. Preserve all responsive breakpoints and hover states
5. Delete the original CSS file after conversion"
```

### Step 3: Verify Results
After all agents complete:
```bash
npm run build  # Ensure Tailwind processes all utilities
npm run screenshot:after  # Capture post-migration screenshots
npm run test:visual  # Compare before/after screenshots
```

## CSS to Tailwind Mapping Guide

Common patterns to help agents convert accurately:

| CSS Pattern | Tailwind Equivalent |
|------------|-------------------|
| `display: flex` | `flex` |
| `justify-content: center` | `justify-center` |
| `align-items: center` | `items-center` |
| `padding: 1rem` | `p-4` |
| `margin: 0 auto` | `mx-auto` |
| `background-color: #3b82f6` | `bg-blue-500` |
| `border-radius: 0.5rem` | `rounded-lg` |
| `@media (min-width: 768px)` | `md:` prefix |
| `:hover` | `hover:` prefix |

## Success Criteria
- [ ] All 10 components converted to Tailwind
- [ ] Visual regression tests pass (no styling changes)
- [ ] Build completes successfully
- [ ] Original CSS files removed
- [ ] Completion time under 15 minutes

## Measuring Performance

### Sequential Approach (Traditional):
- Convert button.css (3 min)
- Convert card.css (3 min)
- ... (8 more files × 3 min)
- **Total: ~30 minutes**

### Parallel Approach (With Task Tool):
- All 10 conversions simultaneously
- **Total: ~10-12 minutes**
- **Time saved: 60-70%**

## Tips for Success

1. **Clear Instructions**: Be specific about what each agent should do
2. **Independent Scope**: Each agent works on one component only
3. **Consistent Pattern**: All agents follow the same conversion process
4. **Trust the Process**: Let agents work independently without micromanaging

## Troubleshooting

### If agents report conflicts:
- Components are isolated, so conflicts shouldn't occur
- Check that each agent is only modifying its assigned component

### If styles don't match:
- Run `npm run build` to ensure Tailwind processes all utilities
- Check that all responsive and hover states were converted

### If build fails:
- Ensure Tailwind config includes all component paths
- Verify all CSS files were properly deleted after conversion

## Bonus Challenge (5 min)
After successful conversion, add dark mode support:
```
"Use Task tool to add dark mode support to all 10 components simultaneously. Each agent should add dark: variants for background colors, text colors, and borders."
```

## What You've Learned
- ✅ How to identify tasks suitable for parallelization
- ✅ Using the Task tool to spawn multiple agents
- ✅ Coordinating parallel work effectively
- ✅ Measuring performance improvements
- ✅ When parallel processing provides the most value

## Next Steps
This pattern works great for:
- Updating multiple test files
- Adding TypeScript to multiple JavaScript files
- Implementing consistent changes across microservices
- Refactoring multiple independent modules
