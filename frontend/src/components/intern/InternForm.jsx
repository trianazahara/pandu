// // frontend/src/components/intern/InternForm.jsx
// import React, { useState, useEffect } from 'react';
// import {
//     TextField,
//     Select,
//     MenuItem,
//     FormControl,
//     InputLabel,
//     Grid,
//     Button,
// } from '@mui/material';
// import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
// import { DatePicker } from '@mui/x-date-pickers/DatePicker';
// import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
// import id from 'date-fns/locale/id';
// import Paper from '@mui/material/Paper';
// import Box from '@mui/material/Box';

// export const InternForm = ({ onSubmit, initialData = null }) => {
//     const [formData, setFormData] = useState({
//         nama: '',
//         jenis_peserta: 'mahasiswa',
//         nomor_induk: '',
//         institusi_id: '',
//         email: '',
//         no_hp: '',
//         bidang_id: '',
//         tanggal_masuk: null,
//         tanggal_keluar: null,
//         // Fields khusus mahasiswa
//         fakultas: '',
//         jurusan: '',
//         semester: '',
//         // Fields khusus siswa
//         kelas: ''
//     });

//     const [institusi, setInstitusi] = useState([]);
//     const [bidang, setBidang] = useState([]);

//     useEffect(() => {
//         // Load institusi dan bidang
//         const fetchData = async () => {
//             try {
//                 const [institusiRes, bidangRes] = await Promise.all([
//                     fetch('/api/institusi'),
//                     fetch('/api/bidang')
//                 ]);
                
//                 const [institusiData, bidangData] = await Promise.all([
//                     institusiRes.json(),
//                     bidangRes.json()
//                 ]);

//                 setInstitusi(institusiData);
//                 setBidang(bidangData);
//             } catch (error) {
//                 console.error('Error fetching data:', error);
//             }
//         };

//         fetchData();
//     }, []);

//     useEffect(() => {
//         if (initialData) {
//             setFormData(initialData);
//         }
//     }, [initialData]);

//     const handleChange = (e) => {
//         const { name, value } = e.target;
//         setFormData(prev => ({
//             ...prev,
//             [name]: value
//         }));
//     };

//     const handleDateChange = (name, value) => {
//         setFormData(prev => ({
//             ...prev,
//             [name]: value
//         }));
//     };

//     const handleSubmit = (e) => {
//         e.preventDefault();
//         onSubmit(formData);
//     };

//     return (
//         <form onSubmit={handleSubmit} className="space-y-4 p-4">
//             <Grid container spacing={3}>
//                 <Grid item xs={12}>
//                     <TextField
//                         fullWidth
//                         label="Nama Lengkap"
//                         name="nama"
//                         value={formData.nama}
//                         onChange={handleChange}
//                         required
//                     />
//                 </Grid>

//                 <Grid item xs={12} md={6}>
//                     <FormControl fullWidth>
//                         <InputLabel>Jenis Peserta</InputLabel>
//                         <Select
//                             name="jenis_peserta"
//                             value={formData.jenis_peserta}
//                             onChange={handleChange}
//                             required
//                         >
//                             <MenuItem value="mahasiswa">Mahasiswa</MenuItem>
//                             <MenuItem value="siswa">Siswa</MenuItem>
//                         </Select>
//                     </FormControl>
//                 </Grid>

//                 <Grid item xs={12} md={6}>
//                     <TextField
//                         fullWidth
//                         label={formData.jenis_peserta === 'mahasiswa' ? 'NIM' : 'NISN'}
//                         name="nomor_induk"
//                         value={formData.nomor_induk}
//                         onChange={handleChange}
//                         required
//                     />
//                 </Grid>

