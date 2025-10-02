import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Stack,
  Chip,
  Divider,
  Alert,
} from '@mui/material';
import { IBOMItem } from '../types/interfaces';
import { extractBOMItemFields } from '../utils/bomHierarchy';

interface BOMItemsComparisonViewProps {
  leftItems: IBOMItem[];
  rightItems: IBOMItem[];
  leftLabel: string;
  rightLabel: string;
  leftNodeExists: boolean;
  rightNodeExists: boolean;
}

interface ItemComparison {
  code: string;
  leftItem: IBOMItem | null;
  rightItem: IBOMItem | null;
  isChanged: boolean;
  isAdded: boolean;
  isRemoved: boolean;
  changedFields?: Set<string>; // which specific fields changed
}

export const BOMItemsComparisonView: React.FC<BOMItemsComparisonViewProps> = ({
  leftItems,
  rightItems,
  leftLabel,
  rightLabel,
  leftNodeExists,
  rightNodeExists,
}) => {
  // Handle case where node doesn't exist on one side - show side-by-side comparison
  if (!leftNodeExists || !rightNodeExists) {
    return (
      <Paper sx={{ overflow: 'hidden', border: '1px solid #e5e7eb' }}>
        {/* Headers */}
        <Box sx={{ display: 'flex', borderBottom: '2px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
          <Box
            sx={{
              flex: 1,
              p: 2,
              borderRight: '1px solid #e5e7eb',
              textAlign: 'center',
            }}
          >
            <Typography variant="subtitle1" fontWeight="600" color="#374151">
              {leftLabel}
            </Typography>
          </Box>
          <Box
            sx={{
              flex: 1,
              p: 2,
              textAlign: 'center',
            }}
          >
            <Typography variant="subtitle1" fontWeight="600" color="#374151">
              {rightLabel}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', minHeight: '120px' }}>
          {/* Left Side */}
          <Box
            sx={{
              flex: 1,
              p: 2,
              borderRight: '1px solid #e5e7eb',
              backgroundColor: !leftNodeExists ? 'transparent' : '#fef2f2',
              borderLeft: !leftNodeExists ? 'none' : '3px solid #ef4444',
            }}
          >
            {leftNodeExists && leftItems.length > 0 ? (
              <Stack spacing={1.5}>
                {leftItems.map((item, idx) => {
                  const fields = extractBOMItemFields(item);
                  return (
                    <Box key={idx}>
                      <ItemFieldsDisplay
                        fields={fields}
                        isRemoved={true}
                        changedFields={new Set()}
                        side="left"
                      />
                    </Box>
                  );
                })}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary" fontStyle="italic">
                (not present)
              </Typography>
            )}
          </Box>

          {/* Right Side */}
          <Box
            sx={{
              flex: 1,
              p: 2,
              backgroundColor: !rightNodeExists ? 'transparent' : '#e6ffed',
              borderLeft: !rightNodeExists ? 'none' : '3px solid #22c55e',
            }}
          >
            {rightNodeExists && rightItems.length > 0 ? (
              <Stack spacing={1.5}>
                {rightItems.map((item, idx) => {
                  const fields = extractBOMItemFields(item);
                  return (
                    <Box key={idx}>
                      <ItemFieldsDisplay
                        fields={fields}
                        isAdded={true}
                        changedFields={new Set()}
                        side="right"
                      />
                    </Box>
                  );
                })}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary" fontStyle="italic">
                (not present)
              </Typography>
            )}
          </Box>
        </Box>
      </Paper>
    );
  }

  // Create comparison map
  const comparisons = createItemComparisons(leftItems, rightItems);

  if (comparisons.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          No items to compare at this level.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ overflow: 'hidden', border: '1px solid #e5e7eb' }}>
      {/* Headers */}
      <Box sx={{ display: 'flex', borderBottom: '2px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
        <Box
          sx={{
            flex: 1,
            p: 2,
            borderRight: '1px solid #e5e7eb',
            textAlign: 'center',
          }}
        >
          <Typography variant="subtitle1" fontWeight="600" color="#374151">
            {leftLabel}
          </Typography>
        </Box>
        <Box
          sx={{
            flex: 1,
            p: 2,
            textAlign: 'center',
          }}
        >
          <Typography variant="subtitle1" fontWeight="600" color="#374151">
            {rightLabel}
          </Typography>
        </Box>
      </Box>

      {/* Items */}
      {comparisons.map((comparison, index) => (
        <ItemComparisonRow
          key={comparison.code}
          comparison={comparison}
          isLast={index === comparisons.length - 1}
        />
      ))}
    </Paper>
  );
};

interface ItemComparisonRowProps {
  comparison: ItemComparison;
  isLast: boolean;
}

const ItemComparisonRow: React.FC<ItemComparisonRowProps> = ({ comparison, isLast }) => {
  const leftFields = comparison.leftItem ? extractBOMItemFields(comparison.leftItem) : null;
  const rightFields = comparison.rightItem ? extractBOMItemFields(comparison.rightItem) : null;

  // Only highlight entire box if item is added/removed
  // For changed items, we'll highlight specific fields instead
  const getBackgroundColor = (side: 'left' | 'right') => {
    if (comparison.isRemoved && side === 'left') {
      return '#fef2f2'; // Red for removed
    }
    if (comparison.isAdded && side === 'right') {
      return '#e6ffed'; // Green for added
    }
    return 'transparent'; // Don't highlight entire box for changes
  };

  const getBorderColor = (side: 'left' | 'right') => {
    if (comparison.isRemoved && side === 'left') {
      return '3px solid #ef4444';
    }
    if (comparison.isAdded && side === 'right') {
      return '3px solid #22c55e';
    }
    return 'none'; // Don't add border for changes
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '120px' }}>
      {/* Left Side */}
      <Box
        sx={{
          flex: 1,
          p: 2,
          borderRight: '1px solid #e5e7eb',
          borderBottom: isLast ? 'none' : '1px solid #f3f4f6',
          backgroundColor: getBackgroundColor('left'),
          borderLeft: getBorderColor('left'),
          transition: 'all 0.2s ease-in-out',
        }}
      >
        {leftFields ? (
          <ItemFieldsDisplay
            fields={leftFields}
            isRemoved={comparison.isRemoved}
            changedFields={comparison.changedFields}
            side="left"
          />
        ) : (
          <Typography variant="body2" color="text.secondary" fontStyle="italic">
            (not present)
          </Typography>
        )}
      </Box>

      {/* Right Side */}
      <Box
        sx={{
          flex: 1,
          p: 2,
          borderBottom: isLast ? 'none' : '1px solid #f3f4f6',
          backgroundColor: getBackgroundColor('right'),
          borderLeft: getBorderColor('right'),
          transition: 'all 0.2s ease-in-out',
        }}
      >
        {rightFields ? (
          <ItemFieldsDisplay
            fields={rightFields}
            isAdded={comparison.isAdded}
            changedFields={comparison.changedFields}
            side="right"
          />
        ) : (
          <Typography variant="body2" color="text.secondary" fontStyle="italic">
            (not present)
          </Typography>
        )}
      </Box>
    </Box>
  );
};

