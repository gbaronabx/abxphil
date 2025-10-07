import { createTheme } from '@mui/material/styles';

// AkitaBox-inspired light theme with blue accents and clear table headers
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#0d6efd' }, // vivid blue
    secondary: { main: '#17a2b8' }, // teal-ish accent
    success: { main: '#4caf50' },
    background: { default: '#ffffff', paper: '#ffffff' },
    text: { primary: '#213547', secondary: '#5b6b7b' },
  },
  typography: {
    fontFamily: [
      'system-ui',
      'Avenir',
      'Helvetica',
      'Arial',
      'sans-serif',
    ].join(','),
  },
  shape: { borderRadius: 8 },
  components: {
    MuiAppBar: {
      styleOverrides: {
        colorPrimary: {
          backgroundColor: '#1f2532', // dark top bar if used
          color: '#fff',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: { backgroundColor: '#f5f7fb' },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: { fontWeight: 600, color: '#394b5a' },
      },
    },
    MuiButton: {
      styleOverrides: {
        containedPrimary: { color: '#fff' },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 6 },
      },
    },
  },
});

export default theme;