//                 {formData.jenis_peserta === 'mahasiswa' ? (
//                     <>
//                         <Grid item xs={12} md={4}>
//                             <TextField
//                                 fullWidth
//                                 label="Fakultas"
//                                 name="fakultas"
//                                 value={formData.fakultas}
//                                 onChange={handleChange}
//                                 required
//                             />
//                         </Grid>
//                         <Grid item xs={12} md={4}>
//                             <TextField
//                                 fullWidth
//                                 label="Jurusan"
//                                 name="jurusan"
//                                 value={formData.jurusan}
//                                 onChange={handleChange}
//                                 required
//                             />
//                         </Grid>
//                         <Grid item xs={12} md={4}>
//                             <TextField
//                                 fullWidth
//                                 label="Semester"
//                                 name="semester"
//                                 type="number"
//                                 value={formData.semester}
//                                 onChange={handleChange}
//                                 required
//                             />
//                         </Grid>
//                     </>
//                 ) : (
//                     <>
//                         <Grid item xs={12} md={6}>
//                             <TextField
//                                 fullWidth
//                                 label="Jurusan"
//                                 name="jurusan"
//                                 value={formData.jurusan}
//                                 onChange={handleChange}
//                                 required
//                             />
//                         </Grid>
//                         <Grid item xs={12} md={6}>
//                             <TextField
//                                 fullWidth
//                                 label="Kelas"
//                                 name="kelas"
//                                 value={formData.kelas}
//                                 onChange={handleChange}
//                                 required
//                             />
//                         </Grid>
//                     </>
//                 )}

//                 <Grid item xs={12} md={6}>
//                     <FormControl fullWidth>
//                         <InputLabel>Institusi</InputLabel>
//                         <Select
//                             name="institusi_id"
//                             value={formData.institusi_id}
//                             onChange={handleChange}
//                             required
//                         >
//                             {institusi.map(inst => (
//                                 <MenuItem key={inst.id_institusi} value={inst.id_institusi}>
//                                     {inst.nama_institusi}
//                                 </MenuItem>
//                             ))}
//                         </Select>
//                     </FormControl>
//                 </Grid>

//                 <Grid item xs={12} md={6}>
//                     <FormControl fullWidth>
//                         <InputLabel>Bidang</InputLabel>
//                         <Select
//                             name="bidang_id"
//                             value={formData.bidang_id}
//                             onChange={handleChange}
//                             required
//                         >
//                             {bidang.map(bid => (
//                                 <MenuItem key={bid.id_bidang} value={bid.id_bidang}>
//                                     {bid.nama_bidang}
//                                 </MenuItem>
//                             ))}
//                         </Select>
//                     </FormControl>
//                 </Grid>

//                 <Grid item xs={12} md={6}>
//                     <LocalizationProvider dateAdapter={AdapterDateFns} locale={id}>
//                         <DatePicker
//                             label="Tanggal Masuk"
//                             value={formData.tanggal_masuk}
//                             onChange={(date) => handleDateChange('tanggal_masuk', date)}
//                             renderInput={(params) => <TextField {...params} fullWidth required />}
//                         />
//                     </LocalizationProvider>
//                 </Grid>

//                 <Grid item xs={12} md={6}>
//                     <LocalizationProvider dateAdapter={AdapterDateFns} locale={id}>
//                         <DatePicker
//                             label="Tanggal Keluar"
//                             value={formData.tanggal_keluar}
//                             onChange={(date) => handleDateChange('tanggal_keluar', date)}
//                             renderInput={(params) => <TextField {...params} fullWidth required />}
//                         />
//                     </LocalizationProvider>
//                 </Grid>

//                 <Grid item xs={12} md={6}>
//                     <TextField
//                         fullWidth
//                         label="Email"
//                         name="email"
//                         type="email"
//                         value={formData.email}
//                         onChange={handleChange}
//                         required
//                     />
//                 </Grid>

//                 <Grid item xs={12} md={6}>
//                     <TextField
//                         fullWidth
//                         label="No. HP"
//                         name="no_hp"
//                         value={formData.no_hp}
//                         onChange={handleChange}
//                         required
//                     />
//                 </Grid>
//             </Grid>

//             <div className="mt-4">
//                 <Button
//                     type="submit"
//                     variant="contained"
//                     color="primary"
//                     fullWidth
//                 >
//                     {initialData ? 'Update' : 'Tambah'} Data
//                 </Button>
//             </div>
//         </form>
//     );
// };

// export default InternForm;