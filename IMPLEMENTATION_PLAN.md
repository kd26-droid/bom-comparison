# BOM Comparison Multi-Level View - Implementation Plan

## Overview
This document provides detailed implementation instructions for creating a 3-level hierarchical BOM comparison interface with tabs, summary statistics, and auto-navigation features.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│  BOMComparisonWrapper.tsx (NEW - Main Container)       │
│  ├─ BOM Selector Dropdown                              │
│  ├─ Tab Navigation (ITEM/BOM/OVERALL)                  │
│  ├─ StatsSummaryBoxes.tsx (NEW)                        │
│  │  ├─ Added Box (clickable)                           │
│  │  ├─ Deleted Box (clickable)                         │
│  │  └─ Changed Box (clickable)                         │
│  ├─ ChangesListModal.tsx (NEW)                         │
│  └─ BOMComparisonPage.tsx (EXISTING - Modified)        │
└─────────────────────────────────────────────────────────┘
```

---

## File Structure

```
src/
├── components/
│   ├── BOMComparisonWrapper.tsx          (NEW)
│   ├── StatsSummaryBoxes.tsx             (NEW)
│   ├── ChangesListModal.tsx              (NEW)
│   ├── BOMComparisonPage.tsx             (MODIFY)
│   ├── HierarchicalBOMDropdown.tsx       (EXISTING - No changes)
│   ├── BOMItemsComparisonView.tsx        (EXISTING - No changes)
│   └── ChangeSummaryPanel.tsx            (EXISTING - No changes)
├── utils/
│   ├── changeAggregation.ts              (NEW)
│   ├── bomHierarchy.ts                   (EXISTING - No changes)
│   └── bomChangeDetection.ts             (EXISTING - No changes)
├── data/
│   └── sampleData.ts                     (EXISTING - No changes)
└── App.tsx                               (MODIFY)
```

---

## Implementation Steps

### Step 1: Create Change Aggregation Utility
**File:** `src/utils/changeAggregation.ts`

This utility extracts and categorizes all changes from the changeMap.

#### Types to Define:
```typescript
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
  nodeType: 'main' | 'sub-bom' | 'sub-sub-bom' | 'raw-material';
}

