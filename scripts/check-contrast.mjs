const palettes = {
  dark: {
    primary: '#F5A623',
    secondary: '#1DB954',
    accent: '#E63946',
    background: '#0F0F23',
    backgroundCard: '#1A1A35',
    backgroundCardLight: '#252545',
    text: '#FFFFFF',
    textSecondary: '#B0B8D4',
    correct: '#1DB954',
    wrong: '#E63946',
    timerLow: '#FF6B6B',
    borderLight: '#3A3A5A',
    black: '#000000',
    gold: '#FFD700',
  },
  light: {
    primary: '#F5A623',
    secondary: '#1DB954',
    accent: '#E63946',
    background: '#F7F8FC',
    backgroundCard: '#FFFFFF',
    backgroundCardLight: '#EEF2F8',
    text: '#111827',
    textSecondary: '#4B5563',
    correct: '#1DB954',
    wrong: '#E63946',
    timerLow: '#B91C1C',
    borderLight: '#C8D1E1',
    black: '#111827',
    gold: '#8A6100',
  },
};

const toLinear = (value) => {
  const channel = value / 255;
  return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
};

const luminance = (hex) => {
  const [r, g, b] = hex
    .replace('#', '')
    .match(/../g)
    .map((part) => toLinear(parseInt(part, 16)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrastRatio = (foreground, background) => {
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
};

const checks = (colors) => ({
  text_on_background: [colors.text, colors.background],
  secondary_text_on_card: [colors.textSecondary, colors.backgroundCard],
  disabled_text_on_disabled_button: [colors.text, colors.borderLight],
  primary_button_text: [colors.black, colors.primary],
  correct_answer_state: ['#000000', colors.correct],
  wrong_answer_state: ['#000000', colors.wrong],
  timeout_badge_on_card: [colors.timerLow, colors.backgroundCardLight],
  gold_score_on_card: [colors.gold, colors.backgroundCard],
});

let failed = false;

for (const [themeName, colors] of Object.entries(palettes)) {
  for (const [name, [foreground, background]] of Object.entries(checks(colors))) {
    const ratio = contrastRatio(foreground, background);
    if (ratio < 4.5) {
      failed = true;
      console.error(`${themeName}.${name} contrast ${ratio.toFixed(2)} is below 4.5:1`);
    }
  }
}

if (failed) {
  process.exit(1);
}

console.log('Contrast validation passed for dark and light theme UI states.');
