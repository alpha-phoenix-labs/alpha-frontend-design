import { describe, expect, it } from 'vitest';
import {
  HttpFactoryService,
  MockFactoryService,
  UnavailableFactoryService,
  createFactoryService,
  getFactoryServiceSelection,
  normalizeFactoryBaseUrl,
} from '@/services/factory/index.ts';

describe('factory service selection', () => {
  it('missing mode selects the mock', () => {
    expect(createFactoryService({}, {})).toBeInstanceOf(MockFactoryService);
    expect(createFactoryService({}, { VITE_FACTORY_MODE: '', VITE_FACTORY_API_BASE_URL: 'https://x.test' })).toBeInstanceOf(
      MockFactoryService,
    );
    expect(getFactoryServiceSelection({})).toEqual({ mode: 'mock', reason: 'modeUnset', baseUrlConfigured: false });
  });

  it('http mode with a valid URL selects the HTTP service', () => {
    const env = { VITE_FACTORY_MODE: 'http', VITE_FACTORY_API_BASE_URL: 'https://factory.example.test/' };
    expect(createFactoryService({}, env)).toBeInstanceOf(HttpFactoryService);
    expect(getFactoryServiceSelection(env)).toEqual({ mode: 'http', reason: 'httpConfigured', baseUrlConfigured: true });
  });

  it('http mode without URL answers every call with FACTORY_CONFIG_INVALID', async () => {
    const service = createFactoryService({}, { VITE_FACTORY_MODE: 'http' });
    expect(service).toBeInstanceOf(UnavailableFactoryService);
    const error = { kind: 'unknown', code: 'FACTORY_CONFIG_INVALID' };
    expect(await service.getJobStatus('job-1')).toMatchObject({ ok: false, error });
    expect(await service.submitApproval({ jobId: 'job-1', version: 1, approve: true })).toMatchObject({ ok: false, error });
    expect(await service.submitClarification({ jobId: 'job-1', response: 'x' })).toMatchObject({ ok: false, error });
    expect(getFactoryServiceSelection({ VITE_FACTORY_MODE: 'http' }).reason).toBe('baseUrlInvalid');
  });

  it('unknown mode is unavailable, never the mock', () => {
    expect(createFactoryService({}, { VITE_FACTORY_MODE: 'live', VITE_FACTORY_API_BASE_URL: 'https://x.test' })).toBeInstanceOf(
      UnavailableFactoryService,
    );
  });
});

describe('normalizeFactoryBaseUrl', () => {
  it.each([
    ['https://factory.example.test', 'https://factory.example.test'],
    ['https://factory.example.test/', 'https://factory.example.test'],
    ['https://factory.example.test/base//', 'https://factory.example.test/base'],
    ['http://localhost:8787/', 'http://localhost:8787'],
    ['http://127.0.0.1:8787', 'http://127.0.0.1:8787'],
  ])('accepts %s', (raw, expected) => {
    expect(normalizeFactoryBaseUrl(raw)).toBe(expected);
  });

  it.each([
    [undefined],
    [''],
    ['not a url'],
    ['http://factory.example.test'],
    ['ftp://factory.example.test'],
    ['https://user:pass@factory.example.test'],
    ['https://factory.example.test/?a=1'],
    ['https://factory.example.test/?'],
    ['https://factory.example.test/#x'],
  ])('rejects %s', (raw) => {
    expect(normalizeFactoryBaseUrl(raw)).toBeNull();
  });
});
