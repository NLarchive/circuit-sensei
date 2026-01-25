/**
 * Signal Constants for Physics-First Simulation
 * -1 (METASTABLE): Represents undefined/oscillating/forbidden states
 *  0 (LOW): Logic low / GND
 *  1 (HIGH): Logic high / VCC
 *  2 (HIZ): High-Impedance (tri-state)
 */
export const Signal = {
    METASTABLE: -1,  // Undefined state (physics: unstable equilibrium, race condition)
    LOW: 0,
    HIGH: 1,
    HIZ: 2,          // High-Impedance (tri-state, physics: open circuit/floating)
    
    // Check if a signal is in a valid stable state
    isStable: (s) => s === 0 || s === 1,
    
    // Check if metastable
    isMetastable: (s) => s === -1,

    // Check if high-impedance
    isHiZ: (s) => s === 2,
    
    // Coerce to display string for educational UI
    toString: (s) => {
        if (s === -1) return '?';
        if (s === 2) return 'Z';
        return String(s);
    }
};

/**
 * Propagation delay constants (nanoseconds)
 * Based on typical 74HC-series CMOS characteristics
 * Physics: RC time constant + transistor switching time
 */
export const PropagationDelays = {
    // Basic gates (74HC series typical values)
    NOT: 8,        // ns - single inverter stage
    AND: 10,       // ns - slightly longer due to series transistors  
    OR: 10,        // ns
    NAND: 8,       // ns - native CMOS gate (fastest multi-input)
    NOR: 8,        // ns - native CMOS gate
    XOR: 14,       // ns - compound gate (more stages)
    XNOR: 14,      // ns
    BUFFER: 7,     // ns
    TRISTATE: 9,   // ns - includes output enable delay
    
    // Sequential elements (edge-triggered)
    DFF_CLK_TO_Q: 12,      // ns - clock-to-Q propagation
    DFF_SETUP: 4,          // ns - setup time before clock edge
    DFF_HOLD: 1,           // ns - hold time after clock edge
    
    // Latch (level-sensitive)
    SRLATCH: 10,   // ns - NOR-based SR latch
    
    // Complex components
    HALF_ADDER: 20,  // ns - XOR + AND path
    FULL_ADDER: 28,  // ns - critical path through carry chain
    MUX: 12,         // ns
    CLOCK: 0,        // ns - ideal clock source
    
    // I/O
    INPUT: 0,        // ns - ideal input (no delay)
    OUTPUT: 2,       // ns - output buffer
    
    DEFAULT: 10      // ns - fallback
};

/**
 * Gate - Base class for all logic gates
 * Represents a node in the circuit graph
 */
export class Gate {
    constructor(id, type, x = 0, y = 0) {
        this.id = id;
        this.type = type;
        this.x = x;
        this.y = y;
        this.inputs = [];      // Array of input values
        this.outputs = [];     // Array of output values
        this.inputWires = [];  // Connections from other gates
        this.outputWires = []; // Connections to other gates
        this.inputCount = 2;
        this.outputCount = 1;
        this.isMetastable = false; // Track if gate entered metastable state
        
        // Timing model for physics-first simulation
        this.propagationDelay = PropagationDelays.DEFAULT;  // ns
        this.lastInputChangeTime = 0;   // Simulation time of last input change
        this.pendingOutputs = null;     // Scheduled output after delay
        this.pendingOutputTime = 0;     // When pending outputs become active
        
        // Hazard tracking
        this.transitionHistory = [];    // Track recent output transitions for glitch detection
        this.hasGlitch = false;         // True if glitch detected this simulation
    }

    /**
     * Calculate output based on inputs - Override in subclasses
     */
    compute() {
        return [0];
    }

    /**
     * Set input values and recompute
     */
    setInputs(values) {
        this.inputs = values;
        this.outputs = this.compute();
        return this.outputs;
    }

    /**
     * Get output values
     */
    getOutputs() {
        return this.outputs;
    }

