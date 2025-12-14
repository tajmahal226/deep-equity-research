# Codebase review follow-up tasks

## Typo to fix
- **Correct "bussinesses" spelling** in `src/constants/companyDivePrompts.ts` so the system instruction reads "tech enabled services businesses". The typo sits in the first paragraph of the prompt string and ships to the LLM unchanged.

## Bug to fix
- **Enforce proper sequencing in `RequestManager.sequentialRequest`** (`src/utils/request-manager.ts`). The wait loop breaks whenever `_active` equals `mySeq - 1`, so concurrent callers with consecutive sequence numbers do not actually wait for the prior request to finish and can run in parallel, defeating the sequencing guarantee.

## Comment/documentation discrepancy to fix
- **Align docs with repository contents in `docs/model-filtering-summary.md`**. The summary states a `test-model-filtering.js` file was created, but no such file exists in the repo, so the documentation misleads readers about available checks.

## Test to improve
- **Add coverage for `sequentialRequest` ordering** in `tests/utils/request-manager.test.ts`. Existing tests only cover deduplication and abort flows; there is no assertion that later queued requests wait for earlier ones to complete or that `_active` counters reset as expected.
