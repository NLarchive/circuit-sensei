import { GateFactory, InputNode, OutputNode, Clock, Signal } from './Gates.js';
import { globalEvents, Events } from '../game/EventBus.js';

/**
 * Wire - Represents a connection between two gates
 * 
 * Physics: A wire is an equipotential node. Signal propagation is
 * essentially instantaneous at the abstraction level we simulate,
 * but metastable signals can propagate through the circuit.
 */
export class Wire {
    constructor(id, fromGate, fromPin, toGate, toPin) {
        this.id = id;
        this.fromGate = fromGate;
        this.fromPin = fromPin;
        this.toGate = toGate;
        this.toPin = toPin;
        this.signal = 0;
        this.isMetastable = false;
    }

    propagate() {
        const output = this.fromGate.outputs[this.fromPin];
        // Handle undefined outputs (default to 0) but preserve metastable
        if (output === undefined || output === null) {
            this.signal = 0;
            this.isMetastable = false;
        } else {
            this.signal = output;
            this.isMetastable = Signal.isMetastable(output);
        }
        return this.signal;
    }
}

/**
 * Circuit - The main simulation graph
 * Manages gates, wires, and signal propagation
 */
export class Circuit {
    // Circuit complexity limits for production stability
    static MAX_GATES = 200;
    static MAX_WIRES = 500;
    static MAX_SIMULATION_TIME_MS = 16; // ~60fps budget

    constructor() {
        this.gates = new Map();      // id -> Gate
        this.wires = new Map();      // id -> Wire
        this.inputs = [];            // Input nodes
        this.outputs = [];           // Output nodes
        this.wireCounter = 0;
        this.gateCounter = 0;

        this.lastSimulationInfo = {
            passes: 0,
            maxPasses: 0,
            converged: true,
            oscillating: false,
            metastableNodes: [],
            hasMetastability: false,
            physicsNote: '',
            simulationTimeMs: 0,
            gateCount: 0,
            wireCount: 0
        };

        this.bindEvents();
    }

    bindEvents() {
        globalEvents.on(Events.LEVEL_LOADED, (data) => {
            this.setupLevel(data.level);
        });
    }

    setupLevel(level) {
        this.clear();

        // Add inputs
        const inputCount = level.inputs || 1;
        for (let i = 0; i < inputCount; i++) {
            this.addGate('input', 100, 150 + i * 150);
        }

        // Add outputs
        // Determine output count from targetTruthTable or targetSequence if not specified
        const validationData = level.targetTruthTable || level.targetSequence;
        const outputCount = (validationData && validationData[0] && validationData[0].out.length) || 1;
        for (let i = 0; i < outputCount; i++) {
            this.addGate('output', 700, 150 + i * 150);
        }
    }

    clear() {
        this.gates.clear();
        this.wires.clear();
        this.inputs = [];
        this.outputs = [];
        this.wireCounter = 0;
        this.gateCounter = 0;
        this.lastSimulationInfo = {
            passes: 0,
            maxPasses: 0,
            converged: true,
            oscillating: false,
            metastableNodes: [],
            hasMetastability: false,
            physicsNote: ''
        };
        globalEvents.emit(Events.SIMULATION_RESET);
    }

    /**
     * Add a gate to the circuit
     */
    addGate(type, x = 0, y = 0) {
        // Check gate limit
        if (this.gates.size >= Circuit.MAX_GATES) {
            globalEvents.emit(Events.CIRCUIT_LIMIT_REACHED, {
                type: 'gates',
                limit: Circuit.MAX_GATES,
                message: `Circuit limit: Maximum ${Circuit.MAX_GATES} gates allowed for stable performance.`
            });
            return null;
        }

        const id = `gate_${this.gateCounter++}`;
        const gate = GateFactory.create(type, id, x, y);
        this.gates.set(id, gate);

        if (gate instanceof InputNode) {
            this.inputs.push(gate);
        } else if (gate instanceof OutputNode) {
            this.outputs.push(gate);
        }

        globalEvents.emit(Events.GATE_PLACED, { gate });
        return gate;
    }

    /**
     * Remove a gate and its connections
     */
    removeGate(gateId) {
        const gate = this.gates.get(gateId);
        if (!gate) return false;

        // Remove connected wires
        this.wires.forEach((wire, wireId) => {
            if (wire.fromGate.id === gateId || wire.toGate.id === gateId) {
                this.removeWire(wireId);
            }
        });

        // Remove from inputs/outputs arrays
        this.inputs = this.inputs.filter(g => g.id !== gateId);
        this.outputs = this.outputs.filter(g => g.id !== gateId);

        this.gates.delete(gateId);
        globalEvents.emit(Events.GATE_REMOVED, { gateId });
        return true;
    }