    /**
     * Record output transition for hazard analysis
     */
    recordTransition(oldValue, newValue, simulationTime) {
        if (oldValue !== newValue) {
            this.transitionHistory.push({
                from: oldValue,
                to: newValue,
                time: simulationTime
            });
            // Keep only last 10 transitions
            if (this.transitionHistory.length > 10) {
                this.transitionHistory.shift();
            }
        }
    }

    /**
     * Check for static/dynamic hazards
     * Physics: Hazards occur when different signal paths through a gate
     * have different delays, causing momentary glitches
     */
    checkHazard() {
        // Static hazard: output should stay constant but glitches
        // Dynamic hazard: output should transition once but transitions multiple times
        if (this.transitionHistory.length < 2) return false;
        
        const recent = this.transitionHistory.slice(-3);
        if (recent.length >= 2) {
            const timeSpan = recent[recent.length - 1].time - recent[0].time;
            // Multiple transitions within a short time window = hazard
            if (timeSpan < this.propagationDelay * 2) {
                this.hasGlitch = true;
                return true;
            }
        }
        return false;
    }

    /**
     * Get gate metadata for UI
     */
    getInfo() {
        return {
            id: this.id,
            type: this.type,
            inputs: this.inputs,
            outputs: this.outputs,
            position: { x: this.x, y: this.y },
            propagationDelay: this.propagationDelay,
            hasGlitch: this.hasGlitch
        };
    }
}

/**
 * Input Node - User-controllable switch
 */
export class InputNode extends Gate {
    constructor(id, x, y, label = 'IN') {
        super(id, 'input', x, y);
        this.label = label;
        this.inputCount = 0;
        this.outputCount = 1;
        this.value = 0;
        this.propagationDelay = PropagationDelays.INPUT;
    }

    setValue(value) {
        this.value = value ? 1 : 0;
        this.outputs = [this.value];
        return this.outputs;
    }

    compute() {
        return [this.value];
    }
}

/**
 * Output Node - LED or display
 */
export class OutputNode extends Gate {
    constructor(id, x, y, label = 'OUT') {
        super(id, 'output', x, y);
        this.label = label;
        this.inputCount = 1;
        this.outputCount = 0;
        this.propagationDelay = PropagationDelays.OUTPUT;
    }

    compute() {
        return this.inputs.length > 0 ? [this.inputs[0]] : [0];
    }
}

/**
 * Transistor - Basic buffer for Tier 1
 */
export class Transistor extends Gate {
    constructor(id, x, y) {
        super(id, 'transistor', x, y);
        // In this simulator a transistor is modeled as an ideal controlled switch:
        // input[0] = control (base/gate), input[1] = supply/data (collector/drain)
        this.inputCount = 2;
        this.propagationDelay = PropagationDelays.BUFFER;
    }

    compute() {
        const control = this.inputs[0] || 0;
        const supply = this.inputs[1] || 0;
        return [(control && supply) ? 1 : 0];
    }
}

/**
 * NOT Gate - Inverter
 */
export class NotGate extends Gate {
    constructor(id, x, y) {
        super(id, 'not', x, y);
        this.inputCount = 1;
        this.propagationDelay = PropagationDelays.NOT;
    }

    compute() {
        const a = this.inputs[0] || 0;
        if (Signal.isMetastable(a)) return [Signal.METASTABLE];
        return [a ? 0 : 1];
    }
}

/**
 * TriState Buffer - Educational physics: Open collector/3-state
 * Inputs: [0] = Data, [1] = Enable
 */
export class TriState extends Gate {
    constructor(id, x, y) {
        super(id, 'tristate', x, y);
        this.inputCount = 2;
        this.propagationDelay = PropagationDelays.TRISTATE;
    }

    compute() {
        const data = this.inputs[0] || 0;
        const enable = this.inputs[1] || 0;
        
        if (Signal.isMetastable(enable)) return [Signal.METASTABLE];
        
        if (enable === 1) {
            return [data];
        } else {
            return [Signal.HIZ];
        }
    }
}

