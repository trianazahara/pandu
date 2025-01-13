// frontend/src/pages/InternManagement.jsx
import React, { useState, useEffect } from 'react';
import { 
    DataGrid,
    GridToolbar
} from '@mui/x-data-grid';
import { Button, Typography } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { InternForm } from '../components/intern/InternForm';

const InternManagement = () => {
    const [interns, setInterns] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [selectedIntern, setSelectedIntern] = useState(null);
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [totalRows, setTotalRows] = useState(0);

    const columns = [
        { field: 'nama', headerName: 'Nama', flex: 1 },
        { field: 'nama_institusi', headerName: 'Institusi', flex: 1 },
        { field: 'nama_bidang', headerName: 'Bidang', flex: 1 },
        { 
            field: 'tanggal_masuk', 
            headerName: 'Tanggal Masuk',
            flex: 1,
            valueFormatter: (params) => new Date(params.value).toLocaleDateString()
        },
        { 
            field: 'tanggal_keluar',
            headerName: 'Tanggal Keluar',
            flex: 1,
            valueFormatter: (params) => new Date(params.value).toLocaleDateString()
        },
        { 
            field: 'status',
            headerName: 'Status',
            flex: 1,
            renderCell: (params) => {
                const statusColors = {
                    aktif: 'bg-green-500',
                    selesai: 'bg-gray-500',
                    not_yet: 'bg-yellow-500'
                };

                return (
                    <div className={`px-2 py-1 rounded-full text-white ${statusColors[params.value]}`}>
                        {params.value}
                    </div>
                );
            }
        },
        {
            field: 'actions',
            headerName: 'Aksi',
            flex: 1,
            renderCell: (params) => (
                <div className="flex space-x-2">
                    <Button
                        size="small"
                        variant="contained"
                        onClick={() => handleEdit(params.row)}
                    >
                        Edit
                    </Button>
                    <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleDetail(params.row)}
                    >
                        Detail
                    </Button>
                </div>
            )
        }
    ];

    const fetchInterns = async () => {
        setLoading(true);
        try {
            const response = await fetch(
                `/api/intern?page=${page + 1}&limit=${pageSize}`
            );
            const data = await response.json();
            setInterns(data.data);
            setTotalRows(data.pagination.total);
        } catch (error) {
            console.error('Error fetching interns:', error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchInterns();
    }, [page, pageSize]);

    const handleSubmit = async (formData) => {
        try {
            const method = selectedIntern ? 'PUT' : 'POST';
            const url = selectedIntern 
                ? `/api/intern/${selectedIntern.id_magang}`
                : '/api/intern';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                setShowForm(false);
                setSelectedIntern(null);
                fetchInterns();
            }
        } catch (error) {
            console.error('Error submitting form:', error);
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <Typography variant="h4">
                    Manajemen Data Anak Magang
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => {
                        setSelectedIntern(null);
                        setShowForm(true);
                    }}
                >
                    Tambah Data
                </Button>
            </div>

            <div style={{ height: 600, width: '100%' }}>
                <DataGrid
                    rows={interns}
                    columns={columns}
                    pageSize={pageSize}
                    rowCount={totalRows}
                    loading={loading}
                    paginationMode="server"
                    page={page}
                    onPageChange={(newPage) => setPage(newPage)}
                    onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
                    components={{
                        Toolbar: GridToolbar
                    }}
                    getRowId={(row) => row.id_magang}
                />
            </div>

            {showForm && (
                <Dialog
                    open={showForm}
                    onClose={() => {
                        setShowForm(false);
                        setSelectedIntern(null);
                    }}
                    maxWidth="md"
                    fullWidth
                >
                    <DialogTitle>
                        {selectedIntern ? 'Edit Data' : 'Tambah Data'} Anak Magang
                    </DialogTitle>
                    <DialogContent>
                        <InternForm
                            onSubmit={handleSubmit}
                            initialData={selectedIntern}
                        />
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
};
export default InternManagement