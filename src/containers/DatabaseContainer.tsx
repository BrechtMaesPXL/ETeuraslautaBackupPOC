import React from 'react';
import {DatabaseView} from '../views/pages/DatabaseView';
import {useDatabaseController} from '../controllers/DatabaseController';

export const DatabaseContainer: React.FC = () => {
  const {
    items,
    backups,
    isLoading,
    isRefreshing,
    isBackingUp,
    isRestoring,
    isLoadingPreview,
    editingItem,
    showAddForm,
    showBackups,
    sdCardAvailable,
    sdCardPath,
    previewBackup,
    setShowAddForm,
    setEditingItem,
    handleRefresh,
    handleAddItem,
    handleUpdateItem,
    handleItemPress,
    handleExportBackup,
    handleShowBackups,
    handleHideBackups,
    handlePreviewBackup,
    handleHidePreview,
    handleRestoreBackup,
    handleDeleteBackup,
  } = useDatabaseController();

  return (
    <DatabaseView
      items={items}
      backups={backups}
      isLoading={isLoading}
      isRefreshing={isRefreshing}
      isBackingUp={isBackingUp}
      isRestoring={isRestoring}
      isLoadingPreview={isLoadingPreview}
      editingItem={editingItem}
      showAddForm={showAddForm}
      showBackups={showBackups}
      sdCardAvailable={sdCardAvailable}
      sdCardPath={sdCardPath}
      previewBackup={previewBackup}
      onSetShowAddForm={setShowAddForm}
      onSetEditingItem={setEditingItem}
      onRefresh={handleRefresh}
      onAddItem={handleAddItem}
      onUpdateItem={handleUpdateItem}
      onItemPress={handleItemPress}
      onExportBackup={handleExportBackup}
      onShowBackups={handleShowBackups}
      onHideBackups={handleHideBackups}
      onPreviewBackup={handlePreviewBackup}
      onHidePreview={handleHidePreview}
      onRestoreBackup={handleRestoreBackup}
      onDeleteBackup={handleDeleteBackup}
    />
  );
};