/**
 * AND Gate
 */
export class AndGate extends Gate {
    constructor(id, x, y) {
        super(id, 'and', x, y);
        this.inputCount = 2;
        this.propagationDelay = PropagationDelays.AND;
    }

    compute() {
        const a = this.inputs[0] || 0;
        const b = this.inputs[1] || 0;
        return [(a && b) ? 1 : 0];
    }
}

/**
 * OR Gate
 */
export class OrGate extends Gate {
    constructor(id, x, y) {
        super(id, 'or', x, y);
        this.inputCount = 2;
        this.propagationDelay = PropagationDelays.OR;
    }

    compute() {
        const a = this.inputs[0] || 0;
        const b = this.inputs[1] || 0;
        return [(a || b) ? 1 : 0];
    }
}

/**
 * NAND Gate - Universal Gate
 */
export class NandGate extends Gate {
    constructor(id, x, y) {
        super(id, 'nand', x, y);
        this.inputCount = 2;
        this.propagationDelay = PropagationDelays.NAND;
    }

    compute() {
        const a = this.inputs[0] || 0;
        const b = this.inputs[1] || 0;
        return [(a && b) ? 0 : 1];
    }
}

/**
 * NOR Gate - Universal Gate
 */
export class NorGate extends Gate {
    constructor(id, x, y) {
        super(id, 'nor', x, y);
        this.inputCount = 2;
        this.propagationDelay = PropagationDelays.NOR;
    }

    compute() {
        const a = this.inputs[0] || 0;
        const b = this.inputs[1] || 0;
        return [(a || b) ? 0 : 1];
    }
}

/**
 * XOR Gate - Exclusive OR
 */
export class XorGate extends Gate {
    constructor(id, x, y) {
        super(id, 'xor', x, y);
        this.inputCount = 2;
        this.propagationDelay = PropagationDelays.XOR;
    }

    compute() {
        const a = this.inputs[0] || 0;
        const b = this.inputs[1] || 0;
        return [(a !== b) ? 1 : 0];
    }
}

/**
 * XNOR Gate - Equivalence
 */
export class XnorGate extends Gate {
    constructor(id, x, y) {
        super(id, 'xnor', x, y);
        this.inputCount = 2;
        this.propagationDelay = PropagationDelays.XNOR;
    }

    compute() {
        const a = this.inputs[0] || 0;
        const b = this.inputs[1] || 0;
        return [(a === b) ? 1 : 0];
    }
}

/**
 * Half Adder - 2 inputs, 2 outputs (Sum, Carry)
 */
export class HalfAdder extends Gate {
    constructor(id, x, y) {
        super(id, 'halfAdder', x, y);
        this.inputCount = 2;
        this.outputCount = 2;
        this.propagationDelay = PropagationDelays.HALF_ADDER;
    }

    compute() {
        const a = this.inputs[0] || 0;
        const b = this.inputs[1] || 0;
        const sum = a ^ b;
        const carry = a & b;
        return [sum, carry];
    }
}

/**
 * Full Adder - 3 inputs, 2 outputs (Sum, Carry)
 */
export class FullAdder extends Gate {
    constructor(id, x, y) {
        super(id, 'fullAdder', x, y);
        this.inputCount = 3;
        this.propagationDelay = PropagationDelays.FULL_ADDER;
        this.outputCount = 2;
    }

    compute() {
        const a = this.inputs[0] || 0;
        const b = this.inputs[1] || 0;
        const cin = this.inputs[2] || 0;
        const sum = a ^ b ^ cin;
        const carry = (a & b) | (cin & (a ^ b));
        return [sum, carry];
    }
}

/**
 * 2-to-1 Multiplexer - 3 inputs (A, B, Select), 1 output
 */
