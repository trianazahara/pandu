// frontend/src/pages/Reports.jsx (Versi Rapi)

import React, { useState, useEffect } from 'react';
import {
    Typography, Card, CardContent, Button, FormControl, InputLabel,
    Select, MenuItem, Grid, TextField, Box
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { FileDownload as FileDownloadIcon } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import * as api from '../services/apiService'; // Impor service API kita

const Reports = () => {
    const [bidangList, setBidangList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        status: '',
        bidang: '',
        start_date: null,
        end_date: null
    });

    // Ambil data bidang untuk filter saat komponen dimuat
    useEffect(() => {
        const fetchBidang = async () => {
            try {
                const response = await api.getBidangList();
                setBidangList(response.data.data || []);
            } catch (error) {
                console.error("Gagal mengambil data bidang:", error);
            }
        };
        fetchBidang();
    }, []);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };
    
    // GANTI: Fungsi handleExport sekarang memanggil service
    const handleExport = async () => {
        setLoading(true);
        try {
            const params = {
                status: filters.status,
                bidang: filters.bidang,
                start_date: filters.start_date ? filters.start_date.toISOString() : undefined,
                end_date: filters.end_date ? filters.end_date.toISOString() : undefined,
            };

            // Hapus properti yang null atau kosong agar URL lebih bersih
            Object.keys(params).forEach(key => (params[key] === '' || params[key] === undefined) && delete params[key]);

            const response = await api.exportReport(params);
            
            const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'Laporan_Data_Magang.xlsx';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

        } catch (error) {
            console.error('Error exporting data:', error);
            // Tambahkan notifikasi error jika perlu
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Rekap Data & Laporan
            </Typography>

            <Card>
                <CardContent>
                    <Typography variant="h6" gutterBottom>Filter Laporan</Typography>
                    <Grid container spacing={3}>
                        <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth>
                                <InputLabel>Status</InputLabel>
                                <Select value={filters.status} label="Status" onChange={(e) => handleFilterChange('status', e.target.value)}>
                                    <MenuItem value="">Semua Status</MenuItem>
                                    <MenuItem value="aktif">Aktif</MenuItem>
                                    <MenuItem value="selesai">Selesai</MenuItem>
                                    <MenuItem value="not_yet">Belum Mulai</MenuItem>
                                    <MenuItem value="missing">Missing</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth>
                                <InputLabel>Bidang</InputLabel>
                                <Select value={filters.bidang} label="Bidang" onChange={(e) => handleFilterChange('bidang', e.target.value)}>
                                    <MenuItem value="">Semua Bidang</MenuItem>
                                    {bidangList.map(bidang => (
                                        <MenuItem key={bidang.id_bidang} value={bidang.id_bidang}>{bidang.nama_bidang}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <DatePicker
                                    label="Dari Tanggal"
                                    value={filters.start_date}
                                    onChange={(date) => handleFilterChange('start_date', date)}
                                    renderInput={(params) => <TextField {...params} fullWidth />}
                                />
                            </LocalizationProvider>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <DatePicker
                                    label="Sampai Tanggal"
                                    value={filters.end_date}
                                    onChange={(date) => handleFilterChange('end_date', date)}
                                    renderInput={(params) => <TextField {...params} fullWidth />}
                                    minDate={filters.start_date}
                                />
                            </LocalizationProvider>
                        </Grid>
                    </Grid>

                    <Box sx={{ mt: 3 }}>
                        <LoadingButton
                            variant="contained"
                            loading={loading}
                            startIcon={<FileDownloadIcon />}
                            onClick={handleExport}
                        >
                            Export ke Excel
                        </LoadingButton>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
};

export default Reports;