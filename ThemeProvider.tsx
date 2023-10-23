import React from 'react'
import { CreateCss } from './theme'

export const getThemeProvider = <C extends CreateCss<any>>(css: C, defaultThemeId: C['themeIds'][number]) => {
  const themeContext = React.createContext<{
    themeId: C['themeIds'][number]
    css: C
    isLoading: boolean
    setThemeId: React.Dispatch<React.SetStateAction<C['themeIds'][number]>>
  }>({
    themeId: defaultThemeId,
    css,
    isLoading: true,
    setThemeId: () => {},
  })

  const ThemeProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
    const [themeId, setThemeId] = React.useState<C['themeIds'][number]>(defaultThemeId)

    return (
      <themeContext.Provider value={{ themeId, css, isLoading: false, setThemeId }}>{children}</themeContext.Provider>
    )
  }

  const useTheme = () => {
    const { themeId, css, setThemeId } = React.useContext(themeContext)

    return {
      themeId,
      css,
      setThemeId,
    }
  }

  const RenderThemeStylesheet: React.FC = () => {
    const { themeId } = React.useContext(themeContext)

    const renderedCssString = React.useMemo(() => css.toCssString(themeId), [themeId])

    return <style>{renderedCssString ?? ''}</style>
  }

  return {
    themeContext,
    ThemeProvider,
    RenderThemeStylesheet,
    useTheme,
  }
}