export class Mux2to1 extends Gate {
    constructor(id, x, y) {
        super(id, 'mux2to1', x, y);
        this.inputCount = 3;
        this.propagationDelay = PropagationDelays.MUX;
    }

    compute() {
        const a = this.inputs[0] || 0;
        const b = this.inputs[1] || 0;
        const sel = this.inputs[2] || 0;
        return [sel ? b : a];
    }
}

/**
 * SR Latch - Sequential logic component
 * 
 * Physics: Cross-coupled NOR/NAND gates form a bistable multivibrator.
 * When S=R=1 (NOR) or S=R=0 (NAND), both outputs try to reach the same
 * value, creating a race condition. Upon release, the winner depends on
 * tiny timing differences (metastability).
 */
export class SRLatch extends Gate {
    constructor(id, x, y) {
        super(id, 'srlatch', x, y);
        this.inputCount = 2; // S, R
        this.outputCount = 2; // Q, !Q
        this.outputs = [0, 1];
        this.inForbiddenState = false;
        this.propagationDelay = PropagationDelays.SRLATCH;
    }

    compute() {
        const s = this.inputs[0] || 0;
        const r = this.inputs[1] || 0;
        let [q, qNot] = this.outputs;

        if (s && !r) {
            // SET: Q=1, Q̄=0
            q = 1;
            qNot = 0;
            this.inForbiddenState = false;
            this.isMetastable = false;
        } else if (!s && r) {
            // RESET: Q=0, Q̄=1
            q = 0;
            qNot = 1;
            this.inForbiddenState = false;
            this.isMetastable = false;
        } else if (s && r) {
            // FORBIDDEN STATE (S=R=1 for NOR-based latch)
            // Physics: Both NOR gates output 0 (since both have a 1 input).
            // When S and R both release to 0, there's a race—metastability.
            // We mark this as metastable to teach the physics-first concept.
            q = Signal.METASTABLE;
            qNot = Signal.METASTABLE;
            this.inForbiddenState = true;
            this.isMetastable = true;
        } else {
            // HOLD (S=0, R=0): Maintain previous state
            // If we were in forbidden state and both inputs release, outputs are metastable
            if (this.inForbiddenState) {
                // Race condition: could resolve either way
                q = Signal.METASTABLE;
                qNot = Signal.METASTABLE;
                this.isMetastable = true;
            }
            // Otherwise keep previous stable state
        }
        return [q, qNot];
    }
    
    /**
     * Reset the latch to a known stable state (for educational demos)
     */
    resetToStable() {
        this.outputs = [0, 1];
        this.inForbiddenState = false;
        this.isMetastable = false;
    }
}

/**
 * D Flip-Flop - Clocked memory (Edge-triggered)
 * 
 * Physics: Internal master-slave latch structure samples D on clock edge.
 * Setup time (t_su): D must be stable BEFORE clock edge
 * Hold time (t_h): D must remain stable AFTER clock edge
 * Violation → metastability (output oscillates or takes very long to settle)
 * 
 * In real silicon, metastability MTBF = e^(t_r/τ) / (f_clk × f_data)
 * where t_r is resolution time and τ is the metastability time constant.
 */
export class DFlipFlop extends Gate {
    constructor(id, x, y) {
        super(id, 'dflipflop', x, y);
        this.inputCount = 2; // D, Clock
        this.outputCount = 2; // Q, !Q
        this.outputs = [0, 1];
        this.lastClock = 0;
        this.lastD = 0; // Track D for setup/hold awareness
        this.clockEdgeCount = 0; // For timing analysis
        
        // D-FF timing parameters (nanoseconds)
        this.propagationDelay = PropagationDelays.DFF_CLK_TO_Q;
        this.setupTime = PropagationDelays.DFF_SETUP;
        this.holdTime = PropagationDelays.DFF_HOLD;
    }

