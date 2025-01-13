import React from 'react';
import { Users, CheckCircle, Package, Clock } from 'lucide-react';

export const StatCards = ({ stats, completingInterns }) => {
    return (
        <div className="p-6">
            {/* Stat Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                {/* Anak Magang Aktif Card */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-emerald-500 text-lg font-medium mb-2">Total Anak Magang Aktif</p>
                            <h3 className="text-4xl font-bold text-emerald-500">{stats.activeInterns || 0}</h3>
                        </div>
                        <div className="bg-emerald-100 p-3 rounded-lg">
                            <Users className="w-6 h-6 text-emerald-500" />
                        </div>
                    </div>
                </div>

                {/* Total Selesai Card */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-emerald-500 text-lg font-medium mb-2">Total Anak Magang Selesai</p>
                            <h3 className="text-4xl font-bold text-emerald-500">{stats.completedInterns || 0}</h3>
                        </div>
                        <div className="bg-rose-100 p-3 rounded-lg">
                            <CheckCircle className="w-6 h-6 text-rose-500" />
                        </div>
                    </div>
                </div>

                {/* Total Keseluruhan Card */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-emerald-500 text-lg font-medium mb-2">Total Anak Magang</p>
                            <h3 className="text-4xl font-bold text-emerald-500">{stats.totalInterns || 0}</h3>
                        </div>
                        <div className="bg-amber-100 p-3 rounded-lg">
                            <Package className="w-6 h-6 text-amber-500" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Anak Magang Aktif Hari Ini Card */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mt-8">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-emerald-500 text-xl font-medium mb-3">Anak Magang Aktif Hari Ini</p>
                        <h3 className="text-5xl font-bold text-emerald-500">{stats.completingSoon || 0}</h3>
                    </div>
                    <div className="bg-blue-100 p-4 rounded-lg">
                        <Users className="w-8 h-8 text-blue-500" />
                    </div>
                </div>
            </div>

            {/* Tabel Anak Magang yang Akan Selesai */}
            <div className="mt-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    Anak Magang yang Akan Selesai dalam kurun waktu 7 hari
                </h2>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    {completingInterns && completingInterns.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Nama
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Institusi
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Bidang
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Tanggal Selesai
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {completingInterns.map((intern) => (
                                        <tr key={intern.id_magang}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {intern.nama}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {intern.nama_institusi}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {intern.nama_bidang}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {new Date(intern.tanggal_keluar).toLocaleDateString('id-ID')}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-4 text-gray-500">
                            Tidak ada anak magang yang akan selesai dalam 7 hari ke depan
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};