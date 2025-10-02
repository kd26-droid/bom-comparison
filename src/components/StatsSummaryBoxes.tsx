import React from 'react';
import { Box, Paper, Stack, Typography } from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { ChangeStats } from '../utils/changeAggregation';

interface StatsSummaryBoxesProps {
  stats: ChangeStats;
  onBoxClick: (type: 'added' | 'deleted' | 'changed') => void;
}

export const StatsSummaryBoxes: React.FC<StatsSummaryBoxesProps> = ({ stats, onBoxClick }) => {
  return (
    <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
      {/* ADDED BOX */}
      <Paper
        onClick={() => onBoxClick('added')}
        elevation={0}
        sx={{
          flex: 1,
          p: 2,
          cursor: 'pointer',
          backgroundColor: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: 1.5,
          '&:hover': {
            borderColor: '#22c55e',
            backgroundColor: '#f0fdf4',
            boxShadow: '0 2px 8px rgba(34, 197, 94, 0.1)',
          },
          transition: 'all 0.2s ease',
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              backgroundColor: '#dcfce7',
              borderRadius: '8px',
              p: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AddIcon sx={{ fontSize: 20, color: '#16a34a' }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827', fontSize: '1.5rem', lineHeight: 1 }}>
              {stats.added.length}
            </Typography>
            <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 500, fontSize: '0.75rem' }}>
              Added
            </Typography>
          </Box>
        </Stack>
      </Paper>

      {/* DELETED BOX */}
      <Paper
        onClick={() => onBoxClick('deleted')}
        elevation={0}
        sx={{
          flex: 1,
          p: 2,
          cursor: 'pointer',
          backgroundColor: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: 1.5,
          '&:hover': {
            borderColor: '#ef4444',
            backgroundColor: '#fef2f2',
            boxShadow: '0 2px 8px rgba(239, 68, 68, 0.1)',
          },
          transition: 'all 0.2s ease',
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              backgroundColor: '#fee2e2',
              borderRadius: '8px',
              p: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <DeleteIcon sx={{ fontSize: 20, color: '#dc2626' }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827', fontSize: '1.5rem', lineHeight: 1 }}>
              {stats.deleted.length}
            </Typography>
            <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 500, fontSize: '0.75rem' }}>
              Deleted
            </Typography>
          </Box>
        </Stack>
      </Paper>

      {/* CHANGED BOX */}
      <Paper
        onClick={() => onBoxClick('changed')}
        elevation={0}
        sx={{
          flex: 1,
          p: 2,
          cursor: 'pointer',
          backgroundColor: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: 1.5,
          '&:hover': {
            borderColor: '#f59e0b',
            backgroundColor: '#fffbeb',
            boxShadow: '0 2px 8px rgba(245, 158, 11, 0.1)',
          },
          transition: 'all 0.2s ease',
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              backgroundColor: '#fef3c7',
              borderRadius: '8px',
              p: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <EditIcon sx={{ fontSize: 20, color: '#d97706' }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827', fontSize: '1.5rem', lineHeight: 1 }}>
              {stats.changed.length}
            </Typography>
            <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 500, fontSize: '0.75rem' }}>
              Changed
            </Typography>
          </Box>
        </Stack>
      </Paper>
    </Stack>
  );
};
