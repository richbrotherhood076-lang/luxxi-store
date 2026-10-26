# Website Absensi Sekolah

Website statis untuk GitHub Pages dengan login Supabase, absensi siswa, rekap admin, filter, koreksi status, dan ekspor CSV.

## Isi folder
- `index.html` — struktur halaman
- `style.css` — tampilan responsif
- `app.js` — logika login, absensi, rekap, ekspor CSV
- `config.js` — URL dan anon/public key Supabase
- `supabase.sql` — tabel dan aturan keamanan Row Level Security (RLS)

## A. Siapkan database
1. Buat project di https://supabase.com/ dan simpan password database dengan aman.
2. Buka **SQL Editor → New query**, tempel semua isi `supabase.sql`, lalu tekan **Run**.
3. Buka **Project Settings → API** (atau menu API Keys di tampilan dashboard baru). Salin **Project URL** dan **anon/public key**.
4. Isi `config.js` dengan nilai tersebut. Contoh:
   ```
   window.SUPABASE_URL = "https://PROJECT_ID.supabase.co";
   window.SUPABASE_ANON_KEY = "eyJ...";
   ```
   Jangan pernah menaruh `service_role` key, password database, atau secret key di file frontend/GitHub.

## B. Buat akun siswa dan admin
Untuk tahap awal, buat akun secara manual dari **Authentication → Users → Add user**. Gunakan email dan password sementara; berikan password awal kepada pemilik akun secara pribadi dan minta mereka menggantinya jika alur sekolah sudah siap. Jangan mengunggah daftar data siswa ke repositori publik.

Setiap akun harus punya baris di `profiles`. Setelah membuat user, salin UUID user dari Authentication → Users. Di SQL Editor jalankan contoh berikut, ganti semua nilai contoh:
```
insert into public.profiles (id, full_name, class_name, role)
values ('UUID-DARI-AUTH', 'Nama Siswa', 'VII-A', 'student');
```
Untuk akun admin:
```
insert into public.profiles (id, full_name, class_name, role)
values ('UUID-DARI-AUTH-ADMIN', 'Admin Sekolah', '-', 'admin');
```
Buat satu baris untuk setiap akun. Jangan memberi role `admin` ke siswa. Pengaturan profil dilakukan dari dashboard Supabase, bukan browser.

## C. Upload ke GitHub Pages
1. Buat repository GitHub baru. Jika untuk sekolah, sebaiknya repository **Private** selama menyiapkan project; perhatikan bahwa situs GitHub Pages yang dipublikasikan dapat dibaca publik.
2. Upload file `index.html`, `style.css`, `app.js`, `config.js`, dan `supabase.sql` (SQL boleh disimpan di tempat privat; jangan wajib ikut situs).
3. Di repository buka **Settings → Pages**.
4. Pilih **Deploy from a branch**, branch `main`, folder `/ (root)`, lalu **Save**.
5. Tunggu proses deploy, kemudian buka URL GitHub Pages yang ditampilkan.

## D. Uji sebelum digunakan
- Login dengan akun siswa dan pastikan hanya riwayat siswa tersebut yang terlihat.
- Coba simpan Hadir/Sakit/Izin, muat ulang, dan pastikan data masih ada.
- Login admin, uji filter dan ekspor CSV, lalu coba ubah status menjadi Alpa.
- Uji di HP serta laptop.
- Jika situs memakai URL lain, cek **Authentication → URL Configuration** pada Supabase bila perlu.

## Catatan keamanan dan batasan versi awal
- RLS membatasi siswa melihat data absensinya sendiri dan hanya membuat/memperbarui absensi hari ini. Admin dapat membaca semua catatan dan memperbaiki status.
- Website ini belum memiliki pendaftaran publik, reset password custom, lampiran surat sakit, jadwal kelas, pembatasan jam absensi, maupun fitur persetujuan izin.
- Browser tidak dapat membuktikan secara fisik bahwa siswa berada di sekolah. Untuk keperluan resmi, tambahkan pengawasan guru, jam absensi, atau mekanisme verifikasi yang sesuai kebijakan sekolah.
- Supabase free tier memiliki batas penggunaan dan kebijakan retensi proyek; periksa dashboard/paket terkini dan siapkan backup berkala. “Permanen” berarti data tetap tersimpan selama project dan database dipertahankan, bukan jaminan tanpa batas.
- Jangan memasukkan data sensitif yang tidak diperlukan. Minta izin sekolah dan ikuti kebijakan privasi data siswa.
