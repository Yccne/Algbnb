// Theme tokens matching web global.css exactly
export const theme = {
  colors: {
    bgMain: '#f9f9f8',
    surfaceLow: '#f3f4f3',
    surfaceLowest: '#ffffff',
    surfaceHigh: '#e7e8e7',
    surfaceHighest: '#e1e3e2',

    primary: '#005440',
    primaryContainer: '#0f6e56',
    onPrimary: '#ffffff',
    onPrimaryContainer: '#9aedcf',
    primaryFixedDim: '#84d6b9',

    secondary: '#476459',
    secondaryContainer: '#c9eadb',
    onSecondaryContainer: '#4d6b5f',

    onSurface: '#191c1c',
    onSurfaceVariant: '#3f4944',

    outline: '#6f7a74',
    outlineVariant: '#bec9c3',
    error: '#ba1a1a',
    errorContainer: '#ffdad6',
    onErrorContainer: '#93000a',
    warning: '#f59e0b',

    tertiary: '#78352b',
    tertiaryContainer: '#954c41',

    star: '#f59e0b',
    heart: '#ef4444',
  },
  fonts: {
    display: 'System', // Will use system font; Manrope not available natively
    body: 'System',
  },
  fontSize: {
    displayLg: 42,
    displayMd: 32,
    headlineMd: 24,
    titleLg: 20,
    titleMd: 18,
    bodyMd: 16,
    bodySm: 14,
    labelSm: 11,
  },
  spacing: {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
    xxl: 48,
    xxxl: 64,
  },
  radius: {
    sm: 6,
    md: 12,
    lg: 24,
    xl: 24,
    full: 9999,
  },
  shadow: {
    sm: {
      shadowColor: '#191c1c',
      shadowOpacity: 0.04,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 8,
      elevation: 1,
    },
    ambient: {
      shadowColor: '#191c1c',
      shadowOpacity: 0.06,
      shadowOffset: { width: 0, height: 20 },
      shadowRadius: 40,
      elevation: 3,
    },
    elevated: {
      shadowColor: '#005440',
      shadowOpacity: 0.06,
      shadowOffset: { width: 0, height: 12 },
      shadowRadius: 32,
      elevation: 4,
    },
  },
};
