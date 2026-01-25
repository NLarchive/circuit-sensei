import { HUDUtils } from './HUDUtils.js';
import { HUDVisuals } from './HUDVisuals.js';

export const HUDEducation = {
    renderPhysicsDetails(details, level = null) {
        if (!details) return '';

        const hasNewSchema = Array.isArray(details.conceptCards) || Array.isArray(details.formulaCards);

        if (hasNewSchema) {
            const visuals = level ? this.getLevelVisualList(level) : [];
            return this.renderDetailedPhysicsContent(details, visuals);
        }

        const concepts = Array.isArray(details.concepts) ? details.concepts : [];
        const equations = Array.isArray(details.equations) ? details.equations : [];
        const realWorld = details.realWorld || '';

        if (concepts.length === 0 && equations.length === 0 && !realWorld) return '';

        const conceptsHtml = concepts.length
            ? `<div class="lesson-card">
                <h3>🔬 Key Concepts</h3>
                <ul>${concepts.map(c => `<li>${this.explainConcept(c)}</li>`).join('')}</ul>
               </div>`
            : '';

        const equationsHtml = equations.length
            ? `<div class="lesson-card">
                <h3>📐 Key Equations</h3>
                <ul class="equations">${equations.map(eq => this.renderEquationWithExplanation(eq)).join('')}</ul>
               </div>`
            : '';

        const realWorldHtml = realWorld
            ? `<div class="lesson-card"><h3>🌍 Real-World Application</h3>${HUDUtils.formatStoryText(realWorld)}</div>`
            : '';

        const legacyVisualsHtml = level
            ? (() => {
                const visuals = this.getLevelVisualList(level);
                if (!visuals.length) return '';
                return `<div class="visual-container">${HUDVisuals.generateLevelVisuals(level)}</div>`;
            })()
            : '';

        return `
            <div class="lesson-grid">
                ${legacyVisualsHtml}
                ${conceptsHtml}
                ${equationsHtml}
                ${realWorldHtml}
            </div>
        `;
    },

    renderDetailedPhysicsContent(details, visuals = []) {
        const sections = [];
        const conceptVisuals = this.assignVisualsToConceptCards(details.conceptCards, visuals);

        if (Array.isArray(details.conceptCards) && details.conceptCards.length > 0) {
            const cards = details.conceptCards.map((card, idx) => this.renderConceptCard(card, conceptVisuals[idx] || [])).join('');
            sections.push(`
                <div class="lesson-section">
                    <h3 class="section-title">🔬 Key Concepts</h3>
                    <div class="concept-cards">${cards}</div>
                </div>
            `);
        }

        if (Array.isArray(details.formulaCards) && details.formulaCards.length > 0) {
            const cards = details.formulaCards.map(card => this.renderFormulaCard(card)).join('');
            sections.push(`
                <div class="lesson-section">
                    <h3 class="section-title">📐 Key Formulas</h3>
                    <div class="formula-cards">${cards}</div>
                </div>
            `);
        }

        if (Array.isArray(details.exercises) && details.exercises.length > 0) {
            const items = details.exercises.map((ex, i) => this.renderExerciseItem(ex, i + 1)).join('');
            sections.push(`
                <div class="lesson-section">
                    <h3 class="section-title">✏️ Practice Problems</h3>
                    <div class="exercise-cards">${items}</div>
                </div>
            `);
        }

        if (details.realWorld) {
            const rwContent = typeof details.realWorld === 'object'
                ? this.renderRealWorldDetailed(details.realWorld)
                : `<p>${HUDUtils.escapeHtml(details.realWorld)}</p>`;
            sections.push(`
                <div class="lesson-section">
                    <h3 class="section-title">🌍 Real-World Application</h3>
                    <div class="real-world-card">${rwContent}</div>
                </div>
            `);
        }

        return `<div class="lesson-grid detailed">${sections.join('')}</div>`;
    },

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
            cpu_datapath_detailed: 'CPU Datapath: Fetch → Decode → Execute'
        };

        // Allow: physicsVisual as string OR array OR physicsVisuals array
        if (Array.isArray(level.physicsVisual)) {
            level.physicsVisual.forEach(v => {
                if (typeof v === 'string') pushUnique({ type: v, title: titleByType[v] || '' });
                else if (v && typeof v === 'object' && v.type) pushUnique({ type: v.type, title: v.title || titleByType[v.type] || '' });
            });
        } else if (typeof level.physicsVisual === 'string' && level.physicsVisual.trim()) {
            pushUnique({ type: level.physicsVisual, title: titleByType[level.physicsVisual] || '' });
        }

        if (Array.isArray(level.physicsVisuals)) {
            level.physicsVisuals.forEach(v => {
                if (typeof v === 'string') pushUnique({ type: v, title: titleByType[v] || '' });
                else if (v && typeof v === 'object' && v.type) pushUnique({ type: v.type, title: v.title || titleByType[v.type] || '' });
            });
        }

        // Also allow visuals to be declared directly on concept cards
        if (level.physicsDetails && Array.isArray(level.physicsDetails.conceptCards)) {
            level.physicsDetails.conceptCards.forEach(card => {
                if (!card || typeof card !== 'object') return;

                const entries = [];
                if (Array.isArray(card.visuals)) entries.push(...card.visuals);
                if (card.visual) entries.push(card.visual);
                if (card.physicsVisual) entries.push(card.physicsVisual);

                entries.forEach(entry => {
                    if (!entry) return;
                    if (typeof entry === 'string') {
                        pushUnique({ type: entry, title: titleByType[entry] || '' });
                    } else if (entry && typeof entry === 'object') {
                        const type = entry.type || entry.visual || entry.physicsVisual;
                        if (!type) return;
                        pushUnique({ type, title: entry.title || titleByType[type] || '' });
                    }
                });
            });
        }

        return result;
    },

    assignVisualsToConceptCards(conceptCards, visuals) {
        const safeCards = Array.isArray(conceptCards) ? conceptCards : [];
        const safeVisuals = Array.isArray(visuals) ? visuals : [];

        const assigned = Array.from({ length: safeCards.length }, () => []);
        if (!safeCards.length || !safeVisuals.length) return assigned;

        const remaining = safeVisuals
            .filter(v => v && v.type)
            .map(v => ({ type: String(v.type), title: v.title || '' }));

        const takeVisualByType = (type) => {
            const idx = remaining.findIndex(v => String(v.type) === String(type));
            if (idx >= 0) return remaining.splice(idx, 1)[0];
            // Allow explicit visuals that weren't in the auto-list
            return { type: String(type), title: '' };
        };

        const normalizeVisualEntry = (entry) => {
            if (!entry) return null;
            if (typeof entry === 'string') return { type: String(entry), title: '' };
            if (typeof entry === 'object') {
                const type = entry.type || entry.visual || entry.physicsVisual;
                if (!type) return null;
                return { type: String(type), title: entry.title ? String(entry.title) : '' };
            }
            return null;
        };

        // 1) Respect explicit per-card visual binding if present
        safeCards.forEach((card, cardIndex) => {
            if (!card || typeof card !== 'object') return;

            const entries = [];
            if (Array.isArray(card.visuals)) entries.push(...card.visuals);
            if (card.visual) entries.push(card.visual);
            if (card.physicsVisual) entries.push(card.physicsVisual);

            entries
                .map(normalizeVisualEntry)
                .filter(Boolean)
                .forEach(v => {
                    const picked = takeVisualByType(v.type);
                    if (v.title) picked.title = v.title;
                    assigned[cardIndex].push(picked);
                });
        });

        // 2) Heuristic assignment: match remaining visuals to the most relevant concept card
        while (remaining.length > 0) {
            const visual = remaining.shift();
            const keywords = this.getVisualKeywords(visual.type);

            let bestIdx = 0;
            let bestScore = -1;

            for (let i = 0; i < safeCards.length; i++) {
                const score = this.scoreConceptCardForKeywords(safeCards[i], keywords);
                if (score > bestScore) {
                    bestScore = score;
                    bestIdx = i;
                }
            }

            // If nothing matches, default to the first concept card (still places visual under explanatory text)
            assigned[bestIdx].push(visual);
        }

        return assigned;
    },

    renderConceptCard(card, visualsForCard = []) {
        if (typeof card === 'string') {
            return `<div class="concept-card"><p>${this.explainConcept(card)}</p></div>`;
        }

        const title = card.term || card.title || 'Concept';
        const definition = card.definition || '';
        const why = card.why || '';
        const analogy = card.analogy || '';
        const formula = card.formula || card.latex || card.equation || '';

        let html = `<div class="concept-card">
            <h4 class="concept-title">${HUDUtils.escapeHtml(title)}</h4>`;

        if (definition) {
            html += `<div class="concept-definition"><strong>What:</strong> ${HUDUtils.escapeHtml(definition)}</div>`;
        }
        if (why) {
            html += `<div class="concept-why"><strong>Why it matters:</strong> ${HUDUtils.escapeHtml(why)}</div>`;
        }
        if (card.explanation) {
            html += `<div class="concept-explanation">${HUDUtils.escapeHtml(card.explanation)}</div>`;
        }
        if (analogy) {
            html += `<div class="concept-analogy"><strong>Analogy:</strong> ${HUDUtils.escapeHtml(analogy)}</div>`;
        }
        if (formula) {
            html += `<div class="concept-formula"><strong>Formula:</strong> <code>${HUDUtils.formatEquation(formula, card.html)}</code></div>`;
        }

        const renderBlock = (titleText, bodyHtml) => {
            const t = titleText ? `<h5 class="ui-subtitle">${HUDUtils.escapeHtml(titleText)}</h5>` : '';
            return `<div class="ui-block">${t}${bodyHtml || ''}</div>`;
        };

        if (card.operations && typeof card.operations === 'object') {
            let gridHtml = `<div class="ui-grid">`;
            Object.keys(card.operations).forEach(op => {
                const opData = card.operations[op] || {};
                gridHtml += `<div class="ui-card ui-card--info">
                    <div class="ui-mono" style="color:#7dcfff; font-weight:600; margin-bottom:6px;">${HUDUtils.escapeHtml(op)}</div>
                    <div style="color:#fff; margin-bottom:6px; font-size:0.9rem;">${HUDUtils.escapeHtml(opData.purpose || '')}</div>
                    <div style="color:#ccc; font-size:0.85rem; margin-bottom:4px;"><strong style="color:#9ece6a;">Example:</strong> ${HUDUtils.escapeHtml(opData.example || '')}</div>
                    <div style="color:#ccc; font-size:0.85rem;"><strong style="color:#9ece6a;">Use case:</strong> ${HUDUtils.escapeHtml(opData.use_case || '')}</div>
                </div>`;
            });
            gridHtml += `</div>`;
            html += renderBlock('Bitwise Operations', gridHtml);
        }

        if (card.formulas && typeof card.formulas === 'object') {
            let formulasHtml = '<ul class="ui-list formula-list">';
            Object.entries(card.formulas).forEach(([key, value]) => {
                formulasHtml += `<li><strong>${HUDUtils.escapeHtml(key)}:</strong> <code>${HUDUtils.formatEquation(value)}</code></li>`;
            });
            formulasHtml += '</ul>';
            html += renderBlock('Formulas', formulasHtml);
        }

        if (card.applications && Array.isArray(card.applications)) {
            let listHtml = `<ul class="ui-list">`;
            card.applications.forEach(app => {
                listHtml += `<li>${HUDUtils.escapeHtml(app)}</li>`;
            });
            listHtml += `</ul>`;
            html += renderBlock('Applications', listHtml);
        }

        if (card.hardware_connection) {
            html += `<div class="ui-note ui-card ui-card--purple"><strong>Hardware connection:</strong> ${HUDUtils.escapeHtml(card.hardware_connection)}</div>`;
        }

        if (card.tables && typeof card.tables === 'object') {
            let tablesHtml = '';
            Object.keys(card.tables).forEach(gate => {
                const gateData = card.tables[gate];
                if (gateData && gateData.table && Array.isArray(gateData.table) && gateData.table.length > 0) {
                    const symbol = gateData.symbol || '';
                    const altSymbols = Array.isArray(gateData.alt_symbols) ? gateData.alt_symbols : [];
                    const allSymbols = [symbol, ...altSymbols].filter(s => s).join(', ');

                    tablesHtml += `<div class="ui-card ui-card--info" style="margin-top:12px;">
                        <h5 class="ui-subtitle" style="margin-bottom:8px;">${HUDUtils.escapeHtml(String(gate).toUpperCase())} Gate Truth Table</h5>`;
                    if (allSymbols) {
                        tablesHtml += `<div class="ui-meta ui-mono">Symbol${altSymbols.length > 0 ? 's' : ''}: ${HUDUtils.escapeHtml(allSymbols)}</div>`;
                    }

                    const headers = Object.keys(gateData.table[0] || {});
                    tablesHtml += `<table class="ui-table"><thead><tr>${headers.map(h => `<th>${HUDUtils.escapeHtml(h)}</th>`).join('')}</tr></thead><tbody>`;
                    gateData.table.forEach(row => {
                        tablesHtml += `<tr>`;
                        headers.forEach(h => {
                            const value = row[h];
                            const displayValue = (value === 0 || value === 1) ? value : (value ?? '');
                            tablesHtml += `<td>${HUDUtils.escapeHtml(String(displayValue))}</td>`;
                        });
                        tablesHtml += `</tr>`;
                    });
                    tablesHtml += `</tbody></table></div>`;
                }
            });
            html += renderBlock('Truth Tables', tablesHtml);
        }

        if (Array.isArray(visualsForCard) && visualsForCard.length > 0) {
            const visualsHtml = `
                <div class="visual-container">
                    <div class="visual-stack">
                        ${visualsForCard.map(v => {
                            const title = v && v.title ? `<div class="visual-caption">${HUDUtils.escapeHtml(v.title)}</div>` : '';
                            const type = v && v.type ? v.type : '';
                            return `<div class="visual-item">${title}${HUDVisuals.generatePhysicsVisual(type)}</div>`;
                        }).join('')}
                    </div>
                </div>
            `;
            html += visualsHtml;
        }

        html += '</div>';
        return html;
    },

    renderFormulaCard(card) {
        if (typeof card === 'string') {
            return this.renderEquationWithExplanation(card);
        }

        const formula = card.formula || card.latex || card.equation || '';
        const name = card.name || '';
        const variables = Array.isArray(card.variables) ? card.variables : [];
        const meaning = card.meaning || '';
        const derivation = card.derivation || '';
        const example = card.example || null;
        const units = card.units || '';

        let html = `<div class="formula-card">`;

        if (name) {
            html += `<h4 class="formula-name">${HUDUtils.escapeHtml(name)}</h4>`;
        }

        html += `<div class="formula-main"><code>${HUDUtils.formatEquation(formula, card.html)}</code></div>`;

        if (variables.length > 0) {
            const varList = variables.map(v => {
                if (typeof v === 'string') return `<li>${HUDUtils.formatEquation(v)}</li>`;
                return `<li><span class="var-symbol">${HUDUtils.formatEquation(v.symbol || '')}</span> = ${HUDUtils.escapeHtml(v.meaning || v.name || '')}${v.units ? ` <span class="var-units">[${HUDUtils.escapeHtml(v.units)}]</span>` : ''}</li>`;
            }).join('');
            html += `<div class="formula-variables"><strong>Variables:</strong><ul>${varList}</ul></div>`;
        }

        if (meaning) {
            html += `<div class="formula-meaning"><strong>Physical meaning:</strong> ${HUDUtils.escapeHtml(meaning)}</div>`;
        }

        if (derivation) {
            html += `<div class="formula-derivation"><strong>Where it comes from:</strong> ${HUDUtils.escapeHtml(derivation)}</div>`;
        }

        if (Array.isArray(card.rearrangements) && card.rearrangements.length > 0) {
            const rearrangeList = card.rearrangements.map(r => {
                const f = typeof r === 'string' ? r : (r.formula || '');
                const m = typeof r === 'string' ? '' : (r.meaning || '');
                return `<li><code>${HUDUtils.formatEquation(f, r?.html)}</code>${m ? ` — ${HUDUtils.escapeHtml(m)}` : ''}</li>`;
            }).join('');
            html += `<div class="formula-rearrangements"><strong>Also written as:</strong><ul>${rearrangeList}</ul></div>`;
        }

        if (example) {
            html += this.renderWorkedExample(example);
        }

        if (units) {
            html += `<div class="formula-units"><strong>Units:</strong> ${HUDUtils.escapeHtml(units)}</div>`;
        }

        html += '</div>';
        return html;
    },

    explainConcept(concept) {
        const conceptLower = String(concept || '').toLowerCase();
        const explanations = {
            'drift velocity': 'Average net carrier motion caused by an electric field. It is slow, but it represents real charge flow (and therefore current).',
            'current density': 'Current per unit area, $J = I/A$. Useful because physics (fields/materials) acts locally, while current is a total through a cross-section.',
            'conductivity': 'How easily a material conducts: $\\sigma$ (Siemens/m). Higher $\\sigma$ means less resistance for the same geometry.',
            'carrier density': 'Number of mobile charge carriers per volume. More carriers generally means more current for the same field.',
            'equipotential': 'A region where voltage is (approximately) constant. In good conductors, charge redistributes quickly to keep the conductor near-equipotential.',
            'signal propagation': 'How fast the electromagnetic disturbance (the “signal”) travels along a wire/trace (typically a large fraction of $c$), distinct from slow carrier drift.',
            'fermi velocity': 'Typical speed of electrons due to quantum statistics in a metal. Very fast random motion, but random directions cancel unless a field biases the drift.',
            'electron drift': 'Slow bulk movement of electrons (~0.1mm/s) in response to an electric field, despite fast thermal motion.',
            'electric field': 'Force per unit charge (V/m) that pushes electrons through conductors. Field points from + to −.',
            'current': 'Rate of charge flow (Coulombs/second = Amperes). Conventional current flows + to −, electrons flow − to +.',
            'voltage': 'Electric potential difference (energy per charge, Joules/Coulomb = Volts). “Pressure” that drives current.',
            'resistance': 'Opposition to current flow (Ohms). Arises from electron collisions with the atomic lattice.',
            'thermionic emission': 'Electrons escaping a heated metal when thermal energy exceeds the work function (surface binding energy).',
            'cmos complementary logic': 'Using paired NMOS+PMOS transistors so one pulls HIGH, other pulls LOW → zero static power dissipation.',
            'voltage transfer curve': 'Graph of Vout vs Vin showing the inverter\'s switching behavior and gain in the transition region.',
            'noise margin': 'Safety buffer between logic HIGH/LOW thresholds, preventing noise from flipping bits incorrectly.',
            'boolean algebra': 'Mathematical system with only two values (0,1) and operations AND, OR, NOT — foundation of digital logic.',
            'truth table': 'Complete enumeration of all input combinations and their corresponding outputs for a logic function.',
            'series': 'Components connected end-to-end; current flows through ALL of them. If one fails, circuit breaks.',
            'parallel': 'Components connected side-by-side; current can flow through ANY of them. Multiple paths for redundancy.',
            'universal gate': 'A gate (NAND or NOR) from which ANY other logic function can be built using only that gate type.',
            "demorgan's theorem": 'NOT(A AND B) = (NOT A) OR (NOT B). Transforms ANDs to ORs and vice versa by inverting.',
            'xor': 'Exclusive-OR: outputs 1 when inputs differ. Core of binary addition (sum without carry).',
            'half adder': 'Adds two bits: Sum = A XOR B, Carry = A AND B. Missing carry-in for chaining.',
            'full adder': 'Adds three bits (A, B, Cin) producing Sum and Cout. Chain these for multi-bit addition.',
            'multiplexer': 'Data selector: uses control bits to choose which input passes to output. Digital switch.',
            'decoder': 'Converts binary code to one-hot: exactly one output goes HIGH based on input pattern.',
            'bistable multivibrator': 'Circuit with two stable states that can “flip” between them. Foundation of memory.',
            'cross-coupled inverters': 'Two inverters with outputs feeding each other\'s inputs, creating self-reinforcing memory.',
            'metastability': 'Unstable equilibrium between logic states. Output may oscillate or take unpredictable time to settle.',
            'edge triggering': 'Sampling input only at the rising (or falling) edge of clock, not during the entire HIGH/LOW.',
            'setup/hold time': 'Data must be stable BEFORE (setup) and AFTER (hold) the clock edge to avoid metastability.',
            'master-slave': 'Two cascaded latches: master samples when clock=0, slave copies when clock=1 → edge-triggered behavior.',
            'clock skew': 'Variation in clock arrival time across a chip. Can cause setup/hold violations if too large.',
            'fsm': 'Finite State Machine: circuit that transitions between states based on inputs and current state.',
            'moore machine': 'FSM where outputs depend only on current state, not inputs → more stable outputs.',
            'mealy machine': 'FSM where outputs depend on both state and inputs → faster response but glitch-prone.',
            'alu': 'Arithmetic Logic Unit: performs math (add, subtract) and logic (AND, OR, XOR) operations.',
            'program counter': 'Register holding address of next instruction. Increments each cycle or loads branch target.',
            'datapath': 'Hardware components (registers, ALU, buses) that perform data operations in a processor.',
            'control unit': 'FSM that decodes instructions and generates control signals to orchestrate the datapath.',
            'pipelining': 'Overlapping instruction execution: while one executes, next is decoded, next is fetched → higher throughput.'
        };

        for (const [key, explanation] of Object.entries(explanations)) {
            if (conceptLower.includes(key)) {
                return `<strong>${HUDUtils.escapeHtml(concept)}</strong>: ${explanation}`;
            }
        }

        return `<strong>${HUDUtils.escapeHtml(concept)}</strong>`;
    },

    renderEquationWithExplanation(eq) {
        const explanation = this.getEquationExplanation(eq);
        return `<li>
            <div class="equation-block">
                <div class="equation-formula">${HUDUtils.formatEquation(eq)}</div>
                ${explanation ? `<div class="equation-explain">${explanation}</div>` : ''}
            </div>
        </li>`;
    },
    
    renderExerciseItem(exercise, num) {
        if (typeof exercise === 'string') {
            return `<div class="exercise-item"><span class="exercise-num">${num}.</span> ${HUDUtils.escapeHtml(exercise)}</div>`;
        }

        let html = `<div class="exercise-item">
            <span class="exercise-num">${num}.</span>
            <div class="exercise-content">`;

        if (exercise.question || exercise.problem) {
            html += `<div class="exercise-question">${HUDUtils.escapeHtml(exercise.question || exercise.problem)}</div>`;
        }

        if (exercise.hint) {
            html += `<details class="exercise-hint"><summary>Hint</summary>${HUDUtils.escapeHtml(exercise.hint)}</details>`;
        }

        if (exercise.answer) {
            let answerHtml = '<details class="exercise-answer"><summary>Answer</summary>';
            if (typeof exercise.answer === 'string') {
                answerHtml += HUDUtils.escapeHtml(exercise.answer);
            } else if (typeof exercise.answer === 'object' && exercise.answer.steps) {
                if (exercise.answer.steps.length > 0) {
                    answerHtml += '<ol>';
                    exercise.answer.steps.forEach(step => {
                        answerHtml += `<li>${HUDUtils.escapeHtml(step)}</li>`;
                    });
                    answerHtml += '</ol>';
                }
                if (exercise.answer.answer) {
                    answerHtml += `<p><strong>Final Answer:</strong> ${HUDUtils.escapeHtml(exercise.answer.answer)}</p>`;
                }
            } else {
                answerHtml += HUDUtils.escapeHtml(JSON.stringify(exercise.answer));
            }
            answerHtml += '</details>';
            html += answerHtml;
        }

        html += '</div></div>';
        return html;
    },

    renderRealWorldDetailed(rw) {
        let html = '';

        if (rw.context) {
            html += `<p class="rw-context">${HUDUtils.escapeHtml(rw.context)}</p>`;
        }

        if (rw.example) {
            html += `<div class="rw-example"><strong>Example:</strong> ${HUDUtils.escapeHtml(rw.example)}</div>`;
        }

        if (rw.numbers) {
            html += `<div class="rw-numbers"><strong>By the numbers:</strong> ${HUDUtils.escapeHtml(rw.numbers)}</div>`;
        }

        if (rw.connection) {
            html += `<div class="rw-connection"><strong>Connection to this level:</strong> ${HUDUtils.escapeHtml(rw.connection)}</div>`;
        }

        return html || `<p>${HUDUtils.escapeHtml(JSON.stringify(rw))}</p>`;
    },
    
    renderCurriculumOverview(level) {
        if (!level) return '';

        const courseOverview = level.courseOverview && typeof level.courseOverview === 'object' ? level.courseOverview : null;
        const tierOverview = Array.isArray(level.tierOverview) ? level.tierOverview : null;
        const difficultyProgression = level.difficultyProgression && typeof level.difficultyProgression === 'object'
            ? level.difficultyProgression
            : null;

        // If the schema isn't present, don't render (the overlay will still show fallback Concept/Story content).
        if (!courseOverview && !tierOverview && !difficultyProgression) return '';

        const outcomes = Array.isArray(courseOverview?.learningOutcomes) ? courseOverview.learningOutcomes : [];

        let html = `
            <div class="curriculum-overview">
                ${courseOverview ? `
                    <section class="overview-section">
                        <h3>Course Architecture</h3>
                        <div class="stats-grid">
                            ${courseOverview.totalTiers != null ? `<div class="stat-item"><strong>Tiers:</strong> ${HUDUtils.escapeHtml(courseOverview.totalTiers)}</div>` : ''}
                            ${courseOverview.totalLevels != null ? `<div class="stat-item"><strong>Levels:</strong> ${HUDUtils.escapeHtml(courseOverview.totalLevels)}</div>` : ''}
                            ${courseOverview.estimatedTime ? `<div class="stat-item"><strong>Time:</strong> ${HUDUtils.escapeHtml(courseOverview.estimatedTime)}</div>` : ''}
                            ${courseOverview.prerequisites ? `<div class="stat-item"><strong>Pre-reqs:</strong> ${HUDUtils.escapeHtml(courseOverview.prerequisites)}</div>` : ''}
                        </div>
                        ${outcomes.length ? `
                            <h4>Learning Outcomes</h4>
                            <ul class="outcomes-list">
                                ${outcomes.map(o => `<li>${HUDUtils.escapeHtml(o)}</li>`).join('')}
                            </ul>
                        ` : ''}
                    </section>
                ` : ''}

                ${tierOverview ? `
                    <section class="overview-section">
                        <h3>The Roadmap</h3>
                        <div class="tier-cards">
                            ${tierOverview.map(tier => {
                                const name = tier?.name ? HUDUtils.escapeHtml(tier.name) : '';
                                const theme = tier?.theme ? HUDUtils.escapeHtml(tier.theme) : '';
                                const description = tier?.description ? HUDUtils.escapeHtml(tier.description) : '';
                                const difficultyRamp = tier?.difficultyRamp ? HUDUtils.escapeHtml(tier.difficultyRamp) : '';
                                return `
                                    <div class="curriculum-tier-card">
                                        ${name ? `<strong>${name}</strong>` : '<strong>Tier</strong>'}${theme ? `: ${theme}` : ''}
                                        ${description ? `<p>${description}</p>` : ''}
                                        ${difficultyRamp ? `
                                            <div class="tier-meta">
                                                <span class="meta-label">Difficulty:</span> ${difficultyRamp}
                                            </div>
                                        ` : ''}
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </section>
                ` : ''}

                ${difficultyProgression ? `
                    <section class="overview-section">
                        <h3>Difficulty Progression</h3>
                        <div class="progression-timeline">
                            ${Object.entries(difficultyProgression).map(([, phase]) => {
                                const desc = phase?.description ? HUDUtils.escapeHtml(phase.description) : '';
                                const tip = phase?.tip ? HUDUtils.escapeHtml(phase.tip) : '';
                                if (!desc && !tip) return '';
                                return `
                                    <div class="phase-card">
                                        ${desc ? `<strong>${desc}</strong>` : ''}
                                        ${tip ? `<p><em>Tip: ${tip}</em></p>` : ''}
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </section>
                ` : ''}
            </div>
        `;
        return html;
    },
    
    renderExercises(level) {
        if (!level) return '';

        const prompts = [];

        // Keep these generic (works across all levels) but structured.
        prompts.push('Before wiring, predict the output(s) for every input combination. Then test by toggling inputs to confirm your prediction.');
        prompts.push('Explain the circuit in one sentence using gate names (e.g., “Output is HIGH only when…”).');

        if (typeof level.maxGates === 'number' && level.maxGates > 0) {
            prompts.push(`Try solving again using fewer gates than the limit (${level.maxGates}). What simplification did you use?`);
        }

        // Add a physics/real-world reflection when physicsDetails exist.
        if (level.physicsDetails) {
            prompts.push('Connect the physics to the abstraction: what physical quantity is being treated as “logic 1” vs “logic 0” in this level?');
        }

        const items = prompts.map(p => `<li>${HUDUtils.escapeHtml(p)}</li>`).join('');
        return `
            <div class="lesson-card exercises">
                <h3>✅ Practice Exercises</h3>
                <ol class="exercise-list">${items}</ol>
            </div>
        `;
    }
    ,
    getVisualKeywords(type) {
        const t = String(type || '').toLowerCase();

        const map = {
            electron_flow: ['electron', 'charge', 'carrier', 'conductor', 'current', 'drift', 'signal propagation', 'lattice'],
            electric_field: ['electric field', 'field', 'potential', 'potential difference', 'voltage', 'energy per charge', 'force on charge'],
            semiconductor_doping: ['doping', 'n-type', 'p-type', 'carrier density', 'donor', 'acceptor', 'semiconductor'],
            npn_transistor: ['transistor', 'npn', 'junction', 'base', 'emitter', 'collector', 'carrier injection'],
            vacuum_tube: ['vacuum tube', 'thermionic', 'emission', 'cathode', 'anode', 'grid'],
            cmos_inverter: ['cmos', 'inverter', 'pmos', 'nmos', 'pull-up', 'pull-down', 'static power', 'dynamic power'],
            series_circuit: ['series', 'and', 'both', 'must', 'conduct'],
            parallel_circuit: ['parallel', 'or', 'any', 'path'],
            nand_universal: ['nand', 'universal', 'functional completeness', 'technology mapping'],
            nand_to_not: ['nand', 'not', 'tie', 'inputs', 'inverter'],
            xor_gate: ['xor', 'exclusive', 'parity', 'modulo', 'difference'],
            de_morgan: ['de morgan', 'bubble', 'pushing', 'inversion'],
            multiplexer: ['mux', 'multiplexer', 'select', 'routing'],
            decoder: ['decoder', 'one-hot', 'address'],
            half_adder: ['half adder', 'sum', 'carry', 'addition'],
            full_adder: ['full adder', 'carry', 'propagate', 'cin', 'cout'],
            sr_latch: ['sr latch', 'latch', 'feedback', 'bistable', 'memory'],
            dff_timing: ['flip-flop', 'dff', 'clock', 'edge', 'setup', 'hold'],
            t_flipflop: ['t flip-flop', 'toggle', 'divide', 'frequency'],
            counter_2bit: ['counter', 'state', 'count', 'rollover'],
            traffic_light: ['fsm', 'state machine', 'traffic', 'moore', 'mealy'],
            alu: ['alu', 'opcode', 'arithmetic', 'logic', 'flags'],
            cpu_datapath: ['cpu', 'datapath', 'fetch', 'decode', 'execute', 'von neumann']
        };

        // normalize aliases (keep in sync with generatePhysicsVisual aliases)
        const aliases = {
            electron_flow_detailed: 'electron_flow',
            npn_transistor_detailed: 'npn_transistor',
            series_circuit_detailed: 'series_circuit',
            parallel_circuit_detailed: 'parallel_circuit',
            nand_universal_detailed: 'nand_universal',
            xor_gate_detailed: 'xor_gate',
            de_morgan_detailed: 'de_morgan',
            multiplexer_detailed: 'multiplexer',
            decoder_detailed: 'decoder',
            half_adder_detailed: 'half_adder',
            full_adder_detailed: 'full_adder',
            sr_latch_detailed: 'sr_latch',
            t_flipflop_detailed: 't_flipflop',
            counter_detailed: 'counter_2bit',
            fsm_traffic: 'traffic_light',
            alu_detailed: 'alu',
            cpu_datapath_detailed: 'cpu_datapath'
        };

        const normalized = aliases[t] || t;
        return map[normalized] || [];
    },
    scoreConceptCardForKeywords(card, keywords) {
        if (!keywords || keywords.length === 0) return 0;

        if (typeof card === 'string') {
            const hay = card.toLowerCase();
            return keywords.reduce((sum, k) => sum + (hay.includes(k) ? 1 : 0), 0);
        }

        if (!card || typeof card !== 'object') return 0;

        const term = String(card.term || card.title || '').toLowerCase();
        const body = [
            card.definition,
            card.why,
            card.analogy,
            card.formula
        ].filter(Boolean).join(' ').toLowerCase();

        // Weight term matches higher than body matches
        let score = 0;
        keywords.forEach(k => {
            if (term.includes(k)) score += 3;
            if (body.includes(k)) score += 1;
        });
        return score;
    },
    renderWorkedExample(example) {
        if (typeof example === 'string') {
            return `<div class="worked-example"><strong>Example:</strong> ${HUDUtils.escapeHtml(example)}</div>`;
        }

        let html = `<div class="worked-example"><strong>Worked Example:</strong>`;

        if (example.problem) {
            html += `<div class="example-problem">${HUDUtils.escapeHtml(example.problem)}</div>`;
        }

        if (example.given) {
            const givenList = Array.isArray(example.given)
                ? example.given.map(g => `<li>${HUDUtils.formatEquation(g)}</li>`).join('')
                : `<li>${HUDUtils.formatEquation(example.given)}</li>`;
            html += `<div class="example-given"><em>Given:</em><ul>${givenList}</ul></div>`;
        }

        if (Array.isArray(example.steps)) {
            const stepsList = example.steps.map((s, i) => `<li><strong>Step ${i + 1}:</strong> ${HUDUtils.formatEquation(s)}</li>`).join('');
            html += `<details class="exercise-hint"><summary>Solution</summary><div class="example-steps"><ol>${stepsList}</ol></div></details>`;
        }

        if (example.answer) {
            html += `<details class="exercise-answer"><summary>Answer</summary><div class="example-answer">${HUDUtils.escapeHtml(example.answer)}</div></details>`;
        }

        html += '</div>';
        return html;
    },
    getEquationExplanation(eq) {
        const eqLower = String(eq || '').toLowerCase();

        // Basic electrostatics / fields
        if (eqLower.replace(/\s+/g, '') === 'f=qe' || (eqLower.includes('f') && eqLower.includes('q') && eqLower.includes('e') && eqLower.includes('='))) {
            return '<span class="var">F</span> = force, <span class="var">q</span> = charge, <span class="var">E</span> = electric field. <em>The field pushes charges and creates a net drift that becomes current.</em>';
        }

        // Drift/current in conductors
        if (eqLower.includes('i') && eqLower.includes('nav') && eqLower.includes('v')) {
            return '<span class="var">I</span> = current, <span class="var">n</span> = carrier density, <span class="var">A</span> = cross-sectional area, <span class="var">v<sub>d</sub></span> = drift velocity. <em>More carriers, larger wire, or higher drift → more current.</em>';
        }
        if (eqLower.includes('j') && (eqLower.includes('σe') || (eqLower.includes('sigma') && eqLower.includes('e')))) {
            return '<span class="var">J</span> = current density, <span class="var">\u03C3</span> = conductivity, <span class="var">E</span> = electric field. <em>Local form of Ohm\'s law: field drives current density through the material.</em>';
        }

        // Power equations
        if (eqLower.includes('p') && eqLower.includes('cv') && eqLower.includes('f')) {
            return '<span class="var">P</span> = power dissipated, <span class="var">C</span> = capacitance (gate + wire), <span class="var">V</span> = supply voltage, <span class="var">f</span> = switching frequency. <em>Power scales with voltage squared—why lower voltages save so much energy.</em>';
        }
        if (eqLower.includes('p') && eqLower.includes('static') && eqLower.includes('0')) {
            return 'CMOS draws almost no power when not switching because one transistor is always OFF, blocking any path from VDD to GND.';
        }

        // Ohm's law
        if (eqLower.includes('v') && eqLower.includes('ir') && !eqLower.includes('vir')) {
            return '<span class="var">V</span> = voltage <span class="unit">(Volts)</span>, <span class="var">I</span> = current <span class="unit">(Amps)</span>, <span class="var">R</span> = resistance <span class="unit">(Ohms)</span>. <em>Fundamental relationship: voltage drops across resistance proportional to current.</em>';
        }

        // Current definition
        if (eqLower.includes('i') && eqLower.includes('q') && eqLower.includes('t')) {
            return '<span class="var">I</span> = current, <span class="var">Q</span> = charge, <span class="var">t</span> = time. <em>Current is the rate of charge flow—how many Coulombs pass per second.</em>';
        }

        // Boolean algebra / De Morgan
        if (eqLower.includes('and') || eqLower.includes('or') || eqLower.includes('not')) {
            if (eqLower.includes('not') && eqLower.includes('and') && eqLower.includes('or')) {
                return 'De Morgan\'s Theorem: inverting an AND gate and swapping AND↔OR gives equivalent logic. Essential for gate-level optimization.';
            }
        }

        // XOR for addition
        if (eqLower.includes('xor') && eqLower.includes('sum')) {
            return 'XOR produces 1 when inputs differ. For binary addition: 0+0=0, 0+1=1, 1+0=1, 1+1=0 (with carry). <em>XOR is the sum bit.</em>';
        }
        if (eqLower.includes('and') && eqLower.includes('carry')) {
            return 'AND produces the carry: only 1+1=1 generates a carry to the next column.';
        }

        // Full adder
        if (eqLower.includes('sum') && eqLower.includes('cin')) {
            return 'Full adder XORs all three inputs. When odd number of inputs are 1, sum is 1.';
        }
        if (eqLower.includes('cout') && (eqLower.includes('cin') || eqLower.includes('ab'))) {
            return 'Carry-out when at least two inputs are 1. Enables chaining for multi-bit arithmetic.';
        }

        // SR Latch
        if (eqLower.includes('nor') && (eqLower.includes('q') || eqLower.includes('r'))) {
            return 'Cross-coupled NOR gates: each output feeds back to reinforce the other. This creates two stable states (memory).';
        }

        // Timing
        if (eqLower.includes('f_max') || eqLower.includes('fmax')) {
            return '<span class="var">f<sub>max</sub></span> = maximum clock frequency. Limited by the slowest path: propagation delays plus setup time must fit in one clock period.';
        }
        if (eqLower.includes('t_cq') || eqLower.includes('clock-to-q')) {
            return 'Clock-to-Q delay: time from clock edge to valid output. Determines how fast the next stage sees the new value.';
        }
        if (eqLower.includes('t_su') || eqLower.includes('setup')) {
            return 'Setup time: data must be stable THIS LONG before the clock edge, or metastability may occur.';
        }
        if (eqLower.includes('mtbf')) {
            return 'Mean Time Between Failures due to metastability. Increases exponentially with resolution time (how long the output has to settle).';
        }

        // Noise margin
        if (eqLower.includes('nm') && (eqLower.includes('v_oh') || eqLower.includes('v_il'))) {
            return 'Noise margin is the "safety zone" between what the output guarantees and what the input needs. Larger = more immune to noise.';
        }

        // MUX
        if (eqLower.includes('mux') || eqLower.includes('sel')) {
            return 'Multiplexer uses select lines to route one of several inputs to the output. Essential for choosing between data sources.';
        }

        // Counter
        if (eqLower.includes('2^n') || eqLower.includes('2\u207f')) {
            return 'n flip-flops can count to 2\u207f states (0 to 2\u207f-1). A 4-bit counter cycles 0→15 then wraps to 0.';
        }

        // CPU performance
        if (eqLower.includes('cpi') || eqLower.includes('ipc')) {
            return 'Cycles Per Instruction (CPI) or Instructions Per Cycle (IPC). Lower CPI = faster execution for same clock frequency.';
        }
        if (eqLower.includes('throughput') || eqLower.includes('speedup')) {
            return 'Pipelining ideally gives n× speedup for n stages—each stage works on a different instruction simultaneously.';
        }

        return '';
    },
    getIntroductionHtml(level, index, tierInfo, isFirstInTier) {
        const conceptHtml = HUDUtils.formatStoryText(level.introText || level.description || '');
        const storyHtml = level.storyText ? `<h3>Deep Dive</h3><div class="story-content">${HUDUtils.formatStoryText(level.storyText)}</div>` : '';
        const detailsHtml = this.renderPhysicsDetails(level.physicsDetails, level);
        const exercisesHtml = this.renderExercises(level);
        const curriculumHtml = level.id === 'level_00' ? this.renderCurriculumOverview(level) : '';

        return `<div class="chapter-intro">
            ${isFirstInTier ? `<p class="chapter-desc">${HUDUtils.escapeHtml(tierInfo.description || '')}</p><hr>` : ''}
            ${index === 0 ? curriculumHtml : ''}
            <h3>The Concept</h3>${conceptHtml}${detailsHtml}${exercisesHtml}${storyHtml}
            <div class="interactive-note"><strong>Objective:</strong> ${HUDUtils.escapeHtml(level.objective || 'Complete the circuit.')}</div>
        </div>`;
    },
    getInstructionsHtml(level, variant) {
        const descHtml = `<div class="problem-description">${HUDUtils.formatStoryText(level.description || '')}</div>`;
        const objHtml = `<p class="objective"><strong>Goal:</strong> ${HUDUtils.escapeHtml(level.objective || 'Complete the circuit.')}</p>`;
        return `${descHtml}${objHtml}${level.maxGates ? `<p><strong>Limit:</strong> ${level.maxGates} gates.</p>` : ''}`;
    }
};