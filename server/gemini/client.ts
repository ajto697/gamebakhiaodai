/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Server-side Gemini Client using modern @google/genai SDK
 */

import { GoogleGenAI } from '@google/genai';

export const GEMINI_MODEL = 'gemini-3.8-flash';

export function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    return null;
  }

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}
