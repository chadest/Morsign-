/**
 * International Morse Code Dictionary and Translation Utilities
 * Compliant with ITU-R M.1677-1 and standard international conventions.
 */

export const MORSE_CODE_MAP: Record<string, string> = {
  // Latin Alphabet (A-Z)
  A: '.-',
  B: '-...',
  C: '-.-.',
  D: '-..',
  E: '.',
  F: '..-.',
  G: '--.',
  H: '....',
  I: '..',
  J: '.---',
  K: '-.-',
  L: '.-..',
  M: '--',
  N: '-.',
  O: '---',
  P: '.--.',
  Q: '--.-',
  R: '.-.',
  S: '...',
  T: '-',
  U: '..-',
  V: '...-',
  W: '.--',
  X: '-..-',
  Y: '-.--',
  Z: '--..',

  // Numbers (0-9)
  '0': '-----',
  '1': '.----',
  '2': '..---',
  '3': '...--',
  '4': '....-',
  '5': '.....',
  '6': '-....',
  '7': '--...',
  '8': '---..',
  '9': '----.',

  // Punctuation and Symbols
  '.': '.-.-.-',
  ',': '--..--',
  '?': '..--..',
  "'": '.----.',
  '!': '-.-.--',
  '/': '-..-.',
  '(': '-.--.',
  ')': '-.--.-',
  '&': '.-...',
  ':': '---...',
  ';': '-.-.-.',
  '=': '-...-',
  '+': '.-.-.',
  '-': '-....-',
  '_': '..--.-',
  '"': '.-..-.',
  '$': '...-..-',
  '@': '.--.-.',
  '¿': '..-.-',
  '¡': '--...-',

  // Accented characters (ITU / European standards)
  'É': '..-..',
  'À': '.--.-',
  'È': '.-..-',
  'Ç': '-.-..',
  'Ñ': '--.--',
  'Ö': '---.',
  'Ü': '..--',
  'Ä': '.-.-',
};

// Reverse map for Morse -> Character decoding
export const REVERSE_MORSE_MAP: Record<string, string> = Object.entries(MORSE_CODE_MAP).reduce(
  (acc, [char, morse]) => {
    acc[morse] = char;
    return acc;
  },
  {} as Record<string, string>
);

/**
 * Normalizes text to uppercase and maps non-supported accents gracefully
 */
export function normalizeText(text: string): string {
  return text
    .toUpperCase()
    .replace(/[ÊË]/g, 'E')
    .replace(/[ÂÄ]/g, 'A')
    .replace(/[ÎÏ]/g, 'I')
    .replace(/[Ô]/g, 'O')
    .replace(/[ÛÙ]/g, 'U');
}

/**
 * Converts alphanumeric text into International Morse Code.
 * Words are separated by ' / ', letters separated by a single space.
 */
export function textToMorse(text: string): string {
  if (!text.trim()) return '';

  const normalized = normalizeText(text);
  const words = normalized.split(/\s+/);

  const morseWords = words.map((word) => {
    const chars = Array.from(word);
    const morseChars = chars
      .map((ch) => MORSE_CODE_MAP[ch] || '')
      .filter((m) => m.length > 0);
    return morseChars.join(' ');
  });

  return morseWords.join(' / ');
}

/**
 * Converts Morse Code back to alphanumeric text.
 * Accepts ' / ' or multiple spaces as word separators.
 */
export function morseToText(morse: string): string {
  if (!morse.trim()) return '';

  // Clean Morse string: normalize non-standard dots/dashes
  const cleanMorse = morse
    .replace(/[\u2022\u00B7\u25CF]/g, '.')
    .replace(/[\u2013\u2014\u2212_]/g, '-');

  // Split into words by ' / ' or by 3 or more spaces
  const words = cleanMorse.split(/\s*\/\s*|\s{3,}/);

  const decodedWords = words.map((word) => {
    const letters = word.trim().split(/\s+/);
    return letters
      .map((code) => REVERSE_MORSE_MAP[code] || (code ? '?' : ''))
      .join('');
  });

  return decodedWords.join(' ').trim();
}

/**
 * Checks if a string appears to be Morse Code rather than plain text
 */
export function isMorseCode(input: string): boolean {
  const trimmed = input.trim();
  if (!trimmed) return false;
  // If input contains only dots, dashes, spaces, slashes
  return /^[\.\-\s\/]+$/.test(trimmed);
}

/**
 * Timing units definition according to ITU-R (PARIS standard)
 * 1 dot = t ms
 * 1 dash = 3t ms
 * Intra-character pause (between dots/dashes in same char) = 1t ms
 * Inter-character pause (between letters) = 3t ms
 * Inter-word pause (between words) = 7t ms
 */
export interface MorseSignalUnit {
  type: 'sound' | 'silence';
  durationMs: number;
  symbol?: '.' | '-';
  charIndex?: number;
  wordIndex?: number;
}

/**
 * Calculates dot duration in milliseconds based on WPM (Words Per Minute).
 * Standard formula: PARIS = 50 dot units. Dot = 1200 / WPM.
 */
export function getDotDurationMs(wpm: number): number {
  return Math.round(1200 / Math.max(5, Math.min(60, wpm)));
}

/**
 * Generates the sequential signal timeline for audio and optical playback
 */
export function generateSignalSequence(morse: string, wpm: number): MorseSignalUnit[] {
  const dotMs = getDotDurationMs(wpm);
  const dashMs = dotMs * 3;
  const intraCharPauseMs = dotMs;
  const interCharPauseMs = dotMs * 3;
  const interWordPauseMs = dotMs * 7;

  const sequence: MorseSignalUnit[] = [];
  const words = morse.trim().split(/\s*\/\s*|\s{3,}/);

  words.forEach((word, wordIdx) => {
    const letters = word.trim().split(/\s+/).filter(Boolean);

    letters.forEach((letter, letterIdx) => {
      const symbols = Array.from(letter);

      symbols.forEach((sym, symIdx) => {
        if (sym === '.' || sym === '-') {
          sequence.push({
            type: 'sound',
            durationMs: sym === '.' ? dotMs : dashMs,
            symbol: sym,
            wordIndex: wordIdx,
            charIndex: letterIdx,
          });

          // If not the last symbol in this letter, add intra-character gap
          if (symIdx < symbols.length - 1) {
            sequence.push({
              type: 'silence',
              durationMs: intraCharPauseMs,
            });
          }
        }
      });

      // If not the last letter in this word, add inter-character gap
      if (letterIdx < letters.length - 1) {
        sequence.push({
          type: 'silence',
          durationMs: interCharPauseMs,
        });
      }
    });

    // If not the last word, add inter-word gap
    if (wordIdx < words.length - 1) {
      sequence.push({
        type: 'silence',
        durationMs: interWordPauseMs,
      });
    }
  });

  return sequence;
}
