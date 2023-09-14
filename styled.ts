import React, { CSSProperties } from 'react'

const CSS_PROP_PREFIX = '$' as const
type CSS_PROP_PREFIX = typeof CSS_PROP_PREFIX

const EXTENDS_TAGNAME = '$' as const
type EXTENDS_TAGNAME = typeof CSS_PROP_PREFIX

type Prettify<T> = {
  [K in keyof T]: T[K]
} & {}

type Props = Record<string, unknown>

type MergeProps<P1 extends Props | undefined, P2 extends Props | undefined> = Prettify<
  P1 extends undefined ? (P2 extends undefined ? {} : P2) : P2 extends undefined ? P1 : P1 & Omit<P2, keyof P1>
>

type CssValue<K extends keyof CSSProperties> =
  | CSSProperties[K]
  | string
  | number
  | null
  | undefined
  | Record<string, CSSProperties[K] | string | number | null | undefined>

type CssFunction<P extends Props | undefined = any> = (props: P) =>
  | ({
      [K in keyof CSSProperties]?: CssValue<K>
    } & {
      [K in keyof CSSProperties as `_${K}`]?: CssValue<K>
    } & Record<string, string | number | null | undefined | Record<string, string | number | null | undefined>>)
  | undefined

type TagNames = keyof JSX.IntrinsicElements

type Tags = string | TagNames

type BasicElementAttributes = { id?: string; children?: React.ReactNode }

type StyledComponentHiddenProps = {
  tagName: string
  className: string | undefined
  styleFunction: CssFunction
}

type StyledComponent<Tag extends Tags, P extends Props> = React.FC<
  {
    [K in keyof P as `$${K & string}`]: P[K]
  } & (Tag extends TagNames ? JSX.IntrinsicElements[Tag] : BasicElementAttributes)
> &
  StyledComponentHiddenProps

type Styled<Tag extends string = string, ExtendsCssProps extends Props | undefined = undefined> = {
  (classNames?: string | null | undefined | Array<string | null | undefined>): StyledComponent<
    Tag,
    ExtendsCssProps extends undefined ? {} : ExtendsCssProps
  >

  <CssProps extends ExtendsCssProps extends Props ? { [K in keyof ExtendsCssProps]?: never } & Props : Props>(
    classNames: string | null | undefined | Array<string | null | undefined>,
    styleFunction?: CssFunction<MergeProps<ExtendsCssProps, CssProps>>
  ): StyledComponent<Tag, MergeProps<ExtendsCssProps, CssProps>>
}

const cleanCssPropKey = (key: string) => (key.startsWith('_') ? key.slice(1) : `--${key}`)

const getMergedStyleFunction =
  (...funcs: Array<CssFunction | undefined | null>) =>
  (css?: Props): Record<string, unknown> =>
    Object.assign({}, ...funcs.map((func) => func?.(css ?? {}) ?? {}))

const mergeClassNames = (...args: Array<string | null | undefined | Array<string | null | undefined>>): string =>
  Array.from(
    new Set(
      args
        .flat()
        .filter((value): value is string => typeof value === 'string')
        .flatMap((value) =>
          value
            ?.trim()
            ?.split(' ')
            ?.map((value) => value.trim())
        )
        .filter((value) => !!value)
    )
  ).join(' ')

const getTagName = (tagName: string, extendsFrom?: StyledComponent<any, any> | null): string =>
  tagName === EXTENDS_TAGNAME && extendsFrom?.tagName ? extendsFrom.tagName : tagName

function createdStyledComponent<T extends Tags>(
  tagName: string,
  extendsFrom: StyledComponent<any, any> | null = null,
  classNames?: string | Array<string | null | undefined> | null | undefined,
  styleFunction?: CssFunction | null | undefined
) {
  if (typeof tagName !== 'string') {
    throw new Error('tag name must be a string')
  }

  if (extendsFrom != null && extendsFrom.styleFunction == null) {
    throw new Error(`Can only extend from a StyledComponent: ${extendsFrom.name}`)
  }

  if (tagName === EXTENDS_TAGNAME && extendsFrom == null) {
    throw new Error(`"${EXTENDS_TAGNAME}" tag name can only be used while extending from a StyledComponent`)
  }

  if (
    classNames != null &&
    typeof classNames !== 'string' &&
    !(Array.isArray(classNames) && classNames.every((value) => value == null || typeof value === 'string'))
  ) {
    throw new Error('classNames must be a string or an array of strings')
  }

  if (styleFunction != null && typeof styleFunction !== 'function') {
    throw new Error('styleFunction must be a function that returns CSSProperties')
  }

  const mergedClassNames = mergeClassNames(extendsFrom?.className, classNames)

  const derivedTagName = getTagName(tagName, extendsFrom)

  const mergedStyleFunction = getMergedStyleFunction(extendsFrom?.styleFunction, styleFunction)

  const component = React.memo(
    React.forwardRef(function Styled(
      { children, ...props }: Props & { className?: string; style?: CSSProperties; children?: React.ReactNode },
      ref
    ) {
      const formattedProps = Object.fromEntries(
        Object.entries(props).map(([key, value]) => [key.startsWith(CSS_PROP_PREFIX) ? key.slice(1) : key, value])
      )

      const rawStyleObject = mergedStyleFunction(formattedProps)

      const formattedStyleObject = Object.fromEntries(
        Object.entries(rawStyleObject).flatMap(([key, value]) => {
          const formattedKey = cleanCssPropKey(key)

          return value == null || value == ''
            ? []
            : typeof value === 'object'
            ? Object.entries(value).map(([subKey, subValue]) => [
                subKey === 'base' ? formattedKey : `${formattedKey}_${subKey}`,
                subValue,
              ])
            : [[formattedKey, value]]
        })
      )

      const sanitizedProps = Object.fromEntries(
        Object.entries(props).filter(([key]) => !key.startsWith(CSS_PROP_PREFIX))
      )

      const mergedProps = {
        ...sanitizedProps,
        ref,
        className: `${props.className || ''} ${mergedClassNames || ''}`.trim() || null,
        style: Object.assign(formattedStyleObject, props.style ?? {}),
        children,
      }

      return React.createElement(derivedTagName, mergedProps)
    })
  ) as unknown as StyledComponent<T, any>

  component.tagName = derivedTagName
  component.className = mergedClassNames
  component.styleFunction = mergedStyleFunction as CssFunction
  component.displayName = `Styled_${extendsFrom?.name ?? derivedTagName}`

  return component
}

const styledProxy = <ExtendsCssProps extends Props, Tag extends TagNames | string = string>(
  extendsFrom?: StyledComponent<Tag, ExtendsCssProps>
) =>
  new Proxy(
    {},
    {
      get(_, tagName: string) {
        return (...args: any[]) => createdStyledComponent(tagName, extendsFrom, ...args)
      },
    }
  ) as {
    [K in keyof JSX.IntrinsicElements]: Styled<K, ExtendsCssProps>
  } & { [K in EXTENDS_TAGNAME]: Styled<Tag, ExtendsCssProps> } & { [K: string]: Styled<typeof K, ExtendsCssProps> }

export const styled = new Proxy(styledProxy, {
  get(target, key: string) {
    return (...args: any[]) => target()?.[key]?.(...args)
  },
}) as typeof styledProxy & {
  [K in keyof JSX.IntrinsicElements]: Styled<K>
} & { [K: string]: Styled<string> }

export type StyledProps<T extends StyledComponent<any, any>> = Parameters<T>[0]
