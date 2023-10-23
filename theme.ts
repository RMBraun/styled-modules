// type UnionToIntersection<U> = U extends Record<infer I, string> ? Extract<I, string> : never

type GetKeys<N extends number, P extends string = '', T extends string[] = []> = T['length'] extends N
  ? `${P}-${Exclude<[...T, `${T['length']}`][number], '0'>}`
  : GetKeys<N, P, [...T, `${T['length']}`]>

export const createSizeCss = <O extends Record<GetKeys<S, P>, string>, P extends string, S extends number = 100>({
  steps = 100 as S,
  prefix,
  incrementBy = 0.25,
  units = 'rem',
  calc = (index) => `${(index * incrementBy).toFixed(2)}${units}`,
}: {
  steps?: S
  prefix: P
  incrementBy?: number
  units?: string
  calc?: (index: number) => string
}): O => {
  return Object.fromEntries(
    Array(steps)
      .fill(null)
      .map((_, i) => [`${prefix}-${i + 1}`, calc(i + 1)])
  ) as unknown as O
}

export const createHslaColorCss = <O extends Record<GetKeys<S, P>, string>, P extends string, S extends number = 9>({
  steps = 9 as S,
  prefix,
  hue,
  saturation,
  minLightness = 10,
  maxLightness = 90,
  alpha = 1,
  incrementBy = (maxLightness - minLightness) / (steps - 1),
  calc = (index) => `hsla(${hue},${saturation}%,${(minLightness + (index - 1) * incrementBy).toFixed(2)}%,${alpha})`,
}: {
  steps?: S
  prefix: P
  hue: number
  saturation: number
  minLightness?: number
  maxLightness?: number
  incrementBy?: number
  alpha?: number
  calc?: (index: number) => string
}): O => {
  return Object.fromEntries(
    Array(steps)
      .fill(null)
      .map((_, i) => [`${prefix}-${i + 1}`, calc(i + 1)])
  ) as unknown as O
}

export const createCss = <
  GlobalCss extends Record<string, string>,
  ThemeKeys extends string,
  R extends {
    [K in Extract<keyof GlobalCss | ThemeCssKeys, string>]: `var(--${K})`
  } & {
    themeIds: ThemeKeys[]
    toCssString: (theme?: ThemeKeys) => string
  },
  ThemeCssKeys extends string = never
>(
  globalCss: GlobalCss,
  themeCss: Record<ThemeKeys, { [J in ThemeCssKeys]: string }> = {} as Record<
    ThemeKeys,
    { [J in ThemeCssKeys]: string }
  >
): R => {
  const globalCssKeys = Object.keys(globalCss)
  const themeCssKeys = [
    ...new Set(Object.values(themeCss).flatMap((theme) => Object.keys(theme as {}) as unknown as ThemeCssKeys)),
  ]

  return {
    ...Object.fromEntries([...new Set([...globalCssKeys, ...themeCssKeys])].map((key) => [key, `var(--${key})`])),
    themeIds: themeCssKeys,
    toCssString: (theme: ThemeKeys) => {
      return `:root{${[
        ...globalCssKeys.map((key) => `--${key}:${globalCss[key]};`),
        ...themeCssKeys.map((key) => themeCss?.[theme]?.[key] && `--${key}:${themeCss[theme][key]};`),
      ]
        .filter((x) => x)
        .join('')}}`
    },
  } as unknown as R
}

export type CreateCss<T extends string> = {
  themeIds: string[]
  toCssString: (theme?: T) => string
}
