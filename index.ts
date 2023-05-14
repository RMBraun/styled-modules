import React, { CSSProperties } from 'react'

type CSSPropertyKeys = keyof React.CSSProperties

type RawCSSProperties = {
  [K in `_${CSSPropertyKeys}`]?: K extends `_${infer CssName}`
    ? CssName extends CSSPropertyKeys
      ? CSSProperties[CssName]
      : never
    : never
}

type Props = Record<string, unknown>

type CssFunction<P extends Props = any> = (
  props: P
) => (CSSProperties & RawCSSProperties & Record<string, unknown>) | undefined

type TagNames = keyof JSX.IntrinsicElements

type CustomTag = string

type BasicElementAttributes = { id?: string; children?: React.ReactNode }

type StyledComponent<Tag extends CustomTag | TagNames, P extends { css?: Props }> = React.FC<
  P & (Tag extends TagNames ? JSX.IntrinsicElements[Tag] : BasicElementAttributes)
> & {
  className: string | undefined
  styleFunction: CssFunction
}

type Styled<Tag extends string = string, ExtendsCssProps extends { css?: Props } = {}> = {
  (classNames?: string | null | undefined | Array<string | null | undefined>): StyledComponent<
    Tag,
    ExtendsCssProps['css'] extends undefined ? {} : ExtendsCssProps
  >

  <CssProps extends Props>(
    classNames: string | null | undefined | Array<string | null | undefined>,
    styleFunction?: CssFunction<CssProps>
  ): StyledComponent<
    Tag,
    ExtendsCssProps['css'] extends undefined ? { css: CssProps } : { css: CssProps & ExtendsCssProps['css'] }
  >
}

const getMergedStyleFunction =
  (...funcs: Array<CssFunction | undefined | null>) =>
  (css?: Props): Record<string, unknown> =>
    Object.assign({}, ...funcs.map((func) => func?.(css) ?? {}))

function createdStyledComponent<T extends CustomTag | TagNames>(
  tagName: string,
  extendsFrom?: StyledComponent<any, any> | null | undefined,
  classNames?: string | Array<string | null | undefined> | null | undefined,
  styleFunction?: CssFunction | null | undefined
) {
  if (typeof tagName !== 'string') {
    throw new Error('tag name must be a string')
  }

  if (extendsFrom != null && !('styleFunction' in extendsFrom)) {
    throw new Error('can only extend from another StyledComponent')
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

  const mergedClassNames = Array.from(
    new Set(
      [extendsFrom?.className, classNames]
        .flat()
        .filter((value): value is string => typeof value === 'string')
        .flatMap((value) => value?.split(' ')?.map((value) => value.trim()))
        .filter((value) => !!value)
    )
  ).join(' ')

  const mergedStyleFunction = getMergedStyleFunction(extendsFrom?.styleFunction, styleFunction)

  const component = React.memo(
    React.forwardRef(function Styled(props: { css?: Props; className?: string; style: CSSProperties }, ref) {
      const { css, className, style, ...rest } = props

      return React.createElement(tagName, {
        ...rest,
        ref,
        className: React.useMemo(() => `${className || ''} ${mergedClassNames || ''}`.trim(), [className]),
        style: React.useMemo(
          () =>
            Object.fromEntries(
              Object.entries(mergedStyleFunction(css)).map(([key, value]) => [
                key.startsWith('_') ? key.slice(1) : `--${key}`,
                value,
              ])
            ),
          [css]
        ),
      })
    })
  ) as unknown as StyledComponent<T, any>

  component.className = mergedClassNames
  component.styleFunction = mergedStyleFunction

  return component
}

const styledProxy = <ExtendsCssProps extends { css?: Props } = {}>(
  extendsFrom?: StyledComponent<any, ExtendsCssProps>
) =>
  new Proxy(
    {},
    {
      get(_, key: string) {
        return (...args: any[]) => createdStyledComponent(key, extendsFrom, ...args)
      },
    }
  ) as {
    [K in keyof JSX.IntrinsicElements]: Styled<K, ExtendsCssProps>
  } & { [K: string]: Styled<string, ExtendsCssProps> }

const styled = new Proxy(styledProxy, {
  get(target, key: string) {
    return (...args: any[]) => target()?.[key]?.(...args)
  },
}) as typeof styledProxy & {
  [K in keyof JSX.IntrinsicElements]: Styled<K>
} & { [K: string]: Styled<string> }

export default styled
