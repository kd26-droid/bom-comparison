import { BOMTreeNode } from './bomHierarchy';
import { IBOMItem, IProjectBOMResponse } from '../types/interfaces';

export type ChangeType = 'modified' | 'added' | 'removed' | 'unchanged';

export interface NodeChangeInfo {
  nodeId: string;
  nodePath: string;
  nodeCode: string;
  nodeName: string;
  changeType: ChangeType;
  changes: FieldChange[];
}

export interface FieldChange {
  fieldPath: string;
  fieldName: string;
  leftValue: any;
  rightValue: any;
  changeType: ChangeType;
}

/**
 * Compare two BOM trees and detect changes at each node
 */
export function detectBOMTreeChanges(
  leftTree: BOMTreeNode,
  rightTree: BOMTreeNode
): Map<string, NodeChangeInfo> {
  const changeMap = new Map<string, NodeChangeInfo>();

  // Compare nodes recursively
  compareNodes(leftTree, rightTree, changeMap);

  return changeMap;
}

/**
 * Recursively compare nodes
 */
function compareNodes(
  leftNode: BOMTreeNode | null,
  rightNode: BOMTreeNode | null,
  changeMap: Map<string, NodeChangeInfo>
): void {
  // Node removed in right
  if (leftNode && !rightNode) {
    changeMap.set(leftNode.path, {
      nodeId: leftNode.id,
      nodePath: leftNode.path,
      nodeCode: leftNode.code,
      nodeName: leftNode.name,
      changeType: 'removed',
      changes: [],
    });
    return;
  }

  // Node added in right
  if (!leftNode && rightNode) {
    changeMap.set(rightNode.path, {
      nodeId: rightNode.id,
      nodePath: rightNode.path,
      nodeCode: rightNode.code,
      nodeName: rightNode.name,
      changeType: 'added',
      changes: [],
    });
    return;
  }

  if (!leftNode || !rightNode) return;

  // Both nodes exist - compare their content
  const fieldChanges = compareNodeData(leftNode, rightNode);
  const hasChanges = fieldChanges.some(change => change.changeType !== 'unchanged');

  changeMap.set(leftNode.path, {
    nodeId: leftNode.id,
    nodePath: leftNode.path,
    nodeCode: leftNode.code,
    nodeName: leftNode.name,
    changeType: hasChanges ? 'modified' : 'unchanged',
    changes: fieldChanges,
  });

  // Compare children - create maps by code for matching
  const leftChildrenMap = new Map<string, BOMTreeNode>();
  leftNode.children.forEach(child => {
    leftChildrenMap.set(child.code, child);
  });

  const rightChildrenMap = new Map<string, BOMTreeNode>();
  rightNode.children.forEach(child => {
    rightChildrenMap.set(child.code, child);
  });

  // Get all unique codes
  const allCodes = new Set([
    ...Array.from(leftChildrenMap.keys()),
    ...Array.from(rightChildrenMap.keys()),
  ]);

  // Compare each child
  allCodes.forEach(code => {
    const leftChild = leftChildrenMap.get(code) || null;
    const rightChild = rightChildrenMap.get(code) || null;
    compareNodes(leftChild, rightChild, changeMap);
  });
}

/**
 * Compare data within a single node
 */
function compareNodeData(leftNode: BOMTreeNode, rightNode: BOMTreeNode): FieldChange[] {
  const changes: FieldChange[] = [];

  if (leftNode.type === 'main') {
    const leftData = leftNode.data as IProjectBOMResponse;
    const rightData = rightNode.data as IProjectBOMResponse;
    changes.push(...compareMainBOMData(leftData, rightData));
  } else {
    const leftData = leftNode.data as IBOMItem;
    const rightData = rightNode.data as IBOMItem;
    changes.push(...compareBOMItemData(leftData, rightData));
  }

  return changes;
}

/**
 * Compare main BOM level data
 */
