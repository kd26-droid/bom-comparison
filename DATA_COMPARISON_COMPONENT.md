# Data Comparison Component - Technical Specification

## Overview
A React-based side-by-side comparison component that provides  -style diff visualization for comparing BOM (Bill of Materials), Quote, and Event data structures. The component highlights changes with red (removed/old values) and green (added/new values) styling similar to Git diff visualization.

## Core Requirements

### 1. Data Types Supported
- **BOM (Bill of Materials)**: Complex nested structures with sub-BOMs, items, quantities, costs, custom fields
- **Quotes**: Costing sheets with items, pricing information, additional costs, taxes, discounts
- **Events**: Event configurations with custom fields, sections, and various field types

### 2. Comparison Scenarios
- **Version Comparison**: Same entity, different versions (e.g., BOM v1 vs BOM v2)
- **Entity Comparison**: Different entities of same type (e.g., Quote A vs Quote B)
- **Cross-validation**: Comparing for mismatches and data differences

### 3. Technical Stack
- **Framework**: React with TypeScript
- **UI Library**: Material-UI 5 (MUI)
- **Styling**: Material-UI theming with custom diff colors
- **State Management**: React hooks (useState, useEffect, useMemo)

## Component Architecture

### 1. Main Component Structure
```
DataComparisonComponent/
├── components/
│   ├── DataComparison.tsx          # Main comparison component
│   ├── FieldRenderer.tsx           # Individual field rendering
│   ├── DiffHighlight.tsx          # Change highlighting wrapper
│   └── ComparisonSummary.tsx      # Summary of changes
├── utils/
│   ├── deepCompare.ts             # Deep comparison logic
│   ├── diffCalculator.ts          # Change detection algorithms
│   └── errorHandler.ts            # Error handling utilities
├── types/
│   ├── interfaces.ts              # TypeScript interfaces
│   └── comparisonTypes.ts         # Comparison-specific types
└── hooks/
    ├── useComparison.ts           # Custom hook for comparison logic
    └── useFieldExpansion.ts       # Handle expand/collapse states
```

### 2. Core Interfaces

#### BOM Interface
```typescript
interface IProjectBOMResponse {
  entry_id: string;
  enterprise_bom: {
    bom_code: string;
    bom_name: string;
    enterprise_bom_id: string;
    enterprise_item: {
      measurement_units: {
        item_measurement_units: Array<{
          abbreviation: string;
          measurement_unit_id: string;
          measurement_unit_category: string;
          measurement_unit_value_type: string;
          measurement_unit_primary_name: string;
        }>;
      };
    };
  };
  has_sub_boms: boolean;
  created_datetime: string;
  modified_datetime: string;
  deleted_datetime: string | null;
  quantity: number;
  total: number;
  // ... extensive nested structure
  bom_items?: IProjectBOMItem[];
  custom_sections: ICustomSection[];
  slabs: Array<{
    entry_id: string;
    quantity: number;
  }>;
}
```

#### Quote Interface
```typescript
interface QuoteData {
  costing_sheet_id: string;
  custom_costing_sheet_id: string;
  seller_entity_details: {
    entity_id: string;
    entity_name: string;
  };
  name: string;
  version: number;
  status: string;
  total: number;
  // ... comprehensive quote structure
  additional_costs: Array<any>;
  custom_sections: Array<any>;
}
```

#### Event Interface
```typescript
interface EventData {
  custom_fields: {
    section_list: Array<{
      name: string;
      fields: Array<{
        name: string;
        type: string;
        value: any;
        is_locked: boolean;
        is_visible: boolean;
        description: string;
        is_required: boolean;
        is_negotiable: boolean;
      }>;
    }>;
  };
  // ... additional event properties
}
```

### 3. Comparison Logic

#### Deep Comparison Strategy
```typescript
interface ComparisonResult {
  path: string;              // Field path (e.g., "bom_items[0].quantity")
  leftValue: any;            // Value from left side
  rightValue: any;           // Value from right side
  changeType: 'added' | 'removed' | 'modified' | 'unchanged';
  dataType: string;          // Type of the field
  isNested: boolean;         // Whether this is a nested object/array
}

interface ComparisonSummary {
  totalFields: number;
  changedFields: number;
  addedFields: number;
  removedFields: number;
  modifiedFields: number;
  unchangedFields: number;
  changes: ComparisonResult[];
  errors: string[];
}
```

#### Array Matching Strategy
For arrays like `bom_items`, `custom_sections`, etc.:
1. **Primary**: Match by unique ID fields (`entry_id`, `bom_item_id`, etc.)
2. **Secondary**: Match by semantic similarity (name, code, etc.)
3. **Fallback**: Index-based matching with clear indication of position changes

## UI/UX Design Specification

### 1. Layout Structure
```
┌─────────────────────────────────────────────────────────────────┐
│                    Comparison Header                            │
│  [Left Data Label]  vs  [Right Data Label]  [Summary Stats]    │
├─────────────────────┬───────────────────────────────────────────┤
│                     │                                           │
│    Left Side        │           Right Side                      │
│                     │                                           │
│  ┌─────────────────┐│ ┌─────────────────────────────────────────┐│
│  │ Field Group 1   ││ │ Field Group 1                           ││
│  │ ├─ field_1: val ││ │ ├─ field_1: val (changed) [GREEN]       ││
│  │ ├─ field_2: val ││ │ ├─ field_2: val                         ││
│  │ └─ field_3: val ││ │ ├─ field_3: [REMOVED] [RED]             ││
│  │                 ││ │ └─ field_4: new_val [ADDED] [GREEN]     ││
│  └─────────────────┘│ └─────────────────────────────────────────┘│
│                     │                                           │
└─────────────────────┴───────────────────────────────────────────┘
```

