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

const ArsipSurat = () => {
  const [archives, setArchives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage] = useState(10);
  
  // Filters
  const [search, setSearch] = useState('');
  const [selectedBidang, setSelectedBidang] = useState('');
  const [selectedBulan, setSelectedBulan] = useState('');
  const [selectedTahun, setSelectedTahun] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter options
  const [bidangList, setBidangList] = useState([]);
  
  // Snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  const bulanOptions = [
    { value: '1', label: 'Januari' }, { value: '2', label: 'Februari' },
    { value: '3', label: 'Maret' }, { value: '4', label: 'April' },
    { value: '5', label: 'Mei' }, { value: '6', label: 'Juni' },
    { value: '7', label: 'Juli' }, { value: '8', label: 'Agustus' },
    { value: '9', label: 'September' }, { value: '10', label: 'Oktober' },
    { value: '11', label: 'November' }, { value: '12', label: 'Desember' }
  ];
  
  const tahunOptions = Array.from({length: 10}, (_, i) => {
    const year = new Date().getFullYear() - i;
    return { value: year.toString(), label: year.toString() };
  });

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // Fetch archives data
  const fetchArchives = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: perPage.toString(),
        search,
        bidang: selectedBidang,
        bulan: selectedBulan,
        tahun: selectedTahun
      });

      const response = await fetch(`http://localhost:5000/api/archives?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      
      console.log('API Response:', data); // Debug log
      
      if (data.status === 'success') {
        console.log('Archives data:', data.data.archives); // Debug log
        setArchives(data.data.archives);
        setTotalPages(data.data.pagination.total_pages);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Terjadi kesalahan saat memuat data');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch bidang list
  const fetchBidangList = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/archives/bidang', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.status === 'success') {
        setBidangList(data.data);
      }
    } catch (err) {
      console.error('Error fetching bidang:', err);
    }
  };

  // Preview certificate
  const handlePreview = async (idMagang, nama) => {
    try {
      const response = await fetch(`http://localhost:5000/api/archives/download/${idMagang}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        window.URL.revokeObjectURL(url);
      } else {
        const data = await response.json();
        showSnackbar(data.message || 'Gagal preview sertifikat', 'error');
      }
    } catch (err) {
      console.error('Error previewing:', err);
      showSnackbar('Terjadi kesalahan saat preview', 'error');
    }
  };
  const handleDownload = async (idMagang, nama) => {
    try {
      const response = await fetch(`http://localhost:5000/api/archives/download/${idMagang}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sertifikat_${nama.replace(/\s+/g, '_')}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        showSnackbar('Sertifikat berhasil didownload');
      } else {
        const data = await response.json();
        showSnackbar(data.message || 'Gagal mendownload sertifikat', 'error');
      }
    } catch (err) {
      console.error('Error downloading:', err);
      showSnackbar('Terjadi kesalahan saat mendownload', 'error');
    }
  };

  // Delete certificate
  const handleDelete = async (idMagang, nama) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus sertifikat ${nama}?`)) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/archives/${idMagang}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        showSnackbar('Sertifikat berhasil dihapus');
        fetchArchives(); // Refresh data
      } else {
        showSnackbar(data.message || 'Gagal menghapus sertifikat', 'error');
      }
    } catch (err) {
      console.error('Error deleting:', err);
      showSnackbar('Terjadi kesalahan saat menghapus', 'error');
    }
  };

  // Reset filters
  const resetFilters = () => {
    setSearch('');
    setSelectedBidang('');
    setSelectedBulan('');
    setSelectedTahun('');
    setCurrentPage(1);
  };

  // Effect hooks
  useEffect(() => {
    fetchBidangList();
  }, []);

  useEffect(() => {
    fetchArchives();
  }, [currentPage, search, selectedBidang, selectedBulan, selectedTahun]);

  // Handle search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [search]);

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
                  onChange={(e) => setSearch(e.target.value)}
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
                  onChange={(e) => setSelectedBidang(e.target.value)}
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