interface ItemFieldsDisplayProps {
  fields: any;
  isRemoved?: boolean;
  isAdded?: boolean;
  changedFields?: Set<string>;
  side: 'left' | 'right';
}

const ItemFieldsDisplay: React.FC<ItemFieldsDisplayProps> = ({ fields, isRemoved, isAdded, changedFields, side }) => {
  const getFieldStyle = (fieldName: string) => {
    if (isRemoved || isAdded) return {}; // Entire item is highlighted already
    if (!changedFields || !changedFields.has(fieldName)) return {};

    // Field changed - highlight it
    return {
      backgroundColor: side === 'left' ? '#fef2f2' : '#e6ffed',
      padding: '4px 8px',
      borderRadius: '4px',
      borderLeft: side === 'left' ? '2px solid #ef4444' : '2px solid #22c55e',
    };
  };
  return (
    <Stack spacing={1.5}>
      {/* Header */}
      <Stack direction="row" spacing={1} alignItems="center">
        <Typography variant="subtitle2" fontWeight="600" sx={{ color: '#111827' }}>
          {fields.code}
        </Typography>
        <Chip
          label={fields.type === 'sub-bom' ? 'SUB-BOM' : 'RAW MATERIAL'}
          size="small"
          sx={{
            height: 18,
            fontSize: '0.65rem',
            backgroundColor: fields.type === 'sub-bom' ? '#e0e7ff' : '#fef3c7',
            color: fields.type === 'sub-bom' ? '#3730a3' : '#92400e',
          }}
        />
        {isRemoved && (
          <Chip label="REMOVED" size="small" color="error" sx={{ height: 18, fontSize: '0.65rem' }} />
        )}
        {isAdded && (
          <Chip label="ADDED" size="small" color="success" sx={{ height: 18, fontSize: '0.65rem' }} />
        )}
      </Stack>

      <Typography variant="body2" sx={{ color: '#6b7280' }}>
        {fields.name}
      </Typography>

      <Divider />

      {/* Fields Grid */}
      <Grid container spacing={1}>
        <Grid item xs={6}>
          <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 500 }}>
            Quantity
          </Typography>
          <Typography variant="body2" fontFamily="monospace" sx={{ color: '#111827', ...getFieldStyle('quantity') }}>
            {fields.quantity}
          </Typography>
        </Grid>

        <Grid item xs={6}>
          <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 500 }}>
            Cost Per Unit
          </Typography>
          <Typography variant="body2" fontFamily="monospace" sx={{ color: '#111827', ...getFieldStyle('cost_per_unit') }}>
            ₹{fields.cost_per_unit}
          </Typography>
        </Grid>

        {fields.type === 'raw-material' && fields.tags && fields.tags.length > 0 && (
          <Grid item xs={12}>
            <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 500 }}>
              Tags
            </Typography>
            <Stack direction="row" spacing={0.5} sx={{ mt: 0.5, flexWrap: 'wrap' }}>
              {fields.tags.map((tag: string, idx: number) => (
                <Chip
                  key={idx}
                  label={tag}
                  size="small"
                  sx={{
                    height: 16,
                    fontSize: '0.6rem',
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                  }}
                />
              ))}
            </Stack>
          </Grid>
        )}

        {fields.alternates && fields.alternates.length > 0 && (
          <Grid item xs={12}>
            <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 500 }}>
              Alternates
            </Typography>
            <Typography variant="body2" fontFamily="monospace" sx={{ color: '#111827' }}>
              {fields.alternates.length} alternate(s) available
            </Typography>
          </Grid>
        )}

        {fields.custom_sections && fields.custom_sections.length > 0 && (
          <Grid item xs={12}>
            <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 500, mb: 0.5 }}>
              Custom Fields
            </Typography>
            {fields.custom_sections.map((section: any, secIdx: number) =>
              section.custom_fields?.map((field: any, fieldIdx: number) => (
                <Box key={`${secIdx}-${fieldIdx}`} sx={{ mt: 0.5, ...getFieldStyle(`custom_field_${field.name}`) }}>
                  <Typography variant="caption" sx={{ color: '#9ca3af' }}>
                    {field.name}:
                  </Typography>
                  <Typography variant="body2" fontFamily="monospace" sx={{ color: '#111827', ml: 1 }}>
                    {String(field.value)}
                  </Typography>
                </Box>
              ))
            )}
          </Grid>
        )}
      </Grid>
    </Stack>
  );
};

