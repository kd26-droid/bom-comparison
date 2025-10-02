import { NodeChangeInfo, FieldChange } from './bomChangeDetection';
import { BOMTreeNode, BOMNodeType } from './bomHierarchy';

export type TabType = 'ITEM' | 'BOM' | 'OVERALL';

export interface AggregatedChange {
  id: string;                    // Unique identifier
  path: string;                  // Full path (e.g., "QAB1.QASB1.QASSB1")
  code: string;                  // Node code (e.g., "RM1")
  name: string;                  // Node name
  parentPath: string;            // Parent hierarchy for display (e.g., "QASB1 > QASSB1")
  changeType: 'added' | 'removed' | 'modified';
  changeCount: number;           // Number of field changes
  changes: FieldChange[];        // Array of field changes from bomChangeDetection
  nodeType: BOMNodeType;
  bomId?: string;                // BOM identifier for filtering (e.g., "bom1", "bom3")
}

export interface ChangeStats {
  added: AggregatedChange[];
  deleted: AggregatedChange[];
  changed: AggregatedChange[];
}

/**
 * Determine node type from path by checking if it exists in tree
 */
function getNodeTypeFromPath(path: string, tree: BOMTreeNode | null): BOMNodeType {
  if (!tree) {
    // Fallback: determine from path structure
    const pathParts = path.split('.');
    if (pathParts.length === 1) return 'main';
    if (pathParts.length === 2) return 'sub-bom';
    if (pathParts.length === 3) return 'sub-sub-bom';
    return 'raw-material';
  }

  // Search for node in tree
  const findNode = (node: BOMTreeNode): BOMTreeNode | null => {
    if (node.path === path) return node;
    for (const child of node.children) {
      const found = findNode(child);
      if (found) return found;
    }
    return null;
  };

  const foundNode = findNode(tree);
  return foundNode ? foundNode.type : 'raw-material';
}

/**
 * Check if a node is a raw material (leaf node)
 */
function isRawMaterial(nodeChange: NodeChangeInfo, leftTree: BOMTreeNode | null, rightTree: BOMTreeNode | null): boolean {
  // For added nodes, check right tree; for removed nodes, check left tree; for modified, check both
  let nodeType: BOMNodeType;
  if (nodeChange.changeType === 'added') {
    nodeType = getNodeTypeFromPath(nodeChange.nodePath, rightTree);
  } else if (nodeChange.changeType === 'removed') {
    nodeType = getNodeTypeFromPath(nodeChange.nodePath, leftTree);
  } else {
    nodeType = getNodeTypeFromPath(nodeChange.nodePath, leftTree || rightTree);
  }
  return nodeType === 'raw-material';
}

/**
 * Check if a node is a BOM (main, sub-bom, or sub-sub-bom)
 */
function isBOMNode(nodeChange: NodeChangeInfo, leftTree: BOMTreeNode | null, rightTree: BOMTreeNode | null): boolean {
  // For added nodes, check right tree; for removed nodes, check left tree; for modified, check both
  let nodeType: BOMNodeType;
  if (nodeChange.changeType === 'added') {
    nodeType = getNodeTypeFromPath(nodeChange.nodePath, rightTree);
  } else if (nodeChange.changeType === 'removed') {
    nodeType = getNodeTypeFromPath(nodeChange.nodePath, leftTree);
  } else {
    nodeType = getNodeTypeFromPath(nodeChange.nodePath, leftTree || rightTree);
  }
  return nodeType === 'main' || nodeType === 'sub-bom' || nodeType === 'sub-sub-bom';
}

/**
 * Build parent path display string from path
 */
function buildParentPath(path: string): string {
  const pathParts = path.split('.');
  if (pathParts.length <= 1) return '';
  return pathParts.slice(0, -1).join(' > ');
}

/**
 * Create aggregated change from node change info
 */
function createAggregatedChange(
  nodeChange: NodeChangeInfo,
  leftTree: BOMTreeNode | null,
  rightTree: BOMTreeNode | null
): AggregatedChange {
  // For added nodes, check right tree; for removed nodes, check left tree; for modified, check both
  let nodeType: BOMNodeType;
  if (nodeChange.changeType === 'added') {
    nodeType = getNodeTypeFromPath(nodeChange.nodePath, rightTree);
  } else if (nodeChange.changeType === 'removed') {
    nodeType = getNodeTypeFromPath(nodeChange.nodePath, leftTree);
  } else {
    nodeType = getNodeTypeFromPath(nodeChange.nodePath, leftTree || rightTree);
  }

  const parentPath = buildParentPath(nodeChange.nodePath);

  let changeType: 'added' | 'removed' | 'modified';
  if (nodeChange.changeType === 'removed') {
    changeType = 'removed';
  } else if (nodeChange.changeType === 'added') {
    changeType = 'added';
  } else {
    changeType = 'modified';
  }

  return {
    id: nodeChange.nodeId,
    path: nodeChange.nodePath,
    code: nodeChange.nodeCode,
    name: nodeChange.nodeName,
    parentPath,
    changeType,
    changeCount: nodeChange.changes.length,
    changes: nodeChange.changes,
    nodeType,
  };
}