    /**
     * Connect two gates with a wire
     */
    connect(fromGateId, fromPin, toGateId, toPin) {
        // Check wire limit
        if (this.wires.size >= Circuit.MAX_WIRES) {
            globalEvents.emit(Events.CIRCUIT_LIMIT_REACHED, {
                type: 'wires',
                limit: Circuit.MAX_WIRES,
                message: `Circuit limit: Maximum ${Circuit.MAX_WIRES} wires allowed for stable performance.`
            });
            return null;
        }

        const fromGate = this.gates.get(fromGateId);
        const toGate = this.gates.get(toGateId);

        if (!fromGate || !toGate) {
            throw new Error('Invalid gate ID');
        }

        const wireId = `wire_${this.wireCounter++}`;
        const wire = new Wire(wireId, fromGate, fromPin, toGate, toPin);

        fromGate.outputWires.push(wire);
        toGate.inputWires.push(wire);

        this.wires.set(wireId, wire);
        globalEvents.emit(Events.WIRE_CONNECTED, { wire });

        return wire;
    }

    /**
     * Remove a wire connection
     */
    removeWire(wireId) {
        const wire = this.wires.get(wireId);
        if (!wire) return false;

        wire.fromGate.outputWires = wire.fromGate.outputWires.filter(w => w.id !== wireId);
        wire.toGate.inputWires = wire.toGate.inputWires.filter(w => w.id !== wireId);

        this.wires.delete(wireId);
        globalEvents.emit(Events.WIRE_DISCONNECTED, { wireId });
        return true;
    }

    /**
     * Set input values for the circuit
     */
    setInputs(values) {
        // Sort inputs by Y position then X to ensure consistent mapping to truth table rows
        const sortedInputs = [...this.inputs].sort((a, b) => (a.y - b.y) || (a.x - b.x));
        sortedInputs.forEach((input, index) => {
            const value = values[index] !== undefined ? values[index] : 0;
            input.setValue(value);
        });
    }

    /**
     * Get output values from the circuit
     */
    getOutputs() {
        // Sort outputs by Y position then X to ensure consistent mapping to truth table columns
        const sortedOutputs = [...this.outputs].sort((a, b) => (a.y - b.y) || (a.x - b.x));
        return sortedOutputs.map(output => output.outputs[0] || 0);
    }

    /**
     * Advance simulation time (for clocks and sequential elements)
     * @param {number} deltaTime - Time step in milliseconds
     * @returns {boolean} true if circuit state changed (clock tick)
     */
    tick(deltaTime) {
        let clockChanged = false;
        
        // Update all clocks
        this.gates.forEach(gate => {
            if (gate instanceof Clock || gate.type === 'clock') {
                // Duck typing check for update method
                if (typeof gate.update === 'function') {
                    if (gate.update(deltaTime)) {
                        clockChanged = true;
                    }
                }
            }
        });

        if (clockChanged) {
            this.simulate();
            return true;
        }
        
        return false;
    }

    setClocksActive(active) {
        this.gates.forEach(gate => {
            if (gate instanceof Clock || gate.type === 'clock') {
                if (typeof gate.setActive === 'function') {
                    gate.setActive(active);
                } else {
                    gate.isActive = !!active;
                }
            }
        });
    }

    pulseClocks() {
        let pulsed = false;
        this.gates.forEach(gate => {
            if (gate instanceof Clock || gate.type === 'clock') {
                if (typeof gate.pulse === 'function') {
                    gate.pulse();
                    pulsed = true;
                }
            }
        });

        if (pulsed) {
            this.simulate();
        }

        return pulsed;
    }

    /**
     * Resolve multiple drivers on a single wire/pin
     * Physics: Handles tri-state bus contention
     */
    resolveSignals(signals) {
        let result = Signal.HIZ;
        let contention = false;

        for (const s of signals) {
            if (s === Signal.HIZ) continue;
            
            if (result === Signal.HIZ) {
                result = s;
            } else if (result !== s) {
                // Contention! e.g. 1 driven by one gate, 0 by another
                contention = true;
                break;
            }
        }

        if (contention) return Signal.METASTABLE;
        return result;
    }

