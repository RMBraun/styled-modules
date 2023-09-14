type Prettify<T> = {
  [K in keyof T]: T[K]
} & {}

type UnionToIntersection<U> = U extends Record<infer I, string> ? Extract<I, string> : never

type GetKeys<N extends number, P extends string = '', T extends string[] = []> = T['length'] extends N
  ? `${P}-${Exclude<[...T, `${T['length']}`][number], '0'>}`
  : GetKeys<N, P, [...T, `${T['length']}`]>

const createSizeVariables = <
  O extends {
    steps: S
    calc: (index: number) => string
    prefix: P
    values: Record<GetKeys<S, P>, string>
  },
  P extends string,
  S extends number = 100
>({
  steps = 100 as S,
  prefix,
  incrementBy = 0.25,
  units = 'rem',
  calc = ((index) => `${index * incrementBy}${units}`) as O['calc'],
}: {
  steps?: S
  prefix: P
  incrementBy?: number
  units?: string
  calc?: O['calc']
}): O => {
  return {
    steps,
    calc,
    prefix,
    values: new Proxy({} as Record<string, string>, {
      get(target, key: string) {
        return key in target || !key.startsWith(prefix)
          ? target[key]
          : (target[key] = calc(parseInt(key.split(prefix).pop() ?? '0') || 0))
      },
    }),
  } as O
}

const createHslaColorVariables = <
  O extends {
    steps: S
    calc: (index: number) => string
    prefix: P
    values: Record<GetKeys<S, P>, string>
  },
  P extends string,
  S extends number = 9
>({
  steps = 9 as S,
  prefix,
  hue,
  saturation,
  minLightness = 10,
  maxLightness = 90,
  alpha = 1,
  incrementBy = (maxLightness - minLightness) / (steps - 1),
  calc = ((index) =>
    `hsla(${hue},${saturation},${(minLightness + (index - 1) * incrementBy).toFixed(2)},${alpha})`) as O['calc'],
}: {
  steps?: S
  prefix: P
  hue: number
  saturation: number
  minLightness?: number
  maxLightness?: number
  incrementBy?: number
  alpha?: number
  calc?: O['calc']
}): O => {
  return {
    steps,
    calc,
    prefix,
    values: new Proxy({} as Record<string, string>, {
      get(target, key: string) {
        return key in target || !key.startsWith(prefix)
          ? target[key]
          : (target[key] = calc(parseInt(key.split(prefix).pop() ?? '0') || 0))
      },
    }),
  } as O
}

const createTheme = <
  R extends {
    [K in UnionToIntersection<V[number]['values']>]: `var(--${K})`
  } & {
    toCss: () => string
  },
  V extends Array<{
    steps: number
    calc: (index: number) => string
    prefix: string
    values: Record<string, string>
  }>
>(
  ...args: V
): R => {
  return new Proxy(
    {
      toCss: () =>
        args
          .flatMap(({ calc, prefix, steps }) =>
            new Array(steps).fill(null).map((_, i) => {
              const value = calc(i + 1)

              return value == null ? value : `--${prefix}-${i + 1}:${value};`
            })
          )
          .filter((x) => x)
          // Replace with empty string
          .join('\r'),
    } as Record<string, string> & { toCss: () => string },
    {
      get(target, key: string) {
        return key in target || !args.some(({ prefix }) => key.startsWith(prefix))
          ? target[key]
          : (target[key] = `var(--${key})`)
      },
    }
  ) as R
}

const color = createHslaColorVariables({
  prefix: 'sm-color-red',
  steps: 9,
  hue: 0,
  saturation: 100,
})
const sizes = createSizeVariables({ prefix: 'sm-size', steps: 5 })
const fontSizes = createSizeVariables({ prefix: 'sm-fontSize', steps: 5 })

const theme = createTheme(
  createHslaColorVariables({
    prefix: 'sm-color-red',
    steps: 9,
    hue: 0,
    saturation: 100,
  }),
  createSizeVariables({ prefix: 'sm-size', steps: 5 }),
  createSizeVariables({ prefix: 'sm-fontSize', steps: 3 })
)

// console.log(theme["sm-size-1"]);
// console.log(theme["sm-size-2"]);
// console.log(theme["sm-size-3"]);
// console.log(theme["sm-size-4"]);
// console.log(theme["sm-size-5"]);

// console.log(theme["sm-fontSize-1"]);
// console.log(theme["sm-fontSize-2"]);
// console.log(theme["sm-fontSize-3"]);
// console.log(theme["sm-fontSize-4"]);
// console.log(theme["sm-fontSize-5"]);

// console.log(theme)
console.log(theme.toCss())
