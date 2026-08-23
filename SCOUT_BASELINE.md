# SCOUT — Visual Baseline

## Source of Truth

The approved SCOUT baseline screenshot is the known-good visual reference state for all future SCOUT UI work.

Treat it as a source of truth, not merely as an example.

## Baseline Rules

- Do not redesign, reinterpret, modernize, or improve the existing UI unless explicitly instructed.
- Do not change elements that already match the baseline.
- Diagnose the difference between the current implementation and the baseline before changing anything.
- Make the minimum necessary code change.
- Preserve the existing visual hierarchy, spacing, proportions, typography, glass effect, background treatment, composer, conversation panel, and overall composition.
- Do not roll back to an older backup simply because it is older.
- Do not make unrelated improvements while fixing a specific issue.

## Correction Protocol

1. Compare the current implementation against the approved baseline.
2. Identify exactly what differs.
3. Identify the root cause.
4. State what will be changed.
5. State what will be preserved.
6. Make only the necessary change.
7. Verify that the correction does not regress the baseline.

## Authority Hierarchy

1. Explicit instruction from the user
2. Verified SCOUT baseline screenshot
3. Current working code
4. Backup files as historical evidence
5. ChatGPT assumptions

Never treat an assumption about how SCOUT should work as higher authority than the verified baseline or the user's explicit instruction.

## Explicit Override

If the user explicitly requests a new feature or intentional design change, treat that request as an override of the baseline only for the specified area. Preserve the baseline everywhere else.

## Required Behavior Before Making Code Changes

- Diagnose before solving.
- Separate facts, assumptions, constraints, and conflicts.
- Challenge assumptions instead of silently accepting them.
- Preserve what is already correct.
- Make the smallest necessary change.
- Verify the result against the baseline.
- Do not expand the scope without explicit authorization.

## Baseline Rule

Treat the approved SCOUT screenshot as the verified visual source of truth. Diagnose the current implementation against it before changing anything. Preserve everything that already matches. Make only the minimum necessary change to fix the specific issue identified. Do not redesign, refactor, roll back, or make unrelated improvements unless explicitly asked.

Baseline reference: SCOUT UI — verified 23 August 2026.
