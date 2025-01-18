// src/pages/RiwayatData.jsx
import React, { useState, useEffect } from 'react';
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
  Pagination,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Snackbar,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material';
import { Assessment as AssessmentIcon } from '@mui/icons-material';
import axios from 'axios';

const RiwayatData = () => {
  const [pagination, setPagination] = useState({
    page: 0,
    limit: 10,
    total: 0
  });
  const [search, setSearch] = useState('');
  const [bidang, setBidang] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedIntern, setSelectedIntern] = useState(null);
  const [data, setData] = useState([]);
  const [bidangList, setBidangList] = useState([]); 
  const [scoreForm, setScoreForm] = useState({
    nilai_teamwork: 0,
    nilai_komunikasi: 0,
    nilai_pengambilan_keputusan: 0,
    nilai_kualitas_kerja: 0,
    nilai_teknologi: 0,
    nilai_disiplin: 0,
    nilai_tanggungjawab: 0,
    nilai_kerjasama: 0,
    nilai_inisiatif: 0,
    nilai_kejujuran: 0,
    nilai_kebersihan: 0
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

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
      const response = await axios.get('/api/intern/riwayat-data', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        params: {
          page: pagination.page + 1,
          limit: pagination.limit,
          bidang,
          search,
          status: 'selesai'
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

  useEffect(() => {
    fetchBidangList();
  }, []);

  useEffect(() => {
    fetchData();
  }, [pagination.page, pagination.limit, bidang, search]);

  // Helper Functions
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const getStatusLabel = (status) => {
    const labels = {
      'selesai': 'Selesai',
      'completed': 'Selesai',
    };
    return labels[status?.toLowerCase()] || status;
  };

  // Handlers
  const handleOpenScoreDialog = (intern) => {
    setSelectedIntern(intern);
    setScoreForm({
      nilai_teamwork: 0,
      nilai_komunikasi: 0,
      nilai_pengambilan_keputusan: 0,
      nilai_kualitas_kerja: 0,
      nilai_teknologi: 0,
      nilai_disiplin: 0,
      nilai_tanggungjawab: 0,
      nilai_kerjasama: 0,
      nilai_inisiatif: 0,
      nilai_kejujuran: 0,
      nilai_kebersihan: 0
    });
    setOpenDialog(true);
  };

  const handleSubmitScore = async (e) => {
    e.preventDefault();
    try {
      const scoreData = {
        id_magang: selectedIntern?.id_magang,
        nilai_teamwork: Number(scoreForm.nilai_teamwork) || 0,
        nilai_komunikasi: Number(scoreForm.nilai_komunikasi) || 0,
        nilai_pengambilan_keputusan: Number(scoreForm.nilai_pengambilan_keputusan) || 0,
        nilai_kualitas_kerja: Number(scoreForm.nilai_kualitas_kerja) || 0,
        nilai_teknologi: Number(scoreForm.nilai_teknologi) || 0,
        nilai_disiplin: Number(scoreForm.nilai_disiplin) || 0,
        nilai_tanggungjawab: Number(scoreForm.nilai_tanggungjawab) || 0,
        nilai_kerjasama: Number(scoreForm.nilai_kerjasama) || 0,
        nilai_inisiatif: Number(scoreForm.nilai_inisiatif) || 0,
        nilai_kejujuran: Number(scoreForm.nilai_kejujuran) || 0,
        nilai_kebersihan: Number(scoreForm.nilai_kebersihan) || 0
      };

      const response = await axios.post(
        `/api/intern/add-score/${selectedIntern.id_magang}`,
        scoreData,
        {
          headers: { 
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.status === 201) {
        showSnackbar('Nilai berhasil disimpan');
        setOpenDialog(false);
        fetchData();
      }
    } catch (error) {
      console.error('Submit error:', error);
      showSnackbar(
        error.response?.data?.message || 'Error menyimpan nilai', 
        'error'
      );
    }
  };

  return (
    <Box sx={{ width: '100%', minWidth: 0 }}>
      {/* Header */}
      <Box sx={{ 
        width: '100%',
        background: 'linear-gradient(to right, #BCFB69, #26BBAC)',
        borderRadius: '12px',
        mb: 4,
        p: 3
      }}>
        <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
          Riwayat Data Anak Magang
        </Typography>
      </Box>

      {/* Filter Section */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Search nama/email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '0.375rem',
              }
            }}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth size="small">
            <InputLabel>Bidang</InputLabel>
            <Select
              value={bidang}
              label="Bidang"
              onChange={(e) => setBidang(e.target.value)}
              sx={{
                borderRadius: '0.375rem',
              }}
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

      {/* Table Section */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bidang</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal Masuk</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal Keluar</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Status</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((intern) => (
              <tr key={intern.id_magang} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {intern.nama}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {intern.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {intern.nama_bidang}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(intern.tanggal_masuk).toLocaleDateString('id-ID')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(intern.tanggal_keluar).toLocaleDateString('id-ID')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-800">
                    {getStatusLabel(intern.status)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <IconButton 
                    onClick={() => handleOpenScoreDialog(intern)}
                    sx={{ 
                      color: 'info.main',
                      '&:hover': {
                        bgcolor: 'rgba(33, 150, 243, 0.08)'
                      }
                    }}
                    size="small"
                  >
                    <AssessmentIcon fontSize="small" />
                  </IconButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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

      {/* Score Input Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)}
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          {`Input Nilai - ${selectedIntern?.nama}`}
        </DialogTitle>
        <form onSubmit={handleSubmitScore}>
          <DialogContent>
            <Grid container spacing={2}>
              {Object.entries(scoreForm).map(([key, value]) => (
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
                          [key]: val === '' ? '0' : val
                        }));
                      }
                    }}
                    inputProps={{ 
                      min: 0, 
                      max: 100,
                      step: "1"  // Hanya menerima bilangan bulat
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
              ))}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Batal</Button>
            <Button type="submit" variant="contained">Simpan</Button>
          </DialogActions>
        </form>
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

export default RiwayatData;