export type PaletteTokens = {
  primary: string
  primaryDark: string
  primarySoft: string
  primaryPressed: string
  secondary: string
  accent: string
  primaryMuted: string
  focusRing: string
}

export const PALETTES = {
  deepBlueCoral: {
    primary: '#1f5e99',
    primaryDark: '#15436e',
    primarySoft: '#78aee0',
    primaryPressed: '#0e2a46',
    secondary: '#e07a5f',
    accent: '#f9d9cf',
    primaryMuted: '#ddecf9',
    focusRing: 'rgba(21, 67, 110, 0.35)',
  },
  ferrySignalPop: {
    primary: '#166a9c',
    primaryDark: '#0f4e73',
    primarySoft: '#4da8d8',
    primaryPressed: '#0b2436',
    secondary: '#18a999',
    accent: '#c3f0e7',
    primaryMuted: '#d4eef8',
    focusRing: 'rgba(15, 78, 115, 0.3)',
  },
  evergreenMist: {
    primary: '#4a6651',
    primaryDark: '#3d5244',
    primarySoft: '#6d8875',
    primaryPressed: '#26352d',
    secondary: '#90a497',
    accent: '#dce4dd',
    primaryMuted: '#e3ebe4',
    focusRing: 'rgba(61, 82, 68, 0.28)',
  },
  pugetSoundMist: {
    primary: '#3e5e73',
    primaryDark: '#2c4351',
    primarySoft: '#6e8a9e',
    primaryPressed: '#1c2b34',
    secondary: '#90a8bd',
    accent: '#d7e2ea',
    primaryMuted: '#e4ecf2',
    focusRing: 'rgba(44, 67, 81, 0.28)',
  },
} as const satisfies Record<string, PaletteTokens>

export type PaletteName = keyof typeof PALETTES

const CSS_VARIABLE_MAP: Record<keyof PaletteTokens, string> = {
  primary: '--driveready-primary',
  primaryDark: '--driveready-primary-dark',
  primarySoft: '--driveready-primary-soft',
  primaryPressed: '--driveready-primary-pressed',
  secondary: '--driveready-secondary',
  accent: '--driveready-accent',
  primaryMuted: '--driveready-primary-muted',
  focusRing: '--driveready-focus-ring',
}

const hexToRgb = (hex: string): string | null => {
  const normalized = hex.trim().replace(/^#/, '')
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return null
  }
  const red = Number.parseInt(normalized.slice(0, 2), 16)
  const green = Number.parseInt(normalized.slice(2, 4), 16)
  const blue = Number.parseInt(normalized.slice(4, 6), 16)
  if ([red, green, blue].some((value) => Number.isNaN(value))) {
    return null
  }
  return `${red}, ${green}, ${blue}`
}

export const applyPalette = (
  palette: PaletteTokens,
  target: HTMLElement | null = typeof document !== 'undefined'
    ? document.documentElement
    : null,
): void => {
  if (!target) {
    return
  }

  Object.entries(CSS_VARIABLE_MAP).forEach(([token, cssVar]) => {
    const value = palette[token as keyof PaletteTokens]
    target.style.setProperty(cssVar, value)
  })

  const primaryRgb = hexToRgb(palette.primary)
  const secondaryRgb = hexToRgb(palette.secondary)
  const primaryDarkRgb = hexToRgb(palette.primaryDark)

  if (primaryRgb) {
    target.style.setProperty('--driveready-primary-rgb', primaryRgb)
    target.style.setProperty('--bs-primary', palette.primary)
    target.style.setProperty('--bs-primary-rgb', primaryRgb)
  }

  if (secondaryRgb) {
    target.style.setProperty('--driveready-secondary-rgb', secondaryRgb)
  }

  if (primaryDarkRgb) {
    target.style.setProperty('--driveready-primary-dark-rgb', primaryDarkRgb)
  }

  target.style.setProperty('--bs-link-color', palette.primary)
  target.style.setProperty('--bs-link-hover-color', palette.primaryDark)

  target.style.setProperty('--bs-primary-text-emphasis', palette.primaryDark)
  target.style.setProperty('--bs-primary-bg-subtle', palette.primaryMuted)
  target.style.setProperty('--bs-primary-border-subtle', palette.primarySoft)

  target.style.setProperty('--bs-focus-ring-color', palette.focusRing)
}

export const getPalette = (name: PaletteName): PaletteTokens => ({
  ...PALETTES[name],
})

export const DEFAULT_PALETTE: PaletteName = 'deepBlueCoral'
