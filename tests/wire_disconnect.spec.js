import { test, expect } from "@playwright/test";

// ─── Helpers ──────────────────────────────────────────────

async function navigateToHome(page, baseURL) {
  const url = (baseURL || "/") + "?t=" + Date.now();
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForSelector("#roadmap-overlay", {
    state: "visible",
    timeout: 30000,
  });
}

async function startLevelFromIntro(page) {
  await page
    .waitForFunction(() => {
      const loading = document.getElementById("loading-screen");
      return !loading || loading.classList.contains("hidden");
    }, { timeout: 10000 })
    .catch(() => {});

  await page.waitForSelector("#btn-start-level", {
    state: "visible",
    timeout: 5000,
  });
  await page.locator("#btn-start-level").click();

  await page.waitForFunction(
    () => {
      const intro = document.getElementById("level-intro-overlay");
      const roadmap = document.getElementById("roadmap-overlay");
      const loading = document.getElementById("loading-screen");
      const introOk =
        !intro ||
        intro.classList.contains("hidden") ||
        window.getComputedStyle(intro).display === "none";
      const roadmapOk =
        !roadmap ||
        roadmap.classList.contains("hidden") ||
        window.getComputedStyle(roadmap).display === "none";
      const loadingOk =
        !loading || loading.classList.contains("hidden");
      return introOk && roadmapOk && loadingOk;
    },
    { timeout: 10000 }
  );

  await page.waitForTimeout(500);
}

/** Open level 1 (The Simple Wire) from the roadmap */
async function openLevel1(page) {
  await page
    .locator(".roadmap-level")
    .nth(1)
    .locator(".level-left")
    .click();
  await startLevelFromIntro(page);
}

/** Return the bounding box of #circuit-canvas */
async function canvasBox(page) {
  return page.locator("#circuit-canvas").boundingBox();
}

/**
 * Convert circuit-world coordinates to screen (client) coordinates.
 */
function worldToScreen(box, wx, wy) {
  return { x: box.x + wx, y: box.y + wy };
}

// Pin positions use actual gate dimensions from CanvasRenderer:
// Input/Output nodes: width=50, height=40
// Regular gates: width=80, height=60
// Pin offset from gate edge: 5px

function gateOutputPin(gateX, gateY, gateType = 'regular', outputCount = 1, pinIdx = 0) {
  const w = (gateType === 'input' || gateType === 'output') ? 50 : 80;
  const h = (gateType === 'input' || gateType === 'output') ? 40 : 60;
  if (outputCount === 1) return { x: gateX + w + 5, y: gateY + h / 2 };
  return { x: gateX + w + 5, y: gateY + (h / (outputCount + 1)) * (pinIdx + 1) };
}

function gateInputPin(gateX, gateY, gateType = 'regular', inputCount = 1, pinIdx = 0) {
  const h = (gateType === 'input' || gateType === 'output') ? 40 : 60;
  const spacing = h / (inputCount + 1);
  return { x: gateX - 5, y: gateY + spacing * (pinIdx + 1) };
}

/**
 * Draw a wire from (sx, sy) to (ex, ey) in world coordinates.
 */
