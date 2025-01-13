// frontend/src/pages/Reports.jsx
import React, { useState } from 'react';
import {
    Typography,
    Card,
    CardContent,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { FileDownload as FileDownloadIcon } from '@mui/icons-material';

const Reports = () => {
    const [filters, setFilters] = useState({
        status: '',
        bidang: '',
        start_date: null,
        end_date: null
    });

    const handleExport = async () => {
        try {
            const queryParams = new URLSearchParams();
            
            if (filters.status) {
                queryParams.append('status', filters.status);
            }
            if (filters.bidang) {
                queryParams.append('bidang', filters.bidang);
            }
            if (filters.start_date) {
                queryParams.append('start_date', filters.start_date.toISOString());
            }
            if (filters.end_date) {
                queryParams.append('end_date', filters.end_date.toISOString());
            }

            const response = await fetch(`/api/report/export?${queryParams}`);
            const blob = await response.blob();
            
            // Create download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'data_anak_magang.xlsx';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Error exporting data:', error);
        }
    };

    return (
        <div className="p-6">
            <Typography variant="h4" className="mb-6">
                Rekap Data Anak Magang
            </Typography>

            <Card className="mb-6">
                <CardContent>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={3}>
                            <FormControl fullWidth>
                                <InputLabel>Status</InputLabel>
                                <Select
                                    value={filters.status}
                                    onChange={(e) => setFilters(prev => ({
                                        ...prev,
                                        status: e.target.value
                                    }))}
                                >
                                    <MenuItem value="">Semua</MenuItem>
                                    <MenuItem value="aktif">Aktif</MenuItem>
                                    <MenuItem value="selesai">Selesai</MenuItem>
                                    <MenuItem value="not_yet">Belum Mulai</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <FormControl fullWidth>
                                <InputLabel>Bidang</InputLabel>
                                <Select
                                    value={filters.bidang}
                                    onChange={(e) => setFilters(prev => ({
                                        ...prev,
                                        bidang: e.target.value
                                    }))}
                                >
                                    <MenuItem value="">Semua</MenuItem>
                                    <MenuItem value="sekretariat">Sekretariat</MenuItem>
                                    <MenuItem value="pgtk">PGTK</MenuItem>
                                    <MenuItem value="psma">PSMA</MenuItem>
                                    <MenuItem value="psmk">PSMK</MenuItem>
                                    <MenuItem value="sarpras">Sarpras</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <DatePicker
                                label="Tanggal Mulai"
                                value={filters.start_date}
                                onChange={(date) => setFilters(prev => ({
                                    ...prev,
                                    start_date: date
                                }))}
                                renderInput={(params) => <TextField {...params} fullWidth />}
                            />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <DatePicker
                                label="Tanggal Selesai"
                                value={filters.end_date}
                                onChange={(date) => setFilters(prev => ({
                                    ...prev,
                                    end_date: date
                                }))}
                                renderInput={(params) => <TextField {...params} fullWidth />}
                            />
                        </Grid>
                    </Grid>

                    <div className="mt-4">
                        <Button
                            variant="contained"
                            startIcon={<FileDownloadIcon />}
                            onClick={handleExport}
                        >
                            Export ke Excel
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default Reports;