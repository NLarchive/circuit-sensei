/**
 * LevelSongs - Song definitions for each level
 * 
 * Each song has:
 * - name: Display name
 * - tempo: Base BPM (modified by difficulty)
 * - rootMidi: Root note MIDI number (60 = C4)
 * - scale: Musical scale name
 * - pattern: Melody pattern (scale degrees, null = rest)
 * - chords: Chord progression (arrays of scale degrees)
 * - waveform: Oscillator type (sine, triangle, square, sawtooth)
 * - drums: Whether to include drums
 * - bass: Whether to include bass
 */

export const LEVEL_SONGS = {
    // Roadmap/Homepage - Calm, inviting, ambient
    roadmap: {
        name: 'The Journey Begins',
        tempo: 70,
        rootMidi: 60, // C4
        scale: 'pentatonic',
        pattern: [0, 2, 4, null, 2, 4, 7, null, 4, 2, 0, null, 2, 0, -2, null],
        chords: [[0, 2, 4], [2, 4, 7], [0, 2, 4], [-2, 0, 2]],
        waveform: 'sine',
        drums: false,
        bass: true
    },

    // Level 00 - Course Overview - Inspiring, educational
    level_00: {
        name: 'Digital Dawn',
        tempo: 80,
        rootMidi: 62, // D4
        scale: 'major',
        pattern: [0, 2, 4, 2, 0, null, 4, 5, 7, 5, 4, null, 2, 4, 2, 0],
        chords: [[0, 2, 4], [4, 6, 8], [2, 4, 6], [0, 2, 4]],
        waveform: 'triangle',
        drums: false,
        bass: true
    },

    // Level 01 - Wire - Simple, flowing, electric
    level_01: {
        name: 'Current Flow',
        tempo: 90,
        rootMidi: 60, // C4
        scale: 'pentatonic',
        pattern: [0, null, 2, null, 4, null, 2, null, 0, null, 2, null, 4, 7, 4, 2],
        chords: [[0, 2, 4], [0, 2, 4], [2, 4, 7], [0, 2, 4]],
        waveform: 'sine',
        drums: true,
        bass: true
    },

    // Level 02 - Transistor - Switching, rhythmic
    level_02: {
        name: 'Silicon Switch',
        tempo: 100,
        rootMidi: 64, // E4
        scale: 'minor',
        pattern: [0, 2, 3, null, 0, 2, 5, null, 3, 2, 0, null, -2, 0, 2, 3],
        chords: [[0, 2, 4], [3, 5, 7], [0, 2, 4], [-2, 0, 2]],
        waveform: 'triangle',
        drums: true,
        bass: true
    },

    // Level 03 - NOT Gate - Inverted, playful
    level_03: {
        name: 'Flip Side',
        tempo: 105,
        rootMidi: 65, // F4
        scale: 'dorian',
        pattern: [0, 3, 5, 3, 0, null, 5, 7, 5, 3, null, null, 7, 5, 3, 0],
        chords: [[0, 2, 4], [5, 7, 9], [3, 5, 7], [0, 2, 4]],
        waveform: 'triangle',
        drums: true,
        bass: true
    },

    // Level 04 - AND Gate - Determined, building
    level_04: {
        name: 'Both Must Pass',
        tempo: 110,
        rootMidi: 67, // G4
        scale: 'major',
        pattern: [0, 0, 2, 4, 4, 4, 2, 0, 5, 5, 4, 2, 2, 2, 0, null],
        chords: [[0, 2, 4], [2, 4, 6], [4, 6, 8], [0, 2, 4]],
        waveform: 'triangle',
        drums: true,
        bass: true
    },

    // Level 05 - OR Gate - Open, flowing
    level_05: {
        name: 'Any Path Works',
        tempo: 108,
        rootMidi: 69, // A4
        scale: 'mixolydian',
        pattern: [0, 2, 4, 7, 4, 2, 0, null, 2, 4, 5, 4, 2, 0, -2, null],
        chords: [[0, 2, 4], [4, 6, 8], [-1, 1, 3], [0, 2, 4]],
        waveform: 'sine',
        drums: true,
        bass: true
    },

    // Level 06 - NAND - Universal, powerful
    level_06: {
        name: 'Universal Builder',
        tempo: 115,
        rootMidi: 60, // C4
        scale: 'lydian',
        pattern: [0, 2, 4, 6, 4, 2, 0, null, 4, 6, 7, 6, 4, 2, 0, null],
        chords: [[0, 2, 4], [2, 4, 6], [4, 6, 8], [0, 2, 4]],
        waveform: 'triangle',
        drums: true,
        bass: true
    },

    // Level 07 - NOR - Dark twin, mysterious
    level_07: {
        name: 'Neither Nor',
        tempo: 112,
        rootMidi: 62, // D4
        scale: 'phrygian',
        pattern: [0, 1, 3, 5, 3, 1, 0, null, 3, 5, 7, 5, 3, 1, 0, null],
        chords: [[0, 2, 4], [1, 3, 5], [3, 5, 7], [0, 2, 4]],
        waveform: 'triangle',
        drums: true,
        bass: true
    },

    // Level 08 - XOR - Exclusive, different
    level_08: {
        name: 'One or Other',
        tempo: 118,
        rootMidi: 64, // E4
        scale: 'dorian',
        pattern: [0, 3, 5, null, 7, 5, 3, null, 0, 3, 7, null, 5, 3, 0, null],
        chords: [[0, 2, 4], [3, 5, 7], [5, 7, 9], [0, 2, 4]],
        waveform: 'square',
        drums: true,
        bass: true
    },

    // Level 09 - De Morgan - Lawful, transformative
    level_09: {
        name: "Morgan's Transform",
        tempo: 120,
        rootMidi: 65, // F4
        scale: 'minor',
        pattern: [0, 2, 3, 5, 7, 5, 3, 2, 0, null, 3, 5, 7, 8, 7, 5],
        chords: [[0, 2, 4], [3, 5, 7], [5, 7, 9], [0, 2, 4]],
        waveform: 'triangle',
        drums: true,
        bass: true
    },

    // Level 10 - MUX - Selecting, decisive
    level_10: {
        name: 'Signal Selector',
        tempo: 122,
        rootMidi: 67, // G4
        scale: 'major',
        pattern: [0, null, 4, null, 7, null, 4, null, 2, null, 5, null, 4, 2, 0, null],
        chords: [[0, 2, 4], [4, 6, 8], [2, 4, 6], [0, 2, 4]],
        waveform: 'triangle',
        drums: true,
        bass: true
    },

    // Level 11 - Decoder - Expanding, revealing
    level_11: {
        name: 'Address Decode',
        tempo: 125,
        rootMidi: 69, // A4
        scale: 'pentatonic',
        pattern: [0, 2, 4, 7, 9, 7, 4, 2, 0, 2, 4, 7, 4, 2, 0, null],
        chords: [[0, 2, 4], [2, 4, 7], [4, 7, 9], [0, 2, 4]],
        waveform: 'triangle',
        drums: true,
        bass: true
    },

    // Level 12 - Half Adder - Mathematical, precise
    level_12: {
        name: 'First Addition',
        tempo: 128,
        rootMidi: 60, // C4
        scale: 'major',
        pattern: [0, 2, 4, 5, 7, 5, 4, 2, 4, 5, 7, 9, 7, 5, 4, 2],
        chords: [[0, 2, 4], [2, 4, 6], [4, 6, 8], [5, 7, 9]],
        waveform: 'triangle',
        drums: true,
        bass: true
    },

    // Level 13 - Full Adder - Complete, cascading
    level_13: {
        name: 'Carry the One',
        tempo: 130,
        rootMidi: 62, // D4
        scale: 'lydian',
        pattern: [0, 2, 4, 6, 7, 6, 4, 2, 0, 2, 4, 6, 4, 2, 0, null],
        chords: [[0, 2, 4], [4, 6, 8], [2, 4, 6], [0, 2, 4]],
        waveform: 'triangle',
        drums: true,
        bass: true
    },

    // Level 14 - SR Latch - Memory, holding
    level_14: {
        name: 'Remember This',
        tempo: 95,
        rootMidi: 64, // E4
        scale: 'minor',
        pattern: [0, null, 3, null, 5, null, 3, null, 0, null, -2, null, 0, 3, 5, 3],
        chords: [[0, 2, 4], [3, 5, 7], [0, 2, 4], [-2, 0, 2]],
        waveform: 'sine',
        drums: true,
        bass: true
    },

    // Level 15 - D Flip-Flop - Synchronized, clockwork
    level_15: {
        name: 'Clock Edge',
        tempo: 132,
        rootMidi: 65, // F4
        scale: 'major',
        pattern: [0, null, 2, null, 4, null, 5, null, 7, null, 5, null, 4, 2, 0, null],
        chords: [[0, 2, 4], [2, 4, 6], [4, 6, 8], [0, 2, 4]],
        waveform: 'triangle',
        drums: true,
        bass: true
    },

    // Level 16 - Toggle FF - Alternating, rhythmic
    level_16: {
        name: 'Flip and Toggle',
        tempo: 135,
        rootMidi: 67, // G4
        scale: 'dorian',
        pattern: [0, 3, 0, 3, 5, 3, 5, 7, 5, 7, 5, 3, 0, 3, 0, null],
        chords: [[0, 2, 4], [3, 5, 7], [5, 7, 9], [0, 2, 4]],
        waveform: 'square',
        drums: true,
        bass: true
    },

    // Level 17 - Counter - Counting, progressive
    level_17: {
        name: 'Count Up',
        tempo: 138,
        rootMidi: 69, // A4
        scale: 'major',
        pattern: [0, 2, 4, 5, 7, 9, 11, 12, 11, 9, 7, 5, 4, 2, 0, null],
        chords: [[0, 2, 4], [4, 6, 8], [7, 9, 11], [0, 2, 4]],
        waveform: 'triangle',
        drums: true,
        bass: true
    },

    // Level 18 - FSM/Traffic Light - State changes, cycling
    level_18: {
        name: 'State Machine',
        tempo: 140,
        rootMidi: 60, // C4
        scale: 'mixolydian',
        pattern: [0, 2, 4, null, 4, 5, 7, null, 7, 5, 4, null, 4, 2, 0, null],
        chords: [[0, 2, 4], [4, 6, 8], [5, 7, 9], [0, 2, 4]],
        waveform: 'triangle',
        drums: true,
        bass: true
    },

    // Level 19 - ALU - Complex, computational
    level_19: {
        name: 'Arithmetic Core',
        tempo: 145,
        rootMidi: 62, // D4
        scale: 'lydian',
        pattern: [0, 2, 4, 6, 4, 2, 6, 4, 7, 6, 4, 2, 4, 6, 4, 2],
        chords: [[0, 2, 4], [2, 4, 6], [4, 6, 8], [6, 8, 10]],
        waveform: 'triangle',
        drums: true,
        bass: true
    },

    // Level Boss - CPU - Epic, triumphant
    level_boss: {
        name: 'Central Processing',
        tempo: 150,
        rootMidi: 60, // C4
        scale: 'major',
        pattern: [0, 4, 7, 12, 7, 4, 0, null, 2, 5, 9, 12, 9, 5, 2, null],
        chords: [[0, 4, 7], [2, 5, 9], [4, 7, 11], [0, 4, 7]],
        waveform: 'sawtooth',
        drums: true,
        bass: true
    }
};

/**
 * Get song for a level
 */
export function getSongForLevel(levelId) {
    return LEVEL_SONGS[levelId] || LEVEL_SONGS.roadmap;
}

/**
 * Get all song names (for testing/debugging)
 */
export function getAllSongNames() {
    return Object.entries(LEVEL_SONGS).map(([id, song]) => ({
        id,
        name: song.name,
        tempo: song.tempo
    }));
}
