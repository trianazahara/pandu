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
  // State
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [bidang, setBidang] = useState('');
  const [search, setSearch] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedIntern, setSelectedIntern] = useState(null);
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
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Fetch Data
  const fetchData = async () => {
    try {
      const response = await axios.get('/api/intern/riwayat-data', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        params: {
          page,
          limit: 10,
          bidang,
          search,
          status: 'selesai'
        }
      });
      setData(response.data.data);
      setTotalPages(response.data.pagination.totalPages);
    } catch (error) {
      showSnackbar('Error mengambil data', 'error');
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, bidang, search]);

  // Handlers
  const handleOpenScoreDialog = (intern) => {
    console.log('Opening dialog for intern:', intern);
    
    setSelectedIntern(intern);
    // Set nilai default 0 untuk semua field
    setScoreForm({
        nilai_teamwork: '0',
        nilai_komunikasi: '0',
        nilai_pengambilan_keputusan: '0',
        nilai_kualitas_kerja: '0',
        nilai_teknologi: '0',
        nilai_disiplin: '0',
        nilai_tanggungjawab: '0',
        nilai_kerjasama: '0',
        nilai_inisiatif: '0',
        nilai_kejujuran: '0',
        nilai_kebersihan: '0'
    });
    setOpenDialog(true);
};

  const handleSubmitScore = async (e) => {
    e.preventDefault();
    try {
      const scoreData = {
        nilai_teamwork: Number(scoreForm.nilai_teamwork) || '',
        nilai_komunikasi: Number(scoreForm.nilai_komunikasi) || '',
        nilai_pengambilan_keputusan: Number(scoreForm.nilai_pengambilan_keputusan) || '',
        nilai_kualitas_kerja: Number(scoreForm.nilai_kualitas_kerja) || '',
        nilai_teknologi: Number(scoreForm.nilai_teknologi) || '',
        nilai_disiplin: Number(scoreForm.nilai_disiplin) || '',
        nilai_tanggungjawab: Number(scoreForm.nilai_tanggungjawab) || '',
        nilai_kerjasama: Number(scoreForm.nilai_kerjasama) || '',
        nilai_inisiatif: Number(scoreForm.nilai_inisiatif) || '',
        nilai_kejujuran: Number(scoreForm.nilai_kejujuran) || '',
        nilai_kebersihan: Number(scoreForm.nilai_kebersihan) || ''
    };

    // Log data sebelum dikirim untuk debugging
    console.log('Selected Intern:', selectedIntern);
    console.log('Score Data to be sent:', scoreData);

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
      console.error('Error response:', error.response?.data);
        showSnackbar(
            error.response?.data?.message || 'Error menyimpan nilai', 
            'error'
        );
    }
};

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
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
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth size="small">
            <InputLabel>Bidang</InputLabel>
            <Select
              value={bidang}
              label="Bidang"
              onChange={(e) => setBidang(e.target.value)}
            >
              <MenuItem value="">Semua Bidang</MenuItem>
              <MenuItem value="1">Bidang A</MenuItem>
              <MenuItem value="2">Bidang B</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* Table */}
      <TableContainer component={Paper} sx={{ mt: 2, borderRadius: '12px' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#f8f9fa' }}>
              <TableCell sx={{ fontWeight: '600' }}>Nama</TableCell>
              <TableCell sx={{ fontWeight: '600' }}>Email</TableCell>
              <TableCell sx={{ fontWeight: '600' }}>Bidang</TableCell>
              <TableCell sx={{ fontWeight: '600' }}>Tanggal Masuk</TableCell>
              <TableCell sx={{ fontWeight: '600' }}>Tanggal Keluar</TableCell>
              <TableCell sx={{ fontWeight: '600' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: '600' }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((intern) => (
              <TableRow key={intern.id_magang}>
                <TableCell>{intern.nama}</TableCell>
                <TableCell>{intern.email}</TableCell>
                <TableCell>{intern.nama_bidang}</TableCell>
                <TableCell>{new Date(intern.tanggal_masuk).toLocaleDateString('id-ID')}</TableCell>
                <TableCell>{new Date(intern.tanggal_keluar).toLocaleDateString('id-ID')}</TableCell>
                <TableCell>
                  <Box
                    sx={{
                      display: 'inline-block',
                      bgcolor: '#4CAF50',
                      color: 'white',
                      px: 2,
                      py: 0.5,
                      borderRadius: 1,
                      fontSize: '0.875rem'
                    }}
                  >
                    {intern.status}
                  </Box>
                </TableCell>
                <TableCell>
                  <IconButton 
                    onClick={() => handleOpenScoreDialog(intern)}
                    sx={{ 
                      color: '#2196F3',
                      '&:hover': {
                        bgcolor: 'rgba(33, 150, 243, 0.08)'
                      }
                    }}
                    title="Input Nilai"
                  >
                    <AssessmentIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
        <Pagination 
          count={totalPages} 
          page={page} 
          onChange={(e, value) => setPage(value)}
          color="primary"
        />
      </Box>

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
                    // Hanya menerima angka 0-100
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