# Story Data

This folder contains all the story, level, and curriculum data for Logic Architect.

## Structure (v2.0 - Separated Content)

```
story/
├── README.md                     # This file
├── levels-index.json             # Lightweight level index with file references
├── levels-index.schema.json      # JSON Schema for the index
├── levels-manifest.json          # Legacy: Full manifest (for backward compatibility)
├── tiers.json                    # Tier metadata (6 tiers: Silicon Age → Computer Architecture)
├── glossary.json                 # Comprehensive terminology index
├── formulas.json                 # Formula index with variables and examples
│
├── level-theory/                 # 📚 Educational content (1 file per base level)
│   ├── level_00.json             # Course Overview theory
│   ├── level_01.json             # Wire theory (physics, concepts)
│   ├── level_02.json             # Transistor theory
│   └── ...                       # 21 theory files total
│
├── level-puzzles/                # 🎮 Game challenges (1 file per variant)
│   ├── level_01_easy.json        # Wire puzzle (easy)
│   ├── level_01_medium.json      # Wire puzzle (medium)
│   ├── level_01_hard.json        # Wire puzzle (hard)
│   └── ...                       # 60 puzzle files (3 per level × 20 levels)
│
└── level-media/                  # 🎵 Media assets (future: music, backgrounds)
    └── (empty - reserved)
```

## Separation of Concerns

### Theory Files (`level-theory/*.json`)
Contains **educational content** that is constant across all difficulty variants:

| Field | Description |
|-------|-------------|
| `introText` | Detailed educational context, concepts, background |
| `storyText` | Post-completion insights and takeaways |
| `physicsVisual` | Primary visual key for the level's core concept |
| `physicsDetails` | Contains `conceptCards`, `formulaCards`, `exercises`, `realWorld` |
| `courseOverview` | (level_00 only) Full curriculum overview |
| `tierOverview` | (level_00 only) List of all tiers |
| `levelGuide` | (level_00 only) Quick reference for all levels |

### Puzzle Files (`level-puzzles/*.json`)
Contains **gameplay mechanics** that vary by difficulty:

| Field | Description |
|-------|-------------|
| `availableGates` | List of gates available for this variant |
| `inputs` | Number of circuit inputs |
| `targetTruthTable` | The puzzle definition (combinational) |
| `targetSequence` | The puzzle definition (sequential) |
| `maxGates` | Gate limit for this variant |
| `xpReward` | XP awarded for this variant |
| `hint` | Optional hint specific to this variant |

### Index File (`levels-index.json`)
Lightweight metadata with **file references**:

| Field | Description |
|-------|-------------|
| `id` | Base level ID (e.g., `level_01`) |
| `tier` | Curriculum tier (`tier_1` to `tier_6`) |
| `title` | Display title |
| `objective` | Brief objective |
| `theoryFile` | Path to theory content file |
| `puzzleFiles` | Map of variant names to puzzle file paths |

## Curriculum Index Files

### glossary.json

Comprehensive terminology index for info tooltips and prerequisite validation:

```json
{
  "acronyms": {
    "VDD": {
      "expansion": "Voltage Drain Drain (positive supply rail)",
      "origin_level": "level_03",
      "definition": "Positive power supply voltage..."
    }
  },
  "terms": {
    "electric_charge": {
      "name": "Electric Charge",
      "origin_level": "level_01",
      "definition": "...",
      "why": "...",
      "analogy": "...",
      "category": "physics_electrical"
    }
  },
  "categories": { ... },
  "by_level": { "level_01": ["term1", "term2"], ... }
}
```

### formulas.json

Formula index with complete variable documentation:

```json
{
  "formulas": {
    "ohms_law": {
      "name": "Ohm's Law",
      "formula": "V = I × R",
      "origin_level": "level_01",
      "variables": {
        "V": { "name": "Voltage", "meaning": "...", "units": "Volts (V)" }
      },
      "meaning": "Physical interpretation...",
      "example": { "problem": "...", "solution": "..." }
    }
  },
  "by_level": { "level_01": ["ohms_law", ...], ... },
  "by_category": { "physics_electrical": [...], ... }
}
```

**Usage:**
- Enable info buttons on intro-content for any acronym, term, or formula variable
- Validate all terms are well-defined before first use (prerequisite tracking)
- Generate automated cross-references in educational overlays

## Tiers (tiers.json)

Contains metadata for the 6 curriculum tiers:

- **tier_1**: The Silicon Age (Physics fundamentals)
- **tier_2**: Boolean Algebra (Logic gates)
- **tier_3**: Combinational Logic (Adders, Muxes)
- **tier_4**: Sequential Logic (Memory, Latches)
- **tier_5**: Finite State Machines (Counters, FSMs)
- **tier_6**: Computer Architecture (ALU, CPU)

## Adding a New Level

