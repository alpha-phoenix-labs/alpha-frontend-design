/** Error classification produced by the factory service layer. */
export type ApiErrorKind = 'network' | 'http' | 'invalidResponse' | 'unknown';

/** Normalised error returned by the factory service; discriminated by `kind`. */
export type ApiError =
  | {
      readonly kind: 'http';
      readonly httpStatus: number;
      readonly code: string;
      readonly message: string;
    }
  | {
      readonly kind: Exclude<ApiErrorKind, 'http'>;
      readonly code: string;
      readonly message: string;
    };