    compute() {
        const d = this.inputs[0];
        const clk = this.inputs[1] || 0;
        let [q, qNot] = this.outputs;

        // Rising edge trigger
        if (clk && !this.lastClock) {
            this.clockEdgeCount++;
            
            // Check for metastable input (propagated from upstream)
            if (Signal.isMetastable(d)) {
                // Metastable input captured on clock edge → metastable output
                q = Signal.METASTABLE;
                qNot = Signal.METASTABLE;
                this.isMetastable = true;
            } else {
                q = d ? 1 : 0;
                qNot = d ? 0 : 1;
                this.isMetastable = false;
            }
        }
        
        this.lastClock = clk;
        this.lastD = d;
        return [q, qNot];
    }
    
    /**
     * Reset flip-flop to known state
     */
    reset() {
        this.outputs = [0, 1];
        this.lastClock = 0;
        this.lastD = 0;
        this.isMetastable = false;
        this.clockEdgeCount = 0;
    }
}

/**
 * T Flip-Flop - Toggle on clock edge when T=1
 * 
 * Physics: Built from a D flip-flop with Q̅ fed back to D through an XOR with T.
 * When T=1: D = Q⊕1 = Q̅, so output toggles on each clock edge.
 * When T=0: D = Q⊕0 = Q, so output holds its state.
 * 
 * Critical for counter design: Each bit toggles when all less-significant bits are 1.
 * 
 * Truth table:
 *   T | Q(next)
 *   0 | Q (hold)
 *   1 | Q̅ (toggle)
 */
export class TFlipFlop extends Gate {
    constructor(id, x, y) {
        super(id, 'tflipflop', x, y);
        this.inputCount = 2; // T, Clock
        this.outputCount = 2; // Q, !Q
        this.outputs = [0, 1];
        this.lastClock = 0;
        
        // Timing parameters (similar to D-FF)
        this.propagationDelay = PropagationDelays.DFF_CLK_TO_Q;
        this.setupTime = PropagationDelays.DFF_SETUP;
        this.holdTime = PropagationDelays.DFF_HOLD;
    }

    compute() {
        const t = this.inputs[0] || 0;
        const clk = this.inputs[1] || 0;
        let [q, qNot] = this.outputs;

        // Rising edge trigger
        if (clk && !this.lastClock) {
            if (Signal.isMetastable(t)) {
                q = Signal.METASTABLE;
                qNot = Signal.METASTABLE;
                this.isMetastable = true;
            } else if (t === 1) {
                // Toggle: Q_next = Q̅
                const newQ = q ? 0 : 1;
                q = newQ;
                qNot = newQ ? 0 : 1;
                this.isMetastable = false;
            }
            // If T=0, hold state (do nothing)
        }
        
        this.lastClock = clk;
        this.outputs = [q, qNot];
        return [q, qNot];
    }
    
    reset() {
        this.outputs = [0, 1];
        this.lastClock = 0;
        this.isMetastable = false;
    }
}

/**
 * JK Flip-Flop - The "universal" flip-flop
 * 
 * Physics: Enhanced SR latch with clock gating and race avoidance.
 * The forbidden state (S=R=1) becomes a useful "toggle" mode (J=K=1).
 * Master-slave construction prevents race-around condition.
 * 
 * Truth table:
 *   J K | Q(next) | Action
 *   0 0 | Q       | Hold
 *   0 1 | 0       | Reset
 *   1 0 | 1       | Set
 *   1 1 | Q̅       | Toggle
 * 
 * Note: JK can implement D-FF (D→J, D̅→K) or T-FF (T→J=K)
 */
export class JKFlipFlop extends Gate {
    constructor(id, x, y) {
        super(id, 'jkflipflop', x, y);
        this.inputCount = 3; // J, K, Clock
        this.outputCount = 2; // Q, !Q
        this.outputs = [0, 1];
        this.lastClock = 0;
        
        // Timing parameters
        this.propagationDelay = PropagationDelays.DFF_CLK_TO_Q + 2; // Slightly slower than D-FF
        this.setupTime = PropagationDelays.DFF_SETUP;
        this.holdTime = PropagationDelays.DFF_HOLD;
    }