export interface ChangeStats {
  added: AggregatedChange[];
  deleted: AggregatedChange[];
  changed: AggregatedChange[];
}
```

#### Functions to Implement:

##### 1. `aggregateItemChanges(changeMap: Map<string, NodeChangeInfo>): ChangeStats`
**Purpose:** Extract all ITEM-level changes (raw materials only)

**Logic:**
```typescript
export function aggregateItemChanges(changeMap: Map<string, NodeChangeInfo>): ChangeStats {
  const added: AggregatedChange[] = [];
  const deleted: AggregatedChange[] = [];
  const changed: AggregatedChange[] = [];

  changeMap.forEach((nodeChange, path) => {
    // Skip if unchanged
    if (nodeChange.changeType === 'unchanged') return;

    // Only include raw materials (check if path ends with "RM" pattern)
    // You can identify by checking if it's a leaf node or matches item pattern
    const isRawMaterial = /* logic to determine if this is a raw material node */;

    if (!isRawMaterial) return;

    // Build parent path for display
    const pathParts = path.split('.');
    const parentPath = pathParts.slice(0, -1).join(' > ');

    const aggregated: AggregatedChange = {
      id: nodeChange.nodeId,
      path: path,
      code: nodeChange.nodeCode,
      name: nodeChange.nodeName,
      parentPath: parentPath,
      changeType: nodeChange.changeType === 'removed' ? 'removed' :
                  nodeChange.changeType === 'added' ? 'added' : 'modified',
      changeCount: nodeChange.changes.length,
      changes: nodeChange.changes,
      nodeType: 'raw-material',
    };

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
```

##### 2. `aggregateBOMChanges(changeMap: Map<string, NodeChangeInfo>): ChangeStats`
**Purpose:** Extract all BOM-level changes (Main BOM, Sub-BOMs, Sub-Sub-BOMs only)

**Logic:**
```typescript
export function aggregateBOMChanges(changeMap: Map<string, NodeChangeInfo>): ChangeStats {
  const added: AggregatedChange[] = [];
  const deleted: AggregatedChange[] = [];
  const changed: AggregatedChange[] = [];

  changeMap.forEach((nodeChange, path) => {
    // Skip if unchanged
    if (nodeChange.changeType === 'unchanged') return;

    // Only include BOM nodes (main, sub-bom, sub-sub-bom)
    const isBOMNode = /* logic to determine if this is a BOM node, not raw material */;

    if (!isBOMNode) return;

    // Build parent path for display (empty for main BOM)
    const pathParts = path.split('.');
    const parentPath = pathParts.length > 1 ? pathParts.slice(0, -1).join(' > ') : '';

    const aggregated: AggregatedChange = {
      id: nodeChange.nodeId,
      path: path,
      code: nodeChange.nodeCode,
      name: nodeChange.nodeName,
      parentPath: parentPath,
      changeType: nodeChange.changeType === 'removed' ? 'removed' :
                  nodeChange.changeType === 'added' ? 'added' : 'modified',
      changeCount: nodeChange.changes.length,
      changes: nodeChange.changes,
      nodeType: /* determine from path or node info */,
    };

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
```

##### 3. `getStatsForTab(tabType: TabType, changeMap: Map<string, NodeChangeInfo>): ChangeStats`
**Purpose:** Get appropriate stats based on active tab

**Logic:**
```typescript
export function getStatsForTab(tabType: TabType, changeMap: Map<string, NodeChangeInfo>): ChangeStats {
  switch (tabType) {
    case 'ITEM':
      return aggregateItemChanges(changeMap);
    case 'BOM':
      return aggregateBOMChanges(changeMap);
    case 'OVERALL':
      // Return empty for now (not needed)
      return { added: [], deleted: [], changed: [] };
    default:
      return { added: [], deleted: [], changed: [] };
  }
}
```

---

### Step 2: Create Stats Summary Boxes Component
**File:** `src/components/StatsSummaryBoxes.tsx`

This component displays the 3 clickable stat boxes (ADDED/DELETED/CHANGED).

#### Props Interface:
```typescript
interface StatsSummaryBoxesProps {
  stats: ChangeStats;
  onBoxClick: (type: 'added' | 'deleted' | 'changed') => void;
}
```

#### Implementation:
```typescript
import React from 'react';
import { Box, Paper, Stack, Typography } from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { ChangeStats } from '../utils/changeAggregation';

export const StatsSummaryBoxes: React.FC<StatsSummaryBoxesProps> = ({ stats, onBoxClick }) => {
  return (
    <Stack direction="row" spacing={3} sx={{ mb: 3 }}>
      {/* ADDED BOX */}
      <Paper
        onClick={() => onBoxClick('added')}
        sx={{
          flex: 1,
          p: 3,
          cursor: 'pointer',
          backgroundColor: '#dcfce7',
          border: '2px solid #22c55e',
          '&:hover': {
            backgroundColor: '#bbf7d0',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          },
          transition: 'all 0.2s',
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          <AddIcon sx={{ fontSize: 40, color: '#15803d' }} />
          <Box>
            <Typography variant="h3" sx={{ fontWeight: 700, color: '#15803d' }}>
              {stats.added.length}
            </Typography>
            <Typography variant="body2" sx={{ color: '#166534', fontWeight: 600 }}>
              ADDED
            </Typography>
          </Box>
        </Stack>
      </Paper>

      {/* DELETED BOX */}
      <Paper
        onClick={() => onBoxClick('deleted')}
        sx={{
          flex: 1,
          p: 3,
          cursor: 'pointer',
          backgroundColor: '#fee2e2',
          border: '2px solid #ef4444',
          '&:hover': {
            backgroundColor: '#fecaca',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          },
          transition: 'all 0.2s',
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          <DeleteIcon sx={{ fontSize: 40, color: '#dc2626' }} />
          <Box>
            <Typography variant="h3" sx={{ fontWeight: 700, color: '#dc2626' }}>
              {stats.deleted.length}
            </Typography>
            <Typography variant="body2" sx={{ color: '#991b1b', fontWeight: 600 }}>
              DELETED
            </Typography>
          </Box>
        </Stack>
      </Paper>

      {/* CHANGED BOX */}
      <Paper
        onClick={() => onBoxClick('changed')}
        sx={{
          flex: 1,
          p: 3,
          cursor: 'pointer',
          backgroundColor: '#fef3c7',
          border: '2px solid #f59e0b',
          '&:hover': {
            backgroundColor: '#fde68a',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          },
          transition: 'all 0.2s',
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          <EditIcon sx={{ fontSize: 40, color: '#d97706' }} />
          <Box>
            <Typography variant="h3" sx={{ fontWeight: 700, color: '#d97706' }}>
              {stats.changed.length}
            </Typography>
            <Typography variant="body2" sx={{ color: '#92400e', fontWeight: 600 }}>
              CHANGED
            </Typography>
          </Box>
        </Stack>
      </Paper>
    </Stack>
  );
};
```

---

### Step 3: Create Changes List Modal Component
**File:** `src/components/ChangesListModal.tsx`

This modal displays the list of changes and allows clicking to navigate.

#### Props Interface:
```typescript
interface ChangesListModalProps {
  open: boolean;
  onClose: () => void;
  title: string;  // "Added Items", "Deleted Items", etc.
  changes: AggregatedChange[];
  onChangeClick: (change: AggregatedChange) => void;
}
```

#### Implementation:
```typescript
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  Stack,
  Divider,
  Link,
  Chip,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { AggregatedChange } from '../utils/changeAggregation';

export const ChangesListModal: React.FC<ChangesListModalProps> = ({
  open,
  onClose,
  title,
  changes,
  onChangeClick,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          minHeight: '60vh',
          maxHeight: '80vh',
        },
      }}
    >
      {/* Header */}
      <DialogTitle sx={{ borderBottom: '1px solid #e5e7eb', pb: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      {/* Content */}
      <DialogContent sx={{ pt: 2 }}>
        {changes.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              No changes found
            </Typography>
          </Box>
        ) : (
          <Stack spacing={1.5}>
            {changes.map((change, idx) => (
              <Box key={change.id || idx}>
                <Link
                  component="button"
                  onClick={() => onChangeClick(change)}
                  sx={{
                    textDecoration: 'none',
                    width: '100%',
                    textAlign: 'left',
                  }}
                >
                  <Paper
                    sx={{
                      p: 2,
                      '&:hover': {
                        backgroundColor: '#f9fafb',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      },
                      transition: 'all 0.2s',
                      cursor: 'pointer',
                    }}
                  >
                    <Stack spacing={1}>
                      {/* Item Code and Name */}
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#111827' }}>
                          {change.code}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#6b7280' }}>
                          - {change.name}
                        </Typography>
                        <Chip
                          label={change.nodeType.toUpperCase()}
                          size="small"
                          sx={{ height: 20, fontSize: '0.65rem' }}
                        />
                      </Stack>

                      {/* Parent Path */}
                      {change.parentPath && (
                        <Typography variant="caption" sx={{ color: '#9ca3af' }}>
                          📍 in {change.parentPath}
                        </Typography>
                      )}

                      {/* Changes Summary */}
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        {change.changes.slice(0, 3).map((fieldChange, fIdx) => (
                          <Chip
                            key={fIdx}
                            label={`${fieldChange.fieldName}: ${fieldChange.leftValue || 'N/A'} → ${fieldChange.rightValue || 'N/A'}`}
                            size="small"
                            sx={{
                              fontSize: '0.7rem',
                              height: 22,
                              backgroundColor: '#f3f4f6',
                            }}
                          />
                        ))}
                        {change.changes.length > 3 && (
                          <Chip
                            label={`+${change.changes.length - 3} more`}
                            size="small"
                            sx={{ fontSize: '0.7rem', height: 22 }}
                          />
                        )}
                      </Stack>
                    </Stack>
                  </Paper>
                </Link>
                {idx < changes.length - 1 && <Divider sx={{ my: 1 }} />}
              </Box>
            ))}
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
};
```

---

### Step 4: Modify BOMComparisonPage Component
**File:** `src/components/BOMComparisonPage.tsx`

Add props to support auto-navigation from external triggers.

#### New Props to Add:
```typescript
interface BOMComparisonPageProps {
  leftData: IProjectBOMResponse;
  rightData: IProjectBOMResponse;
  leftLabel?: string;
  rightLabel?: string;
  // NEW PROPS:
  autoNavigateTo?: string | null;  // Path to auto-navigate to
  onNavigationComplete?: () => void;  // Callback when navigation is done
}
```

#### Add useEffect for Auto-Navigation:
```typescript
// Add this useEffect inside BOMComparisonPage component
React.useEffect(() => {
  if (autoNavigateTo) {
    // Find the node in the left tree
    const node = findNodeByPath(leftTree, autoNavigateTo);
    if (node) {
      handleSelection(autoNavigateTo, node, 'left');
    }

    // Call callback to clear the navigation trigger
    if (onNavigationComplete) {
      onNavigationComplete();
    }
  }
}, [autoNavigateTo]);
```

**Note:** The rest of BOMComparisonPage remains unchanged.

---

### Step 5: Create Main Wrapper Component
**File:** `src/components/BOMComparisonWrapper.tsx`

This is the top-level component that orchestrates everything.

#### State Management:
```typescript
const [selectedBOMId, setSelectedBOMId] = useState<string | null>(null);
const [selectedTab, setSelectedTab] = useState<TabType>('ITEM');
const [modalOpen, setModalOpen] = useState(false);
const [modalType, setModalType] = useState<'added' | 'deleted' | 'changed'>('added');
const [autoNavigatePath, setAutoNavigatePath] = useState<string | null>(null);
```

#### Component Structure:
```typescript
import React, { useState, useMemo } from 'react';
import { Box, Container, Paper, Tabs, Tab, FormControl, Select, MenuItem, Typography } from '@mui/material';
import { bomList } from '../data/sampleData';
import { buildBOMTree } from '../utils/bomHierarchy';
import { detectBOMTreeChanges } from '../utils/bomChangeDetection';
import { getStatsForTab, TabType, AggregatedChange } from '../utils/changeAggregation';
import { StatsSummaryBoxes } from './StatsSummaryBoxes';
import { ChangesListModal } from './ChangesListModal';
import { BOMComparisonPage } from './BOMComparisonPage';

export const BOMComparisonWrapper: React.FC = () => {
  // State
  const [selectedBOMId, setSelectedBOMId] = useState<string | null>('bom1'); // Default to first BOM
  const [selectedTab, setSelectedTab] = useState<TabType>('ITEM');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'added' | 'deleted' | 'changed'>('added');
  const [autoNavigatePath, setAutoNavigatePath] = useState<string | null>(null);

  // Get selected BOM data
  // IMPORTANT: bomList should contain entries like:
  // [{ id: 'bom1', name: 'Version 1', data: bomData1 }, { id: 'bom2', name: 'Version 2', data: bomData2 }]
  // We need to group them by BOM name and get latest 2 versions

  // For simplicity, assume bomList has 2 versions for comparison
  const leftData = bomList[0].data;  // Version 1
  const rightData = bomList[1].data; // Version 2

  // Build trees and detect changes
  const leftTree = useMemo(() => buildBOMTree(leftData), [leftData]);
  const rightTree = useMemo(() => buildBOMTree(rightData), [rightData]);
  const changeMap = useMemo(() => detectBOMTreeChanges(leftTree, rightTree), [leftTree, rightTree]);

  // Get stats for current tab
  const stats = useMemo(() => getStatsForTab(selectedTab, changeMap), [selectedTab, changeMap]);

  // Handle box click
  const handleBoxClick = (type: 'added' | 'deleted' | 'changed') => {
    setModalType(type);
    setModalOpen(true);
  };

  // Handle change click from modal
  const handleChangeClick = (change: AggregatedChange) => {
    setModalOpen(false);
    setAutoNavigatePath(change.path);
  };

  // Get modal data
  const getModalData = () => {
    switch (modalType) {
      case 'added':
        return { title: 'Added Items', changes: stats.added };
      case 'deleted':
        return { title: 'Deleted Items', changes: stats.deleted };
      case 'changed':
        return { title: 'Changed Items', changes: stats.changed };
    }
  };

  const modalData = getModalData();

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* BOM Selector */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <FormControl fullWidth>
          <Typography variant="caption" sx={{ mb: 1, color: '#6b7280', fontWeight: 500 }}>
            Select BOM to Compare
          </Typography>
          <Select
            value={selectedBOMId || ''}
            onChange={(e) => setSelectedBOMId(e.target.value)}
            size="small"
          >
            {/* For now, just show the BOM name. In real scenario,
                you'd have unique BOM IDs and select latest 2 versions */}
            <MenuItem value="bom1">QAB1 (Version 1 vs Version 2)</MenuItem>
          </Select>
        </FormControl>
      </Paper>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={selectedTab}
          onChange={(e, newValue) => setSelectedTab(newValue)}
          sx={{ borderBottom: '1px solid #e5e7eb' }}
        >
          <Tab label="ITEM" value="ITEM" />
          <Tab label="BOM" value="BOM" />
          <Tab label="OVERALL" value="OVERALL" />
        </Tabs>
      </Paper>

      {/* Stats Boxes */}
      <StatsSummaryBoxes stats={stats} onBoxClick={handleBoxClick} />

      {/* BOM Comparison Page */}
      <BOMComparisonPage
        leftData={leftData}
        rightData={rightData}
        leftLabel="Version 1"
        rightLabel="Version 2"
        autoNavigateTo={autoNavigatePath}
        onNavigationComplete={() => setAutoNavigatePath(null)}
      />

      {/* Changes Modal */}
      <ChangesListModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalData.title}
        changes={modalData.changes}
        onChangeClick={handleChangeClick}
      />
    </Container>
  );
};
```

---

### Step 6: Update App.tsx
**File:** `src/App.tsx`

Replace the current usage with the new wrapper.

#### Before:
```typescript
import { BOMComparisonPage } from './components/BOMComparisonPage';
import { bomSample1, bomSample2 } from './data/sampleData';

function App() {
  return (
    <BOMComparisonPage
      leftData={bomSample1}
      rightData={bomSample2}
      leftLabel="Version 1"
      rightLabel="Version 2"
    />
  );
}
```

#### After:
```typescript
import { BOMComparisonWrapper } from './components/BOMComparisonWrapper';

function App() {
  return <BOMComparisonWrapper />;
}
```

---

## Implementation Checklist

### Phase 1: Utilities
- [ ] Create `src/utils/changeAggregation.ts`
  - [ ] Define types: `TabType`, `AggregatedChange`, `ChangeStats`
  - [ ] Implement `aggregateItemChanges()`
  - [ ] Implement `aggregateBOMChanges()`
  - [ ] Implement `getStatsForTab()`

### Phase 2: UI Components
- [ ] Create `src/components/StatsSummaryBoxes.tsx`
  - [ ] Define props interface
  - [ ] Implement 3 stat boxes with click handlers
  - [ ] Add hover effects and styling

- [ ] Create `src/components/ChangesListModal.tsx`
  - [ ] Define props interface
  - [ ] Implement modal with list of changes
  - [ ] Add click handlers for navigation
  - [ ] Style change items with field details

### Phase 3: Integration
- [ ] Modify `src/components/BOMComparisonPage.tsx`
  - [ ] Add `autoNavigateTo` prop
  - [ ] Add `onNavigationComplete` prop
  - [ ] Implement useEffect for auto-navigation

- [ ] Create `src/components/BOMComparisonWrapper.tsx`
  - [ ] Implement BOM selector dropdown
  - [ ] Implement tab navigation
  - [ ] Connect stats boxes to modal
  - [ ] Handle auto-navigation flow
  - [ ] Integrate existing BOMComparisonPage

### Phase 4: Final Integration
- [ ] Update `src/App.tsx`
  - [ ] Replace BOMComparisonPage with BOMComparisonWrapper

---

## Key Implementation Notes

### 1. Identifying Raw Materials vs BOMs
In `changeAggregation.ts`, you need logic to distinguish between raw materials and BOM nodes. Use the `nodeType` from the tree or check the path structure:

```typescript
// Check if it's a raw material (leaf node, or check if data is IBOMItem)
const isRawMaterial = (nodeInfo: NodeChangeInfo): boolean => {
  // Option 1: Check if path has specific pattern (e.g., ends with RM code)
  // Option 2: Check if the node has no children in the tree
  // Option 3: Store nodeType in NodeChangeInfo during detection

  // For now, you can add nodeType to NodeChangeInfo in bomChangeDetection.ts
  // Or traverse the tree to check if node has children
};
```

**Recommendation:** Modify `NodeChangeInfo` in `bomChangeDetection.ts` to include `nodeType`:
```typescript
export interface NodeChangeInfo {
  nodeId: string;
  nodePath: string;
  nodeCode: string;
  nodeName: string;
  nodeType: 'main' | 'sub-bom' | 'sub-sub-bom' | 'raw-material';  // ADD THIS
  changeType: ChangeType;
  changes: FieldChange[];
}
```

Then populate it during tree comparison in `compareNodes()`.

### 2. Auto-Navigation Flow
```
User clicks "RM1" in modal
  ↓
ChangesListModal calls onChangeClick(change)
  ↓
BOMComparisonWrapper sets autoNavigatePath = "QAB1.QASB1.QASSB1.RM1"
  ↓
BOMComparisonPage receives autoNavigateTo prop
  ↓
useEffect detects change, calls handleSelection()
  ↓
Tree dropdown auto-expands to QASSB1 level
  ↓
Side-by-side comparison shows RM1
  ↓
BOMComparisonPage calls onNavigationComplete()
  ↓
BOMComparisonWrapper clears autoNavigatePath
```

### 3. Modal Styling Guidelines
- Use MUI Dialog component
- Make it responsive (60-80% viewport height)
- Add smooth transitions
- Ensure clickable items have clear hover states
- Show parent hierarchy for context
- Display change count and field names

### 4. Stats Box Styling
- Green for ADDED (#22c55e)
- Red for DELETED (#ef4444)
- Orange/Yellow for CHANGED (#f59e0b)
- Large, bold numbers (h3 typography)
- Icons from Material-UI
- Hover effects with shadow and color shift

### 5. Tab Behavior
- Tabs change only the data in stats boxes
- UI layout remains identical
- BOM comparison section below is unaffected by tab changes
- OVERALL tab can be empty for now

---

## Testing Steps

1. **Initial Load:**
   - [ ] Page loads with default BOM selected
   - [ ] ITEM tab is active by default
   - [ ] Stats boxes show correct counts
   - [ ] BOM comparison page displays below

2. **Tab Switching:**
   - [ ] Click BOM tab → stats update to show BOM-level changes
   - [ ] Click ITEM tab → stats update to show item-level changes
   - [ ] BOM comparison section remains unchanged

3. **Modal Interaction:**
   - [ ] Click ADDED box → modal opens with list of added items
   - [ ] Click DELETED box → modal opens with list of deleted items
   - [ ] Click CHANGED box → modal opens with list of changed items
   - [ ] Modal shows correct data based on active tab

4. **Auto-Navigation:**
   - [ ] Click an item in modal → modal closes
   - [ ] BOM comparison section scrolls into view
   - [ ] Tree dropdown auto-expands to correct level
   - [ ] Side-by-side comparison shows the selected item
   - [ ] Change summary highlights the specific changes

5. **Edge Cases:**
   - [ ] No changes → stats show 0, modal shows "No changes found"
   - [ ] Click same item multiple times → navigation works consistently
   - [ ] Switch tabs with modal open → modal updates correctly

---

## Design Specifications

### Color Palette
- **Added/Green:** `#22c55e` (primary), `#dcfce7` (light bg), `#15803d` (dark text)
- **Deleted/Red:** `#ef4444` (primary), `#fee2e2` (light bg), `#dc2626` (dark text)
- **Changed/Orange:** `#f59e0b` (primary), `#fef3c7` (light bg), `#d97706` (dark text)
- **Neutral:** `#6b7280` (secondary text), `#f9fafb` (hover bg)

### Typography
- **Stat Numbers:** h3 (MUI), bold (700)
- **Stat Labels:** body2, semi-bold (600)
- **Modal Title:** h6, semi-bold (600)
- **Change Items:** subtitle2 for code, body2 for name

### Spacing
- Container padding: 32px (py: 4)
- Section margins: 24px (mb: 3)
- Box padding: 24px (p: 3)
- Stack spacing: 24px (spacing: 3)

---

## Additional Enhancements (Optional)

1. **Search in Modal:**
   Add a search bar in the modal to filter changes by code or name.

2. **Sorting:**
   Allow sorting changes by code, name, or change count.

3. **Export:**
   Add a button to export the changes list as CSV or PDF.

4. **Keyboard Navigation:**
   Support ESC to close modal, arrow keys to navigate list.

5. **Loading States:**
   Show skeleton loaders while computing changes.

6. **Empty States:**
   Better empty state designs when no changes exist.

---

## Estimated Implementation Time

- **Phase 1 (Utilities):** 2-3 hours
- **Phase 2 (UI Components):** 3-4 hours
- **Phase 3 (Integration):** 2-3 hours
- **Phase 4 (Testing & Polish):** 2-3 hours
- **Total:** 9-13 hours

---

## Questions for Clarification

Before starting implementation, confirm:

1. Should the BOM selector show multiple BOMs or always just QAB1 with 2 versions?
2. Should OVERALL tab remain empty or show some placeholder?
3. Any specific requirements for mobile responsiveness?
4. Should there be a way to manually reload/refresh the data?
5. Any performance concerns with large BOMs (1000+ items)?

---

## Success Criteria

✅ User can select a BOM from dropdown
✅ User can switch between ITEM/BOM/OVERALL tabs
✅ Stats boxes show accurate real-time counts
✅ Clicking stats box opens modal with detailed list
✅ Clicking item in modal auto-navigates to comparison
✅ Auto-navigation correctly expands tree and shows item
✅ UI is responsive and professional-looking
✅ No console errors or TypeScript warnings
✅ Hot reload works throughout development
