import React from 'react';
import AvailabilityCheck from '../components/intern/AvailabilityCheck';

const AvailabilityCheckPage = () => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Cek Ketersediaan Posisi</h1>
        <p className="text-gray-600 mt-1">
          Periksa ketersediaan posisi magang berdasarkan tanggal yang diinginkan
        </p>
      </div>
      
      <AvailabilityCheck />
    </div>
  );
};

export default AvailabilityCheckPage;