import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { useToast } from '../components/ui/use-toast';
import { Toaster } from '../components/ui/toaster';
import {
    Typography,
    Card,
    CardContent,
    Button,
    TextField,
    Grid,
    Snackbar,
    Alert,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Label } from '../components/ui/label';
from '@mui/material';
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
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success' // 'success', 'error', 'warning', 'info'
    });
  
  const { toast } = useToast();
  const [profile, setProfile] = useState({
    username: '',
    email: '',
    nama: '',
    profile_picture: null
  });
  
  const [passwords, setPasswords] = useState({
    oldPassword: '',
    newPassword: ''
  });
  
  const [previewUrl, setPreviewUrl] = useState(null);
  const [file, setFile] = useState(null);

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/profile', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setProfile(data);
        }
      } catch (error) {
        showToast('error', "Gagal mengambil data profile");
      }
    };
    fetchProfile();
  }, []);

  // Cleanup preview URL when component unmounts
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const showToast = (type, message) => {
    toast({
      variant: type === 'error' ? "destructive" : "default",
      title: type === 'error' ? "Error" : "Success",
      description: message,
      duration: 3000,
      className: type === 'error' ? "bg-red-100" : "bg-green-100",
    });
  };

  // Handle template upload
    const handleTemplateUpload = async (type, file) => {
        if (!file) {
            setSnackbar({
                open: true,
                message: 'File template tidak ditemukan',
                severity: 'error'
            });
            return;
        }

        if (file.type !== 'application/pdf') {
            setSnackbar({
                open: true,
                message: 'File harus berupa PDF',
                severity: 'error'
            });
            return;
        }

        const formData = new FormData();
        formData.append('template', file);
        formData.append('jenis', type);

        try {
            const response = await fetch('/api/document/template', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                setTemplates(prev => ({
                    ...prev,
                    [type]: data
                }));

                setSnackbar({
                    open: true,
                    message: 'Template berhasil diunggah',
                    severity: 'success'
                });
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Gagal mengunggah template');
            }
        } catch (error) {
            console.error('Error uploading template:', error);
            setSnackbar({
                open: true,
                message: error.message || 'Gagal mengunggah template',
                severity: 'error'
            });
        };
      
      // Fetch templates on component mount
    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                const response = await fetch('/api/document/templates', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                const data = await response.json();

                const templateMap = data.reduce((acc, template) => {
                    acc[template.jenis] = template;
                    return acc;
                }, {});

                setTemplates(templateMap);
            } catch (error) {
                console.error('Error fetching templates:', error);
                setSnackbar({
                    open: true,
                    message: 'Gagal memuat data template',
                    severity: 'error'
                });
            }
        };

        fetchTemplates();
    }, []);
  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    try {
      // Create preview
      const preview = URL.createObjectURL(selectedFile);
      setPreviewUrl(preview);
      setFile(selectedFile);

      // Prepare form data
      const formData = new FormData();
      formData.append('profile_picture', selectedFile);

      // Upload file
      const response = await fetch('/api/profile/photo-profile', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setProfile(prev => ({
          ...prev,
          profile_picture: data.profile_picture
        }));
        showToast('success', 'Foto profil berhasil diunggah');
      } else {
        throw new Error(data.message || 'Gagal mengunggah foto');
      }
    } catch (error) {
      showToast('error', error.message || 'Gagal mengunggah foto profil');
      setPreviewUrl(null);
      setFile(null);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(profile)
      });

      if (response.ok) {
        showToast('success', "Profile berhasil diperbarui!");
      } else {
        const errorData = await response.json();
        showToast('error', errorData.message || "Gagal memperbarui profile");
      }
    } catch (error) {
      showToast('error', "Terjadi kesalahan saat memperbarui profile");
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/profile/change-password', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(passwords)
      });
      if (response.ok) {
        showToast('success', "Password berhasil diubah!");
        setPasswords({ oldPassword: '', newPassword: '' });
      } else {
        const errorData = await response.json();
        showToast('error', errorData.message || "Gagal mengubah password");
      }
    } catch (error) {
      showToast('error', "Terjadi kesalahan saat mengubah password");
    }
  };

  const handleDeletePhoto = async () => {
    try {
      const response = await fetch('/api/profile/photo-profile', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setProfile(prev => ({ ...prev, profile_picture: null }));
        setPreviewUrl(null);
        setFile(null);
        showToast('success', "Foto profile berhasil dihapus!");
      } else {
        const errorData = await response.json();
        showToast('error', errorData.message || "Gagal menghapus foto");
      }
    } catch (error) {
      showToast('error', "Terjadi kesalahan saat menghapus foto");
    }
  };

  return (
    <>
      <Toaster />
      <div style={{ width: '100%', padding: '2rem' }}>
        {/* Header */}
        <div style={{
          width: '100%',
          background: 'linear-gradient(to right, #BCFB69, #26BBAC)',
          borderRadius: '12px',
          marginBottom: '1rem',
          padding: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ color: 'white', fontWeight: 'bold' }}>Pengaturan</h2>
        </div>
        
        {/* Profile Section */}
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-2xl font-semibold">Profile Settings</h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div className="flex justify-between items-start space-x-6">
                {/* Kolom Kiri - Input */}
                <div className="w-2/3 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={profile.username}
                      onChange={(e) => setProfile(prev => ({ ...prev, username: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nama">Nama</Label>
                    <Input
                      id="nama"
                      value={profile.nama}
                      onChange={(e) => setProfile(prev => ({ ...prev, nama: e.target.value }))}
                    />
                  </div>

                  <div className="flex justify-between">
                    <Button type="submit" variant="default">Update Profile</Button>
                  </div>
                </div>

                {/* Kolom Kanan - Foto Profil */}
                <div className="w-1/3 text-center space-y-4">
                  {/* Display profile picture */}
                  <div className="mb-4">
                    {previewUrl || profile.profile_picture ? (
                      <img
                        src={previewUrl || profile.profile_picture}
                        alt="Profile"
                        className="w-32 h-32 rounded-full object-cover mx-auto"
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-full bg-gray-300 mx-auto flex items-center justify-center text-gray-600">
                        No Image
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 items-center">
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer inline-flex items-center justify-center px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-green-500"
                    >
                      Unggah Foto Profil
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="sr-only"
                      />
                    </label>

                    {(previewUrl || profile.profile_picture) && (
                      <Button
                        variant="destructive"
                        onClick={handleDeletePhoto}
                        className="mt-2"
                      >
                        Hapus Foto Profil
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Password Change Section */}
        <Card>
          <CardHeader>
            <h2 className="text-2xl font-semibold">Change Password</h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="oldPassword">Password Lama</Label>
                <Input
                  id="oldPassword"
                  type="password"
                  value={passwords.oldPassword}
                  onChange={(e) => setPasswords(prev => ({...prev, oldPassword: e.target.value}))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">Password Baru</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords(prev => ({...prev, newPassword: e.target.value}))}
                />
              </div>

              <Button type="submit">Ubah Password</Button>
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
                                                Template aktif: {templates.surat_penerimaan.file_name}
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
                                                Template aktif: {templates.sertifikat.file_name}
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
    </>
  );

};

export default Settings;