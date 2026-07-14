import fs from 'fs';
import path from 'path';

export class PromptManager {
  private promptsDir: string;

  constructor(promptsDir?: string) {
    // Default directory maps to the packages/ai/prompts folder
    this.promptsDir = promptsDir || path.resolve(__dirname, '../../prompts');
  }

  getPrompt(
    agentName: string,
    promptType: 'system' | 'agent' | 'tool',
    version: string = 'v1',
  ): string {
    const filename = `${promptType}.${version}.txt`;
    const filePath = path.join(this.promptsDir, agentName, filename);

    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`Prompt template not found at: ${filePath}`);
      }
      return fs.readFileSync(filePath, 'utf-8');
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown read error';
      throw new Error(`Failed to read prompt file: ${msg}`);
    }
  }

  /**
   * Replaces placeholders in prompt templates with actual context values.
   */
  renderPrompt(template: string, context: Record<string, unknown>): string {
    let result = template;
    for (const [key, value] of Object.entries(context)) {
      const placeholder = `{{${key}}}`;
      result = result.split(placeholder).join(String(value ?? ''));
    }
    return result;
  }
}
