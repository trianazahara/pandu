import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  TextField,
  Button,
  IconButton,
  FormControl,
  InputLabel,
  InputAdornment,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Select,
  MenuItem,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  FilterList as FilterIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';

const InternManagement = () => {
  const [interns, setInterns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    bidang: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    page: 0,
    limit: 10,
    total: 0
  });
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    internId: null
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const fetchInterns = async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams({
        page: pagination.page + 1,
        limit: pagination.limit,
        ...filters
      });

      const response = await fetch(`/api/intern?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Gagal memuat data');
      }

      const data = await response.json();
      setInterns(data.data);
      setPagination(prev => ({
        ...prev,
        total: data.pagination.total
      }));
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterns();
  }, [pagination.page, pagination.limit, filters]);

  const handleFilter = () => {
    setPagination(prev => ({ ...prev, page: 0 }));
    fetchInterns();
  };

  const handleDeleteClick = (internId) => {
    setDeleteDialog({ open: true, internId });
  };

  const handleDeleteConfirm = async () => {
    try {
      const response = await fetch(`/api/intern/${deleteDialog.internId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Gagal menghapus data');
      }

      setSnackbar({
        open: true,
        message: 'Data berhasil dihapus',
        severity: 'success'
      });
      fetchInterns();
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message,
        severity: 'error'
      });
    } finally {
      setDeleteDialog({ open: false, internId: null });
    }
  };

  const handlePageChange = (event, newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleLimitChange = (event) => {
    setPagination(prev => ({
      ...prev,
      limit: parseInt(event.target.value, 10),
      page: 0
    }));
  };

  const getStatusLabel = (status) => {
    const labels = {
      'active': 'Aktif',
      'not_yet': 'Belum Mulai',
      'completed': 'Selesai',
      'almost': 'Hampir Selesai'
    };
    return labels[status] || status;
  };

  const getStatusStyle = (status) => {
    const styles = {
      'active': {
        bg: '#E7F7EE',
        color: '#047857',
        border: '#047857'
      },
      'not_yet': {
        bg: '#EEF2FF',
        color: '#3730A3',
        border: '#3730A3'
      },
      'completed': {
        bg: '#E7F7EE',
        color: '#047857',
        border: '#047857'
      },
      'almost': {
        bg: '#FEF9E7',
        color: '#B7791F',
        border: '#B7791F'
      }
    };
    return styles[status] || { bg: 'default', color: 'default', border: 'default' };
  };

  return (
    <Box className="p-6">
      <Card elevation={2}>
        <CardContent>
          <Typography variant="h6" className="mb-4 font-bold">
            Filter Data Magang
          </Typography>
          
          <Box className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                label="Status"
                onChange={(e) => setFilters({...filters, status: e.target.value})}
              >
                <MenuItem value="">Semua Status</MenuItem>
                <MenuItem value="active">Aktif</MenuItem>
                <MenuItem value="not_yet">Belum Mulai</MenuItem>
                <MenuItem value="completed">Selesai</MenuItem>
                <MenuItem value="almost">Hampir Selesai</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Bidang</InputLabel>
              <Select
                value={filters.bidang}
                label="Bidang"
                onChange={(e) => setFilters({...filters, bidang: e.target.value})}
              >
                <MenuItem value="">Semua Bidang</MenuItem>
                {/* Add bidang options here */}
              </Select>
            </FormControl>

            <Box className="flex gap-2 lg:col-span-2">
              <TextField
                size="small"
                fullWidth
                placeholder="Cari nama/NIM/institusi..."
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon className="text-gray-500" />
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                variant="contained"
                color="primary"
                onClick={handleFilter}
                startIcon={<FilterIcon />}
              >
                Filter
              </Button>
            </Box>
          </Box>

          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell style={{ fontWeight: 'bold' }}>NAMA</TableCell>
                  <TableCell style={{ fontWeight: 'bold' }}>NIM/NISN</TableCell>
                  <TableCell style={{ fontWeight: 'bold' }}>INSTITUSI</TableCell>
                  <TableCell style={{ fontWeight: 'bold' }} align="center">BIDANG</TableCell>
                  <TableCell style={{ fontWeight: 'bold' }} align="center">STATUS</TableCell>
                  <TableCell style={{ fontWeight: 'bold' }} align="center">AKSI</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" className="py-8">
                      <Box className="flex justify-center items-center py-4">
                        <Typography>Memuat data...</Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" className="py-8 text-red-600">
                      {error}
                    </TableCell>
                  </TableRow>
                ) : interns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" className="py-8">
                      Tidak ada data yang ditemukan
                    </TableCell>
                  </TableRow>
                ) : (
                  interns.map((intern) => (
                    <TableRow key={intern.id_magang} hover>
                      <TableCell>{intern.nama}</TableCell>
                      <TableCell>{intern.nomor_induk}</TableCell>
                      <TableCell>{intern.nama_institusi}</TableCell>
                      <TableCell align="center">{intern.nama_bidang}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={getStatusLabel(intern.status)}
                          sx={{
                            backgroundColor: getStatusStyle(intern.status).bg,
                            color: getStatusStyle(intern.status).color,
                            borderColor: getStatusStyle(intern.status).border,
                            '&:hover': {
                              backgroundColor: getStatusStyle(intern.status).bg
                            }
                          }}
                          variant="outlined"
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Box className="flex justify-center gap-1">
                          <IconButton
                            size="small"
                            onClick={() => window.location.href = `/intern/${intern.id_magang}`}
                            sx={{ 
                              color: 'info.main',
                              '&:hover': { backgroundColor: 'info.lighter' }
                            }}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => window.location.href = `/intern/${intern.id_magang}/edit`}
                            sx={{ 
                              color: 'primary.main',
                              '&:hover': { backgroundColor: 'primary.lighter' }
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteClick(intern.id_magang)}
                            sx={{ 
                              color: 'error.main',
                              '&:hover': { backgroundColor: 'error.lighter' }
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={pagination.total}
              page={pagination.page}
              onPageChange={handlePageChange}
              rowsPerPage={pagination.limit}
              onRowsPerPageChange={handleLimitChange}
              rowsPerPageOptions={[5, 10, 25, 50]}
              labelRowsPerPage="Data per halaman"
            />
          </TableContainer>
        </CardContent>
      </Card>

      <Button
        variant="contained"
        color="primary"
        startIcon={<AddIcon />}
        className="mt-4"
        onClick={() => window.location.href = '/intern/add'}
      >
        Tambah Magang
      </Button>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, internId: null })}
      >
        <DialogTitle>Konfirmasi Hapus</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Apakah Anda yakin ingin menghapus data ini?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteDialog({ open: false, internId: null })}
            color="primary"
          >
            Batal
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
          >
            Hapus
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default InternManagement;