export const MathUtils = {
    clamp: (val, min, max) => Math.max(min, Math.min(max, val)),
    lerp: (a, b, t) => a + (b - a) * t,
    dist: (x1, y1, x2, y2) => Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2),
    
    // Grid snapping
    snapToGrid: (val, gridSize = 20) => Math.round(val / gridSize) * gridSize,
    
    // Random generators for endless mode
    randomInt: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
    randomChoice: (arr) => arr[Math.floor(Math.random() * arr.length)]
};
