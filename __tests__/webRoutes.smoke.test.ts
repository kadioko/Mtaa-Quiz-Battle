/**
 * Smoke test – web routing (expo-router file-based routes)
 *
 * Verifies that every expected route file exists on disk.
 * This catches accidental file deletions or renames that would silently
 * break navigation without a TypeScript error.
 */
import { existsSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(__dirname, '..');

const EXPECTED_ROUTES = [
  'app/index.tsx',
  'app/home.tsx',
  'app/categories.tsx',
  'app/quiz.tsx',
  'app/result.tsx',
  'app/leaderboard.tsx',
  'app/profile.tsx',
  'app/settings.tsx',
  'app/daily.tsx',
  'app/_layout.tsx',
];

const EXPECTED_SRC = [
  'src/data/questions.ts',
  'src/data/categories.ts',
  'src/storage/storage.ts',
  'src/utils/gameLogic.ts',
  'src/utils/i18n.ts',
  'src/utils/ThemeContext.tsx',
  'src/utils/LanguageContext.tsx',
  'src/types/index.ts',
];

describe('Web route file smoke tests', () => {
  EXPECTED_ROUTES.forEach((relativePath) => {
    test(`route file exists: ${relativePath}`, () => {
      expect(existsSync(resolve(ROOT, relativePath))).toBe(true);
    });
  });
});

describe('Core source file smoke tests', () => {
  EXPECTED_SRC.forEach((relativePath) => {
    test(`source file exists: ${relativePath}`, () => {
      expect(existsSync(resolve(ROOT, relativePath))).toBe(true);
    });
  });
});

describe('Asset smoke tests', () => {
  const EXPECTED_ASSETS = [
    'assets/icon.png',
    'assets/splash.png',
    'assets/adaptive-icon.png',
    'assets/favicon.png',
  ];
  EXPECTED_ASSETS.forEach((relativePath) => {
    test(`asset exists: ${relativePath}`, () => {
      expect(existsSync(resolve(ROOT, relativePath))).toBe(true);
    });
  });
});
