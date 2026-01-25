import { globalEvents, Events } from '../EventBus.js';

export class AchievementSystem {
    constructor(gameManager) {
        this.gameManager = gameManager;
        this.achievements = [
            { id: 'first_gate', name: 'Hello Logic', description: 'Place your first gate', condition: (state) => state.gatesPlaced >= 1 },
            { id: 'pro_wirer', name: 'Wire Master', description: 'Connect 50 wires in one session', condition: (state) => state.wiresConnected >= 50 },
            { id: 'tier_1_complete', name: 'Silicon Apprentice', description: 'Complete all Tier 1 levels', condition: (state) => state.completedLevels['level_05']?.easy },
            { id: 'tier_2_complete', name: 'Logic Adept', description: 'Complete all Tier 2 levels', condition: (state) => state.completedLevels['level_09']?.easy },
            { id: 'tier_3_complete', name: 'Arithmetic Architect', description: 'Complete all Tier 3 levels', condition: (state) => state.completedLevels['level_13']?.easy },
            { id: 'sequential_sage', name: 'Sequential Sage', description: 'Master memory and clocks (Tier 4 complete)', condition: (state) => state.completedLevels['level_16']?.easy },
            { id: 'system_designer', name: 'System Designer', description: 'Complete Tier 5', condition: (state) => state.completedLevels['level_18']?.easy },
            { id: 'cpu_architect', name: 'CPU Architect', description: 'Build a working CPU datapath', condition: (state) => state.completedLevels['level_boss']?.easy },
            { id: 'xp_1000', name: 'Logic Grandmaster', description: 'Earn 1,000 XP', condition: (state) => state.xp >= 1000 }
        ];
        this.setupListeners();
    }

    setupListeners() {
        globalEvents.on(Events.GATE_PLACED, () => this.checkAchievements());
        globalEvents.on(Events.LEVEL_COMPLETE, () => this.checkAchievements());
    }

    checkAchievements() {
        if (!this.gameManager || !this.gameManager.progress) return;

        const stats = {
            xp: this.gameManager.progress.xp || 0,
            completedLevels: this.gameManager.progress.completedLevels || [],
            unlockedTiers: this.gameManager.progress.unlockedTiers || [],
            achievements: this.gameManager.progress.achievements || [],
            gatesPlaced: this.gameManager.sessionStats?.gatesPlaced || 0,
            wiresConnected: this.gameManager.sessionStats?.wiresConnected || 0
        };

        this.achievements.forEach(achievement => {
            // Skip if already unlocked
            if (stats.achievements.includes(achievement.id)) return;

            // Check condition
            try {
                if (achievement.condition(stats)) {
                    this.unlockAchievement(achievement);
                }
            } catch (err) {
                console.error(`Error checking achievement ${achievement.id}:`, err);
            }
        });
    }

    unlockAchievement(achievement) {
        if (!this.gameManager.progress.achievements) {
            this.gameManager.progress.achievements = [];
        }
        
        this.gameManager.progress.achievements.push(achievement.id);
        this.gameManager.saveProgress();

        globalEvents.emit(Events.ACHIEVEMENT_UNLOCKED, {
            achievement: achievement
        });

        console.log(`Achievement Unlocked: ${achievement.name} - ${achievement.description}`);
    }
}
