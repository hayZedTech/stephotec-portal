"use client";

import { createTheme, ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

const theme = createTheme({
    palette: {
        primary: {
            main: "#2563eb",
        },
        secondary: {
            main: "#7c3aed",
        },
    },
    typography: {
        fontFamily: '"Ancizar Sans", sans-serif',
        fontSize: 16,
        h1: { fontSize: "3.5rem" },
        h2: { fontSize: "3rem" },
        h3: { fontSize: "2.5rem" },
        h4: { fontSize: "2rem" },
        h5: { fontSize: "1.6rem" },
        h6: { fontSize: "1.4rem" },
        body1: { fontSize: "1.125rem" },
        body2: { fontSize: "1rem" },
        caption: { fontSize: "0.9rem" },
        button: { fontSize: "1.05rem" },
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: "none",
                    fontWeight: 600,
                },
            },
        },
    },
});

export default function MuiThemeProvider({ children }) {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            {children}
        </ThemeProvider>
    );
}
