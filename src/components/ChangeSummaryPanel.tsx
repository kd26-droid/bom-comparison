import React from 'react';
import { Box, Paper, Typography, Stack, Chip, Divider, Link } from '@mui/material';
import { NodeChangeInfo } from '../utils/bomChangeDetection';
import { BOMTreeNode } from '../utils/bomHierarchy';

interface ChangeSummaryPanelProps {
  changeMap: Map<string, NodeChangeInfo>;
  selectedPath: string | null;
  onNavigate?: (path: string, node: BOMTreeNode) => void;
  tree?: BOMTreeNode;
}

export const ChangeSummaryPanel: React.FC<ChangeSummaryPanelProps> = ({
  changeMap,
  selectedPath,
  onNavigate,
  tree,
}) => {
  // Get changes for the selected node
  const selectedNodeChanges = selectedPath ? changeMap.get(selectedPath) : null;

  // Get nested changes (changes in children/descendants)
  const getNestedChanges = (): NodeChangeInfo[] => {
    if (!selectedPath) return [];

    const nested: NodeChangeInfo[] = [];
    changeMap.forEach((info, path) => {
      // If path starts with selectedPath and is not the same, it's a descendant
      if (path !== selectedPath && path.startsWith(selectedPath + '.') && info.changeType !== 'unchanged') {
        nested.push(info);
      }
    });
    return nested;
  };

  const nestedChanges = getNestedChanges();

  // Helper to find node by path
  const findNodeByPath = (node: BOMTreeNode, targetPath: string): BOMTreeNode | null => {
    if (node.path === targetPath) return node;
    for (const child of node.children) {
      const found = findNodeByPath(child, targetPath);
      if (found) return found;
    }
    return null;
  };

  const handleNavigateToChange = (path: string) => {
    if (onNavigate && tree) {
      const node = findNodeByPath(tree, path);
      if (node) {
        onNavigate(path, node);
      }
    }
  };

  if (!selectedNodeChanges || (selectedNodeChanges.changeType === 'unchanged' && nestedChanges.length === 0)) {
    return (
      <Paper sx={{ p: 2, mb: 2, backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="body2" sx={{ color: '#166534', fontWeight: 600 }}>
            ✓ No changes detected at this level or below
          </Typography>
        </Stack>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2, mb: 2, backgroundColor: '#fef3c7', border: '1px solid #fcd34d' }}>
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="subtitle2" sx={{ color: '#92400e', fontWeight: 600 }}>
            Changes Detected:
          </Typography>
          <Chip
            label={selectedNodeChanges.changeType.toUpperCase()}
            size="small"
            sx={{
              height: 20,
              fontSize: '0.7rem',
              backgroundColor:
                selectedNodeChanges.changeType === 'modified'
                  ? '#fbbf24'
                  : selectedNodeChanges.changeType === 'removed'
                  ? '#ef4444'
                  : '#22c55e',
              color: '#fff',
              fontWeight: 600,
            }}
          />
        </Stack>

        {selectedNodeChanges.changes.length > 0 && (
          <>
            <Divider />
            <Stack spacing={0.5}>
              {selectedNodeChanges.changes.map((change, idx) => (
                <Box key={idx} sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#92400e',
                      fontWeight: 600,
                      minWidth: '120px',
                    }}
                  >
                    {change.fieldName}:
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="baseline">
                    {change.changeType === 'modified' && (
                      <>
                        <Typography
                          variant="caption"
                          fontFamily="monospace"
                          sx={{
                            color: '#dc2626',
                            textDecoration: 'line-through',
                            backgroundColor: '#fee2e2',
                            px: 0.5,
                            borderRadius: '2px',
                          }}
                        >
                          {String(change.leftValue)}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#92400e' }}>
                          →
                        </Typography>
                        <Typography
                          variant="caption"
                          fontFamily="monospace"
                          sx={{
                            color: '#15803d',
                            fontWeight: 600,
                            backgroundColor: '#dcfce7',
                            px: 0.5,
                            borderRadius: '2px',
                          }}
                        >
                          {String(change.rightValue)}
                        </Typography>
                      </>
                    )}
                    {change.changeType === 'added' && (
                      <Typography
                        variant="caption"
                        fontFamily="monospace"
                        sx={{
                          color: '#15803d',
                          fontWeight: 600,
                          backgroundColor: '#dcfce7',
                          px: 0.5,
                          borderRadius: '2px',
                        }}
                      >
                        {String(change.rightValue)} (added)
                      </Typography>
                    )}
                    {change.changeType === 'removed' && (
                      <Typography
                        variant="caption"
                        fontFamily="monospace"
                        sx={{
                          color: '#dc2626',
                          fontWeight: 600,
                          backgroundColor: '#fee2e2',
                          px: 0.5,
                          borderRadius: '2px',
                        }}
                      >
                        {String(change.leftValue)} (removed)
                      </Typography>
                    )}
                  </Stack>
                </Box>
              ))}
            </Stack>
          </>
        )}

        {/* Nested Changes Section */}
        {nestedChanges.length > 0 && (
          <>
            <Divider />
            <Box>
              <Typography variant="caption" sx={{ color: '#92400e', fontWeight: 600, mb: 1, display: 'block' }}>
                Changes in nested items (click to navigate):
              </Typography>
              <Stack spacing={0.5}>
                {nestedChanges.map((nestedChange, idx) => {
                  // Convert path to readable hierarchy (e.g., QAB1.QASB1.QASSB1 -> QASB1 > QASSB1)
                  const pathParts = nestedChange.nodePath.split('.');
                  const relativePath = selectedPath ? pathParts.slice(selectedPath.split('.').length).join(' > ') : nestedChange.nodeCode;

                  // Get change type icon and color
                  const getChangeIndicator = () => {
                    switch (nestedChange.changeType) {
                      case 'added':
                        return { icon: '✓', color: '#15803d', bg: '#dcfce7', label: 'ADDED' };
                      case 'removed':
                        return { icon: '✗', color: '#dc2626', bg: '#fee2e2', label: 'DELETED' };
                      case 'modified':
                        return { icon: '✏', color: '#d97706', bg: '#fef3c7', label: 'MODIFIED' };
                      default:
                        return { icon: '•', color: '#6b7280', bg: '#f3f4f6', label: 'UNCHANGED' };
                    }
                  };

                  const indicator = getChangeIndicator();

                  return (
                    <Box
                      key={idx}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        p: 1,
                        borderRadius: '4px',
                        '&:hover': {
                          backgroundColor: '#fef3c7',
                        },
                      }}
                    >
                      <Chip
                        label={indicator.label}
                        size="small"
                        sx={{
                          height: 18,
                          fontSize: '0.65rem',
                          backgroundColor: indicator.bg,
                          color: indicator.color,
                          fontWeight: 600,
                        }}
                      />
                      <Link
                        component="button"
                        onClick={() => handleNavigateToChange(nestedChange.nodePath)}
                        sx={{
                          textDecoration: 'none',
                          color: '#1e40af',
                          fontSize: '0.8rem',
                          fontWeight: 500,
                          cursor: 'pointer',
                          '&:hover': {
                            textDecoration: 'underline',
                            color: '#1e3a8a',
                          },
                        }}
                      >
                        📍 {relativePath}
                      </Link>
                      {nestedChange.changeType === 'modified' && (
                        <Typography variant="caption" sx={{ color: '#6b7280', fontSize: '0.7rem' }}>
                          ({nestedChange.changes.length} change{nestedChange.changes.length > 1 ? 's' : ''}: {nestedChange.changes.map(c => c.fieldName).join(', ')})
                        </Typography>
                      )}
                    </Box>
                  );
                })}
              </Stack>
            </Box>
          </>
        )}
      </Stack>
    </Paper>
  );
};
