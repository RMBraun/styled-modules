import React, { useMemo } from 'react'
type Props = Record<string, unknown>

// type MergeProps<U extends Props | undefined> = {
//   [K in U extends Props ? keyof U : never]: U extends Props ? (K extends keyof U ? U[K] : never) : never
// }

type StyledFunction<P = Props> = (props: P) => React.CSSProperties

type TagNames = keyof JSX.IntrinsicElements

type StyledComponent<Tag extends TagNames, P extends { css?: Props }> = React.FC<P & JSX.IntrinsicElements[Tag]> & {
  _styled_props: P['css']
  _styled_className: string | null | undefined
  _styled_styleFunctions: Array<StyledFunction<any>>
}

export function styled<Tag extends TagNames>(
  tagName: Tag,
  extendsFrom?: null | undefined,
  styleFunction?: null | undefined
): StyledComponent<Tag, { css?: undefined }>

export function styled<Tag extends TagNames>(
  tagName: Tag,
  extendsFrom: string | Array<string>,
  styleFunction?: null | undefined
): StyledComponent<Tag, { css?: undefined }>

export function styled<Tag extends TagNames, ExtendsCssProps extends { css?: Props }>(
  tagName: Tag,
  extendsFrom: StyledComponent<any, ExtendsCssProps>,
  styleFunction?: null | undefined
): StyledComponent<Tag, ExtendsCssProps['css'] extends undefined ? {} : ExtendsCssProps>

export function styled<CssProps extends Props, Tag extends TagNames>(
  tagName: Tag,
  extendsFrom: string | Array<string>,
  styleFunction: StyledFunction<CssProps>
): StyledComponent<Tag, { css: CssProps }>

export function styled<CssProps extends Props, Tag extends TagNames, ExtendsCssProps extends { css?: Props }>(
  tagName: Tag,
  extendsFrom: StyledComponent<any, ExtendsCssProps>,
  styleFunction: StyledFunction<CssProps>
): StyledComponent<
  Tag,
  ExtendsCssProps['css'] extends undefined ? { css: CssProps } : { css: CssProps & ExtendsCssProps['css'] }
>

export function styled<
  CssProps extends Props,
  Tag extends TagNames,
  ExtendsCssProps extends { css?: Props },
  ReturnType extends StyledComponent<
    Tag,
    ExtendsCssProps['css'] extends undefined ? { css: CssProps } : { css: CssProps & ExtendsCssProps['css'] }
  >
>(
  tagName: Tag,
  extendsFrom?: string | StyledComponent<any, ExtendsCssProps> | Array<string> | null | undefined,
  styleFunction?: StyledFunction<CssProps> | null | undefined
): ReturnType {
  const parentClassName =
    extendsFrom == null || typeof extendsFrom === 'string'
      ? extendsFrom
      : Array.isArray(extendsFrom)
      ? extendsFrom.join(' ')
      : extendsFrom._styled_className

  const parentStyleFunctions =
    extendsFrom == null ||
    typeof extendsFrom === 'string' ||
    Array.isArray(extendsFrom) ||
    extendsFrom._styled_styleFunctions == null
      ? []
      : extendsFrom?._styled_styleFunctions

  const mergedStyleFunctions = styleFunction ? [...parentStyleFunctions, styleFunction] : parentStyleFunctions

  const component = React.forwardRef(function Styled(
    { css, className, ...props }: { css?: CssProps; className?: string; style: React.CSSProperties },
    ref
  ) {
    return React.createElement(tagName, {
      ...props,
      ref,
      className: useMemo(
        () => (className && parentClassName ? `${className} ${parentClassName}` : className ?? parentClassName),
        [className]
      ),
      style: useMemo(() => css && Object.assign({}, ...mergedStyleFunctions.map((func) => func(css))), [css]),
    })
  }) as unknown as ReturnType

  // TODO might need to make this an array to hold history.. not sure if we can nest multiple times
  component._styled_className = parentClassName
  component._styled_styleFunctions = mergedStyleFunctions

  return component
}
