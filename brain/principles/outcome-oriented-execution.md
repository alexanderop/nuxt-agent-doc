# Outcome-Oriented Execution

Optimize for the intended, verifiable end state rather than preserving smooth intermediate states.

**Why:** Forcing every intermediate step to stay fully stable often creates temporary compatibility code that becomes long-lived debt. The cleaner strategy is to converge directly on the target architecture and prove correctness at explicit verification boundaries.

**Core Rule:**
- Prioritize end-state integrity over transitional stability
- Intermediate breakage is acceptable when it is planned, scoped, and reversible
- Final verification is non-negotiable

**Guardrails:**
- Use this for planned rewrites/migrations with explicit phase boundaries
- Declare where temporary breakage is acceptable
- Keep high-signal checks for actively touched areas while migrating
- Require full static and runtime verification at plan completion

The canonical instance is [[migrate-callers-then-delete-legacy-apis]] — converge directly on the new API, accept intermediate breakage, verify at the end.

The "remove first" stance comes from [[subtract-before-you-add]]; this principle authorizes the intermediate breakage that subtraction can produce during the converge step.
