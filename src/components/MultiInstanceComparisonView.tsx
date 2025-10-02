import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Stack,
  Chip,
  Divider,
  Alert,
  Grid,
} from '@mui/material';
import { bomList } from '../data/sampleData';
import { buildBOMTree, BOMTreeNode, flattenBOMTree } from '../utils/bomHierarchy';
import { detectBOMTreeChanges } from '../utils/bomChangeDetection';
import { IBOMItem } from '../types/interfaces';

interface MultiInstanceComparisonViewProps {
  changes: any[];  // Array of AggregatedChange objects
  categoryTitle: string; // "Added Items", "Deleted Items", etc.
  categoryType: 'added' | 'deleted' | 'changed'; // To filter instances
}

interface ItemInstance {
  bomName: string;
  fullPath: string;
  leftItem: IBOMItem | null;
  rightItem: IBOMItem | null;
  changeType: 'added' | 'removed' | 'modified' | 'unchanged';
  changes: any[];
}

export const MultiInstanceComparisonView: React.FC<MultiInstanceComparisonViewProps> = ({
  changes,
  categoryTitle,
  categoryType,
}) => {
  // Find all instances of all items across all BOMs
  const allInstances = useMemo(() => {
    const foundInstances: Array<{ itemCode: string; itemName: string; instances: ItemInstance[] }> = [];

    // Group changes by item code
    changes.forEach((change) => {
      const itemCode = change.code;
      const itemName = change.name;
      const itemInstances: ItemInstance[] = [];

      // Compare specific BOM pairs: QAB1 (0→1) and PCB Assembly (2→3)
      const bomPairs = [
        { leftIndex: 0, rightIndex: 1, name: 'QAB1' },
        { leftIndex: 2, rightIndex: 3, name: 'PCB Assembly' }
      ];

      for (const pair of bomPairs) {
        if (pair.rightIndex >= bomList.length) continue; // Skip if index out of bounds

        const leftBomData = bomList[pair.leftIndex].data;
        const rightBomData = bomList[pair.rightIndex].data;
        const bomName = pair.name;

        const leftTree = buildBOMTree(leftBomData);
        const rightTree = buildBOMTree(rightBomData);
        const changeMap = detectBOMTreeChanges(leftTree, rightTree);

        // Flatten both trees and find items matching the code
        const leftFlat = flattenBOMTree(leftTree);
        const rightFlat = flattenBOMTree(rightTree);

        // Find all nodes with matching code (both raw materials and BOMs)
        const leftMatches = leftFlat.filter(
          (node) => node.code === itemCode
        );
        const rightMatches = rightFlat.filter(
          (node) => node.code === itemCode
        );

        // Match by path
        const allPaths = new Set([
          ...leftMatches.map((n) => n.path),
          ...rightMatches.map((n) => n.path),
        ]);

        allPaths.forEach((path) => {
          const leftNode = leftMatches.find((n) => n.path === path);
          const rightNode = rightMatches.find((n) => n.path === path);
          const changeInfo = changeMap.get(path);

          if (!leftNode && !rightNode) return;

          let changeType: 'added' | 'removed' | 'modified' | 'unchanged' = 'unchanged';
          if (!leftNode) changeType = 'added';
          else if (!rightNode) changeType = 'removed';
          else if (changeInfo && changeInfo.changeType === 'modified') changeType = 'modified';

          // Filter based on category type
          const shouldInclude =
            (categoryType === 'added' && changeType === 'added') ||
            (categoryType === 'deleted' && changeType === 'removed') ||
            (categoryType === 'changed' && changeType === 'modified');

          if (!shouldInclude) return;

          itemInstances.push({
            bomName,
            fullPath: path,
            leftItem: leftNode ? (leftNode.data as IBOMItem) : null,
            rightItem: rightNode ? (rightNode.data as IBOMItem) : null,
            changeType,
            changes: changeInfo?.changes || [],
          });
        });
      }

      if (itemInstances.length > 0) {
        foundInstances.push({ itemCode, itemName, instances: itemInstances });
      }
    });

    return foundInstances;
  }, [changes, categoryType]);

  if (allInstances.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Alert severity="info">
          No items found in {categoryTitle}.
        </Alert>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, border: '1px solid #e5e7eb' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#111827', mb: 1 }}>
          {categoryTitle} - Detailed View
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Showing all occurrences across BOMs with complete hierarchical paths and field changes
        </Typography>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* All Items */}
      <Stack spacing={4}>
        {allInstances.map((item, itemIdx) => (
          <Box key={itemIdx}>
            {/* Item Header */}
            <Box sx={{ mb: 2, p: 2, backgroundColor: '#f9fafb', borderRadius: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#111827' }}>
                {item.itemCode} - {item.itemName}
              </Typography>
              <Typography variant="caption" sx={{ color: '#6b7280' }}>
                {item.instances.length} instance{item.instances.length > 1 ? 's' : ''} found
              </Typography>
            </Box>

            {/* Instances for this item */}
            <Stack spacing={3} sx={{ pl: 2 }}>
              {item.instances.map((instance, instIdx) => (
                <Box key={instIdx}>
                  <InstanceComparisonCard instance={instance} />
                  {instIdx < item.instances.length - 1 && <Divider sx={{ mt: 3 }} />}
                </Box>
              ))}
            </Stack>

            {itemIdx < allInstances.length - 1 && <Divider sx={{ mt: 4, mb: 4 }} />}
          </Box>
        ))}
      </Stack>
    </Paper>
  );
};

interface InstanceComparisonCardProps {
  instance: ItemInstance;
}

const InstanceComparisonCard: React.FC<InstanceComparisonCardProps> = ({ instance }) => {
  const getStatusColor = () => {
    switch (instance.changeType) {
      case 'added':
        return { bg: '#dcfce7', border: '#22c55e', text: '#15803d' };
      case 'removed':
        return { bg: '#fee2e2', border: '#ef4444', text: '#dc2626' };
      case 'modified':
        return { bg: '#fef3c7', border: '#f59e0b', text: '#d97706' };
      default:
        return { bg: '#f3f4f6', border: '#9ca3af', text: '#6b7280' };
    }
  };

  const statusColors = getStatusColor();

  // Build hierarchical path for display
  const pathParts = instance.fullPath.split('.');
  const hierarchyDisplay = pathParts.join(' → ');

  return (
    <Box>
      {/* Instance Header */}
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <Chip
          label={instance.changeType.toUpperCase()}
          size="small"
          sx={{
            backgroundColor: statusColors.bg,
            border: `1px solid ${statusColors.border}`,
            color: statusColors.text,
            fontWeight: 600,
          }}
        />
        <Typography variant="body2" sx={{ color: '#6b7280' }}>
          📍 <span style={{ fontWeight: 600, color: '#111827' }}>{hierarchyDisplay}</span>
        </Typography>
      </Stack>

      {/* Side by Side Comparison */}
      <Grid container spacing={2}>
        {/* Left (Old Version) */}
        <Grid item xs={6}>
          <Paper
            sx={{
              p: 2,
              backgroundColor: instance.changeType === 'removed' ? '#fef2f2' : '#ffffff',
              border: `1px solid ${instance.changeType === 'removed' ? '#ef4444' : '#e5e7eb'}`,
            }}
          >
            <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600, mb: 1, display: 'block' }}>
              OLD VERSION
            </Typography>
            {instance.leftItem ? (
              <ItemDetails item={instance.leftItem} changedFields={instance.changes.map(c => c.fieldName)} />
            ) : (
              <Typography variant="body2" color="text.secondary" fontStyle="italic">
                (not present)
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Right (New Version) */}
        <Grid item xs={6}>
          <Paper
            sx={{
              p: 2,
              backgroundColor: instance.changeType === 'added' ? '#dcfce7' : '#ffffff',
              border: `1px solid ${instance.changeType === 'added' ? '#22c55e' : '#e5e7eb'}`,
            }}
          >
            <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600, mb: 1, display: 'block' }}>
              NEW VERSION
            </Typography>
            {instance.rightItem ? (
              <ItemDetails item={instance.rightItem} changedFields={instance.changes.map(c => c.fieldName)} />
            ) : (
              <Typography variant="body2" color="text.secondary" fontStyle="italic">
                (not present)
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Changes Details */}
      {instance.changes.length > 0 && (
        <Box sx={{ mt: 2, p: 2, backgroundColor: '#fffbeb', borderRadius: 1, border: '1px solid #fde68a' }}>
          <Typography variant="caption" sx={{ fontWeight: 600, color: '#92400e', mb: 1, display: 'block' }}>
            CHANGES DETECTED:
          </Typography>
          <Stack spacing={0.5}>
            {instance.changes.map((change, idx) => (
              <Box
                key={idx}
                sx={{
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  '&:hover': {
                    backgroundColor: '#fef3c7',
                  },
                  transition: 'background-color 0.2s',
                }}
                onClick={() => {
                  // Scroll to and highlight the field in the comparison view
                  const fieldName = change.fieldName.toLowerCase();
                  const element = document.querySelector(`[data-field="${fieldName}"]`);
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }}
              >
                <Typography variant="caption" sx={{ color: '#78350f' }}>
                  • <strong>{change.fieldName}</strong>: {String(change.leftValue || 'N/A')} → {String(change.rightValue || 'N/A')}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>
      )}
    </Box>
  );
};

interface ItemDetailsProps {
  item: IBOMItem;
  changedFields?: string[];
}

const ItemDetails: React.FC<ItemDetailsProps> = ({ item, changedFields = [] }) => {
  const isBOM = !!item.sub_bom;
  const itemName = item.raw_material_item?.name || item.sub_bom?.bom_name || 'Unknown';
  const tags = item.raw_material_item?.tags || [];
  const subItemCount = item.sub_bom_items?.length || 0;

  const isFieldChanged = (fieldName: string) => {
    return changedFields.some(f => f.toLowerCase().includes(fieldName.toLowerCase()));
  };

  const getHighlightStyle = (fieldName: string) => {
    return isFieldChanged(fieldName) ? {
      backgroundColor: '#fff4e6',
      borderLeft: '3px solid #f59e0b',
      paddingLeft: '8px',
      marginLeft: '-8px'
    } : {};
  };

  return (
    <Stack spacing={1}>
      <Stack direction="row" spacing={1} alignItems="center">
        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#111827' }}>
          {itemName}
        </Typography>
        {isBOM && (
          <Chip
            label="BOM"
            size="small"
            sx={{
              height: 18,
              fontSize: '0.65rem',
              backgroundColor: '#dbeafe',
              color: '#1e40af',
              fontWeight: 600
            }}
          />
        )}
      </Stack>
      <Stack direction="row" spacing={1} alignItems="center" sx={getHighlightStyle('quantity')}>
        <Typography variant="caption" sx={{ color: '#6b7280' }}>
          Quantity:
        </Typography>
        <Typography variant="caption" sx={{ fontWeight: 600, color: '#111827' }}>
          {item.quantity} {typeof item.measurement_unit === 'string' ? item.measurement_unit : ((item.measurement_unit as any)?.abbreviation || '')}
        </Typography>
      </Stack>
      {!isBOM && (
        <Stack direction="row" spacing={1} alignItems="center" sx={getHighlightStyle('cost')}>
          <Typography variant="caption" sx={{ color: '#6b7280' }}>
            Cost/Unit:
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 600, color: '#111827' }}>
            {item.cost_per_unit || 'N/A'}
          </Typography>
        </Stack>
      )}
      {isBOM && subItemCount > 0 && (
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="caption" sx={{ color: '#6b7280' }}>
            Sub-Items:
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 600, color: '#111827' }}>
            {subItemCount} item{subItemCount > 1 ? 's' : ''}
          </Typography>
        </Stack>
      )}
      {!isBOM && tags.length > 0 && (
        <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 0.5 }}>
          {tags.slice(0, 3).map((tag, idx) => (
            <Chip
              key={idx}
              label={tag}
              size="small"
              sx={{ height: 18, fontSize: '0.65rem', backgroundColor: '#f3f4f6' }}
            />
          ))}
          {tags.length > 3 && (
            <Chip
              label={`+${tags.length - 3}`}
              size="small"
              sx={{ height: 18, fontSize: '0.65rem' }}
            />
          )}
        </Stack>
      )}
    </Stack>
  );
};