1. **Create theory file**: `level-theory/level_XX.json`
   ```json
   {
     "id": "level_XX",
     "tier": "tier_X",
     "title": "Your Level Title",
     "introText": "Educational introduction...",
     "storyText": "Completion story...",
     "physicsVisual": "visual_key",
     "physicsDetails": { ... }
   }
   ```

2. **Create puzzle files** (one per variant):
   - `level-puzzles/level_XX_easy.json`
   - `level-puzzles/level_XX_medium.json`
   - `level-puzzles/level_XX_hard.json`

3. **Add to index**: Update `levels-index.json`

## Level Schema (Legacy)

```json
{
  "id": "level_XX",
  "tier": "tier_X",
  "title": "Level Name",
  "objective": "Short goal description",
  "description": "Full description",
  "introText": "Educational context shown before level",
  "physicsVisual": "visual_key",
  "physicsDetails": { ... },
  "hint": "Helpful hint for solving",
  "availableGates": ["gate1", "gate2"],
  "inputs": 2,
  "targetTruthTable": [
    { "in": [0, 0], "out": [0] },
    { "in": [0, 1], "out": [1] }
  ],
  "maxGates": 5,
  "xpReward": 50,
  "storyText": "Physics/CS insight revealed after completion"
}
```

### physicsDetails Schema (Detailed - Recommended)

The new detailed schema provides deep explanations for all concepts and formulas:

```json
{
  "physicsDetails": {
    "conceptCards": [
      {
        "term": "Concept Name",
        "definition": "What it is - precise technical definition",
        "why": "Why it matters - relevance to digital circuits",
        "analogy": "Optional everyday analogy for intuition",
        "formula": "Optional associated formula",

        "visuals": [
          {
            "type": "electron_flow_detailed",
            "title": "Charge Carriers in a Conductor"
          }
        ]
      }
    ],
    "formulaCards": [
      {
        "name": "Formula Name (e.g., Ohm's Law)",
        "formula": "V = I × R",
        "variables": [
          { "symbol": "V", "meaning": "Voltage", "units": "Volts (V)" },
          { "symbol": "I", "meaning": "Current", "units": "Amperes (A)" },
          { "symbol": "R", "meaning": "Resistance", "units": "Ohms (Ω)" }
        ],
        "meaning": "Physical interpretation of what the formula tells us",
        "derivation": "Where this formula comes from",
        "example": {
          "problem": "A worked example problem statement",
          "given": ["V = 5V", "R = 10Ω"],
          "steps": ["Step 1: ...", "Step 2: ..."],
          "answer": "Final answer with units"
        }
      }
    ],
    "exercises": [
      {
        "question": "Practice problem for the learner",
        "hint": "Optional hint (shown on click)",
        "answer": "Solution (shown on click)"
      }
    ],
    "realWorld": {
      "context": "Why this topic matters in real electronics",
      "example": "Specific real-world application",
      "numbers": "Concrete numbers to make it tangible",
      "connection": "How this level's circuit relates to the real world"
    }
  }
}
```

### Visual Placement (Recommended)

To make the course **self-consistent** and ensure "explain → show" pedagogy, visuals should be attached directly to the concept card that explains them.

- Use `conceptCards[].visuals` for **0..N** animations under that concept.
- Each visual entry is `{ "type": "<visual_key>", "title": "<caption>" }`.
- The UI is **fully data-driven**: it renders only the visuals declared in the level JSON (via `physicsVisual`, `physicsVisuals`, or `conceptCards[].visuals`).

This guarantees:
- No missing animation (every animation is declared in the level file)
- No missing explanation (every animation lives under an explanatory concept card)
- Clear structure (how many animations, what they are, and where they belong)

### Legacy physicsDetails Schema (Still Supported)

```json
{
  "physicsDetails": {
    "concepts": ["concept1", "concept2"],
    "equations": ["V = IR", "P = IV"],
    "realWorld": "String description of real-world relevance"
  }
}
```

## Content Quality Guidelines

Each level should teach **deeply**, not just mention terms:

1. **Concepts**: Explain what, why, and give an analogy
2. **Formulas**: Define all variables, explain physical meaning, provide worked example
3. **Exercises**: Include 2-4 practice problems with hints and answers
4. **Real-World**: Connect to actual devices/systems with concrete numbers

## Editing Levels

To edit a level:

1. Open the corresponding `levels/level_XX.json` file
2. Modify the fields you want to change
3. Save the file
4. Reload the game (dev server auto-reloads)

## Adding New Levels

1. Create a new `level_XX.json` in the `levels/` folder
2. Follow the schema above
3. Update `src/utils/StoryLoader.js` to include the new level ID in `loadAllLevels()`
4. Update tier metadata in `tiers.json` if needed

## Loading System

The game uses `StoryLoader.js` to dynamically load:
- Individual levels on-demand
- All levels in order
- Levels filtered by tier
- Tier metadata

This modular approach makes it easy to:
- Review and edit individual levels
- Add new levels without touching other files
- Maintain curriculum organization
- Version control level changes independently
