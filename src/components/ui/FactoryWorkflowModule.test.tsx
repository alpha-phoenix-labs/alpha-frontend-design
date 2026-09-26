import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { FactoryJob, HumanGateState, TestReportV1 } from '@/types/factory/index.ts';
import { FactoryWorkflowModule } from '@/components/ui/FactoryWorkflowModule.tsx';

const job = (status: FactoryJob['status'] = 'testing', version = 4): FactoryJob => ({
  id: 'job-1',
  version,
  status,
  createdAt: '2026-09-27T00:00:00.000Z',
  updatedAt: '2026-09-27T00:01:00.000Z',
});

const baseProps = {
  activeJobId: 'job-1',
  job: job(),
  gate: null,
  testReport: null,
  lastError: null,
  clarificationDraft: '',
  onClarificationDraftChange: () => undefined,
  onSubmitClarification: () => undefined,
  approvalVersion: null,
  approvalConflict: false,
  onApproval: () => undefined,
  clarificationBusy: false,
  approvalBusy: false,
  mutationUnconfirmed: false,
  recoveryBusy: false,
  onRecoverMutation: () => undefined,
} as const;

describe('FactoryWorkflowModule', () => {
  it('renders the real clarification question and preserves the supplied local draft across refreshed job props', () => {
    const gate: HumanGateState = {
      jobId: 'job-1',
      type: 'clarification',
      status: 'awaiting_human',
      requestedAt: '2026-09-27T00:01:00.000Z',
      question: 'Which CRM should be used?',
    };
    const first = renderToStaticMarkup(
      <FactoryWorkflowModule {...baseProps} gate={gate} clarificationDraft="HubSpot draft" />,
    );
    const refreshed = renderToStaticMarkup(
      <FactoryWorkflowModule {...baseProps} job={job('awaiting_human', 5)} gate={gate} clarificationDraft="HubSpot draft" />,
    );

    expect(first).toContain('Which CRM should be used?');
    expect(first).toContain('value="HubSpot draft"');
    expect(refreshed).toContain('value="HubSpot draft"');
  });

  it('renders the pinned WYSIWYS approval version, not the current job version', () => {
    const gate: HumanGateState = {
      jobId: 'job-1',
      type: 'approval',
      status: 'awaiting_human',
      requestedAt: '2026-09-27T00:01:00.000Z',
    };
    const html = renderToStaticMarkup(
      <FactoryWorkflowModule {...baseProps} job={job('awaiting_human', 9)} gate={gate} approvalVersion={7} />,
    );

    expect(html).toContain('job version 9');
    expect(html).toContain('version 7');
  });

  it.each(['PASS', 'NOT_PASS', 'NOT_RUN'] as const)('renders TestReportV1 result %s', (result) => {
    const report: TestReportV1 = { contractVersion: '1.0', jobId: 'job-1', result };
    const html = renderToStaticMarkup(<FactoryWorkflowModule {...baseProps} testReport={report} />);
    expect(html).toContain('TestReportV1');
    expect(html).toContain(result);
  });

  it('renders every optional TestReportV1 field when present', () => {
    const report: TestReportV1 = {
      contractVersion: '1.0',
      jobId: 'job-1',
      result: 'NOT_PASS',
      reason: 'EXECUTION_FAILED',
      importedId: 'wf-1',
      executionId: 'exec-1',
      evidence: 'trace-1',
    };
    const html = renderToStaticMarkup(<FactoryWorkflowModule {...baseProps} testReport={report} />);

    for (const value of ['EXECUTION_FAILED', 'wf-1', 'exec-1', 'trace-1']) {
      expect(html).toContain(value);
    }
  });

  it('does not render a public test-report section for null', () => {
    const html = renderToStaticMarkup(<FactoryWorkflowModule {...baseProps} testReport={null} />);
    expect(html).not.toContain('TestReportV1');
  });

  it.each(['completed', 'failed', 'blocked'] as const)('renders terminal status %s without inventing another status', (status) => {
    const html = renderToStaticMarkup(<FactoryWorkflowModule {...baseProps} job={job(status)} />);
    expect(html).toContain(status);
  });

  it('renders controlled recovery only for MUTATION_UNCONFIRMED state supplied by the controller', () => {
    const html = renderToStaticMarkup(
      <FactoryWorkflowModule
        {...baseProps}
        lastError={{ kind: 'network', code: 'MUTATION_UNCONFIRMED', message: 'unknown outcome' }}
        mutationUnconfirmed
      />,
    );
    expect(html).toContain('MUTATION_UNCONFIRMED');
    expect(html).toContain('Refresh status');
  });
});
