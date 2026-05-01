# Verify in the Browser

After completing any UI or feature work, drive the running local setup with the agent browser CLI before reporting done. Type checks and tests prove code correctness; the browser proves feature correctness.

**Why:** "It compiles" and "tests pass" routinely coexist with broken UI — wrong styles, dead handlers, blank states, console errors, regressions on adjacent flows. The only authoritative answer to "does it work?" is exercising the actual feature against the actual local server in an actual browser. Skipping this step shifts verification cost onto the human.

**Pattern:**
- **Boot the local stack.** Start (or confirm) the dev server before claiming a task is finished
- **Drive the agent browser CLI.** Navigate to the changed surface, exercise the golden path, then probe at least one edge case
- **Watch for regressions.** Check adjacent flows the change could plausibly have broken, not just the one touched
- **Read the console.** Treat new errors or warnings as failure signals, not noise
- **Capture proof.** Screenshot or describe what you observed — "I clicked X and saw Y" beats "should work"

**Boundaries:**
- If the change has no UI surface (pure types, internal refactor, build config), say so explicitly and skip
- If the local setup cannot run (missing secrets, broken deps, no browser available), state that the verification was not possible — do not silently substitute "the tests pass" for browser proof

This is the UI-specific instance of [[prove-it-works]]: check the real thing, not a proxy.
