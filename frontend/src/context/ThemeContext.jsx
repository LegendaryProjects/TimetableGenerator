import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('autosched_theme_mode');
    return saved === 'light' ? 'light' : 'dark';
  });

  const [fontSize, setFontSize] = useState(() => localStorage.getItem('dbim_font_size') || 'normal');
  const [isHighContrast, setIsHighContrast] = useState(() => localStorage.getItem('dbim_high_contrast') === 'true');
  const [isInverted, setIsInverted] = useState(() => localStorage.getItem('dbim_inverted') === 'true');
  const [highlightLinks, setHighlightLinks] = useState(() => localStorage.getItem('dbim_highlight_links') === 'true');

  useEffect(() => {
    localStorage.setItem('autosched_theme_mode', theme);
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      document.body.style.backgroundColor = '#0b0f17';
      document.body.style.color = '#f8fafc';
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
      document.body.style.backgroundColor = '#f8fafc';
      document.body.style.color = '#0f172a';
    }
  }, [theme]);

  // Sync accessibility classes to documentElement
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('font-large', 'font-xlarge');
    if (fontSize === 'large') root.classList.add('font-large');
    else if (fontSize === 'xlarge') root.classList.add('font-xlarge');
    localStorage.setItem('dbim_font_size', fontSize);

    if (isHighContrast) root.classList.add('high-contrast');
    else root.classList.remove('high-contrast');
    localStorage.setItem('dbim_high_contrast', String(isHighContrast));

    if (isInverted) root.classList.add('filter-invert');
    else root.classList.remove('filter-invert');
    localStorage.setItem('dbim_inverted', String(isInverted));

    if (highlightLinks) root.classList.add('highlight-links');
    else root.classList.remove('highlight-links');
    localStorage.setItem('dbim_highlight_links', String(highlightLinks));
  }, [fontSize, isHighContrast, isInverted, highlightLinks]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const resetAccessibility = () => {
    setFontSize('normal');
    setIsHighContrast(false);
    setIsInverted(false);
    setHighlightLinks(false);
  };

  return (
    <ThemeContext.Provider value={{
      theme,
      isDark: theme === 'dark',
      isLight: theme === 'light',
      toggleTheme,
      fontSize,
      setFontSize,
      isHighContrast,
      setIsHighContrast,
      isInverted,
      setIsInverted,
      highlightLinks,
      setHighlightLinks,
      resetAccessibility
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
