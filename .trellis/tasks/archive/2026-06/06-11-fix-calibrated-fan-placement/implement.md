# Implementation Plan

1. Reproduce the visual placement issue and identify whether the bad coordinate space is in case metadata, fan metadata or render normalization.
2. Add/fix a regression check that fails for the current misplaced fan behavior.
3. Apply the smallest metadata or render change that makes the current assets install correctly.
4. Re-run model validation, assembly tests, typecheck, lint and build.
5. Update long-term spec only if the fix changes the model asset contract.
