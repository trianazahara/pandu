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

const Assessment = () => {
    const [interns, setInterns] = useState([]);
    const [selectedIntern, setSelectedIntern] = useState(null);
    const [showAssessmentForm, setShowAssessmentForm] = useState(false);
    const [assessment, setAssessment] = useState({
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
        severity: 'success' // 'success', 'error', 'warning', 'info'
    });

    // Fetch data peserta magang yang sudah selesai
    const fetchCompletedInterns = async () => {
        try {
            const response = await fetch('/api/intern?status=selesai', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            setInterns(data.data);
        } catch (error) {
            console.error('Error fetching completed interns:', error);
            setSnackbar({
                open: true,
                message: 'Gagal memuat data peserta magang',
                severity: 'error'
            });
        }
    };

    useEffect(() => {
        fetchCompletedInterns();
    }, []);

    // Handle submit penilaian
    const handleSubmitAssessment = async () => {
        try {
            const response = await fetch(`/api/assessment/${selectedIntern.id_magang}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(assessment)
            });

            if (response.ok) {
                setShowAssessmentForm(false);
                setSelectedIntern(null);
                setAssessment({});
                fetchCompletedInterns();

                setSnackbar({
                    open: true,
                    message: 'Penilaian berhasil disimpan',
                    severity: 'success'
                });
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Gagal menyimpan penilaian');
            }
        } catch (error) {
            console.error('Error submitting assessment:', error);
            setSnackbar({
                open: true,
                message: error.message || 'Gagal menyimpan penilaian',
                severity: 'error'
            });
        }
    };

    // Handle generate sertifikat
    const handleGenerateCertificate = async (internId) => {
        try {
            const response = await fetch(`/api/document/certificate/${internId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                // Download PDF
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Sertifikat_${internId}.pdf`;
                document.body.appendChild(a);
                a.click();
                a.remove();

                setSnackbar({
                    open: true,
                    message: 'Sertifikat berhasil di-generate',
                    severity: 'success'
                });
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Gagal generate sertifikat');
            }
        } catch (error) {
            console.error('Certificate Generation Error:', error);
            setSnackbar({
                open: true,
                message: error.message || 'Gagal generate sertifikat',
                severity: 'error'
            });
        }
    };

    return (
        <div className="p-6">
            <Typography variant="h4" className="mb-6">
                Penilaian Anak Magang
            </Typography>

            {/* Daftar Peserta Magang */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {interns.map((intern) => (
                    <Card key={intern.id_magang}>
                        <CardContent>
                            <Typography variant="h6">{intern.nama}</Typography>
                            <Typography color="textSecondary">
                                {intern.nama_institusi}
                            </Typography>
                            <Typography color="textSecondary">
                                Bidang: {intern.nama_bidang}
                            </Typography>
                            <Typography color="textSecondary">
                                Periode: {new Date(intern.tanggal_masuk).toLocaleDateString()} - {' '}
                                {new Date(intern.tanggal_keluar).toLocaleDateString()}
                            </Typography>

                            <div className="mt-4 space-x-2 flex justify-between">
                                <Button
                                    variant="contained"
                                    onClick={() => {
                                        setSelectedIntern(intern);
                                        setShowAssessmentForm(true);
                                    }}
                                >
                                    Nilai
                                </Button>
                                <Button
                                    variant="outlined"
                                    onClick={() => handleGenerateCertificate(intern.id_magang)}
                                >
                                    Generate Sertifikat
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Form Penilaian */}
            <Dialog
                open={showAssessmentForm}
                onClose={() => {
                    setShowAssessmentForm(false);
                    setSelectedIntern(null);
                }}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    Penilaian untuk {selectedIntern?.nama}
                </DialogTitle>
                <DialogContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                        <Typography variant="h6" className="col-span-2">
                            Kompetensi Dasar
                        </Typography>
                        
                        <TextField
                            label="Kemampuan Teamwork"
                            type="number"
                            value={assessment.nilai_teamwork}
                            onChange={(e) => setAssessment(prev => ({
                                ...prev,
                                nilai_teamwork: e.target.value
                            }))}
                            inputProps={{ min: 0, max: 100 }}
                        />

                        {/* Tambahkan field penilaian lainnya */}
                        
                        <div className="col-span-2 mt-4">
                            <Button
                                variant="contained"
                                onClick={handleSubmitAssessment}
                                fullWidth
                            >
                                Simpan Penilaian
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Snackbar Notifikasi */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert
                    onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </div>
    );
};

export default Assessment;