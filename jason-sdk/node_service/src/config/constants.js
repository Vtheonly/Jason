export const PRESENTATION_DIMENSIONS = {
  RATIO_16_9: {
    width_inches: 13.333,
    height_inches: 7.5,
    width_emu: 12192000,
    height_emu: 6858000
  },
  RATIO_4_3: {
    width_inches: 10.0,
    height_inches: 7.5,
    width_emu: 9144000,
    height_emu: 6858000
  }
};

export const COLOR_TOKENS = {
  LIGHT_BG: '#FFFFFF',
  DARK_BG: '#121212',
  FALLBACK_PRIMARY: '#003366',
  FALLBACK_SECONDARY: '#4682B4',
  FALLBACK_ACCENT: '#FFBF00'
};

export const TYPOGRAPHY_DEFAULTS = {
  HEADING_FONT: 'Arial',
  BODY_FONT: 'Calibri',
  CODE_FONT: 'Consolas',
  SIZES: {
    TITLE: 40,
    SUBTITLE: 24,
    HEADING_1: 28,
    HEADING_2: 20,
    BODY: 14,
    CAPTION: 10,
    CODE: 11
  }
};

export const LIMITS = {
  MAX_SLIDE_COUNT: 100,
  MAX_BULLETS_PER_SLIDE: 8,
  OVERCROWD_WORD_THRESHOLD: 120
};