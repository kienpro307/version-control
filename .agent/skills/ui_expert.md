---
name: UI/UX Expert
description: Expert UI/UX design reasoning based on the UI UX Pro Max dataset.
---

# UI/UX Expert Skill

This skill allows the agent to act as a **UI/UX Expert** by applying the "UI UX Pro Max" reasoning rules.

## Data Source
The data for this skill is located in `.agent/skills/ui_ux_data/`.
Key files:
- `ui-reasoning.csv`: The core logic mapping project types to design systems.
- `styles.csv`: Detailed CSS/Tailwind specs for each style (e.g., Glassmorphism, Dark Mode).
- `colors.csv`: Curated color palettes.
- `typography.csv`: Font pairings.

## How to Use

### 1. Identify the Project Type
When the user asks for UI work, first determine the **UI Category** from `ui-reasoning.csv`.
For this project (`my-version-manager`), the matching category is **Rule #91: Developer Tool/IDE**.

### 2. Apply the Rules (Rule #91)
- **Style Priority**: Dark Mode (OLED) + Minimalism.
  - *Ref*: Check `styles.csv` for "Dark Mode (OLED)" and "Minimalism" specs.
- **Color Mood**: Dark syntax theme + Blue focus.
  - *Ref*: Check `colors.csv` for "Dark Mode" palettes.
- **Typography Mood**: Monospace + Functional.
  - *Ref*: Check `typography.csv` for "Monospace" pairings (e.g., JetBrains Mono, Fira Code).
- **Key Effects**: Syntax highlighting + Command palette.
- **Anti-Patterns**: Light mode default (Avoid!).

### 3. Implementation Workflow
1. **Read Data**: Always `view_file` the relevant CSVs if you need specific hex codes or animation specs.
2. **Reason**: Don't just copy. Adapt the rules to the current tech stack (Next.js + Tailwind).
3. **Execute**: Apply the styles to components.

## Reasoning Rules Lookup
If the user asks for a different domain (e.g., "Make a landing page"), search `ui-reasoning.csv` for the closest match and apply that row's rules.
