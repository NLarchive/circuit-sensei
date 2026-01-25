import { globalEvents, Events } from '../game/EventBus.js';
import { MathUtils } from '../utils/MathUtils.js';
import { GameConfig } from '../../config/gameConfig.js';

/**
 * InputHandler - Handles mouse/touch interactions for the circuit editor
 */
export class InputHandler {
    constructor(canvas, circuit, renderer) {
        this.canvas = canvas;
        this.circuit = circuit;
        this.renderer = renderer;
        
        // Interaction mode: 'select' or 'wire'
        this.mode = 'select';
        
        // State
        this.isDragging = false;
        this.draggedGate = null;
        this.dragOffset = { x: 0, y: 0 };
        this.dragStartPos = { x: 0, y: 0 };
        
        this.isWiring = false;
        this.wiringStart = null; // { gate, pinIndex, type: 'input'|'output' }
        this.mousePos = { x: 0, y: 0 };
        
        // Panning state
        this.isPanning = false;
        this.panStart = { x: 0, y: 0 };

        // Touch specific state
        this.initialTouchDistance = 0;
        this.isPinching = false;
        this.lastTouchPos = { x: 0, y: 0 };
        this.pendingGatePlacement = null; // Used for mobile placement

        this.setupEventListeners();
        this.setupDropZone();
        this.bindModeEvents();
    }

