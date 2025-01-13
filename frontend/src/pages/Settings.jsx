// frontend/src/pages/Settings.jsx
import React, { useState, useEffect } from 'react';
import {
    Typography,
    Card,
    CardContent,
    Button,
    TextField,
    Grid
} from '@mui/material';
import { useAuth } from '../contexts/authContext.jsx';

const Settings = () => {
    const { user } = useAuth();
    const [profile, setProfile] = useState({
        nama: user?.nama || '',
        email: user?.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [templates, setTemplates] = useState({
        surat_penerimaan: null,
        sertifikat: null
    });

    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                const response = await fetch('/api/settings/templates');
                const data = await response.json();
                
                const templateMap = data.reduce((acc, template) => {
                    acc[template.jenis] = template;
                    return acc;
                }, {});

                setTemplates(templateMap);
            } catch (error) {
                console.error('Error fetching templates:', error);
            }
        };

        fetchTemplates();
    }, []);

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/settings/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(profile)
            });

            if (response.ok) {
                // Handle success
            }
        } catch (error) {
            console.error('Error updating profile:', error);
        }
    };

    const handleTemplateUpload = async (type, file) => {
        const formData = new FormData();
        formData.append('template', file);
        formData.append('jenis', type);

        try {
            const response = await fetch('/api/settings/template', {
                method: 'POST',
                body: formData
            });
            // Melanjutkan Settings.jsx
            if (response.ok) {
                const data = await response.json();
                setTemplates(prev => ({
                    ...prev,
                    [type]: data
                }));
            }
        } catch (error) {
            console.error('Error uploading template:', error);
        }
    };

    return (
        <div className="p-6">
            <Typography variant="h4" className="mb-6">
                Pengaturan
            </Typography>

            <div className="space-y-6">
                {/* Profile Settings */}
                <Card>
                    <CardContent>
                        <Typography variant="h6" className="mb-4">
                            Profil
                        </Typography>
                        <form onSubmit={handleProfileUpdate} className="space-y-4">
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="Nama"
                                        value={profile.nama}
                                        onChange={(e) => setProfile(prev => ({
                                            ...prev,
                                            nama: e.target.value
                                        }))}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="Email"
                                        type="email"
                                        value={profile.email}
                                        onChange={(e) => setProfile(prev => ({
                                            ...prev,
                                            email: e.target.value
                                        }))}
                                    />
                                </Grid>
                            </Grid>

                            <Typography variant="h6" className="mt-6 mb-4">
                                Ubah Password
                            </Typography>
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        fullWidth
                                        label="Password Saat Ini"
                                        type="password"
                                        value={profile.currentPassword}
                                        onChange={(e) => setProfile(prev => ({
                                            ...prev,
                                            currentPassword: e.target.value
                                        }))}
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        fullWidth
                                        label="Password Baru"
                                        type="password"
                                        value={profile.newPassword}
                                        onChange={(e) => setProfile(prev => ({
                                            ...prev,
                                            newPassword: e.target.value
                                        }))}
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        fullWidth
                                        label="Konfirmasi Password"
                                        type="password"
                                        value={profile.confirmPassword}
                                        onChange={(e) => setProfile(prev => ({
                                            ...prev,
                                            confirmPassword: e.target.value
                                        }))}
                                    />
                                </Grid>
                            </Grid>

                            <Button
                                type="submit"
                                variant="contained"
                                color="primary"
                            >
                                Simpan Perubahan
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Template Settings */}
                <Card>
                    <CardContent>
                        <Typography variant="h6" className="mb-4">
                            Template Dokumen
                        </Typography>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <div className="space-y-2">
                                    <Typography>
                                        Template Surat Penerimaan
                                    </Typography>
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="file"
                                            accept=".pdf"
                                            onChange={(e) => handleTemplateUpload('surat_penerimaan', e.target.files[0])}
                                            style={{ display: 'none' }}
                                            id="surat-penerimaan-upload"
                                        />
                                        <label htmlFor="surat-penerimaan-upload">
                                            <Button
                                                variant="contained"
                                                component="span"
                                            >
                                                Upload Template
                                            </Button>
                                        </label>
                                        {templates.surat_penerimaan && (
                                            <Typography variant="body2" color="textSecondary">
                                                Template aktif
                                            </Typography>
                                        )}
                                    </div>
                                </div>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <div className="space-y-2">
                                    <Typography>
                                        Template Sertifikat
                                    </Typography>
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="file"
                                            accept=".pdf"
                                            onChange={(e) => handleTemplateUpload('sertifikat', e.target.files[0])}
                                            style={{ display: 'none' }}
                                            id="sertifikat-upload"
                                        />
                                        <label htmlFor="sertifikat-upload">
                                            <Button
                                                variant="contained"
                                                component="span"
                                            >
                                                Upload Template
                                            </Button>
                                        </label>
                                        {templates.sertifikat && (
                                            <Typography variant="body2" color="textSecondary">
                                                Template aktif
                                            </Typography>
                                        )}
                                    </div>
                                </div>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};export default Settings;
            