    compute() {
        const j = this.inputs[0] || 0;
        const k = this.inputs[1] || 0;
        const clk = this.inputs[2] || 0;
        let [q, qNot] = this.outputs;

        // Rising edge trigger
        if (clk && !this.lastClock) {
            if (Signal.isMetastable(j) || Signal.isMetastable(k)) {
                q = Signal.METASTABLE;
                qNot = Signal.METASTABLE;
                this.isMetastable = true;
            } else {
                if (j === 0 && k === 0) {
                    // Hold - no change
                } else if (j === 0 && k === 1) {
                    // Reset
                    q = 0;
                    qNot = 1;
                } else if (j === 1 && k === 0) {
                    // Set
                    q = 1;
                    qNot = 0;
                } else {
                    // Toggle (J=K=1)
                    const newQ = q ? 0 : 1;
                    q = newQ;
                    qNot = newQ ? 0 : 1;
                }
                this.isMetastable = false;
            }
        }
        
        this.lastClock = clk;
        this.outputs = [q, qNot];
        return [q, qNot];
    }
    
    reset() {
        this.outputs = [0, 1];
        this.lastClock = 0;
        this.isMetastable = false;
    }
}

/**
 * Clock Node - Auto-toggling input source
 */
export class Clock extends InputNode {
    constructor(id, x, y, frequency = 0.5) { // 0.5 Hz default (2s period) for visibility
        super(id, x, y, 'CLK');
        this.type = 'clock';
        this.frequency = frequency; 
        this.accumulatedTime = 0;
        this.period = 1000 / frequency; // ms
        this.isActive = true; // Can be paused
        this.value = 0;
        this.outputs = [0];
        this.propagationDelay = PropagationDelays.CLOCK;
    }

    setActive(active) {
        this.isActive = !!active;
    }

    pulse() {
        // Manual one-edge toggle. Useful for step-by-step labs.
        this.accumulatedTime = 0;
        this.toggle();
    }

    /**
     * Update clock based on elapsed time
     * @param {number} deltaTime - Time in ms since last update
     * @returns {boolean} true if value changed (toggled)
     */
    update(deltaTime) {
        if (!this.isActive) return false;
        
        this.accumulatedTime += deltaTime;
        // Toggle every half period
        const halfPeriod = this.period / 2;
        
        if (this.accumulatedTime >= halfPeriod) {
            this.accumulatedTime = this.accumulatedTime % halfPeriod; // Keep remainder for drift correction
            this.toggle();
            return true;
        }
        return false;
    }

    toggle() {
        const newValue = (this.value === 0) ? 1 : 0;
        this.setValue(newValue);
    }
}

/**
 * Gate Factory - Creates gates by type string
 */
export class GateFactory {
    static gateClasses = {
        'input': InputNode,
        'clock': Clock,
        'output': OutputNode,
        'transistor': Transistor,
        'not': NotGate,
        'and': AndGate,
        'or': OrGate,
        'nand': NandGate,
        'nor': NorGate,
        'xor': XorGate,
        'xnor': XnorGate,
        'halfadder': HalfAdder,
        'fulladder': FullAdder,
        'mux2to1': Mux2to1,
        'srlatch': SRLatch,
        'dflipflop': DFlipFlop,
        'tflipflop': TFlipFlop,
        'jkflipflop': JKFlipFlop,
        'tristate': TriState
    };

    static create(type, id, x = 0, y = 0) {
        const GateClass = this.gateClasses[type.toLowerCase()];
        if (!GateClass) {
            throw new Error(`Unknown gate type: ${type}`);
        }
        return new GateClass(id, x, y);
    }

    static register(type, GateClass) {
        this.gateClasses[type.toLowerCase()] = GateClass;
    }

    static getAvailableTypes() {
        return Object.keys(this.gateClasses);
    }
}
