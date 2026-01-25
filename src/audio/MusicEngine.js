/**
 * MusicEngine - Web Audio API procedural music generator
 * 
 * Generates music using synthesized tones, no external files needed.
 * Each level has a unique song defined by scales, patterns, and moods.
 * Difficulty affects tempo: easy=1x, medium=1.15x, hard=1.3x
 */

export class MusicEngine {
    static instance = null;
    static audioContext = null;
    static masterGain = null;
    static isPlaying = false;
    static isMuted = false;
    static currentSong = null;
    static currentTempo = 120;
    static scheduledNotes = [];
    static nextNoteTime = 0;
    static currentBeat = 0;
    static lookahead = 25.0; // ms
    static scheduleAheadTime = 0.1; // seconds
    static timerID = null;
    static volume = 0.3;

    // Musical scales (semitones from root)
    static SCALES = {
        major: [0, 2, 4, 5, 7, 9, 11],
        minor: [0, 2, 3, 5, 7, 8, 10],
        pentatonic: [0, 2, 4, 7, 9],
        blues: [0, 3, 5, 6, 7, 10],
        dorian: [0, 2, 3, 5, 7, 9, 10],
        mixolydian: [0, 2, 4, 5, 7, 9, 10],
        phrygian: [0, 1, 3, 5, 7, 8, 10],
        lydian: [0, 2, 4, 6, 7, 9, 11],
        chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
    };

    // Base frequencies for notes (A4 = 440Hz)
    static NOTE_FREQ = {
        'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61, 'G3': 196.00, 'A3': 220.00, 'B3': 246.94,
        'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
        'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46, 'G5': 783.99, 'A5': 880.00, 'B5': 987.77
    };

    // Tempo multipliers by difficulty
    static TEMPO_MULTIPLIERS = {
        easy: 1.0,
        medium: 1.15,
        hard: 1.3
    };

    /**
     * Load saved preferences (can be called before init)
     */
    static loadPreferences() {
        // Default to muted on every load/refresh to comply with autoplay restrictions.
        this.isMuted = true;
        const savedVolume = localStorage.getItem('music_volume');
        if (savedVolume) this.volume = parseFloat(savedVolume);
    }

    /**
     * Initialize the audio context (must be called after user interaction)
     */
    static init() {
        if (this.audioContext) return;

        try {
            this.loadPreferences();
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            
            this.masterGain.gain.value = this.isMuted ? 0 : this.volume;
            
            console.log('MusicEngine initialized');
        } catch (e) {
            console.warn('Web Audio API not supported:', e);
        }
    }

    /**
     * Resume audio context (required after user gesture)
     */
    static async resume() {
        if (this.audioContext?.state === 'suspended') {
            await this.audioContext.resume();
        }
    }

    /**
     * Convert MIDI note number to frequency
     */
    static midiToFreq(midi) {
        return 440 * Math.pow(2, (midi - 69) / 12);
    }

    /**
     * Get frequency for a scale degree
     */
    static getScaleFreq(rootMidi, scale, degree, octaveOffset = 0) {
        const scaleNotes = this.SCALES[scale] || this.SCALES.major;
        const octave = Math.floor(degree / scaleNotes.length);
        const noteIndex = ((degree % scaleNotes.length) + scaleNotes.length) % scaleNotes.length;
        const midi = rootMidi + scaleNotes[noteIndex] + (octave + octaveOffset) * 12;
        return this.midiToFreq(midi);
    }

    /**
     * Create an oscillator with envelope
     */
    static playNote(freq, startTime, duration, waveform = 'sine', volumeScale = 1.0) {
        if (!this.audioContext || this.isMuted) return;

        const osc = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        osc.type = waveform;
        osc.frequency.value = freq;
        
        osc.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        const attackTime = 0.02;
        const releaseTime = Math.min(0.1, duration * 0.3);
        const sustainLevel = 0.7 * volumeScale;
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(sustainLevel, startTime + attackTime);
        gainNode.gain.setValueAtTime(sustainLevel, startTime + duration - releaseTime);
        gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
        
        osc.start(startTime);
        osc.stop(startTime + duration + 0.01);
        
        return { osc, gainNode };
    }

    /**
     * Play a chord (multiple frequencies)
     */
    static playChord(frequencies, startTime, duration, waveform = 'triangle', volumeScale = 0.5) {
        frequencies.forEach((freq, i) => {
            this.playNote(freq, startTime, duration, waveform, volumeScale / frequencies.length);
        });
    }

