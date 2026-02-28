/**
 * CertificationEngine — Pure certification calculation logic
 *
 * Stateless: receives a dataProvider interface and config,
 * returns a certification object. Easy to plug into any project.
 *
 * dataProvider must expose:
 *   - getPlayableLevels()                → Level[]
 *   - getVariantsForLevel(levelId)       → { easy?, medium?, hard?, expert? }
 *   - getCompletedLevels()               → { levelId: { easy: bool, ... } }
 *   - getUsedHints()                     → { levelId: { easy: bool, ... } }
 *   - getPlayerXP()                      → number
 *   - getPreviousCertification()         → object | null
 */

import defaultConfig from './config/default.js';

export class CertificationEngine {
    constructor(config = defaultConfig) {
        this.config = config;
    }

    /* ════════════════ helpers ════════════════ */

    _getPlayableLevels(dp) {
        return dp.getPlayableLevels();
    }

    _getTotalStarsCount(dp) {
        const levels = this._getPlayableLevels(dp);
        return levels.reduce((total, level) => {
            const variants = dp.getVariantsForLevel(level.id) || {};
            const starVariants = ['easy', 'medium', 'hard', 'expert'].filter(v => variants[v]);
            return total + (starVariants.length > 0 ? starVariants.length : 1);
        }, 0);
    }

    _getEarnedStarsCount(dp) {
        const levels = this._getPlayableLevels(dp);
        const completedLevels = dp.getCompletedLevels();
        return levels.reduce((total, level) => {
            const completed = completedLevels[level.id] || {};
            const variants = dp.getVariantsForLevel(level.id) || {};
            const starVariants = ['easy', 'medium', 'hard', 'expert'].filter(v => variants[v]);
            if (starVariants.length > 0) {
                return total + starVariants.reduce((s, v) => s + (completed[v] ? 1 : 0), 0);
            }
            return total + ((completed.easy || completed.original || completed.medium || completed.hard || completed.expert) ? 1 : 0);
        }, 0);
    }

    _areAllLevelsCompletedForVariant(dp, targetVariant) {
        const levels = this._getPlayableLevels(dp);
        if (levels.length === 0) return false;
        const completedLevels = dp.getCompletedLevels();

        return levels.every(level => {
            const completed = completedLevels[level.id] || {};
            const variants = dp.getVariantsForLevel(level.id) || {};
            if (targetVariant === 'easy') {
                const easyAvailable = !!variants.easy || Object.keys(variants).length === 0;
                if (!easyAvailable) return true;
                return !!(completed.easy || completed.original);
            }
            if (!variants[targetVariant]) return true;
            return !!completed[targetVariant];
        });
    }

    _areAllAvailableVariantsCompleted(dp) {
        const levels = this._getPlayableLevels(dp);
        if (levels.length === 0) return false;
        const completedLevels = dp.getCompletedLevels();

        return levels.every(level => {
            const completed = completedLevels[level.id] || {};
            const variants = dp.getVariantsForLevel(level.id) || {};
            const variantKeys = Object.keys(variants).filter(v => ['easy', 'medium', 'hard', 'expert'].includes(v));
            if (variantKeys.length === 0) {
                return !!(completed.easy || completed.original || completed.medium || completed.hard || completed.expert);
            }
            return variantKeys.every(v => !!completed[v]);
        });
    }

    _isVariantCompletedHintless(dp, targetVariant) {
        const levels = this._getPlayableLevels(dp);
        if (levels.length === 0) return false;
        const completedLevels = dp.getCompletedLevels();
        const usedHints = dp.getUsedHints();

        return levels.every(level => {
            const completed = completedLevels[level.id] || {};
            const hints = usedHints[level.id] || {};
            const variants = dp.getVariantsForLevel(level.id) || {};

            if (targetVariant === 'easy') {
                const easyAvailable = !!variants.easy || Object.keys(variants).length === 0;
                if (!easyAvailable) return true;
                if (!(completed.easy || completed.original)) return false;
                return !(hints.easy || hints.original);
            }
            if (!variants[targetVariant]) return true;
            if (!completed[targetVariant]) return false;
            return !hints[targetVariant];
        });
    }

    _getUsedHintsCount(dp) {
        const usedHints = dp.getUsedHints();
        return Object.values(usedHints).reduce((total, variants) => {
            if (!variants || typeof variants !== 'object') return total;
            return total + Object.values(variants).filter(Boolean).length;
        }, 0);
    }

    _getTotalHintsCount(dp) {
        const levels = this._getPlayableLevels(dp);
        return levels.reduce((total, level) => {
            if (!level || level.isIndex) return total;
            const variants = dp.getVariantsForLevel(level.id) || {};
            const variantCount = Object.keys(variants).length;
            return total + (variantCount > 0 ? variantCount : 1);
        }, 0);
    }

    _getHintsUsedPerTier(dp) {
        const result = { easy: 0, medium: 0, hard: 0, expert: 0 };
        const usedHints = dp.getUsedHints();
        Object.entries(usedHints).forEach(([, variants]) => {
            if (!variants || typeof variants !== 'object') return;
            for (const [variant, used] of Object.entries(variants)) {
                if (used && result[variant] !== undefined) result[variant]++;
            }
        });
        return result;
    }

