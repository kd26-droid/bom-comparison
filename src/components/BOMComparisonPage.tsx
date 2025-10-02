import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Alert,
  Stack,
  Chip,
  FormControl,
  Select,
  MenuItem,
} from '@mui/material';
import { SwapHoriz as SwapIcon } from '@mui/icons-material';
import { IProjectBOMResponse, IBOMItem } from '../types/interfaces';
import { buildBOMTree, BOMTreeNode, getItemsForComparison } from '../utils/bomHierarchy';
import { detectBOMTreeChanges, NodeChangeInfo } from '../utils/bomChangeDetection';
import { HierarchicalBOMDropdown } from './HierarchicalBOMDropdown';
import { BOMItemsComparisonView } from './BOMItemsComparisonView';
import { ChangeSummaryPanel } from './ChangeSummaryPanel';

interface BOMComparisonPageProps {
  leftData: IProjectBOMResponse;
  rightData: IProjectBOMResponse;
  leftLabel?: string;
  rightLabel?: string;
  autoNavigateTo?: string | null;  // Path to auto-navigate to
  onNavigationComplete?: () => void;  // Callback when navigation is done
}

export const BOMComparisonPage: React.FC<BOMComparisonPageProps> = ({
  leftData,
  rightData,
  leftLabel = 'Version 1',
  rightLabel = 'Version 2',
  autoNavigateTo,
  onNavigationComplete,
}) => {
  // Build trees
  const leftTree = useMemo(() => buildBOMTree(leftData), [leftData]);
  const rightTree = useMemo(() => buildBOMTree(rightData), [rightData]);

  // Detect changes
  const changeMap = useMemo(
    () => detectBOMTreeChanges(leftTree, rightTree),
    [leftTree, rightTree]
  );

  // Selection state - both dropdowns synchronized
  const [selectedPath, setSelectedPath] = useState<string | null>(leftTree.path);
  const [selectedLeftNode, setSelectedLeftNode] = useState<BOMTreeNode | null>(leftTree);
  const [selectedRightNode, setSelectedRightNode] = useState<BOMTreeNode | null>(rightTree);

  // Handle selection - synchronize both sides
  const handleSelection = (path: string, node: BOMTreeNode, side: 'left' | 'right') => {
    setSelectedPath(path);

    if (side === 'left') {
      setSelectedLeftNode(node);
      // Try to find matching node in right tree
      const rightMatch = findNodeByPath(rightTree, path);
      setSelectedRightNode(rightMatch);
    } else {
      setSelectedRightNode(node);
      // Try to find matching node in left tree
      const leftMatch = findNodeByPath(leftTree, path);
      setSelectedLeftNode(leftMatch);
    }
  };

  // Auto-navigation effect
  React.useEffect(() => {
    if (autoNavigateTo) {
      // Find the node in the left tree
      const node = findNodeByPath(leftTree, autoNavigateTo);
      if (node) {
        handleSelection(autoNavigateTo, node, 'left');
      }

      // Call callback to clear the navigation trigger
      if (onNavigationComplete) {
        onNavigationComplete();
      }
    }
  }, [autoNavigateTo]);

  // Get items to display based on selection
  // If raw material is selected, wrap it in an array to show its details
  const leftItems = selectedLeftNode
    ? selectedLeftNode.type === 'raw-material'
      ? [selectedLeftNode.data as IBOMItem]
      : getItemsForComparison(selectedLeftNode)
    : [];
  const rightItems = selectedRightNode
    ? selectedRightNode.type === 'raw-material'
      ? [selectedRightNode.data as IBOMItem]
      : getItemsForComparison(selectedRightNode)
    : [];

  // Count changes
  const totalChanges = Array.from(changeMap.values()).filter(
    info => info.changeType !== 'unchanged'
  ).length;

  return (
    <Box>
      {/* Header Section */}
      <Paper sx={{ p: 2.5, mb: 3, backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#111827', mb: 0.5 }}>
              BOM Hierarchical Comparison
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
              Select any level of the BOM hierarchy to compare
            </Typography>
          </Box>
          {totalChanges > 0 && (
            <Chip
              label={`${totalChanges} ${totalChanges === 1 ? 'change' : 'changes'} detected`}
              size="small"
              sx={{
                fontWeight: 600,
                backgroundColor: '#fef3c7',
                color: '#92400e',
                border: '1px solid #fde68a'
              }}
            />
          )}
        </Stack>
      </Paper>

      {/* Dropdowns Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          {/* Left Dropdown */}
          <Grid item xs={12} md={5}>
            <HierarchicalBOMDropdown
              tree={leftTree}
              selectedPath={selectedPath}
              onSelect={(path, node) => handleSelection(path, node, 'left')}
              label={leftLabel}
              changeMap={changeMap}
            />
          </Grid>

          {/* Swap Icon */}
          <Grid item xs={12} md={2} sx={{ display: 'flex', justifyContent: 'center' }}>
            <SwapIcon color="action" fontSize="large" />
          </Grid>

          {/* Right Dropdown */}
          <Grid item xs={12} md={5}>
            <HierarchicalBOMDropdown
              tree={rightTree}
              selectedPath={selectedPath}
              onSelect={(path, node) => handleSelection(path, node, 'right')}
              label={rightLabel}
              changeMap={changeMap}
            />
          </Grid>
        </Grid>

        {selectedPath && (
          <Box sx={{ mt: 2, p: 2, backgroundColor: '#f9fafb', borderRadius: 1 }}>
            <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 500 }}>
              Currently comparing:
            </Typography>
            <Typography variant="body2" sx={{ color: '#111827', fontWeight: 600, mt: 0.5 }}>
              {selectedPath}
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Change Summary */}
      <ChangeSummaryPanel
        changeMap={changeMap}
        selectedPath={selectedPath}
        onNavigate={(path, node) => handleSelection(path, node, 'left')}
        tree={leftTree}
      />

      {/* Comparison View */}
      <Box sx={{ mb: 3 }}>
        <BOMItemsComparisonView
          leftItems={leftItems}
          rightItems={rightItems}
          leftLabel={leftLabel}
          rightLabel={rightLabel}
          leftNodeExists={!!selectedLeftNode}
          rightNodeExists={!!selectedRightNode}
        />
      </Box>

      {/* Legend */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600, display: 'block', mb: 1 }}>
          Color Legend:
        </Typography>
        <Stack direction="row" spacing={3}>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Box sx={{ width: 12, height: 12, backgroundColor: '#22c55e', borderRadius: '2px' }} />
            <Typography variant="caption" sx={{ color: '#6b7280' }}>
              Added / New Values
            </Typography>
          </Stack>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Box sx={{ width: 12, height: 12, backgroundColor: '#ef4444', borderRadius: '2px' }} />
            <Typography variant="caption" sx={{ color: '#6b7280' }}>
              Removed / Old Values
            </Typography>
          </Stack>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Box sx={{ width: 12, height: 12, backgroundColor: '#f59e0b', borderRadius: '2px' }} />
            <Typography variant="caption" sx={{ color: '#6b7280' }}>
              Modified
            </Typography>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
};

/**
 * Helper to find node by path
 */
function findNodeByPath(tree: BOMTreeNode, path: string): BOMTreeNode | null {
  if (tree.path === path) return tree;

  for (const child of tree.children) {
    const found = findNodeByPath(child, path);
    if (found) return found;
  }

  return null;
}
