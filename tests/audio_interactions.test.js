import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MusicController } from '../src/audio/MusicController.js';
import { MusicEngine } from '../src/audio/MusicEngine.js';

/**
 * Audio Interactions Test Suite
 * Validates that audio works correctly in all user scenarios:
 * 1. Homepage/Roadmap display
 * 2. Music button clicks
 * 3. Level transitions
 * 4. Returning to roadmap
 * 5. Difficulty changes
 */

describe('Audio Interactions', () => {
    beforeEach(() => {
        // Reset audio controller state
        MusicController.audioEnabled = false;
        MusicController.currentScreen = 'roadmap';
        MusicController.currentLevelId = null;
        MusicController.currentDifficulty = 'easy';
        MusicController.isInitialized = false;
        
        // Mock audio context
        vi.spyOn(MusicEngine, 'init').mockReturnValue(undefined);
        vi.spyOn(MusicEngine, 'resume').mockResolvedValue(undefined);
        vi.spyOn(MusicEngine, 'play').mockReturnValue(undefined);
        vi.spyOn(MusicEngine, 'stop').mockReturnValue(undefined);
        vi.spyOn(MusicEngine, 'toggleMute').mockReturnValue(false);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Homepage/Roadmap Display', () => {
        it('should not play music until first user interaction', () => {
            MusicController.init();
            
            // Music controller is initialized but audio is not enabled yet
            expect(MusicController.isInitialized).toBe(true);
            expect(MusicController.audioEnabled).toBe(false);
            expect(MusicEngine.init).not.toHaveBeenCalled();
            expect(MusicEngine.play).not.toHaveBeenCalled();
        });

        it('should play roadmap music after first click', () => {
            MusicController.init();
            
            // Simulate first user interaction
            MusicController.enableAudio();
            
            expect(MusicEngine.init).toHaveBeenCalled();
            expect(MusicEngine.resume).toHaveBeenCalled();
            expect(MusicEngine.play).toHaveBeenCalled();
            expect(MusicController.audioEnabled).toBe(true);
            expect(MusicController.currentScreen).toBe('roadmap');
        });

        it('should play roadmap music when screen changes to roadmap', () => {
            MusicController.audioEnabled = true;
            MusicEngine.play.mockClear();
            
            MusicController.onScreenChange('roadmap');
            
            expect(MusicEngine.play).toHaveBeenCalled();
            expect(MusicController.currentScreen).toBe('roadmap');
        });
    });

    describe('Music Button Interaction', () => {
        it('should enable audio when button is clicked before first interaction', () => {
            MusicController.init();
            
            // Simulate button click before audio is enabled
            MusicController.toggleMusic();
            
            expect(MusicController.audioEnabled).toBe(true);
            expect(MusicEngine.init).toHaveBeenCalled();
            expect(MusicEngine.resume).toHaveBeenCalled();
        });

        it('should toggle mute when audio is already enabled', () => {
            MusicController.audioEnabled = true;
            MusicEngine.toggleMute.mockReturnValue(true); // Muted
            
            MusicController.toggleMusic();
            
            expect(MusicEngine.toggleMute).toHaveBeenCalled();
        });

        it('should update button icon when music is toggled', () => {
            MusicController.audioEnabled = true;
            MusicEngine.toggleMute.mockReturnValue(true);
            
            // Create a mock button
            const mockButton = document.createElement('button');
            mockButton.id = 'music-toggle-btn';
            MusicController.musicButton = mockButton;
            
            MusicController.toggleMusic();
            
            expect(MusicController.musicButton).toBeDefined();
            expect(MusicController.musicButton.classList.contains('muted')).toBe(true);
        });
    });

    describe('Level Transitions', () => {
        it('should play level music when level is loaded', () => {
            MusicController.audioEnabled = true;
            
            MusicController.onScreenChange('level', 'level_01', 'easy');
            
            expect(MusicEngine.play).toHaveBeenCalled();
            expect(MusicController.currentScreen).toBe('level');
            expect(MusicController.currentLevelId).toBe('level_01');
        });

        it('should not play if audio not yet enabled during level transition', () => {
            MusicController.audioEnabled = false;
            
            MusicController.onScreenChange('level', 'level_01', 'easy');
            
            // Audio not played, but pending change stored
            expect(MusicController.pendingScreenChange).toEqual({
                screen: 'level',
                levelId: 'level_01',
                difficulty: 'easy'
            });
        });

        it('should apply pending screen change after audio is enabled', () => {
            // Simulate: level transition queued before audio enabled
            MusicController.pendingScreenChange = {
                screen: 'level',
                levelId: 'level_01',
                difficulty: 'hard'
            };
            
            MusicController.enableAudio();
            
            expect(MusicEngine.play).toHaveBeenCalled();
            expect(MusicController.currentLevelId).toBe('level_01');
            expect(MusicController.pendingScreenChange).toBeNull();
        });
    });

    describe('Return to Roadmap', () => {
        it('should resume roadmap music when returning from level', () => {
            MusicController.audioEnabled = true;
            MusicController.currentScreen = 'level';
            MusicController.currentLevelId = 'level_01';
            
            MusicEngine.play.mockClear();
            
            MusicController.onScreenChange('roadmap');
            
            expect(MusicEngine.play).toHaveBeenCalled();
            expect(MusicController.currentScreen).toBe('roadmap');
            expect(MusicController.currentLevelId).toBeNull();
        });
    });

    describe('Difficulty Changes', () => {
        it('should update tempo when difficulty changes', () => {
            MusicController.audioEnabled = true;
            MusicController.currentScreen = 'level';
            MusicController.currentLevelId = 'level_01';
            
            MusicEngine.play.mockClear();
            
            MusicController.changeDifficulty('hard');
            
            expect(MusicEngine.play).toHaveBeenCalled();
            expect(MusicController.currentDifficulty).toBe('hard');
        });

        it('should not change difficulty for roadmap music', () => {
            MusicController.audioEnabled = true;
            MusicController.currentScreen = 'roadmap';
            
            MusicEngine.play.mockClear();
            
            MusicController.changeDifficulty('hard');
            
            expect(MusicEngine.play).not.toHaveBeenCalled();
        });
    });

    describe('State Management', () => {
        it('should report current audio state correctly', () => {
            MusicController.audioEnabled = true;
            MusicController.currentScreen = 'level';
            MusicController.currentLevelId = 'level_05';
            MusicController.currentDifficulty = 'medium';
            
            const state = MusicController.getState();
            
            expect(state.audioEnabled).toBe(true);
            expect(state.screen).toBe('level');
            expect(state.levelId).toBe('level_05');
            expect(state.difficulty).toBe('medium');
        });
    });

    describe('Roadmap Closure', () => {
        it('should restore level music when roadmap is closed if in a level', () => {
            MusicController.audioEnabled = true;
            MusicController.currentScreen = 'roadmap';
            
            // Mock gameManager currentLevel
            const mockLevel = { id: 'level_03' };
            global.gameManager = { currentLevel: mockLevel, currentVariant: 'medium' };
            
            MusicEngine.play.mockClear();
            
            // This simulate the index.js listener
            if (global.gameManager.currentLevel) {
                MusicController.onScreenChange('level', global.gameManager.currentLevel.id, global.gameManager.currentVariant);
            }
            
            expect(MusicEngine.play).toHaveBeenCalled();
            expect(MusicController.currentScreen).toBe('level');
            expect(MusicController.currentLevelId).toBe('level_03');
            
            delete global.gameManager;
        });
    });
});
