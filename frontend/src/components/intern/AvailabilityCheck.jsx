// frontend/src/components/intern/AvailabilityCheck.jsx
import React, { useState } from 'react';
import { Card, CardContent, Typography, Alert } from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';

const AvailabilityCheck = () => {
    const [selectedDate, setSelectedDate] = useState(null);
    const [availability, setAvailability] = useState(null);
    const [loading, setLoading] = useState(false);

    const checkAvailability = async (date) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/intern/availability?date=${date.toISOString()}`);
            const data = await response.json();
            setAvailability(data);
        } catch (error) {
            console.error('Error checking availability:', error);
        }
        setLoading(false);
    };

    return (
        <div className="space-y-4">
            <Card>
                <CardContent>
                    <Typography variant="h6" className="mb-4">
                        Check Ketersediaan Posisi Magang
                    </Typography>

                    <LocalizationProvider dateAdapter={AdapterDateFns} locale={id}>
                        <DatePicker
                            label="Pilih Tanggal"
                            value={selectedDate}
                            onChange={(date) => {
                                setSelectedDate(date);
                                if (date) {
                                    checkAvailability(date);
                                }
                            }}
                            renderInput={(params) => <TextField {...params} fullWidth />}
                        />
                    </LocalizationProvider>
                </CardContent>
            </Card>

            {loading ? (
                <div className="flex justify-center">
                    <CircularProgress />
                </div>
            ) : availability && (
                <div className="space-y-4">
                    <Alert severity={availability.available ? "success" : "error"}>
                        {availability.available
                            ? `Tersedia ${availability.availableSlots} slot kosong`
                            : "Tidak ada slot tersedia"}
                    </Alert>

                    {availability.leavingInterns.length > 0 && (
                        <Card>
                            <CardContent>
                                <Typography variant="h6" className="mb-4">
                                    Anak Magang yang Akan Selesai dalam 7 Hari
                                </Typography>
                                <div className="space-y-2">
                                    {availability.leavingInterns.map((intern) => (
                                        <div key={intern.id_magang} className="p-2 border rounded">
                                            <Typography>
                                                {intern.nama} - {intern.nama_institusi}
                                            </Typography>
                                            <Typography variant="body2" color="textSecondary">
                                                Bidang: {intern.nama_bidang}
                                            </Typography>
                                            <Typography variant="body2" color="textSecondary">
                                                Selesai: {new Date(intern.tanggal_keluar).toLocaleDateString()}
                                            </Typography>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
};

export default AvailabilityCheck;
// export { StatCards, InternForm, AvailabilityCheck };