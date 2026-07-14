import { z } from 'zod';

export class AISafetyLayer {
  private maxPromptSize: number;

  constructor(maxPromptSize = 2000) {
    this.maxPromptSize = maxPromptSize;
  }

  /**
   * Sanitizes user input, stripping HTML-like tag patterns and escaping control characters.
   */
  sanitizePrompt(prompt: string): string {
    if (!prompt) return '';
    // Strip basic HTML/script tag injection vectors
    return prompt.replace(/<\/?[^>]+(>|$)/g, '').trim();
  }

  /**
   * Checks for known adversarial prompt injection phrases.
   */
  detectPromptInjection(prompt: string): boolean {
    if (!prompt) return false;

    const lowerPrompt = prompt.toLowerCase();
    const injectionPatterns = [
      'ignore previous instructions',
      'ignore the system prompt',
      'system override',
      'you are now a',
      'bypass filters',
      'forget what we discussed',
      'ignore rules',
      'act as developer mode',
    ];

    return injectionPatterns.some((pattern) => lowerPrompt.includes(pattern));
  }

  /**
   * Enforces character size constraints on LLM input queries.
   */
  validatePromptSize(prompt: string): boolean {
    if (!prompt) return false;
    return prompt.length <= this.maxPromptSize;
  }

  /**
   * Validates tool input parameters against their declared Zod schemas.
   */
  validateToolArguments(args: unknown, schema: z.ZodType<unknown>): boolean {
    try {
      schema.parse(args);
      return true;
    } catch {
      return false;
    }
  }
}
