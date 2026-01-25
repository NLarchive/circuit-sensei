import { HUDUtils } from './HUDUtils.js';

let _visIdCounter = 0;

function addPrefixToIds(svg, prefix) {
    if (!svg) return svg;
    // Prefix id attributes
    svg = svg.replace(/id="([^"]+)"/g, (m, id) => `id="${prefix}-${id}"`);
    // Prefix url(#id) references used by markers, filters, clipPath, etc.
    svg = svg.replace(/url\(#([^\)\"]+)\)/g, (m, id) => `url(#${prefix}-${id})`);
    // Prefix href/xlink:href references
    svg = svg.replace(/href=\"#([^\"]+)\"/g, (m, id) => `href=\"#${prefix}-${id}\"`);
    svg = svg.replace(/xlink:href=\"#([^\"]+)\"/g, (m, id) => `xlink:href=\"#${prefix}-${id}\"`);
    return svg;
}

export const HUDVisuals = {
    getLevelVisualList(level) {
        const result = [];

        const pushUnique = (entry) => {
            if (!entry || !entry.type) return;
            const key = String(entry.type);
            if (result.some(r => String(r.type) === key)) return;
            result.push(entry);
        };

        const titleByType = {
            electron_flow: 'Charge Carriers in a Conductor',
            electron_flow_detailed: 'Charge Carriers in a Conductor',
            electric_field: 'Electric Field & Potential Difference',
            semiconductor_doping: 'Doping: N-type vs P-type',
            npn_transistor: 'NPN Junctions & Carrier Injection',
            npn_transistor_detailed: 'NPN Junctions & Carrier Injection',
            vacuum_tube: 'Thermionic Emission (Historical Switch)',
            cmos_inverter: 'CMOS Inverter: Pull-up / Pull-down',
            series_circuit: 'Series Path: AND (Both Must Conduct)',
            series_circuit_detailed: 'Series Path: AND (Both Must Conduct)',
            parallel_circuit: 'Parallel Paths: OR (Any Can Conduct)',
            parallel_circuit_detailed: 'Parallel Paths: OR (Any Can Conduct)',
            nand_universal: 'NAND is Universal',
            nand_universal_detailed: 'NAND is Universal',
            nand_to_not: 'NOT from NAND (Tie Inputs)',
            xor_gate: 'XOR: Difference / Parity',
            xor_gate_detailed: 'XOR: Difference / Parity',
            de_morgan: 'De Morgan (Bubble Pushing)',
            de_morgan_detailed: 'De Morgan (Bubble Pushing)',
            multiplexer: 'MUX: Select One Data Path',
            multiplexer_detailed: 'MUX: Select One Data Path',
            decoder: 'Decoder: One-Hot Line Select',
            decoder_detailed: 'Decoder: One-Hot Line Select',
            half_adder: 'Half Adder: Sum & Carry',
            half_adder_detailed: 'Half Adder: Sum & Carry',
            full_adder: 'Full Adder: Carry Propagate',
            full_adder_detailed: 'Full Adder: Carry Propagate',
            sr_latch: 'SR Latch: Feedback = Memory',
            sr_latch_detailed: 'SR Latch: Feedback = Memory',
            dff_timing: 'DFF Timing: Sample on Rising Edge',
            t_flipflop: 'T Flip-Flop: Divide-by-2',
            t_flipflop_detailed: 'T Flip-Flop: Divide-by-2',
            counter_2bit: 'Counter: Sequential States',
            counter_detailed: 'Counter: Sequential States',
            traffic_light: 'FSM: State → Outputs',
            fsm_traffic: 'FSM: State → Outputs',
            alu: 'ALU: Operation Select & Flags',
            alu_detailed: 'ALU: Operation Select & Flags',
            cpu_datapath: 'CPU Datapath: Fetch → Decode → Execute',
            cpu_datapath_detailed: 'CPU Datapath: Fetch → Decode → Execute',
            ripple_counter_2bit: 'Ripple Counter (Asynchronous)',
            fsm_traffic_light: 'FSM: Traffic Light Controller',
            alu_basic: 'ALU: Fundamental Operations',
            wire_connection: 'Signal Path: Connection',
            cascade_and: 'Multi-input AND (Gate Cascade)',
            cascade_or: 'Multi-input OR (Gate Cascade)',
            nand_construction: 'Building NAND from AND+NOT',
            nor_universal: 'NOR as a Universal Gate',
            nand_universality: 'The Power of NAND Universality',
            nand_to_and: 'Building AND from NANDs',
            nand_to_xor_4gate: 'Building XOR from 4 NANDs',
            xnor_equality: 'XNOR: Bitwise Equality Detector',
            parity_generator: 'Parity Generator (Odd/Even Check)',
            nor_to_and: 'De Morgan: AND from NOR Gates',
            de_morgan_3var: 'De Morgan laws (Multi-variable)',
            input_logic: 'Logic Levels (High vs Low)',
            output_logic: 'Driving Output Indicators',
            branch_wiring: 'Signal Distribution (Fan-out)',
            transistor_switch: 'Transistors as Digital Switches',
            not_gate: 'NOT Gate: Signal Inverter',
            and_gate: 'AND Gate: All Inputs Required',
            or_gate: 'OR Gate: Any Input Sufficient',
            nand_gate: 'NAND Gate: The Universal Building Block',
            nor_gate: 'NOR Gate: Inverted OR Logic',
            combined_gates: 'Compound Logic Structures',
            triple_and: 'Multiple Input Gates',
            dual_cascade: 'Cascaded Logic Paths',
            universal_nand: 'Universal Logic with NAND',
            universal_nor: 'Universal Logic with NOR',
            feedback_loop: 'Feedback and State Storage',
            oscillator: 'Clock Generation and Timing',
            ripple_carry: 'Carry Propagation in Adders',
            demux_1to2: 'Demultiplexer: Signal Distribution',
            priority_encoder: 'Signal Priority Encoding',
            mux_4to1: 'Multi-channel Data Selection',
            d_latch: 'Level-Sensitive Memory (Latch)',
            d_flipflop: 'Edge-Triggered State (Flip-Flop)',
            ripple_counter_4bit: '4-Bit Ripple Counter',
            apollo_nor_adder: 'Apollo AGC Design: NOR-based Math',
            d_latch_construction: 'Building Latch from Gates',
            freq_divider: 'Clock Frequency Division',
            jk_flipflop: 'The Versatile JK Flip-Flop',
            gray_code_counter: 'Gray Code: Single-bit Transitions',
            sync_counter: 'Synchronous State Machines',
            ring_counter: 'Shift Register Counters',
            sequence_detector: 'Pattern and Sequence Detection',
            alu_extended: 'Advanced ALU Functionality',
            magnitude_comparator: 'Bitwise Value Comparison',
            instruction_decoder: 'CPU Instruction Processing',
            pipeline_2stage: 'Instruction Pipelining',
            and_gate_basic: 'AND Gate: All Inputs Required',
            or_gate_basic: 'OR Gate: Any Input Sufficient',
            nand_gate_basic: 'NAND Gate: The Universal Building Block',
            xor_gate_basic: 'XOR: Difference / Parity',
            mux_2to1_basic: 'MUX: Select One Data Path',
            decoder_2to4: 'Decoder: One-Hot Line Select',
            parallel_wires: 'Signal Path: Parallel Connections',
            de_morgan_and: 'De Morgan: AND via Inversion',
            majority_gate: 'Majority Gate: 2-of-3 Logic',
            half_subtractor: 'Half Subtractor: Difference & Borrow',
            full_subtractor: 'Full Subtractor: Borrow Propagation',
            ripple_carry_2bit: 'Ripple Carry: Multi-bit Addition',
            sr_latch_basic: 'SR Latch: Feedback = Memory',
            gated_sr_latch: 'Gated SR Latch: Enable Control',
            d_flipflop_basic: 'D Flip-Flop: Sample on Clock Edge',
            dff_enable: 'D Flip-Flop: Clock Enable',
            t_flipflop_toggle: 'T Flip-Flop: Toggle on Clock',
            edge_detector: 'Edge Detector: Pulse on Transition'
        };

        const normalizeEntry = (v) => {
            if (!v) return null;
            if (typeof v === 'string') return { type: v, title: titleByType[v] || '' };
            if (typeof v === 'object') {
                const type = v.type || v.visual || v.physicsVisual;
                if (!type) return null;
                return { type, title: v.title || titleByType[type] || '' };
            }
            return null;
        };

        // Allow: physicsVisual as string OR array OR physicsVisuals array
        if (Array.isArray(level?.physicsVisual)) {
            level.physicsVisual.map(normalizeEntry).filter(Boolean).forEach(pushUnique);
        } else if (typeof level?.physicsVisual === 'string' && level.physicsVisual.trim()) {
            pushUnique({ type: level.physicsVisual, title: titleByType[level.physicsVisual] || '' });
        }

        if (Array.isArray(level?.physicsVisuals)) {
            level.physicsVisuals.map(normalizeEntry).filter(Boolean).forEach(pushUnique);
        }

        // Also allow visuals to be declared directly on concept cards
        if (level?.physicsDetails && Array.isArray(level.physicsDetails.conceptCards)) {
            level.physicsDetails.conceptCards.forEach(card => {
                if (!card || typeof card !== 'object') return;
                const entries = [];
                if (Array.isArray(card.visuals)) entries.push(...card.visuals);
                if (card.visual) entries.push(card.visual);
                if (card.physicsVisual) entries.push(card.physicsVisual);
                entries.map(normalizeEntry).filter(Boolean).forEach(pushUnique);
            });
        }

        return result;
    },

    generateLevelVisuals(level) {
        const visuals = this.getLevelVisualList(level);
        if (!visuals.length) return this.generateLevelVisual(level);

        return `
            <div class="visual-stack">
                ${visuals.map(v => {
                    const title = v.title ? `<div class="visual-caption">${HUDUtils.escapeHtml(v.title)}</div>` : '';
                    return `<div class="visual-item">${title}${this.generatePhysicsVisual(v.type)}</div>`;
                }).join('')}
            </div>
        `;
    },

    generateLevelVisual(level) {
        // If the level provides physicsVisual(s), prefer that over hardcoded fallbacks.
        // Handle both string and array schemas safely.
        if (level.physicsVisual) {
            if (Array.isArray(level.physicsVisual)) {
                const first = level.physicsVisual[0];
                const type = (typeof first === 'string') ? first : (first && typeof first === 'object' ? (first.type || first.visual || first.physicsVisual) : null);
                if (type) return this.generatePhysicsVisual(type);
            } else {
                return this.generatePhysicsVisual(level.physicsVisual);
            }
        }

        const levelId = level.id;
        
        // Level-specific physics visualizations (Fallback for legacy/hardcoded)
        switch(levelId) {
            case 'level_01': return this.generatePhysicsVisual('electron_flow');
            case 'level_02': return this.generatePhysicsVisual('npn_transistor');
            case 'level_03': return this.generatePhysicsVisual('vacuum_tube'); // Metaphor for inverter
            case 'level_04': return this.generatePhysicsVisual('series_circuit'); // AND
            case 'level_05': return this.generatePhysicsVisual('parallel_circuit'); // OR
            case 'level_06': return this.generatePhysicsVisual('nand_universal');
            case 'level_07': return this.generatePhysicsVisual('nand_universal'); // NOT from NAND
            case 'level_08': return this.generatePhysicsVisual('xor_gate');
            case 'level_09': return this.generatePhysicsVisual('de_morgan');
            case 'level_10': return this.generatePhysicsVisual('multiplexer');
            case 'level_11': return this.generatePhysicsVisual('decoder');
            case 'level_12': return this.generatePhysicsVisual('half_adder');
            case 'level_13': return this.generatePhysicsVisual('full_adder');
            case 'level_14': return this.generatePhysicsVisual('sr_latch');
            case 'level_15': return this.generatePhysicsVisual('sr_latch'); // D Flip-Flop (uses latch logic)
            case 'level_16': return this.generatePhysicsVisual('t_flipflop');
            case 'level_17': return this.generatePhysicsVisual('counter_2bit');
            case 'level_18': return this.generatePhysicsVisual('traffic_light');
            case 'level_19': return this.generatePhysicsVisual('alu');
            case 'level_boss': return this.generatePhysicsVisual('cpu_datapath');
            default:
                // Fallback with tier icon
                const icons = { 
                    'tier_1': '⚡', 
                    'tier_2': '🔲', 
                    'tier_3': '➕', 
                    'tier_4': '💾', 
                    'tier_5': '🚦', 
                    'tier_6': '🖥️' 
                };
                const icon = icons[level.tier] || '⚡';
                return `<svg width="200" height="100" viewBox="0 0 200 100">
                    <circle cx="100" cy="50" r="40" fill="none" stroke="#00ff00" stroke-width="2"/>
                    <text x="100" y="65" text-anchor="middle" fill="#00ff00" font-size="32">${icon}</text>
                </svg>`;
        }
    },

    getGateIcon(gateId) {
        const icons = {
            'input': `<svg viewBox="0 0 40 30"><circle cx="20" cy="15" r="10" fill="none" stroke="#0f0" stroke-width="2"/><text x="20" y="19" text-anchor="middle" fill="#0f0" font-size="10">IN</text></svg>`,
            'output': `<svg viewBox="0 0 40 30"><circle cx="20" cy="15" r="10" fill="none" stroke="#f00" stroke-width="2"/><text x="20" y="19" text-anchor="middle" fill="#f00" font-size="10">OUT</text></svg>`,
            'clock': `<svg viewBox="0 0 40 30"><circle cx="20" cy="15" r="10" fill="none" stroke="#ff0" stroke-width="2"/><path d="M12,15 L16,15 L16,10 L20,10 L20,20 L24,20 L24,15 L28,15" fill="none" stroke="#ff0" stroke-width="1.5"/></svg>`,
            'not': `<svg viewBox="0 0 40 30"><polygon points="8,5 28,15 8,25" fill="none" stroke="#0f0" stroke-width="2"/><circle cx="31" cy="15" r="3" fill="none" stroke="#0f0" stroke-width="2"/></svg>`,
            'and': `<svg viewBox="0 0 40 30"><path d="M8,5 L20,5 Q32,5 32,15 Q32,25 20,25 L8,25 Z" fill="none" stroke="#0f0" stroke-width="2"/></svg>`,
            'or': `<svg viewBox="0 0 40 30"><path d="M8,5 Q14,15 8,25 Q20,25 28,15 Q20,5 8,5" fill="none" stroke="#0f0" stroke-width="2"/></svg>`,
            'nand': `<svg viewBox="0 0 40 30"><path d="M6,5 L16,5 Q26,5 26,15 Q26,25 16,25 L6,25 Z" fill="none" stroke="#0f0" stroke-width="2"/><circle cx="29" cy="15" r="3" fill="none" stroke="#0f0" stroke-width="2"/></svg>`,
            'nor': `<svg viewBox="0 0 40 30"><path d="M6,5 Q12,15 6,25 Q16,25 24,15 Q16,5 6,5" fill="none" stroke="#0f0" stroke-width="2"/><circle cx="27" cy="15" r="3" fill="none" stroke="#0f0" stroke-width="2"/></svg>`,
            'xor': `<svg viewBox="0 0 40 30"><path d="M10,5 Q16,15 10,25 Q22,25 30,15 Q22,5 10,5" fill="none" stroke="#0f0" stroke-width="2"/><path d="M6,5 Q12,15 6,25" fill="none" stroke="#0f0" stroke-width="2"/></svg>`,
            'xnor': `<svg viewBox="0 0 40 30"><path d="M8,5 Q14,15 8,25 Q18,25 24,15 Q18,5 8,5" fill="none" stroke="#0f0" stroke-width="2"/><path d="M4,5 Q10,15 4,25" fill="none" stroke="#0f0" stroke-width="2"/><circle cx="27" cy="15" r="3" fill="none" stroke="#0f0" stroke-width="2"/></svg>`,
            'halfadder': `<svg viewBox="0 0 40 30"><rect x="5" y="5" width="30" height="20" fill="none" stroke="#0f0" stroke-width="2" rx="3"/><text x="20" y="18" text-anchor="middle" fill="#0f0" font-size="8">HA</text></svg>`,
            'fulladder': `<svg viewBox="0 0 40 30"><rect x="5" y="5" width="30" height="20" fill="none" stroke="#0f0" stroke-width="2" rx="3"/><text x="20" y="18" text-anchor="middle" fill="#0f0" font-size="8">FA</text></svg>`,
            'srlatch': `<svg viewBox="0 0 40 30"><rect x="5" y="5" width="30" height="20" fill="none" stroke="#0f0" stroke-width="2" rx="3"/><text x="20" y="18" text-anchor="middle" fill="#0f0" font-size="7">SR</text></svg>`,
            'dflipflop': `<svg viewBox="0 0 40 30"><rect x="5" y="5" width="30" height="20" fill="none" stroke="#0f0" stroke-width="2" rx="3"/><text x="20" y="18" text-anchor="middle" fill="#0f0" font-size="8">DFF</text></svg>`,
            'tflipflop': `<svg viewBox="0 0 40 30"><rect x="5" y="5" width="30" height="20" fill="none" stroke="#0f0" stroke-width="2" rx="3"/><text x="20" y="18" text-anchor="middle" fill="#0f0" font-size="8">TFF</text></svg>`,
            'jkflipflop': `<svg viewBox="0 0 40 30"><rect x="5" y="5" width="30" height="20" fill="none" stroke="#0f0" stroke-width="2" rx="3"/><text x="20" y="18" text-anchor="middle" fill="#0f0" font-size="7">JK</text></svg>`,
            'mux2to1': `<svg viewBox="0 0 40 30"><path d="M8,2 L32,8 L32,22 L8,28 Z" fill="none" stroke="#0f0" stroke-width="2"/><text x="20" y="18" text-anchor="middle" fill="#0f0" font-size="7">MUX</text></svg>`,
            'tristate': `<svg viewBox="0 0 40 30"><polygon points="8,5 28,15 8,25" fill="none" stroke="#0f0" stroke-width="2"/><line x1="18" y1="5" x2="18" y2="0" stroke="#0f0" stroke-width="2"/></svg>`,
            'transistor': `<svg viewBox="0 0 40 30"><circle cx="20" cy="15" r="10" fill="none" stroke="#0f0" stroke-width="2"/><line x1="10" y1="15" x2="15" y2="15" stroke="#0f0" stroke-width="2"/><line x1="25" y1="8" x2="25" y2="22" stroke="#0f0" stroke-width="2"/></svg>`
        };
        return icons[gateId.toLowerCase()] || `<svg viewBox="0 0 40 30"><rect x="5" y="5" width="30" height="20" fill="none" stroke="#0f0" stroke-width="2" rx="3"/></svg>`;
    },

    generatePhysicsVisual(type) {
        // Normalize/alias physicsVisual keys from level data
        const aliases = {
            electron_flow_detailed: 'electron_flow',
            npn_transistor_detailed: 'npn_transistor',
            series_circuit_detailed: 'series_circuit',
            parallel_circuit_detailed: 'parallel_circuit',
            nand_universal_detailed: 'nand_universal',
            nand_to_not_detailed: 'nand_to_not',
            xor_gate_detailed: 'xor_gate',
            de_morgan_detailed: 'de_morgan',
            multiplexer_detailed: 'multiplexer',
            decoder_detailed: 'decoder',
            half_adder_detailed: 'half_adder',
            full_adder_detailed: 'full_adder',
            sr_latch_detailed: 'sr_latch',
            t_flipflop_detailed: 't_flipflop',
            counter_detailed: 'counter_2bit',
            ripple_counter_2bit: 'counter_2bit',
            fsm_traffic: 'traffic_light',
            fsm_traffic_light: 'traffic_light',
            alu_detailed: 'alu',
            alu_basic: 'alu',
            cpu_datapath_detailed: 'cpu_datapath',
            wire_connection: 'electron_flow',
            cascade_and: 'series_circuit',
            cascade_or: 'parallel_circuit',
            nand_construction: 'nand_universal',
            nor_universal: 'nand_universal',
            nand_universality: 'nand_universal',
            nand_to_and: 'nand_universal',
            nand_to_xor_4gate: 'nand_universal',
            xnor_equality: 'xor_gate',
            parity_generator: 'xor_gate',
            nor_to_and: 'de_morgan',
            de_morgan_3var: 'de_morgan',
            signal_propagation: 'electron_flow',
            parallel_wires_detailed: 'electron_flow',
            fan_out_tree: 'electron_flow',
            transmission_gate: 'npn_transistor',
            cmos_aoi: 'cmos_inverter',
            not_gate_detailed: 'cmos_inverter',
            double_negation: 'cmos_inverter',
            tristate_inverter: 'cmos_inverter',
            and_gate_detailed: 'series_circuit',
            and_gate_3input: 'series_circuit',
            or_gate_detailed: 'parallel_circuit',
            nand_gate_detailed: 'nand_universal',
            nand_to_xor: 'nand_universal',
            nor_gate_detailed: 'nand_universal',
            mux_as_and: 'multiplexer',
            mux_4to1_tree: 'multiplexer',
            decoder_enable: 'decoder',
            mux_2to1_basic: 'multiplexer',
            decoder_2to4: 'decoder',
            priority_encoder: 'decoder',
            apollo_nor_adder: 'half_adder',
            half_subtractor: 'half_adder',
            full_subtractor: 'full_adder',
            ripple_carry_2bit: 'full_adder',
            d_latch_construction: 'sr_latch',
            sr_latch_basic: 'sr_latch',
            gated_sr_latch: 'sr_latch',
            freq_divider: 't_flipflop',
            t_flipflop_toggle: 't_flipflop',
            jk_flipflop: 't_flipflop',
            d_flipflop_basic: 'dff_timing',
            dff_enable: 'dff_timing',
            gray_code_counter: 'counter_2bit',
            sync_counter: 'counter_2bit',
            ring_counter: 'counter_2bit',
            ripple_counter_2bit: 'counter_2bit',
            and_gate_basic: 'series_circuit',
            or_gate_basic: 'parallel_circuit',
            nand_gate_basic: 'nand_universal',
            xor_gate_basic: 'xor_gate',
            parallel_wires: 'electron_flow',
            transistor_switch: 'npn_transistor',
            de_morgan_and: 'de_morgan',
            majority_gate: 'series_circuit',
            edge_detector: 'xor_gate',
            sequence_detector: 'traffic_light',
            alu_extended: 'alu',
            magnitude_comparator: 'alu',
            instruction_decoder: 'cpu_datapath',
            pipeline_2stage: 'cpu_datapath'
        };

        const normalizedType = aliases[type] || type;

        const svg = (() => {
            switch (normalizedType) {
            case 'electron_flow':
                return `
                    <svg viewBox="0 0 260 150" class="edu-svg">
                        <defs>
                            <radialGradient id="electron-glow" cx="50%" cy="50%" r="50%">
                                <stop offset="0%" stop-color="#00ffff" stop-opacity="1"/>
                                <stop offset="100%" stop-color="#00ffff" stop-opacity="0"/>
                            </radialGradient>
                            <filter id="glow"><feGaussianBlur stdDeviation="1.5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                            <marker id="arrow-w" markerWidth="6" markerHeight="4" refX="0" refY="2" orient="auto">
                                <polygon points="0 0, 6 2, 0 4" fill="#ff0"/>
                            </marker>
                        </defs>
                        
                        <!-- Battery (EMF Source) -->
                        <rect x="10" y="55" width="28" height="55" fill="#444" stroke="#888" rx="3"/>
                        <line x1="16" y1="72" x2="34" y2="72" stroke="#0f0" stroke-width="3"/>
                        <line x1="25" y1="92" x2="25" y2="100" stroke="#0f0" stroke-width="2"/>
                        <text x="25" y="45" fill="#0f0" font-size="10" text-anchor="middle">+</text>
                        <text x="25" y="123" fill="#f00" font-size="10" text-anchor="middle">−</text>
                        
                        <!-- Wire (conductor) -->
                        <rect x="45" y="80" width="155" height="10" fill="#333" stroke="#666" rx="2"/>

                        <!-- Positive ion lattice (fixed + charges) -->
                        ${Array.from({ length: 10 }).map((_, i) => {
                            const x = 55 + i * 14;
                            return `
                                <circle cx="${x}" cy="85" r="4" fill="#222" stroke="#666"/>
                                <text x="${x}" y="88" fill="#aaa" font-size="7" text-anchor="middle">+</text>
                            `;
                        }).join('')}

                        <!-- Electric field direction (conventional) -->
                        <line x1="60" y1="65" x2="190" y2="65" stroke="#ff0" stroke-width="1.5" marker-end="url(#arrow-w)" stroke-dasharray="6,4">
                            <animate attributeName="stroke-dashoffset" values="10;0" dur="0.6s" repeatCount="indefinite"/>
                        </line>
                        <text x="125" y="58" fill="#ff0" font-size="8" text-anchor="middle">E-field (from + to −)</text>
                        
                        <!-- Animated electrons (e⁻) -->
                        <g filter="url(#glow)">
                            <circle r="4" fill="url(#electron-glow)">
                                <animate attributeName="cx" values="190;60;190" dur="3s" repeatCount="indefinite"/>
                                <animate attributeName="cy" values="85;85;85" dur="3s" repeatCount="indefinite"/>
                            </circle>
                            <text font-size="5" fill="#fff">
                                <animate attributeName="x" values="187;57;187" dur="3s" repeatCount="indefinite"/>
                                <animate attributeName="y" values="87;87;87" dur="3s" repeatCount="indefinite"/>
                                e⁻
                            </text>
                        </g>
                        <g filter="url(#glow)">
                            <circle r="4" fill="url(#electron-glow)">
                                <animate attributeName="cx" values="165;60;190;165" dur="3s" repeatCount="indefinite"/>
                                <animate attributeName="cy" values="85;85;85;85" dur="3s" repeatCount="indefinite"/>
                            </circle>
                        </g>
                        <g filter="url(#glow)">
                            <circle r="4" fill="url(#electron-glow)">
                                <animate attributeName="cx" values="140;60;190;140" dur="3s" repeatCount="indefinite"/>
                                <animate attributeName="cy" values="85;85;85;85" dur="3s" repeatCount="indefinite"/>
                            </circle>
                        </g>
                        
                        <!-- LED/Load -->
                        <circle cx="225" cy="85" r="18" fill="#222" stroke="#0f0" stroke-width="2">
                            <animate attributeName="fill" values="#222;#0f0;#222" dur="1.5s" repeatCount="indefinite"/>
                        </circle>
                        <text x="225" y="90" fill="#000" font-size="10" text-anchor="middle">Load</text>
                        
                        <!-- Labels -->
                        <text x="130" y="16" fill="#0ff" font-size="11" text-anchor="middle">Current = coordinated drift + field propagation</text>
                        <text x="130" y="132" fill="#aaa" font-size="9" text-anchor="middle">Electron drift: − → + (opposite the E-field)</text>
                        <text x="130" y="145" fill="#666" font-size="8" text-anchor="middle">Fixed ions are + (lattice); mobile carriers are e⁻</text>
                    </svg>`;

            case 'electric_field':
                return `
                    <svg viewBox="0 0 220 120" class="edu-svg">
                        <defs>
                            <marker id="field-arrow" markerWidth="6" markerHeight="4" refX="0" refY="2" orient="auto">
                                <polygon points="0 0, 6 2, 0 4" fill="#ffff00"/>
                            </marker>
                        </defs>
                        
                        <!-- Positive plate -->
                        <rect x="30" y="20" width="8" height="70" fill="#f44"/>
                        <text x="34" y="15" fill="#f44" font-size="14" text-anchor="middle">+</text>
                        
                        <!-- Negative plate -->
                        <rect x="170" y="20" width="8" height="70" fill="#44f"/>
                        <text x="174" y="15" fill="#44f" font-size="14" text-anchor="middle">−</text>
                        
                        <!-- Electric field lines (animated) -->
                        ${[30, 45, 60, 75].map(y => `
                            <line x1="45" y1="${y}" x2="160" y2="${y}" stroke="#ffff00" stroke-width="1" marker-end="url(#field-arrow)" stroke-dasharray="8,4">
                                <animate attributeName="stroke-dashoffset" from="12" to="0" dur="0.5s" repeatCount="indefinite"/>
                            </line>
                        `).join('')}
                        
                        <!-- Electron being pushed -->
                        <circle r="6" fill="#0ff">
                            <animate attributeName="cx" values="150;60;150" dur="2.5s" repeatCount="indefinite"/>
                            <animate attributeName="cy" values="55;55;55" dur="2.5s" repeatCount="indefinite"/>
                        </circle>
                        <text font-size="7" fill="#000" font-weight="bold">
                            <animate attributeName="x" values="147;57;147" dur="2.5s" repeatCount="indefinite"/>
                            <animate attributeName="y" values="58;58;58" dur="2.5s" repeatCount="indefinite"/>
                            e⁻
                        </text>
                        
                        <!-- Labels -->
                        <text x="100" y="105" fill="#ff0" font-size="8" text-anchor="middle">Electric Field: E⃗ = Force on charge</text>
                        <text x="100" y="115" fill="#aaa" font-size="7" text-anchor="middle">Voltage = Energy per Coulomb (J/C)</text>
                    </svg>`;

            case 'series_circuit':
                return `
                    <svg viewBox="0 0 260 140" class="edu-svg">
                        <defs>
                            <radialGradient id="e-glow" cx="50%" cy="50%" r="50%">
                                <stop offset="0%" stop-color="#0ff" stop-opacity="1"/>
                                <stop offset="100%" stop-color="#0ff" stop-opacity="0"/>
                            </radialGradient>
                            <filter id="glow2"><feGaussianBlur stdDeviation="1.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                        </defs>

                        <!-- Battery -->
                        <rect x="12" y="45" width="26" height="50" fill="#444" stroke="#888" rx="3"/>
                        <text x="25" y="38" fill="#0f0" font-size="10" text-anchor="middle">+</text>
                        <text x="25" y="110" fill="#f00" font-size="10" text-anchor="middle">−</text>
                        <line x1="18" y1="62" x2="34" y2="62" stroke="#0f0" stroke-width="3"/>
                        <line x1="25" y1="80" x2="25" y2="88" stroke="#0f0" stroke-width="2"/>
                        
                        <!-- Circuit path -->
                        <path d="M38,70 L65,70" stroke="#666" stroke-width="3" fill="none"/>
                        <path d="M100,70 L130,70" stroke="#666" stroke-width="3" fill="none"/>
                        <path d="M165,70 L205,70" stroke="#666" stroke-width="3" fill="none"/>
                        
                        <!-- Switch A (animates open→closed) -->
                        <circle cx="65" cy="70" r="4" fill="#aaa"/>
                        <circle cx="100" cy="70" r="4" fill="#aaa"/>
                        <g transform="translate(65 70)">
                            <line x1="0" y1="0" x2="30" y2="-18" stroke="#fff" stroke-width="2">
                                <animateTransform attributeName="transform" type="rotate" dur="4s" repeatCount="indefinite"
                                    values="-28;0;0;-28" keyTimes="0;0.25;0.85;1"/>
                            </line>
                        </g>
                        <text x="83" y="40" fill="#0f0" font-size="9" text-anchor="middle">A</text>
                        
                        <!-- Switch B (animates open→closed later) -->
                        <circle cx="130" cy="70" r="4" fill="#aaa"/>
                        <circle cx="165" cy="70" r="4" fill="#aaa"/>
                        <g transform="translate(130 70)">
                            <line x1="0" y1="0" x2="30" y2="-18" stroke="#fff" stroke-width="2">
                                <animateTransform attributeName="transform" type="rotate" dur="4s" repeatCount="indefinite"
                                    values="-28;-28;0;0;-28" keyTimes="0;0.35;0.6;0.85;1"/>
                            </line>
                        </g>
                        <text x="148" y="40" fill="#0f0" font-size="9" text-anchor="middle">B</text>
                        
                        <!-- Load -->
                        <circle cx="225" cy="70" r="14" fill="#222" stroke="#0f0" stroke-width="2">
                            <animate attributeName="fill" dur="4s" repeatCount="indefinite" values="#222;#222;#0f0;#0f0;#222" keyTimes="0;0.6;0.65;0.85;1"/>
                        </circle>
                        <text x="225" y="74" fill="#000" font-size="9" text-anchor="middle">Load</text>

                        <!-- Electrons appear only after both switches close -->
                        <circle r="3" fill="#0ff" filter="url(#glow2)">
                            <animate attributeName="opacity" dur="4s" repeatCount="indefinite" values="0;0;1;1;0" keyTimes="0;0.6;0.65;0.85;1"/>
                            <animate attributeName="cx" dur="1.2s" repeatCount="indefinite" values="205;65;205"/>
                            <animate attributeName="cy" dur="1.2s" repeatCount="indefinite" values="70;70;70"/>
                        </circle>
                        
                        <!-- Labels -->
                        <text x="130" y="18" fill="#0f0" font-size="10" text-anchor="middle">A · B (A AND B)</text>
                        <text x="130" y="118" fill="#fff" font-size="10" text-anchor="middle">Series conduction requires BOTH closed</text>
                        <text x="130" y="132" fill="#aaa" font-size="8" text-anchor="middle">Current flows only when A=1 and B=1</text>
                    </svg>`;

            case 'parallel_circuit':
                return `
                    <svg viewBox="0 0 260 140" class="edu-svg">
                        <defs>
                            <filter id="glow3"><feGaussianBlur stdDeviation="1.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                        </defs>

                        <!-- Battery -->
                        <rect x="12" y="45" width="26" height="50" fill="#444" stroke="#888" rx="3"/>
                        <text x="25" y="38" fill="#0f0" font-size="10" text-anchor="middle">+</text>
                        <text x="25" y="110" fill="#f00" font-size="10" text-anchor="middle">−</text>
                        <line x1="18" y1="62" x2="34" y2="62" stroke="#0f0" stroke-width="3"/>
                        <line x1="25" y1="80" x2="25" y2="88" stroke="#0f0" stroke-width="2"/>

                        <!-- Main circuit path -->
                        <path d="M38,70 L60,70" stroke="#666" stroke-width="3"/>
                        
                        <!-- Branch point -->
                        <path d="M60,70 L60,40 L90,40" stroke="#666" stroke-width="2"/>
                        <path d="M60,70 L60,100 L90,100" stroke="#666" stroke-width="2"/>
                        
                        <!-- Switch A (top) closes first -->
                        <circle cx="90" cy="40" r="3" fill="#aaa"/>
                        <circle cx="120" cy="40" r="3" fill="#aaa"/>
                        <g transform="translate(90 40)">
                            <line x1="0" y1="0" x2="25" y2="-14" stroke="#fff" stroke-width="2">
                                <animateTransform attributeName="transform" type="rotate" dur="4s" repeatCount="indefinite"
                                    values="-28;0;0;-28" keyTimes="0;0.25;0.85;1"/>
                            </line>
                        </g>
                        <text x="105" y="26" fill="#0f0" font-size="9" text-anchor="middle">A</text>
                        
                        <!-- Switch B (bottom) closes later -->
                        <circle cx="90" cy="100" r="3" fill="#aaa"/>
                        <circle cx="120" cy="100" r="3" fill="#aaa"/>
                        <g transform="translate(90 100)">
                            <line x1="0" y1="0" x2="25" y2="-14" stroke="#fff" stroke-width="2">
                                <animateTransform attributeName="transform" type="rotate" dur="4s" repeatCount="indefinite"
                                    values="-28;-28;0;0;-28" keyTimes="0;0.35;0.6;0.85;1"/>
                            </line>
                        </g>
                        <text x="105" y="116" fill="#0f0" font-size="9" text-anchor="middle">B</text>
                        
                        <!-- Merge point -->
                        <path d="M120,40 L160,40 L160,70" stroke="#666" stroke-width="2"/>
                        <path d="M120,100 L160,100 L160,70" stroke="#666" stroke-width="2"/>
                        <path d="M160,70 L205,70" stroke="#666" stroke-width="3"/>
                        
                        <!-- Load -->
                        <circle cx="225" cy="70" r="14" fill="#222" stroke="#0f0" stroke-width="2">
                            <animate attributeName="fill" dur="4s" repeatCount="indefinite" values="#222;#0f0;#0f0;#0f0;#222" keyTimes="0;0.3;0.6;0.85;1"/>
                        </circle>
                        <text x="225" y="74" fill="#000" font-size="9" text-anchor="middle">Load</text>
                        
                        <!-- Electron path A (active when A closes) -->
                        <circle r="3" fill="#0ff" filter="url(#glow3)">
                            <animate attributeName="opacity" dur="4s" repeatCount="indefinite" values="0;1;1;0;0" keyTimes="0;0.3;0.6;0.85;1"/>
                            <animate attributeName="cx" dur="1.2s" repeatCount="indefinite" values="200;60;60;90;120;160;160;205"/>
                            <animate attributeName="cy" dur="1.2s" repeatCount="indefinite" values="70;70;40;40;40;40;70;70"/>
                        </circle>

                        <!-- Electron path B (active when B closes) -->
                        <circle r="3" fill="#0ff" filter="url(#glow3)">
                            <animate attributeName="opacity" dur="4s" repeatCount="indefinite" values="0;0;1;1;0" keyTimes="0;0.6;0.65;0.85;1"/>
                            <animate attributeName="cx" dur="1.2s" repeatCount="indefinite" values="200;60;60;90;120;160;160;205"/>
                            <animate attributeName="cy" dur="1.2s" repeatCount="indefinite" values="70;70;100;100;100;100;70;70"/>
                        </circle>
                        
                        <!-- Labels -->
                        <text x="130" y="18" fill="#0f0" font-size="10" text-anchor="middle">A + B (A OR B)</text>
                        <text x="130" y="126" fill="#fff" font-size="10" text-anchor="middle">Any closed branch conducts</text>
                        <text x="130" y="138" fill="#aaa" font-size="8" text-anchor="middle">Current flows if A=1 OR B=1</text>
                    </svg>`;

            case 'vacuum_tube':
                return `
                    <svg viewBox="0 0 220 130" class="edu-svg">
                        <!-- Glass envelope -->
                        <ellipse cx="100" cy="65" rx="45" ry="55" fill="none" stroke="#668" stroke-width="2"/>
                        
                        <!-- Heated cathode -->
                        <rect x="75" y="95" width="50" height="8" fill="#f60"/>
                        <text x="100" y="118" fill="#f60" font-size="7" text-anchor="middle">Heated Cathode (−)</text>
                        
                        <!-- Heat glow animation -->
                        <ellipse cx="100" cy="99" rx="20" ry="5" fill="#f60" opacity="0.3">
                            <animate attributeName="opacity" values="0.3;0.6;0.3" dur="0.5s" repeatCount="indefinite"/>
                        </ellipse>
                        
                        <!-- Emitted electrons (thermionic emission) -->
                        ${[0, 1, 2, 3, 4].map(i => `
                            <circle r="2" fill="#0ff">
                                <animate attributeName="cx" values="${85 + i * 8};${85 + i * 8};${85 + i * 8}" dur="1.5s" begin="${i * 0.2}s" repeatCount="indefinite"/>
                                <animate attributeName="cy" values="93;50;30" dur="1.5s" begin="${i * 0.2}s" repeatCount="indefinite"/>
                                <animate attributeName="opacity" values="1;1;0" dur="1.5s" begin="${i * 0.2}s" repeatCount="indefinite"/>
                            </circle>
                        `).join('')}
                        
                        <!-- Anode (plate) -->
                        <rect x="80" y="20" width="40" height="6" fill="#44f"/>
                        <text x="100" y="15" fill="#44f" font-size="7" text-anchor="middle">Anode (+)</text>
                        
                        <!-- Grid -->
                        <line x1="70" y1="55" x2="130" y2="55" stroke="#0f0" stroke-width="2" stroke-dasharray="4,4"/>
                        <text x="145" y="58" fill="#0f0" font-size="7">Control Grid</text>
                        
                        <!-- Labels -->
                        <text x="100" y="128" fill="#aaa" font-size="7" text-anchor="middle">Thermionic Emission: Heat → Free Electrons</text>
                    </svg>`;

            case 'npn_transistor':
                return `
                    <svg viewBox="0 0 240 130" class="edu-svg">
                        <!-- Silicon crystal structure background -->
                        <rect x="50" y="30" width="140" height="60" fill="#222" stroke="#444"/>
                        
                        <!-- N-type region (Collector) -->
                        <rect x="50" y="30" width="40" height="60" fill="#2a4">
                            <animate attributeName="opacity" values="0.6;0.8;0.6" dur="2s" repeatCount="indefinite"/>
                        </rect>
                        <text x="70" y="25" fill="#2a4" font-size="8" text-anchor="middle">N-type</text>
                        <text x="70" y="100" fill="#aaa" font-size="7" text-anchor="middle">Collector</text>
                        
                        <!-- Electrons in N-type (free carriers) -->
                        ${[55, 65, 75, 80].map((x, idx) => `
                            <circle cx="${x}" cy="${45 + (idx % 2) * 20}" r="3" fill="#0ff" opacity="0.8">
                                <animate attributeName="cx" values="${x};${x + 5};${x}" dur="1s" begin="${idx * 0.2}s" repeatCount="indefinite"/>
                            </circle>
                        `).join('')}
                        
                        <!-- P-type region (Base) -->
                        <rect x="90" y="30" width="50" height="60" fill="#a24">
                            <animate attributeName="opacity" values="0.6;0.8;0.6" dur="2s" repeatCount="indefinite" begin="0.5s"/>
                        </rect>
                        <text x="115" y="25" fill="#a24" font-size="8" text-anchor="middle">P-type</text>
                        <text x="115" y="100" fill="#aaa" font-size="7" text-anchor="middle">Base</text>
                        
                        <!-- Holes in P-type -->
                        ${[95, 110, 125].map((x, idx) => `
                            <circle cx="${x}" cy="${50 + (idx % 2) * 15}" r="3" fill="none" stroke="#f0f" stroke-width="1.5">
                                <animate attributeName="cx" values="${x};${x - 5};${x}" dur="1s" begin="${idx * 0.2}s" repeatCount="indefinite"/>
                            </circle>
                        `).join('')}
                        
                        <!-- N-type region (Emitter) -->
                        <rect x="140" y="30" width="50" height="60" fill="#2a4">
                            <animate attributeName="opacity" values="0.6;0.8;0.6" dur="2s" repeatCount="indefinite" begin="1s"/>
                        </rect>
                        <text x="165" y="25" fill="#2a4" font-size="8" text-anchor="middle">N-type</text>
                        <text x="165" y="100" fill="#aaa" font-size="7" text-anchor="middle">Emitter</text>
                        
                        <!-- Depletion zones -->
                        <rect x="86" y="30" width="8" height="60" fill="#666" opacity="0.5"/>
                        <rect x="136" y="30" width="8" height="60" fill="#666" opacity="0.5"/>

                        <!-- Fixed ions in depletion region (charges) -->
                        ${[0, 1, 2].map(i => {
                            const y = 40 + i * 18;
                            return `
                                <text x="90" y="${y}" fill="#aaa" font-size="8" text-anchor="middle">+</text>
                                <text x="140" y="${y}" fill="#aaa" font-size="8" text-anchor="middle">−</text>
                            `;
                        }).join('')}

                        <!-- Electron injection arrow (Emitter -> Collector through Base) -->
                        <path d="M170,60 C150,60 135,60 105,60" fill="none" stroke="#0ff" stroke-width="2" stroke-dasharray="6,4">
                            <animate attributeName="stroke-dashoffset" values="10;0" dur="0.6s" repeatCount="indefinite"/>
                        </path>
                        <text x="150" y="52" fill="#0ff" font-size="7" text-anchor="middle">e⁻ injection</text>
                        
                        <!-- Legend -->
                        <circle cx="15" cy="115" r="3" fill="#0ff"/><text x="22" y="118" fill="#aaa" font-size="7">e⁻ (electrons)</text>
                        <circle cx="85" cy="115" r="3" fill="none" stroke="#f0f"/><text x="92" y="118" fill="#aaa" font-size="7">h⁺ (holes)</text>
                        <rect x="155" y="112" width="8" height="6" fill="#666"/><text x="168" y="118" fill="#aaa" font-size="7">Depletion</text>
                        
                        <text x="120" y="125" fill="#0f0" font-size="8" text-anchor="middle">Base current controls Collector→Emitter flow</text>
                    </svg>`;

            case 'semiconductor_doping':
                return `
                    <svg viewBox="0 0 240 130" class="edu-svg">
                        <!-- Pure silicon lattice -->
                        <text x="60" y="15" fill="#888" font-size="9" text-anchor="middle">Pure Silicon</text>
                        ${[0, 1, 2].map(i => [0, 1, 2].map(j => `
                            <circle cx="${20 + j * 25}" cy="${30 + i * 25}" r="8" fill="#666"/>
                            <text x="${20 + j * 25}" y="${34 + i * 25}" fill="#aaa" font-size="7" text-anchor="middle">Si</text>
                        `).join('')).join('')}
                        
                        <!-- N-type doping (Phosphorus adds electron) -->
                        <text x="120" y="15" fill="#2a4" font-size="9" text-anchor="middle">N-type (+ Phosphorus)</text>
                        ${[0, 1, 2].map(i => [0, 1, 2].map(j => {
                            const isP = i === 1 && j === 1;
                            return `
                                <circle cx="${100 + j * 25}" cy="${30 + i * 25}" r="8" fill="${isP ? '#2a4' : '#666'}"/>
                                <text x="${100 + j * 25}" y="${34 + i * 25}" fill="${isP ? '#fff' : '#aaa'}" font-size="7" text-anchor="middle">${isP ? 'P' : 'Si'}</text>
                            `;
                        }).join('')).join('')}
                        <!-- Free electron from P -->
                        <circle cx="135" cy="45" r="3" fill="#0ff">
                            <animate attributeName="cx" values="135;140;135" dur="1s" repeatCount="indefinite"/>
                        </circle>
                        <text x="145" y="48" fill="#0ff" font-size="6">Free e⁻</text>
                        
                        <!-- P-type doping (Boron creates hole) -->
                        <text x="200" y="15" fill="#a24" font-size="9" text-anchor="middle">P-type (+ Boron)</text>
                        ${[0, 1, 2].map(i => [0, 1, 2].map(j => {
                            const isB = i === 1 && j === 1;
                            return `
                                <circle cx="${180 + j * 25}" cy="${30 + i * 25}" r="8" fill="${isB ? '#a24' : '#666'}"/>
                                <text x="${180 + j * 25}" y="${34 + i * 25}" fill="${isB ? '#fff' : '#aaa'}" font-size="7" text-anchor="middle">${isB ? 'B' : 'Si'}</text>
                            `;
                        }).join('')).join('')}
                        <!-- Hole from B -->
                        <circle cx="195" cy="65" r="4" fill="none" stroke="#f0f" stroke-width="2">
                            <animate attributeName="cx" values="195;200;195" dur="1s" repeatCount="indefinite"/>
                        </circle>
                        <text x="212" y="68" fill="#f0f" font-size="6">Hole h⁺</text>
                        
                        <!-- Explanation -->
                        <text x="120" y="115" fill="#aaa" font-size="7" text-anchor="middle">Doping: Adding impurity atoms to control conductivity</text>
                        <text x="120" y="125" fill="#888" font-size="6" text-anchor="middle">N-type has extra electrons • P-type has "holes" (missing electrons)</text>
                    </svg>`;

            case 'nand_universal':
                return `
                    <svg viewBox="0 0 220 120" class="edu-svg">
                        <!-- NAND symbol -->
                        <path d="M30,35 L30,75 L60,75 Q80,55 60,35 Z" fill="#333" stroke="#0f0" stroke-width="2"/>
                        <circle cx="82" cy="55" r="4" fill="#333" stroke="#0f0" stroke-width="2"/>
                        <text x="48" y="60" fill="#0f0" font-size="12" text-anchor="middle">&amp;</text>
                        
                        <!-- Arrows to derived gates -->
                        <line x1="95" y1="40" x2="120" y2="25" stroke="#ff0" stroke-width="1.5" marker-end="url(#arrow-y)"/>
                        <line x1="95" y1="55" x2="130" y2="55" stroke="#ff0" stroke-width="1.5" marker-end="url(#arrow-y)"/>
                        <line x1="95" y1="70" x2="120" y2="85" stroke="#ff0" stroke-width="1.5" marker-end="url(#arrow-y)"/>
                        
                        <defs>
                            <marker id="arrow-y" markerWidth="6" markerHeight="4" refX="0" refY="2" orient="auto">
                                <polygon points="0 0, 6 2, 0 4" fill="#ff0"/>
                            </marker>
                        </defs>
                        
                        <!-- Derived gates -->
                        <rect x="125" y="15" width="45" height="20" fill="#333" stroke="#0f0" rx="3"/>
                        <text x="147" y="28" fill="#fff" font-size="8" text-anchor="middle">NOT</text>
                        
                        <rect x="135" y="45" width="45" height="20" fill="#333" stroke="#0f0" rx="3"/>
                        <text x="157" y="58" fill="#fff" font-size="8" text-anchor="middle">AND</text>
                        
                        <rect x="125" y="75" width="45" height="20" fill="#333" stroke="#0f0" rx="3"/>
                        <text x="147" y="88" fill="#fff" font-size="8" text-anchor="middle">OR</text>
                        
                        <!-- NAND Truth Table -->
                        <text x="195" y="35" fill="#aaa" font-size="7" text-anchor="middle">A B | Out</text>
                        <text x="195" y="48" fill="#aaa" font-size="7" text-anchor="middle">0 0 |  1</text>
                        <text x="195" y="59" fill="#aaa" font-size="7" text-anchor="middle">0 1 |  1</text>
                        <text x="195" y="70" fill="#aaa" font-size="7" text-anchor="middle">1 0 |  1</text>
                        <text x="195" y="81" fill="#0f0" font-size="7" text-anchor="middle">1 1 |  0</text>
                        
                        <text x="90" y="110" fill="#ff0" font-size="9" text-anchor="middle">NAND = Universal Gate</text>
                        <text x="90" y="120" fill="#aaa" font-size="7" text-anchor="middle">Can build ANY logic from NAND alone</text>
                    </svg>`;

            case 'xor_gate':
                return `
                    <svg viewBox="0 0 220 120" class="edu-svg">
                        <!-- XOR Symbol -->
                        <path d="M50,30 Q70,55 50,80" fill="none" stroke="#0f0" stroke-width="2"/>
                        <path d="M55,30 Q75,55 55,80 L75,80 Q100,55 75,30 Z" fill="#333" stroke="#0f0" stroke-width="2"/>
                        <text x="70" y="60" fill="#0f0" font-size="10" text-anchor="middle">=1</text>
                        
                        <!-- Input lines -->
                        <line x1="30" y1="40" x2="57" y2="40" stroke="#aaa" stroke-width="2"/>
                        <line x1="30" y1="70" x2="57" y2="70" stroke="#aaa" stroke-width="2"/>
                        <text x="20" y="43" fill="#aaa" font-size="10">A</text>
                        <text x="20" y="73" fill="#aaa" font-size="10">B</text>
                        
                        <!-- Output -->
                        <line x1="100" y1="55" x2="120" y2="55" stroke="#aaa" stroke-width="2"/>
                        <text x="130" y="58" fill="#aaa" font-size="10">Out</text>
                        
                        <!-- Truth table with highlighting -->
                        <text x="170" y="25" fill="#888" font-size="8" text-anchor="middle">A B | XOR</text>
                        <text x="170" y="40" fill="#666" font-size="8" text-anchor="middle">0 0 |  0</text>
                        <text x="170" y="55" fill="#0f0" font-size="8" text-anchor="middle">0 1 |  1</text>
                        <text x="170" y="70" fill="#0f0" font-size="8" text-anchor="middle">1 0 |  1</text>
                        <text x="170" y="85" fill="#666" font-size="8" text-anchor="middle">1 1 |  0</text>
                        
                        <!-- Explanation -->
                        <text x="110" y="100" fill="#ff0" font-size="8" text-anchor="middle">"Exclusive OR" = Difference Detector</text>
                        <text x="110" y="112" fill="#aaa" font-size="7" text-anchor="middle">Output 1 when inputs are DIFFERENT</text>
                    </svg>`;

            case 'half_adder':
                return `
                    <svg viewBox="0 0 220 120" class="edu-svg">
                        <!-- Box representation -->
                        <rect x="70" y="25" width="80" height="60" fill="#222" stroke="#0f0" stroke-width="2" rx="5"/>
                        <text x="110" y="50" fill="#0f0" font-size="12" text-anchor="middle">HALF</text>
                        <text x="110" y="65" fill="#0f0" font-size="12" text-anchor="middle">ADDER</text>
                        
                        <!-- Inputs -->
                        <line x1="40" y1="40" x2="70" y2="40" stroke="#aaa" stroke-width="2"/>
                        <line x1="40" y1="70" x2="70" y2="70" stroke="#aaa" stroke-width="2"/>
                        <text x="30" y="43" fill="#ff0" font-size="10">A</text>
                        <text x="30" y="73" fill="#ff0" font-size="10">B</text>
                        
                        <!-- Outputs -->
                        <line x1="150" y1="40" x2="180" y2="40" stroke="#aaa" stroke-width="2"/>
                        <line x1="150" y1="70" x2="180" y2="70" stroke="#aaa" stroke-width="2"/>
                        <text x="185" y="43" fill="#0ff" font-size="9">Sum (XOR)</text>
                        <text x="185" y="73" fill="#f0f" font-size="9">Carry (AND)</text>
                        
                        <!-- Binary addition example -->
                        <text x="110" y="95" fill="#aaa" font-size="10" text-anchor="middle">1 + 1 = 10 (binary)</text>
                        <text x="110" y="108" fill="#666" font-size="8" text-anchor="middle">Sum=0, Carry=1</text>
                        
                        <!-- Internal logic hint -->
                        <text x="110" y="12" fill="#888" font-size="8" text-anchor="middle">XOR for Sum • AND for Carry</text>
                    </svg>`;

            case 'full_adder':
                return `
                    <svg viewBox="0 0 220 130" class="edu-svg">
                        <rect x="60" y="20" width="100" height="80" fill="#222" stroke="#0f0" stroke-width="2" rx="5"/>
                        <text x="110" y="55" fill="#0f0" font-size="14" text-anchor="middle">FULL</text>
                        <text x="110" y="72" fill="#0f0" font-size="14" text-anchor="middle">ADDER</text>
                        
                        <!-- 3 inputs -->
                        <line x1="30" y1="35" x2="60" y2="35" stroke="#aaa" stroke-width="2"/>
                        <line x1="30" y1="60" x2="60" y2="60" stroke="#aaa" stroke-width="2"/>
                        <line x1="30" y1="85" x2="60" y2="85" stroke="#aaa" stroke-width="2"/>
                        <text x="20" y="38" fill="#ff0" font-size="9">A</text>
                        <text x="20" y="63" fill="#ff0" font-size="9">B</text>
                        <text x="12" y="88" fill="#f80" font-size="9">Cᵢₙ</text>
                        
                        <!-- 2 outputs -->
                        <line x1="160" y1="45" x2="190" y2="45" stroke="#aaa" stroke-width="2"/>
                        <line x1="160" y1="75" x2="190" y2="75" stroke="#aaa" stroke-width="2"/>
                        <text x="195" y="48" fill="#0ff" font-size="9">Sum</text>
                        <text x="195" y="78" fill="#f0f" font-size="9">Cₒᵤₜ</text>
                        
                        <!-- Example: 12 + 9 -->
                        <text x="110" y="112" fill="#aaa" font-size="9" text-anchor="middle">Chain Full Adders for multi-bit addition</text>
                        <text x="110" y="125" fill="#666" font-size="8" text-anchor="middle">12 + 9 = 21 (using 4-bit ripple-carry)</text>
                    </svg>`;

            case 'multiplexer':
                return `
                    <svg viewBox="0 0 260 140" class="edu-svg">
                        <!-- MUX trapezoid shape -->
                        <path d="M90,25 L160,40 L160,100 L90,115 Z" fill="#222" stroke="#0f0" stroke-width="2"/>
                        <text x="125" y="72" fill="#0f0" font-size="12" text-anchor="middle">MUX</text>
                        
                        <!-- Data inputs -->
                        <line x1="40" y1="55" x2="90" y2="55" stroke="#aaa" stroke-width="2"/>
                        <line x1="40" y1="95" x2="90" y2="95" stroke="#aaa" stroke-width="2"/>
                        <text x="30" y="58" fill="#ff0" font-size="10">D₀</text>
                        <text x="30" y="98" fill="#ff0" font-size="10">D₁</text>
                        
                        <!-- Select input -->
                        <line x1="125" y1="132" x2="125" y2="115" stroke="#f0f" stroke-width="2"/>
                        <text x="125" y="140" fill="#f0f" font-size="9" text-anchor="middle">Sel</text>
                        
                        <!-- Output -->
                        <line x1="160" y1="75" x2="220" y2="75" stroke="#aaa" stroke-width="2"/>
                        <text x="235" y="78" fill="#0ff" font-size="10" text-anchor="end">Out</text>

                        <!-- Highlighted selected path (toggles) -->
                        <path d="M90,55 L140,55 L160,75" fill="none" stroke="#ff0" stroke-width="4" opacity="0.15">
                            <animate attributeName="opacity" values="0.85;0.2;0.85" dur="2.4s" repeatCount="indefinite"/>
                        </path>
                        <path d="M90,95 L140,95 L160,75" fill="none" stroke="#ff0" stroke-width="4" opacity="0.15">
                            <animate attributeName="opacity" values="0.2;0.85;0.2" dur="2.4s" repeatCount="indefinite"/>
                        </path>

                        <text x="210" y="110" fill="#aaa" font-size="8" text-anchor="end">Sel toggles 0 ↔ 1</text>
                        
                        <!-- Explanation -->
                        <text x="130" y="14" fill="#fff" font-size="10" text-anchor="middle">Data Selector (one path conducts)</text>
                        <text x="245" y="55" fill="#aaa" font-size="8" text-anchor="end">Sel=0 → D₀</text>
                        <text x="245" y="95" fill="#aaa" font-size="8" text-anchor="end">Sel=1 → D₁</text>
                    </svg>`;

            case 'sr_latch':
                return `
                    <svg viewBox="0 0 220 130" class="edu-svg">
                        <!-- Two cross-coupled NAND gates -->
                        <rect x="80" y="20" width="40" height="25" fill="#333" stroke="#0f0" rx="3"/>
                        <text x="100" y="37" fill="#0f0" font-size="10" text-anchor="middle">NAND</text>
                        
                        <rect x="80" y="75" width="40" height="25" fill="#333" stroke="#0f0" rx="3"/>
                        <text x="100" y="92" fill="#0f0" font-size="10" text-anchor="middle">NAND</text>
                        
                        <!-- Inputs -->
                        <line x1="40" y1="28" x2="80" y2="28" stroke="#aaa" stroke-width="2"/>
                        <line x1="40" y1="92" x2="80" y2="92" stroke="#aaa" stroke-width="2"/>
                        <text x="30" y="31" fill="#ff0" font-size="10">S̄</text>
                        <text x="30" y="95" fill="#ff0" font-size="10">R̄</text>
                        
                        <!-- Outputs -->
                        <line x1="120" y1="32" x2="160" y2="32" stroke="#aaa" stroke-width="2"/>
                        <line x1="120" y1="88" x2="160" y2="88" stroke="#aaa" stroke-width="2"/>
                        <text x="170" y="35" fill="#0ff" font-size="10">Q</text>
                        <text x="170" y="91" fill="#0ff" font-size="10">Q̄</text>
                        
                        <!-- Feedback loops (the key concept!) -->
                        <path d="M140,32 L150,32 L150,60 L70,60 L70,83 L80,83" fill="none" stroke="#f0f" stroke-width="2" stroke-dasharray="4">
                            <animate attributeName="stroke-dashoffset" from="8" to="0" dur="0.5s" repeatCount="indefinite"/>
                        </path>
                        <path d="M140,88 L150,88 L150,55 L70,55 L70,37 L80,37" fill="none" stroke="#0ff" stroke-width="2" stroke-dasharray="4">
                            <animate attributeName="stroke-dashoffset" from="8" to="0" dur="0.5s" repeatCount="indefinite"/>
                        </path>
                        
                        <!-- Labels -->
                        <text x="110" y="118" fill="#ff0" font-size="9" text-anchor="middle">Feedback = Memory!</text>
                        <text x="110" y="128" fill="#aaa" font-size="7" text-anchor="middle">Output depends on previous state</text>
                    </svg>`;

            case 'alu':
                return `
                    <svg viewBox="0 0 240 140" class="edu-svg">
                        <!-- ALU trapezoid shape -->
                        <path d="M60,20 L180,35 L180,105 L60,120 Z" fill="#222" stroke="#0f0" stroke-width="2"/>
                        <text x="120" y="65" fill="#0f0" font-size="16" text-anchor="middle">ALU</text>
                        <text x="120" y="82" fill="#888" font-size="9" text-anchor="middle">Arithmetic Logic Unit</text>
                        
                        <!-- Data inputs A, B -->
                        <line x1="30" y1="50" x2="60" y2="50" stroke="#ff0" stroke-width="2"/>
                        <line x1="30" y1="90" x2="60" y2="90" stroke="#ff0" stroke-width="2"/>
                        <text x="20" y="53" fill="#ff0" font-size="10">A</text>
                        <text x="20" y="93" fill="#ff0" font-size="10">B</text>
                        
                        <!-- Control/Op select -->
                        <line x1="120" y1="130" x2="120" y2="120" stroke="#f0f" stroke-width="2"/>
                        <text x="120" y="138" fill="#f0f" font-size="8" text-anchor="middle">Op Select</text>
                        
                        <!-- Output -->
                        <line x1="180" y1="70" x2="210" y2="70" stroke="#0ff" stroke-width="2"/>
                        <text x="220" y="73" fill="#0ff" font-size="10">Result</text>
                        
                        <!-- Status flags -->
                        <line x1="180" y1="90" x2="200" y2="90" stroke="#aaa" stroke-width="1"/>
                        <text x="205" y="93" fill="#aaa" font-size="7">Zero</text>
                        <line x1="180" y1="100" x2="200" y2="100" stroke="#aaa" stroke-width="1"/>
                        <text x="205" y="103" fill="#aaa" font-size="7">Carry</text>
                        
                        <!-- Operations list -->
                        <text x="120" y="10" fill="#fff" font-size="8" text-anchor="middle">Operations: ADD  AND  OR  XOR  NOT</text>
                    </svg>`;

            case 'de_morgan':
                return `
                    <svg viewBox="0 0 220 120" class="edu-svg">
                        <text x="110" y="15" fill="#fff" font-size="10" text-anchor="middle">De Morgan's Theorem</text>
                        <!-- Left side: NOT(A AND B) -->
                        <rect x="20" y="30" width="70" height="40" fill="#222" stroke="#0f0" rx="3"/>
                        <text x="55" y="55" fill="#0f0" font-size="8" text-anchor="middle">NAND(A,B)</text>
                        
                        <text x="110" y="55" fill="#ff0" font-size="14" text-anchor="middle">≡</text>
                        
                        <!-- Right side: NOT A OR NOT B -->
                        <rect x="130" y="30" width="70" height="40" fill="#222" stroke="#0f0" rx="3"/>
                        <text x="165" y="55" fill="#0f0" font-size="8" text-anchor="middle">NOT A OR NOT B</text>
                        
                        <text x="110" y="90" fill="#aaa" font-size="8" text-anchor="middle">"Break the bar, change the sign"</text>
                    </svg>`;

            case 'decoder':
                return `
                    <svg viewBox="0 0 260 140" class="edu-svg">
                        <rect x="70" y="20" width="80" height="80" fill="#222" stroke="#0f0" stroke-width="2"/>
                        <text x="110" y="65" fill="#0f0" font-size="10" text-anchor="middle">2→4 DECODER</text>
                        <!-- Inputs -->
                        <line x1="40" y1="40" x2="70" y2="40" stroke="#aaa" stroke-width="2"/>
                        <line x1="40" y1="80" x2="70" y2="80" stroke="#aaa" stroke-width="2"/>
                        <text x="30" y="43" fill="#ff0" font-size="9">A</text>
                        <text x="30" y="83" fill="#ff0" font-size="9">B</text>
                        <!-- Outputs -->
                        ${[35, 55, 75, 95].map((y, idx) => `
                            <line x1="150" y1="${y}" x2="220" y2="${y}" stroke="#666" stroke-width="2">
                                <animate attributeName="stroke" dur="4s" repeatCount="indefinite"
                                    values="#0ff;#666;#666;#666;#0ff" keyTimes="${idx * 0.2};${idx * 0.2 + 0.05};${(idx + 1) * 0.2};${(idx + 1) * 0.2 + 0.05};1"/>
                                <animate attributeName="stroke-width" dur="4s" repeatCount="indefinite"
                                    values="4;2;2;2;4" keyTimes="${idx * 0.2};${idx * 0.2 + 0.05};${(idx + 1) * 0.2};${(idx + 1) * 0.2 + 0.05};1"/>
                            </line>
                            <text x="232" y="${y + 3}" fill="#0ff" font-size="8" text-anchor="end">Y${idx}</text>
                        `).join('')}

                        <text x="130" y="130" fill="#aaa" font-size="8" text-anchor="middle">One-hot: exactly one output active</text>
                    </svg>`;

            case 't_flipflop':
                return `
                    <svg viewBox="0 0 220 120" class="edu-svg">
                        <rect x="80" y="30" width="60" height="60" fill="#222" stroke="#0f0" stroke-width="2"/>
                        <text x="110" y="65" fill="#0f0" font-size="12" text-anchor="middle">T-FF</text>
                        <line x1="50" y1="60" x2="80" y2="60" stroke="#aaa" stroke-width="2"/>
                        <text x="40" y="63" fill="#ff0" font-size="10">T</text>
                        <line x1="140" y1="45" x2="170" y2="45" stroke="#aaa" stroke-width="2"/>
                        <text x="175" y="48" fill="#0ff" font-size="10">Q</text>
                        <text x="110" y="110" fill="#aaa" font-size="8" text-anchor="middle">Toggles state on every clock pulse</text>
                    </svg>`;

            case 'counter_2bit':
                return `
                    <svg viewBox="0 0 220 120" class="edu-svg">
                        <rect x="40" y="40" width="50" height="40" fill="#222" stroke="#0f0"/>
                        <rect x="130" y="40" width="50" height="40" fill="#222" stroke="#0f0"/>
                        <text x="65" y="65" fill="#0f0" font-size="8" text-anchor="middle">FF0</text>
                        <text x="155" y="65" fill="#0f0" font-size="8" text-anchor="middle">FF1</text>
                        <line x1="90" y1="60" x2="130" y2="60" stroke="#aaa" stroke-width="1"/>
                        <text x="110" y="100" fill="#0ff" font-size="14" text-anchor="middle">00 → 01 → 10 → 11</text>
                    </svg>`;

            case 'traffic_light':
                return `
                    <svg viewBox="0 0 220 120" class="edu-svg">
                        <rect x="90" y="10" width="40" height="100" fill="#333" rx="5"/>
                        <circle cx="110" cy="30" r="12" fill="#f00">
                            <animate attributeName="opacity" values="1;0.2;0.2;1" dur="4s" repeatCount="indefinite"/>
                        </circle>
                        <circle cx="110" cy="60" r="12" fill="#ff0">
                            <animate attributeName="opacity" values="0.2;1;0.2;0.2" dur="4s" repeatCount="indefinite"/>
                        </circle>
                        <circle cx="110" cy="90" r="12" fill="#0f0">
                            <animate attributeName="opacity" values="0.2;0.2;1;0.2" dur="4s" repeatCount="indefinite"/>
                        </circle>
                        <text x="160" y="65" fill="#aaa" font-size="8">FSM Control</text>
                    </svg>`;

            case 'cpu_datapath':
                return `
                    <svg viewBox="0 0 240 140" class="edu-svg">
                        <rect x="20" y="20" width="40" height="30" fill="#222" stroke="#0f0"/>
                        <text x="40" y="40" fill="#0f0" font-size="7" text-anchor="middle">PC</text>
                        <rect x="80" y="20" width="60" height="30" fill="#222" stroke="#0f0"/>
                        <text x="110" y="40" fill="#0f0" font-size="7" text-anchor="middle">Memory</text>
                        <rect x="160" y="60" width="60" height="40" fill="#222" stroke="#0f0"/>
                        <text x="190" y="85" fill="#0f0" font-size="10" text-anchor="middle">ALU</text>
                        <path d="M40,50 L40,110 L190,110 L190,100" fill="none" stroke="#ff0" stroke-width="1.5" stroke-dasharray="4"/>
                        <text x="120" y="130" fill="#fff" font-size="10" text-anchor="middle">The Complete Machine</text>
                    </svg>`;

            case 'cmos_inverter':
                return `
                    <svg viewBox="0 0 260 140" class="edu-svg">
                        <defs>
                            <filter id="cmosGlow"><feGaussianBlur stdDeviation="1.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                        </defs>

                        <text x="130" y="16" fill="#fff" font-size="10" text-anchor="middle">CMOS Inverter: complementary pull-up / pull-down</text>

                        <!-- VDD / GND rails -->
                        <line x1="30" y1="30" x2="230" y2="30" stroke="#666" stroke-width="2"/>
                        <text x="22" y="33" fill="#aaa" font-size="9">VDD</text>
                        <line x1="30" y1="120" x2="230" y2="120" stroke="#666" stroke-width="2"/>
                        <text x="22" y="123" fill="#aaa" font-size="9">GND</text>

                        <!-- PMOS (top) -->
                        <rect x="110" y="40" width="40" height="22" fill="#222" stroke="#0f0" stroke-width="2" rx="4"/>
                        <text x="130" y="55" fill="#0f0" font-size="9" text-anchor="middle">PMOS</text>

                        <!-- NMOS (bottom) -->
                        <rect x="110" y="88" width="40" height="22" fill="#222" stroke="#0f0" stroke-width="2" rx="4"/>
                        <text x="130" y="103" fill="#0f0" font-size="9" text-anchor="middle">NMOS</text>

                        <!-- Output node -->
                        <circle cx="130" cy="76" r="5" fill="#333" stroke="#0ff" stroke-width="2"/>
                        <line x1="150" y1="76" x2="220" y2="76" stroke="#aaa" stroke-width="2"/>
                        <text x="232" y="79" fill="#0ff" font-size="9" text-anchor="end">Vout</text>

                        <!-- Connections -->
                        <line x1="130" y1="30" x2="130" y2="40" stroke="#aaa" stroke-width="2"/>
                        <line x1="130" y1="62" x2="130" y2="71" stroke="#aaa" stroke-width="2"/>
                        <line x1="130" y1="81" x2="130" y2="88" stroke="#aaa" stroke-width="2"/>
                        <line x1="130" y1="110" x2="130" y2="120" stroke="#aaa" stroke-width="2"/>

                        <!-- Input gate line -->
                        <line x1="40" y1="76" x2="110" y2="76" stroke="#f0f" stroke-width="2"/>
                        <text x="32" y="79" fill="#f0f" font-size="10">Vin</text>
                        <line x1="110" y1="76" x2="110" y2="51" stroke="#f0f" stroke-width="2"/>
                        <line x1="110" y1="76" x2="110" y2="99" stroke="#f0f" stroke-width="2"/>

                        <!-- Animated current path highlight (alternates pull-up vs pull-down) -->
                        <path d="M130,30 L130,76" stroke="#ff0" stroke-width="4" opacity="0" filter="url(#cmosGlow)">
                            <animate attributeName="opacity" values="1;1;0;0" dur="2.4s" repeatCount="indefinite"/>
                        </path>
                        <path d="M130,76 L130,120" stroke="#ff0" stroke-width="4" opacity="0" filter="url(#cmosGlow)">
                            <animate attributeName="opacity" values="0;0;1;1" dur="2.4s" repeatCount="indefinite"/>
                        </path>

                        <text x="130" y="136" fill="#aaa" font-size="8" text-anchor="middle">Vin=0 → PMOS ON (Vout=1) • Vin=1 → NMOS ON (Vout=0)</text>
                    </svg>`;

            case 'nand_to_not':
                return `
                    <svg viewBox="0 0 240 120" class="edu-svg">
                        <text x="120" y="15" fill="#fff" font-size="10" text-anchor="middle">NOT from NAND (tie inputs)</text>

                        <!-- NAND gate body -->
                        <path d="M60,35 L60,85 L95,85 Q120,60 95,35 Z" fill="#333" stroke="#0f0" stroke-width="2"/>
                        <circle cx="122" cy="60" r="4" fill="#333" stroke="#0f0" stroke-width="2"/>
                        <text x="82" y="64" fill="#0f0" font-size="12" text-anchor="middle">&amp;</text>

                        <!-- Single input split to both pins -->
                        <line x1="25" y1="60" x2="60" y2="50" stroke="#f0f" stroke-width="2"/>
                        <line x1="25" y1="60" x2="60" y2="70" stroke="#f0f" stroke-width="2"/>
                        <text x="18" y="63" fill="#f0f" font-size="10">A</text>

                        <!-- Output -->
                        <line x1="126" y1="60" x2="200" y2="60" stroke="#0ff" stroke-width="2"/>
                        <text x="210" y="64" fill="#0ff" font-size="10">Out = ¬A</text>

                        <!-- Truth table -->
                        <text x="120" y="100" fill="#aaa" font-size="8" text-anchor="middle">A=0 → Out=1 • A=1 → Out=0</text>
                    </svg>`;

            case 'dff_timing':
                return `
                    <svg viewBox="0 0 300 160" class="edu-svg">
                        <text x="150" y="16" fill="#fff" font-size="10" text-anchor="middle">D Flip-Flop Timing: sample on rising edge</text>

                        <!-- Waveforms area -->
                        <text x="20" y="50" fill="#f0f" font-size="9">CLK</text>
                        <text x="20" y="90" fill="#ff0" font-size="9">D</text>
                        <text x="20" y="130" fill="#0ff" font-size="9">Q</text>

                        <!-- CLK waveform -->
                        <path d="M60,55 L90,55 L90,35 L130,35 L130,55 L170,55 L170,35 L210,35 L210,55 L250,55" fill="none" stroke="#f0f" stroke-width="2" stroke-linejoin="round"/>

                        <!-- D waveform (toggles around edges) -->
                        <path d="M60,95 L120,95 L120,75 L180,75 L180,95 L250,95" fill="none" stroke="#ff0" stroke-width="2" stroke-linejoin="round"/>

                        <!-- Q waveform (updates only after clock edges) -->
                        <path d="M60,135 L90,135 L90,115 L170,115 L170,135 L210,135 L210,115 L250,115" fill="none" stroke="#0ff" stroke-width="2" stroke-linejoin="round"/>

                        <!-- Sampling markers (rising edges) -->
                        <line x1="90" y1="25" x2="90" y2="145" stroke="#666" stroke-width="1" stroke-dasharray="4"/>
                        <line x1="170" y1="25" x2="170" y2="145" stroke="#666" stroke-width="1" stroke-dasharray="4"/>
                        <text x="90" y="150" fill="#aaa" font-size="7" text-anchor="middle">↑ sample</text>
                        <text x="170" y="150" fill="#aaa" font-size="7" text-anchor="middle">↑ sample</text>

                        <!-- Animated highlight moving along time -->
                        <rect x="58" y="28" width="6" height="120" fill="#fff" opacity="0.15">
                            <animate attributeName="x" values="60;250;60" dur="3s" repeatCount="indefinite"/>
                        </rect>

                        <text x="150" y="156" fill="#aaa" font-size="8" text-anchor="middle">Q changes after CLK edge (clock-to-Q delay)</text>
                    </svg>`;

            default:
                return `<svg viewBox="0 0 200 100"><circle cx="100" cy="50" r="40" fill="none" stroke="#0f0" stroke-width="2"/><text x="100" y="55" text-anchor="middle" fill="#0f0" font-size="24">⚡</text></svg>`;
        }
        })();
        const prefix = `hv${++_visIdCounter}`;
        return addPrefixToIds(svg, prefix);
    },
    
    // Helper for simple SVGs if needed
    getSimpleSVG(title, subtitle) {
         return `<svg viewBox="0 0 200 100" class="edu-svg"><text x="100" y="40" fill="#fff" text-anchor="middle">${title}</text><text x="100" y="70" fill="#aaa" text-anchor="middle">${subtitle}</text></svg>`;
    }
};
