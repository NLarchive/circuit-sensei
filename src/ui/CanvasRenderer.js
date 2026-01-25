import { globalEvents, Events } from '../game/EventBus.js';
import { GameConfig } from '../../config/gameConfig.js';

/**
 * CanvasRenderer - Draws the circuit on HTML5 Canvas
 * Handles visualization of gates, wires, and signals
 */
export class CanvasRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.circuit = null;
        this.scale = 1;
        this.offset = { x: 0, y: 0 };
        
        // Colors from config
        this.colors = {
            background: '#1a1a2e',
            grid: '#16213e',
            wireOff: GameConfig.COLORS.SIGNAL_OFF,
            wireOn: GameConfig.COLORS.SIGNAL_ON,
            wireMetastable: GameConfig.COLORS.SIGNAL_METASTABLE,
            gateBody: GameConfig.COLORS.GATE_BG,
            gateBorder: GameConfig.COLORS.GATE_BORDER,
            inputOff: '#666666',
            inputOn: GameConfig.COLORS.SIGNAL_ON,
            outputOff: '#330000',
            outputOn: GameConfig.COLORS.SIGNAL_ON,
            text: '#ffffff',
            highlight: '#e94560'
        };

        // Gate dimensions
        this.gateWidth = 80;
        this.gateHeight = 60;
        this.pinRadius = 8;

        this.setupCanvas();
        window.addEventListener('resize', () => this.setupCanvas());
        this.setupEvents();
    }

    setupEvents() {
        globalEvents.on(Events.ZOOM_CHANGED, (data) => {
            this.scale = Math.max(0.5, Math.min(2, this.scale + data.delta));
            this.draw();
            globalEvents.emit(Events.ZOOM_UPDATED, { scale: this.scale, percent: Math.round(this.scale * 100) });
        });
    }

    /**
     * Setup canvas for high DPI displays
     */
    setupCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        
        this.width = rect.width;
        this.height = rect.height;
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.scale(dpr, dpr);
        
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
    }

    /**
     * Set the circuit to render
     */
    setCircuit(circuit) {
        this.circuit = circuit;
    }

    /**
     * Main draw loop
     */
    draw() {
        this.clear();
        
        this.ctx.save();
        this.ctx.translate(this.offset.x, this.offset.y);
        this.ctx.scale(this.scale, this.scale);
        
        this.drawGrid();
        
        if (this.circuit) {
            this.drawWires();
            this.drawGates();
        }
        
        this.ctx.restore();
    }

    /**
     * Clear the canvas
     */
    clear() {
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    /**
     * Draw background grid (infinite)
     */
    drawGrid() {
        const gridSize = GameConfig.GRID_SIZE;
        this.ctx.strokeStyle = this.colors.grid;
        this.ctx.lineWidth = 0.5;

        // Calculate visible bounds in world space
        const left = -this.offset.x / this.scale;
        const top = -this.offset.y / this.scale;
        const right = (this.width - this.offset.x) / this.scale;
        const bottom = (this.height - this.offset.y) / this.scale;

        // Snap visible bounds to grid
        const startX = Math.floor(left / gridSize) * gridSize;
        const endX = Math.ceil(right / gridSize) * gridSize;
        const startY = Math.floor(top / gridSize) * gridSize;
        const endY = Math.ceil(bottom / gridSize) * gridSize;

        this.ctx.beginPath();
        for (let x = startX; x <= endX; x += gridSize) {
            this.ctx.moveTo(x, startY);
            this.ctx.lineTo(x, endY);
        }

        for (let y = startY; y <= endY; y += gridSize) {
            this.ctx.moveTo(startX, y);
            this.ctx.lineTo(endX, y);
        }
        this.ctx.stroke();
    }

    /**
     * Draw all wires
     */
    drawWires() {
        this.circuit.wires.forEach(wire => {
            this.drawWire(wire);
        });
    }

    /**
     * Draw a single wire with signal state
     */
    drawWire(wire) {
        const fromGate = wire.fromGate;
        const toGate = wire.toGate;

        const start = this.getPinPosition(fromGate, 'output', wire.fromPin);
        const end = this.getPinPosition(toGate, 'input', wire.toPin);

        // Signal check: 1=High, 0=Low, -1=Metastable
        const signal = wire.signal;
        const isHigh = signal === 1;
        const isMetastable = signal === -1;
        
        this.ctx.beginPath();
        this.ctx.moveTo(start.x, start.y);
        
        // Manhattan routing (right angles)
        const midX = start.x + (end.x - start.x) / 2;
        this.ctx.lineTo(midX, start.y);
        this.ctx.lineTo(midX, end.y);
        this.ctx.lineTo(end.x, end.y);

        if (isHigh) {
            this.ctx.strokeStyle = this.colors.wireOn;
            this.ctx.lineWidth = 4;
        } else if (isMetastable) {
            this.ctx.strokeStyle = this.colors.wireMetastable;
            this.ctx.lineWidth = 3;
            // Dash effect for unstable signal
            this.ctx.setLineDash([5, 5]);
        } else {
            this.ctx.strokeStyle = this.colors.wireOff;
            this.ctx.lineWidth = 2;
        }
        
        if (isHigh || isMetastable) {
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = this.ctx.strokeStyle;
        }
        
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;
        this.ctx.setLineDash([]); // Reset dash
    }

    /**
     * Get dimensions for a specific gate type
     */
    getGateDimensions(gate) {
        if (gate.type === 'input') {
            return { width: 50, height: 40 };
        } else if (gate.type === 'output') {
            return { width: 50, height: 40 };
        }
        return { width: this.gateWidth, height: this.gateHeight };
    }

    /**
     * Draw all gates
     */
    drawGates() {
        this.circuit.gates.forEach(gate => {
            this.drawGate(gate);
            
            // If in wire mode, highlight pins
            if (window.interactionMode === 'wire') {
                this.drawPinHighlights(gate);
            }
        });
    }

    drawPinHighlights(gate) {
        const dims = this.getGateDimensions(gate);
        const HIT_RADIUS = 10;
        
        this.ctx.save();
        this.ctx.globalAlpha = 0.5;
        this.ctx.fillStyle = '#00ffff';
        
        // Inputs
        const inputCount = gate.inputCount || 0;
        const spacing = dims.height / (inputCount + 1);
        for (let i = 0; i < inputCount; i++) {
            this.ctx.beginPath();
            this.ctx.arc(gate.x - 5, gate.y + spacing * (i + 1), 5, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Output
        const outputCount = gate.outputCount || 0;
        if (outputCount > 0) {
            if (outputCount === 1) {
                this.ctx.beginPath();
                this.ctx.arc(gate.x + dims.width + 5, gate.y + dims.height / 2, 5, 0, Math.PI * 2);
                this.ctx.fill();
            } else {
                const spacing = dims.height / (outputCount + 1);
                for (let i = 0; i < outputCount; i++) {
                    this.ctx.beginPath();
                    this.ctx.arc(gate.x + dims.width + 5, gate.y + spacing * (i + 1), 5, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            }
        }
        
        this.ctx.restore();
    }

    /**
     * Draw a single gate based on type
     */
    drawGate(gate) {
        const { x, y, type, outputs, inputs: gateInputs, label } = gate;

        switch (type) {
            case 'input':
                this.drawInputNode(gate);
                break;
            case 'clock':
                this.drawClockNode(gate);
                break;
            case 'output':
                this.drawOutputNode(gate);
                break;
            case 'not':
                this.drawNotGate(gate);
                break;
            case 'and':
            case 'nand':
                this.drawAndGate(gate, type === 'nand');
                break;
            case 'or':
            case 'nor':
                this.drawOrGate(gate, type === 'nor');
                break;
            case 'xor':
            case 'xnor':
                this.drawXorGate(gate, type === 'xnor');
                break;
            default:
                this.drawGenericGate(gate);
        }
    }

    /**
     * Draw a ghost version of a gate for placement preview
     */
    drawGateGhost(gateId, x, y) {
        // Find gate metadata
        const gateMeta = window.gameManager.gates[gateId];
        if (!gateMeta) return;

        const mockGate = {
            id: 'ghost',
            type: gateId,
            x,
            y,
            inputCount: gateMeta.inputs || 2,
            outputCount: gateMeta.outputs || 1,
            value: 0,
            inputs: [],
            outputs: []
        };

        this.drawGate(mockGate);
    }

    /**
     * Draw input switch node
     */
    drawInputNode(gate) {
        const { x, y, value, label } = gate;
        const isOn = value === 1;

        // Draw switch body
        this.ctx.fillStyle = isOn ? this.colors.inputOn : this.colors.inputOff;
        this.ctx.strokeStyle = this.colors.gateBorder;
        this.ctx.lineWidth = 2;

        this.ctx.beginPath();
        this.ctx.roundRect(x, y, 50, 40, 5);
        this.ctx.fill();
        this.ctx.stroke();

        // Glow effect when on
        if (isOn) {
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = this.colors.inputOn;
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        }

        // Label
        this.ctx.fillStyle = isOn ? '#000' : '#fff';
        this.ctx.font = 'bold 14px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(label || 'IN', x + 25, y + 25);
        this.ctx.fillText(isOn ? '1' : '0', x + 25, y + 55);
    }

    /**
     * Draw Clock Generator Node
     */
    drawClockNode(gate) {
        const { x, y, value } = gate;
        const isOn = value === 1;

        // Body
        this.ctx.fillStyle = this.colors.gateBody;
        this.ctx.strokeStyle = this.colors.gateBorder;
        this.ctx.lineWidth = 2;
        
        this.ctx.beginPath();
        this.ctx.roundRect(x, y, 50, 40, 5);
        this.ctx.fill();
        this.ctx.stroke();

        // Pulse Icon (Square Wave)
        this.ctx.strokeStyle = isOn ? this.colors.wireOn : this.colors.wireOff;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        const cx = x + 25;
        const cy = y + 25;
        // Icon path: _|-|_
        this.ctx.moveTo(cx - 15, cy + 8);
        this.ctx.lineTo(cx - 8, cy + 8);
        this.ctx.lineTo(cx - 8, cy - 8);
        this.ctx.lineTo(cx + 8, cy - 8);
        this.ctx.lineTo(cx + 8, cy + 8);
        this.ctx.lineTo(cx + 15, cy + 8);
        this.ctx.stroke();

        // Active State Dot
        if (isOn) {
            this.ctx.fillStyle = this.colors.wireOn;
            this.ctx.beginPath();
            this.ctx.arc(x + 42, y + 8, 3, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // Label
        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = '10px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('CLK', x + 25, y + 15);
        
        // Output Pin (Single)
        this.ctx.beginPath();
        this.ctx.arc(x + 50 + 5, y + 20, 4, 0, Math.PI * 2);
        this.ctx.fillStyle = this.colors.gateBorder;
        this.ctx.fill();
    }

    /**
     * Draw output LED node
     */
    drawOutputNode(gate) {
        const { x, y, outputs, label } = gate;
        const signal = outputs[0];
        const isOn = signal === 1;
        const isMetastable = signal === -1;

        // Draw LED
        this.ctx.beginPath();
        this.ctx.arc(x + 25, y + 20, 18, 0, Math.PI * 2);
        
        if (isOn) {
            this.ctx.fillStyle = this.colors.outputOn;
        } else if (isMetastable) {
            this.ctx.fillStyle = this.colors.wireMetastable;
        } else {
            this.ctx.fillStyle = this.colors.outputOff;
        }
        
        this.ctx.fill();
        this.ctx.strokeStyle = this.colors.gateBorder;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // Glow effect
        if (isOn || isMetastable) {
            this.ctx.shadowBlur = 25;
            this.ctx.shadowColor = isOn ? this.colors.outputOn : this.colors.wireMetastable;
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        }

        // Label
        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = '12px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(label || 'OUT', x + 25, y + 55);
    }

    /**
     * Draw NOT gate (triangle with bubble)
     */
    drawNotGate(gate) {
        const { x, y, outputs } = gate;
        const isOn = outputs[0] === 1;

        this.ctx.fillStyle = this.colors.gateBody;
        this.ctx.strokeStyle = isOn ? this.colors.wireOn : this.colors.gateBorder;
        this.ctx.lineWidth = 2;

        // Triangle
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x, y + this.gateHeight);
        this.ctx.lineTo(x + this.gateWidth - 15, y + this.gateHeight / 2);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();

        // Bubble (NOT indicator)
        this.ctx.beginPath();
        this.ctx.arc(x + this.gateWidth - 8, y + this.gateHeight / 2, 7, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();

        // Label
        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = 'bold 12px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('NOT', x + 30, y + this.gateHeight / 2 + 4);
    }

    /**
     * Draw AND/NAND gate
     */
    drawAndGate(gate, inverted = false) {
        const { x, y, outputs } = gate;
        const isOn = outputs[0] === 1;

        this.ctx.fillStyle = this.colors.gateBody;
        this.ctx.strokeStyle = isOn ? this.colors.wireOn : this.colors.gateBorder;
        this.ctx.lineWidth = 2;

        // Body (rectangle + semicircle)
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x + 40, y);
        this.ctx.arc(x + 40, y + this.gateHeight / 2, this.gateHeight / 2, -Math.PI / 2, Math.PI / 2);
        this.ctx.lineTo(x, y + this.gateHeight);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();

        // Inversion bubble for NAND
        if (inverted) {
            this.ctx.beginPath();
            this.ctx.arc(x + this.gateWidth + 5, y + this.gateHeight / 2, 7, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();
        }

        // Label
        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = 'bold 12px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(inverted ? 'NAND' : 'AND', x + 35, y + this.gateHeight / 2 + 4);

        // Input pins
        this.drawInputPins(gate, 2);
    }

    /**
     * Draw OR/NOR gate
     */
    drawOrGate(gate, inverted = false) {
        const { x, y, outputs } = gate;
        const isOn = outputs[0] === 1;

        this.ctx.fillStyle = this.colors.gateBody;
        this.ctx.strokeStyle = isOn ? this.colors.wireOn : this.colors.gateBorder;
        this.ctx.lineWidth = 2;

        // OR shape
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.quadraticCurveTo(x + 20, y + this.gateHeight / 2, x, y + this.gateHeight);
        this.ctx.quadraticCurveTo(x + this.gateWidth, y + this.gateHeight / 2, x, y);
        this.ctx.fill();
        this.ctx.stroke();

        // Inversion bubble for NOR
        if (inverted) {
            this.ctx.beginPath();
            this.ctx.arc(x + this.gateWidth + 5, y + this.gateHeight / 2, 7, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();
        }

        // Label
        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = 'bold 12px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(inverted ? 'NOR' : 'OR', x + 35, y + this.gateHeight / 2 + 4);

        this.drawInputPins(gate, 2);
    }

    /**
     * Draw XOR/XNOR gate
     */
    drawXorGate(gate, inverted = false) {
        const { x, y, outputs } = gate;
        const isOn = outputs[0] === 1;

        this.ctx.fillStyle = this.colors.gateBody;
        this.ctx.strokeStyle = isOn ? this.colors.wireOn : this.colors.gateBorder;
        this.ctx.lineWidth = 2;

        // XOR shape (OR with extra curve)
        this.ctx.beginPath();
        this.ctx.moveTo(x + 5, y);
        this.ctx.quadraticCurveTo(x + 25, y + this.gateHeight / 2, x + 5, y + this.gateHeight);
        this.ctx.quadraticCurveTo(x + this.gateWidth, y + this.gateHeight / 2, x + 5, y);
        this.ctx.fill();
        this.ctx.stroke();

        // Extra XOR curve
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.quadraticCurveTo(x + 20, y + this.gateHeight / 2, x, y + this.gateHeight);
        this.ctx.stroke();

        // Inversion bubble for XNOR
        if (inverted) {
            this.ctx.beginPath();
            this.ctx.arc(x + this.gateWidth + 5, y + this.gateHeight / 2, 7, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();
        }

        // Label
        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = 'bold 11px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(inverted ? 'XNOR' : 'XOR', x + 40, y + this.gateHeight / 2 + 4);

        this.drawInputPins(gate, 2);
    }

    /**
     * Draw generic gate (fallback)
     */
    drawGenericGate(gate) {
        const { x, y, type, outputs } = gate;
        const isOn = outputs[0] === 1;

        this.ctx.fillStyle = this.colors.gateBody;
        this.ctx.strokeStyle = isOn ? this.colors.wireOn : this.colors.gateBorder;
        this.ctx.lineWidth = 2;

        this.ctx.beginPath();
        this.ctx.roundRect(x, y, this.gateWidth, this.gateHeight, 5);
        this.ctx.fill();
        this.ctx.stroke();

        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = 'bold 12px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(type.toUpperCase(), x + this.gateWidth / 2, y + this.gateHeight / 2 + 4);

        this.drawInputPins(gate, gate.inputCount || 2);
    }

    /**
     * Draw input pin indicators
     */
    drawInputPins(gate, count) {
        const { x, y } = gate;
        const spacing = this.gateHeight / (count + 1);

        for (let i = 0; i < count; i++) {
            const pinY = y + spacing * (i + 1);
            this.ctx.beginPath();
            this.ctx.arc(x - 5, pinY, 4, 0, Math.PI * 2);
            this.ctx.fillStyle = this.colors.gateBorder;
            this.ctx.fill();
        }

        // Output pin(s)
        const outputCount = gate.outputCount || 1;
        if (outputCount === 1) {
            this.ctx.beginPath();
            this.ctx.arc(x + this.gateWidth + 5, y + this.gateHeight / 2, 4, 0, Math.PI * 2);
            this.ctx.fillStyle = this.colors.gateBorder;
            this.ctx.fill();
            return;
        }

        const outSpacing = this.gateHeight / (outputCount + 1);
        for (let i = 0; i < outputCount; i++) {
            const pinY = y + outSpacing * (i + 1);
            this.ctx.beginPath();
            this.ctx.arc(x + this.gateWidth + 5, pinY, 4, 0, Math.PI * 2);
            this.ctx.fillStyle = this.colors.gateBorder;
            this.ctx.fill();
        }
    }

    getPinPosition(gate, type, index) {
        const dims = this.getGateDimensions(gate);

        if (type === 'input') {
            const inputCount = gate.inputCount || 1;
            const spacing = dims.height / (inputCount + 1);
            return {
                x: gate.x - 5,
                y: gate.y + spacing * (index + 1)
            };
        }

        const outputCount = gate.outputCount || 0;
        if (outputCount <= 1) {
            return {
                x: gate.x + dims.width + 5,
                y: gate.y + dims.height / 2
            };
        }

        const spacing = dims.height / (outputCount + 1);
        return {
            x: gate.x + dims.width + 5,
            y: gate.y + spacing * (index + 1)
        };
    }

    /**
     * Get gate at position (for interaction)
     */
    getGateAtPosition(mouseX, mouseY) {
        if (!this.circuit) return null;

        for (const [id, gate] of this.circuit.gates) {
            const dims = this.getGateDimensions(gate);
            if (mouseX >= gate.x && mouseX <= gate.x + dims.width &&
                mouseY >= gate.y && mouseY <= gate.y + dims.height) {
                return gate;
            }
        }
        return null;
    }

    /**
     * Start the render loop
     */
    start() {
        const render = () => {
            this.draw();
            this.animationFrame = requestAnimationFrame(render);
        };
        render();
    }

    /**
     * Stop the render loop
     */
    stop() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
    }

    /**
     * Resize handler
     */
    resize() {
        this.setupCanvas();
        this.draw();
    }
}
