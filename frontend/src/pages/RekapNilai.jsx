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
  Grid
} from '@mui/material';
import axios from 'axios';
import { Edit as EditIcon, FileDownload as FileDownloadIcon } from '@mui/icons-material';

const RekapNilai = () => {
  // State
  const [data, setData] = useState([]);
  const [bidangList, setBidangList] = useState([]); // Tambahkan state bidangList
  const [filters, setFilters] = useState({
    bidang: '',
    search: ''
  });
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedIntern, setSelectedIntern] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
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
    nilai_kebersihan: ''
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
      const queryParams = new URLSearchParams();
      
      if (filters.bidang) queryParams.append('bidang', filters.bidang);
      if (filters.search) queryParams.append('search', filters.search);
      queryParams.append('page', page);
      queryParams.append('limit', 10);

      const response = await axios.get('/api/intern/rekap-nilai', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        params: {
          page,
          limit: 10,
          bidang: filters.bidang,
          search: filters.search
        }
      });
      setData(response.data.data);
      setTotalPages(response.data.pagination.totalPages);
    } catch (error) {
      showSnackbar('Error mengambil data', 'error');
    }
  };

  useEffect(() => {
    fetchBidangList();
  }, []);

  useEffect(() => {
    fetchData();
  }, [page, filters.bidang, filters.search]);

  // Handlers
  const handleFilter = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleEditScore = (intern) => {
    setSelectedIntern(intern);
    setScoreForm({
      nilai_teamwork: intern.nilai_teamwork || '',
      nilai_komunikasi: intern.nilai_komunikasi || '',
      nilai_pengambilan_keputusan: intern.nilai_pengambilan_keputusan || '',
      nilai_kualitas_kerja: intern.nilai_kualitas_kerja || '',
      nilai_teknologi: intern.nilai_teknologi || '',
      nilai_disiplin: intern.nilai_disiplin || '',
      nilai_tanggungjawab: intern.nilai_tanggungjawab || '',
      nilai_kerjasama: intern.nilai_kerjasama || '',
      nilai_inisiatif: intern.nilai_inisiatif || '',
      nilai_kejujuran: intern.nilai_kejujuran || '',
      nilai_kebersihan: intern.nilai_kebersihan || ''
    });
    setOpenDialog(true);
  };

  const handleSubmitScore = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/intern/update-nilai/${selectedIntern.id_penilaian}`, scoreForm, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      showSnackbar('Nilai berhasil diperbarui');
      setOpenDialog(false);
      fetchData();
    } catch (error) {
      showSnackbar(error.response?.data?.message || 'Error mengupdate nilai', 'error');
    }
  };

  const handleExport = async () => {
    try {
      const response = await axios.get('/api/intern/export', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        responseType: 'blob',
        params: { bidang: filters.bidang }  // Updated to use filters.bidang
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Data_Anak_Magang.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      showSnackbar('Data berhasil diexport');
    } catch (error) {
      showSnackbar('Error mengexport data', 'error');
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const [pagination, setPagination] = useState({
      page: 0,
      limit: 10,
      total: 0
    });
    
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
          onClick={handleExport}
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Institusi</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bidang</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Team Work</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Komunikasi</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Rata-rata</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((score) => {
              const average = (
                Number(score.nilai_teamwork) +
                Number(score.nilai_komunikasi) +
                Number(score.nilai_pengambilan_keputusan) +
                Number(score.nilai_kualitas_kerja) +
                Number(score.nilai_teknologi) +
                Number(score.nilai_disiplin) +
                Number(score.nilai_tanggungjawab) +
                Number(score.nilai_kerjasama) +
                Number(score.nilai_inisiatif) +
                Number(score.nilai_kejujuran) +
                Number(score.nilai_kebersihan)
              ) / 11;

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
                    {score.nilai_teamwork}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    {score.nilai_komunikasi}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-center">
                    {average.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <IconButton 
                      onClick={() => handleEditScore(score)}
                      sx={{ 
                        color: 'info.main',
                        '&:hover': {
                          bgcolor: 'rgba(33, 150, 243, 0.08)'
                        }
                      }}
                      size="small"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
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
        open={openDialog} 
        onClose={() => setOpenDialog(false)}
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          {`Edit Nilai - ${selectedIntern?.nama}`}
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
                      // Hanya menerima angka 0-100
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

export default RekapNilai;