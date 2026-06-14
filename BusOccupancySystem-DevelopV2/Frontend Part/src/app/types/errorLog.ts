export type ErrorLogType = 'MISSING_FIELD' | 'VALIDATION_ERROR' | 'MALFORMED_JSON';

export interface ErrorLogRecord {
  id: number;
  cameraId: string | null;
  busId: number | null;
  rawPayload: string;
  errorType: ErrorLogType;
  errorMessage: string;
  endpoint: string;
  createdAt: string;
}