    setupDropZone() {
        this.canvas.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        });

        this.canvas.addEventListener('drop', (e) => {
            e.preventDefault();
            const gateType = e.dataTransfer.getData('gateType');
            if (gateType) {
                const pos = this.getMousePos(e);
                const x = GameConfig.SNAP_TO_GRID ? MathUtils.snapToGrid(pos.x, GameConfig.GRID_SIZE) : pos.x;
                const y = GameConfig.SNAP_TO_GRID ? MathUtils.snapToGrid(pos.y, GameConfig.GRID_SIZE) : pos.y;
                this.circuit.addGate(gateType, x, y);
            }
        });
    }

    setupEventListeners() {
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('mouseleave', this.handleMouseUp.bind(this));
        
        // Prevent context menu on right click
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

        // Touch support
        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));

        // Wheel support for zooming
        this.canvas.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });
    }

    handleWheel(e) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.05 : 0.05;
        globalEvents.emit(Events.ZOOM_CHANGED, { delta });
    }

    bindModeEvents() {
        globalEvents.on('INTERACTION_MODE_CHANGED', (data) => {
            this.mode = data.mode;
            this.canvas.style.cursor = this.mode === 'wire' ? 'crosshair' : 'default';
        });

        globalEvents.on(Events.GATE_SELECT, (data) => {
            this.pendingGatePlacement = data.gateId;
            this.canvas.style.cursor = 'cell';
        });
    }

    setMode(mode) {
        this.mode = mode;
        this.canvas.style.cursor = mode === 'wire' ? 'crosshair' : 'default';
    }

    handleTouchStart(e) {
        if (e.touches.length === 2) {
            this.initialTouchDistance = this.getTouchDistance(e.touches);
            this.isPinching = true;
            this.isPanning = false; // Stop panning when pinching starts
            return;
        }

        e.preventDefault();
        const touch = e.touches[0];
        this.lastTouchPos = { x: touch.clientX, y: touch.clientY };
        
        const mouseEvent = new MouseEvent('mousedown', {
            clientX: touch.clientX,
            clientY: touch.clientY,
            button: 0
        });
        this.handleMouseDown(mouseEvent);
    }

    handleTouchMove(e) {
        if (e.touches.length === 2 && this.isPinching) {
            e.preventDefault();
            const currentDistance = this.getTouchDistance(e.touches);
            const delta = (currentDistance - this.initialTouchDistance) * 0.005;
            if (Math.abs(delta) > 0.01) {
                globalEvents.emit(Events.ZOOM_CHANGED, { delta });
                this.initialTouchDistance = currentDistance;
            }
            return;
        }

        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousemove', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        this.handleMouseMove(mouseEvent);
        this.lastTouchPos = { x: touch.clientX, y: touch.clientY };
    }

    handleTouchEnd(e) {
        if (this.isPinching) {
            if (e.touches.length < 2) {
                this.isPinching = false;
            }
            return;
        }

        e.preventDefault();
        const upEvent = new MouseEvent('mouseup', {
            clientX: this.lastTouchPos.x,
            clientY: this.lastTouchPos.y
        });
        this.handleMouseUp(upEvent);
    }

    getTouchDistance(touches) {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        // e.clientX/Y are in viewport coordinates.
        // (e.clientX - rect.left) is in CSS pixels relative to canvas top-left.
        const cssX = e.clientX - rect.left;
        const cssY = e.clientY - rect.top;
        
        return {
            x: (cssX - this.renderer.offset.x) / this.renderer.scale,
            y: (cssY - this.renderer.offset.y) / this.renderer.scale
        };
    }

    handleMouseDown(e) {
        const pos = this.getMousePos(e);
        this.mousePos = pos;

        // Mobile placement mode
        if (this.pendingGatePlacement) {
            const x = GameConfig.SNAP_TO_GRID ? MathUtils.snapToGrid(pos.x, GameConfig.GRID_SIZE) : pos.x;
            const y = GameConfig.SNAP_TO_GRID ? MathUtils.snapToGrid(pos.y, GameConfig.GRID_SIZE) : pos.y;
            this.circuit.addGate(this.pendingGatePlacement, x, y);
            this.pendingGatePlacement = null;
            this.canvas.style.cursor = this.mode === 'wire' ? 'crosshair' : 'default';
            this.renderer.draw();
            return;
        }

        // Middle mouse button always pans
        if (e.button === 1) {
            this.isPanning = true;
            this.panStart = { x: e.clientX, y: e.clientY };
            return;
        }

        // Right click to delete
        if (e.button === 2) {
            const gate = this.renderer.getGateAtPosition(pos.x, pos.y);
            if (gate) {
                this.circuit.removeGate(gate.id);
                this.renderer.draw();
                return;
            }
            
            const wire = this.getWireAtPosition(pos.x, pos.y);
            if (wire) {
                this.circuit.removeWire(wire.id);
                this.renderer.draw();
                return;
            }
        }

        // WIRE MODE: prioritize pin clicks
        if (this.mode === 'wire') {
            const pin = this.getPinAtPosition(pos.x, pos.y);
            console.log('Wiring start attempt:', { pos, pin });
            if (pin) {
                this.isWiring = true;
                this.wiringStart = pin;
                return;
            }
        }

        // PROBE MODE: clicking pins/wires to add to analyzer
        if (this.mode === 'probe') {
            const pin = this.getPinAtPosition(pos.x, pos.y);
            if (pin) {
                globalEvents.emit('PROBE_PIN', { pin });
                return;
            }
        }

        // SELECT MODE: handle gates first
        if (this.mode === 'select') {
            const gate = this.renderer.getGateAtPosition(pos.x, pos.y);
            if (gate) {
                // Start Dragging
                this.isDragging = true;
                this.draggedGate = gate;
                this.dragStartPos = { x: pos.x, y: pos.y };
                this.dragOffset = {
                    x: pos.x - gate.x,
                    y: pos.y - gate.y
                };
                return;
            }
        }

        // Default: Start panning
        if (e.button === 0 || e.button === 1) {
            this.isPanning = true;
            this.panStart = { x: e.clientX, y: e.clientY };
            this.canvas.style.cursor = 'grabbing';
        }
    }

    handleMouseMove(e) {
        const pos = this.getMousePos(e);
        this.mousePos = pos;

        if (this.isPanning) {
            const dx = e.clientX - this.panStart.x;
            const dy = e.clientY - this.panStart.y;
            
            this.renderer.offset.x += dx;
            this.renderer.offset.y += dy;
            
            this.panStart = { x: e.clientX, y: e.clientY };
            this.renderer.draw();
            return;
        }

        if (this.isDragging && this.draggedGate && this.mode === 'select') {
            let newX = pos.x - this.dragOffset.x;
            let newY = pos.y - this.dragOffset.y;
            
            if (GameConfig.SNAP_TO_GRID) {
                newX = MathUtils.snapToGrid(newX, GameConfig.GRID_SIZE);
                newY = MathUtils.snapToGrid(newY, GameConfig.GRID_SIZE);
            }
            
            this.draggedGate.x = newX;
            this.draggedGate.y = newY;
            
            this.renderer.draw(); // Redraw immediately
        }

        if (this.isWiring && this.mode === 'wire') {
            this.renderer.draw();
            // Draw temp wire with visual feedback
            const ctx = this.renderer.ctx;
            ctx.save();
            ctx.translate(this.renderer.offset.x, this.renderer.offset.y);
            ctx.scale(this.renderer.scale, this.renderer.scale);
            
            ctx.beginPath();
            const startPos = this.getPinPosition(this.wiringStart);
            ctx.moveTo(startPos.x, startPos.y);
            ctx.lineTo(pos.x, pos.y);
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 3;
            ctx.setLineDash([10, 5]);
            ctx.stroke();
            ctx.setLineDash([]);
            
            ctx.restore();
        }

        // Show ghost gate for mobile placement
        if (this.pendingGatePlacement) {
            this.renderer.draw();
            const ctx = this.renderer.ctx;
            ctx.save();
            ctx.translate(this.renderer.offset.x, this.renderer.offset.y);
            ctx.scale(this.renderer.scale, this.renderer.scale);
            
            let x = pos.x;
            let y = pos.y;
            if (GameConfig.SNAP_TO_GRID) {
                x = MathUtils.snapToGrid(x, GameConfig.GRID_SIZE);
                y = MathUtils.snapToGrid(y, GameConfig.GRID_SIZE);
            }
            
            ctx.globalAlpha = 0.5;
            this.renderer.drawGateGhost(this.pendingGatePlacement, x, y);
            ctx.restore();
        }
    }

    handleMouseUp(e) {
        if (this.isPanning) {
            this.isPanning = false;
            this.canvas.style.cursor = 'crosshair';
            return;
        }
        const pos = this.getMousePos(e);

        if (this.isWiring) {
            const endPin = this.getPinAtPosition(pos.x, pos.y);
            console.log('Wiring end:', { pos, endPin, startPin: this.wiringStart });
            
            if (endPin && this.isValidConnection(this.wiringStart, endPin)) {
                // Create connection
                try {
                    if (this.wiringStart.type === 'output') {
                        this.circuit.connect(
                            this.wiringStart.gate.id, this.wiringStart.index,
                            endPin.gate.id, endPin.index
                        );
                    } else {
                        this.circuit.connect(
                            endPin.gate.id, endPin.index,
                            this.wiringStart.gate.id, this.wiringStart.index
                        );
                    }
                    this.circuit.simulate();
                } catch (err) {
                    console.warn("Connection failed:", err);
                }
            }
        }

        // Handle Input Node toggling on click (if not dragged significantly)
        if (this.isDragging && this.draggedGate && this.draggedGate.type === 'input') {
            const dist = MathUtils.dist(this.dragStartPos.x, this.dragStartPos.y, pos.x, pos.y);
            if (dist < 5 && this.isClickOnInputBody(pos, this.draggedGate)) {
                const newValue = this.draggedGate.value === 0 ? 1 : 0;
                this.draggedGate.setValue(newValue);
                this.circuit.simulate();
                globalEvents.emit(Events.INPUT_TOGGLED, { id: this.draggedGate.id, value: newValue });
            }
        }

        this.isDragging = false;
        this.draggedGate = null;
        this.isWiring = false;
        this.wiringStart = null;
        this.renderer.draw();
    }

    /**
     * Hit test for pins
     */
    getPinAtPosition(x, y) {
        const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        const HIT_RADIUS = isTouch ? 25 : 15; 
        
        for (const [id, gate] of this.circuit.gates) {
            const dims = this.renderer.getGateDimensions(gate);
            
            // Check Inputs
            const inputCount = gate.inputCount || 0;
            if (inputCount > 0) {
                const spacing = dims.height / (inputCount + 1);
                
                for (let i = 0; i < inputCount; i++) {
                    const pinX = gate.x - 5;
                    const pinY = gate.y + spacing * (i + 1);
                    
                    if (Math.hypot(x - pinX, y - pinY) < HIT_RADIUS) {
                        return { gate, index: i, type: 'input' };
                    }
                }
            }

            // Check Output
            const outputCount = gate.outputCount || 0;
            if (outputCount > 0) {
                const pinX = gate.x + dims.width + 5;

                if (outputCount === 1) {
                    const pinY = gate.y + dims.height / 2;
                    if (Math.hypot(x - pinX, y - pinY) < HIT_RADIUS) {
                        return { gate, index: 0, type: 'output' };
                    }
                } else {
                    const spacing = dims.height / (outputCount + 1);
                    for (let i = 0; i < outputCount; i++) {
                        const pinY = gate.y + spacing * (i + 1);
                        if (Math.hypot(x - pinX, y - pinY) < HIT_RADIUS) {
                            return { gate, index: i, type: 'output' };
                        }
                    }
                }
            }
        }
        return null;
    }

    getPinPosition(pinInfo) {
        const { gate, index, type } = pinInfo;
        const dims = this.renderer.getGateDimensions(gate);
        
        if (type === 'input') {
            const inputCount = gate.inputCount || 1;
            const spacing = dims.height / (inputCount + 1);
            return {
                x: gate.x - 5,
                y: gate.y + spacing * (index + 1)
            };
        } else {
            const outputCount = gate.outputCount || 1;
            if (outputCount > 1) {
                const spacing = dims.height / (outputCount + 1);
                return {
                    x: gate.x + dims.width + 5,
                    y: gate.y + spacing * (index + 1)
                };
            }
            return {
                x: gate.x + dims.width + 5,
                y: gate.y + dims.height / 2
            };
        }
    }

    isValidConnection(start, end) {
        // Must connect output to input
        if (start.type === end.type) return false;
        // Cannot connect to self
        if (start.gate.id === end.gate.id) return false;
        return true;
    }

    isClickOnInputBody(pos, gate) {
        // Simple box check for the main body of the input switch
        return (
            pos.x >= gate.x && pos.x <= gate.x + 50 &&
            pos.y >= gate.y && pos.y <= gate.y + 40
        );
    }

    getWireAtPosition(x, y) {
        const THRESHOLD = 10;
        for (const [id, wire] of this.circuit.wires) {
            const start = this.getPinPosition({ gate: wire.fromGate, index: wire.fromPin, type: 'output' });
            const end = this.getPinPosition({ gate: wire.toGate, index: wire.toPin, type: 'input' });
            
            // Distance from point to line segment
            const dist = this.distToSegment({ x, y }, start, end);
            if (dist < THRESHOLD) {
                return wire;
            }
        }
        return null;
    }

    distToSegment(p, v, w) {
        const l2 = MathUtils.dist(v.x, v.y, w.x, w.y) ** 2;
        if (l2 === 0) return MathUtils.dist(p.x, p.y, v.x, v.y);
        let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
        t = Math.max(0, Math.min(1, t));
        return MathUtils.dist(p.x, p.y, v.x + t * (w.x - v.x), v.y + t * (w.y - v.y));
    }
}
