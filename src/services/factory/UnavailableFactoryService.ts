import type { ApiError, FactoryResult } from '@/types/factory/index.ts';
import type { FactoryService } from '@/services/factory/FactoryService.ts';

/** Error returned by every call of {@link UnavailableFactoryService}. */
export const FACTORY_CONFIG_INVALID_ERROR: ApiError = {
  kind: 'unknown',
  code: 'FACTORY_CONFIG_INVALID',
  message: 'Die Factory ist nicht korrekt konfiguriert (VITE_FACTORY_MODE / VITE_FACTORY_API_BASE_URL).',
};

const unavailable = <T>(): Promise<FactoryResult<T>> => Promise.resolve({ ok: false, error: FACTORY_CONFIG_INVALID_ERROR });

/** Used when the factory configuration is invalid: answers every call with `FACTORY_CONFIG_INVALID`, never falls back to the mock. */
export class UnavailableFactoryService implements FactoryService {
  readonly submitWorkflowRequest: FactoryService['submitWorkflowRequest'] = () => unavailable();
  readonly recoverWorkflowRequest: FactoryService['recoverWorkflowRequest'] = () => unavailable();
  readonly getJobStatus: FactoryService['getJobStatus'] = () => unavailable();
  readonly getGeneratedWorkflow: FactoryService['getGeneratedWorkflow'] = () => unavailable();
  readonly getTestStatus: FactoryService['getTestStatus'] = () => unavailable();
  readonly getExecutionStatus: FactoryService['getExecutionStatus'] = () => unavailable();
  readonly getHumanGateState: FactoryService['getHumanGateState'] = () => unavailable();
  readonly submitApproval: FactoryService['submitApproval'] = () => unavailable();
  readonly submitClarification: FactoryService['submitClarification'] = () => unavailable();
  readonly getProductionMetrics: FactoryService['getProductionMetrics'] = () => unavailable();
}