    /**
     * Play a drum sound (noise-based)
     */
    static playDrum(type, startTime, volumeScale = 0.3) {
        if (!this.audioContext || this.isMuted) return;

        const noise = this.audioContext.createBufferSource();
        const noiseBuffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * 0.2, this.audioContext.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < output.length; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        noise.buffer = noiseBuffer;

        const filter = this.audioContext.createBiquadFilter();
        const gainNode = this.audioContext.createGain();
        
        if (type === 'kick') {
            filter.type = 'lowpass';
            filter.frequency.value = 150;
            gainNode.gain.setValueAtTime(volumeScale, startTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);
        } else if (type === 'snare') {
            filter.type = 'highpass';
            filter.frequency.value = 1000;
            gainNode.gain.setValueAtTime(volumeScale * 0.5, startTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.1);
        } else if (type === 'hihat') {
            filter.type = 'highpass';
            filter.frequency.value = 5000;
            gainNode.gain.setValueAtTime(volumeScale * 0.2, startTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.05);
        }

        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        noise.start(startTime);
        noise.stop(startTime + 0.2);
    }

    /**
     * Schedule the next set of notes
     */
    static scheduler() {
        if (!this.isPlaying || !this.currentSong) return;

        while (this.nextNoteTime < this.audioContext.currentTime + this.scheduleAheadTime) {
            this.scheduleNote(this.currentBeat, this.nextNoteTime);
            this.advanceBeat();
        }

        this.timerID = setTimeout(() => this.scheduler(), this.lookahead);
    }

    /**
     * Schedule a single beat's worth of notes
     */
    static scheduleNote(beat, time) {
        const song = this.currentSong;
        if (!song) return;

        const patternLength = song.pattern.length;
        const patternBeat = beat % patternLength;
        const patternNote = song.pattern[patternBeat];

        // Melody
        if (patternNote !== null && patternNote !== -1) {
            const freq = this.getScaleFreq(song.rootMidi, song.scale, patternNote, 0);
            const noteDuration = (60 / this.currentTempo) * 0.8;
            this.playNote(freq, time, noteDuration, song.waveform || 'triangle', 0.4);
        }

        // Bass (every 4 beats on root)
        if (beat % 4 === 0 && song.bass !== false) {
            const bassFreq = this.getScaleFreq(song.rootMidi - 12, song.scale, 0, 0);
            const bassDuration = (60 / this.currentTempo) * 2;
            this.playNote(bassFreq, time, bassDuration, 'sine', 0.3);
        }

        // Chords (every 8 beats)
        if (beat % 8 === 0 && song.chords) {
            const chordIndex = Math.floor(beat / 8) % song.chords.length;
            const chordDegrees = song.chords[chordIndex];
            const chordFreqs = chordDegrees.map(d => this.getScaleFreq(song.rootMidi, song.scale, d, -1));
            const chordDuration = (60 / this.currentTempo) * 4;
            this.playChord(chordFreqs, time, chordDuration, 'triangle', 0.2);
        }

        // Drums
        if (song.drums !== false) {
            if (beat % 4 === 0) this.playDrum('kick', time, 0.2);
            if (beat % 4 === 2) this.playDrum('snare', time, 0.15);
            if (beat % 2 === 0) this.playDrum('hihat', time, 0.1);
        }
    }

    /**
     * Advance to the next beat
     */
    static advanceBeat() {
        const secondsPerBeat = 60.0 / this.currentTempo;
        this.nextNoteTime += secondsPerBeat;
        this.currentBeat++;
    }

    /**
     * Play a song
     */
    static play(song, difficulty = 'easy') {
        this.init();
        this.resume();
        
        if (this.isPlaying) {
            this.stop();
        }

        this.currentSong = song;
        const tempoMult = this.TEMPO_MULTIPLIERS[difficulty] || 1.0;
        this.currentTempo = (song.tempo || 120) * tempoMult;
        this.currentBeat = 0;
        this.nextNoteTime = this.audioContext.currentTime;
        this.isPlaying = true;
        
        this.scheduler();
        console.log(`Playing: ${song.name} at ${this.currentTempo} BPM (${difficulty})`);
    }

    /**
     * Stop playback
     */
    static stop() {
        this.isPlaying = false;
        if (this.timerID) {
            clearTimeout(this.timerID);
            this.timerID = null;
        }
        this.currentSong = null;
    }

    /**
     * Toggle mute
     */
    static toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.masterGain) {
            this.masterGain.gain.value = this.isMuted ? 0 : this.volume;
        }
        localStorage.setItem('music_muted', this.isMuted.toString());
        return this.isMuted;
    }

    /**
     * Set volume (0-1)
     */
    static setVolume(vol) {
        this.volume = Math.max(0, Math.min(1, vol));
        if (this.masterGain && !this.isMuted) {
            this.masterGain.gain.value = this.volume;
        }
        localStorage.setItem('music_volume', this.volume.toString());
    }

    /**
     * Get current state
     */
    static getState() {
        return {
            isPlaying: this.isPlaying,
            isMuted: this.isMuted,
            volume: this.volume,
            currentSong: this.currentSong?.name || null,
            tempo: this.currentTempo
        };
    }
}