### 2. Color Coding (Material-UI Theme)
```typescript
const diffTheme = {
  added: {
    backgroundColor: '#e6ffed',    // Light green background
    borderLeft: '3px solid #28a745', // Green border
    color: '#155724'               // Dark green text
  },
  removed: {
    backgroundColor: '#ffeaea',    // Light red background
    borderLeft: '3px solid #dc3545', // Red border
    color: '#721c24'               // Dark red text
  },
  modified: {
    backgroundColor: '#fff3cd',    // Light yellow background
    borderLeft: '3px solid #ffc107', // Yellow border
    color: '#856404'               // Dark yellow text
  },
  unchanged: {
    backgroundColor: 'transparent',
    borderLeft: '3px solid transparent',
    color: 'inherit'
  }
};
```

### 3. Field Rendering Strategy

#### Primitive Fields
- Display label and value side-by-side
- Highlight changes with appropriate colors
- Show old value crossed out, new value highlighted

#### Object Fields
- Expandable/collapsible sections
- Nested indentation for hierarchy
- Individual field-level change tracking

#### Array Fields
- Show added/removed items clearly
- For modified items, expand to show field-level changes
- Maintain array order visualization

## Component Props Interface

### Primary Component Props
```typescript
interface DataComparisonProps {
  leftData: any;                    // Left side data object
  rightData: any;                   // Right side data object
  leftLabel?: string;               // Label for left side (e.g., "Version 1")
  rightLabel?: string;              // Label for right side (e.g., "Version 2")
  dataType?: 'bom' | 'quote' | 'event' | 'auto'; // Data type hint

  // Display options
  showUnchanged?: boolean;          // Show unchanged fields (default: true)
  expandAll?: boolean;              // Expand all nested objects (default: false)
  maxDepth?: number;                // Maximum nesting depth to compare

  // Customization
  customFields?: string[];          // Specific fields to focus on
  excludeFields?: string[];         // Fields to ignore in comparison

  // Callbacks
  onComparisonComplete?: (summary: ComparisonSummary) => void;
  onError?: (error: string) => void;
}
```

## Error Handling Strategy

### 1. Data Validation Errors
- **Invalid JSON**: Clear message about malformed data
- **Missing Required Fields**: Specify which fields are missing
- **Type Mismatches**: Detailed explanation of expected vs actual types

### 2. Comparison Errors
- **Circular References**: Detection and safe handling
- **Memory Limits**: Large data set warnings
- **Performance Issues**: Timeout handling for complex comparisons

### 3. UI Error States
```typescript
interface ErrorState {
  hasError: boolean;
  errorType: 'validation' | 'comparison' | 'rendering' | 'performance';
  message: string;
  details?: string;
  suggestedFix?: string;
}
```

## Performance Considerations

### 1. Large Data Handling
- **Virtual Scrolling**: For large arrays (1000+ items)
- **Lazy Loading**: Load nested objects on demand
- **Debounced Filtering**: Smooth search/filter experience

### 2. Memoization Strategy
```typescript
// Memoize expensive comparison calculations
const comparisonResult = useMemo(() =>
  deepCompare(leftData, rightData, options),
  [leftData, rightData, options]
);

// Memoize field rendering
const FieldRenderer = React.memo(({ field, changeType, value }) => {
  // Render logic
});
```

### 3. Progressive Enhancement
- Load basic comparison first
- Add detailed analysis incrementally
- Provide progress indicators for long operations

## Usage Examples

### Basic BOM Comparison
```typescript
<DataComparison
  leftData={bomVersion1}
  rightData={bomVersion2}
  leftLabel="BOM Version 1.0"
  rightLabel="BOM Version 1.1"
  dataType="bom"
  onComparisonComplete={(summary) => {
    console.log(`Found ${summary.changedFields} changes`);
  }}
/>
```

### Quote Analysis
```typescript
<DataComparison
  leftData={quote1}
  rightData={quote2}
  leftLabel="Quote A"
  rightLabel="Quote B"
  dataType="quote"
  showUnchanged={false}
  excludeFields={['created_datetime', 'modified_datetime']}
/>
```

### Event Configuration Diff
```typescript
<DataComparison
  leftData={eventConfig1}
  rightData={eventConfig2}
  leftLabel="Current Config"
  rightLabel="New Config"
  dataType="event"
  expandAll={true}
  maxDepth={5}
/>
```

## Testing Strategy

### 1. Unit Tests
- Deep comparison utility functions
- Field rendering components
- Error handling scenarios

### 2. Integration Tests
- Full component with sample data
- Performance with large datasets
- Error recovery scenarios

### 3. Visual Testing
- Screenshot comparison for UI consistency
- Cross-browser compatibility
- Responsive design validation

## Future Enhancements

### 1. Advanced Features
- Export comparison results to PDF/Excel
- Save comparison configurations
- Bulk comparison of multiple versions
- Integration with version control systems

### 2. Performance Improvements
- Web Workers for heavy computations
- IndexedDB for caching large comparisons
- Streaming comparison for real-time data

### 3. Accessibility
- Screen reader compatibility
- Keyboard navigation
- High contrast mode support

---

## Development Phases

### Phase 1: Core Implementation
1. Basic TypeScript interfaces
2. Deep comparison utility
3. Simple side-by-side layout
4. Basic change highlighting

### Phase 2: Enhanced UI
1. Material-UI integration
2. Expand/collapse functionality
3. Advanced change visualization
4. Error handling

### Phase 3: Performance & Polish
1. Virtual scrolling for large datasets
2. Advanced filtering and search
3. Export functionality
4. Comprehensive testing

This specification provides the complete foundation for building a robust,  -style data comparison component that meets all your requirements for BOM, Quote, and Event data comparison.