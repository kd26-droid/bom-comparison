# BOM Comparison Component - Frontend Integration Guide

## 📦 What You're Getting

A fully-functional, reusable React component for comparing two Bill of Materials (BOMs) with hierarchical navigation and change detection.

---

## 🚀 Quick Start

### 1. Import the Component

```typescript
import { BOMComparisonWrapper } from './components/BOMComparisonWrapper';
import { IProjectBOMResponse } from './types/interfaces';
```

### 2. Use It

```typescript
function YourApp() {
  const [bom1, setBom1] = useState<IProjectBOMResponse | null>(null);
  const [bom2, setBom2] = useState<IProjectBOMResponse | null>(null);

  // Fetch your BOMs from backend
  useEffect(() => {
    fetch('/api/boms/compare?v1=xxx&v2=yyy')
      .then(res => res.json())
      .then(data => {
        setBom1(data.version1);
        setBom2(data.version2);
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

### 3. Done! ✅

That's it. The component handles everything else.

---

## 📋 Component Props

```typescript
interface BOMComparisonWrapperProps {
  bom1: IProjectBOMResponse;           // Required - First BOM to compare
  bom2: IProjectBOMResponse;           // Required - Second BOM to compare
  leftLabel?: string;                  // Optional - Label for BOM 1 (default: "Version 1")
  rightLabel?: string;                 // Optional - Label for BOM 2 (default: "Version 2")
}
```

**Example:**
```typescript
<BOMComparisonWrapper
  bom1={backendData.currentVersion}
  bom2={backendData.proposedVersion}
  leftLabel="Production BOM (v2.3)"
  rightLabel="Proposed BOM (v2.4)"
/>
```

---

## 🔌 Backend Data Format

Your backend must return data matching the `IProjectBOMResponse` interface:

```typescript
interface IProjectBOMResponse {
  entry_id: string;
  base_bom_module_linkage_id: string;
  quantity: number;
  total: number;
  enterprise_bom: {
    bom_code: string;
    bom_name: string;
    enterprise_bom_id: string;
    enterprise_item: { /* ... */ };
  };
  measurement_unit: {
    measurement_unit_id: string;
    measurement_unit_primary_name: string;
    abbreviation: string;
  };
  currency_id: string;
  custom_sections: ICustomSection[];
  bom_items?: IBOMItem[];  // Optional - contains sub-BOMs and raw materials
  slabs: Array<{
    entry_id: string;
    quantity: number;
  }>;
  // Optional fields
  has_sub_boms?: boolean;
  bom_valid?: boolean;
  sub_boms_valid?: boolean;
  created_datetime?: string;
  modified_datetime?: string;
  // ... other fields
}
```

**See full interface in:** `src/types/interfaces.ts` (lines 96-131)

**Sample data reference:** `BOM Comparison.txt` (lines 1-2088)

---

## ✨ What the Component Does

### Features Included

1. **Hierarchical Navigation**
   - Main BOM → Sub-BOMs → Sub-Sub-BOMs → Raw Materials
   - Click to drill down through any level
   - Synchronized left/right views

2. **Change Detection**
   - **Added items** (green highlight)
   - **Deleted items** (red highlight)
   - **Changed items** (yellow highlight)
   - Field-level change tracking

3. **Three Comparison Modes**
   - **ITEM**: Compare raw materials only
   - **BOM**: Compare BOM-level items only
   - **OVERALL**: Compare everything

4. **Statistics Dashboard**
   - Count of added items
   - Count of deleted items
   - Count of changed items
   - Click any stat box to see detailed list

5. **Interactive UI**
   - Expand/collapse BOM items
   - Click on changes to navigate to specific items
   - Modal dialogs for detailed change views
   - Responsive Material-UI design

---

## 🎨 UI/UX

- **Material-UI** based (already configured)
- **Responsive** layout
- **Color-coded** changes:
  - 🟢 Green = Added
  - 🔴 Red = Deleted
  - 🟡 Yellow = Modified
- **Tabs** for filtering (ITEM/BOM/OVERALL)
- **Hierarchy breadcrumbs** showing current path

---

## 🔍 How It Works

### Data Flow

```
Backend API
    ↓
