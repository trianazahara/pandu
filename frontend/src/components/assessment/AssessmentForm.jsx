// frontend/src/components/assessment/AssessmentForm.jsx
import React from 'react';
import { TextField, Typography, Grid } from '@mui/material';

const AssessmentForm = ({ assessment, setAssessment }) => {
    const handleChange = (field, value) => {
        setAssessment(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const competencies = [
        {
            title: 'Kompetensi Dasar',
            fields: [
                { name: 'nilai_teamwork', label: 'Kemampuan Teamwork' },
                { name: 'nilai_komunikasi', label: 'Kemampuan Komunikasi' },
                { name: 'nilai_pengambilan_keputusan', label: 'Kemampuan Pengambilan Keputusan' },
                { name: 'nilai_kualitas_kerja', label: 'Kualitas Hasil Kerja' },
                { name: 'nilai_teknologi', label: 'Keterampilan Teknologi' }
            ]
        },
        {
            title: 'Aspek Non-Teknis',
            fields: [
                { name: 'nilai_disiplin', label: 'Disiplin' },
                { name: 'nilai_tanggungjawab', label: 'Tanggung Jawab' },
                { name: 'nilai_kerjasama', label: 'Kerjasama' },
                { name: 'nilai_inisiatif', label: 'Inisiatif' },
                { name: 'nilai_kejujuran', label: 'Kejujuran' },
                { name: 'nilai_kebersihan', label: 'Kebersihan dan Kerapian' }
            ]
        }
    ];

    return (
        <div className="space-y-6">
            {competencies.map((category, idx) => (
                <div key={idx}>
                    <Typography variant="h6" className="mb-4">
                        {category.title}
                    </Typography>
                    <Grid container spacing={3}>
                        {category.fields.map((field) => (
                            <Grid item xs={12} sm={6} key={field.name}>
                                <TextField
                                    fullWidth
                                    label={field.label}
                                    type="number"
                                    value={assessment[field.name]}
                                    onChange={(e) => handleChange(field.name, e.target.value)}
                                    inputProps={{
                                        min: 0,
                                        max: 100,
                                        step: 1
                                    }}
                                    helperText="Nilai 0-100"
                                />
                            </Grid>
                        ))}
                    </Grid>
                </div>
            ))}
        </div>
    );
};

export default AssessmentForm;