import React from "react";
import { createTheme } from "@mui/material/styles";
import {
  Link as RouterLink,
  LinkProps as RouterLinkProps,
} from "react-router-dom";
import { LinkProps } from "@mui/material/Link";

const LinkBehavior = React.forwardRef<
  HTMLAnchorElement,
  Omit<RouterLinkProps, "to"> & { href: RouterLinkProps["to"] }
>((props, ref) => {
  const { href, ...other } = props;
  // Map href (MUI) -> to (react-router)
  return <RouterLink ref={ref} to={href} {...other} />;
});

export default createTheme({
  typography: {
    h6: {
      fontSize: "1.1rem",
    },
  },
  components: {
    MuiLink: {
      defaultProps: {
        component: LinkBehavior,
      } as LinkProps,
    },
    MuiTooltip: {
      styleOverrides: {
        arrow: {
          color: "#070415",
        },
        popper: {
          padding: 4,
        },
        tooltip: {
          color: "white",
          backgroundColor: "#070415",
          fontSize: 14,
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: 14,
          color: "white",
          opacity: 0.4,
          "&.Mui-focused": {
            color: "white",
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        select: {
          backgroundColor: "#14141b",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          backgroundColor: "#14141b", // Customize the background color for TextFields
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        input: {
          color: "white",
          fontSize: 14,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        standardWarning: {
          backgroundColor: "#b75c22",
          color: "white",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        colorWarning: {
          backgroundColor: "#b75c22",
          color: "white",
        },
      },
    },
  },
  palette: {
    primary: {
      main: "#000000",
      light: "#14141b",
      dark: "#0f0f0f",
    },
    secondary: {
      main: "#d135ef",
      light: "#c895cd",
      dark: "#491f72",
    },
    error: {
      main: "#c5394f",
      light: "#d8657d",
      dark: "#8c2b44",
    },
    warning: {
      main: "#ffd54f", // Pastel yellow
      light: "#ffee58",
      dark: "#fbc02d",
    },
    info: {
      main: "#f0f0f0",
      light: "#c9c9c9",
      dark: "#4f4f4f",
    },
    success: {
      main: "#81c784", // Pastel green
      light: "#a5d6a7",
      dark: "#4caf50",
    },
    container: {},
  },
  breakpoints: {
    values: {
      xs: 320,
      sm: 384,
      md: 670,
      lg: 1024,
      xl: 1368,
    },
  },
});
