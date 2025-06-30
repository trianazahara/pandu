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
} from '@mui/material';
import { 
  Download as DownloadIcon, 
  Delete as DeleteIcon, 
  Search as SearchIcon,
  Filter as FilterIcon,
//   FileText,
//   Calendar,
//   Building2,
//   User,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import * as api from '../services/apiService';

const ArsipSurat = () => {
  // State management (sebagian besar tetap sama)
  const [archives, setArchives] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [perPage] = useState(10);
    const [filters, setFilters] = useState({ search: '', bidang: '', bulan: '', tahun: '' });
    const [showFilters, setShowFilters] = useState(false);
    const [bidangList, setBidangList] = useState([]);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Opsi untuk filter (tetap sama)
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

  // 2. Fungsi fetch data jadi lebih bersih dan terpusat
  const fetchArchives = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: perPage,
        ...filters,
      };
      const response = await api.getArchives(params);
      if (response.data.status === 'success') {
        setArchives(response.data.data.archives);
        setTotalPages(response.data.data.pagination.total_pages);
      } else {
        showSnackbar(response.data.message || 'Gagal memuat arsip', 'error');
      }
    } catch (err) {
      showSnackbar('Terjadi kesalahan saat memuat data', 'error');
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
  }, []); // Ambil daftar bidang sekali saja saat komponen dimuat

  useEffect(() => {
    fetchArchives();
  }, [currentPage, filters]); // Fetch arsip setiap kali halaman atau filter berubah

  // 3. Logika debounce untuk search, agar tidak request terus-menerus saat mengetik
  useEffect(() => {
    const handler = setTimeout(() => {
        if (currentPage !== 1) setCurrentPage(1);
        else fetchArchives();
    }, 500); // Tunggu 500ms setelah user berhenti mengetik
    return () => clearTimeout(handler);
  }, [filters.search]);


  // 4. Handler untuk aksi-aksi menjadi lebih ringkas
  const handlePreview = async (idMagang) => {
        try {
            const response = await api.downloadCertificate(idMagang);
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
            // Tidak perlu revoke URL segera agar tab baru sempat memuat
        } catch (err) {
            showSnackbar('Gagal memuat preview. File mungkin tidak ada.', 'error');
        }
    };

    const handleDownload = async (idMagang, nama) => {
        try {
            const response = await api.downloadCertificate(idMagang);
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `sertifikat_${nama.replace(/\s+/g, '_')}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            showSnackbar('Sertifikat berhasil diunduh', 'success');
        } catch (err) {
            showSnackbar('Gagal mengunduh sertifikat. File mungkin tidak ada.', 'error');
        }
    };

  const handleCertificateAction = async (idMagang, nama, isPreview = false) => {
        showSnackbar('Memproses sertifikat...', 'info');
        try {
            // Kita sudah punya fungsi ini di apiService
            const response = await api.downloadCertificate(idMagang); 
            
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);

            if (isPreview) {
                // Jika preview, buka di tab baru
                window.open(url, '_blank');
            } else {
                // Jika download, buat link dan klik otomatis
                const a = document.createElement('a');
                a.href = url;
                a.download = `sertifikat_${nama.replace(/\s+/g, '_')}.pdf`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                showSnackbar('Sertifikat berhasil diunduh', 'success');
            }
            // Hapus URL dari memori setelah dipakai
            window.URL.revokeObjectURL(url);
        } catch (err) {
            showSnackbar('Gagal memproses sertifikat. File mungkin tidak ada.', 'error');
            console.error('Error downloading/previewing certificate:', err);
        }
    };

  const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setCurrentPage(1);
    };

    const resetFilters = () => {
        setFilters({ search: '', bidang: '', bulan: '', tahun: '' });
        setCurrentPage(1);
    };

  // Add animated background styles
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes gradient {
        0% {
          background-position: 0% 50%;
          background-size: 100% 100%;
        }
        25% {
          background-size: 200% 200%;
        }
        50% {
          background-position: 100% 50%;
          background-size: 100% 100%;
        }
        75% {
          background-size: 200% 200%;
        }
        100% {
          background-position: 0% 50%;
          background-size: 100% 100%;
        }
      }

      .animated-bg {
        background: linear-gradient(
          90deg, 
          #BCFB69 0%,
          #26BBAC 33%,
          #20A4F3 66%,
          #BCFB69 100%
        );
        background-size: 300% 100%;
        animation: gradient 8s ease-in-out infinite;
        transition: all 0.3s ease;
      }

      .animated-bg:hover {
        transform: scale(1.005);
        box-shadow: 0 8px 20px rgba(0,0,0,0.1);
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={400}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', minWidth: 0 }}>
      {/* Header Section */}
      <Box sx={{ 
        width: '100%',
        borderRadius: '12px',
        mb: 4,
        p: 3,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
      }}
      className="animated-bg"
      >
        <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
          Arsip Surat & Sertifikat
        </Typography>
        <Button
          variant="contained"
          startIcon={<FilterIcon />}
          onClick={() => setShowFilters(!showFilters)}
          sx={{
            bgcolor: 'white',
            color: '#26BBAC',
            '&:hover': { bgcolor: '#f5f5f5' },
          }}>
          FILTER
        </Button>
      </Box>

      {/* Filters Section */}
      {showFilters && (
        <Card sx={{ mb: 3, borderRadius: '12px' }}>
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Cari Nama/Institusi"
                  value={search}
                  onChange={(e) => handleFilterChange('search', e.target.value)} 
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={3}>
                <TextField
                  select
                  fullWidth
                  label="Bidang"
                  value={selectedBidang}
                  onChange={(e) => handleFilterChange('bidang', e.target.value)}
                >
                  <MenuItem value="">Semua Bidang</MenuItem>
                  {bidangList.map((bidang) => (
                    <MenuItem key={bidang} value={bidang}>{bidang}</MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={2}>
                <TextField
                  select
                  fullWidth
                  label="Bulan"
                  value={selectedBulan}
                  onChange={(e) => setSelectedBulan(e.target.value)}
                >
                  <MenuItem value="">Semua Bulan</MenuItem>
                  {bulanOptions.map((bulan) => (
                    <MenuItem key={bulan.value} value={bulan.value}>{bulan.label}</MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={2}>
                <TextField
                  select
                  fullWidth
                  label="Tahun"
                  value={selectedTahun}
                  onChange={(e) => setSelectedTahun(e.target.value)}
                >
                  <MenuItem value="">Semua Tahun</MenuItem>
                  {tahunOptions.map((tahun) => (
                    <MenuItem key={tahun.value} value={tahun.value}>{tahun.label}</MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={2}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={resetFilters}
                  sx={{ height: '56px' }}
                >
                  Reset Filter
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Table */}
      <TableContainer
        component={Paper}
        sx={{
          width: '100%',
          minWidth: 0,
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#f8f9fa' }}>
              <TableCell sx={{ fontWeight: '600' }}>No</TableCell>
              <TableCell sx={{ fontWeight: '600' }}>Nama Peserta</TableCell>
              <TableCell sx={{ fontWeight: '600' }}>Nomor Induk</TableCell>
              <TableCell sx={{ fontWeight: '600' }}>Institusi</TableCell>
              <TableCell sx={{ fontWeight: '600' }}>Bidang</TableCell>
              <TableCell sx={{ fontWeight: '600' }}>Periode</TableCell>
              <TableCell sx={{ fontWeight: '600' }}>Status File</TableCell>
              <TableCell sx={{ fontWeight: '600' }}>Aksi</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {archives.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} sx={{ textAlign: 'center', py: 8 }}>
                  <Box sx={{ color: 'text.secondary' }}>
                    <Typography variant="h6" gutterBottom>
                      Tidak ada data arsip sertifikat
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              archives.map((archive, index) => (
                <TableRow
                  key={archive.id_magang}
                  sx={{ '&:hover': { bgcolor: '#f8f9fa' } }}
                >
                  <TableCell>
                    {(currentPage - 1) * perPage + index + 1}
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {archive.nama}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'capitalize' }}>
                        {archive.jenis_peserta}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{archive.nomor_induk || '-'}</TableCell>
                  <TableCell>{archive.nama_institusi}</TableCell>
                  <TableCell>
                    <Chip 
                      label={archive.nama_bidang} 
                      size="small"
                      sx={{ 
                        bgcolor: '#e3f2fd', 
                        color: '#1976d2',
                        fontWeight: 500
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {archive.tanggal_masuk}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      s/d {archive.tanggal_keluar}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={archive.file_exists ? 'File Ada' : 'File Hilang'}
                      size="small"
                      sx={{ 
                        bgcolor: archive.file_exists ? '#e8f5e8' : '#ffebee',
                        color: archive.file_exists ? '#2e7d32' : '#c62828',
                        fontWeight: 500
                      }}
                    />
                  </TableCell>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <IconButton
                    onClick={() => handlePreview(archive.id_magang, archive.nama)}
                    disabled={!archive.file_exists}
                    sx={{ 
                      color: '#9c27b0', 
                      mr: 1,
                      '&.Mui-disabled': { color: '#ccc' }
                    }}
                    title="Preview Sertifikat"
                  >
                    <VisibilityIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    onClick={() => handleDownload(archive.id_magang, archive.nama)}
                    disabled={!archive.file_exists}
                    sx={{ 
                      color: '#2196F3', 
                      mr: 1,
                      '&.Mui-disabled': { color: '#ccc' }
                    }}
                    title="Download Sertifikat"
                  >
                    <DownloadIcon fontSize="small" />
                  </IconButton>
                </td>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={(event, page) => setCurrentPage(page)}
            color="primary"
            size="large"
          />
        </Box>
      )}

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
          sx={{
            width: '100%',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            borderRadius: 1
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ArsipSurat;