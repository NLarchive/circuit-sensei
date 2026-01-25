# Circuit Sensei ⚡🎮

[![License: CC BY-NC-SA 4.0](https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc-sa/4.0/)

An interactive logic gate simulator designed to teach computer architecture from the ground up, following a physics-first approach. Build circuits, master Boolean logic, and level up from electrons to a complete CPU!

## Features
- **Zero to Hero Curriculum**: 20 levels organized across 6 tiers, building from single transistors to a complete CPU datapath.
- **Physics-First Learning**: Deep dives into electron flow, CMOS switching, and timing constraints.
- **Advanced HUD**: Interactive concept cards, formula references (LaTeX rendered), and real-world history.
- **Real-time Simulation**: High-performance graph-based logic simulation.
- **Multiple Game Modes**:
  - **Story Mode**: Follow the historical evolution of computing through 20 handcrafted levels.
  - **Sandbox Mode**: Free-form building with all components unlocked.
  - **Endless Mode**: Procedurally generated logic puzzles for mastery.
  - **Custom Mode**: Create and share your own challenges.
- **XP & Progression**: Earn experience and unlock new tiers of technology.

## Tech Stack
- **Frontend**: Vanilla JavaScript (ES6+), HTML5 Canvas
- **Build Tool**: Vite
- **Testing**: Playwright, Vitest
- **Architecture**: Event-driven (Pub/Sub)

## Getting Started
1. Clone the repository.
2. Install dependencies: `npm install`
3. Start dev server: `npm run dev`
4. Run tests: `npm test`

## Project Structure
- `src/core`: Simulation engine and gate logic.
- `src/game`: Game state, progression, and level generation.
- `src/ui`: Canvas rendering and HUD.
- `src/utils`: Utility functions and loaders.
- `data`: Gate definitions.
- `story`: Level data and curriculum (see [story/README.md](story/README.md) for details).
- `tests`: Unit and E2E tests.
- `.scripts`: Utility and maintenance scripts.

## License

This project is licensed under **[CC BY-NC-SA 4.0](LICENSE)** (Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International).

- ✅ **Free** to use, share, and adapt for **non-commercial** purposes
- ✅ **Attribution** required
- ✅ **ShareAlike** — derivatives must use the same license
- ❌ **Commercial use** requires explicit permission

For commercial licensing inquiries, contact the project maintainer.

---

*Built with 💡 for learners, by educators.*
