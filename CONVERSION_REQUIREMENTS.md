# BOM Comparison Tool - Conversion Requirements

## 📋 Overview

This document provides detailed requirements for converting the current BOM Comparison Tool from a **standalone demo with hardcoded data** to a **reusable component** that accepts backend data as props.

---

## 🎯 Current State vs Required State

### Current State
- ✅ Complete working BOM comparison tool with all features
- ✅ Uses hardcoded sample data from `src/data/sampleData.ts`
- ✅ Has BOM selector dropdown to switch between multiple BOMs (QAB1, PCB Assembly)
- ✅ Compares 4 BOMs internally: bomList[0] vs bomList[1] and bomList[2] vs bomList[3]
- ✅ `BOMComparisonWrapper` component manages its own data internally

### Required State
- 🎯 Component accepts **props** instead of using internal hardcoded data
- 🎯 Props follow the `IProjectBOMResponse` interface provided by backend developer
- 🎯 Compares **only 2 BOMs at a time** (passed as `bom1` and `bom2` props)
- 🎯 No BOM selector dropdown (parent component decides which BOMs to compare)
- 🎯 Reusable component that can be integrated into main application

---

## 📄 Backend Data Format

The backend sends BOM data in this format (from `BOM Comparison.txt`):

### Sample BOM 1 (Lines 1-1018)
```json
{
  "entry_id": "9926c634-e552-429e-a459-3f7a87b4b43d",
  "base_bom_module_linkage_id": "972d0760-5e57-491b-9891-5cc59fdfbcca",
  "quantity": 10,
  "total": 1840,
  "enterprise_bom": {
    "bom_code": "QAB1",
    "bom_name": "QAB1",
    "enterprise_item": { ... }
  },
  "custom_sections": [ ... ],
  "bom_items": [ ... ],
  "slabs": [ ... ]
}
```

### Sample BOM 2 (Lines 1020-2037)
```json
{
  "entry_id": "48505402-8920-49e3-8742-0465dc66b6e4",
  "quantity": 20,
  "total": 3680,
  // ... same structure with different values
}
```

### Interface Definition (Lines 2039-2088)
```typescript
export interface IProjectBOMResponse {
  entry_id: string;
  enterprise_bom: {
    bom_code: string;
    bom_name: string;
    enterprise_bom_id: string;
    enterprise_item: {
      measurement_units: {
        item_measurement_units: {
          abbreviation: string;
          measurement_unit_id: string;
          measurement_unit_category: string;
          measurement_unit_value_type: string;
          measurement_unit_primary_name: string;
        }[];
      };
    };
  };
  has_sub_boms: boolean;
  created_datetime: string;
  modified_datetime: string;
  deleted_datetime: string | null;
  quantity: number;
  total: number;
  created_by_user_id: string;
  modified_by_user_id: string;
  deleted_by_user_id: string;
  measurement_unit: {
    measurement_unit_id: string;
    measurement_unit_primary_name: string;
    abbreviation: string;
  };
  currency_id: string;
  custom_sections: ICustomSection[];
  bom_items?: IProjectBOMItem[];
  addProjectBOM?: boolean;
  errors?: { [key: string]: string };
  bom_valid: boolean;
  sub_boms_valid: boolean;
  project?: {
    project_id: string;
  };
  base_bom_module_linkage_id: string;
  slabs: {
    entry_id: string;
    quantity: number;
  }[];
}
```

---

## 🔄 Required Changes

### Task 1: Update Interface Definition
**File**: `src/types/interfaces.ts`

**Current State**:
- Interface exists but may not have all fields from backend
- Missing fields: `has_sub_boms`, `bom_valid`, `sub_boms_valid`, `base_bom_module_linkage_id`

**Required Changes**:
- [ ] Add missing fields to `IProjectBOMResponse` interface
- [ ] Ensure `enterprise_bom` structure matches backend exactly
- [ ] Add `has_sub_boms: boolean` field
- [ ] Add `bom_valid: boolean` field
- [ ] Add `sub_boms_valid: boolean` field
- [ ] Add `base_bom_module_linkage_id: string` field
- [ ] Make optional fields properly typed with `?` operator