async function drawWire(page, box, sx, sy, ex, ey) {
  const from = worldToScreen(box, sx, sy);
  const to = worldToScreen(box, ex, ey);
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(to.x, to.y, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(300);
}

/**
 * Right-click at the midpoint between two points (world coords).
 */
async function rightClickMidpoint(page, box, sx, sy, ex, ey) {
  const mx = (sx + ex) / 2;
  const my = (sy + ey) / 2;
  const pos = worldToScreen(box, mx, my);
  await page.mouse.click(pos.x, pos.y, { button: "right" });
  await page.waitForTimeout(300);
}

/**
 * Toggle an input gate programmatically and re-simulate.
 * Input toggle now works in the unified interaction mode via a short tap on the gate body;
 * this helper uses the circuit API directly for reliable programmatic testing.
 */
async function toggleInput(page, gateId = 'gate_0') {
  await page.evaluate((id) => {
    const gate = window.circuit.gates.get(id);
    if (gate && gate.type === 'input') {
      gate.setValue(gate.value === 0 ? 1 : 0);
      window.circuit.simulate();
    }
  }, gateId);
  await page.waitForTimeout(100);
}

/** Read circuit output values. */
async function circuitOutputs(page) {
  return page.evaluate(() => window.circuit?.getOutputs() ?? null);
}

/** Read wire count. */
async function wireCount(page) {
  return page.evaluate(() => window.circuit?.wires.size ?? -1);
}

// ─── Tests ────────────────────────────────────────────────

test.describe("Wire Disconnect – Output Correctly Updates", () => {
  test.beforeEach(async ({ page, baseURL }) => {
    page.on("console", (msg) =>
      console.log(`[BROWSER ${msg.type()}]:`, msg.text())
    );
    page.on("pageerror", (err) =>
      console.error(`[PAGE ERROR]:`, err.message)
    );
    await navigateToHome(page, baseURL);
  });

  // ─────────────────────────────────────────────────────────
  // Level 1 mouse-interaction tests (input @ 100,150 → output @ 700,150)
  // ─────────────────────────────────────────────────────────

  test("output defaults to 0 when no wire is connected", async ({ page }) => {
    await openLevel1(page);
    expect(await circuitOutputs(page)).toEqual([0]);
  });

  test("output follows input after wire is connected", async ({ page }) => {
    await openLevel1(page);
    const box = await canvasBox(page);

    const inP = gateOutputPin(100, 150, 'input');   // input-node output pin
    const outP = gateInputPin(700, 150, 'output');   // output-node input pin

    await drawWire(page, box, inP.x, inP.y, outP.x, outP.y);
    expect(await circuitOutputs(page)).toEqual([0]); // input=0

    // Toggle input to 1
    await toggleInput(page);
    expect(await circuitOutputs(page)).toEqual([1]);
  });

  test("output resets to 0 after wire is disconnected", async ({ page }) => {
    await openLevel1(page);
    const box = await canvasBox(page);

    const inP = gateOutputPin(100, 150, 'input');
    const outP = gateInputPin(700, 150, 'output');

    await drawWire(page, box, inP.x, inP.y, outP.x, outP.y);
    await toggleInput(page); // input ON
    expect(await circuitOutputs(page)).toEqual([1]);

    // Right-click wire to delete
    await rightClickMidpoint(page, box, inP.x, inP.y, outP.x, outP.y);
    expect(await wireCount(page)).toBe(0);
    expect(await circuitOutputs(page)).toEqual([0]);
  });

  test("output updates on every connect/disconnect cycle", async ({ page }) => {
    await openLevel1(page);
    const box = await canvasBox(page);

    const inP = gateOutputPin(100, 150, 'input');
    const outP = gateInputPin(700, 150, 'output');

    // Toggle input ON first (no wire yet → output stays 0)
    await toggleInput(page);
    expect(await circuitOutputs(page)).toEqual([0]);

    // Connect → output should become 1
    await drawWire(page, box, inP.x, inP.y, outP.x, outP.y);
    expect(await circuitOutputs(page)).toEqual([1]);

    // Disconnect → output drops to 0
    await rightClickMidpoint(page, box, inP.x, inP.y, outP.x, outP.y);
    expect(await circuitOutputs(page)).toEqual([0]);

    // Reconnect → output becomes 1 again (input still on)
    await drawWire(page, box, inP.x, inP.y, outP.x, outP.y);
    expect(await circuitOutputs(page)).toEqual([1]);
  });

  // ─────────────────────────────────────────────────────────
  // Programmatic tests – build circuits entirely via evaluate()
  // Level 1 gives us: gate_0 = InputNode, gate_1 = OutputNode
  // ─────────────────────────────────────────────────────────

  test("programmatic: removing wire resets output via simulate()", async ({
    page,
  }) => {
    await openLevel1(page);

    const result = await page.evaluate(() => {
      const c = window.circuit;
      const wire = c.connect("gate_0", 0, "gate_1", 0);
      c.setInputs([1]);
      c.simulate();
      const before = c.getOutputs();

      c.removeWire(wire.id);
      c.simulate();
      const after = c.getOutputs();

      return { before, after, wires: c.wires.size };
    });

    expect(result.before).toEqual([1]);
    expect(result.after).toEqual([0]);
    expect(result.wires).toBe(0);
  });

  test("programmatic: output with no input wires shows 0", async ({ page }) => {
    await openLevel1(page);

    const result = await page.evaluate(() => {
      const c = window.circuit;
      c.setInputs([1]);
      c.simulate();
      return c.getOutputs();
    });

    expect(result).toEqual([0]);
  });

  test("programmatic: NOT gate chain – disconnect propagates correctly", async ({
    page,
  }) => {
    await openLevel1(page);

    const result = await page.evaluate(() => {
      const c = window.circuit;
      // gate_0=input, gate_1=output
      const notGate = c.addGate("not", 400, 150);

      const w1 = c.connect("gate_0", 0, notGate.id, 0);
      const w2 = c.connect(notGate.id, 0, "gate_1", 0);

      // Input=0 → NOT(0)=1 → output=1
      c.setInputs([0]);
      c.simulate();
      const step1 = c.getOutputs();

      // Disconnect input→NOT: NOT input defaults to 0 → NOT(0)=1
      c.removeWire(w1.id);
      c.simulate();
      const step2 = c.getOutputs();

      // Disconnect NOT→output: output has no input → 0
      c.removeWire(w2.id);
      c.simulate();
      const step3 = c.getOutputs();

      return { step1, step2, step3 };
    });

    expect(result.step1).toEqual([1]);
    expect(result.step2).toEqual([1]);
    expect(result.step3).toEqual([0]);
  });

  test("programmatic: multiple outputs update independently after disconnect", async ({
    page,
  }) => {
    await openLevel1(page);

    const result = await page.evaluate(() => {
      const c = window.circuit;
      const out2 = c.addGate("output", 700, 300);

      const w1 = c.connect("gate_0", 0, "gate_1", 0);
      const w2 = c.connect("gate_0", 0, out2.id, 0);

      c.setInputs([1]);
      c.simulate();
      const both = c.getOutputs(); // [1, 1]

      c.removeWire(w1.id);
      c.simulate();
      const afterDisc = c.getOutputs(); // [0, 1]

      return { both, afterDisc };
    });

    expect(result.both).toEqual([1, 1]);
    expect(result.afterDisc).toEqual([0, 1]);
  });

  test("programmatic: AND gate – disconnect one input → output goes to 0", async ({
    page,
  }) => {
    await openLevel1(page);

    const result = await page.evaluate(() => {
      const c = window.circuit;
      // gate_0=input, gate_1=output
      const in2 = c.addGate("input", 100, 300);
      const andGate = c.addGate("and", 400, 150);

      c.connect("gate_0", 0, andGate.id, 0);
      const w2 = c.connect(in2.id, 0, andGate.id, 1);
      c.connect(andGate.id, 0, "gate_1", 0);

      // Both ON: AND(1,1) = 1
      c.gates.get("gate_0").setValue(1);
      in2.setValue(1);
      c.simulate();
      const bothOn = c.getOutputs();

      // Disconnect second input: AND(1, default 0) = 0
      c.removeWire(w2.id);
      c.simulate();
      const afterDisc = c.getOutputs();

      return { bothOn, afterDisc };
    });

    expect(result.bothOn).toEqual([1]);
    expect(result.afterDisc).toEqual([0]);
  });

  test("programmatic: OR gate – disconnect all inputs → output goes to 0", async ({
    page,
  }) => {
    await openLevel1(page);

    const result = await page.evaluate(() => {
      const c = window.circuit;
      const in2 = c.addGate("input", 100, 300);
      const orGate = c.addGate("or", 400, 150);

      const w1 = c.connect("gate_0", 0, orGate.id, 0);
      const w2 = c.connect(in2.id, 0, orGate.id, 1);
      c.connect(orGate.id, 0, "gate_1", 0);

      c.gates.get("gate_0").setValue(1);
      in2.setValue(0);
      c.simulate();
      const orOn = c.getOutputs(); // OR(1,0) = 1

      c.removeWire(w1.id);
      c.removeWire(w2.id);
      c.simulate();
      const orOff = c.getOutputs(); // OR(0,0) = 0

      return { orOn, orOff };
    });

    expect(result.orOn).toEqual([1]);
    expect(result.orOff).toEqual([0]);
  });

  test("programmatic: gate with no input wires connected to output → 0", async ({
    page,
  }) => {
    await openLevel1(page);

    const result = await page.evaluate(() => {
      const c = window.circuit;
      const andGate = c.addGate("and", 400, 150);
      c.connect(andGate.id, 0, "gate_1", 0);
      c.simulate();
      return c.getOutputs(); // AND(0,0) = 0
    });

    expect(result).toEqual([0]);
  });

  test("programmatic: NAND gate – disconnected input defaults correctly", async ({
    page,
  }) => {
    await openLevel1(page);

    const result = await page.evaluate(() => {
      const c = window.circuit;
      const nandGate = c.addGate("nand", 400, 150);

      const w1 = c.connect("gate_0", 0, nandGate.id, 0);
      c.connect(nandGate.id, 0, "gate_1", 0);

      // Input0=1, pin1 floating(0): NAND(1,0) = 1
      c.gates.get("gate_0").setValue(1);
      c.simulate();
      const withOneInput = c.getOutputs();

      // Connect both and set both to 1: NAND(1,1) = 0
      const in2 = c.addGate("input", 100, 300);
      in2.setValue(1);
      c.connect(in2.id, 0, nandGate.id, 1);
      c.simulate();
      const bothOn = c.getOutputs();

      // Disconnect first input: NAND(0,1) = 1
      c.removeWire(w1.id);
      c.simulate();
      const afterDisc = c.getOutputs();

      return { withOneInput, bothOn, afterDisc };
    });

    expect(result.withOneInput).toEqual([1]);
    expect(result.bothOn).toEqual([0]);
    expect(result.afterDisc).toEqual([1]);
  });

  test("programmatic: XOR gate – disconnect resets correctly", async ({
    page,
  }) => {
    await openLevel1(page);

    const result = await page.evaluate(() => {
      const c = window.circuit;
      const in2 = c.addGate("input", 100, 300);
      const xorGate = c.addGate("xor", 400, 150);

      const w1 = c.connect("gate_0", 0, xorGate.id, 0);
      const w2 = c.connect(in2.id, 0, xorGate.id, 1);
      c.connect(xorGate.id, 0, "gate_1", 0);

      // XOR(1,0) = 1
      c.gates.get("gate_0").setValue(1);
      in2.setValue(0);
      c.simulate();
      const xorOn = c.getOutputs();

      // Disconnect both: XOR(0,0) = 0
      c.removeWire(w1.id);
      c.removeWire(w2.id);
      c.simulate();
      const xorOff = c.getOutputs();

      return { xorOn, xorOff };
    });

    expect(result.xorOn).toEqual([1]);
    expect(result.xorOff).toEqual([0]);
  });

  test("programmatic: deep chain – disconnect early wire propagates to output", async ({
    page,
  }) => {
    // Input(1) → AND(pin0) → OR(pin0) → Output
    //            AND(pin1) ← always 1 (second input)
    //            OR(pin1)  ← always 0 (floating)
    // Expected: AND(1,1)=1 → OR(1,0)=1 → Output=1
    // After removing Input→AND wire: AND(0,1)=0 → OR(0,0)=0 → Output=0
    await openLevel1(page);

    const result = await page.evaluate(() => {
      const c = window.circuit;
      // gate_0=input, gate_1=output
      const in2 = c.addGate("input", 100, 300);
      const andGate = c.addGate("and", 300, 150);
      const orGate = c.addGate("or", 500, 150);

      const w1 = c.connect("gate_0", 0, andGate.id, 0);  // Input → AND pin0
      c.connect(in2.id, 0, andGate.id, 1);                // in2 → AND pin1
      c.connect(andGate.id, 0, orGate.id, 0);             // AND → OR pin0
      c.connect(orGate.id, 0, "gate_1", 0);               // OR → Output

      c.gates.get("gate_0").setValue(1);
      in2.setValue(1);
      c.simulate();
      const before = c.getOutputs(); // AND(1,1)=1, OR(1,0)=1

      // Disconnect the FIRST wire (Input → AND), 2 hops before output
      c.removeWire(w1.id);
      c.simulate();
      const after = c.getOutputs(); // AND(0,1)=0, OR(0,0)=0

      return { before, after };
    });

    expect(result.before).toEqual([1]);
    expect(result.after).toEqual([0]);
  });

  test("programmatic: 3-gate chain – disconnect at start propagates to end", async ({
    page,
  }) => {
    // Input(1) → NOT → NOT → NOT → Output
    // NOT(1)=0 → NOT(0)=1 → NOT(1)=0 → Output=0
    // After disconnect: NOT(0)=1 → NOT(1)=0 → NOT(0)=1 → Output=1
    await openLevel1(page);

    const result = await page.evaluate(() => {
      const c = window.circuit;
      const not1 = c.addGate("not", 250, 150);
      const not2 = c.addGate("not", 400, 150);
      const not3 = c.addGate("not", 550, 150);

      const w1 = c.connect("gate_0", 0, not1.id, 0);
      c.connect(not1.id, 0, not2.id, 0);
      c.connect(not2.id, 0, not3.id, 0);
      c.connect(not3.id, 0, "gate_1", 0);

      c.gates.get("gate_0").setValue(1);
      c.simulate();
      const before = c.getOutputs(); // NOT(NOT(NOT(1))) = NOT(NOT(0)) = NOT(1) = 0

      c.removeWire(w1.id);
      c.simulate();
      const after = c.getOutputs(); // NOT(NOT(NOT(0))) = NOT(NOT(1)) = NOT(0) = 1

      return { before, after };
    });

    expect(result.before).toEqual([0]);
    expect(result.after).toEqual([1]);
  });

  test("programmatic: disconnect mid-chain wire updates output", async ({
    page,
  }) => {
    // Input(1) → NOT → AND(pin0) → Output
    //                   AND(pin1) ← Input2(1)
    // NOT(1)=0, AND(0,1)=0, Output=0
    // Remove wire NOT→AND: AND(0,1)=0 still (floating=0)
    // But: set Input to 0: NOT(0)=1, if wire exists AND(1,1)=1
    // With wire removed: AND(0,1)=0
    await openLevel1(page);

    const result = await page.evaluate(() => {
      const c = window.circuit;
      const in2 = c.addGate("input", 100, 300);
      const notGate = c.addGate("not", 300, 150);
      const andGate = c.addGate("and", 500, 150);

      c.connect("gate_0", 0, notGate.id, 0);
      const w2 = c.connect(notGate.id, 0, andGate.id, 0);  // NOT → AND pin0
      c.connect(in2.id, 0, andGate.id, 1);                   // in2 → AND pin1
      c.connect(andGate.id, 0, "gate_1", 0);

      // Input=0 → NOT(0)=1 → AND(1,1)=1 → Output=1
      c.gates.get("gate_0").setValue(0);
      in2.setValue(1);
      c.simulate();
      const step1 = c.getOutputs();

      // Disconnect NOT→AND (mid-chain): AND(0,1)=0 → Output=0
      c.removeWire(w2.id);
      c.simulate();
      const step2 = c.getOutputs();

      return { step1, step2 };
    });

    expect(result.step1).toEqual([1]);
    expect(result.step2).toEqual([0]);
  });
});
