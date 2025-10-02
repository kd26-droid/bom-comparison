import React from 'react';
import {
  Box,
  Typography,
  Chip,
  Stack,
  Card,
  CardContent,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Edit as EditIcon,
  CheckCircle as UnchangedIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { IComparisonSummary } from '../types/interfaces';

interface ComparisonSummaryProps {
  summary: IComparisonSummary;
}

export const ComparisonSummary: React.FC<ComparisonSummaryProps> = ({ summary }) => {
  const {
    totalFields,
    changedFields,
    addedFields,
    removedFields,
    modifiedFields,
    unchangedFields,
    errors,
  } = summary;

  // Calculate percentages
  const changedPercentage = totalFields > 0 ? (changedFields / totalFields) * 100 : 0;
  const unchangedPercentage = totalFields > 0 ? (unchangedFields / totalFields) * 100 : 0;

  const getSummaryStats = () => [
    {
      label: 'Added',
      count: addedFields,
      color: 'success' as const,
      icon: <AddIcon fontSize="small" />,
      bgColor: '#e6ffed',
    },
    {
      label: 'Removed',
      count: removedFields,
      color: 'error' as const,
      icon: <RemoveIcon fontSize="small" />,
      bgColor: '#ffeaea',
    },
    {
      label: 'Modified',
      count: modifiedFields,
      color: 'warning' as const,
      icon: <EditIcon fontSize="small" />,
      bgColor: '#fff3cd',
    },
    {
      label: 'Unchanged',
      count: unchangedFields,
      color: 'default' as const,
      icon: <UnchangedIcon fontSize="small" />,
      bgColor: '#f8f9fa',
    },
  ];

  return (
    <Card variant="outlined" sx={{ minWidth: 300 }}>
      <CardContent>
        <Stack spacing={2}>
          {/* Header */}
          <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
            <Typography variant="h6" color="primary">
              Comparison Summary
            </Typography>
            {errors.length > 0 && (
              <Tooltip title={`${errors.length} error(s) occurred during comparison`}>
                <ErrorIcon color="error" />
              </Tooltip>
            )}
          </Stack>

          {/* Total Fields */}
          <Box>
            <Typography variant="body2" color="text.secondary">
              Total Fields Compared
            </Typography>
            <Typography variant="h4" fontWeight="bold">
              {totalFields.toLocaleString()}
            </Typography>
          </Box>

          {/* Progress Bar */}
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Changes
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                {changedPercentage.toFixed(1)}%
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={changedPercentage}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: '#e0e0e0',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                  background: changedFields > 0
                    ? 'linear-gradient(45deg, #ff9800 30%, #f44336 90%)'
                    : '#4caf50',
                },
              }}
            />
          </Box>

          {/* Detailed Stats */}
          <Stack spacing={1}>
            <Typography variant="subtitle2" color="text.secondary">
              Field Changes
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {getSummaryStats().map((stat) => (
                <Tooltip
                  key={stat.label}
                  title={`${stat.count} fields ${stat.label.toLowerCase()}`}
                  arrow
                >
                  <Chip
                    icon={stat.icon}
                    label={`${stat.count}`}
                    color={stat.color}
                    variant="outlined"
                    size="small"
                    sx={{
                      backgroundColor: stat.count > 0 ? stat.bgColor : 'transparent',
                      '& .MuiChip-label': {
                        fontWeight: 'bold',
                      },
                    }}
                  />
                </Tooltip>
              ))}
            </Stack>
          </Stack>

          {/* Change Breakdown */}
          {changedFields > 0 && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Change Distribution
              </Typography>
              <Stack spacing={0.5}>
                {addedFields > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <AddIcon fontSize="small" color="success" />
                      <Typography variant="body2">Added Fields</Typography>
                    </Stack>
                    <Typography variant="body2" fontWeight="bold">
                      {addedFields} ({((addedFields / changedFields) * 100).toFixed(1)}%)
                    </Typography>
                  </Box>
                )}

                {removedFields > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <RemoveIcon fontSize="small" color="error" />
                      <Typography variant="body2">Removed Fields</Typography>
                    </Stack>
                    <Typography variant="body2" fontWeight="bold">
                      {removedFields} ({((removedFields / changedFields) * 100).toFixed(1)}%)
                    </Typography>
                  </Box>
                )}

                {modifiedFields > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <EditIcon fontSize="small" color="warning" />
                      <Typography variant="body2">Modified Fields</Typography>
                    </Stack>
                    <Typography variant="body2" fontWeight="bold">
                      {modifiedFields} ({((modifiedFields / changedFields) * 100).toFixed(1)}%)
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Box>
          )}

          {/* No Changes Message */}
          {changedFields === 0 && (
            <Box
              sx={{
                textAlign: 'center',
                py: 2,
                backgroundColor: '#e8f5e8',
                borderRadius: 1,
                border: '1px solid #c8e6c9',
              }}
            >
              <UnchangedIcon color="success" sx={{ mb: 1 }} />
              <Typography variant="body2" color="success.main" fontWeight="bold">
                No Changes Found
              </Typography>
              <Typography variant="caption" color="text.secondary">
                All compared fields are identical
              </Typography>
            </Box>
          )}

          {/* Error Summary */}
          {errors.length > 0 && (
            <Box
              sx={{
                backgroundColor: '#ffebee',
                borderRadius: 1,
                p: 1,
                border: '1px solid #ffcdd2',
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <ErrorIcon color="error" fontSize="small" />
                <Typography variant="subtitle2" color="error">
                  Comparison Errors ({errors.length})
                </Typography>
              </Stack>
              <Stack spacing={0.5}>
                {errors.slice(0, 3).map((error, index) => (
                  <Typography key={index} variant="caption" color="error">
                    • {error}
                  </Typography>
                ))}
                {errors.length > 3 && (
                  <Typography variant="caption" color="error">
                    ... and {errors.length - 3} more errors
                  </Typography>
                )}
              </Stack>
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};