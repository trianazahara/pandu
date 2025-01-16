// src/pages/RekapNilai.jsx
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
import { Edit as EditIcon, FileDownload as FileDownloadIcon } from '@mui/icons-material';
import axios from 'axios';import { Edit as EditIcon, FileDownload as FileDownloadIcon, CardMembership as CertificateIcon } from '@mui/icons-material';


const RekapNilai = () => {
  // State
  const [data, setData] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedIntern, setSelectedIntern] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [bidang, setBidang] = useState('');
  const [search, setSearch] = useState('');
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

  // Fetch Data
  const fetchData = async () => {
    try {
      const response = await axios.get('/api/intern/rekap-nilai', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        params: {
          page,
          limit: 10,
          bidang,
          search
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
    console.log('Selected intern:', selectedIntern);
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
        params: { bidang }
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

  const [loadingCertificate, setLoadingCertificate] = useState(null);

  const handleGenerateCertificate = async (id) => {
    setLoadingCertificate(id);
    try {
      const response = await axios.get(`/api/intern/certificate/${id}`, {
        headers: { 
          Authorization: `Bearer ${localStorage.getItem('token')}` 
        },
        responseType: 'blob'  // Penting untuk handling file
      });
  
      // Create blob URL dan trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `sertifikat_magang_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      showSnackbar('Sertifikat berhasil di-generate');
    } catch (error) {
      showSnackbar('Gagal generate sertifikat', 'error');
      console.error('Error generating certificate:', error);
    } finally {
      setLoadingCertificate(null);
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
              <TableCell sx={{ fontWeight: '600' }}>Institusi</TableCell>
              <TableCell sx={{ fontWeight: '600' }}>Bidang</TableCell>
              <TableCell align="center" sx={{ fontWeight: '600' }}>Team Work</TableCell>
              <TableCell align="center" sx={{ fontWeight: '600' }}>Komunikasi</TableCell>
              <TableCell align="center" sx={{ fontWeight: '600' }}>Rata-rata</TableCell>
              <TableCell sx={{ fontWeight: '600' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
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
                      <TableRow key={score.id_penilaian}>
                        <TableCell>{score.nama}</TableCell>
                        <TableCell>{score.nama_institusi}</TableCell>
                        <TableCell>{score.nama_bidang}</TableCell>
                        <TableCell align="center">{score.nilai_teamwork}</TableCell>
                        <TableCell align="center">{score.nilai_komunikasi}</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                          {average.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <IconButton 
                            onClick={() => handleEditScore(score)}
                            sx={{ color: '#2196F3' }}
                          >
                            <EditIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
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
                          onChange={(e) => setScoreForm({
                            ...scoreForm,
                            [key]: e.target.value
                          })}
                          inputProps={{ min: 0, max: 100 }}
                          required
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