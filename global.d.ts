export type Prettify<T> = {
  [K in keyof T]: T[K]
} & {}

export type UnionToIntersection<U> = U extends Record<infer I, string> ? Extract<I, string> : never

export type GetKeys<N extends number, P extends string = '', T extends string[] = []> = T['length'] extends N
  ? `${P}-${Exclude<[...T, `${T['length']}`][number], '0'>}`
  : GetKeys<N, P, [...T, `${T['length']}`]>
