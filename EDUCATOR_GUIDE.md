# Logic Architect - Educator & Learner Guide

## 🎯 Overview

Logic Architect is a **physics-first** educational game that teaches digital logic and computer architecture by starting with physical concepts (electrons, semiconductors) and building up to system-level designs (ALU, CPU datapath).

This guide explains the pedagogical approach, curriculum structure, and how to use the tool effectively in educational settings.

---

## 📚 Physics-First Pedagogy

### The Learning Progression

Logic Architect follows a carefully designed progression:

```
Component Physics → Logic Abstraction → System Design
     ↓                    ↓                  ↓
 Electrons &         Boolean Gates      ALU, Counter,
 Transistors         & Operations       CPU Datapath
```

**Why Physics-First?**
- Students understand *why* circuits behave as they do, not just *what* they do
- Demystifies the "magic" of digital electronics
- Builds intuition for timing, power, and physical constraints
- Prepares students for advanced topics (VLSI, computer architecture)

### Key Concepts by Tier

| Tier | Focus | Core Physics Concepts |
|------|-------|----------------------|
| 1 | Signal Flow | Electron drift, semiconductor doping, PN junctions |
| 2 | Boolean Algebra | CMOS switching, voltage thresholds, propagation delay |
| 3 | Arithmetic | Carry propagation, critical path, binary representation |
| 4 | Memory | Bistability, metastability, clock domains, setup/hold time |
| 5 | State Machines | FSM theory, state encoding, Moore vs Mealy |
| 6 | CPU Architecture | Datapath design, pipelining, instruction execution |

---

## 🎮 Game Modes

### Story Mode (Recommended for Learning)
- **20 levels** organized across 6 tiers
- Each level introduces new concepts with physics explanations
- Unlocks progressively as students master earlier material
- Includes detailed `introText`, `physicsDetails`, and `storyText`

### Sandbox Mode
- All components unlocked
- Free-form experimentation
- Good for "what if" exploration after completing Story

### Endless Mode
- Procedurally generated puzzles
- Tests mastery with varied challenges
- Great for practice and reinforcement

---

## 📖 Curriculum Structure

### Tier 1: Signal Basics (Levels 1-5)
**Theme:** From electrons to logic signals

- **Level 1 (Wire):** Signal propagation, electron drift in conductors
- **Level 2 (Transistor):** NPN/PNP behavior, amplification vs switching
- **Level 3 (NOT Gate):** CMOS inverter, rail-to-rail swing
- **Level 4 (AND Gate):** Series transistor networks, current limiting
- **Level 5 (OR Gate):** Parallel transistor networks, fan-in

**Physics Highlights:**
- Electric field direction vs electron drift direction
- Threshold voltages (V_th ~0.7V for silicon)
- Why digital circuits use voltage levels, not current

### Tier 2: Universal Gates (Levels 6-9)
**Theme:** Building everything from two gate types

- **Level 6 (NAND):** Universal gate property, AOI logic
- **Level 7 (NOR):** Historical significance (Apollo Guidance Computer)
- **Level 8 (XOR):** Parity, half-adder core
- **Level 9 (XNOR):** Bit comparison, equality detection

**Physics Highlights:**
- Gate delay and power-delay product
- DeMorgan's theorem from a circuit perspective
- Why NAND/NOR are "native" to CMOS

### Tier 3: Arithmetic Circuits (Levels 10-13)
**Theme:** Binary math in hardware

- **Level 10 (MUX):** Data selection, transmission gates
- **Level 11 (Decoder):** One-hot encoding, memory addressing
- **Level 12 (Half Adder):** Binary addition basics
- **Level 13 (Full Adder):** Carry chain, ripple vs lookahead

**Physics Highlights:**
- Critical path delay through chained gates
- Power consumption during switching
- Area vs. Performance tradeoffs in math units

### Tier 4: Sequential Logic (Levels 14-16)
**Theme:** Memory and Flip-Flops

