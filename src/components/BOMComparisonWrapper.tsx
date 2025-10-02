import React, { useState, useMemo } from 'react';
import { Box, Paper, Tabs, Tab, Typography, Stack, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { IProjectBOMResponse } from '../types/interfaces';
import { bomList } from '../data/sampleData';
import { buildBOMTree } from '../utils/bomHierarchy';
import { detectBOMTreeChanges } from '../utils/bomChangeDetection';
import { getStatsForTab, TabType, AggregatedChange } from '../utils/changeAggregation';
import { StatsSummaryBoxes } from './StatsSummaryBoxes';
import { ChangesListModal } from './ChangesListModal';
import { BOMComparisonPage } from './BOMComparisonPage';
import { MultiInstanceComparisonView } from './MultiInstanceComparisonView';

export interface BOMComparisonWrapperProps {
  bom1?: IProjectBOMResponse;
  bom2?: IProjectBOMResponse;
  leftLabel?: string;
  rightLabel?: string;
  bomList?: Array<{ id: string; name: string; data: IProjectBOMResponse }>;
}

export const BOMComparisonWrapper: React.FC<BOMComparisonWrapperProps> = ({
  bom1,
  bom2,
  leftLabel,
  rightLabel,
  bomList: externalBomList,
}) => {
  // State
  const [selectedBOMId, setSelectedBOMId] = useState<string | null>(null); // Initially null = Aggregate view
  const [selectedTab, setSelectedTab] = useState<TabType>('ITEM');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'added' | 'deleted' | 'changed'>('added');
  const [autoNavigatePath, setAutoNavigatePath] = useState<string | null>(null);
  const [showMultiInstance, setShowMultiInstance] = useState(false);
  const [currentCategoryChanges, setCurrentCategoryChanges] = useState<AggregatedChange[]>([]);
  const [currentCategoryTitle, setCurrentCategoryTitle] = useState<string>('');
  const [currentCategoryType, setCurrentCategoryType] = useState<'added' | 'deleted' | 'changed'>('added');

  // Handler for BOM selection change
  const handleBOMSelectionChange = (newBOMId: string | null) => {
    setSelectedBOMId(newBOMId);
    setShowMultiInstance(false); // Exit multi-instance view if active

    // If a specific BOM is selected (not aggregate), navigate to root
    if (newBOMId) {
      // Get the root BOM code for the selected BOM to navigate to it
      let rootPath = '';
      if (newBOMId === 'bom1') {
        rootPath = activeBomList[0].data.enterprise_bom.bom_code;
      } else if (newBOMId === 'bom3') {
        rootPath = activeBomList[2].data.enterprise_bom.bom_code;
      }
      setAutoNavigatePath(rootPath); // Navigate to top-most BOM
    } else {
      setAutoNavigatePath(null); // Clear navigation when returning to aggregate
    }
  };

  // Use external bomList if provided, otherwise use internal sample data
  const activeBomList = externalBomList || bomList;

  // Get BOM data based on selection
  const { leftData, rightData, leftLabelFinal, rightLabelFinal } = useMemo(() => {
    // If props are provided and no BOM is selected, use props
    if (bom1 && bom2 && !selectedBOMId) {
      return {
        leftData: bom1,
        rightData: bom2,
        leftLabelFinal: leftLabel || 'Version 1',
        rightLabelFinal: rightLabel || 'Version 2',
      };
    }

    if (!selectedBOMId) {
      // No BOM selected - use first comparison as default for display
      return {
        leftData: activeBomList[0].data,
        rightData: activeBomList[1].data,
        leftLabelFinal: 'Version 1 (Baseline)',
        rightLabelFinal: 'Version 2 (With Changes)',
      };
    }

    // Map BOM selection to appropriate comparison
    if (selectedBOMId === 'bom1') {
      return {
        leftData: activeBomList[0].data,
        rightData: activeBomList[1].data,
        leftLabelFinal: activeBomList[0].name,
        rightLabelFinal: activeBomList[1].name,
      };
    } else if (selectedBOMId === 'bom3') {
      return {
        leftData: activeBomList[2].data,
        rightData: activeBomList[3].data,
        leftLabelFinal: activeBomList[2].name,
        rightLabelFinal: activeBomList[3].name,
      };
    }

    // Default fallback
    return {
      leftData: activeBomList[0].data,
      rightData: activeBomList[1].data,
      leftLabelFinal: 'Version 1 (Baseline)',
      rightLabelFinal: 'Version 2 (With Changes)',
    };
  }, [selectedBOMId, bom1, bom2, leftLabel, rightLabel, activeBomList]);

  // Build trees and detect changes for current selection
  const leftTree = useMemo(() => buildBOMTree(leftData), [leftData]);
  const rightTree = useMemo(() => buildBOMTree(rightData), [rightData]);
  const changeMap = useMemo(() => detectBOMTreeChanges(leftTree, rightTree), [leftTree, rightTree]);

  // Build aggregate changes across all BOMs when none is selected
  const aggregateChangeMaps = useMemo(() => {
    const maps: Map<string, any>[] = [];
    const trees: { left: any; right: any }[] = [];

    // Compare QAB1: bomList[0] vs bomList[1]
    const qab1Left = buildBOMTree(activeBomList[0].data);
    const qab1Right = buildBOMTree(activeBomList[1].data);
    const qab1Changes = detectBOMTreeChanges(qab1Left, qab1Right);
    maps.push(qab1Changes);
    trees.push({ left: qab1Left, right: qab1Right });

    // Compare PCB Assembly: bomList[2] vs bomList[3]
    const pcbLeft = buildBOMTree(activeBomList[2].data);
    const pcbRight = buildBOMTree(activeBomList[3].data);
    const pcbChanges = detectBOMTreeChanges(pcbLeft, pcbRight);
    maps.push(pcbChanges);
    trees.push({ left: pcbLeft, right: pcbRight });

    return { maps, trees };
  }, [activeBomList]);

  // Get stats based on whether a BOM is selected
  const stats = useMemo(() => {
    if (selectedBOMId) {
      // Single BOM comparison - add bomId to changes
      const bomStats = getStatsForTab(selectedTab, changeMap, leftTree, rightTree);
      return {
        added: bomStats.added.map(c => ({ ...c, bomId: selectedBOMId })),
        deleted: bomStats.deleted.map(c => ({ ...c, bomId: selectedBOMId })),
        changed: bomStats.changed.map(c => ({ ...c, bomId: selectedBOMId })),
      };
    } else {
      // Aggregate across all BOMs
      const allAdded: AggregatedChange[] = [];
      const allDeleted: AggregatedChange[] = [];
      const allChanged: AggregatedChange[] = [];

      // Process each BOM comparison
      const bomIds = ['bom1', 'bom3'];
      aggregateChangeMaps.maps.forEach((map, index) => {
        const { left, right } = aggregateChangeMaps.trees[index];
        const stats = getStatsForTab(selectedTab, map, left, right);

        // Add bomId to each change
        allAdded.push(...stats.added.map(c => ({ ...c, bomId: bomIds[index] })));
        allDeleted.push(...stats.deleted.map(c => ({ ...c, bomId: bomIds[index] })));
        allChanged.push(...stats.changed.map(c => ({ ...c, bomId: bomIds[index] })));
      });

      return {
        added: allAdded,
        deleted: allDeleted,
        changed: allChanged,
      };
    }
  }, [selectedTab, changeMap, leftTree, rightTree, selectedBOMId, aggregateChangeMaps]);

  // Handle box click - only open modal, don't auto-select BOM
  const handleBoxClick = (type: 'added' | 'deleted' | 'changed') => {
    setModalType(type);
    setModalOpen(true);
  };

  // Handle show all changes from modal - show ALL changes in multi-instance view
  const handleShowAllChanges = () => {
    const modalData = getModalData();

    // Show multi-instance view with ALL changes (don't auto-select BOM)
    setCurrentCategoryChanges(modalData.changes);
    setCurrentCategoryTitle(modalData.title);
    setCurrentCategoryType(modalType);
    setShowMultiInstance(true);
    setModalOpen(false);
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
    <Box>
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

      {/* BOM Selector Dropdown */}
      <Paper sx={{ mb: 3, p: 2 }}>
        <FormControl fullWidth>
          <InputLabel id="bom-selector-label">Select BOM Comparison</InputLabel>
          <Select
            labelId="bom-selector-label"
            value={selectedBOMId || 'aggregate'}
            onChange={(e) => handleBOMSelectionChange(e.target.value === 'aggregate' ? null : e.target.value)}
            label="Select BOM Comparison"
          >
            <MenuItem value="aggregate">
              <strong>Aggregate View - All BOMs</strong>
            </MenuItem>
            <MenuItem value="bom1">QAB1 - Version 1 vs Version 2</MenuItem>
            <MenuItem value="bom3">PCB Assembly - Version 1 vs Version 2</MenuItem>
          </Select>
        </FormControl>
      </Paper>

      {/* Conditional View: Multi-Instance or Regular Comparison */}
      {showMultiInstance ? (
        <Box>
          {/* Show BOM info header when in multi-instance view */}
          <Paper sx={{ p: 2.5, mb: 3, backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#111827', mb: 0.5 }}>
                  {currentCategoryTitle}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                  Viewing: {leftLabelFinal} vs {rightLabelFinal}
                </Typography>
              </Box>
              <Paper
                onClick={() => setShowMultiInstance(false)}
                sx={{
                  px: 2,
                  py: 1,
                  cursor: 'pointer',
                  backgroundColor: '#f9fafb',
                  '&:hover': {
                    backgroundColor: '#e5e7eb',
                  },
                }}
              >
                ← Back to Summary View
              </Paper>
            </Stack>
          </Paper>

          <MultiInstanceComparisonView
            changes={currentCategoryChanges}
            categoryTitle={currentCategoryTitle}
            categoryType={currentCategoryType}
          />
        </Box>
      ) : (
        <BOMComparisonPage
          leftData={leftData}
          rightData={rightData}
          leftLabel={leftLabelFinal}
          rightLabel={rightLabelFinal}
          autoNavigateTo={autoNavigatePath}
          onNavigationComplete={() => setAutoNavigatePath(null)}
        />
      )}

      {/* Changes Modal */}
      <ChangesListModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalData.title}
        changes={modalData.changes}
        onShowAllChanges={handleShowAllChanges}
      />
    </Box>
  );
};