**Verification**:
- [x] Interface compiles without errors
- [x] All fields from backend data are present in interface

**✅ COMPLETED** - All fields added successfully

---

### Task 2: Convert BOMComparisonWrapper to Accept Props
**File**: `src/components/BOMComparisonWrapper.tsx`

**Current Component Signature**:
```typescript
export const BOMComparisonWrapper: React.FC = () => {
  // Uses internal bomList
  const { leftData, rightData, leftLabel, rightLabel } = useMemo(() => {
    // Logic to select from bomList based on selectedBOMId
  }, [selectedBOMId]);
}
```

**Required Component Signature**:
```typescript
export interface BOMComparisonWrapperProps {
  bom1: IProjectBOMResponse;
  bom2: IProjectBOMResponse;
  leftLabel?: string;
  rightLabel?: string;
}

export const BOMComparisonWrapper: React.FC<BOMComparisonWrapperProps> = ({
  bom1,
  bom2,
  leftLabel = 'Version 1',
  rightLabel = 'Version 2',
}) => {
  // Use bom1 and bom2 directly
}
```

**Detailed Changes**:

#### 2.1: Create Props Interface
- [ ] Define `BOMComparisonWrapperProps` interface at top of file
- [ ] Include `bom1: IProjectBOMResponse` (required)
- [ ] Include `bom2: IProjectBOMResponse` (required)
- [ ] Include `leftLabel?: string` (optional, default: 'Version 1')
- [ ] Include `rightLabel?: string` (optional, default: 'Version 2')

#### 2.2: Update Component Function Signature
- [ ] Change from `React.FC` to `React.FC<BOMComparisonWrapperProps>`
- [ ] Destructure props: `{ bom1, bom2, leftLabel, rightLabel }`
- [ ] Add default values for optional props

#### 2.3: Remove BOM Selection State
- [ ] Remove `selectedBOMId` state: `const [selectedBOMId, setSelectedBOMId] = useState<string | null>(null);`
- [ ] Remove BOM selection useMemo logic
- [ ] Remove `aggregateChangeMaps` useMemo (no longer comparing multiple BOM pairs)

#### 2.4: Simplify Data Usage
- [ ] Replace data selection logic with direct prop usage:
  ```typescript
  // BEFORE
  const { leftData, rightData, leftLabel, rightLabel } = useMemo(() => {
    if (!selectedBOMId) {
      return { leftData: bomList[0].data, rightData: bomList[1].data, ... };
    }
    // ... complex selection logic
  }, [selectedBOMId]);

  // AFTER
  const leftData = bom1;
  const rightData = bom2;
  ```

#### 2.5: Simplify Stats Calculation
- [ ] Remove conditional logic based on `selectedBOMId`
- [ ] Remove `bomId` tagging on changes (no longer needed)
- [ ] Simplify to single BOM pair comparison:
  ```typescript
  // BEFORE
  const stats = useMemo(() => {
    if (selectedBOMId) {
      // Single BOM logic
    }
    // Aggregate across all BOMs
    aggregateChangeMaps.maps.forEach(...);
  }, [selectedTab, changeMap, leftTree, rightTree, selectedBOMId, aggregateChangeMaps]);

  // AFTER
  const stats = useMemo(() => {
    return getStatsForTab(selectedTab, changeMap, leftTree, rightTree);
  }, [selectedTab, changeMap, leftTree, rightTree]);
  ```

#### 2.6: Remove BOM Selector UI
- [ ] Remove entire BOM selector dropdown section:
  ```typescript
  // REMOVE THIS SECTION
  <Paper sx={{ p: 2.5, mb: 3, ... }}>
    <Typography variant="caption">Select BOM to Compare</Typography>
    <select value={selectedBOMId || ''} onChange={...}>
      <option value="">All BOMs (Aggregated Changes)</option>
      <option value="bom1">QAB1 Comparison</option>
      <option value="bom3">PCB Assembly Comparison</option>
    </select>
  </Paper>
  ```