- **Level 14 (SR Latch):** Feedback loops, bistability
- **Level 15 (D Flip-Flop):** Synchronous design, clock edges
- **Level 16 (T Flip-Flop):** Frequency division, toggling

**Physics Highlights:**
- Metastability and setup/hold times
- Clock distribution and jitter
- Energy storage in feedback loops

### Tier 5: Finite State Machines (Levels 17-18)
**Theme:** Controlling Behavior

- **Level 17 (2-Bit Counter):** Sequential sequencing, state bits
- **Level 18 (Traffic Light):** FSM design methodology (States/Transitions)

**Physics Highlights:**
- State encoding (Binary vs One-hot)
- Glitch avoidance in Mealy vs Moore machines

### Tier 6: CPU Architecture (Level 19-Boss)
**Theme:** The Computing Brain

- **Level 19 (ALU):** Arithmetic Logic Unit, control signals
- **Level Boss (CPU Datapath):** Fetch-Decode-Execute, Von Neumann architecture

**Physics Highlights:**
- Datapath throughput and critical path
- Memory-Processor bottleneck
- System-level integration and clock domains
- Critical path determines maximum clock frequency
- Carry-lookahead achieves O(log n) vs O(n) delay
- Why hardware adders are parallel, not sequential

### Tier 4: Sequential Logic (Levels 14-16)
**Theme:** Memory and synchronization

- **Level 14 (SR Latch):** Bistability, cross-coupled inverters, forbidden state
- **Level 15 (D Flip-Flop):** Edge triggering, master-slave architecture
- **Level 16 (T Flip-Flop):** Frequency division, counter building block

**Physics Highlights:**
- **Metastability:** What happens when timing is violated
- Setup time, hold time, clock-to-Q delay
- Why synchronous design uses a global clock

### Tier 5: State Machines (Levels 17-18)
**Theme:** Complex behavior from simple elements

- **Level 17 (2-Bit Counter):** Binary counting, rollover
- **Level 18 (Traffic Light FSM):** Moore machines, state encoding

**Physics Highlights:**
- State encoding trade-offs (binary vs one-hot vs Gray)
- Glitch-free outputs with registered Moore machines
- Real FSM applications (protocols, controllers)

### Tier 6: CPU Architecture (Levels 19-Boss)
**Theme:** From gates to computation

- **Level 19 (ALU):** Add/subtract with opcode selection
- **Level Boss (CPU Datapath):** Fetch-Decode-Execute cycle

**Physics Highlights:**
- Von Neumann architecture
- Pipelining and CPI (Cycles Per Instruction)
- Why modern CPUs have 14-19 pipeline stages

---

## 🛠️ Using Logic Architect in the Classroom

### Suggested Lesson Plans

**Unit 1: Digital Foundations (Tiers 1-2, ~3-4 hours)**
1. Discuss semiconductor physics (15 min)
2. Students complete Levels 1-5 (45 min)
3. Group discussion: Why is CMOS the dominant technology? (15 min)
4. Students complete Levels 6-9 (45 min)
5. Challenge: Build OR from NANDs only (20 min)

**Unit 2: Binary Arithmetic (Tier 3, ~2 hours)**
1. Review positional number systems (15 min)
2. Students complete Levels 10-13 (60 min)
3. Whiteboard: Design a 4-bit ripple carry adder (20 min)
4. Discussion: Why is carry-lookahead faster? (15 min)

**Unit 3: Memory & Timing (Tier 4, ~2-3 hours)**
1. Introduction to sequential circuits (15 min)
2. Students complete Level 14 (SR Latch) (20 min)
3. **Critical:** Explain metastability with animation (15 min)
4. Students complete Levels 15-16 (40 min)
5. Lab: Measure setup/hold violations in simulation (30 min)

