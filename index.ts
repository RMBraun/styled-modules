import React, { useMemo } from 'react'

type Props = Record<string, unknown>

type StyledFunction<P = Props> = (
  props: P
) => React.CSSProperties | (React.CSSProperties & Record<string, unknown>) | undefined

type TagNames = keyof JSX.IntrinsicElements

type CustomTag = string

type BasicElementAttributes = { id?: string; children?: React.ReactNode }

type StyledComponent<Tag extends CustomTag | TagNames, P extends { css?: Props }> = React.FC<
  P & (Tag extends TagNames ? JSX.IntrinsicElements[Tag] : BasicElementAttributes)
> & {
  className: string | undefined
  styleFunction: StyledFunction<any>
}

type Styled<Tag extends string = CustomTag> = {
  (): StyledComponent<Tag, {}>

  (extendsFrom: string | Array<string | null | undefined>): StyledComponent<Tag, { css?: undefined }>

  <ExtendsCssProps extends { css?: Props }>(extendsFrom: StyledComponent<any, ExtendsCssProps>): StyledComponent<
    Tag,
    ExtendsCssProps['css'] extends undefined ? {} : ExtendsCssProps
  >

  <CssProps extends Props>(
    extendsFrom: string | Array<string | null | undefined>,
    styleFunction: StyledFunction<CssProps>
  ): StyledComponent<Tag, { css: CssProps }>

  <CssProps extends Props, ExtendsCssProps extends { css?: Props }>(
    extendsFrom: StyledComponent<any, ExtendsCssProps>,
    styleFunction: StyledFunction<CssProps>
  ): StyledComponent<
    Tag,
    ExtendsCssProps['css'] extends undefined ? { css: CssProps } : { css: CssProps & ExtendsCssProps['css'] }
  >

  <CssProps extends Props, ExtendsCssProps extends { css?: Props }>(
    extendsFrom?: string | StyledComponent<any, ExtendsCssProps> | Array<string | null | undefined> | null | undefined,
    styleFunction?: StyledFunction<CssProps> | null | undefined
  ): StyledComponent<
    Tag,
    ExtendsCssProps['css'] extends undefined ? { css: CssProps } : { css: CssProps & ExtendsCssProps['css'] }
  >
}

export const css = (chunks: Array<string>, ...args: Array<string>) =>
  chunks
    .reduce((acc, chunk, i) => (acc ?? '') + (chunk ?? '') + (args[i] ?? ''), '')
    .split(';')
    .map((chunk) =>
      chunk
        .split(':')
        .map((value) => value.trim())
        .join(':')
    )
    .join(';')

export default new Proxy(
  function (
    tagName: string,
    extendsFrom?: string | StyledComponent<any, any> | Array<string | null | undefined> | null | undefined,
    styleFunction?: StyledFunction<any> | null | undefined
  ) {
    if (typeof tagName !== 'string') {
      throw new Error('tagName must be a valid JSX element tag name')
    }

    if (
      extendsFrom != null &&
      typeof extendsFrom !== 'string' &&
      !(Array.isArray(extendsFrom) && extendsFrom.every((value) => value == null || typeof value === 'string')) &&
      !('styleFunction' in extendsFrom)
    ) {
      throw new Error('extendsFrom must be a String, StyledComponent, or Array<String>')
    }

    if (styleFunction != null && typeof styleFunction !== 'function') {
      throw new Error('styleFunction must be a function that returns React.CSSProperties')
    }

    const parentClassName =
      extendsFrom == null
        ? undefined
        : typeof extendsFrom === 'string'
        ? extendsFrom.trim()
        : Array.isArray(extendsFrom)
        ? Array.from(
            new Set(
              extendsFrom.flatMap((value) => value?.split(' ')?.map((value) => value.trim())).filter((value) => !!value)
            )
          ).join(' ')
        : extendsFrom.className

    const parentStyleFunction =
      extendsFrom == null ||
      typeof extendsFrom === 'string' ||
      Array.isArray(extendsFrom) ||
      extendsFrom.styleFunction == null
        ? null
        : extendsFrom.styleFunction

    const mergedStyleFunction = (css?: Props) =>
      css == null ? undefined : Object.assign({}, parentStyleFunction?.(css) ?? {}, styleFunction?.(css) ?? {})

    const component = React.forwardRef(function Styled(
      props: { css?: Props; className?: string; style: React.CSSProperties },
      ref
    ) {
      const { css, className, style, ...rest } = props

      return React.createElement(tagName, {
        ...rest,
        ref,
        className: useMemo(() => `${className || ''} ${parentClassName || ''}`.trim(), [className]),
        style: useMemo(() => mergedStyleFunction(css), [css]),
      })
    }) as unknown as StyledComponent<string, any>

    component.className = parentClassName
    component.styleFunction = mergedStyleFunction

    return component
  },
  {
    get(target, key) {
      return (...args: any[]) => target(key.toString(), ...args)
    },
  }
) as unknown as {
  [K in keyof JSX.IntrinsicElements]: Styled<K>
} & { [K: string]: Styled }
