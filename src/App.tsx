import React from 'react';
import { Container, Typography, Paper, ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { BOMComparisonWrapper } from './components/BOMComparisonWrapper';

// Create a custom Material-UI theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  components: {
    MuiPaper: {
      defaultProps: {
        elevation: 1,
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="xl" sx={{ py: 2 }}>
        {/* Header */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h3" component="h1" gutterBottom color="primary">
            BOM Hierarchical Comparison Tool
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" paragraph>
            Compare Bill of Materials at any hierarchy level with intelligent change detection
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Navigate through Main BOM → Sub-BOMs → Sub-Sub-BOMs → Raw Materials with automatic synchronization and change highlighting.
          </Typography>
        </Paper>

        {/* BOM Comparison Wrapper */}
        <BOMComparisonWrapper />

        {/* Footer */}
        <Paper sx={{ p: 2, mt: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            BOM Comparison Tool - Built with React + Material-UI + TypeScript
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Hierarchical tree navigation with real-time change detection
          </Typography>
        </Paper>
      </Container>
    </ThemeProvider>
  );
}

export default App;