**Unit 4: System Design (Tiers 5-6, ~3 hours)**
1. FSM design methodology overview (20 min)
2. Students complete Levels 17-18 (45 min)
3. ALU architecture discussion (20 min)
4. Students complete Level 19 (45 min)
5. **Boss Level:** CPU Datapath (30 min)
6. Wrap-up: From transistors to processors (15 min)

### Assessment Ideas

1. **Practical:** Complete specific levels within time limits
2. **Design:** Create a custom circuit in Sandbox mode (e.g., 4-bit comparator)
3. **Written:** Explain the physics behind a specific gate/circuit
4. **Debugging:** Given a broken circuit, identify and fix the issue

---

## 📊 Understanding the UI

### Main Interface
```
┌─────────────────────────────────────────────────┐
│  Navbar: Level Title | Mode Toggle | Zoom | XP  │
├──────────┬──────────────────────────────────────┤
│ Sidebar  │                                      │
│ ─────────│        Canvas (Circuit Area)         │
│ Toolbox  │                                      │
│          │                                      │
│ Level    │                                      │
│ Info     │                                      │
│          ├──────────────────────────────────────┤
│          │   HUD: Verify | Reset | Controls     │
└──────────┴──────────────────────────────────────┘
```

### Key Controls
- **Select Mode (🖱️):** Click to select, drag to move gates
- **Wire Mode (🔗):** Click-drag from output to input pins
- **Zoom (+/-):** Adjust canvas zoom level
- **Verify (✓):** Test circuit against level requirements
- **Reset:** Clear all gates and wires

### Visual Indicators
- **Green wires:** Signal is HIGH (1)
- **Gray wires:** Signal is LOW (0)
- **Orange wires:** Metastable/undefined state
- **Red highlight:** Error or validation failure

---

## 🎓 Learning Objectives by Level

| Level | Learning Objectives | Success Criteria |
|-------|--------------------|--------------------|
| 1 | Understand signal propagation | Connect input to output |
| 2 | Understand transistor as switch | Route signal through transistor |
| 3 | Implement logic inversion | Build working NOT gate |
| 4 | Implement conjunction | Build working AND gate |
| 5 | Implement disjunction | Build working OR gate |
| 6 | Use universal gate property | Build from NAND only |
| 7 | Apply DeMorgan's theorem | Derive logic equivalences |
| 8 | Understand XOR behavior | Build half-adder sum |
| 9 | Implement bit comparison | Detect equality |
| 10 | Implement data selection | Build 2:1 MUX |
| 11 | Implement address decoding | Build 2-bit decoder |
| 12 | Implement 2-bit addition | Build half adder |
| 13 | Implement 3-bit addition | Build full adder with carry |
| 14 | Implement bistable memory | Build SR latch |
| 15 | Understand edge triggering | Synchronize with clock |
| 16 | Implement frequency division | Build toggle flip-flop |
| 17 | Implement binary counting | Build 2-bit counter |
| 18 | Design finite state machine | Build traffic light controller |
| 19 | Implement arithmetic unit | Build add/subtract ALU |
| Boss | Understand CPU operation | Complete fetch-execute cycle |

---

## 🔧 Technical Notes for Educators

### Simulation Model
- **Event-driven:** Only recalculates affected nodes
- **Propagation delay:** Configurable per gate type
- **Metastability:** Detected and visualized for feedback loops
- **Truth table validation:** Levels use either static truth tables or time-sequenced validation

### Data Files
- `story/levels/*.json` - Level definitions with physics content
- `data/gates.json` - Gate catalog with physics notes
- `story/tiers.json` - Tier metadata and unlock requirements

### Customization
Educators can create custom levels by adding JSON files to `story/levels/`. See existing levels for schema examples.

---

## 📞 Support

- **Documentation:** [README.md](README.md)
- **Story Content:** [story/README.md](story/README.md)
- **Educational Content Details:** [EDUCATIONAL_CONTENT.md](EDUCATIONAL_CONTENT.md)

---

*Logic Architect - Teaching digital logic from electrons to CPUs.*