    /**
     * Simulate signal propagation
     * Uses an iterative approach to support feedback loops (sequential circuits)
     * 
     * Physics-First Notes:
     * - Combinational circuits should converge in O(depth) passes
     * - Feedback loops (latches, oscillators) may not converge
     * - Oscillation = ring oscillator behavior (odd inverter chain in loop)
     * - Metastability = bistable element caught in unstable equilibrium
     */
    simulate() {
        const startTime = performance.now();
        
        let changed = true;
        let passes = 0;
        const maxPasses = 15; // Increased for deeper circuits
        const seenStates = new Map();
        let oscillating = false;
        const metastableNodes = [];

        // Reset metastable flags before simulation pass
        this.gates.forEach(gate => {
            if (gate.isMetastable !== undefined) {
                // Don't auto-clear for sequential elements (they track their own state)
                if (!['srlatch', 'dflipflop'].includes(gate.type)) {
                    gate.isMetastable = false;
                }
            }
        });

        while (changed && passes < maxPasses) {
            // Check simulation time budget
            const elapsed = performance.now() - startTime;
            if (elapsed > Circuit.MAX_SIMULATION_TIME_MS) {
                console.warn(`Simulation timeout after ${elapsed.toFixed(2)}ms at pass ${passes}`);
                break;
            }
            
            changed = false;
            passes++;

            this.gates.forEach(gate => {
                const oldOutputs = [...(gate.outputs || [])];
                
                // Gather inputs from connected wires (supporting multiple drivers/tri-state)
                const pinGroupedWires = {};
                gate.inputWires.forEach(wire => {
                    wire.propagate();
                    if (!pinGroupedWires[wire.toPin]) pinGroupedWires[wire.toPin] = [];
                    pinGroupedWires[wire.toPin].push(wire);
                });

                const inputValues = [];
                let hasMetastableInput = false;

                for (let i = 0; i < gate.inputCount; i++) {
                    const wires = pinGroupedWires[i] || [];
                    if (wires.length === 0) {
                        inputValues[i] = 0; // Floating defaults to 0
                    } else if (wires.length === 1) {
                        inputValues[i] = wires[0].signal;
                    } else {
                        // Resolve multiple drivers (contention handling)
                        inputValues[i] = this.resolveSignals(wires.map(w => w.signal));
                    }
                    
                    if (Signal.isMetastable(inputValues[i])) {
                        hasMetastableInput = true;
                    }

                    // For gates not designed for HiZ, treat it as 0 (weak pull-down)
                    if (inputValues[i] === Signal.HIZ) {
                        inputValues[i] = 0;
                    }
                }

                // Compute gate output
                if (gate.inputWires.length > 0 || gate.inputCount === 0) {
                    gate.setInputs(inputValues);
                    
                    // For combinational gates, metastable input = metastable output
                    if (hasMetastableInput && !['srlatch', 'dflipflop'].includes(gate.type)) {
                        gate.isMetastable = true;
                    }
                } else {
                    // For source nodes (inputs), outputs are set via setInputs() or are constant
                    if (!(gate instanceof InputNode)) {
                        gate.outputs = gate.compute();
                    }
                }

                // Check if outputs changed to determine if we need another pass
                const newOutputsStr = JSON.stringify(gate.outputs);
                const oldOutputsStr = JSON.stringify(oldOutputs);
                if (oldOutputsStr !== newOutputsStr) {
                    changed = true;
                }
            });

            // Detect oscillation: repeated global output state across passes
            // Only check if still changing (stable repeat = converged, not oscillating)
            if (changed) {
                const stateKey = Array.from(this.gates.values())
                    .map(g => `${g.id}:${(g.outputs || []).join(',')}`)
                    .join('|');
                if (seenStates.has(stateKey)) {
                    // Same state seen before while still changing = oscillation
                    oscillating = true;
                    break;
                }
                seenStates.set(stateKey, passes);
            }
        }

        // Collect metastable nodes for UI feedback
        this.gates.forEach(gate => {
            if (gate.isMetastable || 
                (gate.outputs && gate.outputs.some(o => Signal.isMetastable(o)))) {
                metastableNodes.push(gate.id);
            }
        });

        // Also check wires for metastable signals
        this.wires.forEach(wire => {
            if (wire.isMetastable) {
                // The fromGate is the source of metastability
                if (!metastableNodes.includes(wire.fromGate.id)) {
                    metastableNodes.push(wire.fromGate.id);
                }
            }
        });

        const converged = !changed && !oscillating;
        const hasMetastability = metastableNodes.length > 0;
        const simulationTimeMs = performance.now() - startTime;
        
        this.lastSimulationInfo = { 
            passes, 
            maxPasses, 
            converged, 
            oscillating,
            metastableNodes,
            hasMetastability,
            simulationTimeMs,
            gateCount: this.gates.size,
            wireCount: this.wires.size,
            // Physics-first explanation for educational UI
            physicsNote: oscillating 
                ? 'Circuit is oscillating (ring oscillator behavior - feedback path with odd inversions)'
                : hasMetastability
                    ? 'Metastable state detected (bistable element in forbidden/undefined state)'
                    : converged 
                        ? 'Circuit reached stable state'
                        : 'Circuit did not converge (too deep or unstable)'
        };

        globalEvents.emit(Events.SIMULATION_TICK, { 
            inputs: this.inputs.map(i => i.value),
            outputs: this.getOutputs(),
            simulation: this.lastSimulationInfo
        });

        return this.getOutputs();
    }

