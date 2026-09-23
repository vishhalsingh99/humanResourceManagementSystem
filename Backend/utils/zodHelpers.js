import { z } from 'zod';

// z.string().min(1, msg) only applies `msg` once the string exists -- a
// missing key falls through to zod's generic "Required". This keeps the same
// custom message for both "missing" and "present but empty", matching this
// codebase's original `!value` checks.
export const requiredString = (message) => z.string({ required_error: message }).min(1, message);

// z.coerce.number() rejects NaN with its own generic "Expected number,
// received nan" message before any chained .refine()/.min() runs, so a
// missing/non-numeric value never surfaces a custom message. This validates
// via plain Number() inside a transform instead, matching the original
// `Number(value)` + `Number.isFinite` style checks used throughout the
// controllers.
export const numericId = (message) => z.union([z.string(), z.number()]).optional()
  .transform((value, ctx) => {
    const num = Number(value);
    if (!Number.isInteger(num) || num <= 0) {
      ctx.addIssue({ code: 'custom', message });
      return z.NEVER;
    }
    return num;
  });