    _getTotalAvailableXP(dp) {
        const levels = this._getPlayableLevels(dp);
        return levels.reduce((total, level) => {
            const variants = dp.getVariantsForLevel(level.id) || {};
            const variantValues = Object.entries(variants).filter(([key]) => ['easy', 'medium', 'hard', 'expert'].includes(key));
            if (variantValues.length > 0) {
                return total + variantValues.reduce((sum, [, vd]) => sum + (vd?.xpReward || 0), 0);
            }
            return total + (level.xpReward || 0);
        }, 0);
    }

    /* ════════════════ main calculation ════════════════ */

    calculate(dataProvider) {
        const dp = dataProvider;
        const cfg = this.config;
        const honors = cfg.honorLabels;
        const scoring = cfg.scoring;

        const allEasyComplete = this._areAllLevelsCompletedForVariant(dp, 'easy');
        const allMediumComplete = this._areAllLevelsCompletedForVariant(dp, 'medium');
        const allHardComplete = this._areAllLevelsCompletedForVariant(dp, 'hard');
        const allExpertComplete = this._areAllLevelsCompletedForVariant(dp, 'expert');
        const allVariantsComplete = this._areAllAvailableVariantsCompleted(dp);

        const easyHintless = allEasyComplete && this._isVariantCompletedHintless(dp, 'easy');
        const mediumHintless = allMediumComplete && this._isVariantCompletedHintless(dp, 'medium');
        const hardHintless = allHardComplete && this._isVariantCompletedHintless(dp, 'hard');
        const expertHintless = allExpertComplete && this._isVariantCompletedHintless(dp, 'expert');
        const allHintless = allVariantsComplete && easyHintless && mediumHintless && hardHintless && expertHintless;

        const hintsUsed = this._getUsedHintsCount(dp);
        const hintsTotal = this._getTotalHintsCount(dp);
        const hintsPerTier = this._getHintsUsedPerTier(dp);
        const earnedStars = this._getEarnedStarsCount(dp);
        const totalStars = this._getTotalStarsCount(dp);
        const availableXP = this._getTotalAvailableXP(dp);
        const playerXP = dp.getPlayerXP();

        const xpRatio = availableXP > 0 ? Math.min(1, playerXP / availableXP) : 0;
        const starsRatio = totalStars > 0 ? Math.min(1, earnedStars / totalStars) : 0;
        const hintEfficiency = hintsTotal > 0 ? Math.max(0, 1 - (hintsUsed / hintsTotal)) : 1;
        const score = Math.round(((xpRatio * scoring.xpWeight) + (starsRatio * scoring.starsWeight) + (hintEfficiency * scoring.hintWeight)) * 100);

        // Build titles
        const titles = [];
        if (allMediumComplete) titles.push(honors.intermediateSolver);
        if (allHardComplete) titles.push(honors.advancedEngineer);
        if (allExpertComplete) titles.push(honors.expertArchitect);
        if (allVariantsComplete) titles.push(honors.fullCurriculum);

        if (easyHintless && !mediumHintless && !hardHintless) titles.push(honors.foundationHintless);
        if (mediumHintless && !hardHintless) titles.push(honors.intermediateHintless);
        if (hardHintless) titles.push(honors.advancedHintless);
        if (expertHintless) titles.push(honors.expertHintless);
        if (allHintless) titles.push(honors.summaCumLaude);

        const hintTitleThreshold = Math.max(3, Math.ceil(hintsTotal * 0.3));
        if (hintsUsed >= hintTitleThreshold && hintsUsed > 0) titles.push(honors.guidedPath);

        if (score >= 98) titles.push(honors.highestDistinction);
        else if (score >= 95) titles.push(honors.withDistinction);
        else if (score >= 85) titles.push(honors.withMerit);
        else if (score >= 70) titles.push(honors.withHonors);

        const certificationTier = allExpertComplete ? 'expert'
            : allHardComplete ? 'advanced'
            : allMediumComplete ? 'intermediate'
            : allEasyComplete ? 'simple'
            : 'in-progress';

        const tierCfg = cfg.tiers[certificationTier];

        const nowIso = new Date().toISOString();
        const prev = dp.getPreviousCertification();
        const previousIssuedAt = prev?.issuedAt || null;

        return {
            hasBaseCertification: allEasyComplete,
            baseCertification: cfg.certificate.baseName,
            certificationTier,
            certificationLabel: tierCfg.label,
            tierDescription: tierCfg.description,
            topicsCovered: tierCfg.topicsCovered,
            score,
            metrics: {
                xp: playerXP,
                availableXP,
                earnedStars,
                totalStars,
                hintsUsed,
                hintsTotal,
                hintsPerTier,
            },
            hintless: { easy: easyHintless, medium: mediumHintless, hard: hardHintless, expert: expertHintless, all: allHintless },
            titles,
            skills: cfg.skills,
            requirements: {
                allEasyComplete, allMediumComplete, allHardComplete, allExpertComplete, allVariantsComplete,
                easyHintless, mediumHintless, hardHintless, expertHintless, allHintless,
            },
            issuedAt: allEasyComplete ? (previousIssuedAt || nowIso) : null,
            updatedAt: nowIso,
        };
    }
}

export default CertificationEngine;