    /**
     * Calculate the critical path delay through the circuit
     * Physics: Signal must propagate through a chain of gates, each adding delay
     * Critical path = longest combinational path (determines max clock frequency)
     * 
     * @returns {Object} { criticalPath: Gate[], totalDelay: number (ns), pathDescription: string }
     */
    analyzeTiming() {
        // Build adjacency map for forward traversal
        const forwardEdges = new Map();  // gateId -> [downstream gateIds]
        const backwardEdges = new Map(); // gateId -> [upstream gateIds]
        
        this.gates.forEach(gate => {
            forwardEdges.set(gate.id, []);
            backwardEdges.set(gate.id, []);
        });
        
        this.wires.forEach(wire => {
            const fwd = forwardEdges.get(wire.fromGate.id);
            if (fwd && !fwd.includes(wire.toGate.id)) {
                fwd.push(wire.toGate.id);
            }
            const bwd = backwardEdges.get(wire.toGate.id);
            if (bwd && !bwd.includes(wire.fromGate.id)) {
                bwd.push(wire.fromGate.id);
            }
        });

        // Calculate arrival time at each gate using topological traversal
        // arrivalTime[gate] = max(arrivalTime[predecessor]) + gate.propagationDelay
        const arrivalTime = new Map();
        const predecessor = new Map();
        
        // Initialize inputs with 0 delay
        this.inputs.forEach(input => {
            arrivalTime.set(input.id, input.propagationDelay || 0);
            predecessor.set(input.id, null);
        });

        // Topological order using Kahn's algorithm (handles cycles gracefully)
        const inDegree = new Map();
        this.gates.forEach(gate => {
            inDegree.set(gate.id, (backwardEdges.get(gate.id) || []).length);
        });
        
        const queue = [];
        this.gates.forEach(gate => {
            if (inDegree.get(gate.id) === 0) {
                queue.push(gate.id);
            }
        });

        const processedCount = { count: 0 };
        while (queue.length > 0) {
            const gateId = queue.shift();
            const gate = this.gates.get(gateId);
            processedCount.count++;

            // Calculate arrival time for this gate
            const upstreamIds = backwardEdges.get(gateId) || [];
            let maxUpstreamArrival = 0;
            let maxPredecessor = null;
            
            upstreamIds.forEach(upId => {
                const upArrival = arrivalTime.get(upId) || 0;
                if (upArrival > maxUpstreamArrival) {
                    maxUpstreamArrival = upArrival;
                    maxPredecessor = upId;
                }
            });

            const myArrival = maxUpstreamArrival + (gate.propagationDelay || 0);
            arrivalTime.set(gateId, myArrival);
            predecessor.set(gateId, maxPredecessor);

            // Process downstream gates
            (forwardEdges.get(gateId) || []).forEach(downId => {
                const deg = inDegree.get(downId) - 1;
                inDegree.set(downId, deg);
                if (deg === 0) {
                    queue.push(downId);
                }
            });
        }

        // Find the output with maximum arrival time (critical path endpoint)
        let maxDelay = 0;
        let criticalOutput = null;
        this.outputs.forEach(output => {
            const arrival = arrivalTime.get(output.id) || 0;
            if (arrival > maxDelay) {
                maxDelay = arrival;
                criticalOutput = output;
            }
        });

        // Trace back to reconstruct the critical path
        const criticalPath = [];
        let currentId = criticalOutput ? criticalOutput.id : null;
        while (currentId) {
            criticalPath.unshift(this.gates.get(currentId));
            currentId = predecessor.get(currentId);
        }

        // Calculate max clock frequency (fmax = 1 / critical_path_delay)
        const maxFrequencyMHz = maxDelay > 0 ? 1000 / maxDelay : Infinity;

        return {
            criticalPath,
            totalDelayNs: maxDelay,
            pathDescription: criticalPath.map(g => `${g.type}(${g.propagationDelay}ns)`).join(' → '),
            maxFrequencyMHz: Math.round(maxFrequencyMHz * 100) / 100,
            gateDelays: Array.from(this.gates.values()).map(g => ({
                id: g.id,
                type: g.type,
                arrivalTimeNs: arrivalTime.get(g.id) || 0,
                propagationDelayNs: g.propagationDelay || 0
            })),
            hasCycles: processedCount.count < this.gates.size
        };
    }