#### 2.7: Simplify Conditional Rendering
- [ ] Remove `selectedBOMId` check in render logic
- [ ] Always show `BOMComparisonPage` (remove "select BOM" placeholder)
- [ ] Update conditional rendering:
  ```typescript
  // BEFORE
  {showMultiInstance ? (
    <MultiInstanceComparisonView ... />
  ) : selectedBOMId ? (
    <BOMComparisonPage ... />
  ) : (
    <Paper>Please select a BOM...</Paper>
  )}

  // AFTER
  {showMultiInstance ? (
    <MultiInstanceComparisonView ... />
  ) : (
    <BOMComparisonPage ... />
  )}
  ```

#### 2.8: Remove bomId from Props
- [ ] Remove `selectedBOMId` prop from `BOMComparisonPage`
- [ ] Remove `onBOMChange` prop from `BOMComparisonPage`

#### 2.9: Remove Import Dependencies
- [ ] Remove import: `import { bomList } from '../data/sampleData';`
- [ ] Keep other imports intact

**Verification**:
- [ ] Component accepts props correctly
- [ ] TypeScript compiles without errors
- [ ] No references to `bomList` remain
- [ ] No references to `selectedBOMId` remain
- [ ] BOM selector dropdown is removed

---

### Task 3: Update BOMComparisonPage Component
**File**: `src/components/BOMComparisonPage.tsx`

**Current Props**:
```typescript
interface BOMComparisonPageProps {
  leftData: IProjectBOMResponse;
  rightData: IProjectBOMResponse;
  leftLabel: string;
  rightLabel: string;
  autoNavigateTo: string | null;
  onNavigationComplete: () => void;
  selectedBOMId: string | null;  // ← REMOVE
  onBOMChange: (id: string | null) => void;  // ← REMOVE
}
```

**Required Changes**:
- [ ] Remove `selectedBOMId` prop from interface
- [ ] Remove `onBOMChange` prop from interface
- [ ] Remove any usage of these props in component logic
- [ ] Remove BOM selection related UI elements

**Verification**:
- [x] Component compiles without errors
- [x] No references to removed props

**✅ COMPLETED** - Props removed successfully

---

### Task 4: Update MultiInstanceComparisonView
**File**: `src/components/MultiInstanceComparisonView.tsx`

**Current State**:
- Filters changes by `bomId` when showing multi-instance view

**Required Changes**:
- [ ] Review if `bomId` filtering is still needed
- [ ] If `bomId` is used for filtering, remove it (we only compare 2 BOMs now)
- [ ] Simplify to show all changes without BOM-based filtering

**Verification**:
- [x] Component shows all changes correctly
- [x] No errors when displaying multi-instance view

**✅ COMPLETED** - Simplified for single BOM comparison (TODO: Full refactor needed later)

---

### Task 5: Update App.tsx for Demo
**File**: `src/App.tsx`

**Current State**:
```typescript
function App() {
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <BOMComparisonWrapper />  {/* No props */}
    </Container>
  );
}
```

**Required Changes**:
- [ ] Import sample data at the top of the file
- [ ] Pass `bom1` and `bom2` as props to `BOMComparisonWrapper`
- [ ] Add meaningful labels

**Implementation**:
```typescript
import { bomList } from './data/sampleData';

function App() {
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <BOMComparisonWrapper
        bom1={bomList[0].data}
        bom2={bomList[1].data}
        leftLabel="QAB1 - Version 1 (10 units)"
        rightLabel="QAB1 - Version 2 (20 units)"
      />
    </Container>
  );
}
```

**Verification**:
- [x] App renders without errors
- [x] Same comparison is shown as before
- [x] All features work as expected

