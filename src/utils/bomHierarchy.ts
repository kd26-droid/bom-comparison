import { IProjectBOMResponse, IBOMItem } from '../types/interfaces';

export type BOMNodeType = 'main' | 'sub-bom' | 'sub-sub-bom' | 'raw-material';

export interface BOMTreeNode {
  id: string;
  type: BOMNodeType;
  name: string;
  code: string;
  level: number;
  parentId: string | null;
  data: IProjectBOMResponse | IBOMItem;
  children: BOMTreeNode[];
  hasChanges?: boolean;
  changeType?: 'modified' | 'added' | 'removed';
  path: string; // e.g., "QAB1" or "QAB1.QASB1" or "QAB1.QASB1.QASSB1"
}

/**
 * Build a hierarchical tree structure from BOM data
 */
export function buildBOMTree(bomData: IProjectBOMResponse): BOMTreeNode {
  const mainBomCode = bomData.enterprise_bom.bom_code;
  const mainBomName = bomData.enterprise_bom.bom_name;

  const mainNode: BOMTreeNode = {
    id: bomData.entry_id,
    type: 'main',
    name: mainBomName,
    code: mainBomCode,
    level: 0,
    parentId: null,
    data: bomData,
    children: [],
    path: mainBomCode,
  };

  // Process direct children (bom_items)
  if (bomData.bom_items && bomData.bom_items.length > 0) {
    mainNode.children = bomData.bom_items.map(item =>
      buildBOMItemNode(item, mainNode.id, mainBomCode, 1)
    );
  }

  return mainNode;
}

/**
 * Recursively build tree nodes from BOM items
 */
function buildBOMItemNode(
  item: IBOMItem,
  parentId: string,
  parentPath: string,
  level: number
): BOMTreeNode {
  // Determine node type and name
  let nodeType: BOMNodeType;
  let nodeName: string;
  let nodeCode: string;

  if (item.sub_bom) {
    // This is a sub-BOM
    nodeType = level === 1 ? 'sub-bom' : 'sub-sub-bom';
    nodeName = item.sub_bom.bom_name;
    nodeCode = item.sub_bom.bom_code;
  } else if (item.raw_material_item) {
    // This is a raw material
    nodeType = 'raw-material';
    nodeName = item.raw_material_item.name;
    nodeCode = item.raw_material_item.code;
  } else {
    // Fallback
    nodeType = 'raw-material';
    nodeName = 'Unknown Item';
    nodeCode = 'UNKNOWN';
  }

  const nodePath = `${parentPath}.${nodeCode}`;

  const node: BOMTreeNode = {
    id: item.entry_id,
    type: nodeType,
    name: nodeName,
    code: nodeCode,
    level,
    parentId,
    data: item,
    children: [],
    path: nodePath,
  };

  // Process sub_bom_items recursively
  if (item.sub_bom_items && item.sub_bom_items.length > 0) {
    node.children = item.sub_bom_items.map(subItem =>
      buildBOMItemNode(subItem, node.id, nodePath, level + 1)
    );
  }

  return node;
}

/**
 * Flatten tree into a list for easier traversal
 */
export function flattenBOMTree(node: BOMTreeNode): BOMTreeNode[] {
  const result: BOMTreeNode[] = [node];

  if (node.children && node.children.length > 0) {
    node.children.forEach(child => {
      result.push(...flattenBOMTree(child));
    });
  }

  return result;
}

/**
 * Find a node by path
 */
export function findNodeByPath(tree: BOMTreeNode, path: string): BOMTreeNode | null {
  if (tree.path === path) return tree;

  for (const child of tree.children) {
    const found = findNodeByPath(child, path);
    if (found) return found;
  }

  return null;
}

/**
 * Find a node by code (searches entire tree)
 */
export function findNodeByCode(tree: BOMTreeNode, code: string): BOMTreeNode | null {
  if (tree.code === code) return tree;

  for (const child of tree.children) {
    const found = findNodeByCode(child, code);
    if (found) return found;
  }

  return null;
}

/**
 * Get direct children of a node based on selection
 */
export function getNodeChildren(node: BOMTreeNode): BOMTreeNode[] {
  return node.children;
}

/**
 * Get all items to display for comparison based on selected node
 * If main BOM selected: show all direct children (sub-BOMs and raw materials)
 * If sub-BOM selected: show its children
 */
export function getItemsForComparison(node: BOMTreeNode): IBOMItem[] {
  if (node.type === 'main') {
    // Return top-level bom_items
    const bomData = node.data as IProjectBOMResponse;
    return bomData.bom_items || [];
  } else if (node.type === 'sub-bom' || node.type === 'sub-sub-bom') {
    // Return sub_bom_items
    const itemData = node.data as IBOMItem;
    return itemData.sub_bom_items || [];
  } else {
    // Raw material has no children
    return [];
  }
}

/**
 * Extract comparable data from a BOM item for display
 */
export function extractBOMItemFields(item: IBOMItem) {
  const isSubBom = !!item.sub_bom;
  const isRawMaterial = !!item.raw_material_item;

  if (isSubBom) {
    return {
      type: 'sub-bom',
      code: item.sub_bom!.bom_code,
      name: item.sub_bom!.bom_name,
      quantity: item.quantity,
      cost_per_unit: item.cost_per_unit,
      measurement_unit: item.measurement_unit,
      custom_sections: item.custom_sections,
      selected: item.selected,
    };
  } else if (isRawMaterial) {
    return {
      type: 'raw-material',
      code: item.raw_material_item!.code,
      name: item.raw_material_item!.name,
      quantity: item.quantity,
      cost_per_unit: item.cost_per_unit,
      measurement_unit: item.measurement_unit,
      delivery_schedule: item.delivery_schedule,
      alternates: item.alternates,
      tags: item.raw_material_item!.tags,
      custom_sections: item.custom_sections,
      selected: item.selected,
    };
  }

  return null;
}
