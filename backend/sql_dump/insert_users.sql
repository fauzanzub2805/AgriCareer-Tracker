-- Script untuk menyisipkan data pengguna default secara instan.
-- Sandi ini sudah di-hash khusus backend.

INSERT INTO users (username, full_name, email, nim, nip, role, hashed_password, disabled) 
VALUES ('mhs_arip', 'Arief Abdul Rahman', 'aar.arief@apps.ipb.ac.id', 'G6401231038', NULL, 'mahasiswa', '$5$rounds=535000$v2QGVRaa60LvcSIC$p2odB9Ig3RD1vYxfFLoV0obZ35kywTf.Udp1RFTnTr5', 0);

INSERT INTO users (username, full_name, email, nim, nip, role, hashed_password, disabled) 
VALUES ('etmin_ludwik', 'Ludwig Alven T. L. Tobing', 'tobingludwig@apps.ipb.ac.id', NULL, 'G6401231006', 'admin', '$5$rounds=535000$kenO1vDfiYijC2Y3$a7wbJuWwgY1Vr3yDV5VNDBeNhU30unvp82yRchis5W9', 0);

INSERT INTO users (username, full_name, email, nim, nip, role, hashed_password, disabled) 
VALUES ('dosen_ojan', 'Muhammad Fauzan Zubaedi', 'fauzanzubaedi@apps.ipb.ac.id', NULL, 'G6401231129', 'dosen', '$5$rounds=535000$pVj5ip9s1gVDgI.V$JuFsTU5E0DcW2MlxwZhhybeP0fyn.ti12VZLGuMhGj6', 0);