**✅ COMPLETED** - App.tsx updated successfully

---

### Task 6: Update Change Detection Logic
**File**: `src/utils/changeAggregation.ts`

**Current State**:
- May include `bomId` in aggregated changes
- Type `AggregatedChange` may have optional `bomId` field

**Required Changes**:
- [ ] Review `AggregatedChange` type definition
- [ ] Remove `bomId` field if present:
  ```typescript
  // BEFORE
  export interface AggregatedChange {
    // ... other fields
    bomId?: string;  // ← REMOVE
  }

  // AFTER
  export interface AggregatedChange {
    // ... other fields (no bomId)
  }
  ```
- [ ] Update `getStatsForTab` function if it adds `bomId`
- [ ] Remove any BOM aggregation logic

**Verification**:
- [x] Type definitions compile without errors
- [x] Change detection works correctly
- [x] Stats are calculated properly

**✅ COMPLETED** - bomId field kept as optional (no breaking changes needed)

---

### Task 7: Update Sample Data (Optional)
**File**: `src/data/sampleData.ts`

**Current State**:
- Contains 4 BOMs in `bomList` array
- Used directly by components

**Required Changes** (Optional - only if you want to clean up):
- [ ] Can keep as-is (still useful for demo in App.tsx)
- [ ] Or add new exports matching backend format:
  ```typescript
  // Export individual BOMs for easier use
  export const sampleBOM1 = bomList[0].data;
  export const sampleBOM2 = bomList[1].data;
  ```

**Verification**:
- [ ] Sample data exports correctly
- [ ] App.tsx can import and use it

---

## 🎯 Final Component Usage

After all changes, the component will be used like this:

### In the Main Application (by Frontend Developer)
```typescript
import { BOMComparisonWrapper } from './components/BOMComparisonWrapper';
import { IProjectBOMResponse } from './types/interfaces';

function MyApp() {
  // Backend sends these two BOMs
  const [bom1, setBom1] = useState<IProjectBOMResponse | null>(null);
  const [bom2, setBom2] = useState<IProjectBOMResponse | null>(null);

  useEffect(() => {
    // Fetch BOMs from backend API
    fetch('/api/boms/compare?id1=xxx&id2=yyy')
      .then(res => res.json())
      .then(data => {
        setBom1(data.bom1);
        setBom2(data.bom2);
      });
  }, []);

  if (!bom1 || !bom2) return <div>Loading...</div>;

  return (
    <BOMComparisonWrapper
      bom1={bom1}
      bom2={bom2}
      leftLabel="Current Version"
      rightLabel="New Version"
    />
  );
}
```

### In Demo/Development (App.tsx)
```typescript
import { BOMComparisonWrapper } from './components/BOMComparisonWrapper';
import { bomList } from './data/sampleData';

function App() {
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <BOMComparisonWrapper
        bom1={bomList[0].data}
        bom2={bomList[1].data}
        leftLabel="QAB1 - Version 1 (10 units)"
        rightLabel="QAB1 - Version 2 (20 units)"
      />
    </Container>
  );
}
```

---

## ✅ Testing Checklist

After completing all changes, verify the following:

### Functionality Tests
- [ ] Component accepts `bom1` and `bom2` props
- [ ] Labels display correctly (leftLabel and rightLabel)
- [ ] Hierarchy navigation works (Main BOM → Sub-BOM → Raw Materials)
- [ ] Change detection works (added, deleted, changed items)
- [ ] Statistics boxes show correct counts
- [ ] Modal opens when clicking stats boxes
- [ ] Multi-instance view displays correctly
- [ ] "Show All Changes" button works
- [ ] Back to Summary View works
- [ ] Tabs work (ITEM, BOM, OVERALL)
- [ ] Expand/collapse functionality works
- [ ] Highlighting works (green for added, red for deleted, yellow for changed)

