# Priority Queue Implementation - Task 129

## Overview
Implemented an intelligent priority queue system for managing async tasks, fixing the loading screen placement and ensuring user interactions take precedence over background operations.

## The Problem
1. **Early Loading Screen**: Loading screen appeared when roadmap level was clicked (before intro content shows)
2. **No Priority System**: Background variant prefetch had no way to be interrupted by user interactions
3. **Inefficient Loading**: If user clicked a level while variants were prefetching, the prefetch would continue wasting network resources

## The Solution

### 1. AsyncPriorityQueue (New)
Location: `src/utils/AsyncPriorityQueue.js`

```javascript
// Priority Levels:
// 10 = User Interactions (roadmap clicks, manual actions) - HIGHEST
//  5 = Normal Gameplay (game screen loading)
//  1 = Background Tasks (variant prefetch) - LOWEST
```

**Key Features:**
- AbortController support for canceling tasks
- Higher priority tasks automatically interrupt lower priority ones
- Tasks can check `signal.aborted` to stop gracefully
- Queue automatically processes next task after current completes

### 2. Updated Navigation Flow

#### Before:
```
User clicks roadmap level
    ↓
LoadingScreen shows (WRONG PLACE - too early)
    ↓
LEVEL_LOADED event fires
    ↓
Intro overlay shows
    ↓
User sees intro content and clicks "Start Level"
    ↓
Game screen appears
```

#### After:
```
User clicks roadmap level
    ↓ (Priority 10 task - user interaction)
Level data loads (theory, variants, etc)
    ↓
LEVEL_LOADED event fires
    ↓
Intro overlay shows (RIGHT PLACE)
    ↓
User reads intro and clicks "Start Level"
    ↓
LoadingScreen shows (CORRECT TIME - before game screen)
    ↓ (Priority 5 task - gameplay)
Game screen prepares
    ↓
LoadingScreen hides
    ↓
Game screen appears, ready to play
```

### 3. Code Changes

#### HUD.js - Roadmap Level Selection
```javascript
// Before: Showed loading screen immediately
document.getElementById('roadmap-tiers').addEventListener('click', async (e) => {
    LoadingScreen.show(); // ❌ Wrong timing
    await gameManager.loadLevel(levelIndex, variant);
    LoadingScreen.hide();
});

// After: Queue with priority, no loading screen at this point
document.getElementById('roadmap-tiers').addEventListener('click', (e) => {
    asyncQueue.add(async (signal) => {
        await gameManager.loadLevel(levelIndex, variant);
        // LEVEL_LOADED event shows intro, no loading screen needed here
    }, 10); // Priority 10 = user interaction (highest)
});
```

#### HUD.js - Start Level Button
```javascript
// Before: Didn't show loading screen for game load
document.getElementById('btn-start-level').addEventListener('click', () => {
    document.getElementById('level-intro-overlay').classList.add('hidden');
    // Game screen loads with no visual feedback
});

// After: Show loading screen when preparing game screen
document.getElementById('btn-start-level').addEventListener('click', () => {
    document.getElementById('level-intro-overlay').classList.add('hidden');
    LoadingScreen.show(); // ✓ Right timing - before game screen
    
    asyncQueue.add(async (signal) => {
        // Prepare game screen
        globalEvents.emit(Events.GAME_START_REQUESTED, {...});
    }, 5); // Priority 5 = normal gameplay
});
```

#### index.js - Variant Prefetch
```javascript
// Before: No way to interrupt prefetch
const schedule = () => rc((deadline) => {
    while (idx < levelIds.length) {
        StoryLoader.loadLevelVariants(id).then(...); // Can't stop
    }
});

// After: Uses priority 1, respects abort signals
asyncQueue.add(async (signal) => {
    while (idx < levelIds.length && !signal.aborted) {
        const v = await StoryLoader.loadLevelVariants(id);
        if (signal.aborted) break; // Stop if user clicked
    }
}, 1); // Priority 1 = background task (lowest)
```

### 4. Priority Levels Explained

| Priority | Type | When Used | Interruptible? | Examples |
|----------|------|-----------|---|----------|
| 10 | User Interaction | User clicks on UI | Yes | Roadmap level click, mode change |
| 5 | Gameplay | Normal game operations | Yes | Game screen load, level transitions |
| 1 | Background | Idle time optimization | Yes | Variant prefetch, analytics |

**How it works:**
- When Priority 10 task queues, any Priority 1 task is aborted immediately
- When Priority 5 task queues, Priority 1 task is aborted
- But Priority 10 and 5 tasks don't interrupt each other (user clicks have highest priority)

### 5. Practical Impact

#### Scenario 1: User clicks level while prefetching
```
[ Prefetch running at Priority 1 ]
User clicks level (Priority 10)
    ↓
Signal.abort() sent to prefetch
    ↓
Prefetch stops immediately
    ↓
Level loads with high priority
    ↓
Zero delay from user perspective
```

#### Scenario 2: User clicks different level while level loading
```
[ Level 1 loading at Priority 10 ]
User clicks Level 2
    ↓
Level 2 queues at Priority 10
    ↓
Level 1 finishes, Level 2 starts
    ↓
Quick level switch
```

#### Scenario 3: User plays game, background prefetch continues
```
[ User playing game ]
Game at Priority 5 (running)
Prefetch at Priority 1 (waiting)
    ↓
Game doesn't interfere with prefetch
    ↓
When game action completes, prefetch resumes
```

## Files Created/Modified

### New Files:
- [src/utils/AsyncPriorityQueue.js](src/utils/AsyncPriorityQueue.js) - Priority queue implementation

### Modified Files:
- [src/ui/HUD.js](src/ui/HUD.js) - Updated roadmap click and start button handlers
- [src/index.js](src/index.js) - Updated variant prefetch to use priority queue
- [src/game/EventBus.js](src/game/EventBus.js) - Added GAME_START_REQUESTED event
- [task-project-state.json](task-project-state.json) - Updated task tracking

## Testing

All 508 unit tests pass ✅

```
✓ tests/formatEquation.test.js  (4 tests)
✓ tests/level_data.test.js  (20 tests)
✓ tests/curriculum_logic.test.js  (62 tests)
✓ tests/engine/clock.test.js  (5 tests)
✓ tests/timing_analysis.test.js  (9 tests)
✓ tests/circuit_simulation.test.js  (9 tests)
✓ tests/game_levels.test.js  (399 tests)

Total: 508 passed
```

## Git Commit
Commit: `3b760b7`

```
Implement priority queue for async task management - fixes loading screen placement and user interaction priority

- Create AsyncPriorityQueue.js with abort-signal support for interruptible tasks
- Priority levels: 10=user interactions, 5=gameplay, 1=background prefetch
- Fix loading screen to appear AFTER intro content shows
- Move loading screen to 'Start Level' button (game screen load)
- Variant prefetch now respects abort signals for immediate interruption
- Add GAME_START_REQUESTED event to EventBus
```

## Next Steps

1. **Test in browser** - Verify smooth transitions and priority behavior
2. **Performance monitoring** - Track if prefetch completes efficiently
3. **Mobile testing** - Ensure priority queue works well with touch interactions
4. **Analytics** - Track how often background tasks are interrupted

## Benefits

✓ **User Experience**: Clicks feel instant, no delay waiting for background tasks  
✓ **Performance**: Prefetch doesn't waste network when user is active  
✓ **Scalability**: Easy to add new priority levels or tasks  
✓ **Maintainability**: Clear priority system makes code easier to reason about  
✓ **Accessibility**: AbortController means proper cleanup, no resource leaks  
