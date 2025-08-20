import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Divider,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Snackbar,
} from '@mui/material';
import {
  Backup,
  Restore,
  Download,
  Upload,
  Delete,
  Settings,
  Warning,
  CheckCircle,
  ExpandMore,
  CloudUpload,
  Storage,
} from '@mui/icons-material';
import { DataManager, type AppSettings, type BackupInfo, type DataMetadata } from '../../services/dataManager';

export const DataManagement: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>(DataManager.getDefaultSettings());
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [dataStats, setDataStats] = useState<DataMetadata | null>(null);
  const [integrityCheck, setIntegrityCheck] = useState<any>(null);
  
  // Dialog states
  const [showBackupDialog, setShowBackupDialog] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showClearDataDialog, setShowClearDataDialog] = useState(false);
  
  // Operation states
  const [isLoading, setIsLoading] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<string>('');
  const [importData, setImportData] = useState('');
  
  // Notification states
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setSettings(DataManager.getSettings());
    setBackups(DataManager.getAvailableBackups());
    setDataStats(DataManager.getDataStatistics());
    setIntegrityCheck(DataManager.checkDataIntegrity());
  };

  const showNotification = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setNotification({ open: true, message, severity });
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  const handleSettingsChange = (key: keyof AppSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    DataManager.updateSettings({ [key]: value });
    showNotification('Settings updated successfully', 'success');
  };

  const handleNestedSettingsChange = (category: keyof AppSettings, key: string, value: any) => {
    const categorySettings = settings[category] as any;
    const newCategorySettings = {
      ...categorySettings,
      [key]: value,
    };
    const newSettings = {
      ...settings,
      [category]: newCategorySettings,
    };
    setSettings(newSettings);
    DataManager.updateSettings({ [category]: newCategorySettings });
    showNotification('Settings updated successfully', 'success');
  };

  const handleCreateBackup = async () => {
    setIsLoading(true);
    try {
      const result = DataManager.createBackup();
      if (result.success) {
        showNotification(`Backup created successfully: ${result.filename}`, 'success');
        loadData(); // Refresh data
      } else {
        showNotification(`Backup failed: ${result.error}`, 'error');
      }
    } catch (error) {
      showNotification('Backup creation failed', 'error');
    } finally {
      setIsLoading(false);
      setShowBackupDialog(false);
    }
  };

  const handleRestoreBackup = async () => {
    if (!selectedBackup) return;
    
    setIsLoading(true);
    try {
      const result = DataManager.restoreFromBackup(selectedBackup);
      if (result.success) {
        showNotification('Data restored successfully. Please refresh the page.', 'success');
      } else {
        showNotification(`Restore failed: ${result.error}`, 'error');
      }
    } catch (error) {
      showNotification('Restore operation failed', 'error');
    } finally {
      setIsLoading(false);
      setShowRestoreDialog(false);
      setSelectedBackup('');
    }
  };

  const handleExportData = () => {
    try {
      const result = DataManager.exportData();
      if (result.success && result.data && result.filename) {
        // Create download link
        const blob = new Blob([result.data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = result.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        showNotification('Data exported successfully', 'success');
      } else {
        showNotification(`Export failed: ${result.error}`, 'error');
      }
    } catch (error) {
      showNotification('Export operation failed', 'error');
    }
  };

  const handleImportData = () => {
    if (!importData.trim()) {
      showNotification('Please paste the data to import', 'warning');
      return;
    }

    setIsLoading(true);
    try {
      const result = DataManager.importData(importData);
      if (result.success) {
        let message = 'Data imported successfully';
        if (result.warnings && result.warnings.length > 0) {
          message += ` with ${result.warnings.length} warnings`;
        }
        showNotification(message, result.warnings ? 'warning' : 'success');
        loadData(); // Refresh data
      } else {
        showNotification(`Import failed: ${result.error}`, 'error');
      }
    } catch (error) {
      showNotification('Import operation failed', 'error');
    } finally {
      setIsLoading(false);
      setShowImportDialog(false);
      setImportData('');
    }
  };

  const handleClearAllData = async () => {
    setIsLoading(true);
    try {
      const result = DataManager.clearAllData();
      if (result.success) {
        showNotification('All data cleared successfully. Please refresh the page.', 'success');
      } else {
        showNotification(`Clear data failed: ${result.error}`, 'error');
      }
    } catch (error) {
      showNotification('Clear data operation failed', 'error');
    } finally {
      setIsLoading(false);
      setShowClearDataDialog(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Data Management
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Manage your app settings, backup data, and maintain data integrity
      </Typography>

      {/* Data Health Status */}
      {integrityCheck && (
        <Card className="glass-card dashboard-chart-card slide-up" sx={{ mb: 3 }}>
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              {integrityCheck.isHealthy ? (
                <CheckCircle color="success" sx={{ mr: 1 }} />
              ) : (
                <Warning color="warning" sx={{ mr: 1 }} />
              )}
              <Typography variant="h6">
                Data Health: {integrityCheck.isHealthy ? 'Healthy' : 'Issues Found'}
              </Typography>
            </Box>
            
            {integrityCheck.issues.length > 0 && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>Issues Found:</Typography>
                {integrityCheck.issues.map((issue: string, index: number) => (
                  <Typography key={index} variant="body2">• {issue}</Typography>
                ))}
              </Alert>
            )}
            
            {integrityCheck.suggestions.length > 0 && (
              <Alert severity="info">
                <Typography variant="subtitle2" gutterBottom>Suggestions:</Typography>
                {integrityCheck.suggestions.map((suggestion: string, index: number) => (
                  <Typography key={index} variant="body2">• {suggestion}</Typography>
                ))}
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {/* Data Statistics */}
        <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(50% - 12px)' } }}>
          <Card className="glass-card dashboard-chart-card slide-up">
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Storage sx={{ mr: 1 }} />
                <Typography variant="h6">Data Statistics</Typography>
              </Box>
              
              {dataStats && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Transactions:</Typography>
                    <Chip label={dataStats.totalTransactions} size="small" />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Budgets:</Typography>
                    <Chip label={dataStats.totalBudgets} size="small" />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Goals:</Typography>
                    <Chip label={dataStats.totalGoals} size="small" />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Data Size:</Typography>
                    <Chip label={formatFileSize(dataStats.dataSize)} size="small" />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Last Backup:</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {dataStats.lastBackup 
                        ? new Date(dataStats.lastBackup).toLocaleDateString()
                        : 'Never'
                      }
                    </Typography>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>

        {/* Backup Management */}
        <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(50% - 12px)' } }}>
          <Card className="glass-card dashboard-chart-card slide-up">
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Backup sx={{ mr: 1 }} />
                <Typography variant="h6">Backup Management</Typography>
              </Box>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<CloudUpload />}
                  onClick={() => setShowBackupDialog(true)}
                  fullWidth
                >
                  Create Backup
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<Restore />}
                  onClick={() => setShowRestoreDialog(true)}
                  disabled={backups.length === 0}
                  fullWidth
                >
                  Restore from Backup ({backups.length})
                </Button>
                
                <Divider />
                
                <Button
                  variant="outlined"
                  startIcon={<Download />}
                  onClick={handleExportData}
                  fullWidth
                >
                  Export Data
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<Upload />}
                  onClick={() => setShowImportDialog(true)}
                  fullWidth
                >
                  Import Data
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* App Settings */}
        <Box sx={{ flex: '1 1 100%' }}>
          <Card className="glass-card dashboard-chart-card slide-up">
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Settings sx={{ mr: 1 }} />
                <Typography variant="h6">App Settings</Typography>
              </Box>

              {/* General Settings */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="subtitle1">General Settings</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <FormControl fullWidth>
                      <InputLabel>Currency</InputLabel>
                      <Select
                        value={settings.currency}
                        onChange={(e) => handleSettingsChange('currency', e.target.value)}
                        label="Currency"
                      >
                        <MenuItem value="USD">USD ($)</MenuItem>
                        <MenuItem value="EUR">EUR (€)</MenuItem>
                        <MenuItem value="GBP">GBP (£)</MenuItem>
                        <MenuItem value="JPY">JPY (¥)</MenuItem>
                        <MenuItem value="CAD">CAD (C$)</MenuItem>
                        <MenuItem value="AUD">AUD (A$)</MenuItem>
                      </Select>
                    </FormControl>

                    <FormControl fullWidth>
                      <InputLabel>Date Format</InputLabel>
                      <Select
                        value={settings.dateFormat}
                        onChange={(e) => handleSettingsChange('dateFormat', e.target.value)}
                        label="Date Format"
                      >
                        <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
                        <MenuItem value="DD/MM/YYYY">DD/MM/YYYY</MenuItem>
                        <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
                      </Select>
                    </FormControl>

                    <FormControl fullWidth>
                      <InputLabel>Theme</InputLabel>
                      <Select
                        value={settings.theme}
                        onChange={(e) => handleSettingsChange('theme', e.target.value)}
                        label="Theme"
                      >
                        <MenuItem value="light">Light</MenuItem>
                        <MenuItem value="dark">Dark</MenuItem>
                        <MenuItem value="auto">Auto (System)</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </AccordionDetails>
              </Accordion>

              {/* Notification Settings */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="subtitle1">Notification Settings</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.notifications.budgetAlerts}
                          onChange={(e) => handleNestedSettingsChange('notifications', 'budgetAlerts', e.target.checked)}
                        />
                      }
                      label="Budget alerts when approaching limits"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.notifications.goalDeadlines}
                          onChange={(e) => handleNestedSettingsChange('notifications', 'goalDeadlines', e.target.checked)}
                        />
                      }
                      label="Goal deadline reminders"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.notifications.monthlyReports}
                          onChange={(e) => handleNestedSettingsChange('notifications', 'monthlyReports', e.target.checked)}
                        />
                      }
                      label="Monthly financial reports"
                    />
                  </Box>
                </AccordionDetails>
              </Accordion>

              {/* Privacy Settings */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="subtitle1">Privacy Settings</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.privacy.analytics}
                          onChange={(e) => handleNestedSettingsChange('privacy', 'analytics', e.target.checked)}
                        />
                      }
                      label="Share anonymous usage analytics"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.privacy.crashReporting}
                          onChange={(e) => handleNestedSettingsChange('privacy', 'crashReporting', e.target.checked)}
                        />
                      }
                      label="Share crash reports for debugging"
                    />
                  </Box>
                </AccordionDetails>
              </Accordion>
            </CardContent>
          </Card>
        </Box>

        {/* Danger Zone */}
        <Box sx={{ flex: '1 1 100%' }}>
          <Card className="glass-card dashboard-chart-card slide-up" sx={{ border: '1px solid', borderColor: 'error.main' }}>
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Warning color="error" sx={{ mr: 1 }} />
                <Typography variant="h6" color="error">Danger Zone</Typography>
              </Box>
              
              <Alert severity="warning" sx={{ mb: 2 }}>
                These actions are irreversible. Make sure you have a backup before proceeding.
              </Alert>
              
              <Button
                variant="outlined"
                color="error"
                startIcon={<Delete />}
                onClick={() => setShowClearDataDialog(true)}
              >
                Clear All Data
              </Button>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Dialogs */}
      
      {/* Create Backup Dialog */}
      <Dialog open={showBackupDialog} onClose={() => setShowBackupDialog(false)}>
        <DialogTitle>Create Backup</DialogTitle>
        <DialogContent>
          <Typography>
            Create a backup of all your data including transactions, budgets, goals, and settings?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowBackupDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateBackup} 
            variant="contained"
            disabled={isLoading}
          >
            {isLoading ? <CircularProgress size={20} /> : 'Create Backup'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Restore Backup Dialog */}
      <Dialog open={showRestoreDialog} onClose={() => setShowRestoreDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Restore from Backup</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Select a backup to restore. This will overwrite all current data.
          </Typography>
          
          {backups.length === 0 ? (
            <Alert severity="info">No backups available</Alert>
          ) : (
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Select Backup</InputLabel>
              <Select
                value={selectedBackup}
                onChange={(e) => setSelectedBackup(e.target.value)}
                label="Select Backup"
              >
                {backups.map((backup) => (
                  <MenuItem key={backup.filename} value={backup.filename}>
                    {new Date(backup.timestamp).toLocaleString()} - {formatFileSize(backup.size)}
                    ({backup.transactionCount} transactions, {backup.budgetCount} budgets, {backup.goalCount} goals)
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRestoreDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleRestoreBackup}
            variant="contained"
            color="warning"
            disabled={!selectedBackup || isLoading}
          >
            {isLoading ? <CircularProgress size={20} /> : 'Restore'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Import Data Dialog */}
      <Dialog open={showImportDialog} onClose={() => setShowImportDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Import Data</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Paste the exported JSON data below to import it.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={10}
            value={importData}
            onChange={(e) => setImportData(e.target.value)}
            placeholder="Paste your JSON data here..."
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowImportDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleImportData}
            variant="contained"
            disabled={!importData.trim() || isLoading}
          >
            {isLoading ? <CircularProgress size={20} /> : 'Import'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Clear All Data Dialog */}
      <Dialog open={showClearDataDialog} onClose={() => setShowClearDataDialog(false)}>
        <DialogTitle>Clear All Data</DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            This action cannot be undone!
          </Alert>
          <Typography>
            Are you sure you want to clear all data? This will remove all transactions, budgets, goals, and settings.
            A final backup will be created automatically.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowClearDataDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleClearAllData}
            variant="contained"
            color="error"
            disabled={isLoading}
          >
            {isLoading ? <CircularProgress size={20} /> : 'Clear All Data'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notifications */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};