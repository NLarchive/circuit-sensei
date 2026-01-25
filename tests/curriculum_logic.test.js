import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("Curriculum Validation", () => {
  // Load tiers from story folder
  const tiersPath = path.resolve(__dirname, "../story/tiers.json");
  const tiers = JSON.parse(fs.readFileSync(tiersPath, "utf-8"));

  // Load all levels from manifest (excluding index level_00)
  const manifestPath = path.resolve(__dirname, "../story/levels-manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
  const levels = manifest.levels.filter(l => l.id !== "level_00").sort((a, b) => {
    const idA = a.id.match(/\d+/) ? parseInt(a.id.match(/\d+/)[0]) : 999;
    const idB = b.id.match(/\d+/) ? parseInt(b.id.match(/\d+/)[0]) : 999;
    return idA - idB;
  });

  const levelsData = { tiers, levels };

  // Load gate catalog
  const gatesPath = path.resolve(__dirname, "../data/gates.json");
  const gates = JSON.parse(fs.readFileSync(gatesPath, "utf-8"));
  const gateKeysLower = new Set(Object.keys(gates).map(k => k.toLowerCase()));

  it("should have 7 tiers (6 playable + intro)", () => {
    expect(Object.keys(levelsData.tiers).length).toBe(7);
  });

  it("should have 20 levels", () => {
    expect(levelsData.levels.length).toBe(20);
  });

  levelsData.levels.forEach((level) => {
    it("Level " + level.id + " should have valid structure", () => {
      expect(level.id).toBeDefined();
      expect(level.tier).toBeDefined();
      expect(level.title).toBeDefined();
      expect(level.objective).toBeDefined();
      // Sequential levels use targetSequence instead of targetTruthTable
      const hasValidation = level.targetTruthTable || level.targetSequence;
      expect(hasValidation).toBeDefined();
      expect(hasValidation.length).toBeGreaterThan(0);
    });

    it("Level " + level.id + " should include physics-integrated learning fields", () => {
      // Visuals can be a string, array, or physicsVisuals list
      const hasVisual =
        (typeof level.physicsVisual === "string" && level.physicsVisual.trim().length > 0) ||
        (Array.isArray(level.physicsVisual) && level.physicsVisual.length > 0) ||
        (Array.isArray(level.physicsVisuals) && level.physicsVisuals.length > 0);
      expect(hasVisual).toBe(true);

      // Structured physics details are required for quality consistency
      // Supports BOTH legacy schema (concepts/equations) AND new detailed schema (conceptCards/formulaCards)
      expect(level.physicsDetails).toBeDefined();
      const hasLegacySchema = Array.isArray(level.physicsDetails.concepts) && Array.isArray(level.physicsDetails.equations);
      const hasNewSchema = Array.isArray(level.physicsDetails.conceptCards) || Array.isArray(level.physicsDetails.formulaCards);
      expect(hasLegacySchema || hasNewSchema).toBe(true);
      // realWorld can be string (legacy) or object (new detailed)
      const hasRealWorld = typeof level.physicsDetails.realWorld === "string" || typeof level.physicsDetails.realWorld === "object";
      expect(hasRealWorld).toBe(true);
    });

    it("Level " + level.id + " availableGates should resolve to gate catalog", () => {
      expect(Array.isArray(level.availableGates)).toBe(true);

      // Some tutorial levels are wiring-only (no gates permitted)
      if ((level.maxGates ?? 1) === 0) {
        expect(level.availableGates.length).toBe(0);
        return;
      }

      expect(level.availableGates.length).toBeGreaterThan(0);

      level.availableGates.forEach((gateId) => {
        const ok = gateKeysLower.has(String(gateId).toLowerCase());
        expect(ok).toBe(true);
      });
    });
  });
});
