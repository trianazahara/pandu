import React, { useState, useEffect } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Button } from '@mui/material';

const InternManagement = () => {
  // State untuk menyimpan data intern
  const [interns, setInterns] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch data interns
  useEffect(() => {
    fetchInterns();
  }, []);

  const fetchInterns = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/intern');
      const data = await response.json();
      setInterns(data.data);
    } catch (error) {
      console.error('Error fetching interns:', error);
    }
    setLoading(false);
  };

  // Handle edit
  const handleEdit = (intern) => {
    // Logic untuk edit
    console.log('Edit:', intern);
  };

  // Handle delete 
  const handleDelete = async (id) => {
    try {
      const response = await fetch(`/api/intern/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        fetchInterns(); // Refresh data setelah delete
      }
    } catch (error) {
      console.error('Error deleting intern:', error);
    }
  };

  return (
    <div style={{ height: 400, width: '100%' }}>
      {/* DataGrid component */}
      <DataGrid
        rows={interns}
        columns={[
          { field: 'nama', headerName: 'Nama', width: 200 },
          { field: 'nim', headerName: 'NIM', width: 130 },
          { field: 'institusi', headerName: 'Institusi', width: 200 },
          { field: 'jumlahHari', headerName: 'Jumlah Hari Magang', width: 150 },
          { field: 'status', headerName: 'Status', width: 130 },
          {
            field: 'actions',
            headerName: 'Actions',
            width: 200,
            renderCell: (params) => (
              <>
                <Button onClick={() => handleEdit(params.row)}>Edit</Button>
                <Button onClick={() => handleDelete(params.row.id)}>Delete</Button>
              </>
            )
          }
        ]}
        pageSize={10}
        autoHeight
        loading={loading}
      />
    </div>
  );
};

export default InternManagement;