Your Application (fetches 2 BOMs)
    ↓
<BOMComparisonWrapper bom1={...} bom2={...} />
    ↓
Component builds internal tree structure
    ↓
Detects changes (added/deleted/modified)
    ↓
Displays side-by-side comparison with highlighting
```

### Change Detection Logic

The component:
1. Builds tree structure from both BOMs
2. Compares trees node-by-node
3. Tracks changes at every level:
   - BOM items (quantity, cost, etc.)
   - Sub-BOMs (nested comparisons)
   - Raw materials (all fields)
   - Custom fields
4. Aggregates statistics by category

---

## 📦 Dependencies (Already Installed)

- `react` - UI framework
- `@mui/material` - UI components
- `@mui/icons-material` - Icons
- `typescript` - Type safety

**No additional packages needed.**

---

## 🛠️ Common Integration Scenarios

### Scenario 1: Compare BOM Versions

```typescript
// Fetch two versions of the same BOM
const [currentBOM, setCurrentBOM] = useState(null);
const [proposedBOM, setProposedBOM] = useState(null);

useEffect(() => {
  Promise.all([
    fetch(`/api/bom/${bomId}/version/current`).then(r => r.json()),
    fetch(`/api/bom/${bomId}/version/proposed`).then(r => r.json())
  ]).then(([current, proposed]) => {
    setCurrentBOM(current);
    setProposedBOM(proposed);
  });
}, [bomId]);

return (
  <BOMComparisonWrapper
    bom1={currentBOM}
    bom2={proposedBOM}
    leftLabel={`Version ${currentBOM.version}`}
    rightLabel={`Version ${proposedBOM.version}`}
  />
);
```

### Scenario 2: Compare Two Different BOMs

```typescript
// Compare different BOMs (e.g., supplier comparison)
const [supplierA_BOM, setSupplierA_BOM] = useState(null);
const [supplierB_BOM, setSupplierB_BOM] = useState(null);

