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
  Snackbar,
  Fab,
  Grid,
  Stack,
  FormHelperText,
  CircularProgress
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  FilterList as FilterIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';

// Custom Field Component untuk Formik + Material UI
const FormTextField = ({ field, form: { touched, errors }, ...props }) => (
  <TextField
    {...field}
    {...props}
    error={touched[field.name] && Boolean(errors[field.name])}
    helperText={touched[field.name] && errors[field.name]}
  />
);

const InternManagement = () => {
  // State yang sudah ada
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
    internId: null,
    loading: false,
    nama: ''
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [bidangList, setBidangList] = useState([]);
  const [bidangLoading, setBidangLoading] = useState(true);
  const [bidangError, setBidangError] = useState(null);

  // State untuk dialog detail dan edit
  const [detailDialog, setDetailDialog] = useState({
    open: false,
    loading: false,
    data: null,
    error: null
  });

  const [editDialog, setEditDialog] = useState({
    open: false,
    loading: false,
    data: null,
    error: null
  });

  // Fungsi helper yang sudah ada
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
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
        bg: '#FB4141',
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

  // Fungsi fetch data
  const fetchBidangList = async () => {
    try {
      setBidangLoading(true);
      setBidangError(null);
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/bidang', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch bidang data');
      }

      const result = await response.json();
      if (result.status === 'success') {
        setBidangList(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch bidang data');
      }
    } catch (error) {
      console.error('Error fetching bidang:', error);
      setBidangError('Gagal mengambil data bidang');
    } finally {
      setBidangLoading(false);
    }
  };

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

  // Event handlers
  const handleFilter = () => {
    setPagination(prev => ({ ...prev, page: 0 }));
    fetchInterns();
  };

  const handleDeleteClick = (internId, nama) => {
    setDeleteDialog({ open: true, internId, nama });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.internId) return;

    try {
      setDeleteDialog(prev => ({ ...prev, loading: true }));

      const response = await fetch(`/api/intern/${deleteDialog.internId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Gagal menghapus data');
      }

      setSnackbar({
        open: true,
        message: 'Data berhasil dihapus',
        severity: 'success'
      });
      
      fetchInterns();
    } catch (error) {
      console.error('Error deleting intern:', error);
      setSnackbar({
        open: true,
        message: error.message,
        severity: 'error'
      });
    } finally {
      setDeleteDialog({ open: false, internId: null, loading: false, nama: '' });
    }
  };

  const handleDetailClick = async (id) => {
    setDetailDialog(prev => ({ ...prev, open: true, loading: true }));
    try {
      const response = await fetch(`/api/intern/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Gagal memuat data');
      }

      const result = await response.json();
      setDetailDialog(prev => ({ ...prev, data: result.data, loading: false }));
    } catch (error) {
      setDetailDialog(prev => ({ 
        ...prev, 
        error: error.message, 
        loading: false 
      }));
    }
  };

  const handleEditClick = async (id) => {
    setEditDialog(prev => ({ ...prev, open: true, loading: true }));
    try {
      const response = await fetch(`/api/intern/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Gagal memuat data');
      }

      const result = await response.json();
      setEditDialog(prev => ({ ...prev, data: result.data, loading: false }));
    } catch (error) {
      setEditDialog(prev => ({ 
        ...prev, 
        error: error.message, 
        loading: false 
      }));
    }
  };

  const handleEditSubmit = async (values) => {
    setEditDialog(prev => ({ ...prev, loading: true }));
    try {
      const response = await fetch(`/api/intern/${editDialog.data.id_magang}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(values)
      });

      if (!response.ok) {
        throw new Error('Gagal memperbarui data');
      }

      setSnackbar({
        open: true,
        message: 'Data berhasil diperbarui',
        severity: 'success'
      });
      
      setEditDialog({ open: false, loading: false, data: null, error: null });
      fetchInterns();
    } catch (error) {
      setEditDialog(prev => ({
        ...prev,
        error: error.message,
        loading: false
      }));
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

  // useEffect
  useEffect(() => {
    fetchInterns();
  }, [pagination.page, pagination.limit, filters]);

  useEffect(() => {
    fetchBidangList();
  }, []);

  // Dialog Components
  const DetailDialog = () => (
    <Dialog
      open={detailDialog.open}
      onClose={() => setDetailDialog({ open: false, loading: false, data: null, error: null })}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Detail Peserta Magang</Typography>
          <IconButton
            onClick={() => setDetailDialog({ open: false, loading: false, data: null, error: null })}
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ pb: 2 }}>
        {detailDialog.loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : detailDialog.error ? (
          <Alert severity="error">{detailDialog.error}</Alert>
        ) : detailDialog.data && (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Box sx={{ mb: 2 }}>
                <Chip
                  label={getStatusLabel(detailDialog.data.status)}
                  sx={{
                    backgroundColor: `${getStatusStyle(detailDialog.data.status).bg}`,
                    color: getStatusStyle(detailDialog.data.status).color,
                    border: `1px solid ${getStatusStyle(detailDialog.data.status).border}`
                  }}
                />
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary">Informasi Pribadi</Typography>
              <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Nama Lengkap</Typography>
                    <Typography variant="body1">{detailDialog.data.nama}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Email</Typography>
                    <Typography variant="body1">{detailDialog.data.email || '-'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">No. HP</Typography>
                    <Typography variant="body1">{detailDialog.data.no_hp || '-'}</Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary">Informasi Akademik</Typography>
              <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Institusi</Typography>
                    <Typography variant="body1">{detailDialog.data.nama_institusi}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      {detailDialog.data.jenis_peserta === 'mahasiswa' ? 'NIM' : 'NISN'}
                    </Typography>
                    <Typography variant="body1">
                      {detailDialog.data.detail_peserta?.nim || detailDialog.data.detail_peserta?.nisn || '-'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Jurusan</Typography>
                    <Typography variant="body1">
                      {detailDialog.data.detail_peserta?.jurusan || '-'}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary">Informasi Magang</Typography>
              <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2" color="text.secondary">Bidang</Typography>
                    <Typography variant="body1">{detailDialog.data.nama_bidang}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">Tanggal Mulai</Typography>
                    <Typography variant="body1">{formatDate(detailDialog.data.tanggal_masuk)}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2" color="text.secondary">Tanggal Selesai</Typography>
                    <Typography variant="body1">{formatDate(detailDialog.data.tanggal_keluar)}</Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={() => handleEditClick(detailDialog.data?.id_magang)}
          startIcon={<EditIcon />}
          variant="contained"
          disabled={!detailDialog.data || detailDialog.loading}
        >
          Edit Data
        </Button>
      </DialogActions>
    </Dialog>
  );

  const EditDialog = () => (
    <Dialog
      open={editDialog.open}
      onClose={() => setEditDialog({ open: false, loading: false, data: null, error: null })}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Edit Data Peserta Magang</Typography>
          <IconButton
            onClick={() => setEditDialog({ open: false, loading: false, data: null, error: null })}
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {editDialog.loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : editDialog.error ? (
          <Alert severity="error" sx={{ mb: 2 }}>{editDialog.error}</Alert>
        ) : editDialog.data && (
          <Formik
            initialValues={{
              nama: editDialog.data.nama || '',
              email: editDialog.data.email || '',
              no_hp: editDialog.data.no_hp || '',
              nama_institusi: editDialog.data.nama_institusi || '',
              bidang_id: editDialog.data.id_bidang || '',
              tanggal_masuk: editDialog.data.tanggal_masuk?.split('T')[0] || '',
              tanggal_keluar: editDialog.data.tanggal_keluar?.split('T')[0] || '',
              detail_peserta: {
                ...(editDialog.data.jenis_peserta === 'mahasiswa' 
                  ? {
                      nim: editDialog.data.detail_peserta?.nim || '',
                      fakultas: editDialog.data.detail_peserta?.fakultas || '',
                      jurusan: editDialog.data.detail_peserta?.jurusan || '',
                      semester: editDialog.data.detail_peserta?.semester || ''
                    }
                  : {
                      nisn: editDialog.data.detail_peserta?.nisn || '',
                      jurusan: editDialog.data.detail_peserta?.jurusan || '',
                      kelas: editDialog.data.detail_peserta?.kelas || ''
                    }
                )
              }
            }}
            onSubmit={handleEditSubmit}
            validationSchema={Yup.object({
              nama: Yup.string()
                .required('Nama wajib diisi')
                .min(3, 'Nama minimal 3 karakter'),
              email: Yup.string()
                .email('Format email tidak valid'),
              no_hp: Yup.string()
                .matches(/^[0-9]+$/, 'Nomor HP hanya boleh berisi angka')
                .min(10, 'Nomor HP minimal 10 digit')
                .max(15, 'Nomor HP maksimal 15 digit'),
              nama_institusi: Yup.string()
                .required('Nama institusi wajib diisi'),
              bidang_id: Yup.string()
                .required('Bidang wajib dipilih'),
              tanggal_masuk: Yup.date()
                .required('Tanggal masuk wajib diisi'),
              tanggal_keluar: Yup.date()
                .required('Tanggal keluar wajib diisi')
                .min(
                  Yup.ref('tanggal_masuk'),
                  'Tanggal keluar harus setelah tanggal masuk'
                ),
              detail_peserta: Yup.object().shape(
                editDialog.data.jenis_peserta === 'mahasiswa'
                  ? {
                      nim: Yup.string().required('NIM wajib diisi'),
                      jurusan: Yup.string().required('Jurusan wajib diisi'),
                      fakultas: Yup.string().required('Fakultas wajib diisi'),
                      semester: Yup.number()
                        .typeError('Semester harus berupa angka')
                        .min(1, 'Minimal semester 1')
                        .max(14, 'Maksimal semester 14')
                    }
                  : {
                      nisn: Yup.string().required('NISN wajib diisi'),
                      jurusan: Yup.string().required('Jurusan wajib diisi'),
                      kelas: Yup.string().required('Kelas wajib diisi')
                    }
              )
            })}
          >
            {({ isSubmitting }) => (
              <Form>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  {/* Informasi Pribadi */}
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                      Informasi Pribadi
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Field
                      name="nama"
                      component={FormTextField}
                      fullWidth
                      label="Nama Lengkap"
                      size="small"
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Field
                      name="email"
                      component={FormTextField}
                      fullWidth
                      label="Email"
                      type="email"
                      size="small"
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Field
                      name="no_hp"
                      component={FormTextField}
                      fullWidth
                      label="Nomor HP"
                      size="small"
                    />
                  </Grid>

                  {/* Informasi Institusi */}
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, mt: 1 }}>
                      Informasi Institusi
                    </Typography>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Field
                      name="nama_institusi"
                      component={FormTextField}
                      fullWidth
                      label="Nama Institusi"
                      size="small"
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Field
                      name="bidang_id"
                      component={({ field, form }) => (
                        <FormControl fullWidth size="small" error={form.touched.bidang_id && Boolean(form.errors.bidang_id)}>
                          <InputLabel>Bidang</InputLabel>
                          <Select {...field} label="Bidang">
                            {bidangList.map(bidang => (
                              <MenuItem key={bidang.id_bidang} value={bidang.id_bidang}>
                                {bidang.nama_bidang}
                              </MenuItem>
                            ))}
                          </Select>
                          {form.touched.bidang_id && form.errors.bidang_id && (
                            <FormHelperText>{form.errors.bidang_id}</FormHelperText>
                          )}
                        </FormControl>
                      )}
                    />
                  </Grid>

                  {/* Detail Peserta - Mahasiswa/Siswa */}
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, mt: 1 }}>
                      Detail Peserta
                    </Typography>
                  </Grid>

                  {editDialog.data.jenis_peserta === 'mahasiswa' ? (
                    // Form fields untuk mahasiswa
                    <>
                      <Grid item xs={12} md={6}>
                        <Field
                          name="detail_peserta.nim"
                          component={FormTextField}
                          fullWidth
                          label="NIM"
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Field
                          name="detail_peserta.fakultas"
                          component={FormTextField}
                          fullWidth
                          label="Fakultas"
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Field
                          name="detail_peserta.jurusan"
                          component={FormTextField}
                          fullWidth
                          label="Jurusan"
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Field
                          name="detail_peserta.semester"
                          component={FormTextField}
                          fullWidth
                          label="Semester"
                          type="number"
                          size="small"
                        />
                      </Grid>
                    </>
                  ) : (
                    // Form fields untuk siswa
                    <>
                      <Grid item xs={12} md={6}>
                        <Field
                          name="detail_peserta.nisn"
                          component={FormTextField}
                          fullWidth
                          label="NISN"
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Field
                          name="detail_peserta.jurusan"
                          component={FormTextField}
                          fullWidth
                          label="Jurusan"
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Field
                          name="detail_peserta.kelas"
                          component={FormTextField}
                          fullWidth
                          label="Kelas"
                          size="small"
                        />
                      </Grid>
                    </>
                  )}

                  {/* Tanggal Magang */}
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, mt: 1 }}>
                      Periode Magang
                    </Typography>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Field
                      name="tanggal_masuk"
                      component={FormTextField}
                      fullWidth
                      label="Tanggal Mulai"
                      type="date"
                      size="small"
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Field
                      name="tanggal_keluar"
                      component={FormTextField}
                      fullWidth
                      label="Tanggal Selesai"
                      type="date"
                      size="small"
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                </Grid>

                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                  <Button
                    onClick={() => setEditDialog({ open: false, loading: false, data: null, error: null })}
                    disabled={isSubmitting}
                  >
                    Batal
                  </Button>
                  <LoadingButton
                    type="submit"
                    variant="contained"
                    loading={isSubmitting}
                  >
                    Simpan Perubahan
                  </LoadingButton>
                </Box>
              </Form>
            )}
          </Formik>
        )}
      </DialogContent>
    </Dialog>
  );

  // Render utama
  return (
    <Box sx={{
      height: 'calc(100vh - 64px)',
      display: 'flex',
      flexDirection: 'column',
      padding: '12px',
      backgroundColor: '#f5f5f5',
      position: 'relative',
      overflow: 'hidden',
      minWidth: '1150px'
    }}>
      <Card elevation={2} sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <CardContent sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: '16px !important',
          '&:last-child': { paddingBottom: '16px' },
          overflow: 'hidden'
        }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
            Filter Data Magang
          </Typography>
          
          <Box sx={{ mb: 2, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 2fr' }, gap: 2 }}>
            <FormControl size="small" fullWidth>
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

            <FormControl size="small" fullWidth>
              <InputLabel>Bidang</InputLabel>
              <Select
                value={filters.bidang}
                label="Bidang"
                onChange={(e) => setFilters({...filters, bidang: e.target.value})}
                disabled={bidangLoading}
              >
                <MenuItem value="">Semua Bidang</MenuItem>
                {bidangList.map(bidang => (
                  <MenuItem key={bidang.id_bidang} value={bidang.id_bidang}>
                    {bidang.nama_bidang}
                  </MenuItem>
                ))}
              </Select>
              {bidangError && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                  {bidangError}
                </Typography>
              )}
            </FormControl>

            <Box sx={{ display: 'flex', gap: 1, width: '100%', minWidth: 0 }}>
              <TextField
                size="small"
                fullWidth
                placeholder="Cari nama/NIM/institusi..."
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ flex: 1, minWidth: 0 }}
              />
              <Button
                variant="contained"
                onClick={handleFilter}
                startIcon={<FilterIcon />}
                sx={{ whiteSpace: 'nowrap' }}
              >
                Filter
              </Button>
            </Box>
          </Box>

          <Box sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
            <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: '100%' }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>NAMA</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>NIM/NISN</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>INSTITUSI</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }} align="center">BIDANG</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }} align="center">TANGGAL MASUK</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }} align="center">TANGGAL KELUAR</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }} align="center">STATUS</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }} align="center">AKSI</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        <Box sx={{ py: 4 }}>
                          <Typography>Memuat data...</Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : error ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ color: 'error.main', py: 4 }}>
                        {error}
                      </TableCell>
                    </TableRow>
                  ) : interns.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
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
                        <TableCell align="center">{formatDate(intern.tanggal_masuk)}</TableCell>
                        <TableCell align="center">{formatDate(intern.tanggal_keluar)}</TableCell>
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
                          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                            <IconButton
                              size="small"
                              onClick={() => handleDetailClick(intern.id_magang)}
                              sx={{ color: 'info.main' }}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleEditClick(intern.id_magang)}
                              sx={{ color: 'warning.main' }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteClick(intern.id_magang, intern.nama)}
                              sx={{ color: 'error.main' }}
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
            </TableContainer>
          </Box>
          
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
        </CardContent>
      </Card>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add"
        onClick={() => window.location.href = '/intern/add'}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
        }}
      >
        <AddIcon />
      </Fab>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, internId: null, loading: false, nama: '' })}
      >
        <DialogTitle>Konfirmasi Hapus</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Apakah Anda yakin ingin menghapus data magang "{deleteDialog.nama}"? 
            Tindakan ini tidak dapat dibatalkan.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteDialog({ open: false, internId: null, loading: false, nama: '' })}
            disabled={deleteDialog.loading}
          >
            Batal
          </Button>
          <LoadingButton
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            loading={deleteDialog.loading}
          >
            Hapus
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* Detail Dialog */}
      <DetailDialog />

      {/* Edit Dialog */}
      <EditDialog />

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