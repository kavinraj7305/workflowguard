"use client";

import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import type { PropsWithChildren } from "react";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#22d3ee",
    },
    secondary: {
      main: "#f59e0b",
    },
    background: {
      default: "#020617",
      paper: "rgba(15, 23, 42, 0.92)",
    },
  },
  shape: {
    borderRadius: 18,
  },
  typography: {
    fontFamily: ["var(--font-geist-sans)", "Arial", "Helvetica", "sans-serif"].join(","),
    h1: {
      fontWeight: 800,
      letterSpacing: "-0.04em",
    },
    h2: {
      fontWeight: 700,
      letterSpacing: "-0.03em",
    },
    button: {
      textTransform: "none",
      fontWeight: 700,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          paddingInline: 18,
          paddingBlock: 10,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: "filled",
        fullWidth: true,
      },
    },
    MuiFilledInput: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          backgroundColor: "rgba(15, 23, 42, 0.68)",
        },
      },
    },
  },
});

export function AppThemeProvider({ children }: PropsWithChildren) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