/**
 * Create item comparisons by matching items from left and right by code
 */
function createItemComparisons(leftItems: IBOMItem[], rightItems: IBOMItem[]): ItemComparison[] {
  const comparisons: ItemComparison[] = [];

  // Create maps by code for quick lookup
  const leftMap = new Map<string, IBOMItem>();
  leftItems.forEach(item => {
    const code = item.sub_bom?.bom_code || item.raw_material_item?.code || 'unknown';
    leftMap.set(code, item);
  });

  const rightMap = new Map<string, IBOMItem>();
  rightItems.forEach(item => {
    const code = item.sub_bom?.bom_code || item.raw_material_item?.code || 'unknown';
    rightMap.set(code, item);
  });

  // Get all unique codes
  const allCodes = new Set([...leftMap.keys(), ...rightMap.keys()]);

  allCodes.forEach(code => {
    const leftItem = leftMap.get(code) || null;
    const rightItem = rightMap.get(code) || null;

    const isAdded = !leftItem && !!rightItem;
    const isRemoved = !!leftItem && !rightItem;
    const changedFields = leftItem && rightItem ? getChangedFields(leftItem, rightItem) : new Set<string>();
    const isChanged = changedFields.size > 0;

    comparisons.push({
      code,
      leftItem,
      rightItem,
      isChanged,
      isAdded,
      isRemoved,
      changedFields,
    });
  });

  return comparisons;
}

/**
 * Get which specific fields changed between left and right
 */
function getChangedFields(left: IBOMItem, right: IBOMItem): Set<string> {
  const changed = new Set<string>();

  // Compare key fields
  if (left.quantity !== right.quantity) changed.add('quantity');
  if (left.cost_per_unit !== right.cost_per_unit) changed.add('cost_per_unit');

  // Compare custom fields by name
  const leftCustomFields = new Map<string, any>();
  const rightCustomFields = new Map<string, any>();

  left.custom_sections?.forEach(section => {
    section.custom_fields?.forEach(field => {
      leftCustomFields.set(field.name, field.value);
    });
  });

  right.custom_sections?.forEach(section => {
    section.custom_fields?.forEach(field => {
      rightCustomFields.set(field.name, field.value);
    });
  });

  // Check which custom fields changed
  const allFieldNames = new Set([...leftCustomFields.keys(), ...rightCustomFields.keys()]);
  allFieldNames.forEach(fieldName => {
    const leftVal = leftCustomFields.get(fieldName);
    const rightVal = rightCustomFields.get(fieldName);
    if (leftVal !== rightVal) {
      changed.add(`custom_field_${fieldName}`);
    }
  });

  return changed;
}
