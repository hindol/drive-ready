export type PaletteTokens = {
  primary: string
  primaryDark: string
  primarySoft: string
  secondary: string
  accent: string
  primaryMuted: string
}

export const PALETTES = {
  ferrySignalPop: {
    primary: '#166a9c',
    primaryDark: '#0f4e73',
    primarySoft: '#4da8d8',
    secondary: '#18a999',
    accent: '#c3f0e7',
    primaryMuted: '#d4eef8',
  },
  evergreenMist: {
    primary: '#4a6651',
    primaryDark: '#3d5244',
    primarySoft: '#6d8875',
    secondary: '#90a497',
    accent: '#dce4dd',
    primaryMuted: '#e3ebe4',
  },
  pugetSoundMist: {
    primary: '#3e5e73',
    primaryDark: '#2c4351',
    primarySoft: '#6e8a9e',
    secondary: '#90a8bd',
    accent: '#d7e2ea',
    primaryMuted: '#e4ecf2',
  },
} as const satisfies Record<string, PaletteTokens>

export type PaletteName = keyof typeof PALETTES

const CSS_VARIABLE_MAP: Record<keyof PaletteTokens, string> = {
  primary: '--driveready-primary',
  primaryDark: '--driveready-primary-dark',
  primarySoft: '--driveready-primary-soft',
  secondary: '--driveready-secondary',
  accent: '--driveready-accent',
  primaryMuted: '--driveready-primary-muted',
}

export const applyPalette = (
  palette: PaletteTokens,
  target: HTMLElement | null = typeof document !== 'undefined' ? document.documentElement : null,
): void => {
  if (!target) {
    return
  }
  Object.entries(CSS_VARIABLE_MAP).forEach(([token, cssVar]) => {
    const value = palette[token as keyof PaletteTokens]
    target.style.setProperty(cssVar, value)
  })
}

export const getPalette = (name: PaletteName): PaletteTokens => ({ ...PALETTES[name] })

export const DEFAULT_PALETTE: PaletteName = 'ferrySignalPop'
