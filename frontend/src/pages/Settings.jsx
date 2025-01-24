import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Upload, Trash2, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import {
  Box,
  Typography,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";



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

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');
  const [file, setFile] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });


  // Files state for template section
  const [files, setFiles] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);


  // Fetch profile data on mount
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


  // Load existing template files
  useEffect(() => {
    loadExistingFiles();
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


  // Profile functions
  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;


    try {
      const preview = URL.createObjectURL(selectedFile);
      setPreviewUrl(preview);
      setFile(selectedFile);


      const formData = new FormData();
      formData.append('profile_picture', selectedFile);


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
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
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


  // Template functions
  const loadExistingFiles = async () => {
    try {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/document/templates', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        const activeTemplate = response.data.data.filter(file => file.active === 1);
        setUploadedFiles(activeTemplate);

       
        // Remove the status check since backend doesn't return it
        setUploadedFiles(response.data.data || []);

    } catch (error) {
        console.error('Error loading files:', error);
        showSnackbar('Gagal memuat data template', 'error');
        setUploadedFiles([]);
    } finally {
        setIsLoading(false);
    }
};

const handlePreview = async (file) => {
  setPreviewTitle(file.name || 'Document Preview');
  const token = localStorage.getItem('token');
  const previewUrl = `http://localhost:5000/api/document/preview/${file.id_dokumen}`;

  try {
      setIsPreviewOpen(true);
      setPreviewUrl(previewUrl);
  } catch (error) {
      showSnackbar('Gagal memuat preview dokumen', 'error');
  }
};

const handleTemplateFileChange = async (e) => {
  const selectedFiles = Array.from(e.target.files)
    .filter(file => file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||

                    file.type === 'application/msword')
      .map(file => ({
        id: Date.now() + Math.random(),
        name: file.name,
        size: `${Math.round(file.size / 1024)} KB`,
        status: 'uploading',
        progress: 0,
        file: file
      }));


    if (selectedFiles.length === 0) {
      alert('Please select PDF files only');
      return;
    }


    setFiles(prev => [...prev, ...selectedFiles]);


    for (const fileObj of selectedFiles) {
      await handleTemplateUpload(fileObj.file, fileObj.id);
    }
  };


  const handleTemplateUpload = async (file, fileId) => {
    const formData = new FormData();
    formData.append('file', file);
 
    try {
        const token = localStorage.getItem('token');
        const response = await axios.post(
            'http://localhost:5000/api/document/upload',
            formData,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total
                    );
                    setFiles(prevFiles =>
                        prevFiles.map(f =>
                            f.id === fileId ? { ...f, progress: percentCompleted } : f
                        )
                    );
                }
            }
        );
 
        if (response.data.status === 'success') {
            setFiles(prevFiles =>
                prevFiles.map(f =>
                    f.id === fileId ? {
                        ...f,
                        status: 'completed',
                        serverId: response.data.data.id
                    } : f
                )
            );
            await loadExistingFiles();
            showSnackbar('File berhasil diupload', 'success');
        }
    } catch (error) {
        console.error('Upload error:', error);
        const errorMessage = error.response?.data?.message || 'Error uploading file';
        setFiles(prevFiles =>
            prevFiles.map(f =>
                f.id === fileId ? {
                    ...f,
                    status: 'error',
                    errorMessage
                } : f
            )
        );
        showSnackbar(errorMessage, 'error');
    }
};

