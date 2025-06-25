const axios = require('axios');
const NodeCache = require('node-cache');
const myCache = new NodeCache({ stdTTL: 3600 });

const institutionController = {
    /**
     * UNTUK FITUR BROWSE WILAYAH (Cascading Dropdown).
     * Ini akan menjadi satu-satunya cara untuk memilih SMK.
     */
    browseWilayah: async (req, res) => {
        const { level, kode, bentuk } = req.query;
        const semester = '20242';

        if (!level || !kode) {
            return res.status(400).json({ message: 'Parameter level dan kode wilayah diperlukan' });
        }
        
        try {
            let url = '';
            if (level === '1' || level === '2') {
                url = `https://dapo.dikdasmen.go.id/rekap/dataSekolah?id_level_wilayah=${level}&kode_wilayah=${kode}&semester_id=${semester}`;
            } 
            else if (level === '3') {
                const bentukFilter = bentuk ? `&bentuk_pendidikan_id=${bentuk}` : '';
                url = `https://dapo.dikdasmen.go.id/rekap/progresSP?id_level_wilayah=3&kode_wilayah=${kode}&semester_id=${semester}${bentukFilter}`;
            } else {
                return res.status(400).json({ message: 'Level tidak valid' });
            }

            const response = await axios.get(url);
            const formattedData = response.data.map(item => ({
                id: item.kode_wilayah?.trim() || item.sekolah_id,
                nama: item.nama,
                npsn: item.npsn || null,
            }));
            res.json(formattedData);
        } catch (error) {
            console.error('Error Browse wilayah:', error.message);
            res.status(500).json({ message: 'Gagal mengambil data wilayah dari server Dapodik' });
        }
    },

    searchUniversities: async (req, res) => {
        const { search } = req.query;
        if (!search || search.length < 2) return res.json([]);

        const cacheKey = `pt-api-search-${search.toLowerCase()}`;
        if (myCache.has(cacheKey)) return res.json(myCache.get(cacheKey));

        try {
            const url = `https://api-pddikti.kemdiktisaintek.go.id/v2/pt/search/filter?limit=50&nama=${encodeURIComponent(search)}`;
            const response = await axios.get(url);
            
            let universities = [];
            if (response.data && response.data.data) {
                universities = response.data.data
                    .map(pt => {
                        // PENYESUAIAN NAMA PROPERTY SESUAI DATA API YANG SEBENARNYA
                        if (!pt.nama_pt || !pt.id_sp) { // <-- DIUBAH
                            return null;
                        }
                        return {
                            id: pt.id_sp, // <-- DIUBAH
                            nama: pt.nama_pt, // <-- DIUBAH
                            alamat: [pt.kab_kota_pt, pt.provinsi_pt].filter(Boolean).join(', ') // <-- DIUBAH
                        };
                    })
                    .filter(Boolean); // Hapus data yang tidak punya nama atau id
            }
            myCache.set(cacheKey, universities);
            res.json(universities);
        } catch (error) {
            console.error('Error di searchUniversities (API):', error.message);
            res.status(500).json({ message: 'Gagal mengambil data Perguruan Tinggi dari server API PDDikti' });
        }
    }
};
    

module.exports = institutionController;