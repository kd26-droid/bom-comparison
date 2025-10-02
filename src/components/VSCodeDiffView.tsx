import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Divider,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  SelectChangeEvent,
} from '@mui/material';
import {
  Visibility as ShowChangesIcon,
  VisibilityOff as HideChangesIcon,
  SwapHoriz as SwapIcon,
} from '@mui/icons-material';

interface VSCodeDiffViewProps {
  leftData: any;
  rightData: any;
  leftLabel: string;
  rightLabel: string;
  dataType: 'bom';
  dataList: Array<{id: string; name: string; data: any}>;
  selectedLeft: string;
  selectedRight: string;
  onLeftChange: (value: string) => void;
  onRightChange: (value: string) => void;
}

interface FieldDiff {
  field: string;
  leftValue: any;
  rightValue: any;
  isChanged: boolean;
  isAdded: boolean;
  isRemoved: boolean;
}

export const VSCodeDiffView: React.FC<VSCodeDiffViewProps> = ({
  leftData,
  rightData,
  leftLabel,
  rightLabel,
  dataType,
  dataList,
  selectedLeft,
  selectedRight,
  onLeftChange,
  onRightChange,
}) => {
  const [showChanges, setShowChanges] = useState(false);

  // Format BOM data into readable fields
  const formatBOMData = (data: any) => {
    if (!data) return [];

    return [
      { field: 'BOM Code', value: data.enterprise_bom?.bom_code || 'N/A' },
      { field: 'BOM Name', value: data.enterprise_bom?.bom_name || 'N/A' },
      { field: 'Item Code', value: data.enterprise_bom?.enterprise_item?.code || 'N/A' },
      { field: 'Item Name', value: data.enterprise_bom?.enterprise_item?.name || 'N/A' },
      { field: 'Quantity', value: data.quantity || 0 },
      { field: 'Total Cost', value: `₹${data.total || 0}` },
      { field: 'Status', value: data.custom_sections?.[0]?.status || 'N/A' },
      { field: 'Custom Fields', value: data.custom_sections?.[0]?.custom_fields?.length || 0 },
      { field: 'BOM Items', value: data.bom_items?.length || 0 },
      { field: 'Currency ID', value: data.currency_id || 'N/A' },
      { field: 'Entry ID', value: data.entry_id || 'N/A' },
      { field: 'Created', value: data.created_datetime ? new Date(data.created_datetime).toLocaleDateString() : 'N/A' },
      { field: 'Modified', value: data.modified_datetime ? new Date(data.modified_datetime).toLocaleDateString() : 'N/A' },
    ];
  };

  // Choose formatter based on data type
  const formatData = (data: any) => {
    return formatBOMData(data);
  };

  const leftFields = formatData(leftData);
  const rightFields = formatData(rightData);

  // Create diff analysis
  const createFieldDiffs = (): FieldDiff[] => {
    const diffs: FieldDiff[] = [];
    const allFields = new Set([
      ...leftFields.map(f => f.field),
      ...rightFields.map(f => f.field)
    ]);

    allFields.forEach(fieldName => {
      const leftField = leftFields.find(f => f.field === fieldName);
      const rightField = rightFields.find(f => f.field === fieldName);

      const leftValue = leftField?.value;
      const rightValue = rightField?.value;

      diffs.push({
        field: fieldName,
        leftValue,
        rightValue,
        isChanged: leftValue !== rightValue,
        isAdded: !leftField && !!rightField,
        isRemoved: !!leftField && !rightField,
      });
    });

    return diffs;
  };

  const fieldDiffs = createFieldDiffs();

  const getFieldStyle = (diff: FieldDiff, side: 'left' | 'right') => {
    if (!showChanges) return {};

    if (diff.isAdded && side === 'right') {
      return {
        backgroundColor: '#e6ffed',
        borderLeft: '3px solid #22c55e',
        color: '#166534',
      };
    }

    if (diff.isRemoved && side === 'left') {
      return {
        backgroundColor: '#fef2f2',
        borderLeft: '3px solid #ef4444',
        color: '#991b1b',
      };
    }

    if (diff.isChanged) {
      return side === 'left' ? {
        backgroundColor: '#fef2f2',
        borderLeft: '3px solid #ef4444',
        color: '#991b1b',
      } : {
        backgroundColor: '#e6ffed',
        borderLeft: '3px solid #22c55e',
        color: '#166534',
      };
    }

    return {};
  };

  const getDataTypeName = () => 'BOM';

  return (
    <Box>
      {/* Selection Controls */}
      <Paper sx={{ p: 3, mb: 2, backgroundColor: '#f8fafc' }}>
        <Typography variant="h6" gutterBottom color="primary" sx={{ mb: 2 }}>
          {getDataTypeName()} Comparison -   Style
        </Typography>

        {/* Selection dropdowns */}
        <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
          <Grid item xs={12} md={5}>
            <FormControl fullWidth size="small">
              <InputLabel>Select Left {getDataTypeName()}</InputLabel>
              <Select
                value={selectedLeft}
                label={`Select Left ${getDataTypeName()}`}
                onChange={(e: SelectChangeEvent) => onLeftChange(e.target.value)}
              >
                {dataList.map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2} sx={{ display: 'flex', justifyContent: 'center' }}>
            <SwapIcon color="action" fontSize="large" />
          </Grid>

          <Grid item xs={12} md={5}>
            <FormControl fullWidth size="small">
              <InputLabel>Select Right {getDataTypeName()}</InputLabel>
              <Select
                value={selectedRight}
                label={`Select Right ${getDataTypeName()}`}
                onChange={(e: SelectChangeEvent) => onRightChange(e.target.value)}
              >
                {dataList.map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {/* Show Changes button */}
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="body2" color="text.secondary">
            Select different items above to see comparisons
          </Typography>
          <Button
            variant={showChanges ? "contained" : "outlined"}
            startIcon={showChanges ? <HideChangesIcon /> : <ShowChangesIcon />}
            onClick={() => setShowChanges(!showChanges)}
            sx={{
              backgroundColor: showChanges ? '#22c55e' : 'transparent',
              borderColor: '#22c55e',
              color: showChanges ? 'white' : '#22c55e',
              '&:hover': {
                backgroundColor: showChanges ? '#16a34a' : '#f0fdf4',
              }
            }}
          >
            {showChanges ? 'Hide Changes' : 'Show Changes'}
          </Button>
        </Stack>

        {showChanges && (
          <Box sx={{ mt: 3, p: 2, backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom color="primary" sx={{ fontWeight: 'bold' }}>
              📊 Change Summary
            </Typography>

            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={3}>
                <Typography variant="body2" sx={{ color: '#374151' }}>
                  <strong>Total Fields:</strong> {fieldDiffs.length}
                </Typography>
              </Grid>
              <Grid item xs={3}>
                <Typography variant="body2" sx={{ color: '#ef4444', fontWeight: 'bold' }}>
                  <strong>Changed:</strong> {fieldDiffs.filter(d => d.isChanged).length}
                </Typography>
              </Grid>
              <Grid item xs={3}>
                <Typography variant="body2" sx={{ color: '#22c55e', fontWeight: 'bold' }}>
                  <strong>Added:</strong> {fieldDiffs.filter(d => d.isAdded).length}
                </Typography>
              </Grid>
              <Grid item xs={3}>
                <Typography variant="body2" sx={{ color: '#ef4444', fontWeight: 'bold' }}>
                  <strong>Removed:</strong> {fieldDiffs.filter(d => d.isRemoved).length}
                </Typography>
              </Grid>
            </Grid>

            {/* Detailed Changes */}
            {fieldDiffs.filter(d => d.isChanged || d.isAdded || d.isRemoved).length > 0 && (
              <Box>
                <Typography variant="subtitle2" gutterBottom sx={{ color: '#374151', fontWeight: 'bold', mb: 1 }}>
                  🔍 Detailed Changes:
                </Typography>
                <Box sx={{ maxHeight: '200px', overflow: 'auto' }}>
                  {fieldDiffs
                    .filter(d => d.isChanged || d.isAdded || d.isRemoved)
                    .map((diff, index) => (
                      <Box key={diff.field} sx={{ mb: 1, p: 1, backgroundColor: '#f9fafb', borderRadius: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#374151' }}>
                          {diff.field}
                        </Typography>
                        {diff.isChanged && (
                          <Typography variant="body2" sx={{ fontSize: '0.8rem', color: '#6b7280' }}>
                            <span style={{ color: '#ef4444', fontWeight: 'bold' }}>Before:</span> {String(diff.leftValue)} →{' '}
                            <span style={{ color: '#22c55e', fontWeight: 'bold' }}>After:</span> {String(diff.rightValue)}
                          </Typography>
                        )}
                        {diff.isAdded && (
                          <Typography variant="body2" sx={{ fontSize: '0.8rem', color: '#22c55e', fontWeight: 'bold' }}>
                            ✅ Added: {String(diff.rightValue)}
                          </Typography>
                        )}
                        {diff.isRemoved && (
                          <Typography variant="body2" sx={{ fontSize: '0.8rem', color: '#ef4444', fontWeight: 'bold' }}>
                            ❌ Removed: {String(diff.leftValue)}
                          </Typography>
                        )}
                      </Box>
                    ))
                  }
                </Box>
              </Box>
            )}

            <Typography variant="caption" sx={{ mt: 2, color: '#6b7280', display: 'block', textAlign: 'center' }}>
              <span style={{ color: '#ef4444', fontWeight: 'bold' }}>Red</span> = Removed/Old Values •{' '}
              <span style={{ color: '#22c55e', fontWeight: 'bold' }}>Green</span> = Added/New Values
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Side by side diff view */}
      <Paper sx={{ overflow: 'hidden', border: '1px solid #e5e7eb' }}>
        {/* Headers */}
        <Box sx={{ display: 'flex', borderBottom: '2px solid #e5e7eb' }}>
          <Box sx={{
            flex: 1,
            p: 2,
            backgroundColor: '#f9fafb',
            borderRight: '1px solid #e5e7eb',
            textAlign: 'center'
          }}>
            <Typography variant="subtitle1" fontWeight="600" color="#374151">
              {leftLabel}
            </Typography>
          </Box>
          <Box sx={{
            flex: 1,
            p: 2,
            backgroundColor: '#f9fafb',
            textAlign: 'center'
          }}>
            <Typography variant="subtitle1" fontWeight="600" color="#374151">
              {rightLabel}
            </Typography>
          </Box>
        </Box>

        {/* Field rows */}
        {fieldDiffs.map((diff, index) => (
          <Box key={diff.field} sx={{ display: 'flex', minHeight: '48px' }}>
            {/* Left side */}
            <Box
              sx={{
                flex: 1,
                p: 2,
                borderRight: '1px solid #e5e7eb',
                borderBottom: index < fieldDiffs.length - 1 ? '1px solid #f3f4f6' : 'none',
                ...getFieldStyle(diff, 'left'),
                transition: 'all 0.2s ease-in-out',
              }}
            >
              <Stack spacing={0.5}>
                <Typography variant="body2" fontWeight="600" color="inherit">
                  {diff.field}
                </Typography>
                <Typography variant="body2" fontFamily="monospace" color="inherit">
                  {diff.isRemoved && showChanges ? '(removed)' : String(diff.leftValue)}
                </Typography>
              </Stack>
            </Box>

            {/* Right side */}
            <Box
              sx={{
                flex: 1,
                p: 2,
                borderBottom: index < fieldDiffs.length - 1 ? '1px solid #f3f4f6' : 'none',
                ...getFieldStyle(diff, 'right'),
                transition: 'all 0.2s ease-in-out',
              }}
            >
              <Stack spacing={0.5}>
                <Typography variant="body2" fontWeight="600" color="inherit">
                  {diff.field}
                </Typography>
                <Typography variant="body2" fontFamily="monospace" color="inherit">
                  {diff.isAdded && showChanges ? '(added)' : String(diff.rightValue)}
                </Typography>
              </Stack>
            </Box>
          </Box>
        ))}
      </Paper>

    </Box>
  );
};
