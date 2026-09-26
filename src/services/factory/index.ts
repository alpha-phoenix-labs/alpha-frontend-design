import type { FactoryService } from '@/services/factory/FactoryService.ts';
import { MockFactoryService, type MockFactoryServiceOptions } from '@/services/factory/MockFactoryService.ts';

export type { FactoryService } from '@/services/factory/FactoryService.ts';
export { MockFactoryService, type MockFactoryServiceOptions } from '@/services/factory/MockFactoryService.ts';
export type { MockFactoryScenario } from '@/mocks/factory.ts';

/** Implementation in use. Only the mock exists until an HTTP endpoint contract is agreed. */
export type FactoryServiceMode = 'mock';

/**
 * Why the mode was chosen:
 * - `baseUrlMissing`: VITE_FACTORY_API_BASE_URL is empty or unset.
 * - `httpContractOpen`: a base URL is set, but no endpoint contract exists yet (see docs/factory-contract-open.md).
 */
export type FactoryServiceModeReason = 'baseUrlMissing' | 'httpContractOpen';

/** Result of the central service selection. The base URL itself is never exposed. */
export interface FactoryServiceSelection {
  readonly mode: FactoryServiceMode;
  readonly reason: FactoryServiceModeReason;
  readonly baseUrlConfigured: boolean;
}

function readBaseUrl(): string | null {
  const raw: unknown = import.meta.env.VITE_FACTORY_API_BASE_URL;
  if (typeof raw !== 'string') {
    return null;
  }
  const trimmed = raw.trim();
  return trimmed === '' ? null : trimmed;
}

/** Determines which factory service implementation is used and why. */
export function getFactoryServiceSelection(): FactoryServiceSelection {
  const baseUrlConfigured = readBaseUrl() !== null;
  return {
    mode: 'mock',
    reason: baseUrlConfigured ? 'httpContractOpen' : 'baseUrlMissing',
    baseUrlConfigured,
  };
}

/** Creates a fresh factory service according to the central selection. */
export function createFactoryService(mockOptions: MockFactoryServiceOptions = {}): FactoryService {
  return new MockFactoryService(mockOptions);
}

let sharedService: FactoryService | null = null;

/** Shared factory service instance for the application. */
export function getFactoryService(): FactoryService {
  sharedService ??= createFactoryService();
  return sharedService;
}
