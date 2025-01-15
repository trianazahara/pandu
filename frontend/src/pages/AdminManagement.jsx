import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Snackbar,
  Alert,
  Card,
  CardContent,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import axios from 'axios';

const AdminManagement = () => {
    const [admins, setAdmins] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedAdmin, setSelectedAdmin] = useState(null);
    const [formData, setFormData] = useState({
      username: '',
      password: '',
      email: '',
      nama: '',
      role: 'admin'
    });
    const [snackbar, setSnackbar] = useState({
      open: false,
      message: '',
      severity: 'success'
    });
  
    // Fetch admins data
    const fetchAdmins = async () => {
      try {
        const response = await axios.get('/api/admin', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        setAdmins(response.data);
      } catch (error) {
        showSnackbar('Error fetching admin data', 'error');
      }
    };
  
    useEffect(() => {
      fetchAdmins();
    }, []);
  
    const handleOpenDialog = (admin = null) => {
      if (admin) {
        setSelectedAdmin(admin);
        setFormData({
          username: admin.username,
          email: admin.email,
          nama: admin.nama,
          password: '',
          role: admin.role
        });
      } else {
        setSelectedAdmin(null);
        setFormData({
          username: '',
          password: '',
          email: '',
          nama: '',
          role: 'admin'
        });
      }
      setOpenDialog(true);
    };
  
    const showSnackbar = (message, severity = 'success') => {
      setSnackbar({ open: true, message, severity });
    };
  
    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        if (selectedAdmin) {
          // Update admin
          await axios.patch(`/api/admin/${selectedAdmin.id_users}`, formData, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          showSnackbar('Admin updated successfully');
        } else {
          // Add new admin
          await axios.post('/api/admin', formData, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          showSnackbar('Admin added successfully');
        }
        setOpenDialog(false);
        fetchAdmins();
      } catch (error) {
        showSnackbar(error.response?.data?.message || 'Error processing request', 'error');
      }
    };
  
    const handleDelete = async (id_users) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus admin ini?')) {
          try {
            const response = await axios.delete(`/api/admin/${id_users}`, {
              headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
      
            if (response.status === 200) {
              showSnackbar('Admin berhasil dihapus');
              fetchAdmins(); // Refresh data setelah berhasil hapus
            }
          } catch (error) {
            console.error('Delete error:', error);
            showSnackbar(
              error.response?.data?.message || 'Gagal menghapus admin', 
              'error'
            );
          }
        }
      };

    return (
        <Box sx={{ width: '100%', minWidth: 0 }}>
          {/* Header Section */}
          <Box sx={{ 
            width: '100%',
            background: 'linear-gradient(to right, #BCFB69, #26BBAC)',
            borderRadius: '12px',
            mb: 4,
            p: 3,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>

        <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
          Manajemen Admin
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{
            bgcolor: 'white',
            color: '#26BBAC',
            '&:hover': { bgcolor: '#f5f5f5' },
            px: 3,
            py: 1.5,
            borderRadius: '8px',
          }}
        >
          TAMBAH ADMIN
        </Button>
      </Box>

      <TableContainer 
        component={Paper} 
        sx={{ 
          width: '100%',
          minWidth: 0,
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#f8f9fa' }}>
              <TableCell sx={{ fontWeight: '600' }}>Nama</TableCell>
              <TableCell sx={{ fontWeight: '600' }}>Username</TableCell>
              <TableCell sx={{ fontWeight: '600' }}>Email</TableCell>
              <TableCell sx={{ fontWeight: '600' }}>Role</TableCell>
              <TableCell sx={{ fontWeight: '600' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>

            {admins.map((admin) => (
              <TableRow 
                key={admin.id_users}
                sx={{ '&:hover': { bgcolor: '#f8f9fa' } }}
              >
                <TableCell>{admin.nama}</TableCell>
                <TableCell>{admin.username}</TableCell>
                <TableCell>{admin.email}</TableCell>
                <TableCell>
                  <Box
                    sx={{
                      display: 'inline-block',
                      bgcolor: admin.role === 'admin' ? '#4CAF50' : '#2196F3',
                      color: 'white',
                      px: 2,
                      py: 0.5,
                      borderRadius: 1,
                      fontSize: '0.875rem'
                    }}
                  >
                    {admin.role}
                  </Box>
                </TableCell>
                <TableCell>
                  <IconButton 
                    onClick={() => handleOpenDialog(admin)} 
                    sx={{ color: '#2196F3', mr: 1 }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton 
                    onClick={() => handleDelete(admin.id_users)}
                    sx={{ color: '#f44336' }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Form Dialog - dengan styling yang lebih menarik */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)}
        maxWidth="sm" 
        fullWidth>
        <DialogTitle>
          {selectedAdmin ? 'Edit Admin' : 'Add New Admin'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ py: 3 }}>
            <TextField
              autoFocus
              label="Nama"
              value={formData.nama}
              onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              margin="normal"
              required

            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              margin="normal"
              required={!selectedAdmin}
              helperText={selectedAdmin ? "Leave blank to keep current password" : ""}
              />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button 
              onClick={() => setOpenDialog(false)}
              sx={{ 
                color: '#9e9e9e',
                '&:hover': { bgcolor: '#f5f5f5' }
              }}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained"
              sx={{ 
                px: 3,
                borderRadius: 1,
                boxShadow: 'none'
              }}
            >
              {selectedAdmin ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Snackbar dengan styling yang lebih menarik */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ 
            width: '100%',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            borderRadius: 1
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
      </Box>
  );
};

export default AdminManagement;