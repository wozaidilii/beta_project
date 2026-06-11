# Implementation Plan

1. Use geometry feedback to confirm case stretch is the regression source.
2. Update `model-render-bounds.test.ts` so case assets cannot use stretch.
3. Remove case stretch and recalibrate front fan anchors/slots to the uniform case coordinate space.
4. Re-run model, render-bounds, assembly and project checks.
5. Record a lesson/spec update if the fitMode rule changes.
