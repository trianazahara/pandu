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


const FormTextField = ({ field, form: { touched, errors }, ...props }) => (
  <TextField
    {...field}
    {...props}
    error={touched[field.name] && Boolean(errors[field.name])}
    helperText={touched[field.name] && errors[field.name]}
  />
);


const InternManagement = () => {
  // States
  const [interns, setInterns] = useState([]);
  const [selectedInterns, setSelectedInterns] = useState([]);
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

  // State for detail and edit dialogs
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

  // New state for add dialog
  const [addDialog, setAddDialog] = useState({
    open: false,
    loading: false,
    error: null
  });

  // Helper functions
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
      'not_yet': 'Belum Mulai',
      'aktif': 'Aktif',
      'almost': 'Hampir Selesai',
      'selesai': 'Selesai'
    };
    return labels[status?.toLowerCase()] || status;
  };
  
  const STATUS_MAPPING = {
    'not_yet': 'not_yet',      // untuk 'Belum Mulai'
    'aktif': 'aktif',          // untuk 'Aktif'
    'almost': 'almost',        // untuk 'Hampir Selesai'
    'selesai': 'selesai'       // untuk 'Selesai'
  };

  const getStatusValue = (status) => {
    if (!status) return '';
    const normalizedStatus = status.toLowerCase();
    return STATUS_MAPPING[normalizedStatus] || normalizedStatus;
  };


  const getStatusStyle = (status, mode = 'class') => {
    const normalizedStatus = getStatusValue(status);
   

    const styles = {
      'active': {
        bg: '#dcfce7',
        color: '#15803d',
        border: '#15803d'
      },
      'not_yet': {
        bg: '#f3f4f6',
        color: '#4b5563',
        border: '#4b5563'
      },
      'completed': {
        bg: '#dbeafe',
        color: '#1e40af',
        border: '#1e40af'
      },
      'almost': {
        bg: '#fef9c3',
        color: '#854d0e',
        border: '#854d0e'
      },
      'belum_mulai': {
        bg: '#f1f5f9', // Light slate background
        color: '#475569', // Slate text
        border: '#475569'
      },
      'hampir_selesai': {
        bg: '#fef9c3', // Light yellow background
        color: '#854d0e', // Darker yellow text
        border: '#854d0e'
      }
    };
 
    const defaultStyle = styles['not_yet'];
    if (mode === 'class') {
      return `inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
        normalizedStatus === 'active' || normalizedStatus === 'aktif' 
          ? 'bg-green-100 text-green-800 border border-green-800' :
        normalizedStatus === 'not_yet' || normalizedStatus === 'belum_mulai'
          ? 'bg-slate-100 text-slate-600 border border-slate-600' :
        normalizedStatus === 'completed' || normalizedStatus === 'selesai'
          ? 'bg-blue-100 text-blue-800 border border-blue-800' :
        normalizedStatus === 'almost' || normalizedStatus === 'hampir_selesai'
          ? 'bg-yellow-100 text-yellow-800 border border-yellow-800' :
        'bg-slate-100 text-slate-600 border border-slate-600'
      }`;
    }
  
    return styles[normalizedStatus] || defaultStyle;
  };

  // Generate PDF function
  const generateReceipt = async () => {
    try {
      const response = await fetch('/api/intern/generate-receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ internIds: selectedInterns })
      });

      if (!response.ok) {
        throw new Error('Failed to generate receipt');
      }

      // Get the PDF blob from the response
      const blob = await response.blob();
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary anchor element and trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = 'tanda-terima-magang.pdf';
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      // Reset selection
      setSelectedInterns([]);
      
      setSnackbar({
        open: true,
        message: 'Tanda terima berhasil di-generate',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error generating receipt:', error);
      setSnackbar({
        open: true,
        message: 'Gagal men-generate tanda terima',
        severity: 'error'
      });
    }
  };
 


  // Fetch functions
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
      const queryParams = new URLSearchParams();

      // Append filter values if they exist
      if (filters.status) {
        queryParams.append('status', filters.status);
      }
      if (filters.bidang) queryParams.append('bidang', filters.bidang);
      if (filters.search) queryParams.append('search', filters.search);
 
      // Pagination parameters
      queryParams.append('page', pagination.page + 1);
      queryParams.append('limit', pagination.limit);
 
      const response = await fetch(`/api/intern?${queryParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
 
      if (!response.ok) {
        throw new Error('Failed to load data');
      }
 
      const data = await response.json();
      setInterns(data.data);
      setPagination((prev) => ({
        ...prev,
        total: data.pagination.total,
      }));
    } catch (error) {
      console.error('Error fetching interns:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Event handlers
  const handleAddSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      setAddDialog(prev => ({ ...prev, loading: true }));
      const token = localStorage.getItem('token');


      const response = await fetch('/api/intern/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(values)
      });


      const data = await response.json();


      if (response.ok) {
        setSnackbar({
          open: true,
          message: 'Data peserta magang berhasil ditambahkan',
          severity: 'success'
        });
        setAddDialog({ open: false, loading: false, error: null });
        resetForm();
        fetchInterns();
      } else {
        throw new Error(data.message || 'Terjadi kesalahan');
      }
    } catch (error) {
      setAddDialog(prev => ({
        ...prev,
        error: error.message
      }));
    } finally {
      setSubmitting(false);
      setAddDialog(prev => ({ ...prev, loading: false }));
    }
  };


  const handleFilter = (key, value) => {
    setFilters(prevFilters => {
      if (key === 'status') {
        // For status filter, use the direct value without mapping
        return {
          ...prevFilters,
          [key]: value
        };
      }
      return {
        ...prevFilters,
        [key]: value
      };
    });
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


  // useEffect hooks
  useEffect(() => {
    fetchInterns();
  }, [pagination.page, pagination.limit, filters]);


  useEffect(() => {
    fetchBidangList();
  }, []);


  // Add Dialog Component
  const AddDialog = () => (
    <Dialog
      open={addDialog.open}
      onClose={() => setAddDialog({ open: false, loading: false, error: null })}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Tambah Peserta Magang</Typography>
          <IconButton
            onClick={() => setAddDialog({ open: false, loading: false, error: null })}
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>


      <DialogContent>
        {addDialog.error && (
          <Alert severity="error" sx={{ mb: 2 }}>{addDialog.error}</Alert>
        )}


        <Formik
          initialValues={{
            nama: '',
            jenis_peserta: 'mahasiswa',
            nama_institusi: '',
            jenis_institusi: '',
            email: '',
            no_hp: '',
            bidang_id: '',
            tanggal_masuk: '',
            tanggal_keluar: '',
            nama_pembimbing: '',  // tambahan
            telp_pembimbing: '',  // tambahan
            detail_peserta: {
              nim: '',
              nisn: '',
              fakultas: '',
              jurusan: '',
              semester: '',
              kelas: ''
            }
          }}
          validationSchema={Yup.object({
            nama: Yup.string()
              .required('Nama wajib diisi')
              .min(3, 'Nama minimal 3 karakter'),
            jenis_peserta: Yup.string()
              .required('Jenis peserta wajib dipilih'),
            nama_institusi: Yup.string()
              .required('Nama institusi wajib diisi'),
            jenis_institusi: Yup.string()
              .required('Jenis institusi wajib dipilih'),
            email: Yup.string()
              .email('Format email tidak valid'),
            no_hp: Yup.string()
              .matches(/^[0-9]+$/, 'Nomor HP hanya boleh berisi angka')
              .min(10, 'Nomor HP minimal 10 digit')
              .max(15, 'Nomor HP maksimal 15 digit'),
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
            nama_pembimbing: Yup.string()
              .required('Nama pembimbing wajib diisi')
              .min(3, 'Nama pembimbing minimal 3 karakter'),
            telp_pembimbing: Yup.string()
              .required('No. Telp pembimbing wajib diisi')
              .matches(/^[0-9]+$/, 'Nomor telepon hanya boleh berisi angka')
              .min(10, 'Nomor telepon minimal 10 digit')
              .max(15, 'Nomor telepon maksimal 15 digit'),
            detail_peserta: Yup.object().when('jenis_peserta', {
              is: 'mahasiswa',
              then: () => Yup.object({
                nim: Yup.string().required('NIM wajib diisi'),
                fakultas: Yup.string().required('Fakultas wajib diisi'),
                jurusan: Yup.string().required('Jurusan wajib diisi'),
                semester: Yup.number()
                  .typeError('Semester harus berupa angka')
                  .min(1, 'Minimal semester 1')
                  .max(14, 'Maksimal semester 14')
              }),
              otherwise: () => Yup.object({
                nisn: Yup.string().required('NISN wajib diisi'),
                jurusan: Yup.string().required('Jurusan wajib diisi'),
                kelas: Yup.string().required('Kelas wajib diisi')
              })
            })
          })}
          onSubmit={handleAddSubmit}
        >
          {({ values, isSubmitting }) => (
            <Form>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                {/* Basic Information */}
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
                    name="jenis_peserta"
                    component={({ field, form }) => (
                      <FormControl fullWidth size="small">
                        <InputLabel>Jenis Peserta</InputLabel>
                        <Select {...field} label="Jenis Peserta">
                          <MenuItem value="mahasiswa">Mahasiswa</MenuItem>
                          <MenuItem value="siswa">Siswa</MenuItem>
                        </Select>
                      </FormControl>
                    )}
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


                {/* Institution Information */}
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
                    name="jenis_institusi"
                    component={({ field, form }) => (
                      <FormControl fullWidth size="small">
                        <InputLabel>Jenis Institusi</InputLabel>
                        <Select {...field} label="Jenis Institusi">
                          <MenuItem value="universitas">Universitas</MenuItem>
                          <MenuItem value="sekolah">Sekolah</MenuItem>
                        </Select>
                      </FormControl>
                    )}
                  />
                </Grid>


                <Grid item xs={12} md={6}>
                  <Field
                    name="bidang_id"
                    component={({ field, form }) => (
                      <FormControl fullWidth size="small" error={form.touched.bidang_id && Boolean(form.errors.bidang_id)}>
                        <InputLabel>Ruang Penempatan</InputLabel>
                        <Select {...field} label="Bidang">
                          {bidangList.map(bidang => (
                            <MenuItem key={bidang.id_bidang} value={bidang.id_bidang}>
                              {bidang.nama_bidang}
                              {bidang.available_slots > 0 && ` (${bidang.available_slots} slot tersedia)`}
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


                {/* Internship Period */}
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


                {/* Detail Peserta */}
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, mt: 1 }}>
                    Detail Peserta
                  </Typography>
                </Grid>


                {/* Informasi Pembimbing - Tambahkan setelah Informasi Institusi */}
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, mt: 1 }}>
                    Informasi Pembimbing
                  </Typography>
                </Grid>


                <Grid item xs={12} md={6}>
                  <Field
                    name="nama_pembimbing"
                    component={FormTextField}
                    fullWidth
                    label="Nama Pembimbing"
                    size="small"
                  />
                </Grid>


                <Grid item xs={12} md={6}>
                  <Field
                    name="telp_pembimbing"
                    component={FormTextField}
                    fullWidth
                    label="No. Telp Pembimbing"
                    size="small"
                  />
                </Grid>


                {values.jenis_peserta === 'mahasiswa' ? (
                  // Fields for university students
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

                    {/* Informasi Pembimbing - Tambahkan setelah Informasi Institusi */}
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, mt: 1 }}>
                    Informasi Pembimbing
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Field
                    name="nama_pembimbing"
                    component={FormTextField}
                    fullWidth
                    label="Nama Pembimbing"
                    size="small"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Field
                    name="telp_pembimbing"
                    component={FormTextField}
                    fullWidth
                    label="No. Telp Pembimbing"
                    size="small"
                  />
                </Grid>
                  </>
                ) : (
                  // Fields for high school students
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
              </Grid>


              <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <Button
                  onClick={() => setAddDialog({ open: false, loading: false, error: null })}
                  disabled={isSubmitting}
                >
                  Batal
                </Button>
                <LoadingButton
                  type="submit"
                  variant="contained"
                  loading={isSubmitting}
                >
                  Simpan
                </LoadingButton>
              </Box>
            </Form>
          )}
        </Formik>
      </DialogContent>
    </Dialog>
  );


  // Detail Dialog Component
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


            <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, mt: 1 }}>Informasi Pembimbing</Typography>
            <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Nama Pembimbing</Typography>
                  <Typography variant="body1">{detailDialog.data.nama_pembimbing || '-'}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">No. Telp Pembimbing</Typography>
                  <Typography variant="body1">{detailDialog.data.telp_pembimbing || '-'}</Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>


            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary">Informasi Magang</Typography>
              <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2" color="text.secondary">Ruang Penempatan</Typography>
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


  // Edit Dialog Component
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
              nama_pembimbing: editDialog.data.nama_pembimbing || '',  // tambahan
              telp_pembimbing: editDialog.data.telp_pembimbing || '',  // tambahan
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
                .required('Ruang Penempatan wajib dipilih'),
              tanggal_masuk: Yup.date()
                .required('Tanggal masuk wajib diisi'),
              tanggal_keluar: Yup.date()
                .required('Tanggal keluar wajib diisi')
                .min(
                  Yup.ref('tanggal_masuk'),
                  'Tanggal keluar harus setelah tanggal masuk'
                ),
                nama_pembimbing: Yup.string()
                .required('Nama pembimbing wajib diisi')
                .min(3, 'Nama pembimbing minimal 3 karakter'),
              telp_pembimbing: Yup.string()
                .required('No. Telp pembimbing wajib diisi')
                .matches(/^[0-9]+$/, 'Nomor telepon hanya boleh berisi angka')
                .min(10, 'Nomor telepon minimal 10 digit')
                .max(15, 'Nomor telepon maksimal 15 digit'),
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
                          <InputLabel>Ruang Penempatan</InputLabel>
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
                <Grid container spacing={2}>
                <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, mt: 1 }}>
                      Informasi Pembimbing
                    </Typography>
                  </Grid> 
                <Grid container item xs={12} spacing={2}>
                  <Grid item xs={6}>
                    <Field
                      name="nama_pembimbing"
                      component={FormTextField}
                      fullWidth
                      label="Nama Pembimbing"
                      size="small"
                    />
                  </Grid>

                  <Grid item xs={6}>
                    <Field
                      name="telp_pembimbing"
                      component={FormTextField}
                      fullWidth
                      label="No. Telp Pembimbing"
                      size="small"
                    />
                  </Grid>
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

 

  // Handle checkbox selection
  const handleSelectIntern = (internId) => {
    setSelectedInterns(prev => {
      if (prev.includes(internId)) {
        return prev.filter(id => id !== internId);
      } else {
        return [...prev, internId];
      }
    });
  };

  // Handle select all checkboxes
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedInterns(interns.map(intern => intern.id_magang));
    } else {
      setSelectedInterns([]);
    }
  };

  
  // Main render
  return (
    <Box sx={{ width: '100%', minWidth: 0 }}>
      {/* Header */}
      <Box sx={{
        width: '100%',
        background: 'linear-gradient(to right, #BCFB69, #26BBAC)',
        borderRadius: '12px',
        mb: 4,
        p: 3,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
          Manajemen Data Anak Magang
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setAddDialog({ open: true, loading: false, error: null })}
          sx={{
            bgcolor: 'white',
            color: '#26BBAC',
            '&:hover': { bgcolor: '#f5f5f5' },
            px: 3,
            py: 1.5,
            borderRadius: '8px',
          }}>
          TAMBAH ANAK MAGANG
        </Button>
      </Box>


      {/* Search and Filter Section */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search nama/email"
            value={filters.search}
            onChange={(e) => setFilters({...filters, search: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="relative">
          <select
            value={filters.bidang}
            onChange={(e) => setFilters({...filters, bidang: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
          >
            <option value="">Ruang Penempatan</option>
            {bidangList.map(bidang => (
              <option key={bidang.id_bidang} value={bidang.id_bidang}>
                {bidang.nama_bidang}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        <div className="relative">
        <select
          value={filters.status}
          onChange={(e) => handleFilter('status', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
        >
          <option value="">Status</option>
          <option value="not_yet">Belum Mulai</option>
          <option value="aktif">Aktif</option>
          <option value="almost">Hampir Selesai</option>
          <option value="selesai">Selesai</option>
        </select>
          <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>



      {/* Table Section with Percentage Widths */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto" style={{ minWidth: '800px' }}>
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="w-[5%] px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={selectedInterns.length === interns.length && interns.length > 0}
                  />
                </th>
                <th scope="col" className="w-[15%] px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nama
                </th>
                <th scope="col" className="w-[20%] px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" className="w-[15%] px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ruang Penempatan
                </th>
                <th scope="col" className="w-[12%] px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tanggal Masuk
                </th>
                <th scope="col" className="w-[12%] px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tanggal Keluar
                </th>
                <th scope="col" className="w-[11%] px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="w-[10%] px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-sm text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : interns.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-sm text-gray-500">
                    Tidak ada data
                  </td>
                </tr>
              ) : (
                interns.map((intern) => (
                  <tr key={intern.id_magang} className="hover:bg-gray-50">
                    <td className="px-3 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedInterns.includes(intern.id_magang)}
                        onChange={() => handleSelectIntern(intern.id_magang)}
                      />
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {intern.nama}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 truncate">
                        {intern.email}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 truncate">
                        {intern.nama_bidang}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(intern.tanggal_masuk)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(intern.tanggal_keluar)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <span className={getStatusStyle(intern.status)}>
                        {getStatusLabel(intern.status)}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <div className="flex justify-center space-x-1">
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
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>


      {/* Pagination */}
      <div className="flex items-center justify-between bg-white px-4 py-3 rounded-b-lg">
        <div className="flex items-center gap-2">
          <select
            value={pagination.limit}
            onChange={handleLimitChange}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            {[5, 10, 25, 50].map(size => (
              <option key={size} value={size}>{size} items</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handlePageChange(null, Math.max(0, pagination.page - 1))}
            disabled={pagination.page === 0}
            className={`px-4 py-2 text-sm font-medium rounded-md
              ${pagination.page === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'}`}
          >
            Previous
          </button>
          <span className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md">
            {pagination.page + 1}
          </span>
          <button
            onClick={() => handlePageChange(null, pagination.page + 1)}
            disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit) - 1}
            className={`px-4 py-2 text-sm font-medium rounded-md
              ${pagination.page >= Math.ceil(pagination.total / pagination.limit) - 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'}`}
          >
            Next
          </button>
        </div>
      </div>

      <Box sx={{ mt: 2, mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <LoadingButton
          variant="contained"
          color='#26BBAC'
          disabled={selectedInterns.length === 0}
          onClick={generateReceipt}
        >
          Generate Tanda Terima
        </LoadingButton>
      </Box>

      {/* Dialogs */}
      <AddDialog />
      <DetailDialog />
      <EditDialog />


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


      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};


export default InternManagement;



