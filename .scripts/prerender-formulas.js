#!/usr/bin/env node
/**
 * prerender-formulas.js
 * Pre-renders all LaTeX formulas to HTML at build time using KaTeX.
 * Scans story/formulas.json, story/glossary.json, and level JSON files.
 * Adds 'html' field alongside 'latex' for each formula.
 * Output: modified JSON files with pre-rendered HTML (safe for static GitHub Pages).
 */

import fs from 'fs';
import path from 'path';
import katex from 'katex';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');
const storyDir = path.join(projectRoot, 'story');
const manifestPath = path.join(storyDir, 'levels-manifest.json');
const levelTheoryDir = path.join(storyDir, 'level-theory');
const levelPuzzlesDir = path.join(storyDir, 'level-puzzles');

const KaTeXOptions = {
  throwOnError: false,
  output: 'html', // Use 'htmlAndMathml' for accessibility if needed
  strict: 'warn'
};

/**
 * Renders LaTeX to HTML using KaTeX.
 * Returns HTML string or null on error.
 */
function renderLatex(latex) {
  if (!latex || typeof latex !== 'string') return null;
  try {
    return katex.renderToString(latex, KaTeXOptions);
  } catch (error) {
    console.warn(`Failed to render LaTeX: ${latex}`);
    console.warn(`Error: ${error.message}`);
    return null;
  }
}

/**
 * Processes a formula object (from formulas.json or level data).
 * Adds 'html' field if 'latex' exists.
 */
function processFormula(formula) {
  if (formula.latex) {
    formula.html = renderLatex(formula.latex);
  }
  return formula;
}

/**
 * Recursively processes an object to find and render all 'latex' fields.
 */
function processObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => processObject(item));
  }
  
  const processed = {};
  for (const [key, value] of Object.entries(obj)) {
    const isFormulaKey = ['latex', 'formula', 'equation'].includes(key);
    if (isFormulaKey && typeof value === 'string') {
      // This is a latex field; render it and add html sibling
      processed[key] = value;
      processed.html = renderLatex(value);
    } else if (typeof value === 'object') {
      processed[key] = processObject(value);
    } else {
      processed[key] = value;
    }
  }
  return processed;
}

/**
 * Processes formulas.json
 */
function processFormulasJson() {
  const filePath = path.join(storyDir, 'formulas.json');
  console.log(`Processing ${filePath}...`);
  
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  
  if (data.formulas) {
    for (const [key, formula] of Object.entries(data.formulas)) {
      data.formulas[key] = processFormula(formula);
    }
  }
  
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`✓ Updated ${filePath}`);
}

/**
 * Processes glossary.json
 */
function processGlossaryJson() {
  const filePath = path.join(storyDir, 'glossary.json');
  console.log(`Processing ${filePath}...`);
  
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  
  // Process terms
  if (data.terms) {
    for (const [key, term] of Object.entries(data.terms)) {
      data.terms[key] = processObject(term);
    }
  }
  
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`✓ Updated ${filePath}`);
}

/**
 * Processes the manifest file and all generated level files
 */
function processLevelFiles() {
  // Process manifest file
  if (fs.existsSync(manifestPath)) {
    console.log(`Processing levels-manifest.json...`);
    const data = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    const processed = processObject(data);
    fs.writeFileSync(manifestPath, JSON.stringify(processed, null, 2), 'utf-8');
    console.log(`✓ Updated levels-manifest.json`);
  }

  // Process new level-theory folder
  if (fs.existsSync(levelTheoryDir)) {
    console.log(`\nProcessing level-theory folder...`);
    const files = fs.readdirSync(levelTheoryDir).filter(f => f.endsWith('.json'));
    
    for (const file of files) {
      const filePath = path.join(levelTheoryDir, file);
      console.log(`Processing theory: ${file}...`);
      
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const processed = processObject(data);
      
      fs.writeFileSync(filePath, JSON.stringify(processed, null, 2), 'utf-8');
      console.log(`✓ Updated ${file}`);
    }
  }

  // Process new level-puzzles folder
  if (fs.existsSync(levelPuzzlesDir)) {
    console.log(`\nProcessing level-puzzles folder...`);
    const files = fs.readdirSync(levelPuzzlesDir).filter(f => f.endsWith('.json'));
    
    for (const file of files) {
      const filePath = path.join(levelPuzzlesDir, file);
      console.log(`Processing puzzle: ${file}...`);
      
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const processed = processObject(data);
      
      fs.writeFileSync(filePath, JSON.stringify(processed, null, 2), 'utf-8');
      console.log(`✓ Updated ${file}`);
    }
  }
}

/**
 * Main execution
 */
function main() {
  console.log('🔨 Pre-rendering LaTeX formulas with KaTeX...\n');
  
  try {
    processFormulasJson();
    processGlossaryJson();
    processLevelFiles();
    
    console.log('\n✅ All formulas pre-rendered successfully!');
    console.log('   HTML output added alongside LaTeX fields.');
  } catch (error) {
    console.error('\n❌ Error during pre-rendering:', error.message);
    process.exit(1);
  }
}

main();
