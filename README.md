# LUXXI STORE — Website Toko Digital

Website statis berbasis HTML, CSS, dan JavaScript. Bisa dipublikasikan melalui GitHub Pages.

## Isi fitur
- Katalog produk dan kategori otomatis
- Pencarian produk
- Keranjang dengan kuantitas dan total
- Checkout yang menyusun pesan WhatsApp
- Panel admin demo untuk tambah/edit/hapus produk
- Pengaturan nama toko dan nomor WhatsApp
- Desain responsif untuk HP dan desktop

## Struktur
```text
luxxi-store/
├── index.html
├── style.css
├── app.js
└── README.md
```

## Sebelum dipublikasikan
1. Buka `app.js`.
2. Ganti `ADMIN_PASSWORD = "luxxi123"` dengan password unik. Ingat: ini hanya pengunci antarmuka di browser, bukan keamanan sungguhan.
3. Ganti nomor contoh `6281234567890` di `DEFAULT_SETTINGS` dengan nomor WhatsApp admin, format internasional tanpa `+`, spasi, atau strip.
4. Ganti produk contoh pada `DEFAULT_PRODUCTS` dengan produk asli, harga, kategori, deskripsi, dan URL gambar HTTPS jika ada.
5. Jangan memasukkan token bot, password akun, API key rahasia, atau data pelanggan ke dalam file frontend.

## Cara tes di perangkat
Buka `index.html` di browser. Untuk hasil paling konsisten, gunakan extension server lokal di editor atau jalankan server lokal sederhana. Semua perubahan panel admin disimpan di `localStorage` browser saat ini.

## Deploy ke GitHub Pages
1. Login ke GitHub dan buat repository baru, misalnya `luxxi-store`.
2. Upload `index.html`, `style.css`, `app.js`, dan `README.md` ke root repository.
3. Buka **Settings → Pages**.
4. Pada **Build and deployment**, pilih **Deploy from a branch**.
5. Pilih branch `main` dan folder `/(root)`, lalu tekan **Save**.
6. Tunggu proses selesai. Alamat website biasanya berbentuk `https://USERNAME.github.io/luxxi-store/`.
7. Jika mengubah file, commit perubahan ke branch `main`; GitHub Pages akan memperbarui website.

## Batasan penting
GitHub Pages hanya meng-host file statis. Panel admin demo menyimpan perubahan produk dan pengaturan di `localStorage` browser yang sedang dipakai; pengunjung lain tidak melihat perubahan itu. Password admin berada di JavaScript yang dapat dibaca publik, sehingga tidak boleh dianggap aman. Checkout WhatsApp hanya membuka aplikasi/web WhatsApp dengan pesan yang telah disusun—tidak memproses pembayaran otomatis.

Untuk toko sungguhan dengan admin aman, produk bersama, stok, transaksi, dan pembayaran, gunakan backend/database (misalnya Supabase atau Firebase) serta aturan akses yang benar.