    /**
     * Detect timing hazards in combinational logic
     * Physics: Different paths to same gate with different delays → glitch potential
     * 
     * @returns {Array} Array of hazard descriptions
     */
    detectHazards() {
        const hazards = [];
        
        this.gates.forEach(gate => {
            // Skip inputs, outputs, and sequential elements
            if (gate.inputCount === 0 || gate.type === 'output' || 
                ['srlatch', 'dflipflop', 'clock'].includes(gate.type)) {
                return;
            }

            // Gather input arrival times
            const inputArrivals = [];
            gate.inputWires.forEach(wire => {
                const fromGate = wire.fromGate;
                // Simple approximation: trace back one level
                let arrivalTime = fromGate.propagationDelay || 0;
                if (fromGate.inputWires.length > 0) {
                    // Add upstream delay (simplified)
                    const upstreamDelays = fromGate.inputWires.map(w => 
                        (w.fromGate.propagationDelay || 0)
                    );
                    arrivalTime += Math.max(...upstreamDelays, 0);
                }
                inputArrivals.push({
                    pin: wire.toPin,
                    arrivalNs: arrivalTime,
                    sourceGate: fromGate.type
                });
            });

            // Check for significant skew between inputs (potential hazard)
            if (inputArrivals.length >= 2) {
                const times = inputArrivals.map(a => a.arrivalNs);
                const maxSkew = Math.max(...times) - Math.min(...times);
                
                // If skew > gate propagation delay, there's hazard potential
                if (maxSkew > (gate.propagationDelay || 10)) {
                    hazards.push({
                        gateId: gate.id,
                        gateType: gate.type,
                        skewNs: maxSkew,
                        inputs: inputArrivals,
                        description: `Static hazard potential: ${maxSkew}ns skew between inputs of ${gate.type} gate`,
                        hazardType: 'static'
                    });
                }
            }
        });

        return hazards;
    }

    /**
     * Reset the circuit to initial state
     */
    reset() {
        this.inputs.forEach(input => input.setValue(0));
        this.gates.forEach(gate => {
            gate.inputs = [];
            gate.outputs = [];
            gate.isMetastable = false;
            gate.hasGlitch = false;
            gate.transitionHistory = [];
            // Reset sequential elements to stable state
            if (gate.resetToStable) gate.resetToStable();
            if (gate.reset) gate.reset();
        });
        this.lastSimulationInfo = {
            passes: 0,
            maxPasses: 0,
            converged: true,
            oscillating: false,
            metastableNodes: [],
            hasMetastability: false,
            physicsNote: ''
        };
        globalEvents.emit(Events.SIMULATION_RESET);
    }

    /**
     * Get circuit state for serialization
     */
    serialize() {
        return {
            gates: Array.from(this.gates.values()).map(g => ({
                id: g.id,
                type: g.type,
                x: g.x,
                y: g.y,
                label: g.label
            })),
            wires: Array.from(this.wires.values()).map(w => ({
                id: w.id,
                from: w.fromGate.id,
                fromPin: w.fromPin,
                to: w.toGate.id,
                toPin: w.toPin
            }))
        };
    }

    /**
     * Restore circuit from serialized state
     */
    deserialize(data) {
        this.clear();
        
        data.gates.forEach(g => {
            const gate = this.addGate(g.type, g.x, g.y);
            if (g.label) gate.label = g.label;
        });

        data.wires.forEach(w => {
            this.connect(w.from, w.fromPin, w.to, w.toPin);
        });
    }
}
