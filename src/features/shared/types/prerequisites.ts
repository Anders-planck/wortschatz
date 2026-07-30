export type PrerequisiteReason =
  | "needs_vocabulary"
  | "needs_example_words"
  | "needs_gendered_nouns"
  | "generation_failed";

export class PrerequisiteError extends Error {
  reason: PrerequisiteReason;

  constructor(reason: PrerequisiteReason, message?: string) {
    super(message ?? reason);
    this.name = "PrerequisiteError";
    this.reason = reason;
  }
}

export function isPrerequisiteError(
  error: unknown,
): error is PrerequisiteError {
  return error instanceof PrerequisiteError;
}
