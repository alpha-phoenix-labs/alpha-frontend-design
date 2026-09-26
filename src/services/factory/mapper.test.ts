import { describe, expect, it } from 'vitest';
import { parseJobPayload, parseTestReportV1 } from '@/services/factory/mapper.ts';

const outerJob = (testReport: unknown): Record<string, unknown> => ({
  jobId: 'job-1',
  version: 3,
  status: 'TESTING',
  createdAt: '2026-09-26T10:00:00.000Z',
  updatedAt: '2026-09-26T10:05:00.000Z',
  testReport,
  errorMessage: null,
  clarificationQuestion: null,
});

describe('TestReportV1 public contract', () => {
  it.each(['PASS', 'NOT_PASS', 'NOT_RUN'] as const)('accepts result %s', (result) => {
    const report = { contractVersion: '1.0', jobId: 'job-1', result };
    expect(parseTestReportV1(report, 'job-1')).toEqual({ ok: true, value: report });
  });

  it('accepts all optional string fields unchanged', () => {
    const report = {
      contractVersion: '1.0',
      jobId: 'job-1',
      result: 'PASS',
      reason: 'OK',
      importedId: 'wf-1',
      executionId: 'exec-1',
      evidence: 'verified',
    } as const;
    expect(parseTestReportV1(report, 'job-1')).toEqual({ ok: true, value: report });
  });

  it('accepts missing optional fields and null report', () => {
    expect(parseTestReportV1({ contractVersion: '1.0', jobId: 'job-1', result: 'NOT_RUN' }, 'job-1')).toEqual({
      ok: true,
      value: { contractVersion: '1.0', jobId: 'job-1', result: 'NOT_RUN' },
    });
    expect(parseTestReportV1(null, 'job-1')).toEqual({ ok: true, value: null });
  });

  it('ignores unknown response fields instead of storing them', () => {
    const parsed = parseTestReportV1(
      { contractVersion: '1.0', jobId: 'job-1', result: 'PASS', futureField: { internal: true } },
      'job-1',
    );
    expect(parsed).toEqual({
      ok: true,
      value: { contractVersion: '1.0', jobId: 'job-1', result: 'PASS' },
    });
  });

  it.each([
    ['missing contractVersion', { jobId: 'job-1', result: 'PASS' }],
    ['wrong contractVersion', { contractVersion: '2.0', jobId: 'job-1', result: 'PASS' }],
    ['missing report jobId', { contractVersion: '1.0', result: 'PASS' }],
    ['mismatched report jobId', { contractVersion: '1.0', jobId: 'job-2', result: 'PASS' }],
    ['unknown result', { contractVersion: '1.0', jobId: 'job-1', result: 'UNKNOWN' }],
    ['non-string reason', { contractVersion: '1.0', jobId: 'job-1', result: 'PASS', reason: 7 }],
    ['non-string importedId', { contractVersion: '1.0', jobId: 'job-1', result: 'PASS', importedId: false }],
    ['non-string executionId', { contractVersion: '1.0', jobId: 'job-1', result: 'PASS', executionId: 9 }],
    ['non-string evidence', { contractVersion: '1.0', jobId: 'job-1', result: 'PASS', evidence: {} }],
    ['array report', []],
    ['primitive report', 'PASS'],
  ])('root job parser fail-closes invalid report: %s', (_name, report) => {
    expect(parseJobPayload(outerJob(report), true)).toMatchObject({
      ok: false,
      error: { kind: 'invalidResponse', code: 'INVALID_PAYLOAD' },
    });
  });

  it('root job parser accepts null and returns the sanitized V1 report', () => {
    expect(parseJobPayload(outerJob(null), true)).toMatchObject({ ok: true, value: { testReport: null } });

    const parsed = parseJobPayload(
      outerJob({
        contractVersion: '1.0',
        jobId: 'job-1',
        result: 'PASS',
        executionId: 'exec-1',
        unknown: 'drop-me',
      }),
      true,
    );
    expect(parsed).toMatchObject({
      ok: true,
      value: {
        testReport: {
          contractVersion: '1.0',
          jobId: 'job-1',
          result: 'PASS',
          executionId: 'exec-1',
        },
      },
    });
    if (parsed.ok) {
      expect(parsed.value.testReport).not.toHaveProperty('unknown');
    }
  });
});
