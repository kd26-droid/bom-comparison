import React, { useState, useMemo } from 'react';
import {
  Box,
  FormControl,
  Popover,
  Typography,
  Stack,
  IconButton,
  TextField,
  Chip,
} from '@mui/material';
import {
  ExpandMore as ExpandIcon,
  ChevronRight as CollapseIcon,
  Edit as ModifiedIcon,
  Delete as DeletedIcon,
  Add as AddedIcon,
  CheckCircle as UnchangedIcon,
} from '@mui/icons-material';
import { BOMTreeNode } from '../utils/bomHierarchy';
import { ChangeType, NodeChangeInfo, hasChangesInSubtree } from '../utils/bomChangeDetection';

interface HierarchicalBOMDropdownProps {
  tree: BOMTreeNode;
  selectedPath: string | null;
  onSelect: (path: string, node: BOMTreeNode) => void;
  label: string;
  changeMap?: Map<string, NodeChangeInfo>;
  disabled?: boolean;
}

export const HierarchicalBOMDropdown: React.FC<HierarchicalBOMDropdownProps> = ({
  tree,
  selectedPath,
  onSelect,
  label,
  changeMap,
  disabled = false,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set([tree.path]));

  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const toggleExpand = (path: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedNodes(newExpanded);
  };

  const handleSelectNode = (path: string, node: BOMTreeNode) => {
    onSelect(path, node);
    handleClose();
  };

  const getSelectedNodeName = (): string => {
    if (!selectedPath) return 'Select BOM';

    const findNode = (node: BOMTreeNode): BOMTreeNode | null => {
      if (node.path === selectedPath) return node;
      for (const child of node.children) {
        const found = findNode(child);
        if (found) return found;
      }
      return null;
    };

    const selectedNode = findNode(tree);
    return selectedNode ? `${selectedNode.code} - ${selectedNode.name}` : 'Select BOM';
  };

  const getChangeIcon = (changeType: ChangeType | undefined, changeCount?: number) => {
    if (!changeType || changeType === 'unchanged') {
      return null;
    }

    const icon = (() => {
      switch (changeType) {
        case 'modified':
          return <ModifiedIcon sx={{ fontSize: 16, color: '#f59e0b' }} />;
        case 'removed':
          return <DeletedIcon sx={{ fontSize: 16, color: '#ef4444' }} />;
        case 'added':
          return <AddedIcon sx={{ fontSize: 16, color: '#22c55e' }} />;
        default:
          return null;
      }
    })();

    // If there's a change count, show it as a badge
    if (changeCount && changeCount > 0) {
      return (
        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
          {icon}
          <Chip
            label={changeCount}
            size="small"
            sx={{
              height: 14,
              minWidth: 14,
              fontSize: '0.6rem',
              position: 'absolute',
              top: -4,
              right: -8,
              padding: '0 4px',
              backgroundColor: changeType === 'modified' ? '#f59e0b' : changeType === 'removed' ? '#ef4444' : '#22c55e',
              color: '#fff',
              fontWeight: 600,
              '& .MuiChip-label': {
                padding: '0 2px',
              }
            }}
          />
        </Box>
      );
    }

    return icon;
  };

  const getNodeChangeInfo = (path: string): NodeChangeInfo | undefined => {
    return changeMap?.get(path);
  };

  const renderTreeNode = (node: BOMTreeNode, depth: number = 0): React.ReactNode => {
    const isExpanded = expandedNodes.has(node.path);
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedPath === node.path;
    const changeInfo = getNodeChangeInfo(node.path);

    // Show icon if this node has changes OR any of its descendants have changes
    const hasOwnChanges = changeInfo?.changeType !== 'unchanged' && changeInfo?.changeType;
    const hasDescendantChanges = changeMap ? hasChangesInSubtree(node.path, changeMap) : false;
    const changeType = hasOwnChanges ? hasOwnChanges : (hasDescendantChanges ? 'modified' : undefined);

    // Calculate total change count (own changes + descendant changes)
    const getTotalChangeCount = () => {
      let count = changeInfo?.changes?.length || 0;
      if (changeMap) {
        changeMap.forEach((info, path) => {
          // Count changes in descendants (not self)
          if (path !== node.path && path.startsWith(node.path + '.') && info.changeType !== 'unchanged') {
            count += info.changes?.length || 0;
          }
        });
      }
      return count;
    };
    const totalChangeCount = getTotalChangeCount();

    return (
      <Box key={node.path}>
        {/* Node Row */}
        <Box
          onClick={() => handleSelectNode(node.path, node)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            padding: '8px 12px',
            paddingLeft: `${depth * 20 + 12}px`,
            cursor: 'pointer',
            backgroundColor: isSelected ? '#e0f2fe' : 'transparent',
            borderLeft: isSelected ? '3px solid #0ea5e9' : 'none',
            '&:hover': {
              backgroundColor: isSelected ? '#e0f2fe' : '#f9fafb',
            },
            transition: 'all 0.2s',
          }}
        >
          {/* Expand/Collapse Icon */}
          {hasChildren ? (
            <IconButton
              size="small"
              onClick={(e) => toggleExpand(node.path, e)}
              sx={{ padding: '2px', marginRight: '4px' }}
            >
              {isExpanded ? (
                <ExpandIcon sx={{ fontSize: 18 }} />
              ) : (
                <CollapseIcon sx={{ fontSize: 18 }} />
              )}
            </IconButton>
          ) : (
            <Box sx={{ width: 26 }} />
          )}

          {/* Change Icon */}
          <Box sx={{ width: 24, marginRight: '8px', display: 'flex', alignItems: 'center' }}>
            {getChangeIcon(changeType, totalChangeCount > 0 ? totalChangeCount : undefined)}
          </Box>

          {/* Node Label */}
          <Stack direction="column" spacing={0} sx={{ flex: 1 }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: isSelected ? 600 : 400,
                color: changeType === 'removed' ? '#ef4444' : '#374151',
              }}
            >
              {node.code}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: '#6b7280',
                fontSize: '0.7rem',
              }}
            >
              {node.name}
            </Typography>
          </Stack>

          {/* Type Badge */}
          <Chip
            label={node.type === 'main' ? 'MAIN' : node.type === 'sub-bom' ? 'SUB' : node.type === 'sub-sub-bom' ? 'SUB-SUB' : 'RM'}
            size="small"
            sx={{
              height: 20,
              fontSize: '0.65rem',
              backgroundColor: node.type === 'main' ? '#dbeafe' : node.type === 'raw-material' ? '#fef3c7' : '#e0e7ff',
              color: node.type === 'main' ? '#1e40af' : node.type === 'raw-material' ? '#92400e' : '#3730a3',
            }}
          />
        </Box>

        {/* Children */}
        {hasChildren && isExpanded && (
          <Box>
            {node.children.map(child => renderTreeNode(child, depth + 1))}
          </Box>
        )}
      </Box>
    );
  };

  return (
    <FormControl fullWidth size="small">
      <Typography variant="caption" sx={{ mb: 0.5, color: '#6b7280', fontWeight: 500 }}>
        {label}
      </Typography>
      <Box
        onClick={disabled ? undefined : handleClick}
        sx={{
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          padding: '10px 14px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          backgroundColor: disabled ? '#f3f4f6' : '#ffffff',
          opacity: disabled ? 0.6 : 1,
          '&:hover': {
            borderColor: disabled ? '#d1d5db' : '#0ea5e9',
            boxShadow: disabled ? 'none' : '0 0 0 3px rgba(14, 165, 233, 0.1)',
          },
          transition: 'all 0.2s',
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="body2" sx={{ color: selectedPath ? '#111827' : '#9ca3af' }}>
            {getSelectedNodeName()}
          </Typography>
          <ExpandIcon sx={{ color: '#6b7280', fontSize: 20 }} />
        </Stack>
      </Box>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        PaperProps={{
          sx: {
            marginTop: '8px',
            width: anchorEl?.offsetWidth || 400,
            maxHeight: '500px',
            overflow: 'auto',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e5e7eb',
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            padding: '12px 16px',
            borderBottom: '1px solid #e5e7eb',
            backgroundColor: '#f9fafb',
            position: 'sticky',
            top: 0,
            zIndex: 1,
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#374151' }}>
            Select BOM Level
          </Typography>
          {changeMap && changeMap.size > 0 && (
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <ModifiedIcon sx={{ fontSize: 14, color: '#f59e0b' }} />
                <Typography variant="caption" sx={{ color: '#6b7280' }}>
                  Modified
                </Typography>
              </Stack>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <DeletedIcon sx={{ fontSize: 14, color: '#ef4444' }} />
                <Typography variant="caption" sx={{ color: '#6b7280' }}>
                  Deleted
                </Typography>
              </Stack>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <AddedIcon sx={{ fontSize: 14, color: '#22c55e' }} />
                <Typography variant="caption" sx={{ color: '#6b7280' }}>
                  Added
                </Typography>
              </Stack>
            </Stack>
          )}
        </Box>

        {/* Tree */}
        <Box sx={{ padding: '8px 0' }}>
          {renderTreeNode(tree)}
        </Box>
      </Popover>
    </FormControl>
  );
};