/**
 * Extract all ITEM-level changes (raw materials only)
 */
export function aggregateItemChanges(
  changeMap: Map<string, NodeChangeInfo>,
  leftTree: BOMTreeNode | null,
  rightTree: BOMTreeNode | null
): ChangeStats {
  const added: AggregatedChange[] = [];
  const deleted: AggregatedChange[] = [];
  const changed: AggregatedChange[] = [];

  changeMap.forEach((nodeChange) => {
    // Skip if unchanged
    if (nodeChange.changeType === 'unchanged') return;

    // Only include raw materials
    if (!isRawMaterial(nodeChange, leftTree, rightTree)) return;

    const aggregated = createAggregatedChange(nodeChange, leftTree, rightTree);

    // Categorize
    if (aggregated.changeType === 'added') {
      added.push(aggregated);
    } else if (aggregated.changeType === 'removed') {
      deleted.push(aggregated);
    } else {
      changed.push(aggregated);
    }
  });

  return { added, deleted, changed };
}

/**
 * Extract all BOM-level changes (Main BOM, Sub-BOMs, Sub-Sub-BOMs only)
 */
export function aggregateBOMChanges(
  changeMap: Map<string, NodeChangeInfo>,
  leftTree: BOMTreeNode | null,
  rightTree: BOMTreeNode | null
): ChangeStats {
  const added: AggregatedChange[] = [];
  const deleted: AggregatedChange[] = [];
  const changed: AggregatedChange[] = [];

  console.log('=== aggregateBOMChanges DEBUG ===');
  console.log('Total changes in changeMap:', changeMap.size);

  changeMap.forEach((nodeChange) => {
    // Skip if unchanged
    if (nodeChange.changeType === 'unchanged') return;

    const nodeType = getNodeTypeFromPath(nodeChange.nodePath, leftTree || rightTree);
    const isBOM = isBOMNode(nodeChange, leftTree, rightTree);

    console.log('Node:', nodeChange.nodeCode, '| Type:', nodeType, '| IsBOM:', isBOM, '| Change:', nodeChange.changeType);

    // Only include BOM nodes (main, sub-bom, sub-sub-bom)
    if (!isBOM) return;

    const aggregated = createAggregatedChange(nodeChange, leftTree, rightTree);

    // Categorize
    if (aggregated.changeType === 'added') {
      console.log('  → ADDED to added array');
      added.push(aggregated);
    } else if (aggregated.changeType === 'removed') {
      console.log('  → ADDED to deleted array');
      deleted.push(aggregated);
    } else {
      console.log('  → ADDED to changed array');
      changed.push(aggregated);
    }
  });

  console.log('Final counts - Added:', added.length, 'Deleted:', deleted.length, 'Changed:', changed.length);
  console.log('=================================\n');

  return { added, deleted, changed };
}

/**
 * Extract ALL changes (both BOMs and Items combined)
 */
export function aggregateOverallChanges(
  changeMap: Map<string, NodeChangeInfo>,
  leftTree: BOMTreeNode | null,
  rightTree: BOMTreeNode | null
): ChangeStats {
  const added: AggregatedChange[] = [];
  const deleted: AggregatedChange[] = [];
  const changed: AggregatedChange[] = [];

  changeMap.forEach((nodeChange) => {
    // Skip if unchanged
    if (nodeChange.changeType === 'unchanged') return;

    const aggregated = createAggregatedChange(nodeChange, leftTree, rightTree);

    // Categorize
    if (aggregated.changeType === 'added') {
      added.push(aggregated);
    } else if (aggregated.changeType === 'removed') {
      deleted.push(aggregated);
    } else {
      changed.push(aggregated);
    }
  });

  return { added, deleted, changed };
}

/**
 * Get appropriate stats based on active tab
 */
export function getStatsForTab(
  tabType: TabType,
  changeMap: Map<string, NodeChangeInfo>,
  leftTree: BOMTreeNode | null,
  rightTree: BOMTreeNode | null
): ChangeStats {
  switch (tabType) {
    case 'ITEM':
      return aggregateItemChanges(changeMap, leftTree, rightTree);
    case 'BOM':
      return aggregateBOMChanges(changeMap, leftTree, rightTree);
    case 'OVERALL':
      return aggregateOverallChanges(changeMap, leftTree, rightTree);
    default:
      return { added: [], deleted: [], changed: [] };
  }
}
