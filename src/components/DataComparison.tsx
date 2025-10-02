import React, { useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  LinearProgress,
  Stack,
  Divider,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  IDataComparisonProps,
  IComparisonSummary,
  IComparisonResult,
  ComparisonDataType,
} from '../types/interfaces';
import { compareData, detectDataType } from '../utils/deepCompare';
import { FieldRenderer } from './FieldRenderer';
import { ComparisonSummary } from './ComparisonSummary';

export const DataComparison: React.FC<IDataComparisonProps> = ({
  leftData,
  rightData,
  leftLabel = 'Left Data',
  rightLabel = 'Right Data',
  dataType = 'auto',
  showUnchanged = true,
  expandAll = false,
  maxDepth = 10,
  customFields = [],
  excludeFields = [],
  onComparisonComplete,
  onError,
}) => {
  const [expandedPanels, setExpandedPanels] = useState<Set<string>>(new Set());

  // Perform the deep comparison
  const comparisonResult: IComparisonSummary = useMemo(() => {
    try {
      const result = compareData(leftData, rightData, {
        excludeFields,
        maxDepth,
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown comparison error';
      onError?.(errorMessage);
      return {
        totalFields: 0,
        changedFields: 0,
        addedFields: 0,
        removedFields: 0,
        modifiedFields: 0,
        unchangedFields: 0,
        changes: [],
        errors: [errorMessage],
      };
    }
  }, [leftData, rightData, excludeFields, maxDepth, onError]);

  // Call the completion callback when comparison result changes
  React.useEffect(() => {
    if (comparisonResult && comparisonResult.changes.length >= 0) {
      onComparisonComplete?.(comparisonResult);
    }
  }, [comparisonResult, onComparisonComplete]);

  // Auto-detect data type
  const detectedDataType: ComparisonDataType = useMemo(() => {
    if (dataType !== 'auto') return dataType as ComparisonDataType;

    const leftType = detectDataType(leftData);
    const rightType = detectDataType(rightData);

    if (leftType === rightType && leftType !== 'unknown') {
      return leftType as ComparisonDataType;
    }

    return 'bom'; // Default fallback
  }, [dataType, leftData, rightData]);

  // Group changes by path hierarchy
  const groupedChanges = useMemo(() => {
    const groups: { [key: string]: IComparisonResult[] } = {};

    comparisonResult.changes.forEach(change => {
      const pathParts = change.path.split('.');
      const topLevelPath = pathParts[0] || 'root';

      if (!groups[topLevelPath]) {
        groups[topLevelPath] = [];
      }
      groups[topLevelPath].push(change);
    });

    return groups;
  }, [comparisonResult.changes]);

  // Filter changes based on showUnchanged and customFields
  const filteredChanges = useMemo(() => {
    let filtered = comparisonResult.changes;

    if (!showUnchanged) {
      filtered = filtered.filter(change => change.changeType !== 'unchanged');
    }

    if (customFields.length > 0) {
      filtered = filtered.filter(change =>
        customFields.some(field =>
          change.path.includes(field) ||
          change.path.endsWith(field)
        )
      );
    }

    return filtered;
  }, [comparisonResult.changes, showUnchanged, customFields]);

  const handlePanelChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    const newExpanded = new Set(expandedPanels);
    if (isExpanded) {
      newExpanded.add(panel);
    } else {
      newExpanded.delete(panel);
    }
    setExpandedPanels(newExpanded);
  };

  // Initialize expanded panels based on expandAll prop
  React.useEffect(() => {
    if (expandAll) {
      setExpandedPanels(new Set(Object.keys(groupedChanges)));
    } else {
      setExpandedPanels(new Set());
    }
  }, [expandAll, groupedChanges]);

  if (comparisonResult.errors.length > 0) {
    return (
      <Paper sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="h6">Comparison Error</Typography>
        </Alert>
        {comparisonResult.errors.map((error, index) => (
          <Alert key={index} severity="error" sx={{ mb: 1 }}>
            {error}
          </Alert>
        ))}
      </Paper>
    );
  }

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography variant="h5" component="h1">
              Data Comparison - {detectedDataType.toUpperCase()}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <ComparisonSummary summary={comparisonResult} />
          </Grid>
        </Grid>
      </Paper>

      {/* Main Comparison View */}
      <Paper sx={{ height: 'calc(100vh - 200px)', overflow: 'auto' }}>
        <Grid container sx={{ height: '100%' }}>
          {/* Left Side Header */}
          <Grid item xs={6}>
            <Box
              sx={{
                p: 2,
                borderBottom: 1,
                borderColor: 'divider',
                backgroundColor: 'grey.50',
                position: 'sticky',
                top: 0,
                zIndex: 1,
              }}
            >
              <Typography variant="h6" color="primary">
                {leftLabel}
              </Typography>
            </Box>
          </Grid>

          {/* Right Side Header */}
          <Grid item xs={6}>
            <Box
              sx={{
                p: 2,
                borderBottom: 1,
                borderLeft: 1,
                borderColor: 'divider',
                backgroundColor: 'grey.50',
                position: 'sticky',
                top: 0,
                zIndex: 1,
              }}
            >
              <Typography variant="h6" color="primary">
                {rightLabel}
              </Typography>
            </Box>
          </Grid>

          {/* Comparison Content */}
          <Grid item xs={12}>
            <Box sx={{ p: 2 }}>
              {Object.entries(groupedChanges).map(([groupName, changes]) => {
                const hasChanges = changes.some(c => c.changeType !== 'unchanged');
                const groupChanges = showUnchanged ? changes : changes.filter(c => c.changeType !== 'unchanged');

                if (groupChanges.length === 0) return null;

                return (
                  <Accordion
                    key={groupName}
                    expanded={expandedPanels.has(groupName)}
                    onChange={handlePanelChange(groupName)}
                    sx={{
                      mb: 1,
                      '&.Mui-expanded': {
                        margin: '0 0 8px 0',
                      },
                      boxShadow: 'none',
                      border: '1px solid #e5e7eb',
                      '&:before': {
                        display: 'none',
                      },
                    }}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      sx={{
                        backgroundColor: hasChanges ? '#fef3f2' : '#f9fafb',
                        borderBottom: '1px solid #e5e7eb',
                        minHeight: '56px',
                        '&.Mui-expanded': {
                          backgroundColor: hasChanges ? '#fef3f2' : '#f9fafb',
                          minHeight: '56px',
                        },
                      }}
                    >
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Typography variant="subtitle1" fontWeight="600" color="#374151">
                          {groupName}
                        </Typography>
                        <Chip
                          label={`${groupChanges.length} fields`}
                          size="small"
                          variant="outlined"
                          sx={{
                            borderColor: hasChanges ? '#ef4444' : '#9ca3af',
                            color: hasChanges ? '#ef4444' : '#6b7280',
                            fontSize: '0.75rem',
                          }}
                        />
                      </Stack>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: 0 }}>
                      <Grid container>
                        {groupChanges.map((change, index) => (
                          <React.Fragment key={`${change.path}-${index}`}>
                            {/* Left Side */}
                            <Grid item xs={6} sx={{ borderRight: 1, borderColor: 'divider' }}>
                              <FieldRenderer
                                change={change}
                                side="left"
                                showPath={true}
                              />
                            </Grid>

                            {/* Right Side */}
                            <Grid item xs={6}>
                              <FieldRenderer
                                change={change}
                                side="right"
                                showPath={false}
                              />
                            </Grid>

                            {index < groupChanges.length - 1 && (
                              <Grid item xs={12}>
                                <Divider sx={{ my: 0.5 }} />
                              </Grid>
                            )}
                          </React.Fragment>
                        ))}
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                );
              })}

              {Object.keys(groupedChanges).length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    No data to compare or no changes found.
                  </Typography>
                </Box>
              )}
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};