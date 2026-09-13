import { createContext, useContext, useEffect, useState } from "react";


const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
	const [theme, setTheme] = useState(() => {
		// Check if user already saved a preference
		const savedTheme = localStorage.getItem('rook_theme');
		if (savedTheme) {
			return savedTheme;
		}
		// Fall back to system preference
		return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
	});

	useEffect(() => {
		const root = document.documentElement;
		if (theme === 'dark') {
			root.classList.add('dark');
		} else {
			root.classList.remove('dark');
		}
		localStorage.setItem('rook_theme', theme);
	}, [theme]);

	const toggleTheme = () => {
		setTheme((prevTheme) => (prevTheme === 'dark' ? 'light' : 'dark'));
	};

	const value = {
		theme,
		isDark: theme === 'dark',
		toggleTheme,
	};

	return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
	const context = useContext(ThemeContext);
	if (!context) {
		throw new Error('useTheme must be used within a ThemeProvider');
	}
	return context;
};