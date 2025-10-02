import React, { useState, useMemo } from 'react';
import { Box, Paper, Tabs, Tab, Typography, Stack } from '@mui/material';
import { bomList } from '../data/sampleData';
import { buildBOMTree } from '../utils/bomHierarchy';
import { detectBOMTreeChanges } from '../utils/bomChangeDetection';
import { getStatsForTab, TabType, AggregatedChange } from '../utils/changeAggregation';
import { StatsSummaryBoxes } from './StatsSummaryBoxes';
import { ChangesListModal } from './ChangesListModal';
import { BOMComparisonPage } from './BOMComparisonPage';
import { MultiInstanceComparisonView } from './MultiInstanceComparisonView';

export const BOMComparisonWrapper: React.FC = () => {
  // State
  const [selectedBOMId, setSelectedBOMId] = useState<string | null>(null); // Initially null = All BOMs
  const [selectedTab, setSelectedTab] = useState<TabType>('ITEM');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'added' | 'deleted' | 'changed'>('added');
  const [autoNavigatePath, setAutoNavigatePath] = useState<string | null>(null);
  const [showMultiInstance, setShowMultiInstance] = useState(false);
  const [currentCategoryChanges, setCurrentCategoryChanges] = useState<AggregatedChange[]>([]);
  const [currentCategoryTitle, setCurrentCategoryTitle] = useState<string>('');
  const [currentCategoryType, setCurrentCategoryType] = useState<'added' | 'deleted' | 'changed'>('added');

  // Get BOM data based on selection
  const { leftData, rightData, leftLabel, rightLabel } = useMemo(() => {
    if (!selectedBOMId) {
      // No BOM selected - use first comparison as default for display, but generic labels
      return {
        leftData: bomList[0].data,
        rightData: bomList[1].data,
        leftLabel: 'Version 1 (Baseline)',
        rightLabel: 'Version 2 (With Changes)',
      };
    }

    // Map BOM selection to appropriate comparison
    // bom1 -> compare bomList[0] and bomList[1] (QAB1 V1 vs V2)
    // bom3 -> compare bomList[2] and bomList[3] (PCB V1 vs V2)
    if (selectedBOMId === 'bom1') {
      return {
        leftData: bomList[0].data,
        rightData: bomList[1].data,
        leftLabel: bomList[0].name,
        rightLabel: bomList[1].name,
      };
    } else if (selectedBOMId === 'bom3') {
      return {
        leftData: bomList[2].data,
        rightData: bomList[3].data,
        leftLabel: bomList[2].name,
        rightLabel: bomList[3].name,
      };
    }

    // Default fallback
    return {
      leftData: bomList[0].data,
      rightData: bomList[1].data,
      leftLabel: 'Version 1 (Baseline)',
      rightLabel: 'Version 2 (With Changes)',
    };
  }, [selectedBOMId]);

  // Build trees and detect changes for current selection
  const leftTree = useMemo(() => buildBOMTree(leftData), [leftData]);
  const rightTree = useMemo(() => buildBOMTree(rightData), [rightData]);
  const changeMap = useMemo(() => detectBOMTreeChanges(leftTree, rightTree), [leftTree, rightTree]);

  // Build aggregate changes across all BOMs when none is selected
  const aggregateChangeMaps = useMemo(() => {
    const maps: Map<string, any>[] = [];
    const trees: { left: any; right: any }[] = [];

    // Compare QAB1: bomList[0] vs bomList[1]
    const qab1Left = buildBOMTree(bomList[0].data);
    const qab1Right = buildBOMTree(bomList[1].data);
    const qab1Changes = detectBOMTreeChanges(qab1Left, qab1Right);
    maps.push(qab1Changes);
    trees.push({ left: qab1Left, right: qab1Right });

    // Compare PCB Assembly: bomList[2] vs bomList[3]
    const pcbLeft = buildBOMTree(bomList[2].data);
    const pcbRight = buildBOMTree(bomList[3].data);
    const pcbChanges = detectBOMTreeChanges(pcbLeft, pcbRight);
    maps.push(pcbChanges);
    trees.push({ left: pcbLeft, right: pcbRight });

    return { maps, trees };
  }, []);

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
    }

    // Aggregate across all BOMs
    const allAdded: AggregatedChange[] = [];
    const allDeleted: AggregatedChange[] = [];
    const allChanged: AggregatedChange[] = [];

    aggregateChangeMaps.maps.forEach((map, index) => {
      const { left, right } = aggregateChangeMaps.trees[index];
      const bomStats = getStatsForTab(selectedTab, map, left, right);

      // Add bomId to each change based on index
      // index 0 = bom1 (QAB1), index 1 = bom3 (PCB Assembly)
      const bomId = index === 0 ? 'bom1' : 'bom3';

      allAdded.push(...bomStats.added.map(c => ({ ...c, bomId })));
      allDeleted.push(...bomStats.deleted.map(c => ({ ...c, bomId })));
      allChanged.push(...bomStats.changed.map(c => ({ ...c, bomId })));
    });

    return { added: allAdded, deleted: allDeleted, changed: allChanged };
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

      {/* BOM Selector - Always Visible */}
      <Paper sx={{ p: 2.5, mb: 3, backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}>
        <Typography variant="caption" sx={{ mb: 1.5, color: '#6b7280', fontWeight: 600, display: 'block' }}>
          Select BOM to Compare
        </Typography>
        <select
          value={selectedBOMId || ''}
          onChange={(e) => setSelectedBOMId(e.target.value || null)}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #e5e7eb',
            borderRadius: '4px',
            fontSize: '14px',
            backgroundColor: '#ffffff',
          }}
        >
          <option value="">All BOMs (Aggregated Changes)</option>
          <option value="bom1">QAB1 Comparison</option>
          <option value="bom3">PCB Assembly Comparison</option>
        </select>
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
                {selectedBOMId ? (
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                    Viewing: {leftLabel} vs {rightLabel}
                  </Typography>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                    Viewing: All BOMs (Aggregated Changes)
                  </Typography>
                )}
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
            changes={
              selectedBOMId
                ? currentCategoryChanges.filter(change => change.bomId === selectedBOMId)
                : currentCategoryChanges
            }
            categoryTitle={currentCategoryTitle}
            categoryType={currentCategoryType}
          />
        </Box>
      ) : selectedBOMId ? (
        <BOMComparisonPage
          leftData={leftData}
          rightData={rightData}
          leftLabel={leftLabel}
          rightLabel={rightLabel}
          autoNavigateTo={autoNavigatePath}
          onNavigationComplete={() => setAutoNavigatePath(null)}
          selectedBOMId={selectedBOMId}
          onBOMChange={setSelectedBOMId}
        />
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center', backgroundColor: '#f9fafb' }}>
          <Typography variant="body1" color="text.secondary">
            Please select a BOM from the dropdown above to view the comparison
          </Typography>
        </Paper>
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