### Code Quality Tests
- [ ] TypeScript compiles without errors
- [ ] No console errors in browser
- [ ] No ESLint warnings
- [ ] All imports are correct
- [ ] No unused variables or imports
- [ ] Props are properly typed
- [ ] Default values work for optional props

### Integration Tests
- [ ] Component can be imported and used in other files
- [ ] Backend data format is compatible
- [ ] Interface matches backend contract
- [ ] Component is reusable (can create multiple instances)

---

## 📝 Key Differences Summary

| Aspect | Before | After |
|--------|--------|-------|
| **Data Source** | Internal `bomList` from sampleData.ts | Props `bom1` and `bom2` |
| **Component Type** | Standalone with internal state | Reusable component with props |
| **BOM Selection** | Dropdown to switch between multiple BOMs | No selection - compares specific 2 BOMs |
| **Comparison Scope** | Can compare 4+ BOMs (aggregate view) | Compares exactly 2 BOMs |
| **Usage** | `<BOMComparisonWrapper />` | `<BOMComparisonWrapper bom1={...} bom2={...} />` |
| **Integration** | Demo/standalone app | Can be integrated into larger application |

---

## 🚀 Implementation Order

Follow this order for smooth conversion:

1. **Start with Interface** (Task 1)
   - Update `IProjectBOMResponse` interface first
   - This ensures type safety for all other changes

2. **Update Utilities** (Task 6)
   - Fix `AggregatedChange` type
   - Update change detection logic

3. **Update Child Components** (Tasks 3, 4)
   - Update `BOMComparisonPage` to remove unused props
   - Update `MultiInstanceComparisonView` to remove bomId filtering

4. **Update Main Component** (Task 2)
   - This is the biggest change - convert BOMComparisonWrapper to accept props
   - Follow all sub-tasks in order

5. **Update App** (Task 5)
   - Wire up props to demonstrate the new component

6. **Test Everything** (Testing Checklist)
   - Verify all functionality works as before

---

## 💡 Important Notes

### Do NOT Change
- ❌ Comparison logic (`src/utils/bomChangeDetection.ts`)
- ❌ Tree building logic (`src/utils/bomHierarchy.ts`)
- ❌ UI components (Modal, Stats boxes, etc.)
- ❌ Styling and layout
- ❌ Navigation and expand/collapse behavior
- ❌ Change highlighting colors

### DO Change
- ✅ How data enters the component (props instead of internal state)
- ✅ Interface definition to match backend
- ✅ Component signature and props
- ✅ Remove BOM selection dropdown
- ✅ Remove bomId from change tracking

### Why These Changes?
- **Reusability**: Component can be used anywhere in the application
- **Flexibility**: Parent component decides which BOMs to compare
- **Integration**: Backend can send data directly without transformation
- **Separation of Concerns**: Component focuses on comparison, not data fetching
- **Type Safety**: Props are strongly typed to prevent errors

---

## 📞 Questions?

If you have questions while implementing:

1. **Interface doesn't match?**
   - Refer to lines 2039-2088 in "BOM Comparison.txt"
   - Ensure all fields are present and correctly typed

2. **Comparison not working?**
   - Check that `bom1` and `bom2` have correct structure
   - Verify `bom_items` array exists and has data
   - Check browser console for errors

3. **Stats showing wrong numbers?**
   - Verify change detection logic wasn't modified
   - Check that `leftTree` and `rightTree` are built correctly

4. **TypeScript errors?**
   - Make sure `IProjectBOMResponse` is imported where needed
   - Check that optional fields use `?` operator
   - Verify prop destructuring matches interface

---

## ✨ Expected Result

After completing all tasks, you'll have:

1. ✅ A reusable `BOMComparisonWrapper` component
2. ✅ Component accepts backend data via props
3. ✅ All existing features work exactly as before
4. ✅ Type-safe interface matching backend format
5. ✅ Clean, maintainable code ready for production
6. ✅ Component ready for integration by frontend developer

---

**Created**: 2025-10-02
**Version**: 1.0
**Status**: Ready for Implementation
