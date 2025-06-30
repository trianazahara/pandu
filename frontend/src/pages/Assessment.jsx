// frontend/src/pages/Assessment.jsx
import React, { useState, useEffect } from 'react';
import {
    Typography,
    Card,
    CardContent,
    TextField,
    Button,
    Dialog,
    Snackbar,
    Alert
} from '@mui/material';
import * as api from '../services/apiService';

// Data untuk form penilaian agar tidak ditulis berulang-ulang
const assessmentFields = [
    { key: 'nilai_teamwork', label: 'Kemampuan Teamwork' },
    { key: 'nilai_komunikasi', label: 'Kemampuan Komunikasi' },
    { key: 'nilai_pengambilan_keputusan', label: 'Pengambilan Keputusan' },
    { key: 'nilai_kualitas_kerja', label: 'Kualitas Kerja' },
    { key: 'nilai_teknologi', label: 'Penguasaan Teknologi' },
    { key: 'nilai_disiplin', label: 'Disiplin' },
    { key: 'nilai_tanggungjawab', label: 'Tanggung Jawab' },
    { key: 'nilai_kerjasama', label: 'Kerja Sama' },
    { key: 'nilai_inisiatif', label: 'Inisiatif' },
    { key: 'nilai_kejujuran', label: 'Kejujuran' },
    { key: 'nilai_kebersihan', label: 'Kebersihan & Kerapihan' },
];

const Assessment = () => {
    const [interns, setInterns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedIntern, setSelectedIntern] = useState(null);
    const [showAssessmentForm, setShowAssessmentForm] = useState(false);

    // Initial state untuk form
    const initialAssessmentState = assessmentFields.reduce((acc, field) => {
        acc[field.key] = '';
        return acc;
    }, {});
    
    const [assessment, setAssessment] = useState(initialAssessmentState);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const showSnackbar = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    // 2. Fungsi fetch data jadi lebih bersih
    const fetchCompletedInterns = async () => {
        setLoading(true);
        try {
            const response = await api.getCompletedInterns();
            setInterns(response.data.data);
        } catch (error) {
            console.error('Error fetching completed interns:', error);
            showSnackbar('Gagal memuat data peserta magang', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCompletedInterns();
    }, []);

    // 3. Handler untuk submit dan generate sertifikat jadi lebih rapi
    const handleSubmitAssessment = async () => {
        if (!selectedIntern) return;
        try {
            await api.submitAssessment(selectedIntern.id_magang, assessment);
            showSnackbar('Penilaian berhasil disimpan', 'success');
            handleCloseDialog();
            fetchCompletedInterns(); // Refresh data untuk update status (jika ada)
        } catch (error) {
            console.error('Error submitting assessment:', error);
            showSnackbar(error.response?.data?.message || 'Gagal menyimpan penilaian', 'error');
        }
    };

    const handleGenerateCertificate = async (internId, internName) => {
        showSnackbar('Sedang men-generate sertifikat...', 'info');
        try {
            const response = await api.generateCertificate(internId);
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Sertifikat_${internName.replace(/\s+/g, '_')}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Certificate Generation Error:', error);
            showSnackbar(error.response?.data?.message || 'Gagal generate sertifikat', 'error');
        }
    };

    const handleOpenDialog = (intern) => {
        setSelectedIntern(intern);
        setShowAssessmentForm(true);
    };

    const handleCloseDialog = () => {
        setShowAssessmentForm(false);
        setSelectedIntern(null);
        setAssessment(initialAssessmentState); // Reset form setelah ditutup
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        // Batasi nilai antara 0 dan 100
        const sanitizedValue = Math.max(0, Math.min(100, Number(value)));
        setAssessment(prev => ({ ...prev, [name]: sanitizedValue }));
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Penilaian Anak Magang
            </Typography>

            {loading ? <Typography>Memuat data...</Typography> : (
                <Grid container spacing={3}>
                    {interns.map((intern) => (
                        <Grid item xs={12} sm={6} md={4} key={intern.id_magang}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6">{intern.nama}</Typography>
                                    <Typography color="textSecondary">{intern.nama_institusi}</Typography>
                                    <Typography color="textSecondary">Bidang: {intern.nama_bidang}</Typography>
                                    <Typography color="textSecondary" variant="body2">
                                        Periode: {new Date(intern.tanggal_masuk).toLocaleDateString('id-ID')} - {new Date(intern.tanggal_keluar).toLocaleDateString('id-ID')}
                                    </Typography>
                                    <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                                        <Button variant="contained" onClick={() => handleOpenDialog(intern)}>Nilai</Button>
                                        <Button variant="outlined" onClick={() => handleGenerateCertificate(intern.id_magang, intern.nama)}>Generate Sertifikat</Button>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            <Dialog open={showAssessmentForm} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <DialogTitle>Penilaian untuk {selectedIntern?.nama}</DialogTitle>
                <DialogContent>
                    <Box component="form" sx={{ pt: 2 }}>
                        <Grid container spacing={2}>
                            {assessmentFields.map(field => (
                                <Grid item xs={12} sm={6} key={field.key}>
                                    <TextField
                                        fullWidth
                                        label={field.label}
                                        name={field.key}
                                        type="number"
                                        value={assessment[field.key]}
                                        onChange={handleInputChange}
                                        InputProps={{ inputProps: { min: 0, max: 100 } }}
                                    />
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                </DialogContent>
                <Box sx={{ p: 3, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <Button onClick={handleCloseDialog}>Batal</Button>
                    <Button variant="contained" onClick={handleSubmitAssessment}>Simpan Penilaian</Button>
                </Box>
            </Dialog>

            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                <Alert onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default Assessment;