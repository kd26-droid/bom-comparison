import { IComparisonResult, IComparisonSummary } from '../types/interfaces';

export class DeepCompareUtil {
  private results: IComparisonResult[] = [];
  private errors: string[] = [];
  private excludeFields: string[] = [];
  private maxDepth: number = 10;
  private currentDepth: number = 0;

  constructor(excludeFields: string[] = [], maxDepth: number = 10) {
    this.excludeFields = excludeFields;
    this.maxDepth = maxDepth;
  }

  public compare(leftData: any, rightData: any, basePath: string = ''): IComparisonSummary {
    this.results = [];
    this.errors = [];
    this.currentDepth = 0;

    try {
      this.deepCompare(leftData, rightData, basePath);
    } catch (error) {
      this.errors.push(`Comparison failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return this.generateSummary();
  }

  private deepCompare(left: any, right: any, path: string): void {
    if (this.currentDepth >= this.maxDepth) {
      this.errors.push(`Maximum depth reached at path: ${path}`);
      return;
    }

    this.currentDepth++;

    // Handle null/undefined cases
    if (left === null && right === null) {
      this.addResult(path, left, right, 'unchanged', 'null');
      this.currentDepth--;
      return;
    }

    if (left === null || left === undefined) {
      this.addResult(path, left, right, 'added', this.getDataType(right));
      this.currentDepth--;
      return;
    }

    if (right === null || right === undefined) {
      this.addResult(path, left, right, 'removed', this.getDataType(left));
      this.currentDepth--;
      return;
    }

    // Handle primitive types
    if (this.isPrimitive(left) && this.isPrimitive(right)) {
      const changeType = left === right ? 'unchanged' : 'modified';
      this.addResult(path, left, right, changeType, this.getDataType(left));
      this.currentDepth--;
      return;
    }

    // Handle mixed types (primitive vs object)
    if (this.isPrimitive(left) !== this.isPrimitive(right)) {
      this.addResult(path, left, right, 'modified', 'mixed');
      this.currentDepth--;
      return;
    }

    // Handle arrays
    if (Array.isArray(left) && Array.isArray(right)) {
      this.compareArrays(left, right, path);
      this.currentDepth--;
      return;
    }

    // Handle mixed array vs object
    if (Array.isArray(left) !== Array.isArray(right)) {
      this.addResult(path, left, right, 'modified', 'type-change');
      this.currentDepth--;
      return;
    }

    // Handle objects
    if (typeof left === 'object' && typeof right === 'object') {
      this.compareObjects(left, right, path);
      this.currentDepth--;
      return;
    }

    // Fallback for any other cases
    const changeType = left === right ? 'unchanged' : 'modified';
    this.addResult(path, left, right, changeType, typeof left);
    this.currentDepth--;
  }

  private compareObjects(left: any, right: any, path: string): void {
    const leftKeys = Object.keys(left);
    const rightKeys = Object.keys(right);
    const allKeys = new Set([...leftKeys, ...rightKeys]);

    for (const key of allKeys) {
      const fieldPath = path ? `${path}.${key}` : key;

      // Skip excluded fields
      if (this.shouldExcludeField(fieldPath)) {
        continue;
      }

      const hasLeft = key in left;
      const hasRight = key in right;

      if (hasLeft && hasRight) {
        this.deepCompare(left[key], right[key], fieldPath);
      } else if (hasLeft && !hasRight) {
        this.addResult(fieldPath, left[key], undefined, 'removed', this.getDataType(left[key]));
      } else if (!hasLeft && hasRight) {
        this.addResult(fieldPath, undefined, right[key], 'added', this.getDataType(right[key]));
      }
    }
  }

  private compareArrays(left: any[], right: any[], path: string): void {
    const maxLength = Math.max(left.length, right.length);

    // Try to match array items by ID first
    const leftItemsById = this.indexArrayById(left);
    const rightItemsById = this.indexArrayById(right);

    // If we can match by ID, do intelligent comparison
    if (leftItemsById.size > 0 || rightItemsById.size > 0) {
      this.compareArraysById(leftItemsById, rightItemsById, path);
    } else {
      // Fallback to index-based comparison
      this.compareArraysByIndex(left, right, path, maxLength);
    }
  }

  private indexArrayById(array: any[]): Map<string, { item: any, index: number }> {
    const indexed = new Map<string, { item: any, index: number }>();

    array.forEach((item, index) => {
      let id = null;

      // Try different ID field patterns based on the data structures
      if (item && typeof item === 'object') {
        id = item.entry_id ||
             item.costing_sheet_item_id ||
             item.bom_item_id ||
             item.custom_section_id ||
             item.custom_field_id ||
             item.attribute_linkage_id ||
             item.additional_cost_linkage_id ||
             item.delivery_schedule_item_id;
      }

      if (id) {
        indexed.set(id, { item, index });
      }
    });

    return indexed;
  }

  private compareArraysById(
    leftById: Map<string, { item: any, index: number }>,
    rightById: Map<string, { item: any, index: number }>,
    path: string
  ): void {
    const allIds = new Set([...leftById.keys(), ...rightById.keys()]);

    for (const id of allIds) {
      const leftItem = leftById.get(id);
      const rightItem = rightById.get(id);

      if (leftItem && rightItem) {
        // Item exists in both arrays - compare content
        const itemPath = `${path}[${id}]`;
        this.deepCompare(leftItem.item, rightItem.item, itemPath);
      } else if (leftItem && !rightItem) {
        // Item was removed
        const itemPath = `${path}[${id}]`;
        this.addResult(itemPath, leftItem.item, undefined, 'removed', 'object');
      } else if (!leftItem && rightItem) {
        // Item was added
        const itemPath = `${path}[${id}]`;
        this.addResult(itemPath, undefined, rightItem.item, 'added', 'object');
      }
    }
  }

  private compareArraysByIndex(left: any[], right: any[], path: string, maxLength: number): void {
    for (let i = 0; i < maxLength; i++) {
      const itemPath = `${path}[${i}]`;
      const hasLeft = i < left.length;
      const hasRight = i < right.length;

      if (hasLeft && hasRight) {
        this.deepCompare(left[i], right[i], itemPath);
      } else if (hasLeft && !hasRight) {
        this.addResult(itemPath, left[i], undefined, 'removed', this.getDataType(left[i]));
      } else if (!hasLeft && hasRight) {
        this.addResult(itemPath, undefined, right[i], 'added', this.getDataType(right[i]));
      }
    }
  }

  private isPrimitive(value: any): boolean {
    return value === null ||
           value === undefined ||
           typeof value === 'string' ||
           typeof value === 'number' ||
           typeof value === 'boolean';
  }

  private getDataType(value: any): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (Array.isArray(value)) return 'array';
    return typeof value;
  }

  private shouldExcludeField(path: string): boolean {
    return this.excludeFields.some(field =>
      path === field ||
      path.endsWith(`.${field}`) ||
      path.includes(`.${field}.`)
    );
  }

  private addResult(
    path: string,
    leftValue: any,
    rightValue: any,
    changeType: 'added' | 'removed' | 'modified' | 'unchanged',
    dataType: string
  ): void {
    this.results.push({
      path,
      leftValue,
      rightValue,
      changeType,
      dataType,
      isNested: dataType === 'object' || dataType === 'array'
    });
  }

  private generateSummary(): IComparisonSummary {
    const summary: IComparisonSummary = {
      totalFields: this.results.length,
      changedFields: 0,
      addedFields: 0,
      removedFields: 0,
      modifiedFields: 0,
      unchangedFields: 0,
      changes: this.results,
      errors: this.errors
    };

    this.results.forEach(result => {
      switch (result.changeType) {
        case 'added':
          summary.addedFields++;
          summary.changedFields++;
          break;
        case 'removed':
          summary.removedFields++;
          summary.changedFields++;
          break;
        case 'modified':
          summary.modifiedFields++;
          summary.changedFields++;
          break;
        case 'unchanged':
          summary.unchangedFields++;
          break;
      }
    });

    return summary;
  }
}

// Utility function to detect data type
export function detectDataType(data: any): 'bom' | 'unknown' {
  if (!data || typeof data !== 'object') {
    return 'unknown';
  }

  // Check for BOM data
  if (data.enterprise_bom && data.bom_items && data.base_bom_module_linkage_id) {
    return 'bom';
  }

  return 'unknown';
}

// Main comparison function
export function compareData(
  leftData: any,
  rightData: any,
  options: {
    excludeFields?: string[];
    maxDepth?: number;
  } = {}
): IComparisonSummary {
  const comparer = new DeepCompareUtil(
    options.excludeFields || [],
    options.maxDepth || 10
  );

  return comparer.compare(leftData, rightData);
}
