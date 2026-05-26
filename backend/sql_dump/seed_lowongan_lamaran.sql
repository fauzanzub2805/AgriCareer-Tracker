-- Membuat struktur tabel jika belum ada
CREATE TABLE IF NOT EXISTS lowongan (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    perusahaan TEXT NOT NULL,
    posisi TEXT NOT NULL,
    lokasi TEXT,
    deskripsi TEXT,
    tanggal_tutup DATE,
    status_aktif BOOLEAN DEFAULT 1
);

CREATE TABLE IF NOT EXISTS lamaran (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_lowongan INTEGER NOT NULL,
    username_mahasiswa TEXT NOT NULL,
    status_lamaran TEXT NOT NULL,
    tanggal_kirim DATE,
    posisi TEXT,
    FOREIGN KEY (id_lowongan) REFERENCES lowongan (id),
    FOREIGN KEY (username_mahasiswa) REFERENCES users (username)
);

-- Data Seeding untuk Lowongan Magang
INSERT INTO lowongan (perusahaan, posisi, lokasi, deskripsi, tanggal_tutup, status_aktif) VALUES
('PT PLN PERSERO', 'Graphic Designer, UI/UX Designer, Illustrator', 'Jakarta Selatan', 'PT PLN (Persero) adalah perusahaan Badan Usaha Milik Negara yang bergerak di bidang ketenagalistrikan. PLN bertanggung jawab atas penyediaan tenaga listrik bagi kepentingan umum di seluruh Indonesia. Sebagai perusahaan strategis, PLN terus berinnovasi dalam mengembangkan infrastruktur energi yang ramah lingkungan. Kami mencari mahasiswa magang untuk posisi Graphic Designer yang kreatif dan inovatif.', '2061-01-01', 1),
('BCA Digital', 'Admin, Back Office, Customer Service', 'Magang BCA, Jakarta Pusat', 'BCA Digital adalah bank digital inovatif di Indonesia. Kami mencari admin magang yang teliti dan bertanggung jawab untuk membantu operasional sehari-hari divisi kami. Kandidat diharapkan memiliki kemampuan komunikasi yang baik dan terbiasa dengan aplikasi perkantoran (Microsoft Office/Google Workspace).', '2061-01-01', 1),
('PT KINGFINIX', 'Human Resource, Recruiter, Talent Acquisition', 'Robert C. TOWER, Jakarta Selatan', 'PT KINGFINIX adalah startup teknologi yang sedang berkembang pesat. Kami membuka kesempatan magang di divisi Human Resource bagi mahasiswa tingkat akhir yang ingin belajar tentang proses rekrutmen, pengembangan karyawan, dan administrasi HR. Pengalaman magang di sini akan memberikan wawasan mendalam tentang budaya startup yang dinamis.', '2061-01-01', 1),
('Aldis Burger Cempaka Putih', 'Graphic Designer, Social Media Admin, Content Creator', 'Cempaka Putih, Jakarta Pusat', 'Aldi''s Burger adalah jaringan restoran cepat saji lokal yang fokus pada kualitas dan rasa. Kami membutuhkan Graphic Designer magang untuk membantu merancang materi promosi di media sosial, banner, dan menu. Cocok bagi mahasiswa desain yang ingin membangun portofolio di industri Food & Beverage kreatif.', '2061-01-02', 1),
('Telkom Indonesia', 'Software Engineer, Data Scientist, Product Manager', 'Bandung, Jawa Barat', 'PT Telkom Indonesia membuka lowongan magang untuk posisi Software Engineer. Mahasiswa akan dilibatkan dalam proyek pengembangan perangkat lunak berskala besar menggunakan teknologi terkini. Persyaratan: menguasai setidaknya satu bahasa pemrograman (Python, Java, atau JavaScript) dan memahami konsep REST API.', '2061-03-15', 1),
('Bank Indonesia', 'Staff Analisis Ekonomi, Financial Analyst, Assistant Economist', 'Jakarta Pusat', 'Bank Indonesia membuka program magang untuk posisi Staff Analisis Ekonomi. Mahasiswa akan terlibat dalam riset dan analisis kebijakan moneter serta perkembangan ekonomi makro Indonesia. Diperlukan kemampuan analisis data yang kuat dan pemahaman ekonomi yang baik.', '2061-02-28', 1),
('StartU', 'Digital Marketing, Social Media Specialist, SEO Specialist', 'Jakarta Selatan', 'StartU adalah platform edukasi digital yang memberdayakan pelajar di seluruh Indonesia. Kami mencari Digital Marketing Intern yang kreatif untuk membantu mengelola kampanye media sosial dan meningkatkan engagement komunitas.', '2061-03-10', 1),
('GrowTech Asia', 'Agronomy Intern, Research Assistant, Field Supervisor', 'Bogor, Jawa Barat', 'GrowTech Asia adalah perusahaan agritech yang berfokus pada pertanian presisi. Mahasiswa Agribisnis atau Teknologi Pertanian dipersilakan mendaftar untuk posisi Agronomy Intern. Tugas meliputi pemantauan lahan, pengolahan data sensor pertanian, dan asistensi riset field.', '2061-04-15', 1),
('Narasi TV', 'Video Editor, Creative Writer, Production Assistant', 'Jakarta Selatan', 'Narasi TV mencari Video Editor magang yang memiliki kepekaan terhadap isu sosial dan politik. Kandidat diharapkan mahir menggunakan Adobe Premiere Pro atau Final Cut Pro serta memiliki kreativitas dalam storytelling visual.', '2061-03-05', 1),
('Kumparan', 'Content Writer, Reporter, Copywriter', 'Jakarta Pusat', 'Kumparan membuka lowongan magang Content Writer untuk mahasiswa Ilmu Komunikasi atau Jurnalistik. Kesempatan untuk menulis berita investigasi dan feature mendalam di salah satu media digital terbesar Indonesia.', '2061-03-20', 1),
('Nusantara Technology', 'IT Support, Network Admin, System Administrator', 'Tangerang, Banten', 'Nusantara Technology membutuhkan IT Support magang yang siap membantu dalam maintenance hardware dan software serta memberikan dukungan teknis kepada karyawan. Diutamakan memiliki pengetahuan dasar jaringan komputer.', '2061-03-12', 1),
('Sinar Mas Agribusiness and Food', 'Corporate Communications, PR Specialist, Media Relations', 'Medan, Sumatera Utara', 'Perusahaan agribisnis terkemuka ini membuka posisi magang di divisi Corporate Communications. Mahasiswa PR atau Komunikasi dapat mendaftar untuk membantu dokumentasi kegiatan perusahaan dan mengelola media internal.', '2061-03-25', 1),
('Siloam Hospitals Group', 'Public Relations, Event Coordinator, Customer Relations', 'Jakarta Selatan', 'Siloam Hospitals Group mencari mahasiswa magang Public Relations untuk membantu koordinasi media dan event kesehatan. Kesempatan emas untuk berjejaring dalam industri hospitality dan kesehatan.', '2061-02-20', 1),
('Ruangguru', 'Marketing Specialist, Content Developer, Academic Tutor', 'Jakarta Selatan', 'Ruangguru, edutech terdepan di Indonesia, membutuhkan Marketing Specialist magang. Mahasiswa yang proaktif dan tertarik dengan product digital pendidikan sangat dianjurkan untuk mendaftar.', '2061-03-01', 1),
('Yayasan Keadilan Hukum', 'Paralegal Intern, Legal Assistant, Legal Researcher', 'Yogyakarta', 'Yayasan yang bergerak di bidang bantuan hukum ini membuka lowongan Paralegal Intern. Mahasiswa Fakultas Hukum dipersilakan mendaftar untuk membantu penelitian hukum dan pendampingan kasus warga kurang mampu.', '2061-03-30', 1);

