import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Toaster } from '../components/ui/toaster';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Label } from '../components/ui/label';
import {
  Box,
  Paper,
  Typography,
  Snackbar,
  Alert
} from '@mui/material';

const Settings = () => {
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
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

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
        showSnackbar('Gagal mengambil data profile', 'error');
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

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

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
        showSnackbar('Foto profil berhasil diunggah');
      } else {
        throw new Error(data.message || 'Gagal mengunggah foto');
      }
    } catch (error) {
      showSnackbar(error.message || 'Gagal mengunggah foto profil', 'error');
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
        showSnackbar('Profile berhasil diperbarui!');
      } else {
        const errorData = await response.json();
        showSnackbar(errorData.message || 'Gagal memperbarui profile', 'error');
      }
    } catch (error) {
      showSnackbar('Terjadi kesalahan saat memperbarui profile', 'error');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/profile/change-password', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`        },
        body: JSON.stringify(passwords)
      });

      if (response.ok) {
        showSnackbar('Password berhasil diubah!');
        setPasswords({ oldPassword: '', newPassword: '' });
      } else {
        const errorData = await response.json();
        showSnackbar(errorData.message || 'Gagal mengubah password', 'error');
      }
    } catch (error) {
      showSnackbar('Terjadi kesalahan saat mengubah password', 'error');
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
        showSnackbar('Foto profile berhasil dihapus!');
      } else {
        const errorData = await response.json();
        showSnackbar(errorData.message || 'Gagal menghapus foto', 'error');
      }
    } catch (error) {
      showSnackbar('Terjadi kesalahan saat menghapus foto', 'error');
    }
  };

  return (
    <Box sx={{ width: '100%', minWidth: 0 }}>
      {/* Header */}
      <Box sx={{ 
        width: '100%',
        background: 'linear-gradient(to right, #BCFB69, #26BBAC)',
        borderRadius: '12px',
        mb: 4,
        p: 3
      }}>
        <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
          Pengaturan
        </Typography>
      </Box>
        
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
                  <Button 
                    type="submit" 
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Update Profile
                  </Button>
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
                  <Button 
                    type="button"
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => document.getElementById('file-upload').click()}
                  >
                    Unggah Foto Profil
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </Button>

                  {(previewUrl || profile.profile_picture) && (
                    <Button
                      variant="destructive"
                      onClick={handleDeletePhoto}
                      className="bg-red-600 hover:bg-red-700 text-white"
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

              <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white"
                  >Ubah Password</Button>
            </form>
          </CardContent>
        </Card>

        <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      </Box>

      
  );
};

export default Settings;