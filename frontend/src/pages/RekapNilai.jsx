//rekap nilai
import React, { useState, useEffect } from 'react';
import { LoadingButton } from '@mui/lab';
import { Close as CloseIcon } from '@mui/icons-material';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Snackbar,
  Alert,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  FormControlLabel,
  Radio,
  RadioGroup
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import axios from 'axios';
import { Edit as EditIcon, FileDownload as FileDownloadIcon, Visibility as VisibilityIcon } from '@mui/icons-material';
import { BookIcon } from 'lucide-react';


const RekapNilai = () => {
  // State declarations
  const [interns, setInterns] = useState([]);
  const [data, setData] = useState([]);
  const [bidangList, setBidangList] = useState([]);
  const [filters, setFilters] = useState({
    bidang: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    page: 0,
    limit: 10,
    total: 0
  });
  const [editDialog, setEditDialog] = useState({
    open: false,
    loading: false,
    data: null,
    error: null
  });
  const [scoreForm, setScoreForm] = useState({
    nilai_teamwork: '',
    nilai_komunikasi: '',
    nilai_pengambilan_keputusan: '',
    nilai_kualitas_kerja: '',
    nilai_teknologi: '',
    nilai_disiplin: '',
    nilai_tanggungjawab: '',
    nilai_kerjasama: '',
    nilai_inisiatif: '',
    nilai_kejujuran: '',
    nilai_kebersihan: '',
    jumlah_hadir: ''
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [exportDialog, setExportDialog] = useState({
    open: false,
    loading: false,
    exportType: 'all',
    dateRange: {
      startDate: null,
      endDate: null
    }
  });
  const [detailDialog, setDetailDialog] = useState({
      open: false,
      loading: false,
      data: null,
      error: null
    });


  // Helper functions dan handlers lainnya tetap sama
  const calculateWorkingDays = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    let workingDays = 0;
    let current = new Date(start);
    while (current <= end) {
      if (current.getDay() !== 0 && current.getDay() !== 6) {
        workingDays++;
      }
      current.setDate(current.getDate() + 1);
    }
    return workingDays;
  };


  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };




  // Fetch functions
  const fetchBidangList = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/bidang', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBidangList(response.data.data || []);
    } catch (error) {
      console.error('Error fetching bidang:', error);
      showSnackbar('Gagal mengambil data bidang', 'error');
    }
  };


  const fetchData = async () => {
    try {
      const response = await axios.get('/api/intern/rekap-nilai', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        params: {
          page: pagination.page + 1,
          limit: pagination.limit,
          bidang: filters.bidang,
          search: filters.search
        }
      });
      setData(response.data.data);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination.total
      }));
    } catch (error) {
      showSnackbar('Error mengambil data', 'error');
    }
  };


  // Effects
  useEffect(() => {
    fetchBidangList();
  }, []);


  useEffect(() => {
    fetchData();
  }, [pagination.page, pagination.limit, filters]);


  // Handlers
  const handleFilter = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setPagination(prev => ({
      ...prev,
      page: 0
    }));
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
  
  const handleGenerateClick = async (id) => {
    try {
      await axios.post(`http://localhost:5000/api/document/generate-sertifikat/${id}`, {}, {
        headers: { 
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      const downloadResponse = await axios.get(
        `http://localhost:5000/api/document/download-sertifikat/${id}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          responseType: 'blob'
        }
      );

      const url = window.URL.createObjectURL(new Blob([downloadResponse.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `sertifikat.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showSnackbar('Sertifikat berhasil di-generate dan diunduh');
    } catch (error) {
      console.error('Error:', error);
      showSnackbar(error.response?.data?.message || 'Gagal generate sertifikat', 'error');
    }
};


  const handleEditScore = (score) => {
  console.log("Score data:", score); // Debug data yang diterima
  console.log("Working days:", calculateWorkingDays(score.tanggal_masuk, score.tanggal_keluar)); // Debug hasil perhitungan


    setEditDialog({
      open: true,
      loading: false,
      data: score,
      error: null
    });
    setScoreForm({
      nilai_teamwork: score.nilai_teamwork || '',
      nilai_komunikasi: score.nilai_komunikasi || '',
      nilai_pengambilan_keputusan: score.nilai_pengambilan_keputusan || '',
      nilai_kualitas_kerja: score.nilai_kualitas_kerja || '',
      nilai_teknologi: score.nilai_teknologi || '',
      nilai_disiplin: score.nilai_disiplin || '',
      nilai_tanggungjawab: score.nilai_tanggungjawab || '',
      nilai_kerjasama: score.nilai_kerjasama || '',
      nilai_inisiatif: score.nilai_inisiatif || '',
      nilai_kejujuran: score.nilai_kejujuran || '',
      nilai_kebersihan: score.nilai_kebersihan || '',
      jumlah_hadir: score.jumlah_hadir || ''  // Ambil nilai yang sudah ada
    });
  };


  const handleSubmitScore = async (e) => {
    e.preventDefault();
    setEditDialog(prev => ({ ...prev, loading: true }));
    try {
      // Pastikan semua nilai dikonversi ke number
      const scoreData = {
        ...scoreForm,
        nilai_teamwork: Number(scoreForm.nilai_teamwork),
        nilai_komunikasi: Number(scoreForm.nilai_komunikasi),
        nilai_pengambilan_keputusan: Number(scoreForm.nilai_pengambilan_keputusan),
        nilai_kualitas_kerja: Number(scoreForm.nilai_kualitas_kerja),
        nilai_teknologi: Number(scoreForm.nilai_teknologi),
        nilai_disiplin: Number(scoreForm.nilai_disiplin),
        nilai_tanggungjawab: Number(scoreForm.nilai_tanggungjawab),
        nilai_kerjasama: Number(scoreForm.nilai_kerjasama),
        nilai_inisiatif: Number(scoreForm.nilai_inisiatif),
        nilai_kejujuran: Number(scoreForm.nilai_kejujuran),
        nilai_kebersihan: Number(scoreForm.nilai_kebersihan),
        jumlah_hadir: Number(scoreForm.jumlah_hadir)  // Pastikan ini terkirim
      };
 
      const response = await axios.put(
        `/api/intern/update-nilai/${editDialog.data.id_penilaian}`,
        scoreData,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        }
    );


      if (response.data.status === 'success') {
            showSnackbar('Nilai berhasil diperbarui', 'success');
            setEditDialog(prev => ({ ...prev, open: false, loading: false }));
            fetchData();
        } else {
            throw new Error(response.data.message || 'Gagal memperbarui nilai');
        }
    } catch (error) {
        console.error('Error updating score:', error);
        showSnackbar(
            error.response?.data?.message || 'Gagal memperbarui nilai. Silakan coba lagi.',
            'error'
        );
        setEditDialog(prev => ({
            ...prev,
            loading: false,
            error: error.response?.data?.message || 'Gagal memperbarui nilai'
        }));
    }
};


const handleExport = async () => {
  setExportDialog(prev => ({ ...prev, loading: true }));
  try {
    const params = {
      bidang: filters.bidang
    };
   
    // Jika tipe ekspor adalah filtered, hanya mengirim parameter tanggal untuk filter tanggal_keluar
    if (exportDialog.exportType === 'filtered' && exportDialog.dateRange.startDate && exportDialog.dateRange.endDate) {
      // Format tanggal ke YYYY-MM-DD
      const formatDate = (date) => {
        const d = new Date(date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      };
     
      // Hanya mengirim range untuk tanggal_keluar
      params.end_date_start = formatDate(exportDialog.dateRange.startDate);
      params.end_date_end = formatDate(exportDialog.dateRange.endDate);
    }


    console.log('Export params:', params); // Debugging


    const response = await axios.get('/api/intern/export', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      responseType: 'blob',
      params
    });


    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Data_Anak_Magang.xlsx');
    document.body.appendChild(link);
    link.click();
    link.remove();
    showSnackbar('Data berhasil diexport');
    setExportDialog(prev => ({ ...prev, open: false, loading: false }));
  } catch (error) {
    showSnackbar('Error mengexport data', 'error');
    setExportDialog(prev => ({ ...prev, loading: false }));
  }
};


// Add export dialog JSX after the existing Dialog component
const ExportDialog = () => (
  <Dialog
    open={exportDialog.open}
    onClose={() => setExportDialog(prev => ({ ...prev, open: false }))}
    maxWidth="sm"
    fullWidth
  >
    <DialogTitle sx={{ pb: 1 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Typography variant="h6">Export Data</Typography>
        <IconButton
          onClick={() => setExportDialog(prev => ({ ...prev, open: false }))}
          size="small"
        >
          <CloseIcon />
        </IconButton>
      </Box>
    </DialogTitle>
    <DialogContent>
      <Box sx={{ mt: 2 }}>
        <RadioGroup
          value={exportDialog.exportType}
          onChange={(e) => setExportDialog(prev => ({
            ...prev,
            exportType: e.target.value
          }))}
        >
          <FormControlLabel
            value="all"
            control={<Radio />}
            label="Export Semua Data"
          />
          <FormControlLabel
            value="filtered"
            control={<Radio />}
            label="Export Berdasarkan Filter Tanggal"
          />
        </RadioGroup>


        {exportDialog.exportType === 'filtered' && (
          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Tanggal Mulai"
                value={exportDialog.dateRange.startDate}
                onChange={(date) => setExportDialog(prev => ({
                  ...prev,
                  dateRange: { ...prev.dateRange, startDate: date }
                }))}
                slotProps={{ textField: { fullWidth: true } }}
              />
              <DatePicker
                label="Tanggal Akhir"
                value={exportDialog.dateRange.endDate}
                onChange={(date) => setExportDialog(prev => ({
                  ...prev,
                  dateRange: { ...prev.dateRange, endDate: date }
                }))}
                slotProps={{ textField: { fullWidth: true } }}
                minDate={exportDialog.dateRange.startDate}
              />
            </LocalizationProvider>
          </Box>
        )}
      </Box>
    </DialogContent>
    <DialogActions>
      <Button
        onClick={() => setExportDialog(prev => ({ ...prev, open: false }))}
        disabled={exportDialog.loading}
      >
        Batal
      </Button>
      <LoadingButton
        onClick={handleExport}
        loading={exportDialog.loading}
        variant="contained"
        disabled={
          exportDialog.exportType === 'filtered' &&
          (!exportDialog.dateRange.startDate || !exportDialog.dateRange.endDate)
        }
      >
        Export
      </LoadingButton>
    </DialogActions>
  </Dialog>
);


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
              <span className={getStatusStyle(detailDialog.data.status)}>
                {getStatusLabel(detailDialog.data.status)}
              </span>
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
  sx={{ 
    color: '#2E7D32',
    borderColor: '#2E7D32',
    '&:hover': {
      borderColor: '#1B5E20',
      bgcolor: '#E8F5E9'
    }
  }}
  variant="outlined"  // Ganti ke outlined
  disabled={!detailDialog.data || detailDialog.loading}
>
  Edit Data
</Button>
    </DialogActions>
  </Dialog>
);

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
          Rekap Nilai Anak Magang
        </Typography>
        <Button
          variant="contained"
          startIcon={<FileDownloadIcon />}
          onClick={() => setExportDialog(prev => ({ ...prev, open: true }))}
          sx={{
            bgcolor: 'white',
            color: '#26BBAC',
            '&:hover': { bgcolor: '#f5f5f5' },
          }}
        >
          Export Excel
        </Button>
      </Box>


      {/* Filter Section */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Search nama/institusi"
            value={filters.search}
            onChange={(e) => handleFilter('search', e.target.value)}
            size="small"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth size="small">
            <InputLabel>Bidang</InputLabel>
            <Select
              value={filters.bidang}
              label="Bidang"
              onChange={(e) => handleFilter('bidang', e.target.value)}
            >
              <MenuItem value="">Semua Bidang</MenuItem>
                              {bidangList.map((bidang) => (
                                  <MenuItem key={bidang.id_bidang} value={bidang.id_bidang}>
                                      {bidang.nama_bidang}
                                  </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>




      {/* Table */}
      {/* Table Section */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="w-[20%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Nama
            </th>
            <th className="w-[20%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Institusi
            </th>
            <th className="w-[15%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Bidang
            </th>
            <th className="w-[15%] px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total Nilai
            </th>
            <th className="w-[10%] px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Absensi
            </th>
            <th className="w-[10%] px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Rata-rata
            </th>
            <th className="w-[10%] px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
        {data.map((score) => {
          const totalNilai = (
            Number(score.nilai_teamwork || 0) +
            Number(score.nilai_komunikasi || 0) +
            Number(score.nilai_pengambilan_keputusan || 0) +
            Number(score.nilai_kualitas_kerja || 0) +
            Number(score.nilai_teknologi || 0) +
            Number(score.nilai_disiplin || 0) +
            Number(score.nilai_tanggungjawab || 0) +
            Number(score.nilai_kerjasama || 0) +
            Number(score.nilai_inisiatif || 0) +
            Number(score.nilai_kejujuran || 0) +
            Number(score.nilai_kebersihan || 0)
          );
       
          const workingDays = calculateWorkingDays(score.tanggal_masuk, score.tanggal_keluar);
 
          // Hitung persentase kehadiran
          const attendanceScore = (score.jumlah_hadir || 0) / workingDays * 100;
          const average = ((totalNilai / 11) + attendanceScore) / 2;
            return (
              <tr key={score.id_penilaian} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {score.nama}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {score.nama_institusi}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {score.nama_bidang}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                  {totalNilai}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                {score.jumlah_hadir || 0}/{workingDays}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-center">
                {average.toFixed(2)}
              </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">

                  <IconButton

                  <div className="flex justify-center space-x-1">
                                          <IconButton
                                            size="small"
                                            onClick={() => handleDetailClick(intern.id_magang)}
                                            sx={{ color: 'info.main' }}
                                          >
                                            <VisibilityIcon fontSize="small" />
                                          </IconButton>
                  <IconButton 

                    onClick={() => handleEditScore(score)}
                    sx={{ color: 'info.main' }}
                    size="small"
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>

                  <IconButton 
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGenerateClick(score.id_magang);
                    }}

                    sx={{ color: 'info.main' }}
                  >
                    <FileDownloadIcon fontSize="small" />
                  </IconButton>

                </div>

                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
 


      {/* Pagination */}
      {/* Updated Pagination Section */}
      <div className="flex items-center justify-between bg-white px-4 py-3 rounded-b-lg">
        <div className="flex items-center gap-2">
          <select
            value={pagination.limit}
            onChange={(e) => {
              setPagination(prev => ({
                ...prev,
                limit: Number(e.target.value),
                page: 0
              }));
            }}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            {[5, 10, 25, 50].map(size => (
              <option key={size} value={size}>{size} items</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPagination(prev => ({
              ...prev,
              page: Math.max(0, prev.page - 1)
            }))}
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
            onClick={() => setPagination(prev => ({
              ...prev,
              page: prev.page + 1
            }))}
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


      {/* Edit Score Dialog */}
      <Dialog
      open={editDialog.open}
      onClose={() => setEditDialog({ open: false, loading: false, data: null, error: null })}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Edit Nilai - {editDialog.data?.nama}</Typography>
          <IconButton
            onClick={() => setEditDialog({ open: false, loading: false, data: null, error: null })}
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <form onSubmit={handleSubmitScore}>
        <DialogContent>
          {editDialog.error && (
            <Alert severity="error" sx={{ mb: 2 }}>{editDialog.error}</Alert>
          )}


          <Grid container spacing={2}>
            {/* Attendance Section */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                Informasi Kehadiran
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1, mb: 2 }}>
                <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={6}>
  <Typography variant="body2" color="text.secondary">
    Total Hari Kerja
  </Typography>
  <Typography variant="body1" fontWeight="medium">
  {calculateWorkingDays(editDialog.data?.tanggal_masuk, editDialog.data?.tanggal_keluar)} Hari
</Typography>
</Grid>
  <Grid item xs={12} md={6}>
    <TextField
      fullWidth
      label="Jumlah Kehadiran"
      type="number"
      value={scoreForm.jumlah_hadir || ''}
      onChange={(e) => {
        const val = e.target.value;
        const workingDays = calculateWorkingDays(
          editDialog.data?.tanggal_masuk,
          editDialog.data?.tanggal_keluar
        );
       
        if (val === '' || (Number(val) >= 0 && Number(val) <= workingDays)) {
          setScoreForm(prev => ({
            ...prev,
            jumlah_hadir: val
          }));
        }
      }}
      inputProps={{
        min: 0,
        max: calculateWorkingDays(
          editDialog.data?.tanggal_masuk,
          editDialog.data?.tanggal_keluar
        ),
        step: 1
      }}
      error={
        Number(scoreForm.jumlah_hadir) > calculateWorkingDays(
          editDialog.data?.tanggal_masuk,
          editDialog.data?.tanggal_keluar
        )
      }
      helperText={
        Number(scoreForm.jumlah_hadir) > calculateWorkingDays(
          editDialog.data?.tanggal_masuk,
          editDialog.data?.tanggal_keluar
        )
          ? 'Jumlah kehadiran tidak boleh melebihi total hari kerja'
          : `Total hari kerja: ${calculateWorkingDays(
              editDialog.data?.tanggal_masuk,
              editDialog.data?.tanggal_keluar
            )} hari`
              }
            />
          </Grid>
          </Grid>
          </Box>
            </Grid>


            {/* Scores Section */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                Penilaian Kinerja
              </Typography>
            </Grid>
            {Object.entries(scoreForm).map(([key, value]) => {
              if (key === 'jumlah_hadir') return null; // Skip attendance field
              return (
                <Grid item xs={12} md={6} key={key}>
                  <TextField
                    fullWidth
                    label={key.split('_').slice(1).join(' ').toUpperCase()}
                    type="number"
                    value={value}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || (Number(val) >= 0 && Number(val) <= 100)) {
                        setScoreForm(prev => ({
                          ...prev,
                          [key]: val
                        }));
                      }
                    }}
                    inputProps={{
                      min: 0,
                      max: 100,
                      step: "1"
                    }}
                    required
                    error={Number(value) < 0 || Number(value) > 100}
                    helperText={
                      Number(value) < 0 || Number(value) > 100
                        ? 'Nilai harus antara 0-100'
                        : ''
                    }
                  />
                </Grid>
              );
            })}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setEditDialog({ open: false, loading: false, data: null, error: null })}
            disabled={editDialog.loading}
          >
            Batal
          </Button>
          <LoadingButton
            type="submit"
            variant="contained"
            loading={editDialog.loading}
          >
            Simpan Perubahan
          </LoadingButton>
        </DialogActions>
      </form>
    </Dialog>




      {/* Export Dialog */}
      <Dialog
        open={exportDialog.open}
        onClose={() => setExportDialog(prev => ({ ...prev, open: false }))}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">Export Data</Typography>
            <IconButton
              onClick={() => setExportDialog(prev => ({ ...prev, open: false }))}
              size="small"
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <RadioGroup
              value={exportDialog.exportType}
              onChange={(e) => setExportDialog(prev => ({
                ...prev,
                exportType: e.target.value
              }))}
            >
              <FormControlLabel
                value="all"
                control={<Radio />}
                label="Export Semua Data"
              />
              <FormControlLabel
                value="filtered"
                control={<Radio />}
                label="Export Berdasarkan Filter Tanggal"
              />
            </RadioGroup>


            {exportDialog.exportType === 'filtered' && (
              <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Tanggal Mulai"
                    value={exportDialog.dateRange.startDate}
                    onChange={(date) => setExportDialog(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, startDate: date }
                    }))}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                  <DatePicker
                    label="Tanggal Akhir"
                    value={exportDialog.dateRange.endDate}
                    onChange={(date) => setExportDialog(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, endDate: date }
                    }))}
                    slotProps={{ textField: { fullWidth: true } }}
                    minDate={exportDialog.dateRange.startDate}
                  />
                </LocalizationProvider>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setExportDialog(prev => ({ ...prev, open: false }))}
            disabled={exportDialog.loading}
          >
            Batal
          </Button>
          <LoadingButton
            onClick={handleExport}
            loading={exportDialog.loading}
            variant="contained"
            disabled={
              exportDialog.exportType === 'filtered' &&
              (!exportDialog.dateRange.startDate || !exportDialog.dateRange.endDate)
            }
          >
            Export
          </LoadingButton>
        </DialogActions>
      </Dialog>


      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
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


export default RekapNilai;

