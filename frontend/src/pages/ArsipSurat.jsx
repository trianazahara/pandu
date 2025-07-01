import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  TextField,
  MenuItem,
  Snackbar,
  Alert,
  Chip,
  InputAdornment,
  Grid,
  Card,
  CardContent,
  Pagination,
  CircularProgress
} from '@mui/material';
import {
  Download as DownloadIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import * as api from '../services/apiService';


const ArsipSurat = () => {
    // State management
    const [archives, setArchives] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [perPage] = useState(10);
    const [filters, setFilters] = useState({ search: '', bidang: '', bulan: '', tahun: '' });
    const [showFilters, setShowFilters] = useState(false); // Filter disembunyikan secara default
    const [bidangList, setBidangList] = useState([]);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });


    // Opsi untuk filter
    const bulanOptions = [
      { value: '1', label: 'Januari' }, { value: '2', label: 'Februari' }, { value: '3', label: 'Maret' },
      { value: '4', label: 'April' }, { value: '5', label: 'Mei' }, { value: '6', label: 'Juni' },
      { value: '7', label: 'Juli' }, { value: '8', label: 'Agustus' }, { value: '9', label: 'September' },
      { value: '10', label: 'Oktober' }, { value: '11', label: 'November' }, { value: '12', label: 'Desember' }
    ];
    const tahunOptions = Array.from({ length: 10 }, (_, i) => {
      const year = new Date().getFullYear() - i;
      return { value: year.toString(), label: year.toString() };
    });


    const showSnackbar = (message, severity = 'success') => {
      setSnackbar({ open: true, message, severity });
    };


    // Fungsi fetch data yang terpusat
    const fetchArchives = async (page = currentPage, currentFilters = filters) => {
      setLoading(true);
      setError(null);
      try {
        const params = {
          page: page,
          limit: perPage,
          search: currentFilters.search,
          bidang: currentFilters.bidang,
          bulan: currentFilters.bulan,
          tahun: currentFilters.tahun,
        };
        const response = await api.getArchives(params);
        if (response.data.status === 'success') {
          setArchives(response.data.data.archives);
          setTotalPages(response.data.data.pagination.total_pages);
        } else {
          showSnackbar(response.data.message || 'Gagal memuat arsip', 'error');
        }
      } catch (err) {
        const errorMessage = err.response?.data?.message || 'Terjadi kesalahan saat memuat data';
        setError(errorMessage);
        showSnackbar(errorMessage, 'error');
        console.error('Error fetching archives:', err);
      } finally {
        setLoading(false);
      }
    };


    const fetchBidang = async () => {
      try {
        const response = await api.getArchiveBidangList();
        if (response.data.status === 'success') {
          setBidangList(response.data.data);
        }
      } catch (err) {
        console.error('Error fetching bidang list:', err);
      }
    };


    useEffect(() => {
      fetchBidang();
      fetchArchives(1, filters); // Fetch data awal saat komponen dimuat
    }, []);


    // Handler untuk perubahan filter
    const handleFilterChange = (key, value) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        setCurrentPage(1); // Selalu reset ke halaman pertama saat filter berubah
        fetchArchives(1, newFilters);
    };
   
    // Handler untuk aksi pada sertifikat (preview & download)
    const handleCertificateAction = async (idMagang, nama, isPreview = false) => {
      showSnackbar('Memproses sertifikat...', 'info');
      try {
        const response = await api.downloadCertificate(idMagang);
       
        // Memastikan tipe konten adalah PDF
        const contentType = response.headers['content-type'];
        if (!contentType.includes('application/pdf')) {
            showSnackbar('File yang diterima bukan PDF. Mungkin terjadi kesalahan.', 'error');
            return;
        }


        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);


        if (isPreview) {
          window.open(url, '_blank');
        } else {
          const a = document.createElement('a');
          a.href = url;
          a.download = `sertifikat_${nama.replace(/\s+/g, '_')}.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          showSnackbar('Sertifikat berhasil diunduh', 'success');
        }
        // Tunggu sebentar sebelum revoke URL untuk memastikan file ter-load/ter-download
        setTimeout(() => window.URL.revokeObjectURL(url), 100);
      } catch (err) {
        showSnackbar('Gagal memproses sertifikat. File mungkin tidak ada.', 'error');
        console.error('Error in certificate action:', err);
      }
    };


    const resetFilters = () => {
      const initialFilters = { search: '', bidang: '', bulan: '', tahun: '' };
      setFilters(initialFilters);
      setCurrentPage(1);
      fetchArchives(1, initialFilters);
    };


    // Efek untuk menambahkan background animasi
    useEffect(() => {
      const style = document.createElement('style');
      style.textContent = `
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animated-bg {
          background: linear-gradient(90deg, #BCFB69, #26BBAC, #20A4F3, #BCFB69);
          background-size: 300% 300%;
          animation: gradient 15s ease infinite;
        }
      `;
      document.head.appendChild(style);
      return () => {
        document.head.removeChild(style);
      };
    }, []);


    return (
      <Box sx={{ p: 3, width: '100%' }}>
        {/* Header Section */}
        <Box
          className="animated-bg"
          sx={{
            borderRadius: '12px', mb: 4, p: 3,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}
        >
          <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
            Arsip Surat & Sertifikat
          </Typography>
          <Button
            variant="contained"
            startIcon={<FilterIcon />}
            onClick={() => setShowFilters(!showFilters)}
            sx={{ bgcolor: 'white', color: '#26BBAC', '&:hover': { bgcolor: '#f5f5f5' } }}
          >
            Filter
          </Button>
        </Box>


        {/* Filters Section */}
        {showFilters && (
          <Card sx={{ mb: 3, borderRadius: '12px', boxShadow: 3 }}>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
               
                {/* FIX: Menggunakan filters.search */}
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Cari Nama/Institusi"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    InputProps={{
                      startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>),
                    }}
                  />
                </Grid>
               
                {/* FIX: Menggunakan filters.bidang */}
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    select fullWidth label="Bidang"
                    value={filters.bidang}
                    onChange={(e) => handleFilterChange('bidang', e.target.value)}
                  >
                    <MenuItem value="">Semua Bidang</MenuItem>
                    {bidangList.map((bidang) => (
                      <MenuItem key={bidang} value={bidang}>{bidang}</MenuItem>
                    ))}
                  </TextField>
                </Grid>


                {/* FIX: Menggunakan filters.bulan dan handleFilterChange */}
                <Grid item xs={12} sm={6} md={2}>
                  <TextField
                    select fullWidth label="Bulan"
                    value={filters.bulan}
                    onChange={(e) => handleFilterChange('bulan', e.target.value)}
                  >
                    <MenuItem value="">Semua Bulan</MenuItem>
                    {bulanOptions.map((bulan) => (
                      <MenuItem key={bulan.value} value={bulan.value}>{bulan.label}</MenuItem>
                    ))}
                  </TextField>
                </Grid>


                {/* FIX: Menggunakan filters.tahun dan handleFilterChange */}
                <Grid item xs={12} sm={6} md={2}>
                  <TextField
                    select fullWidth label="Tahun"
                    value={filters.tahun}
                    onChange={(e) => handleFilterChange('tahun', e.target.value)}
                  >
                    <MenuItem value="">Semua Tahun</MenuItem>
                    {tahunOptions.map((tahun) => (
                      <MenuItem key={tahun.value} value={tahun.value}>{tahun.label}</MenuItem>
                    ))}
                  </TextField>
                </Grid>


                <Grid item xs={12} md={2}>
                  <Button
                    fullWidth variant="outlined" onClick={resetFilters}
                    sx={{ height: '56px' }}
                  >
                    Reset
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}


        {/* Table Section */}
        <Paper sx={{ borderRadius: '12px', overflow: 'hidden', boxShadow: 3 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                  <TableCell>No</TableCell>
                  <TableCell>Nama Peserta</TableCell>
                  <TableCell>Nomor Induk</TableCell>
                  <TableCell>Institusi</TableCell>
                  <TableCell>Bidang</TableCell>
                  <TableCell>Periode</TableCell>
                  <TableCell>Status File</TableCell>
                  <TableCell align="center">Aksi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 5 }}>
                      <CircularProgress />
                      <Typography sx={{ mt: 2 }}>Memuat data...</Typography>
                    </TableCell>
                  </TableRow>
                ) : archives.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 5 }}>
                        <Typography variant="h6">Tidak ada data ditemukan</Typography>
                        <Typography color="text.secondary">Coba ubah atau reset filter Anda.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  archives.map((archive, index) => (
                    <TableRow key={archive.id_magang} hover>
                      <TableCell>{(currentPage - 1) * perPage + index + 1}</TableCell>
                      <TableCell>
                          <Typography variant="subtitle2" fontWeight={600}>{archive.nama}</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{textTransform: 'capitalize'}}>{archive.jenis_peserta}</Typography>
                      </TableCell>
                      <TableCell>{archive.nomor_induk || '-'}</TableCell>
                      <TableCell>{archive.nama_institusi}</TableCell>
                      <TableCell><Chip label={archive.nama_bidang} size="small" color="primary" variant="outlined" /></TableCell>
                      <TableCell>{new Date(archive.tanggal_masuk).toLocaleDateString('id-ID')} - {new Date(archive.tanggal_keluar).toLocaleDateString('id-ID')}</TableCell>
                      <TableCell>
                        <Chip
                          label={archive.file_exists ? 'Tersedia' : 'Tidak Ada'}
                          size="small"
                          color={archive.file_exists ? 'success' : 'error'}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton title="Preview" onClick={() => handleCertificateAction(archive.id_magang, archive.nama, true)} disabled={!archive.file_exists}>
                          <VisibilityIcon />
                        </IconButton>
                        <IconButton title="Download" onClick={() => handleCertificateAction(archive.id_magang, archive.nama, false)} disabled={!archive.file_exists}>
                          <DownloadIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>


        {/* Pagination */}
        {totalPages > 1 && !loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={(event, page) => {
                setCurrentPage(page);
                fetchArchives(page, filters);
              }}
              color="primary"
            />
          </Box>
        )}


        {/* Snackbar */}
        <Snackbar open={snackbar.open} autoHideDuration={5000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
          <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%', boxShadow: 3 }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    );
};


export default ArsipSurat;

