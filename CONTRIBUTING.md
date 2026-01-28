# Contributing to Logic Architect

We're glad you're interested in contributing to Logic Architect!

## Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Start the dev server: `npm run dev`
4. Run tests: `npm test` or `npm run test:e2e`

## Level Content Architecture

### Manifest-Based Level System

Level content uses a **separated content** system:

- **Theory files** (`story/level-theory/level_XX.json`) contain educational content (introText, storyText, physicsDetails)
- **Puzzle files** (`story/level-puzzles/level_XX_variant.json`) contain gameplay mechanics (availableGates, targetTruthTable, maxGates, xpReward)
- **Index** (`story/levels-index.json`) provides lightweight metadata and file references

### Editing Levels

**To modify educational content:**
1. Edit the theory file in `story/level-theory/level_XX.json`
2. Test changes with `npm run dev`

**To modify puzzle mechanics:**
1. Edit the puzzle file in `story/level-puzzles/level_XX_variant.json`
2. Test changes with `npm run dev`

**To add a new level:**
1. Create theory file: `story/level-theory/level_XX.json`
2. Create puzzle files: `story/level-puzzles/level_XX_easy.json`, etc.
3. Update `story/levels-index.json` with the new level entry
4. Test with `npm run dev`

### Manifest Structure

```json
{
  "levels": [
    {
      "id": "level_01",
      "tier": "tier_1",
      "title": "The Simple Wire",
      "...": "base level fields inherited by all variants",
      "variants": {
        "easy": {
          "maxGates": 1
        },
        "medium": {
          "title": "Different Title",
          "inputs": 2,
          "targetTruthTable": [...]
        },
        "hard": {
          "availableGates": ["nand"],
          "maxGates": 4
        }
      }
    }
  ]
}
```

Variant overrides are **merged** onto the base level. Only specify fields that differ.

### Gate Curriculum Rules

Levels must follow the gate progression:
- Level 01: wire
- Level 02: transistor  
- Level 03: NOT
- Level 04: AND
- Level 05: OR
- Level 06: NAND
- Level 07: NOR
- Level 08: XOR
- Level 10: MUX
- Level 14: srLatch
- Level 15: dFlipFlop
- Level 19: fullAdder

**Easy variants** should include ALL gates from previous levels.
**Hard variants** may restrict to specific gates (e.g., "NAND only").

### Useful Commands

```bash
npm run generate        # Regenerate variant files from manifest
npm run generate:clean  # Clean and regenerate
npm run migrate         # Rebuild manifest from current files
npm run validate:manifest  # Compare generated vs legacy files
```

## Pull Request Process

1. Create a new branch for your feature or fix.
2. Ensure your code follows the existing style (run `npm run format`).
3. Run `npm run generate` if you modified levels or the manifest.
4. Add tests for any new functionality.
5. Submit a PR with a clear description of your changes.

## Code of Conduct

Please be respectful and helpful to all contributors.