-- Data Seeding untuk Lamaran Mahasiswa (mengambil mhs_arip sebagai referensi mahasiswa)
INSERT INTO lamaran (id_lowongan, username_mahasiswa, status_lamaran, tanggal_kirim, posisi) VALUES
(2, 'mhs_arip', 'Dikirim', '2026-05-18', 'Admin'),
(1, 'mhs_arip', 'Menunggu', '2026-05-15', 'Graphic Designer'),
(3, 'mhs_arip', 'Menunggu', '2026-05-10', 'Human Resource');

-- Data Seeding untuk Pengumuman
CREATE TABLE IF NOT EXISTS pengumuman (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    judul TEXT NOT NULL,
    isi TEXT NOT NULL,
    tanggal_dibuat DATE,
    penulis TEXT
);

INSERT INTO pengumuman (judul, isi, tanggal_dibuat, penulis) VALUES
('Pendaftaran Program Magang Semester Ganjil 2026/2027 Dibuka!', 'Diberitahukan kepada seluruh mahasiswa semester 6 dan 7, program magang MBKM (Merdeka Belajar Kampus Merdeka) untuk semester ganjil 2026/2027 telah resmi dibuka. Silakan melengkapi profil dan CV Anda di platform AgriCareer-Tracker sebelum 30 Juni 2026.', '2026-05-18', 'Admin Fakultas'),

('Sosialisasi Program Magang BUMN', 'Akan diadakan sosialisasi Program Magang Bersertifikat BUMN pada hari Rabu, 20 Mei 2026 pukul 09.00 WIB melalui Zoom Meeting. Link akan dikirimkan melalui email masing-masing mahasiswa.', '2026-05-10', 'Kemahasiswaan');
