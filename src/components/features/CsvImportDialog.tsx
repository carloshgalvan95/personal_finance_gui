import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import type { CsvTransactionRow } from '../../utils/csvImport';

interface CsvImportDialogProps {
  open: boolean;
  rows: CsvTransactionRow[];
  errors: string[];
  fileName?: string;
  onClose: () => void;
  onConfirm: () => void;
}

export function CsvImportDialog({
  open,
  rows,
  errors,
  fileName,
  onClose,
  onConfirm,
}: CsvImportDialogProps) {
  const preview = rows.slice(0, 8);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Review CSV import</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {fileName ? `${fileName}: ` : ''}
          {rows.length} transaction{rows.length === 1 ? '' : 's'} ready to import.
          {errors.length > 0 &&
            ` ${errors.length} row(s) will be skipped.`}
        </Typography>

        {errors.length > 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {errors.slice(0, 3).join(' ')}
            {errors.length > 3 && ` (+${errors.length - 3} more)`}
          </Alert>
        )}

        {preview.length > 0 ? (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell align="right">Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {preview.map((row, index) => (
                  <TableRow key={`${row.date}-${row.description}-${index}`}>
                    <TableCell>{row.date}</TableCell>
                    <TableCell>{row.description}</TableCell>
                    <TableCell>{row.type}</TableCell>
                    <TableCell>{row.category}</TableCell>
                    <TableCell align="right">
                      ${row.amount.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Alert severity="info">No valid rows found in this file.</Alert>
        )}

        {rows.length > preview.length && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Showing first {preview.length} of {rows.length} rows.
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={onConfirm}
          disabled={rows.length === 0}
        >
          Import {rows.length} transaction{rows.length === 1 ? '' : 's'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
