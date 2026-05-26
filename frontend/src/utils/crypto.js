import CryptoJS from 'crypto-js';

// Dalam sistem produksi, secret ini harus diletakkan di .env (misal: import.meta.env.VITE_CHAT_SECRET)
// Untuk purwarupa ini, kita bisa menggunakan hardcoded key atau dummy key.
const SECRET_KEY = import.meta.env.VITE_CHAT_SECRET_KEY || 'agricareer_super_secret_key_2026';

/**
 * Mengenkripsi teks biasa menjadi ciphertext menggunakan AES
 * @param {string} text - Pesan asli
 * @returns {string} - Teks acak (ciphertext)
 */
export const encryptMessage = (text) => {
  if (!text) return text;
  try {
    return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
  } catch (e) {
    console.error("Encryption error:", e);
    return text;
  }
};

/**
 * Mendekripsi ciphertext menjadi teks biasa
 * @param {string} ciphertext - Teks acak dari database
 * @returns {string} - Pesan asli
 */
export const decryptMessage = (ciphertext) => {
  if (!ciphertext) return ciphertext;

  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
    const originalText = bytes.toString(CryptoJS.enc.Utf8);

    // Jika hasil dekripsi kosong tapi ciphertext ada, kemungkinan besar itu adalah 
    // pesan lama yang belum dienkripsi (atau kunci berubah).
    // Kita kembalikan ciphertext apa adanya (fallback ke teks asli)
    if (!originalText) {
      return ciphertext;
    }

    return originalText;
  } catch (e) {
    // Error saat dekripsi (biasanya karena format salah/teks belum dienkripsi)
    // Kembalikan sebagai teks normal
    return ciphertext;
  }
};
