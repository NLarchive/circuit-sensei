/**
 * MusicController - Manages music playback across game screens
 * 
 * Handles:
 * - Playing appropriate song for current screen/level
 * - Changing tempo based on difficulty
 * - UI music toggle button
 */

import { MusicEngine } from './MusicEngine.js';
import { LEVEL_SONGS, getSongForLevel } from './LevelSongs.js';

export class MusicController {
    static currentScreen = 'roadmap';
    static currentLevelId = null;
    static currentDifficulty = 'easy';
    static musicButton = null;
    static isInitialized = false;

    /**
     * Initialize music controller and create UI button
     */
    static init() {
        if (this.isInitialized) return;

        // Create the music toggle button
        this.createMusicButton();
        
        // Listen for first user interaction to enable audio
        this.setupFirstInteraction();
        
        this.isInitialized = true;
        console.log('MusicController initialized');
    }

    /**
     * Create the music toggle button
     */
    static createMusicButton() {
        // Check if button already exists
        if (document.getElementById('music-toggle-btn')) {
            this.musicButton = document.getElementById('music-toggle-btn');
            return;
        }

        // Create button
        const btn = document.createElement('button');
        btn.id = 'music-toggle-btn';
        btn.className = 'music-toggle-btn';
        btn.setAttribute('aria-label', 'Toggle music');
        btn.setAttribute('title', 'Toggle music');
        btn.innerHTML = this.getMusicIcon(MusicEngine.isMuted);
        
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggleMusic();
        });

        // Add to navbar or create floating button
        const navbar = document.querySelector('.navbar-right') || document.querySelector('.navbar');
        if (navbar) {
            navbar.appendChild(btn);
        } else {
            // Create floating button if no navbar
            btn.classList.add('music-toggle-floating');
            document.body.appendChild(btn);
        }

        this.musicButton = btn;
    }

    /**
     * Setup first interaction listener to enable audio
     */
    static setupFirstInteraction() {
        const enableAudio = () => {
            MusicEngine.init();
            MusicEngine.resume();
            
            // Start playing if on a screen
            if (this.currentScreen === 'roadmap') {
                this.playRoadmapMusic();
            } else if (this.currentLevelId) {
                this.playLevelMusic(this.currentLevelId, this.currentDifficulty);
            }

            // Remove listeners after first interaction
            document.removeEventListener('click', enableAudio);
            document.removeEventListener('keydown', enableAudio);
            document.removeEventListener('touchstart', enableAudio);
        };

        document.addEventListener('click', enableAudio, { once: true });
        document.addEventListener('keydown', enableAudio, { once: true });
        document.addEventListener('touchstart', enableAudio, { once: true });
    }

    /**
     * Get music icon based on state
     */
    static getMusicIcon(isMuted) {
        if (isMuted) {
            // Muted icon (note with line through)
            return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="5.5" cy="17.5" r="2.5"/>
                <circle cx="17.5" cy="15.5" r="2.5"/>
                <path d="M8 17V5l12-2v12"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
            </svg>`;
        } else {
            // Playing icon (music note)
            return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="5.5" cy="17.5" r="2.5"/>
                <circle cx="17.5" cy="15.5" r="2.5"/>
                <path d="M8 17V5l12-2v12"/>
            </svg>`;
        }
    }

    /**
     * Toggle music on/off
     */
    static toggleMusic() {
        const isMuted = MusicEngine.toggleMute();
        
        if (this.musicButton) {
            this.musicButton.innerHTML = this.getMusicIcon(isMuted);
            this.musicButton.classList.toggle('muted', isMuted);
        }

        console.log(`Music ${isMuted ? 'muted' : 'unmuted'}`);
    }

    /**
     * Play roadmap/homepage music
     */
    static playRoadmapMusic() {
        this.currentScreen = 'roadmap';
        this.currentLevelId = null;
        
        const song = LEVEL_SONGS.roadmap;
        MusicEngine.play(song, 'easy'); // Roadmap always plays at base tempo
    }

    /**
     * Play music for a specific level
     */
    static playLevelMusic(levelId, difficulty = 'easy') {
        this.currentScreen = 'level';
        this.currentLevelId = levelId;
        this.currentDifficulty = difficulty;

        const song = getSongForLevel(levelId);
        MusicEngine.play(song, difficulty);
    }

    /**
     * Change difficulty (updates tempo of current song)
     */
    static changeDifficulty(difficulty) {
        this.currentDifficulty = difficulty;
        
        if (this.currentScreen === 'level' && this.currentLevelId) {
            this.playLevelMusic(this.currentLevelId, difficulty);
        }
    }

    /**
     * Handle screen transition
     */
    static onScreenChange(screen, levelId = null, difficulty = null) {
        if (screen === 'roadmap') {
            this.playRoadmapMusic();
        } else if (screen === 'level' && levelId) {
            this.playLevelMusic(levelId, difficulty || this.currentDifficulty);
        }
    }

    /**
     * Stop music
     */
    static stop() {
        MusicEngine.stop();
    }

    /**
     * Get current state
     */
    static getState() {
        return {
            screen: this.currentScreen,
            levelId: this.currentLevelId,
            difficulty: this.currentDifficulty,
            ...MusicEngine.getState()
        };
    }
}
