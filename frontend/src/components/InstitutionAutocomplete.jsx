import React, { useState, useEffect, useMemo } from 'react';
import {
  Autocomplete,
  TextField,
  CircularProgress,
  Typography,
  Box,
} from '@mui/material';
import { debounce } from 'lodash';
import axios from 'axios';

/**
 * Helper function untuk mengambil token dari localStorage.
 * Pastikan Anda menyimpan token dengan key 'token' setelah login.
 */
const getToken = () => {
  return localStorage.getItem('token');
};

/**
 * Komponen Autocomplete untuk mencari Institusi (SMK atau Perguruan Tinggi).
 * Komponen ini mengambil data dari API backend Anda secara dinamis.
 */
const InstitutionAutocomplete = ({ 
  type, // 'university' atau 'smk'
  value, 
  onChange, 
  error, 
  helperText, 
  ...props 
}) => {
  // --- 1. STATE MANAGEMENT ---
  // options: Menyimpan array data (sekolah/kampus) yang diterima dari backend.
  const [options, setOptions] = useState([]);
  // loading: Mengontrol tampilan loading spinner saat data sedang diambil.
  const [loading, setLoading] = useState(false);
  // inputValue: Menyimpan teks yang sedang diketik oleh pengguna.
  const [inputValue, setInputValue] = useState('');

  // --- 2. LOGIKA UTAMA: PENGAMBILAN DATA ---
  const fetchInstitutionData = async (searchTerm, institutionType) => {
    // Jangan cari jika input terlalu pendek
    if (!searchTerm || searchTerm.length < 2) {
      setOptions([]);
      return;
    }

    setLoading(true);
    try {
      // Tentukan endpoint backend yang akan dituju
      const endpoint = institutionType === 'university' 
        ? '/api/institutions/universities' 
        : '/api/institutions/smk';
      
      const token = getToken();
      if (!token) {
        throw new Error("Autentikasi gagal: Token tidak ditemukan.");
      }

      // Lakukan request ke backend
      const response = await axios.get(endpoint, {
        params: { search: searchTerm },
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Update state 'options' dengan data yang diterima
      setOptions(response.data || []);

    } catch (err) {
      console.error(`Error fetching ${institutionType} data from backend:`, err);
      setOptions([]); // Kosongkan pilihan jika terjadi error
    } finally {
      // Pastikan loading spinner selalu berhenti
      setLoading(false);
    }
  };

  // --- 3. OPTIMISASI PERFORMA: DEBOUNCE ---
  // `debounce` menunda eksekusi `fetchInstitutionData` selama 500ms
  // setelah pengguna berhenti mengetik. Ini mencegah request API berlebihan.
  const debouncedFetch = useMemo(
    () => debounce((searchTerm, institutionType) => {
      fetchInstitutionData(searchTerm, institutionType);
    }, 500),
    [] // Array kosong memastikan fungsi debounce hanya dibuat sekali
  );

  // --- 4. SIDE EFFECTS: MENGGUNAKAN `useEffect` ---
  // Effect ini berjalan setiap kali pengguna mengetik (inputValue berubah)
  useEffect(() => {
    // Panggil fungsi debounce, bukan fetchInstitutionData secara langsung
    debouncedFetch(inputValue, type);
    // Cleanup function untuk membatalkan debounce jika komponen di-unmount
    return () => debouncedFetch.cancel();
  }, [inputValue, type, debouncedFetch]);

  // Effect ini berjalan saat tipe institusi diganti (misal dari SMK ke PT)
  useEffect(() => {
    // Bersihkan state saat tipe berubah
    setOptions([]);
    setInputValue('');
    // onChange(null); // Optional: reset juga nilai di form utama
  }, [type]);

  // --- 5. TAMPILAN (UI) & RENDERING ---
  return (
    <Autocomplete
      {...props}
      // Props untuk data dan state
      options={options}
      loading={loading}
      value={value}
      inputValue={inputValue}
      
      // Event handlers
      onChange={(event, newValue) => onChange(newValue)}
      onInputChange={(event, newInputValue) => setInputValue(newInputValue)}
      
      // Props untuk mengontrol bagaimana data ditampilkan
      // Menentukan teks apa yang ditampilkan dari sebuah 'option' object
      getOptionLabel={(option) => option?.nama || ''}
      // Membandingkan option dengan value untuk menentukan item yang terpilih
      isOptionEqualToValue={(option, val) => option?.id === val?.id}

      // **KUNCI DEBUGGING ADA DI SINI**
      // Fungsi ini mengatur bagaimana SETIAP BARIS di dropdown ditampilkan.
      renderOption={(props, option) => {
        // Kita log 'option' untuk memastikan datanya benar
        console.log("Rendering option:", option);
        return (
          <Box component="li" {...props} key={option.id}>
            <Box>
              <Typography variant="body2">{option.nama}</Typography>
              {option.alamat && (
                <Typography variant="caption" color="text.secondary">
                  {option.alamat}
                </Typography>
              )}
            </Box>
          </Box>
        );
      }}

      // Props untuk tampilan TextField (input box)
      renderInput={(params) => (
        <TextField
          {...params}
          label={type === 'university' ? 'Cari Nama Universitas/Perguruan Tinggi' : 'Cari Nama SMK'}
          size="small"
          error={error}
          helperText={helperText}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
      
      // Teks yang ditampilkan saat loading atau tidak ada data
      noOptionsText={
        loading ? "Mencari..." : 
        (inputValue.length < 2 ? "Ketik minimal 2 karakter" : "Data tidak ditemukan")
      }
      
      // Matikan filter bawaan, karena kita sudah filter via backend
      filterOptions={(x) => x} 
    />
  );
};

export default InstitutionAutocomplete;