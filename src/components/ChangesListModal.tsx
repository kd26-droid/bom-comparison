import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  Stack,
  Divider,
  Link,
  Chip,
  Paper,
  Button,
} from '@mui/material';
import { Close as CloseIcon, Visibility as VisibilityIcon } from '@mui/icons-material';
import { AggregatedChange } from '../utils/changeAggregation';

interface ChangesListModalProps {
  open: boolean;
  onClose: () => void;
  title: string;  // "Added Items", "Deleted Items", etc.
  changes: AggregatedChange[];
  onShowAllChanges: () => void;
}

export const ChangesListModal: React.FC<ChangesListModalProps> = ({
  open,
  onClose,
  title,
  changes,
  onShowAllChanges,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          minHeight: '60vh',
          maxHeight: '80vh',
        },
      }}
    >
      {/* Header */}
      <DialogTitle sx={{ borderBottom: '1px solid #e5e7eb', pb: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            {changes.length > 0 && (
              <Button
                variant="contained"
                size="small"
                startIcon={<VisibilityIcon />}
                onClick={onShowAllChanges}
                sx={{
                  textTransform: 'none',
                  fontSize: '0.875rem',
                  px: 2,
                  backgroundColor: '#1976d2',
                  '&:hover': {
                    backgroundColor: '#1565c0',
                  },
                }}
              >
                Show All Changes
              </Button>
            )}
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Stack>
        </Stack>
      </DialogTitle>

      {/* Content */}
      <DialogContent sx={{ pt: 2 }}>
        {changes.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              No changes found
            </Typography>
          </Box>
        ) : (
          <Stack spacing={1.5}>
            {changes.map((change, idx) => (
              <Box key={change.id || idx}>
                <Paper
                  sx={{
                    p: 2,
                    '&:hover': {
                      backgroundColor: '#f9fafb',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    },
                    transition: 'all 0.2s',
                  }}
                >
                  <Stack spacing={1.5}>
                    {/* Item Code and Name */}
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#111827' }}>
                        {change.code}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#6b7280' }}>
                        - {change.name}
                      </Typography>
                      <Chip
                        label={change.nodeType.toUpperCase()}
                        size="small"
                        sx={{ height: 20, fontSize: '0.65rem' }}
                      />
                    </Stack>

                    {/* Parent Path */}
                    {change.parentPath && (
                      <Typography variant="caption" sx={{ color: '#6b7280' }}>
                        📍 in <span style={{ fontWeight: 600, color: '#111827' }}>{change.parentPath}</span>
                      </Typography>
                    )}

                    {/* Changes Summary */}
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {change.changes.slice(0, 3).map((fieldChange, fIdx) => (
                        <Chip
                          key={fIdx}
                          label={`${fieldChange.fieldName}: ${fieldChange.leftValue || 'N/A'} → ${fieldChange.rightValue || 'N/A'}`}
                          size="small"
                          sx={{
                            fontSize: '0.7rem',
                            height: 22,
                            backgroundColor: '#f3f4f6',
                          }}
                        />
                      ))}
                      {change.changes.length > 3 && (
                        <Chip
                          label={`+${change.changes.length - 3} more`}
                          size="small"
                          sx={{ fontSize: '0.7rem', height: 22 }}
                        />
                      )}
                    </Stack>
                  </Stack>
                </Paper>
                {idx < changes.length - 1 && <Divider sx={{ my: 1 }} />}
              </Box>
            ))}
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
};
