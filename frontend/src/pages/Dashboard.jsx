import React, { useEffect, useState } from 'react';
import { Users, CheckCircle, Package, GraduationCap, Briefcase } from 'lucide-react';

const Dashboard = () => {
    const [stats, setStats] = useState({
        activeInterns: {
            total: 0,
            students: {
                siswa: 0,
                mahasiswa: 0
            },
            byDepartment: {}
        },
        completedInterns: 0,
        totalInterns: 0,
        completingSoon: {
            count: 0,
            interns: []
        }
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const response = await fetch('http://localhost:5000/api/intern/detailed-stats', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch dashboard data');
                }

                const data = await response.json();
                setStats(data);
                setError(null);
            } catch (err) {
                console.error('Error fetching dashboard data:', err);
                setError('Gagal mengambil data dashboard');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
        // Refresh setiap 1 menit
        const interval = setInterval(fetchDashboardData, 60000);

        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return <div className="p-6 text-center">Loading...</div>;
    }

    if (error) {
        return <div className="p-6 text-center text-red-500">{error}</div>;
    }

    return (
        <div className="p-6">
            {/* Stat Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                {/* Anak Magang Aktif Card */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-emerald-500 text-lg font-medium mb-2">Total Anak Magang Aktif</p>
                            <h3 className="text-4xl font-bold text-emerald-500">{stats.activeInterns.total}</h3>
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
                            <h3 className="text-4xl font-bold text-emerald-500">{stats.completedInterns}</h3>
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
                            <h3 className="text-4xl font-bold text-emerald-500">{stats.totalInterns}</h3>
                        </div>
                        <div className="bg-amber-100 p-3 rounded-lg">
                            <Package className="w-6 h-6 text-amber-500" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Detail Anak Magang Aktif Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                {/* Card Berdasarkan Jenis Peserta */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-4">
                        <p className="text-emerald-500 text-xl font-medium">Anak Magang Aktif Berdasarkan Jenis</p>
                        <div className="bg-blue-100 p-3 rounded-lg">
                            <GraduationCap className="w-6 h-6 text-blue-500" />
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Mahasiswa</span>
                            <span className="text-lg font-semibold">{stats.activeInterns.students.mahasiswa}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Siswa</span>
                            <span className="text-lg font-semibold">{stats.activeInterns.students.siswa}</span>
                        </div>
                    </div>
                </div>

                {/* Card Berdasarkan Bidang */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-4">
                        <p className="text-emerald-500 text-xl font-medium">Anak Magang Aktif Per Bidang</p>
                        <div className="bg-purple-100 p-3 rounded-lg">
                            <Briefcase className="w-6 h-6 text-purple-500" />
                        </div>
                    </div>
                    <div className="space-y-3">
                        {Object.entries(stats.activeInterns.byDepartment).map(([bidang, jumlah]) => (
                            <div key={bidang} className="flex justify-between items-center">
                                <span className="text-gray-600 capitalize">{bidang}</span>
                                <span className="text-lg font-semibold">{jumlah}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tabel Anak Magang yang Akan Selesai */}
            <div className="mt-8">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">
                        Anak Magang yang Akan Selesai dalam 7 Hari
                    </h2>
                    <div className="bg-yellow-100 px-3 py-1 rounded-lg">
                        <span className="text-yellow-700 font-medium">
                            {stats.completingSoon.interns.length} Orang
                        </span>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    {stats.completingSoon.interns.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Nama
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
                                    {stats.completingSoon.interns.map((intern) => (
                                        <tr key={intern.id_magang || intern.nama}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {intern.nama}
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

export default Dashboard;