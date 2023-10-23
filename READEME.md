# Styled-Modules

Empower your projects with this simple Styled-Components package that harness the power of CSS modules and CSS variables to seamlessly integrate native CSS styling while keeping the perks of readable JSX and dynamic CSS!

It supports theming, SCSS/CSS/any styling that supports CSS variables, and are built in TypeScript!

This works inherently with any React framework that supports CSS modules (including NextJS 13).

### Usage Example

`MyComponent.module.css`

```css
.header {
  width: 100%;
  height: 50px;
  background: gray;
}

.content {
  width: 100%;
  height: 100%;
  background-color: var(--backgroundColor);
}

.inheritedStyle {
  width: 250px;
  height: 250px;
  color: var(--textColor);
}
```

`MyComponent.tsx`

```tsx
import { styled } from '@rybr/styled-modules'
import styles from './MyComponent.module.css'

// Create a JSX component with a specific tag
const Container = styled.div()
const Text = styled.p()

// Create a JSX component with a custom tag
const CustomTag = styled.customtag()

// Bind to a CSS module class name
// Equivalent to <div className="header">
const Header = styled.div(styles.header)

/**
 * Create a 'div' that changes CSS depending on props passed to it
 * All CSS props are prefixed with $
 * Dynamic CSS is handled by passing in a function that takes all passed
 * props and returns an object specifying CSS variable key-value pairs
 */
const Content = styled.div<{ color: string }>(styles.content, ({ color }) => ({
  backgroundColor: color,
}))

/**
 * Inherit styling from another styled-module
 * This will inherit the prop '$color' and add the class name `.myDiv`
 * This will add the class `.inheritedStyle` and define a '$textColor' prop
 * Children classes will always override parent classes
 * Children css function returns will always override parent css function returns
 *
 * NOTE: using '$' as the tag name will inherit the same tag type as the parent component
 * You can specify a new tag type if you just want to inherit the CSS styling and CSS function.
 */
const Inherited = styled(Content).$<{ textColor: string }>(
  styles.inheritedStyle,
  ({ textColor }) => ({
  color: textColor
}))

export const MyComponent: React.FC = () => {
  const [color, setColor] = useState('blue')

  return (
    <Container>
      <Header>
        <Text>{'some text'}</Text>
        <CustomTag />
      <Header />
      <Content $color={color}>
        <button onClick={() => setColor('red')}>{'click me'}</button>
        <Inherited $color={color} $textColor={color}/>
      </Content>
    </Container>
  )
}
```

Rendered HTML

```html
// Container
<div>
  // Header
  <div class="content">
    // Text
    <p>some text</p>
    // CustomTag
    <customtag />
  </div>
  // Content
  <div class="content" style="--backgroundColor: blue">
    <button>click me</button>
    // Inherited
    <div class="inheritedStyle content" style="--textColor: blue; --backgroundColor: blue" />
  </div>
</div>
```

## Theming

Creating a theme is very important in order to maintain consistent styling within your site.

There are two helper functions which will generate sizes and color shades in steps.
Otherwise you are free to create whatever css variables you would like.

Theme CSS variables will be declared globally.

`theme.ts`

```ts
import { createCss, createHslaColorCss, createSizeCss } from '@rybr/styled-modules'

// Create 100 size steps.
// Default unit is rem
// Default step interval is 0.5 * specified unit
const sizes = createSizeCss({ prefix: 'size', steps: 10 })

// Create 100 font-size steps
// Change the step interval from 0.5rem to 0.1rem
const fontSizes = createSizeCss({ prefix: 'font-size', steps: 10, incrementBy: 0.1 })

// Create the theme object
// This creates an Object of type { [key]: `var(--${key})` }
export const theme = createCss({
  ...sizes,
  ...fontSizes,
  // create reusable font-sizes
  ...{
    'font-size-xs': fontSizes['font-size-7'],
    'font-size-sm': fontSizes['font-size-9'],
    'font-size-md': fontSizes['font-size-12'],
    'font-size-lg': fontSizes['font-size-14'],
    'font-size-xl': fontSizes['font-size-18'],
  },
  // create reusable sizes
  ...{
    'size-xs': sizes['size-7'],
    'size-sm': sizes['size-9'],
    'size-md': sizes['size-12'],
    'size-lg': sizes['size-14'],
    'size-xl': sizes['size-18'],
    'size-full': '100vw',
  },
  ...createHslaColorCss({
    prefix: 'color-white',
    steps: 10,
    hue: 0,
    saturation: 0,
    minLightness: 50,
    maxLightness: 100,
  }),
  ...createHslaColorCss({
    prefix: 'color-gray',
    steps: 10,
    hue: 202,
    saturation: 4,
  }),
})
```

You must wrap your application in a `<ThemeProvider>` and you must render the `theme` style-sheet into the `<head>` (defines all the theme CSS variables)

`layout.tsx` (NextJs 13)

```tsx
import { RenderThemeStylesheet, ThemeProvider } from '@/reusable/theme-provider'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <ThemeProvider>
        <head>
          <RenderThemeStylesheet />
        </head>
        <body>{children}</body>
      </ThemeProvider>
    </html>
  )
}
```

Since the theme provider uses React hooks you need to wrap this in a client component when using NextJs 13
`@/reusable/theme-provider`

```ts
'use client'

import { getThemeProvider } from '@rybr/styled-modules'
import { theme } from './theme'

export const themeProvider = getThemeProvider(theme, 'light')

export const ThemeProvider = themeProvider.ThemeProvider
export const RenderThemeStylesheet = themeProvider.RenderThemeStylesheet
export const themeContext = themeProvider.themeContext
export const useTheme = themeProvider.useTheme
```

Now all the theme CSS variables will be available for use in the CSS stylesheets.  
You can also now use `theme` to reference the same variables as well.

`Component.module.css`

```css
.myClass {
  width: var(--size-md);
  color: var(--color-white-5);
  height: var(--height);
}
```

`Component.tsx`

```tsx
import styles from './Component.module.css'

const MyDiv = styled.div<{ isExpanded: boolean }>(styles.myClass, ({ isExpanded }) => ({
  height: isExpanded ? theme['--size-xl'] : theme['--size-sm'],
}))
```
