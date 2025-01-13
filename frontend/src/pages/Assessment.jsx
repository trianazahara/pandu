// frontend/src/pages/Assessment.jsx
import React, { useState, useEffect } from 'react';
import {
    Typography,
    Card,
    CardContent,
    TextField,
    Button,
    Dialog
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

    const fetchCompletedInterns = async () => {
        try {
            const response = await fetch('/api/intern?status=selesai');
            const data = await response.json();
            setInterns(data.data);
        } catch (error) {
            console.error('Error fetching completed interns:', error);
        }
    };

    useEffect(() => {
        fetchCompletedInterns();
    }, []);

    const handleSubmitAssessment = async () => {
        try {
            const response = await fetch(`/api/assessment/${selectedIntern.id_magang}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(assessment)
            });

            if (response.ok) {
                setShowAssessmentForm(false);
                setSelectedIntern(null);
                setAssessment({});
                fetchCompletedInterns();
            }
        } catch (error) {
            console.error('Error submitting assessment:', error);
        }
    };

    const handleGenerateCertificate = async (internId) => {
        try {
            const response = await fetch(`/api/document/certificate/${internId}`, {
                method: 'POST'
            });

            if (response.ok) {
                // Handle PDF download
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'sertifikat.pdf';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error('Error generating certificate:', error);
        }
    };

    return (
        <div className="p-6">
            <Typography variant="h4" className="mb-6">
                Penilaian Anak Magang
            </Typography>

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

                            <div className="mt-4 space-x-2">
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
        </div>
    );
};

export default Assessment
// export { Dashboard, InternManagement, AvailabilityCheck, Assessment };