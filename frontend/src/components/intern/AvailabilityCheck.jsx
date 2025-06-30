// frontend/src/components/intern/AvailabilityCheck.jsx (Versi Rapi)

import React, { useState } from 'react';
import { Calendar } from 'lucide-react';

// 1. Impor service API kita
// Path-nya mungkin perlu disesuaikan, jadi '../..' karena keluar dari folder 'intern' dan 'components'
import * as api from '../../services/apiService'; 

const AvailabilityCheck = () => {
    const [date, setDate] = useState('');
    const [availability, setAvailability] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleDateChange = (e) => {
        setDate(e.target.value);
        setAvailability(null);
        setError(null);
    };

    // 2. Fungsi checkAvailability jadi lebih bersih
    const checkAvailability = async () => {
        if (!date) {
            setError('Silakan pilih tanggal terlebih dahulu');
            return;
        }

        setLoading(true);
        setError(null); // Reset error sebelum request baru
        try {
            const response = await api.checkInternAvailability(date);
            setAvailability(response.data);
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Terjadi kesalahan saat mengecek ketersediaan';
            setError(errorMessage);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Tidak ada perubahan pada bagian JSX di bawah ini
    return (
        <div className="w-full max-w-4xl mx-auto p-4">
            <div className="bg-white rounded-lg shadow-md">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="flex items-center gap-2 text-xl font-semibold">
                        <Calendar className="h-5 w-5" />
                        Cek Ketersediaan Posisi Magang
                    </h2>
                </div>
                <div className="p-6">
                    <div className="flex gap-4 mb-6">
                        <input
                            type="date"
                            value={date}
                            onChange={handleDateChange}
                            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button 
                            onClick={checkAvailability}
                            disabled={loading || !date}
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Mengecek...' : 'Cek'}
                        </button>
                    </div>

                    {error && (
                        <div className="p-4 mb-4 text-red-700 bg-red-100 rounded-md">
                            {error}
                        </div>
                    )}

                    {availability && (
                        <div className="space-y-4">
                            <div className={`p-4 rounded-md ${availability.available ? 'bg-green-50' : 'bg-yellow-50'}`}>
                                <p className={`font-medium ${availability.available ? 'text-green-800' : 'text-yellow-800'}`}>
                                    {availability.message}
                                </p>
                                {availability.totalOccupied > 0 && (
                                    <p className="text-sm mt-2">
                                        Saat ini terisi: {availability.totalOccupied} dari 50 slot
                                    </p>
                                )}
                            </div>
                            {availability.leavingCount > 0 && (
                                <div className="p-4 bg-blue-50 rounded-md">
                                    <p className="font-medium text-blue-800">Detail peserta yang akan selesai:</p>
                                    <div className="mt-2 space-y-1">
                                        {availability.leavingInterns.map((intern) => (
                                            <div key={intern.id_magang} className="text-sm text-blue-700">
                                                • {intern.nama} ({intern.nama_bidang}) - Selesai pada: {new Date(intern.tanggal_keluar).toLocaleDateString('id-ID')}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AvailabilityCheck;