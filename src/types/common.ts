export type ApiEnvelope<T = unknown> = {
  success: boolean;
  error: boolean;
  errors: Record<string, string[]> | string[] | string | Record<string, unknown> | [];
  data: T | [];
  message: string;
};