function compareMainBOMData(
  left: IProjectBOMResponse,
  right: IProjectBOMResponse
): FieldChange[] {
  const changes: FieldChange[] = [];

  // Compare quantity
  const qtyChange = createFieldChange('quantity', 'Quantity', left.quantity, right.quantity);
  if (qtyChange.changeType !== 'unchanged') changes.push(qtyChange);

  // Compare total
  const totalChange = createFieldChange('total', 'Total Cost', left.total, right.total);
  if (totalChange.changeType !== 'unchanged') changes.push(totalChange);

  // Compare custom sections - match by field name
  if (left.custom_sections && right.custom_sections) {
    const leftFieldsMap = new Map<string, any>();
    const rightFieldsMap = new Map<string, any>();

    left.custom_sections.forEach(section => {
      section.custom_fields?.forEach(field => {
        leftFieldsMap.set(field.name, field.value);
      });
    });

    right.custom_sections.forEach(section => {
      section.custom_fields?.forEach(field => {
        rightFieldsMap.set(field.name, field.value);
      });
    });

    const allFieldNames = new Set([...leftFieldsMap.keys(), ...rightFieldsMap.keys()]);
    allFieldNames.forEach(fieldName => {
      const leftValue = leftFieldsMap.get(fieldName);
      const rightValue = rightFieldsMap.get(fieldName);
      const fieldChange = createFieldChange(
        `custom_field.${fieldName}`,
        fieldName,
        leftValue,
        rightValue
      );
      if (fieldChange.changeType !== 'unchanged') changes.push(fieldChange);
    });
  }

  return changes;
}

/**
 * Compare BOM item data
 */
function compareBOMItemData(left: IBOMItem, right: IBOMItem): FieldChange[] {
  const changes: FieldChange[] = [];

  // Compare quantity
  const qtyChange = createFieldChange('quantity', 'Quantity', left.quantity, right.quantity);
  if (qtyChange.changeType !== 'unchanged') changes.push(qtyChange);

  // Compare cost_per_unit
  const costChange = createFieldChange('cost_per_unit', 'Cost Per Unit', left.cost_per_unit, right.cost_per_unit);
  if (costChange.changeType !== 'unchanged') changes.push(costChange);

  // Don't compare measurement_unit or selected - these are not meaningful changes
  // measurement_unit is same across both, selected is internal state

  // Compare custom sections - match by field name, not ID
  if (left.custom_sections && right.custom_sections) {
    // Create a map of field names to values for easier comparison
    const leftFieldsMap = new Map<string, any>();
    const rightFieldsMap = new Map<string, any>();

    left.custom_sections.forEach(section => {
      section.custom_fields?.forEach(field => {
        leftFieldsMap.set(field.name, field.value);
      });
    });

    right.custom_sections.forEach(section => {
      section.custom_fields?.forEach(field => {
        rightFieldsMap.set(field.name, field.value);
      });
    });

    // Compare all field names
    const allFieldNames = new Set([...leftFieldsMap.keys(), ...rightFieldsMap.keys()]);
    allFieldNames.forEach(fieldName => {
      const leftValue = leftFieldsMap.get(fieldName);
      const rightValue = rightFieldsMap.get(fieldName);
      const fieldChange = createFieldChange(
        `custom_field.${fieldName}`,
        fieldName,
        leftValue,
        rightValue
      );
      if (fieldChange.changeType !== 'unchanged') changes.push(fieldChange);
    });
  }

  // Only compare if there's actual meaningful delivery schedule differences
  // Skip for now as delivery schedule is complex nested structure

  // Only flag alternates if the count actually differs
  const leftAlternatesCount = left.alternates?.length || 0;
  const rightAlternatesCount = right.alternates?.length || 0;
  if (leftAlternatesCount !== rightAlternatesCount) {
    changes.push(
      createFieldChange('alternates_count', 'Alternates Count', leftAlternatesCount, rightAlternatesCount)
    );
  }

  return changes;
}

/**
 * Helper to create a field change object
 */
function createFieldChange(
  fieldPath: string,
  fieldName: string,
  leftValue: any,
  rightValue: any
): FieldChange {
  let changeType: ChangeType = 'unchanged';

  if (leftValue === undefined && rightValue !== undefined) {
    changeType = 'added';
  } else if (leftValue !== undefined && rightValue === undefined) {
    changeType = 'removed';
  } else if (JSON.stringify(leftValue) !== JSON.stringify(rightValue)) {
    changeType = 'modified';
  }

  return {
    fieldPath,
    fieldName,
    leftValue,
    rightValue,
    changeType,
  };
}

/**
 * Check if a node has any changes in its subtree
 */
export function hasChangesInSubtree(
  nodePath: string,
  changeMap: Map<string, NodeChangeInfo>
): boolean {
  for (const [path, info] of changeMap.entries()) {
    if (path.startsWith(nodePath) && info.changeType !== 'unchanged') {
      return true;
    }
  }
  return false;
}

/**
 * Get immediate change status for a node (not including children)
 */
export function getNodeChangeStatus(
  nodePath: string,
  changeMap: Map<string, NodeChangeInfo>
): ChangeType {
  const info = changeMap.get(nodePath);
  return info ? info.changeType : 'unchanged';
}
