import React, { useState, useMemo } from 'react';
import { Box, Paper, Tabs, Tab, Typography, Stack } from '@mui/material';
import { IProjectBOMResponse } from '../types/interfaces';
import { buildBOMTree } from '../utils/bomHierarchy';
import { detectBOMTreeChanges } from '../utils/bomChangeDetection';
import { getStatsForTab, TabType, AggregatedChange } from '../utils/changeAggregation';
import { StatsSummaryBoxes } from './StatsSummaryBoxes';
import { ChangesListModal } from './ChangesListModal';
import { BOMComparisonPage } from './BOMComparisonPage';
import { MultiInstanceComparisonView } from './MultiInstanceComparisonView';

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
  // State
  const [selectedTab, setSelectedTab] = useState<TabType>('ITEM');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'added' | 'deleted' | 'changed'>('added');
  const [autoNavigatePath, setAutoNavigatePath] = useState<string | null>(null);
  const [showMultiInstance, setShowMultiInstance] = useState(false);
  const [currentCategoryChanges, setCurrentCategoryChanges] = useState<AggregatedChange[]>([]);
  const [currentCategoryTitle, setCurrentCategoryTitle] = useState<string>('');
  const [currentCategoryType, setCurrentCategoryType] = useState<'added' | 'deleted' | 'changed'>('added');

  // Use props directly
  const leftData = bom1;
  const rightData = bom2;

  // Build trees and detect changes
  const leftTree = useMemo(() => buildBOMTree(leftData), [leftData]);
  const rightTree = useMemo(() => buildBOMTree(rightData), [rightData]);
  const changeMap = useMemo(() => detectBOMTreeChanges(leftTree, rightTree), [leftTree, rightTree]);

  // Get stats
  const stats = useMemo(() => {
    return getStatsForTab(selectedTab, changeMap, leftTree, rightTree);
  }, [selectedTab, changeMap, leftTree, rightTree]);

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
                  Viewing: {leftLabel} vs {rightLabel}
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
          leftLabel={leftLabel}
          rightLabel={rightLabel}
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
