# Logic Architect ⚡🎮

[![License: CC BY-NC-SA 4.0](https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc-sa/4.0/)

live on: https://nlarchive.github.io/circuit-sensei/ 

## Overview
**Logic Architect** is an interactive logic gate simulator designed to teach computer architecture from the ground up, following a physics-first approach. Build circuits, master Boolean logic, and level up from electrons to a complete CPU!

## Features
- **Zero to Hero Curriculum**: 20 levels organized across 6 tiers, building from single transistors to a complete 4-bit CPU datapath (ALU, Registers, FSM).
- **Physics-First Learning**: Deep functional dives into semiconductor physics, electron flow, CMOS switching, and timing constraints (metastability, propagation delay).
- **Advanced HUD & Educational Tools**: 
  - **Concept Cards**: Interactive details on semiconductor physics and architecture.
  - **Formula Reference**: LaTeX-rendered equations for boolean algebra and physics.
  - **Glossary**: Deep searchable database of terms from "Address Bus" to "Zener Diode".
  - **Visual Simulations**: Charge-aware animations (+/- markers), ion lattice cues, and field arrows.
- **Real-time Simulation**: 
  - **High-performance Graph Engine**: Graph-based logic simulation with oscillation detection and metastability handling.
  - **Multi-Output Support**: Physically meaningful composition for Half/Full Adders, Latches, and DFFs.
  - **Clock Stimulus**: Integrated clock sources for sequential logic experiments.
- **Certification System**: Earn a verifiable certificate upon completion of the master-level curriculum.
- **Multiple Game Modes**:
  - **Story Mode**: Follow the historical evolution of computing through 20 handcrafted levels.
  - **Sandbox Mode**: Free-form building with all components (19+ gates) unlocked.
  - **Endless Mode**: Procedurally generated logic puzzles for mastery.
- **XP & Progression**: Earn experience points to unlock new tiers of technology.

## Tech Stack
- **Frontend**: Vanilla JavaScript (ES6+), HTML5 Canvas
- **Rendering**: Custom Canvas engine with SVG-based physics animations.
- **Math**: KaTeX for LaTeX rendering.
- **Utilities**: html2canvas for certificate generation.
- **Build Tool**: Vite
- **Testing**: 
  - **Vitest**: Unit testing for core simulation and logic.
  - **Playwright**: Comprehensive E2E coverage (60+ tests) for UI, gameplay, and mobile responsiveness.
- **Architecture**: Event-driven (Pub/Sub) using a central `EventBus`.

## Getting Started
1. Clone the repository.
2. Install dependencies: `npm install`
3. Start dev server: `npm run dev`
4. Run unit tests: `npm test`
5. Run E2E tests: `npm run test:e2e`
6. Build for production: `npm run build`

## Project Structure
- `src/core`: Simulation engine, gate logic (NAND, NOR, etc.), and circuit validation.
- `src/game`: Game state manager, achievement system, level generators, and XP progression.
- `src/ui`: 
  - `CanvasRenderer.js`: Central rendering loop.
  - `hud/`: HUD components (Education, Glossary, Roadmap, Visuals).
  - `overlays/`: Modals for completion, loading, and instructions.
- `src/certification`: Logic for generating and rendering completion certificates.
- `src/utils`: Asset loaders, math utilities, and analytics.
- `data`: Component definitions and gate metadata.
- `story`: Level data, curriculum tiers, and manifest (see [story/README.md](story/README.md)).
- `tests`: Unit and E2E test suites organized by module.
- `.scripts`: Automation scripts for pre-rendering formulas, metadata migration, and level generation.

## License

This project is licensed under **[CC BY-NC-SA 4.0](LICENSE)** (Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International).

- ✅ **Free** to use, share, and adapt for **non-commercial** purposes
- ✅ **Attribution** required
- ✅ **ShareAlike** — derivatives must use the same license
- ❌ **Commercial use** requires explicit permission

For commercial licensing inquiries, contact the project maintainer.

---

*Built with 💡 for learners, by educators.*
