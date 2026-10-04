// scripts/generate_step_files.js
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const stepsDocPath = path.join(rootDir, 'DETAILED_EXECUTION_STEPS.md');
const stepsDir = path.join(rootDir, 'steps');

if (!fs.existsSync(stepsDir)) {
  fs.mkdirSync(stepsDir, { recursive: true });
}

const content = fs.readFileSync(stepsDocPath, 'utf8');

// Regex to capture phases and steps
const phaseRegex = /^## (Phase \d+ [^\n]+)/gm;
const phases = [];
let match;
while ((match = phaseRegex.exec(content)) !== null) {
  phases.push({ title: match[1], index: match.index });
}

function getPhaseForIndex(idx) {
  let current = 'Phase 0 — Baseline Protection, Safety & Configuration Boundaries';
  for (const p of phases) {
    if (idx >= p.index) {
      current = p.title;
    }
  }
  return current;
}

// Split into Step blocks
const stepRegex = /### Step (\d+): ([^\n]+)\n([\s\S]*?)(?=(?:### Step \d+:|## Phase|\Z))/g;
const steps = [];

while ((match = stepRegex.exec(content)) !== null) {
  const stepNum = parseInt(match[1], 10);
  const title = match[2].trim();
  const body = match[3].trim();
  const phase = getPhaseForIndex(match.index);

  // Extract fields from body
  const statusMatch = body.match(/- \*\*Status:\*\* ([^\n]+)/);
  const filesMatch = body.match(/- \*\*Files Involved:\*\* ([^\n]+)/);
  const whatMatch = body.match(/- \*\*What it does:\*\* ([\s\S]*?)(?=(?:- \*\*Verification:\*\*|\Z))/);
  const verifMatch = body.match(/- \*\*Verification:\*\* ([\s\S]*?)$/);

  steps.push({
    num: stepNum,
    title,
    phase,
    status: statusMatch ? statusMatch[1].trim() : '[ ] Pending',
    files: filesMatch ? filesMatch[1].trim() : 'N/A',
    what: whatMatch ? whatMatch[1].trim() : '',
    verification: verifMatch ? verifMatch[1].trim() : '',
  });
}

console.log(`Parsed ${steps.length} steps from DETAILED_EXECUTION_STEPS.md`);

// Write each step file
for (let i = 0; i < steps.length; i++) {
  const step = steps[i];
  const prevStep = i > 0 ? `step${steps[i - 1].num}.md` : null;
  const nextStep = i < steps.length - 1 ? `step${steps[i + 1].num}.md` : null;

  const navLinks = [
    `[🏠 All Steps Index](README.md)`,
    prevStep ? `[← Previous Step (${steps[i - 1].num})](file:///c:/Users/avina/OneDrive/Desktop/Xplora/Xplora/steps/${prevStep})` : null,
    nextStep ? `[Next Step (${steps[i + 1].num}) →](file:///c:/Users/avina/OneDrive/Desktop/Xplora/Xplora/steps/${nextStep})` : null,
  ].filter(Boolean).join(' | ');

  const fileContent = `# Step ${step.num}: ${step.title}

> **Phase:** ${step.phase}  
> **Status:** ${step.status}  
> **Parent Implementation Plan:** [IMPLEMENTATION_PLAN.md](file:///c:/Users/avina/OneDrive/Desktop/Xplora/Xplora/IMPLEMENTATION_PLAN.md)  
> **Navigation:** ${navLinks}

---

## 🎯 Objective & What This Step Does

${step.what}

---

## 📁 Target Files Affected

- ${step.files.split(',').map(f => f.trim()).join('\n- ')}

---

## 🛠️ Detailed Implementation Guidelines

1. **Safety First:** Ensure no unrelated or uncommitted user work is overwritten.
2. **Truthfulness Rule:** Do not introduce synthetic or fabricated inventory, prices, schedules, or false booking claims.
3. **Contracts:** Ensure changes adhere strictly to the shared models in \`lib/types.ts\`.

---

## ✅ Acceptance & Verification Criteria

${step.verification}

---

## 🧭 Navigation

${navLinks}
`;

  const fileName = `step${step.num}.md`;
  const filePath = path.join(stepsDir, fileName);
  fs.writeFileSync(filePath, fileContent, 'utf8');
}

// Generate steps/README.md table of contents
let tocContent = `# XPLORA Step-by-Step Implementation Index (100 Steps)

> **Parent Reference:** [IMPLEMENTATION_PLAN.md](file:///c:/Users/avina/OneDrive/Desktop/Xplora/Xplora/IMPLEMENTATION_PLAN.md)  
> **Detailed Master File:** [DETAILED_EXECUTION_STEPS.md](file:///c:/Users/avina/OneDrive/Desktop/Xplora/Xplora/DETAILED_EXECUTION_STEPS.md)

This directory contains dedicated documentation for each of the 100 individual steps.

---

## Steps Directory

| Step | Title | Phase | Status | Document |
|---|---|---|---|---|
`;

for (const s of steps) {
  tocContent += `| **Step ${s.num}** | ${s.title} | ${s.phase.split('—')[0].trim()} | ${s.status} | [View Step ${s.num}](file:///c:/Users/avina/OneDrive/Desktop/Xplora/Xplora/steps/step${s.num}.md) |\n`;
}

fs.writeFileSync(path.join(stepsDir, 'README.md'), tocContent, 'utf8');
console.log(`Generated all ${steps.length} step files and steps/README.md successfully!`);
