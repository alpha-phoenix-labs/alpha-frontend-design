# CRAFTFLOW M1 GOVERNANCE DECISION

Governance ID: `M1-GOV-001`  
Version: `1.0.0`  
Status: `HISTORICAL / SUPERSEDED`\nSuperseded by: `M1-GOV-001 v1.1.0`  
Decision time: `2026-09-29T21:38:00+02:00`  
Approver: `BOSS / Product Owner`  
Scope: Craftflow / Handwerkerflow M1 release governance only.

## 1. Decision

The existing controlled n8n test run is classified as:

`PRE-APPROVAL VALIDATION`

This validation is permitted before Human Approval.

It is a technical verification step only. It does not constitute business approval, customer release, productive finalization, release approval, or authorization to deliver the finished workflow package.

No code change and no change to the already proven production flow is authorized by this decision.

## 2. Binding allowed sequence

The M1 sequence is:

1. Production Frontend request
2. Authentication / authorization
3. Workflow creation and persistence
4. Build / security checks
5. PRE-APPROVAL VALIDATION
   - import isolated test copy into the designated n8n test environment
   - activate isolated test copy
   - execute synthetic/controlled webhook or equivalent test
   - verify n8n execution evidence
   - deactivate / clean up the test copy as implemented
6. Reach `WAITING_FOR_APPROVAL`
7. HUMAN GATE / Human Approval
8. Approval version is persisted
9. Productive finalization / documentation
10. Completion
11. Drive archive reaches `COMPLETE`
12. Release evidence correlation and release decision

## 3. Test execution versus productive execution

### PRE-APPROVAL VALIDATION

Purpose:
- prove technical correctness of the generated workflow before a human approves it;
- produce test evidence;
- detect runtime or integration defects before release.

The pre-approval validation:
- uses a controlled test copy / test path;
- may import, activate and execute that isolated test copy;
- must not be treated as the approved customer workflow;
- must not itself authorize delivery, publication, final customer activation or release;
- must remain attributable to the job and test evidence;
- must fail closed when required validation evidence is missing.

### PRODUCTIVE FINALIZATION / RELEASE

Productive finalization begins only after successful Human Approval.

Human Approval is the authorization boundary for:
- accepting the workflow for the order;
- final documentation/finalization;
- creation or release of the finished deliverable package;
- marking the business process completed;
- M1 release approval where applicable.

A PRE-APPROVAL VALIDATION PASS never substitutes for Human Approval.

## 4. Human Gate

Human Gate point:

`WAITING_FOR_APPROVAL -> APPROVED`

The workflow must not cross this boundary without an explicit human approval event.

Required approval evidence for release correlation includes at least:
- approver/reviewer identifier;
- decision timestamp;
- approval version;
- jobId;
- affected frontend and backend release identity;
- relevant n8n test execution evidence;
- resulting completion / Drive evidence.

## 5. Approver

Binding governance decision approver:

`BOSS / Product Owner`

The approver owns the M1 business/governance decision. Technical agents may validate evidence but may not reinterpret PRE-APPROVAL VALIDATION as Human Approval.

## 6. Affected release identity

Frontend:
`3d4c0f837f2b9bc9f49eabb1cfadbda503d1b3c1`

Backend:
`05a76fc88a689d79602b28646efab6611f73b595`

Frontend runtime backend pin:
`05a76fc88a689d79602b28646efab6611f73b595`

This governance decision applies to this exact M1 release identity. Any later code/runtime change requires fresh correlation and may require a new governance version.

## 7. Audit baseline reference and interpretation

Reference:
`AUDIT CRAFTFLOW.md`

The audit baseline describes the sequence:

Production Frontend -> Auth -> workflow creation -> persistence -> waitingForApproval -> Approval -> approvalVersion -> n8n Import -> n8n Execution -> Completion -> Drive COMPLETE.

For M1-GOV-001, the terms `n8n Import` and `n8n Execution` in that post-approval sequence are interpreted as productive/final release-side actions, not as the isolated technical PRE-APPROVAL VALIDATION described in this document.

Therefore:
- isolated technical test import/execution before approval is explicitly allowed;
- business approval remains mandatory before productive finalization/release;
- test PASS is not approval;
- missing Human Gate evidence still blocks final release.

This artifact resolves the previously recorded ordering conflict for the affected M1 release identity without changing the proven implementation.

## 8. Release freeze constraints

Until the remaining M1 gates are explicitly satisfied:

- PR #30 must not be merged automatically;
- no M1 release tags may be created automatically;
- frontend PR #28 must not be merged as part of this governance decision;
- backend PR #35 must not be merged as part of this governance decision;
- backend PR #37 must not be merged as part of this governance decision;
- no technical workflow redesign is authorized by this artifact.

## 9. Evidence boundary

This decision resolves only the governance interpretation of test execution versus approval.

It does not by itself prove:
- current Cloudflare direct runtime identity;
- completeness of the formal Human Gate evidence record;
- final M1 release approval;
- coordinated release tags.

Those remain separate release gates.

## 10. Change control

Any change to:
- the Human Gate position,
- the classification of PRE-APPROVAL VALIDATION,
- the affected release SHAs,
- or the distinction between test execution and productive finalization

requires a new version of this governance artifact.

No silent reinterpretation is permitted.
