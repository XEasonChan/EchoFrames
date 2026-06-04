# Fixtures

## example-com-walkthrough

Public determinism fixture. example.com is stable, no PII, IANA-owned.

Regenerate:
```bash
yarn workspace echoframes build:fixture
```

The script (`scripts/build-fixture.ts`) drives example.com via Playwright + the local rrweb umd bundle, recording events and screenshots at known timestamps. `git diff` should be small — if events count or duration shifts more than ±20%, investigate before committing.
