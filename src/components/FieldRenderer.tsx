import React from 'react';
import {
  Box,
  Typography,
  Chip,
  Stack,
  Paper,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Edit as EditIcon,
  CheckCircle as UnchangedIcon,
} from '@mui/icons-material';
import { IComparisonResult } from '../types/interfaces';

interface FieldRendererProps {
  change: IComparisonResult;
  side: 'left' | 'right';
  showPath?: boolean;
}

export const FieldRenderer: React.FC<FieldRendererProps> = ({
  change,
  side,
  showPath = false,
}) => {
  const value = side === 'left' ? change.leftValue : change.rightValue;
  const otherValue = side === 'left' ? change.rightValue : change.leftValue;

  // Determine the change type for this side
  const getChangeTypeForSide = () => {
    switch (change.changeType) {
      case 'added':
        return side === 'right' ? 'added' : 'missing';
      case 'removed':
        return side === 'left' ? 'removed' : 'missing';
      case 'modified':
        return 'modified';
      case 'unchanged':
        return 'unchanged';
      default:
        return 'unchanged';
    }
  };

  const sideChangeType = getChangeTypeForSide();

  // Get styling based on change type -   style (green/red only)
  const getChangeStyles = () => {
    switch (sideChangeType) {
      case 'added':
        return {
          backgroundColor: '#e6ffed', // Very light green
          borderLeft: '3px solid #22c55e', //   green
          color: '#166534',
          icon: <AddIcon fontSize="small" sx={{ color: '#22c55e' }} />,
          iconBg: '#dcfce7',
        };
      case 'removed':
        return {
          backgroundColor: '#fef2f2', // Very light red
          borderLeft: '3px solid #ef4444', //   red
          color: '#991b1b',
          icon: <RemoveIcon fontSize="small" sx={{ color: '#ef4444' }} />,
          iconBg: '#fee2e2',
        };
      case 'modified':
        return side === 'right' ? {
          backgroundColor: '#e6ffed', // Green for new value
          borderLeft: '3px solid #22c55e',
          color: '#166534',
          icon: <EditIcon fontSize="small" sx={{ color: '#22c55e' }} />,
          iconBg: '#dcfce7',
        } : {
          backgroundColor: '#fef2f2', // Red for old value
          borderLeft: '3px solid #ef4444',
          color: '#991b1b',
          icon: <EditIcon fontSize="small" sx={{ color: '#ef4444' }} />,
          iconBg: '#fee2e2',
        };
      case 'missing':
        return {
          backgroundColor: '#f9fafb',
          borderLeft: '3px solid transparent',
          color: '#9ca3af',
          icon: null,
          iconBg: '#f3f4f6',
        };
      default:
        return {
          backgroundColor: 'transparent',
          borderLeft: '3px solid transparent',
          color: 'inherit',
          icon: null,
          iconBg: 'transparent',
        };
    }
  };

  const styles = getChangeStyles();

  // Format value for display
  const formatValue = (val: any): string => {
    if (val === null) return 'null';
    if (val === undefined) return 'undefined';
    if (typeof val === 'string') return val;
    if (typeof val === 'boolean') return val.toString();
    if (typeof val === 'number') return val.toString();
    if (Array.isArray(val)) return `Array (${val.length} items)`;
    if (typeof val === 'object') return 'Object';
    return String(val);
  };

  // Get field name from path
  const getFieldName = (path: string): string => {
    const parts = path.split('.');
    const lastPart = parts[parts.length - 1];

    // Handle array indices
    if (lastPart.includes('[') && lastPart.includes(']')) {
      const arrayName = lastPart.split('[')[0];
      const index = lastPart.match(/\[([^\]]+)\]/)?.[1] || '';
      return `${arrayName}[${index}]`;
    }

    return lastPart;
  };

  // Get tooltip content
  const getTooltipContent = (): string => {
    const fieldName = getFieldName(change.path);
    const formattedValue = formatValue(value);
    const formattedOtherValue = formatValue(otherValue);

    switch (change.changeType) {
      case 'added':
        return `Field "${fieldName}" was added with value: ${formattedValue}`;
      case 'removed':
        return `Field "${fieldName}" was removed. Previous value: ${formattedValue}`;
      case 'modified':
        return `Field "${fieldName}" changed from "${formattedOtherValue}" to "${formattedValue}"`;
      case 'unchanged':
        return `Field "${fieldName}" is unchanged: ${formattedValue}`;
      default:
        return `Field "${fieldName}": ${formattedValue}`;
    }
  };

  const renderValue = () => {
    if (sideChangeType === 'missing') {
      return (
        <Typography
          variant="body2"
          sx={{
            color: '#9ca3af',
            fontStyle: 'italic',
            fontSize: '0.875rem',
          }}
        >
          (not present)
        </Typography>
      );
    }

    if (change.isNested && typeof value === 'object' && value !== null) {
      return (
        <Stack spacing={1}>
          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
            {Array.isArray(value) ? `Array (${value.length} items)` : 'Object'}
          </Typography>

          {Array.isArray(value) && value.length <= 3 && (
            <Box sx={{ pl: 2 }}>
              {value.map((item, index) => (
                <Typography key={index} variant="caption" display="block" color="text.secondary">
                  [{index}]: {formatValue(item)}
                </Typography>
              ))}
            </Box>
          )}

          {typeof value === 'object' && !Array.isArray(value) && (
            <Box sx={{ pl: 2 }}>
              {Object.entries(value).slice(0, 3).map(([key, val]) => (
                <Typography key={key} variant="caption" display="block" color="text.secondary">
                  {key}: {formatValue(val)}
                </Typography>
              ))}
              {Object.entries(value).length > 3 && (
                <Typography variant="caption" color="text.secondary">
                  ... {Object.entries(value).length - 3} more fields
                </Typography>
              )}
            </Box>
          )}
        </Stack>
      );
    }

    return (
      <Typography
        variant="body2"
        sx={{
          fontFamily: 'monospace',
          wordBreak: 'break-all',
          whiteSpace: 'pre-wrap',
        }}
      >
        {formatValue(value)}
      </Typography>
    );
  };

  return (
    <Tooltip title={getTooltipContent()} placement="top" arrow>
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          m: 0.5,
          backgroundColor: styles.backgroundColor,
          borderLeft: styles.borderLeft,
          color: styles.color,
          '&:hover': {
            boxShadow: 2,
          },
          transition: 'box-shadow 0.2s ease-in-out',
        }}
      >
        <Stack spacing={1}>
          {/* Field Path and Change Indicator */}
          {showPath && (
            <Stack direction="row" spacing={1} alignItems="center">
              {styles.icon && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    backgroundColor: styles.iconBg,
                  }}
                >
                  {styles.icon}
                </Box>
              )}
              <Typography
                variant="caption"
                sx={{
                  fontFamily: 'monospace',
                  color: 'text.secondary',
                  fontSize: '0.75rem',
                }}
              >
                {change.path}
              </Typography>
              <Chip
                label={change.changeType}
                size="small"
                variant="outlined"
                sx={{
                  borderColor:
                    change.changeType === 'added' ? '#22c55e' :
                    change.changeType === 'removed' ? '#ef4444' :
                    change.changeType === 'modified' ? (side === 'right' ? '#22c55e' : '#ef4444') : '#d1d5db',
                  color:
                    change.changeType === 'added' ? '#22c55e' :
                    change.changeType === 'removed' ? '#ef4444' :
                    change.changeType === 'modified' ? (side === 'right' ? '#22c55e' : '#ef4444') : '#6b7280',
                  fontSize: '0.7rem'
                }}
              />
            </Stack>
          )}

          {/* Field Name */}
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 'bold',
              color: styles.color,
            }}
          >
            {getFieldName(change.path)}
          </Typography>

          {/* Field Value */}
          <Box sx={{ minHeight: '20px' }}>
            {renderValue()}
          </Box>

          {/* Data Type Info */}
          <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center">
            <Chip
              label={change.dataType}
              size="small"
              variant="filled"
              color="default"
              sx={{ fontSize: '0.7rem', height: '20px' }}
            />

            {sideChangeType === 'modified' && (
              <Typography
                variant="caption"
                sx={{
                  color: side === 'right' ? '#22c55e' : '#ef4444',
                  fontWeight: '600',
                  fontSize: '0.7rem'
                }}
              >
                {side === 'left' ? 'OLD' : 'NEW'}
              </Typography>
            )}
          </Stack>
        </Stack>
      </Paper>
    </Tooltip>
  );
};