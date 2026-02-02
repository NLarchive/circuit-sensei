/**
 * AsyncPriorityQueue - Manages async task execution with priority levels
 * Higher priority tasks interrupt lower priority ones and run first
 * Useful for ensuring user interactions are processed before background tasks
 */
export class AsyncPriorityQueue {
    constructor() {
        this.tasks = []; // Array of { priority, fn, abortController }
        this.currentTask = null;
        this.isRunning = false;
    }

    /**
     * Add a task with given priority (higher = more important)
     * Priority levels: 
     *   10 = User interaction (roadmap clicks, etc)
     *   5 = Normal gameplay
     *   1 = Background (prefetch, analytics)
     * Returns a Promise that resolves when task completes
     */
    add(fn, priority = 5) {
        return new Promise((resolve, reject) => {
            const abortController = new AbortController();
            const task = {
                priority,
                fn,
                abortController,
                resolve,
                reject
            };

            // Insert task in priority order (higher priority first)
            const insertIndex = this.tasks.findIndex(t => t.priority < priority);
            if (insertIndex === -1) {
                this.tasks.push(task);
            } else {
                this.tasks.splice(insertIndex, 0, task);
            }

            // If a lower priority task is running, abort it
            if (this.currentTask && this.currentTask.priority < priority) {
                console.debug(`[AsyncQueue] Aborting priority ${this.currentTask.priority} task for priority ${priority}`);
                this.currentTask.abortController.abort();
                this.currentTask.reject(new Error('Task cancelled by higher priority task'));
                this.currentTask = null;
            }

            this.process();
        });
    }

    /**
     * Process next task in queue
     */
    async process() {
        // Already processing
        if (this.isRunning) return;

        // No tasks
        if (this.tasks.length === 0) return;

        this.isRunning = true;
        while (this.tasks.length > 0) {
            const task = this.tasks.shift();
            this.currentTask = task;

            try {
                // Pass abort signal to task so it can check for cancellation
                const result = await task.fn(task.abortController.signal);
                task.resolve(result);
            } catch (err) {
                // Don't reject if task was intentionally aborted
                if (err.name !== 'AbortError') {
                    task.reject(err);
                }
            } finally {
                this.currentTask = null;
            }
        }
        this.isRunning = false;
    }

    /**
     * Cancel all pending tasks except current one
     */
    clearPending(maxPriority = Infinity) {
        const cancelled = [];
        const remaining = [];

        for (const task of this.tasks) {
            if (task.priority <= maxPriority) {
                task.abortController.abort();
                task.reject(new Error('Queue cleared'));
                cancelled.push(task.priority);
            } else {
                remaining.push(task);
            }
        }

        this.tasks = remaining;
        return cancelled.length;
    }

    /**
     * Get queue status for debugging
     */
    getStatus() {
        return {
            currentPriority: this.currentTask?.priority || null,
            queueLength: this.tasks.length,
            queuePriorities: this.tasks.map(t => t.priority),
            isRunning: this.isRunning
        };
    }
}

// Export singleton instance
export const asyncQueue = new AsyncPriorityQueue();
