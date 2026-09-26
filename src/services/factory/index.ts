import type { FactoryService } from '@/services/factory/FactoryService.ts';
import { HttpFactoryService } from '@/services/factory/HttpFactoryService.ts';
import { MockFactoryService, type MockFactoryServiceOptions } from '@/services/factory/MockFactoryService.ts';
import { UnavailableFactoryService } from '@/services/factory/UnavailableFactoryService.ts';

export type {
  FactoryService,
  SubmitApprovalInput,
  SubmitClarificationInput,
} from '@/services/factory/FactoryService.ts';
export { MockFactoryService, type MockFactoryServiceOptions } from '@/services/factory/MockFactoryService.ts';
export {
  HttpFactoryService,
  DEFAULT_GET_TIMEOUT_MS,
  DEFAULT_POST_TIMEOUT_MS,
  type HttpFactoryServiceOptions,
} from '@/services/factory/HttpFactoryService.ts';
export { UnavailableFactoryService, FACTORY_CONFIG_INVALID_ERROR } from '@/services/factory/UnavailableFactoryService.ts';
export type { MockFactoryScenario } from '@/mocks/factory.ts';
export { totalProductionCostMicros, type ProductionCostParts } from '@/services/factory/productionMetrics.ts';

/** Implementation in use: the mock, the orchestrator HTTP API, or a service reporting an invalid configuration. */
export type FactoryServiceMode = 'mock' | 'http' | 'unavailable';

/**
 * Why the mode was chosen:
 * - `modeUnset`: VITE_FACTORY_MODE is empty or unset (or explicitly `mock`); the mock is used.
 * - `httpConfigured`: VITE_FACTORY_MODE is `http` and VITE_FACTORY_API_BASE_URL is valid.
 * - `baseUrlInvalid`: VITE_FACTORY_MODE is `http`, but the base URL is missing or invalid.
 * - `modeUnknown`: VITE_FACTORY_MODE has an unknown value.
 */
export type FactoryServiceModeReason = 'modeUnset' | 'httpConfigured' | 'baseUrlInvalid' | 'modeUnknown';

/** Result of the central service selection. The base URL itself is never exposed. */
export interface FactoryServiceSelection {
  readonly mode: FactoryServiceMode;
  readonly reason: FactoryServiceModeReason;
  readonly baseUrlConfigured: boolean;
}

/** Environment variables read by the service selection. */
export interface FactoryEnv {
  readonly VITE_FACTORY_MODE?: string | undefined;
  readonly VITE_FACTORY_API_BASE_URL?: string | undefined;
}

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

/**
 * Validates a factory base URL: HTTPS (plain HTTP only for localhost), no credentials, no query, no hash.
 * Returns the URL without trailing slash, or null if it is invalid.
 */
export function normalizeFactoryBaseUrl(raw: string | undefined): string | null {
  const trimmed = raw?.trim() ?? '';
  if (trimmed === '' || trimmed.includes('?') || trimmed.includes('#')) {
    return null;
  }
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }
  const secure = url.protocol === 'https:' || (url.protocol === 'http:' && LOCAL_HOSTS.has(url.hostname));
  if (!secure || url.username !== '' || url.password !== '' || url.search !== '' || url.hash !== '') {
    return null;
  }
  return `${url.origin}${url.pathname}`.replace(/\/+$/, '');
}

interface FactoryConfig {
  readonly selection: FactoryServiceSelection;
  readonly baseUrl: string | null;
}

function resolveFactoryConfig(env: FactoryEnv): FactoryConfig {
  const mode = env.VITE_FACTORY_MODE?.trim() ?? '';
  const baseUrl = normalizeFactoryBaseUrl(env.VITE_FACTORY_API_BASE_URL);
  const baseUrlConfigured = (env.VITE_FACTORY_API_BASE_URL?.trim() ?? '') !== '';
  if (mode === '' || mode === 'mock') {
    return { selection: { mode: 'mock', reason: 'modeUnset', baseUrlConfigured }, baseUrl: null };
  }
  if (mode !== 'http') {
    return { selection: { mode: 'unavailable', reason: 'modeUnknown', baseUrlConfigured }, baseUrl: null };
  }
  return baseUrl === null
    ? { selection: { mode: 'unavailable', reason: 'baseUrlInvalid', baseUrlConfigured }, baseUrl: null }
    : { selection: { mode: 'http', reason: 'httpConfigured', baseUrlConfigured }, baseUrl };
}

/** Determines which factory service implementation is used and why. */
export function getFactoryServiceSelection(env: FactoryEnv = import.meta.env): FactoryServiceSelection {
  return resolveFactoryConfig(env).selection;
}

/** Creates a fresh factory service according to VITE_FACTORY_MODE. Never throws and never falls back to the mock. */
export function createFactoryService(
  mockOptions: MockFactoryServiceOptions = {},
  env: FactoryEnv = import.meta.env,
): FactoryService {
  const { selection, baseUrl } = resolveFactoryConfig(env);
  if (selection.mode === 'mock') {
    return new MockFactoryService(mockOptions);
  }
  return selection.mode === 'http' && baseUrl !== null
    ? new HttpFactoryService({ baseUrl })
    : new UnavailableFactoryService();
}

let sharedService: FactoryService | null = null;

/** Shared factory service instance for the application. */
export function getFactoryService(): FactoryService {
  sharedService ??= createFactoryService();
  return sharedService;
}
