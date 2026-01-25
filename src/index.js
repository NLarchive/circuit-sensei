import { Circuit } from './core/Circuit.js';
import { CanvasRenderer } from './ui/CanvasRenderer.js';
import { InputHandler } from './ui/InputHandler.js';
import { HUD } from './ui/HUD.js';
import { gameManager } from './game/GameManager.js';
import { globalEvents, Events } from './game/EventBus.js';
import { analytics } from './utils/Analytics.js';
import { KeyboardManager } from './ui/controls/KeyboardManager.js';
import { CompletionModal } from './ui/overlays/CompletionModal.js';
import { DataLoader } from './utils/DataLoader.js';
import { MusicController } from './audio/MusicController.js';

document.addEventListener('DOMContentLoaded', async () => {
    const canvas = document.getElementById('circuit-canvas');
    
    // Add skip link for accessibility
    const skipLink = document.createElement('a');
    skipLink.href = '#circuit-canvas';
    skipLink.className = 'skip-link';
    skipLink.textContent = 'Skip to circuit canvas';
    document.body.insertBefore(skipLink, document.body.firstChild);
    
    // Add ARIA live region for announcements
    const ariaStatus = document.createElement('div');
    ariaStatus.id = 'aria-status';
    ariaStatus.className = 'aria-status';
    ariaStatus.setAttribute('aria-live', 'polite');
    ariaStatus.setAttribute('aria-atomic', 'true');
    document.body.appendChild(ariaStatus);
    
    // Initialize Core
    const circuit = new Circuit();
    
    // Initialize UI
    const renderer = new CanvasRenderer(canvas);
    renderer.setCircuit(circuit);
    const inputHandler = new InputHandler(canvas, circuit, renderer);
    const hud = new HUD('ui-layer', 'toolbox-container', 'navbar', circuit);

    // Initialize keyboard shortcuts
    KeyboardManager.init();
    
    // Initialize completion modal
    CompletionModal.init();
    
    // Initialize music system
    MusicController.init();

    // Setup music event listeners EARLY before gameManager.init()
    globalEvents.on(Events.LEVEL_LOADED, (data) => {
        // Extract level ID (e.g., "level_01" from level object)
        const levelId = data.level?.id || 'level_01';
        const difficulty = gameManager.currentVariant || 'easy';
        MusicController.onScreenChange('level', levelId, difficulty);
    });
    
    // Play roadmap music when returning to roadmap or initially showing it
    globalEvents.on(Events.UI_OVERLAY_OPENED, (data) => {
        if (data?.overlay === 'roadmap') {
            MusicController.onScreenChange('roadmap');
        }
    });

    // Restore level music when roadmap is closed
    globalEvents.on(Events.UI_OVERLAY_CLOSED, (data) => {
        if (data?.overlay === 'roadmap') {
            if (gameManager.currentLevel) {
                const levelId = gameManager.currentLevel.id;
                const difficulty = gameManager.currentVariant || 'easy';
                MusicController.onScreenChange('level', levelId, difficulty);
            }
        }
    });
    
    // Preload data
    DataLoader.preload();

    // Expose for debugging and E2E tests
    window.gameManager = gameManager;
    window.globalEvents = globalEvents;
    window.analytics = analytics;
    window.MusicController = MusicController;
    
    window.interactionMode = 'select';
    
    // Start Game
    try {
        await gameManager.init();
        
        // App is initialized, remove loading class to reveal UI
        document.body.classList.remove('app-loading');

        // Start Render Loop
        renderer.start();
        
        // Start Simulation Loop (Physics/Timing)
        let simulationPaused = false;
        globalEvents.on(Events.SIMULATION_PAUSED, () => {
            simulationPaused = true;
            circuit.setClocksActive(false);
        });
        globalEvents.on(Events.SIMULATION_RESUMED, () => {
            simulationPaused = false;
            circuit.setClocksActive(true);
        });
        globalEvents.on(Events.SIMULATION_STEP, () => {
            circuit.pulseClocks();
        });

        let lastTime = performance.now();
        const simulationLoop = (time) => {
            const dt = time - lastTime;
            lastTime = time;
            
            if (gameManager.state === 'PLAYING' && !simulationPaused) {
                circuit.tick(dt);
            }
            
            requestAnimationFrame(simulationLoop);
        };
        requestAnimationFrame(simulationLoop);
        
        console.log('Logic Architect Initialized');
    } catch (error) {
        console.error('Failed to initialize game:', error);
    }
});