return (
  <BOMComparisonWrapper
    bom1={supplierA_BOM}
    bom2={supplierB_BOM}
    leftLabel="Supplier A Quote"
    rightLabel="Supplier B Quote"
  />
);
```

### Scenario 3: With Loading State

```typescript
function BOMComparisonPage() {
  const [loading, setLoading] = useState(true);
  const [boms, setBoms] = useState({ bom1: null, bom2: null });
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch('/api/bom-comparison/123')
      .then(res => res.json())
      .then(data => {
        setBoms({ bom1: data.before, bom2: data.after });
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!boms.bom1 || !boms.bom2) return <Alert severity="warning">No BOMs found</Alert>;

  return (
    <BOMComparisonWrapper
      bom1={boms.bom1}
      bom2={boms.bom2}
      leftLabel="Before Changes"
      rightLabel="After Changes"
    />
  );
}
```

---

## ⚠️ Important Notes

### 1. Data Structure Requirements

**Your backend MUST return:**
- Valid `enterprise_bom` object with `bom_code`, `bom_name`
- Valid `measurement_unit` with `abbreviation`
- `bom_items` array (can be empty `[]` for leaf BOMs)
- All required IDs as strings

**Optional but recommended:**
- `custom_sections` for custom field comparison
- `has_sub_boms` flag for UI optimization
- Timestamps (`created_datetime`, `modified_datetime`)

### 2. Performance

- ✅ Handles large BOMs (tested with 100+ items)
- ✅ Hierarchies up to 4 levels deep
- ✅ Efficiently detects changes using tree diffing
- ⚠️ For BOMs with 500+ items, consider pagination (future enhancement)

### 3. Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ⚠️ IE11 not supported (uses modern JavaScript)

---

## 🐛 Troubleshooting

### Problem: "Type error" when passing BOMs

**Solution:** Ensure your backend data matches `IProjectBOMResponse` interface exactly.

```typescript
// Check in browser console:
console.log('BOM 1:', bom1);
console.log('Missing fields:',
  !bom1.enterprise_bom ? 'enterprise_bom' :
  !bom1.measurement_unit ? 'measurement_unit' :
  !bom1.quantity ? 'quantity' :
  'none'
);
```

### Problem: Changes not detected correctly

**Solution:** Ensure both BOMs have the same structure (same BOM codes for comparison).

The component compares by:
- `entry_id` for items
- `bom_item_id` for BOM items
- `path` in the hierarchy

### Problem: Component doesn't render

**Solution:** Check these:
1. Both `bom1` and `bom2` are not null/undefined
2. Material-UI theme is configured (`ThemeProvider`)
3. No console errors
4. Data structure matches interface

---

## 📊 Testing Your Integration

### Checklist

- [ ] Component renders without errors
- [ ] Both BOM labels display correctly
- [ ] Can navigate through hierarchy
- [ ] Added items show in green
- [ ] Deleted items show in red
- [ ] Changed items show in yellow
- [ ] Statistics boxes show correct counts
- [ ] Clicking stats opens modal
- [ ] Tabs switch between ITEM/BOM/OVERALL
- [ ] Expand/collapse works
- [ ] No console errors

### Test with Sample Data

```typescript
import { bomList } from './data/sampleData';

// For testing only
<BOMComparisonWrapper
  bom1={bomList[0].data}
  bom2={bomList[1].data}
  leftLabel="Sample BOM 1"
  rightLabel="Sample BOM 2"
/>
```

---

## 📁 File Structure

```
src/
├── components/
│   ├── BOMComparisonWrapper.tsx      ← Main component (use this)
│   ├── BOMComparisonPage.tsx         ← Internal (don't import)
│   ├── MultiInstanceComparisonView.tsx  ← Internal
│   └── ... (other internal components)
├── types/
│   └── interfaces.ts                 ← Import IProjectBOMResponse from here
├── utils/
│   ├── bomHierarchy.ts              ← Tree building logic
│   ├── bomChangeDetection.ts        ← Change detection logic
│   └── changeAggregation.ts         ← Statistics calculation
└── data/
    └── sampleData.ts                ← Sample BOMs for testing
```

**You only need to import:**
- `BOMComparisonWrapper` component
- `IProjectBOMResponse` interface (for type checking)

---

## 🎯 Next Steps

1. **Integrate** the component into your app
2. **Connect** to your backend API
3. **Test** with real BOM data
4. **Customize** labels as needed
5. **Deploy** 🚀

---

## 💡 Tips

### Tip 1: Custom Styling
```typescript
// Wrap in a container for custom styling
<Box sx={{ p: 3, backgroundColor: '#f5f5f5' }}>
  <BOMComparisonWrapper bom1={...} bom2={...} />
</Box>
```

### Tip 2: Dynamic Labels
```typescript
const leftLabel = `${bom1.enterprise_bom.bom_code} - ${bom1.quantity} units`;
const rightLabel = `${bom2.enterprise_bom.bom_code} - ${bom2.quantity} units`;
```

### Tip 3: Error Boundaries
```typescript
<ErrorBoundary fallback={<ErrorMessage />}>
  <BOMComparisonWrapper bom1={...} bom2={...} />
</ErrorBoundary>
```

---

## 📞 Need Help?

### Reference Files
- **Sample BOMs**: `BOM Comparison.txt` (lines 1-2037)
- **Interface Definition**: `src/types/interfaces.ts` (lines 96-131)
- **Detailed Requirements**: `CONVERSION_REQUIREMENTS.md`
- **Completion Summary**: `CONVERSION_COMPLETE.md`

### GitHub Repository
https://github.com/kd26-droid/bom-comparison.git

---

## ✅ Summary

| What | Details |
|------|---------|
| **Component** | `<BOMComparisonWrapper />` |
| **Required Props** | `bom1`, `bom2` (IProjectBOMResponse) |
| **Optional Props** | `leftLabel`, `rightLabel` |
| **Returns** | Full comparison UI with change detection |
| **Dependencies** | Material-UI (already installed) |
| **Browser Support** | Modern browsers (Chrome, Firefox, Safari) |
| **Status** | ✅ Production ready |

---

**Last Updated:** 2025-10-02
**Status:** Ready for Integration
**Component Version:** 1.0.0