const removeTemplate = async (id) => {
  try {
    const token = localStorage.getItem('token');
    await axios.delete(`http://localhost:5000/api/document/template/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    setUploadedFiles(prev => prev.filter(file => file.id_dokumen !== id));
    showSnackbar('Template berhasil dihapus', 'success');
    await loadExistingFiles();
  } catch (error) {
    console.error('Error deleting file:', error);
    showSnackbar('Gagal menghapus template', 'error');
  }
};


  const handleTemplateDrop = async (e) => {
    e.preventDefault();
   
    const droppedFiles = Array.from(e.dataTransfer.files)
      .filter(file => file.type === 'application/pdf')
      .map(file => ({
        id: Date.now() + Math.random(),
        name: file.name,
        size: `${Math.round(file.size / 1024)} KB`,
        status: 'uploading',
        progress: 0,
        file: file
      }));


    if (droppedFiles.length === 0) {
      alert('Please drop PDF files only');
      return;
    }


    setFiles(prev => [...prev, ...droppedFiles]);


    for (const fileObj of droppedFiles) {
      await handleTemplateUpload(fileObj.file, fileObj.id);
    }
  };


  const handleTemplateDragOver = (e) => {
    e.preventDefault();
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
              {/* Left Column - Input Fields */}
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


              {/* Right Column - Profile Picture */}
              <div className="w-1/3 text-center space-y-4">
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
                    onClick={() => document.getElementById('profile-upload').click()}
                  >
                    Unggah Foto Profil
                    <input
                      id="profile-upload"
                      name="profile-upload"
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
      <Card className="mb-6">
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


            <Button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Ubah Password
            </Button>
          </form>
        </CardContent>
      </Card>


      {/* Template Section */}
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-semibold">Change Template</h2>
        </CardHeader>
        <CardContent>
          <div className="w-full p-8">
            <div className="max-w-5xl mx-auto mb-6">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                <h2 className="text-xl font-semibold">Upload files</h2>
              </div>
              <p className="text-sm text-gray-500 mt-2">Select and upload the files of your choice</p>
            </div>


            <div className="max-w-5xl mx-auto">
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-12 mb-8 bg-white text-center"
                onDrop={handleTemplateDrop}
                onDragOver={handleTemplateDragOver}
              >
                <Upload className="w-8 h-8 mx-auto mb-4 text-gray-400" />
                <p className="text-lg mb-2">Choose a file or drag & drop it here.</p>
                <p className="text-sm text-gray-500 mb-6">DOC/DOCX up to 50 MB.</p>
                <Input
                  type="file"
                  onChange={handleTemplateFileChange}
                  className="hidden"
                  id="pdf-upload"
                  multiple
                  accept=".doc,.docx"
                />
                <Button
                  variant="outline"
                  size="lg"
                  className="bg-white"
                  onClick={() => document.getElementById('pdf-upload').click()}
                >
                  Browse File
                </Button>
              </div>


              {/* File list */}
              <div className="space-y-3">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm"
                  >
                    <div className="flex items-center gap-4">
                    <div className="bg-blue-100 text-blue-600 px-3 py-1 rounded text-xs uppercase">
                      DOCX
                    </div>
                      <div>
                        <p className="text-base font-medium">{file.name}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span>{file.size}</span>
                          {file.status === 'uploading' && (
                            <>
                              <span>•</span>
                              <span>Uploading... {file.progress}%</span>
                            </>
                          )}
                          {file.status === 'completed' && (
                            <>
                              <span>•</span>
                              <span className="text-green-600">Completed</span>
                            </>
                          )}
                          {file.status === 'error' && (
                            <>
                              <span>•</span>
                              <span className="text-red-600">{file.errorMessage || 'Error'}</span>
                            </>
                          )}
                        </div>
                        {file.status === 'uploading' && (
                          <div className="w-64 h-1.5 bg-gray-200 rounded-full mt-2">
                            <div
                              className="h-1.5 bg-blue-600 rounded-full"
                              style={{ width: `${file.progress}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10"
                      onClick={() => removeTemplate(file.id, file.serverId)}
                    >
                      <Trash2 className="h-5 w-5 text-gray-500" />
                    </Button>
                  </div>
                ))}
              </div>
              {uploadedFiles.length > 0 ? (
    <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Template Aktif</h3>
        <div className="space-y-3">

        {uploadedFiles.map((file) => (
    <div
        key={file.id_dokumen}
        className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm cursor-pointer"
        onClick={() => handlePreview(file)}
    >
        <div className="flex items-center gap-4">
            <div className="bg-blue-100 text-blue-600 px-3 py-1 rounded text-xs uppercase">
                DOCX
            </div>
            <div>
                <p className="text-base font-medium">{file.name || 'Document'}</p>
                <p className="text-sm text-gray-500">Click to preview</p>
            </div>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={(e) => {
                e.stopPropagation();
                removeTemplate(file.id_dokumen);
            }}>
                <Trash2 className="h-5 w-5 text-gray-500" />
            </Button>
        </div>
    </div>
))}

        </div>
    </div>
) : (
    <div className="mt-8">
        <div className="text-center text-gray-500">
            Belum ada template yang diupload
        </div>
    </div>
)}



{/* Add Dialog component just before the last closing div of the Template Section */}
<Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
    <DialogContent className="max-w-6xl w-full">
        <DialogHeader>
            <DialogTitle>{previewTitle}</DialogTitle>
        </DialogHeader>
        <div className="h-[95vh]">
            <embed
                src={previewUrl}
                type="application/pdf"
                width="100%"
                height="100%"
                style={{ border: 'none' }}

            />
        </div>
    </DialogContent>
</Dialog>
</div>
</div>
        </CardContent>
      </Card>


      {/* Snackbar for notifications */}
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



