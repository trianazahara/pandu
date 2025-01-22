const pool = require('../config/database');
const XLSX = require('xlsx');
const { jsPDF } = require('jspdf');
require('jspdf-autotable');

const calculateWorkingDays = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    let workingDays = 0;
    let current = new Date(start);
    while (current <= end) {
      if (current.getDay() !== 0 && current.getDay() !== 6) {
        workingDays++;
      }
      current.setDate(current.getDate() + 1);
    }
    return workingDays;
  };

  const reportController = {
    exportInternsScore: async (req, res) => {
        try {
            const { bidang, end_date_start, end_date_end } = req.query;

            // Start building the query
            let query = `
            SELECT 
                pm.nama,
                pm.jenis_peserta,
                CASE 
                    WHEN pm.jenis_peserta = 'mahasiswa' THEN m.nim
                    ELSE s.nisn
                END as nomor_induk,
                pm.nama_institusi,  
                b.nama_bidang,
                DATE_FORMAT(pm.tanggal_masuk, '%d-%m-%Y') as tanggal_masuk,
                DATE_FORMAT(pm.tanggal_keluar, '%d-%m-%Y') as tanggal_keluar,
                pm.status,
                CASE 
                    WHEN pm.jenis_peserta = 'mahasiswa' THEN m.fakultas
                    ELSE NULL
                END as fakultas,
                CASE 
                    WHEN pm.jenis_peserta = 'mahasiswa' THEN m.jurusan
                    ELSE s.jurusan
                END as jurusan,
                m.semester,
                s.kelas,
                p.nilai_teamwork,
                p.nilai_komunikasi,
                p.nilai_pengambilan_keputusan,
                p.nilai_kualitas_kerja,
                p.nilai_teknologi,
                p.nilai_disiplin,
                p.nilai_tanggungjawab,
                p.nilai_kerjasama,
                p.nilai_inisiatif,
                p.nilai_kejujuran,
                p.nilai_kebersihan,
                p.jumlah_hadir
            FROM peserta_magang pm
            LEFT JOIN bidang b ON pm.id_bidang = b.id_bidang
            LEFT JOIN data_mahasiswa m ON pm.id_magang = m.id_magang
            LEFT JOIN data_siswa s ON pm.id_magang = s.id_magang
            INNER JOIN penilaian p ON pm.id_magang = p.id_magang
            WHERE pm.status = 'selesai'
            AND p.id_magang IS NOT NULL
            `;

            // Handle filters (if any)
            const queryParams = [];
            if (bidang) {
                query += ` AND b.nama_bidang = ?`;
                queryParams.push(bidang);
            }
            if (end_date_start && end_date_end) {
                query += ` AND pm.tanggal_keluar BETWEEN ? AND ?`;
                queryParams.push(end_date_start);
                queryParams.push(end_date_end);
            }

            // Execute the query with the appropriate parameters
            const [rows] = await pool.execute(query, queryParams);

            // Process the data and map it
            const formattedData = rows.map(row => {
                return {
                    'Nama': row.nama || '-',
                    'Jenis Peserta': row.jenis_peserta || '-',
                    'Nomor Induk': row.nomor_induk || '-',
                    'Institusi': row.nama_institusi || '-',
                    'Bidang': row.nama_bidang || '-',
                    'Tanggal Masuk': row.tanggal_masuk || '-',
                    'Tanggal Keluar': row.tanggal_keluar || '-',
                    'Status': row.status || '-',
                    'Fakultas': row.fakultas || '-',
                    'Jurusan': row.jurusan || '-',
                    'Semester': row.semester || '-',
                    'Kelas': row.kelas || '-',
                    'Absensi': row.jumlah_hadir || '-',
                    'Nilai Teamwork': row.nilai_teamwork || '-',
                    'Nilai Komunikasi': row.nilai_komunikasi || '-',
                    'Nilai Pengambilan Keputusan': row.nilai_pengambilan_keputusan || '-',
                    'Nilai Kualitas Kerja': row.nilai_kualitas_kerja || '-',
                    'Nilai Teknologi': row.nilai_teknologi || '-',
                    'Nilai Disiplin': row.nilai_disiplin || '-',
                    'Nilai Tanggung Jawab': row.nilai_tanggungjawab || '-',
                    'Nilai Kerjasama': row.nilai_kerjasama || '-',
                    'Nilai Inisiatif': row.nilai_inisiatif || '-',
                    'Nilai Kejujuran': row.nilai_kejujuran || '-',
                    'Nilai Kebersihan': row.nilai_kebersihan || '-'
                };
            });

            // Create workbook
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(formattedData);

            // Set column widths
            const colWidths = [
                { wch: 30 },
                { wch: 15 },
                { wch: 20 },
                { wch: 30 },
                { wch: 20 },
                { wch: 15 },
                { wch: 15 },
                { wch: 15 },
                { wch: 20 },
                { wch: 25 },
                { wch: 10 },
                { wch: 10 },
                { wch: 15 },
                { wch: 15 },
                { wch: 25 },
                { wch: 20 },
                { wch: 15 },
                { wch: 15 },
                { wch: 20 },
                { wch: 15 },
                { wch: 15 },
                { wch: 15 },
                { wch: 10 }
            ];
            ws['!cols'] = colWidths;

            // Add worksheet to workbook
            XLSX.utils.book_append_sheet(wb, ws, 'Data Anak Magang');

            // Generate buffer
            const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

            // Set response headers
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=Data_Anak_Magang.xlsx');
            res.send(buffer);

        } catch (error) {
            console.error('Error exporting data:', error);
            res.status(500).json({
                status: "error",
                message: "Terjadi kesalahan saat export data",
                error: error.message
            });
        }
    },

    generateCertificate: async (req, res) => {
        try {
            const { id_magang } = req.params;

            // Get assessment and intern data
            const [assessment] = await pool.execute(`
                SELECT p.*, pm.nama, pm.jenis_peserta,
                       i.nama_institusi, b.nama_bidang,
                       CASE 
                           WHEN pm.jenis_peserta = 'mahasiswa' THEN m.nim
                           ELSE s.nisn
                       END as nomor_induk,
                       m.fakultas, m.jurusan as jurusan_mahasiswa,
                       s.jurusan as jurusan_siswa, s.kelas,
                       pm.tanggal_masuk, pm.tanggal_keluar
                FROM penilaian p
                JOIN peserta_magang pm ON p.id_magang = pm.id_magang
                LEFT JOIN institusi i ON pm.id_institusi = i.id_institusi
                LEFT JOIN bidang b ON pm.id_bidang = b.id_bidang
                LEFT JOIN data_mahasiswa m ON pm.id_magang = m.id_magang
                LEFT JOIN data_siswa s ON pm.id_magang = s.id_magang
                WHERE p.id_magang = ?
            `, [id_magang]);

            if (!assessment.length) {
                return res.status(404).json({
                    message: 'Data tidak ditemukan'
                });
            }

            // Get certificate template
            const [template] = await pool.execute(`
                SELECT file_path
                FROM dokumen_template
                WHERE jenis = 'sertifikat'
                AND active = true
                LIMIT 1
            `);

            if (!template.length) {
                return res.status(404).json({
                    message: 'Template sertifikat tidak ditemukan'
                });
            }

            // Generate certificate using PDF lib
            const templatePath = path.join(__dirname, '..', template[0].file_path);
            const templateBytes = await fs.readFile(templatePath);
            const pdfDoc = await PDFDocument.load(templateBytes);
            const pages = pdfDoc.getPages();
            const firstPage = pages[0];

            // Add details to certificate
            // Note: Exact positions would depend on your template
            const data = assessment[0];
            const { width, height } = firstPage.getSize();

            firstPage.drawText(data.nama, {
                x: width / 2,
                y: height - 200,
                size: 24,
                font: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
                color: rgb(0, 0, 0)
            });

            // Add more text fields as needed

            const pdfBytes = await pdfDoc.save();
            
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=sertifikat.pdf');
            res.send(Buffer.from(pdfBytes));
        } catch (error) {
            console.error('Error generating certificate:', error);
            res.status(500).json({ message: 'Terjadi kesalahan server' });
        }
    },

    generateReceipt : async (req, res) => {
        try {
            const { internIds } = req.body;
            const placeholders = internIds.map(() => '?').join(',');
            const [selectedInterns] = await pool.execute(`
                SELECT 
                    pm.nama,
                    pm.nama_institusi,
                    b.nama_bidang,
                    DATE_FORMAT(pm.tanggal_masuk, '%d-%m-%Y') as tanggal_masuk,
                    DATE_FORMAT(pm.tanggal_keluar, '%d-%m-%Y') as tanggal_keluar
                FROM peserta_magang pm
                JOIN bidang b ON pm.id_bidang = b.id_bidang
                WHERE pm.id_magang IN (${placeholders})
            `, [...internIds]);
    
            const doc = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });
            
            const formatCurrentDate = () => {
                const months = [
                    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
                ];
                const date = new Date();
                return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
            };
    
            // Define margins
            const margin = {
                left: 20,
                right: 20,
                top: 20,
                bottom: 20
            };
    
            // Header
            doc.setFontSize(16);
            doc.text('TANDA TERIMA', doc.internal.pageSize.width / 2, 30, { align: 'center' });
            doc.setFontSize(12);
            doc.text('Telah diterima berkas dari peserta magang sebagai berikut:', margin.left, 45);
    
            // Table
            doc.autoTable({
                startY: 50,
                margin: { left: margin.left, right: margin.right },
                head: [
                    [
                        { content: 'No.', rowSpan: 2 },
                        { content: 'Nama', rowSpan: 2 },
                        { content: 'Nama Sekolah/PT', rowSpan: 2 },
                        { content: 'Ruang Penempatan', rowSpan: 2 },
                        { content: 'Tgl Masuk - Tgl Keluar', rowSpan: 2 },
                        {
                            content: 'Diterima oleh',
                            colSpan: 2,
                            styles: { halign: 'center' }
                        }
                    ],
                    [
                        'Nama',
                        'Tandatangan'
                    ]
                ],
                body: selectedInterns.map((intern, index) => [
                    index + 1,
                    intern.nama,
                    intern.nama_institusi,
                    intern.nama_bidang,
                    `${intern.tanggal_masuk} - ${intern.tanggal_keluar}`,
                    '',
                    ''
                ]),
                theme: 'grid',
                styles: {
                    fontSize: 10,
                    cellPadding: 4,
                    halign: 'left',
                    valign: 'middle',
                    lineWidth: 0.5
                },
                headStyles: {
                    fillColor: [80, 80, 80],
                    textColor: 255,
                    fontSize: 10,
                    fontStyle: 'bold',
                    halign: 'center',
                    valign: 'middle'
                },
                columnStyles: {
                    0: { cellWidth: 15 },
                    1: { cellWidth: 60 },
                    2: { cellWidth: 40 },
                    3: { cellWidth: 40 },
                    4: { cellWidth: 30 },
                    5: { cellWidth: 40 },
                    6: { cellWidth: 30 }
                },
                didDrawPage: function(data) {
                    doc.lastAutoTable.finalY = data.cursor.y;
                }
            });
    
            // Calculate required height for signature section
            const signatureHeight = 60; // Increased height for safety
            const pageHeight = doc.internal.pageSize.height;
            const pageWidth = doc.internal.pageSize.width;
            const remainingSpace = pageHeight - doc.lastAutoTable.finalY;
    
            // Calculate signature x position (align right with proper margin)
            const signatureX = pageWidth - margin.right - 65; // 60mm from right margin
    
            // Check if there's enough space for signature
            if (remainingSpace < signatureHeight) {
                doc.addPage();
                addSignature(doc, margin.top + 10, signatureX);
            } else {
                addSignature(doc, doc.lastAutoTable.finalY + 10, signatureX);
            }
    
            // Helper function to add signature section
            function addSignature(doc, startY, signatureX) {
                doc.text('Demikian tanda terima ini dibuat untuk dipergunakan sebagaimana mestinya.', 
                    margin.left, startY);
                
                // Sign section with proper right alignment
                doc.text(`Padang, ${formatCurrentDate()}`, signatureX, startY + 5, { align: 'left' });
                doc.text('Kasubag Umpeg', signatureX, startY + 10, { align: 'left' });
                doc.text('Benny Wahyudi, ST, Msi', signatureX, startY + 35, { align: 'left' });
                doc.text('NIP. 197810232010011009', signatureX, startY + 40, { align: 'left' });
            }
    
            // Convert and send PDF
            const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=tanda-terima-magang.pdf');
            res.send(pdfBuffer);
    
        } catch (error) {
            console.error('Error generating receipt:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to generate receipt'
            });
        }
    }
};

module.exports = reportController;