// ============================================================
// --- VARIABEL GLOBAL ---
// ============================================================
let gameState = {
    day: 1,
    score: 0,
    money: 0,
    currentDialogueIndex: 0,
    mode: "dialogue", // "dialogue", "waiting_click", "cooking", "calculating", "choosing", "typing"
    waitingAction: null
};

// Variabel global untuk sistem memasak
let currentRecipe = [];
let targetStep = 0;
let cookingMistakes = 0;

// Variabel global untuk efek teks berjalan
let typingTimer = null;
let isTextFullyDisplayed = false;
let currentFullText = "";

// ============================================================
// --- SISTEM AUDIO & BGM ---
// ============================================================

const bgmPlayer = new Audio();
bgmPlayer.volume = 0.35;

let currentBgmMode = ""; // "sad" atau "main"
let mainBgmIndex = 1; // 1 untuk BGM-1, 2 untuk BGM-2

function playBGM(mode) {
    if (currentBgmMode === mode) return;
    currentBgmMode = mode;

    if (!audioUnlocked) {
        pendingBgmMode = mode; // audio masih terkunci, simpan untuk diputar nanti
        return;
    }

    if (mode === "sad") {
        bgmPlayer.src = "audio/BGM-sad.mp3";
        bgmPlayer.loop = true;
    } else if (mode === "main") {
        bgmPlayer.src = `audio/BGM-${mainBgmIndex}.mp3`;
        bgmPlayer.loop = false;
    } else {
        bgmPlayer.pause();
        return;
    }

    bgmPlayer.play().catch(() => {});
}

// Logika Playlist: Bergantian BGM 1 dan BGM 2 sepanjang game
bgmPlayer.addEventListener("ended", () => {
    if (currentBgmMode === "main") {
        mainBgmIndex = mainBgmIndex === 1 ? 2 : 1; // Tukar urutan lagu
        bgmPlayer.src = `audio/BGM-${mainBgmIndex}.mp3`;
        bgmPlayer.play().catch(() => {});
    }
});

const sfxText = new Audio("audio/TEXT.mp3");
sfxText.volume = 0.4;

function playTextSound() {
    sfxText.currentTime = 0;
    sfxText.play().catch(e => {});
}

// Bypass Autoplay Policy — mulai BGM saat klik pertama
let audioUnlocked = false;
let pendingBgmMode = "";

document.addEventListener("click", () => {
    if (!audioUnlocked) {
        audioUnlocked = true;
        if (pendingBgmMode) {
            const mode = pendingBgmMode;
            pendingBgmMode = "";
            currentBgmMode = ""; // reset agar playBGM mau re-trigger
            playBGM(mode);
        } else if (currentBgmMode && bgmPlayer.paused) {
            bgmPlayer.play().catch(() => {});
        }
    }
});

// ============================================================
// --- DATA RESEP MAKANAN (SATU SUMBER KEBENARAN) ---
// ============================================================
const resepMakanan = {
    "Nasi Goreng": [
        "Siapkan Wajan",
        "Tuang Minyak & Telur",
        "Masukkan Nasi",
        "Beri Bumbu",
        "Bungkus"
    ],
    "Mie Goreng": [
        "Rebus Mie",
        "Siapkan Wajan",
        "Masukkan Bumbu",
        "Aduk Mie",
        "Bungkus"
    ],
    "Bubur Ayam": [
        "Masak Bubur",
        "Siapkan Mangkok",
        "Tuang Bubur",
        "Beri Topping Ayam",
        "Bungkus"
    ],
    "Ayam Goreng": [
        "Siapkan Bumbu",
        "Lumuri Ayam",
        "Panaskan Minyak",
        "Goreng Ayam",
        "Tiriskan & Bungkus"
    ]
};

// ============================================================
// --- DATA NARASI PROLOG (PEMBUKA) ---
// ============================================================
const storyPrologue = [
    { speaker: "System", text: "[Suatu siang di pusat kota...]", bg: "images/backgrounds/IMG_3102.JPG", showCart: false, hideUI: true, bgm: "sad" },
    { speaker: "Azka", text: "Hah... Surat lamaran kerjaku ditolak lagi.", bg: "images/backgrounds/IMG_3102.JPG", showCart: false, hideUI: true },
    { speaker: "Azka", text: "Padahal aku ini fresh graduate jurusan Tata Boga. Masa iya tidak ada yang mau menerima aku?", bg: "images/backgrounds/IMG_3102.JPG", showCart: false, hideUI: true },
    { speaker: "Azka", text: "Sudah kirim ke puluhan tempat... Jawaban mereka selalu sama: 'Maaf, kami butuh yang berpengalaman.'", bg: "images/backgrounds/IMG_3102.JPG", showCart: false, hideUI: true },
    
    { speaker: "Azka", text: "...", bg: "images/backgrounds/IMG_3103.JPG", showCart: false, hideUI: true },
    { speaker: "Azka", text: "Gimana caranya dapat pengalaman kalau tidak ada yang mau kasih kesempatan kerja?", bg: "images/backgrounds/IMG_3103.JPG", showCart: false, hideUI: true },
    { speaker: "Azka", text: "Hmm... Bagaimana kalau aku buat usahaku sendiri? Kan aku sudah punya ilmunya.", bg: "images/backgrounds/IMG_3103.JPG", showCart: false, hideUI: true },
    { speaker: "Azka", text: "Belakangan ini lagi viral aplikasi toko kuliner digital warna pink, namanya 'Foodlove'.", bg: "images/backgrounds/IMG_3103.JPG", showCart: false, hideUI: true },
    { speaker: "Azka", text: "Katanya bisa jualan makanan online tanpa perlu sewa tempat mahal. Coba aku unduh deh!", bg: "images/backgrounds/IMG_3103.JPG", showCart: false, hideUI: true },
    
    { speaker: "System", text: "[Beberapa hari kemudian... Azka membuka gerobak makanannya.]", action: "transition_to_day1" }
];

// ============================================================
// --- DATA NARASI DAY 1 ---
// ============================================================
// Data tips registrasi Metallicat
const registrationTips = [
    {
        icon: "🏪",
        title: "Branding & Identitas Toko",
        tip: "Pilih nama toko yang unik, mudah diingat, dan mencerminkan produkmu. Foto profil dan banner yang menarik bisa meningkatkan kepercayaan pelanggan hingga 60%!",
        metallicat: "Meow! Nama toko itu ibarat wajahmu di dunia digital. Pastikan berkesan!"
    },
    {
        icon: "📋",
        title: "Izin & Keamanan Pangan",
        tip: "Pastikan kamu memiliki sertifikat keamanan pangan (PIRT/SPP-IRT) dari Dinas Kesehatan. Ini wajib untuk usaha kuliner rumahan dan meningkatkan kepercayaan pelanggan.",
        metallicat: "Legalitas itu penting, Azka! Pelanggan lebih percaya pada toko yang terdaftar resmi."
    },
    {
        icon: "💰",
        title: "Manajemen Keuangan",
        tip: "Pisahkan uang pribadi dan uang usaha sejak hari pertama. Catat setiap pemasukan dan pengeluaran. Gunakan prinsip: Pendapatan - Modal = Laba Bersih.",
        metallicat: "Banyak usaha gagal bukan karena sepi pembeli, tapi karena keuangannya tidak tercatat rapi!"
    },
    {
        icon: "⭐",
        title: "Pelayanan Pelanggan",
        tip: "Respons cepat, ramah, dan solutif adalah kunci rating bintang 5. Pelanggan yang puas akan menjadi 'marketing gratis' melalui ulasan positif dan rekomendasi.",
        metallicat: "Di platform online, reputasi digital adalah segalanya. Satu ulasan buruk bisa mengubah segalanya!"
    },
    {
        icon: "📱",
        title: "Pemasaran Digital",
        tip: "Manfaatkan fitur promosi di aplikasi, foto produk yang menarik, dan deskripsi menu yang menggugah selera. Konsistensi posting dan promo di jam ramai bisa meningkatkan penjualan.",
        metallicat: "Foto makanan yang cantik itu investasi, bukan pemborosan! Pelanggan makan dengan mata dulu, meow~"
    }
];

let registrationStep = 0;
let isRegistrationActive = false;

function openRegistrationScreen() {
    isRegistrationActive = true;
    registrationStep = 0;
    
    const appText = document.getElementById("app-text");
    appText.innerHTML = `
        <div class="reg-container" id="reg-container">
            <div class="reg-welcome">
                <div class="reg-logo"></div>
                <h3 class="reg-title">Selamat Datang di Foodlove!</h3>
                <p class="reg-subtitle">Sebelum mulai berjualan, Metallicat punya beberapa tips penting untukmu...</p>
            </div>
            <div class="reg-tip-area" id="reg-tip-area"></div>
            <div class="reg-progress" id="reg-progress">
                ${registrationTips.map((_, i) => `<div class="reg-dot" id="reg-dot-${i}"></div>`).join('')}
            </div>
        </div>
    `;
    
    // Tombol aksi jadi "Mulai"
    btnAction.innerText = "Mulai Tips dari Metallicat";
    btnAction.classList.remove("hidden");
    btnAction.onclick = () => showNextRegistrationTip();
}

function showNextRegistrationTip() {
    if (registrationStep >= registrationTips.length) {
        // Selesai registrasi
        finishRegistration();
        return;
    }
    
    const tip = registrationTips[registrationStep];
    const tipArea = document.getElementById("reg-tip-area");
    
    // Update dot progress
    registrationTips.forEach((_, i) => {
        const dot = document.getElementById(`reg-dot-${i}`);
        if (dot) {
            dot.classList.toggle('active', i === registrationStep);
            dot.classList.toggle('done', i < registrationStep);
        }
    });
    
    tipArea.innerHTML = `
        <div class="reg-tip-card" id="reg-tip-card">
            <div class="reg-tip-icon">${tip.icon}</div>
            <div class="reg-tip-title">${tip.title}</div>
            <div class="reg-tip-text">${tip.tip}</div>
            <div class="reg-tip-metallicat">
                <img src="images/characters/metallicat.jpeg" alt="Metallicat" class="reg-mc-avatar">
                <div class="reg-mc-bubble">${tip.metallicat}</div>
            </div>
        </div>
    `;
    
    // Animate card entrance
    const card = document.getElementById("reg-tip-card");
    card.classList.add("reg-tip-enter");
    
    registrationStep++;
    
    if (registrationStep >= registrationTips.length) {
        btnAction.innerText = "Selesai & Daftarkan Toko";
    } else {
        btnAction.innerText = `Tips ${registrationStep + 1}/${registrationTips.length}`;
    }
    
    btnAction.onclick = () => showNextRegistrationTip();
}

function finishRegistration() {
    isRegistrationActive = false;
    const appText = document.getElementById("app-text");
    appText.innerHTML = `
        <div class="reg-container">
            <div class="reg-complete">
                <div class="reg-complete-icon"></div>
                <h3 class="reg-title" style="color:#69e08a;">Registrasi Berhasil!</h3>
                <p class="reg-subtitle">Toko <b>\"Dapur Azka\"</b> kini terdaftar di Foodlove.</p>
                <div class="reg-recap">
                    <p class="reg-recap-label">Ringkasan Tips Metallicat:</p>
                    ${registrationTips.map(t => `<div class="reg-recap-item"><span>${t.icon}</span> ${t.title}</div>`).join('')}
                </div>
            </div>
        </div>
    `;
    btnAction.innerText = "Tutup & Mulai Berjualan";
    btnAction.classList.remove("hidden");
    btnAction.onclick = () => {
        btnAction.classList.add("hidden");
        btnAction.onclick = null;
        phoneScreen.classList.add("hidden");
        // Lanjutkan cerita
        gameState.mode = "dialogue";
        nextDialogue();
    };
}

const storyDay1 = [
    { speaker: "Azka", text: "Oke! Gerobak sudah siap, bahan-bahan sudah lengkap. Tinggal buka toko online-nya!", bg: "images/backgrounds/IMG_3104.JPG", showCart: true, hideUI: false, bgm: "main" },
    { speaker: "Azka", text: "Tapi... gimana caranya ya? Aku belum pernah pakai aplikasi Foodlove sebelumnya.", showCart: true },
    
    { speaker: "Metallicat", text: "Meow! Halo, manusia! Selamat datang di ekosistem Foodlove!", chara: null }, 
    { speaker: "Azka", text: "Eh?! Kucing bisa bicara?!", chara: null },
    { speaker: "Metallicat", text: "Aku adalah asisten virtualmu. Panggil saja aku Metallicat. Aku akan memandumu memahami sistem operasional dasar di sini.", chara: null },
    { speaker: "Metallicat", text: "Sebelum mulai berjualan, kamu harus mendaftar dulu di aplikasi. Buka HP-mu sekarang!", action: "wait_open_phone_register" },
    
    { speaker: "Metallicat", text: "Bagus! Kamu sudah membaca semua tips penting dariku. Sekarang akun tokomu sudah terdaftar dan siap beroperasi.", chara: null },
    { speaker: "Metallicat", text: "Ingat ya, Azka — branding, legalitas, keuangan, pelayanan, dan pemasaran digital adalah 5 pilar utama usaha online!", chara: null },
    { speaker: "Azka", text: "Siap! Aku sudah catat semua tipsnya. Terasa lebih siap sekarang!", chara: null },
    { speaker: "Metallicat", text: "Meow! Sekarang mari kita coba terima pesanan pertamamu. Aku akan memesan Nasi Goreng melalui gawaiku. Buka HP-mu dan cek pesanan yang masuk!", action: "trigger_order_tutorial" },
    
    { speaker: "Azka", text: "Wah, pesanannya sudah masuk! Nasi Goreng satu porsi.", chara: null },
    { speaker: "Metallicat", text: "Tepat sekali! Sekarang tugasmu adalah menyiapkannya di dapur. Klik bahan sesuai urutan yang benar!", action: "wait_cook_nasi_goreng" },
    
    { speaker: "Azka", text: "Fiuh, Nasi Gorengnya sudah siap dan dibungkus rapi!", chara: null },
    { speaker: "Metallicat", text: "Kerja bagus, Azka! Sekarang kita tinggal menunggu kurir ojek online datang mengambilnya.", chara: null },
    
    { speaker: "Irma (Ojol)", text: "Permisi, Foodlove! Ambil pesanan atas nama Metallicat, Nasi Goreng satu porsi ya, mas.", chara: "images/characters/chara1/Default.png" },
    { speaker: "Azka", text: "Iya Kak, ini pesanannya sudah siap.", chara: "images/characters/chara1/Default.png" },
    { speaker: "Irma (Ojol)", text: "Oke. Ini pembayaran tunai pas dari pelanggan ya, Rp15.000. Terima kasih!", chara: "images/characters/chara1/Open mouth.png", earnMoney: 15000, addScore: 1 },
    { speaker: "Azka", text: "Wah, uang pertamaku! Terima kasih banyak, Kak. Hati-hati di jalan!", chara: "images/characters/chara1/Default.png" },
    { speaker: "Irma (Ojol)", text: "Mari, mas. Semoga laris manis dagangannya!", chara: "images/characters/chara1/Default.png" },
    
    { speaker: "Azka", text: "Ternyata tidak terlalu sulit ya berjualan online. Apalagi Metallicat sudah memberi tips yang sangat berguna tadi.", chara: null },
    { speaker: "Metallicat", text: "Meow! Jangan lengah dulu. Besok tantangannya akan lebih sulit karena kamu harus menghitung kembalian tunai.", chara: null },
    { speaker: "Metallicat", text: "Sampai jumpa besok, persiapkan mentalmu!", chara: null },
    { speaker: "System", text: "[Hari Pertama Selesai! Mengkalkulasi progres...]", action: "end_day_1" }
];

let activeStory = storyPrologue;

// ============================================================
// --- ELEMEN DOM ---
// ============================================================
const uiName = document.getElementById("speaker-name");
const uiText = document.getElementById("dialogue-text");
const charaImg = document.getElementById("character");
const phoneScreen = document.getElementById("phone-screen");
const hpNotif = document.getElementById("hp-notif");
const interactionScreen = document.getElementById("interaction-screen");
const interactionContent = document.getElementById("interaction-content");
const btnAction = document.getElementById("btn-action");
const bgMain = document.getElementById("bg-main");
const cartImg = document.getElementById("cart");
const uiMoney = document.getElementById("ui-money");
const uiHpIcon = document.getElementById("ui-hp-icon");
const metallicatAside = document.getElementById("metallicat-aside");
const overlay = document.getElementById("overlay");

const dayTransition = document.getElementById("day-transition");
const dayTransitionText = document.getElementById("day-transition-text");

// Inisialisasi awal
cartImg.classList.add("hidden");
uiMoney.classList.add("hidden");
uiHpIcon.style.pointerEvents = "auto";
uiHpIcon.style.opacity = "0";

// ============================================================
// --- SISTEM TRANSISI HARI (FADE TO BLACK) ---
// ============================================================
function playDayTransition(title, subtitle, callback, holdDuration = 2000) {
    dayTransitionText.innerHTML = `${title}<span class="day-trans-sub">${subtitle}</span>`;
    dayTransition.classList.add("active");

    // Tunggu layar gelap penuh + teks muncul, lalu panggil callback
    setTimeout(() => {
        if (callback) callback();

        // Setelah callback, tahan sejenak lalu fade-out
        setTimeout(() => {
            dayTransition.classList.remove("active");
        }, holdDuration);
    }, 1200); // waktu untuk fade-in selesai + teks tampil
}

// Update jam HP secara real-time
function updatePhoneTime() {
    const el = document.getElementById("phone-time");
    if (el) {
        const now = new Date();
        el.textContent = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    }
}
updatePhoneTime();
setInterval(updatePhoneTime, 30000);

updateUI();
loadDialogue();

// ============================================================
// --- LOGIKA EFEK TEKS BERJALAN (TYPEWRITER EFFECT) ---
// ============================================================
function typeText(text, speed = 25) {
    clearInterval(typingTimer);
    isTextFullyDisplayed = false;
    currentFullText = text;
    uiText.textContent = ""; // Kosongkan layar teks
    
    let index = 0;
    let displayed = ""; // Akumulasi string terpisah untuk menghindari bug spasi innerText
    gameState.mode = "typing";

    typingTimer = setInterval(() => {
        if (index < text.length) {
            // Tambahkan karakter ke string akumulasi, lalu set textContent sekaligus
            displayed += text.charAt(index);
            uiText.textContent = displayed;
            
            // Putar suara ketikan HANYA jika bukan spasi agar tidak berisik
            if (text.charAt(index) !== " ") {
                playTextSound();
            }
            
            index++;
        } else {
            clearInterval(typingTimer);
            isTextFullyDisplayed = true;
            
            // Kembalikan mode setelah pengetikan selesai
            let currentLine = activeStory[gameState.currentDialogueIndex];
            if (currentLine.action && currentLine.action !== "transition_to_day1") {
                gameState.mode = "waiting_click";
            } else {
                gameState.mode = "dialogue";
            }
        }
    }, speed);
}

// ============================================================
// --- LOGIKA MESIN VISUAL NOVEL ---
// ============================================================
function loadDialogue() {
    if (gameState.currentDialogueIndex >= activeStory.length) return;
    
    let currentLine = activeStory[gameState.currentDialogueIndex];
    
    // BGM: mode "sad" hanya di prolog, "main" (BGM-1/2 bergantian) sepanjang game
    if (currentLine.bgm) {
        playBGM(currentLine.bgm);
    }

    uiName.innerText = currentLine.speaker;
    
    // Pewarnaan Nama Karakter (tone down — hapus glow, pakai warna solid)
    if (currentLine.speaker === "System")          uiName.style.color = "#e8d96e";
    else if (currentLine.speaker === "Metallicat") uiName.style.color = "#7ee8e8";
    else if (currentLine.speaker.includes("Irma")) uiName.style.color = "#ffa8bb";
    else if (currentLine.speaker.includes("Rusdi")) uiName.style.color = "#9db8f5";
    else if (currentLine.speaker.includes("Mbah")) uiName.style.color = "#c4a8f0";
    else uiName.style.color = "#f0c8d0";

    // Panggil efek teks berjalan
    typeText(currentLine.text);

    if (currentLine.bg) {
        bgMain.src = currentLine.bg;
    }

    if (currentLine.showCart === true) {
        cartImg.classList.remove("hidden");
    } else if (currentLine.showCart === false) {
        cartImg.classList.add("hidden");
    }

    // Metallicat aside: tampil hanya saat Metallicat bicara
    if (currentLine.speaker === "Metallicat") {
        if (metallicatAside.classList.contains("hidden")) {
            // Kemunculan pertama: animasi slide-in
            metallicatAside.classList.remove("hidden");
            metallicatAside.classList.remove("metallicat-visible");
            void metallicatAside.offsetWidth; // trigger reflow
            metallicatAside.classList.add("metallicat-enter");
            setTimeout(() => {
                metallicatAside.classList.remove("metallicat-enter");
                metallicatAside.classList.add("metallicat-visible");
            }, 600);
        }
    } else {
        // Sembunyikan saat karakter lain bicara (kecuali sudah pernah muncul — tetap tampil tapi fade)
        // Hanya sembunyikan total jika belum pernah tampil sama sekali
        if (!metallicatAside.classList.contains("metallicat-visible") &&
            !metallicatAside.classList.contains("metallicat-enter")) {
            metallicatAside.classList.add("hidden");
        }
    }

    if (currentLine.hideUI === true) {
        uiMoney.classList.add("hidden");
        uiHpIcon.style.opacity = "0";
    } else if (currentLine.hideUI === false) {
        uiMoney.classList.remove("hidden");
        uiHpIcon.style.opacity = "1";
    }

    if (currentLine.chara) {
        charaImg.src = currentLine.chara;
        charaImg.classList.remove("hidden");
    } else {
        charaImg.classList.add("hidden");
    }

    if (currentLine.earnMoney) updateMoney(currentLine.earnMoney);
    if (currentLine.addScore) updateScore(currentLine.addScore);

    if (currentLine.action) {
        handleAction(currentLine.action);
    }
}

function nextDialogue() {
    // Jika teks sedang berjalan, klik akan langsung memunculkan seluruh teks
    if (gameState.mode === "typing") {
        clearInterval(typingTimer);
        uiText.textContent = currentFullText;
        isTextFullyDisplayed = true;
        
        let currentLine = activeStory[gameState.currentDialogueIndex];
        if (currentLine.action && currentLine.action !== "transition_to_day1") {
            gameState.mode = "waiting_click";
        } else {
            gameState.mode = "dialogue";
        }
        return;
    }

    if (gameState.mode !== "dialogue") return; 
    
    gameState.currentDialogueIndex++;
    if (gameState.currentDialogueIndex < activeStory.length) {
        loadDialogue();
    }
}

// ============================================================
// --- SISTEM AKSI (HANDLER UTAMA) ---
// ============================================================
function handleAction(actionType) {
    switch (actionType) {
        case "transition_to_day1":
            gameState.mode = "waiting_click";
            playDayTransition("Hari Pertama", "Tutorial Toko Online", () => {
                gameState.currentDialogueIndex = 0;
                activeStory = storyDay1;
                gameState.mode = "dialogue";
                loadDialogue();
            }, 2200);
            break;

        case "wait_open_phone":
            // Tetap izinkan HP diklik dengan mengubah mode tunggu khusus
            hpNotif.classList.remove("hidden");
            uiHpIcon.style.opacity = "1";
            break;

        case "wait_open_phone_register":
            // Sama seperti wait_open_phone tapi trigger registrasi
            hpNotif.classList.remove("hidden");
            uiHpIcon.style.opacity = "1";
            gameState.waitingAction = "register";
            break;
            
        case "trigger_order_tutorial":
            document.getElementById("app-text").innerText = "Terdapat Pesanan Baru:\n\n1x Nasi Goreng\nPembayaran: Tunai (COD)\nTotal: Rp15.000";
            btnAction.innerText = "Terima Pesanan";
            btnAction.onclick = () => processOrder();
            btnAction.classList.remove("hidden");
            hpNotif.classList.remove("hidden");
            uiHpIcon.style.opacity = "1";
            break;

        case "wait_cook_nasi_goreng":
            gameState.mode = "cooking";
            openCookingScreen("Nasi Goreng");
            break;

        case "end_day_1":
            setTimeout(() => {
                showDaySummary(1);
                setTimeout(() => {
                    const btn = interactionContent.querySelector("button");
                    if (btn) btn.onclick = () => {
                        interactionScreen.classList.add("hidden");
                        playDayTransition("Hari Kedua", "Tantangan Kembalian Tunai", () => {
                            startDay2();
                        }, 2200);
                    };
                }, 200);
            }, 1000);
            break;

        case "trigger_order_day2_irma":
            document.getElementById("app-text").innerText = "Pesanan Baru (Irma)\n\n1x Nasi Goreng\nHarga: Rp15.000\nPembayaran: Rp20.000\nKembalian: ???";
            btnAction.innerText = "Terima Pesanan";
            btnAction.onclick = () => processOrder();
            btnAction.classList.remove("hidden");
            hpNotif.classList.remove("hidden");
            break;

        case "trigger_order_day2_rusdi":
            document.getElementById("app-text").innerText = "Pesanan Baru (Pak Rusdi)\n\n1x Mie Goreng\nHarga: Rp13.000\nPembayaran: Rp20.000\nKembalian: ???";
            btnAction.innerText = "Terima Pesanan";
            btnAction.onclick = () => processOrder();
            btnAction.classList.remove("hidden");
            hpNotif.classList.remove("hidden");
            break;

        case "trigger_order_day2_mbah":
            document.getElementById("app-text").innerText = "Pesanan Baru (Mbah)\n\n1x Bubur Ayam\nHarga: Rp10.000\nPembayaran: Rp50.000\nKembalian: ???";
            btnAction.innerText = "Terima Pesanan";
            btnAction.onclick = () => processOrder();
            btnAction.classList.remove("hidden");
            hpNotif.classList.remove("hidden");
            break;

        case "wait_cook_mie_goreng":
            gameState.mode = "cooking";
            openCookingScreen("Mie Goreng");
            break;

        case "wait_cook_bubur_ayam":
            gameState.mode = "cooking";
            openCookingScreen("Bubur Ayam");
            break;

        case "wait_change_irma":
            gameState.mode = "calculating";
            openChangeCalculator(20000, 15000);
            break;

        case "wait_change_rusdi":
            gameState.mode = "calculating";
            openChangeCalculator(20000, 13000);
            break;

        case "wait_change_mbah":
            gameState.mode = "calculating";
            openChangeCalculator(50000, 10000);
            break;

        case "end_day_2":
            setTimeout(() => {
                showDaySummary(2);
                setTimeout(() => {
                    const btn = interactionContent.querySelector("button");
                    if (btn) btn.onclick = () => {
                        interactionScreen.classList.add("hidden");
                        playDayTransition("Hari Ketiga", "Manajemen Konflik & Refleksi", () => {
                            startDay3();
                        }, 2200);
                    };
                }, 200);
            }, 1000);
            break;

        case "show_rating_bad":
            document.getElementById("app-text").innerHTML =
                `<div style="text-align:center;padding:8px 0;">
                    <div style="font-size:22px;margin-bottom:6px;letter-spacing:4px;">★☆☆☆☆</div>
                    <b style="color:#e05560;font-size:14px;">Ulasan Baru — Bintang 2</b>
                    <hr style="margin:10px 0;border-color:rgba(255,107,157,0.2);">
                    <p style="font-size:13px;color:var(--text-main);text-align:left;line-height:1.6;opacity:0.85;">"Pesanannya lama, kembaliannya sempat salah. Tolong lebih teliti ya mas! Semoga bisa meningkatkan pelayanannya."</p>
                    <p style="font-size:11px;color:var(--text-dim);margin-top:8px;letter-spacing:1px;">— Pelanggan Anonim</p>
                </div>`;
            btnAction.innerText = "Tutup Ulasan";
            btnAction.classList.remove("hidden");
            btnAction.onclick = () => {
                btnAction.classList.add("hidden");
                btnAction.onclick = null;
                document.getElementById("app-text").innerText = "Tidak ada pesanan masuk.";
                phoneScreen.classList.add("hidden");
                gameState.mode = "dialogue";
                nextDialogue();
            };
            hpNotif.classList.remove("hidden");
            break;

        case "double_order_choice":
            gameState.mode = "choosing";
            showChoices(
                "Double Order! Siapa yang kamu layani duluan?",
                [
                    {
                        label: "Layani Irma dulu\n(Mie Goreng + Ayam Goreng)",
                        action: () => {
                            interactionScreen.classList.add("hidden");
                            insertStorySegment(storyDay3_Irma.concat(storyDay3_Rusdi).concat(storyDay3_Mbah).concat(storyDay3_Ending));
                            gameState.mode = "dialogue";
                            nextDialogue();
                        }
                    },
                    {
                        label: "Layani Pak Rusdi dulu\n(Mie Goreng, uang pas)",
                        action: () => {
                            interactionScreen.classList.add("hidden");
                            insertStorySegment(storyDay3_Rusdi.concat(storyDay3_Irma).concat(storyDay3_Mbah).concat(storyDay3_Ending));
                            gameState.mode = "dialogue";
                            nextDialogue();
                        }
                    }
                ]
            );
            break;

        case "trigger_double_order_hp":
            document.getElementById("app-text").innerHTML =
                `<div style="text-align:left;">
                    <b style="color:#e05560;">2 Pesanan Masuk Bersamaan!</b>
                    <hr style="margin:8px 0;border-color:rgba(255,107,157,0.3);">
                    <p style="font-size:13px;margin:6px 0;"><b>Irma</b>: 1x Mie Goreng + 1x Ayam Goreng</p>
                    <p style="font-size:13px;margin:6px 0;"><b>Pak Rusdi</b>: 1x Mie Goreng (Rp13.000, uang pas)</p>
                    <p style="font-size:12px;color:var(--text-dim);margin-top:10px;">Tentukan siapa yang dilayani duluan!</p>
                </div>`;
            btnAction.innerText = "Tentukan Prioritas";
            btnAction.classList.remove("hidden");
            btnAction.onclick = () => {
                btnAction.classList.add("hidden");
                btnAction.onclick = null;
                document.getElementById("app-text").innerText = "Tidak ada pesanan masuk.";
                phoneScreen.classList.add("hidden");
                handleAction("double_order_choice");
            };
            hpNotif.classList.remove("hidden");
            break;

        case "cook_irma_mie_goreng":
            gameState.mode = "cooking";
            cookingMistakes = 0; 
            openCookingScreen("Mie Goreng");
            break;

        case "cook_irma_ayam_goreng":
            gameState.mode = "cooking";
            openCookingScreen("Ayam Goreng");
            break;

        case "eval_irma_cooking":
            if (cookingMistakes === 0) {
                updateScore(2);
                insertStorySegment([
                    { speaker: "Irma (Ojol)", text: "Halo mas! Saya kurir atas nama Irma, mau ambil pesanan Mie Goreng dan Ayam Goreng.", chara: "images/characters/chara1/Default.png" },
                    { speaker: "Azka", text: "Kak Irma! Ini pesanannya, dua-duanya sudah siap. Silakan dicek dulu.", chara: "images/characters/chara1/Default.png" },
                    { speaker: "Irma (Ojol)", text: "Wah, cepat banget! Bungkusannya juga rapi. Biasanya kalau dua pesanan gini suka lama lho, mas.", chara: "images/characters/chara1/Open mouth.png" },
                    { speaker: "Azka", text: "Hehe, aku usahakan secepat mungkin, Kak. Nggak enak bikin pelanggan nunggu.", chara: "images/characters/chara1/Default.png" },
                    { speaker: "Irma (Ojol)", text: "Nah, penjual yang kayak gini nih yang bikin betah. Sudah cepat, ramah lagi.", chara: "images/characters/chara1/Open mouth.png" },
                    { speaker: "Irma (Ojol)", text: "Aku pasti kasih bintang 5 dan ulasan bagus deh! Ini uangnya, Rp28.000 ya.", chara: "images/characters/chara1/Open mouth.png", earnMoney: 28000 },
                    { speaker: "Azka", text: "Makasih banyak, Kak Irma! Hati-hati di jalan ya!", chara: "images/characters/chara1/Default.png" },
                    { speaker: "Irma (Ojol)", text: "Siap, mas! Semoga makin laris tokonya. Sampai jumpa lagi!", chara: "images/characters/chara1/Default.png" }
                ]);
            } else {
                updateScore(-1);
                insertStorySegment([
                    { speaker: "Irma (Ojol)", text: "Halo mas, saya kurir atas nama Irma. Ini pesanannya yang Mie Goreng dan Ayam Goreng ya?", chara: "images/characters/chara1/Default.png" },
                    { speaker: "Azka", text: "Iya, Kak! Ini sudah siap. Silakan.", chara: "images/characters/chara1/Default.png" },
                    { speaker: "Irma (Ojol)", text: "Hmm... sebentar mas. Ini kok bungkusannya agak berantakan ya?", chara: "images/characters/chara1/Marah.png" },
                    { speaker: "Irma (Ojol)", text: "Mie Gorengnya ini... bumbunya nggak merata gini. Ayam Gorengnya juga agak gosong di bagian sini.", chara: "images/characters/chara1/Marah.png" },
                    { speaker: "Azka", text: "E-eh, yang bener Kak?", chara: "images/characters/chara1/Marah.png" },
                    { speaker: "Irma (Ojol)", text: "Saya nggak mau disalahin sama pelanggan kalau makanannya nggak bagus, mas. Ini tanggung jawab penjual.", chara: "images/characters/chara1/Marah.png", action: "choice_irma_apology" }
                ]);
            }
            gameState.mode = "dialogue";
            nextDialogue();
            break;

        case "choice_irma_apology":
            gameState.mode = "choosing";
            showChoices(
                "Irma tampak kecewa dengan kualitas pesanannya. Apa responsmu?",
                [
                    {
                        label: "\"Ini sudah standar kok Kak, mungkin selera aja berbeda.\" (Membela diri)",
                        action: () => {
                            updateScore(-1);
                            interactionScreen.classList.add("hidden");
                            insertStorySegment([
                                { speaker: "Azka", text: "Kak, ini sudah standar kok. Mungkin selera kita aja yang berbeda.", chara: "images/characters/chara1/Marah.png" },
                                { speaker: "Irma (Ojol)", text: "Standar? Mas, saya sudah sering ambil pesanan di banyak toko. Ini bukan soal selera, ini soal kualitas yang jelas kurang.", chara: "images/characters/chara1/Marah.png" },
                                { speaker: "Irma (Ojol)", text: "Kalau penjual nggak mau terima kritik, pelanggan juga nggak mau balik. Itu hukum dasar bisnis, mas.", chara: "images/characters/chara1/Marah.png" },
                                { speaker: "Irma (Ojol)", text: "Ya sudah, saya antar dulu. Tapi maaf, saya harus jujur di ulasan nanti.", chara: "images/characters/chara1/Marah.png" },
                                { speaker: "Azka", text: "...", chara: null },
                                { speaker: "Azka", text: "(Mungkin... aku memang seharusnya tidak membela diri seperti itu.)", chara: null }
                            ]);
                            gameState.mode = "dialogue";
                            nextDialogue();
                        }
                    },
                    {
                        label: "\"Maaf ya Kak Irma, aku akui ini memang kurang rapi. Aku akan lebih teliti lagi!\" (Minta maaf)",
                        action: () => {
                            updateScore(1);
                            interactionScreen.classList.add("hidden");
                            insertStorySegment([
                                { speaker: "Azka", text: "Kak Irma, maafkan aku. Aku akui ini memang kurang rapi. Tadi aku terlalu terburu-buru karena ada dua pesanan bersamaan.", chara: "images/characters/chara1/Marah.png" },
                                { speaker: "Irma (Ojol)", text: "...", chara: "images/characters/chara1/Marah.png" },
                                { speaker: "Irma (Ojol)", text: "Ya, setidaknya kamu mau mengakui. Itu penting banget lho, mas.", chara: "images/characters/chara1/Default.png" },
                                { speaker: "Azka", text: "Aku janji, lain kali nggak akan seperti ini lagi. Mau secepat apapun, kualitas tetap nomor satu.", chara: "images/characters/chara1/Default.png" },
                                { speaker: "Irma (Ojol)", text: "Nah gitu dong. Jujur saya suka sama penjual yang mau introspeksi. Nanti saya kasih bintang 3 aja ya, nggak 1.", chara: "images/characters/chara1/Default.png", earnMoney: 28000 },
                                { speaker: "Azka", text: "Terima kasih banyak, Kak Irma. Kritiknya sangat berarti buatku.", chara: "images/characters/chara1/Default.png" },
                                { speaker: "Irma (Ojol)", text: "Semangat ya, mas! Koreksi dari pelanggan justru bikin kita tumbuh. Sampai jumpa!", chara: "images/characters/chara1/Default.png" }
                            ]);
                            gameState.mode = "dialogue";
                            nextDialogue();
                        }
                    }
                ]
            );
            break;

        case "cook_rusdi_mie_goreng":
            gameState.mode = "cooking";
            openCookingScreen("Mie Goreng");
            break;

        case "choice_rusdi_attitude":
            gameState.mode = "choosing";
            showChoices(
                "Pak Rusdi memberimu nasehat soal pentingnya reputasi digital. Bagaimana sikapmu?",
                [
                    {
                        label: "\"Wah, bener banget Pak. Saya baru sadar pentingnya hal itu. Terima kasih!\" (Responsif)",
                        action: () => {
                            updateScore(1);
                            interactionScreen.classList.add("hidden");
                            insertStorySegment([
                                { speaker: "Azka", text: "Pak Rusdi, terima kasih banyak masukannya. Jujur saya baru benar-benar paham sekarang soal pentingnya ulasan.", chara: "images/characters/chara2/Open mouth.png" },
                                { speaker: "Pak Rusdi (Ojol)", text: "Nah, itu baru namanya penjual yang punya mental berkembang. Penjual hebat itu bukan yang nggak pernah salah, tapi yang mau belajar dari kesalahan.", chara: "images/characters/chara2/Open mouth.png" },
                                { speaker: "Azka", text: "Siap Pak! Mulai sekarang, aku akan perhatikan detail lebih lagi — dari kecepatan, kualitas, sampai cara aku menyapa pelanggan.", chara: "images/characters/chara2/Open mouth.png" },
                                { speaker: "Pak Rusdi (Ojol)", text: "Bagus. Satu lagi ya, mas — jangan lupa balas chat pelanggan dengan cepat. Di era digital, respons yang lambat sama saja dengan pintu toko yang tertutup.", chara: "images/characters/chara2/Default.png" },
                                { speaker: "Azka", text: "Wah, analogi yang bagus banget, Pak. Saya catat itu.", chara: "images/characters/chara2/Default.png" },
                                { speaker: "Pak Rusdi (Ojol)", text: "Haha, ya sudah. Saya lanjut antar dulu ya, mas. Semangat terus! Saya doakan tokomu makin rame.", chara: "images/characters/chara2/Open mouth.png" },
                                { speaker: "Azka", text: "Aamiin! Terima kasih banyak ya, Pak Rusdi. Selamat jalan!", chara: null }
                            ]);
                            gameState.mode = "dialogue";
                            nextDialogue();
                        }
                    },
                    {
                        label: "\"Ah, terserah pelanggan mau kasih rating apa. Yang penting saya udah masak.\" (Judes)",
                        action: () => {
                            updateScore(-1);
                            interactionScreen.classList.add("hidden");
                            insertStorySegment([
                                { speaker: "Azka", text: "Yah, terserah Pak. Rating kan nggak bisa dikontrol. Yang penting makanannya aku masak, udah gitu aja.", chara: "images/characters/chara2/Default.png" },
                                { speaker: "Pak Rusdi (Ojol)", text: "...", chara: "images/characters/chara2/Marah.png" },
                                { speaker: "Pak Rusdi (Ojol)", text: "Mas, saya nggak bermaksud menyinggung. Tapi sikap seperti itu justru yang sering bikin toko online ambruk.", chara: "images/characters/chara2/Marah.png" },
                                { speaker: "Pak Rusdi (Ojol)", text: "Saya sudah lihat puluhan toko tutup karena pemiliknya merasa 'yang penting sudah masak'. Padahal bisnis online itu soal pengalaman pelanggan, bukan cuma produk.", chara: "images/characters/chara2/Marah.png" },
                                { speaker: "Azka", text: "...", chara: null },
                                { speaker: "Pak Rusdi (Ojol)", text: "Ya sudah, saya lanjut antar dulu. Semoga kamu bisa merenungkan ini, mas.", chara: "images/characters/chara2/Marah.png" },
                                { speaker: "Azka", text: "(Kata-kata Pak Rusdi tadi... agak menohok. Tapi apa benar sikapku salah?)", chara: null }
                            ]);
                            gameState.mode = "dialogue";
                            nextDialogue();
                        }
                    }
                ]
            );
            break;

        case "cook_mbah_bubur":
            gameState.mode = "cooking";
            openCookingScreen("Bubur Ayam");
            break;

        case "choice_mbah_reflection":
            gameState.mode = "choosing";
            showChoices(
                "Mbah bertanya soal nasib orang tua yang tertinggal di era digital. Apa pendapatmu?",
                [
                    {
                        label: "\"Mbah benar. Harusnya ada yang membantu mereka beradaptasi, bukan dibiarkan tertinggal.\"",
                        action: () => {
                            updateScore(1);
                            interactionScreen.classList.add("hidden");
                            insertStorySegment([
                                { speaker: "Azka", text: "Mbah, saya setuju banget. Harusnya ada program pelatihan atau pendampingan untuk UMKM konvensional supaya bisa ikut masuk ke ekosistem digital.", chara: "images/characters/chara3/Default.png" },
                                { speaker: "Mbah (Ojol)", text: "Kamu berpikiran seperti itu, Mas? Wah...", chara: "images/characters/chara3/Default.png" },
                                { speaker: "Azka", text: "Iya, Mbah. Nggak adil kalau teknologi cuma menguntungkan yang muda dan melek digital. Seharusnya teknologi itu inklusif, bisa dirasakan semua orang.", chara: null },
                                { speaker: "Mbah (Ojol)", text: "Tepat sekali, Mas. Itu masalah sosial yang nyata di zaman sekarang. Teknologi berlari terlalu cepat, sementara nggak semua orang punya sepatu yang sama.", chara: "images/characters/chara3/Open mouth.png" },
                                { speaker: "Azka", text: "Mbah, kalau usahaku nanti sudah lebih stabil, aku mau coba bantu orang-orang seperti Mbah untuk belajar pakai platform digital. Nggak janji bisa besar, tapi setidaknya aku mau coba.", chara: null },
                                { speaker: "Mbah (Ojol)", text: "Ya Allah... Mbah nggak nyangka di usia Mbah masih bisa ketemu anak muda yang berpikir seperti ini.", chara: "images/characters/chara3/Open mouth.png" },
                                { speaker: "Mbah (Ojol)", text: "Terima kasih ya, Mas. Mbah doakan usahamu sukses dan berkah. Mbah jalan dulu.", chara: "images/characters/chara3/Default.png" },
                                { speaker: "Azka", text: "Aamiin. Hati-hati di jalan ya, Mbah. Dan terima kasih... untuk semua ceritanya.", chara: null }
                            ]);
                            gameState.mode = "dialogue";
                            nextDialogue();
                        }
                    },
                    {
                        label: "\"Itulah seleksi alam, Mbah. Yang nggak bisa beradaptasi, memang akan tertinggal.\"",
                        action: () => {
                            interactionScreen.classList.add("hidden");
                            insertStorySegment([
                                { speaker: "Azka", text: "Ya mau gimana lagi, Mbah. Zaman berubah. Yang nggak bisa adaptasi, ya... ketinggalan. Itu hukum alam.", chara: "images/characters/chara3/Default.png" },
                                { speaker: "Mbah (Ojol)", text: "...", chara: "images/characters/chara3/Default.png" },
                                { speaker: "Mbah (Ojol)", text: "Kenyataannya memang sekeras itu, Mas. Mbah nggak menampik itu.", chara: "images/characters/chara3/Default.png" },
                                { speaker: "Mbah (Ojol)", text: "Tapi Mas, coba pikir sebentar. Nggak semua orang punya privilege yang sama. Ada yang nggak punya HP canggih, ada yang nggak punya jaringan internet, ada yang sudah terlalu tua untuk belajar dari nol.", chara: "images/characters/chara3/Default.png" },
                                { speaker: "Mbah (Ojol)", text: "Jangan sampai kemudahan digital ini membuat kita kehilangan empati, Mas. Di balik setiap pesanan, di balik setiap ojol yang datang, ada manusia dengan cerita dan perjuangannya masing-masing.", chara: "images/characters/chara3/Open mouth.png" },
                                { speaker: "Azka", text: "...", chara: null },
                                { speaker: "Azka", text: "(Mbah benar juga. Aku terlalu cepat menghakimi. Dunia ini bukan cuma soal siapa yang kuat bertahan...)", chara: null },
                                { speaker: "Azka", text: "Mbah... maafkan ucapanku tadi. Aku terlalu gegabah bicara.", chara: null },
                                { speaker: "Mbah (Ojol)", text: "Nggak perlu minta maaf, Mas. Yang penting kamu mau berpikir ulang. Itu sudah cukup untuk Mbah.", chara: "images/characters/chara3/Default.png" },
                                { speaker: "Mbah (Ojol)", text: "Ya sudah ya, Mbah pamit dulu. Semoga sukses terus, Mas. Dan semoga hatimu selalu terbuka.", chara: "images/characters/chara3/Default.png" },
                                { speaker: "Azka", text: "Aamiin. Hati-hati, Mbah. Terima kasih banyak...", chara: null }
                            ]);
                            gameState.mode = "dialogue";
                            nextDialogue();
                        }
                    }
                ]
            );
            break;

        case "end_day_3":
            gameState.mode = "waiting_click"; // blokir klik dialog
            // Hentikan typewriter agar tidak ada race condition
            clearInterval(typingTimer);
            isTextFullyDisplayed = true;
            uiText.textContent = "[Hari Ketiga Selesai! Menghitung skor akhir...]";
            setTimeout(() => {
                const isGood = gameState.score >= GOOD_ENDING_THRESHOLD;
                const transTitle = isGood ? "Akhir Cerita" : "Akhir Cerita";
                const transSub = isGood ? "Menghitung skor akhir..." : "Menghitung skor akhir...";
                playDayTransition(transTitle, transSub, () => {
                    // Bersihkan semua layar aktif sebelum tampilkan ending
                    interactionScreen.classList.add("hidden");
                    phoneScreen.classList.add("hidden");
                    overlay.classList.add("hidden");
                    document.getElementById("dialogue-box").classList.add("hidden");
                    cartImg.classList.add("hidden");
                    charaImg.classList.add("hidden");
                    uiMoney.classList.add("hidden");
                    uiHpIcon.style.opacity = "0";
                    metallicatAside.classList.add("hidden");
                }, 2500);
                // Tampilkan ending setelah transisi selesai (1200 + 2500 = 3700ms)
                setTimeout(() => {
                    showEndingScreen();
                }, 3800);
            }, 1200);
            break;
    }
}

// ============================================================
// --- FUNGSI INTERAKSI HP ---
// ============================================================
function openPhone() {
    // Membuka HP diperbolehkan dalam kondisi dialog biasa atau sedang menunggu aksi HP
    if (gameState.mode === "dialogue" || gameState.mode === "waiting_click") {
        let currentLine = activeStory[gameState.currentDialogueIndex];
        if (currentLine && currentLine.action === "wait_open_phone") {
            hpNotif.classList.add("hidden");
            document.getElementById("app-text").innerText = "Aplikasi Foodlove siap digunakan. Menunggu pesanan...";
        }
        if (currentLine && currentLine.action === "wait_open_phone_register") {
            hpNotif.classList.add("hidden");
            openRegistrationScreen();
        }
        phoneScreen.classList.remove("hidden");
    }
}

function closePhone() {
    // Jangan izinkan tutup HP saat registrasi sedang berjalan
    if (isRegistrationActive) return;
    
    phoneScreen.classList.add("hidden");
    let currentLine = activeStory[gameState.currentDialogueIndex];
    if (currentLine && currentLine.action === "wait_open_phone") {
        gameState.mode = "dialogue";
        nextDialogue();
    }
}

function processOrder() {
    document.getElementById("app-text").innerText = "Pesanan sedang diproses di dapur...";
    btnAction.classList.add("hidden");
    hpNotif.classList.add("hidden");
    phoneScreen.classList.add("hidden");
    
    gameState.mode = "dialogue";
    nextDialogue();
}

// ============================================================
// --- FUNGSI INTERAKSI DAPUR (COOKING SYSTEM) ---
// ============================================================
function shuffleArray(arr) {
    let shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function openCookingScreen(foodName) {
    interactionScreen.classList.remove("hidden");
    document.getElementById("interaction-title").innerText = "Dapur: " + foodName;
    
    if (!resepMakanan[foodName]) {
        console.error("Resep tidak ditemukan:", foodName);
        return;
    }
    
    currentRecipe = resepMakanan[foodName];
    targetStep = 0;
    cookingMistakes = 0;
    
    renderCookingSteps(foodName);
}

function renderCookingSteps(foodName) {
    let steps = resepMakanan[foodName];
    let shuffledSteps = shuffleArray(steps);
    
    let html = `
        <div class="cooking-info">
            <p class="cooking-instruction">Klik bahan sesuai <b>urutan pembuatan</b> <b>${foodName}</b>!</p>
            <div class="cooking-progress-bar">
                <div class="cooking-progress-fill" id="cooking-progress" style="width: 0%"></div>
            </div>
            <p class="cooking-step-text" id="cooking-step-text">Langkah 1 / ${steps.length}</p>
        </div>
        <div class="cooking-feedback" id="cooking-feedback"></div>
        <div class="cooking-buttons" id="cooking-buttons">
    `;
    
    shuffledSteps.forEach((step, index) => {
        html += `<button class="recipe-btn" id="recipe-btn-${index}" 
                  onclick="checkCookingStep('${step.replace(/'/g, "\\'")}', this, '${foodName}')">${step}</button>`;
    });
    
    html += `</div>`;
    interactionContent.innerHTML = html;
}

function checkCookingStep(clickedStep, buttonElement, foodName) {
    const correctStep = currentRecipe[targetStep];
    const feedbackEl = document.getElementById("cooking-feedback");
    const progressEl = document.getElementById("cooking-progress");
    const stepTextEl = document.getElementById("cooking-step-text");
    
    if (clickedStep === correctStep) {
        targetStep++;
        buttonElement.classList.add("correct");
        buttonElement.disabled = true;
        
        const progressPercent = (targetStep / currentRecipe.length) * 100;
        progressEl.style.width = progressPercent + "%";
        
        feedbackEl.innerHTML = `<span class="feedback-correct">${clickedStep} — Benar!</span>`;
        feedbackEl.classList.add("feedback-pop");
        setTimeout(() => feedbackEl.classList.remove("feedback-pop"), 400);
        
        if (targetStep >= currentRecipe.length) {
            stepTextEl.innerText = "Semua langkah selesai!";
            feedbackEl.innerHTML = `<span class="feedback-complete">${foodName} siap dibungkus!</span>`;
            
            document.querySelectorAll(".recipe-btn").forEach(btn => {
                btn.disabled = true;
                btn.classList.add("disabled");
            });
            
            setTimeout(() => {
                interactionScreen.classList.add("hidden");
                gameState.mode = "dialogue";
                nextDialogue();
            }, 1500);
        } else {
            stepTextEl.innerText = `Langkah ${targetStep + 1} / ${currentRecipe.length}`;
        }
    } else {
        cookingMistakes++;
        buttonElement.classList.add("wrong");
        setTimeout(() => buttonElement.classList.remove("wrong"), 600);
        
        feedbackEl.innerHTML = `<span class="feedback-wrong">Salah! Urutan selanjutnya bukan "${clickedStep}".</span>`;
        feedbackEl.classList.add("feedback-pop");
        setTimeout(() => feedbackEl.classList.remove("feedback-pop"), 400);
    }
}

// ============================================================
// --- MINIGAME KEMBALIAN ---
// ============================================================
let hasMadeMistake = false;

function openChangeCalculator(paid, price) {
    hasMadeMistake = false;
    const correctChange = paid - price;
    interactionScreen.classList.remove("hidden");
    document.getElementById("interaction-title").innerText = "Hitung Kembalian";

    interactionContent.innerHTML = `
        <div class="change-info-box">
            <p>Pelanggan Bayar: <b>Rp${paid.toLocaleString('id-ID')}</b></p>
            <p>Harga Pesanan: <b>Rp${price.toLocaleString('id-ID')}</b></p>
        </div>
        <p class="change-label">Masukkan jumlah kembalian yang tepat (Rp):</p>
        <input type="number" id="change-input" placeholder="contoh: 5000">
        <button class="change-submit-btn" onclick="submitChange(${paid}, ${price})">Berikan Kembalian</button>
        <div id="change-feedback"></div>
    `;
}

function submitChange(paid, price) {
    const correct = paid - price;
    const input = parseInt(document.getElementById("change-input").value);
    const feedback = document.getElementById("change-feedback");

    if (isNaN(input)) {
        feedback.innerHTML = `<span style="color:red;">⚠️ Ketikkan angka terlebih dahulu!</span>`;
        return;
    }

    if (input === correct) {
        if (!hasMadeMistake) {
            updateScore(1); 
        }
        feedback.innerHTML = `<span class="feedback-correct">Tepat! Kembaliannya Rp${correct.toLocaleString('id-ID')}</span>`;
        
        setTimeout(() => {
            interactionScreen.classList.add("hidden");
            gameState.mode = "dialogue";
            nextDialogue();
        }, 1200);
    } else {
        if (!hasMadeMistake) {
            updateScore(-1);
            hasMadeMistake = true;
        }
        feedback.innerHTML = `<span class="feedback-wrong">Salah! Coba hitung dengan lebih teliti.</span>`;
    }
}

// ============================================================
// --- UTILITIES STATUS UI ---
// ============================================================
function updateUI() {
    document.getElementById("money-text").innerText = `Rp ${gameState.money.toLocaleString('id-ID')}`;
    document.getElementById("score-text").innerText = `Skor: ${gameState.score}`;
}

function updateMoney(amount) {
    gameState.money += amount;
    updateUI();
    const moneyEl = document.getElementById("ui-money");
    moneyEl.classList.add("money-flash");
    setTimeout(() => moneyEl.classList.remove("money-flash"), 600);
}

function updateScore(amount) {
    gameState.score += amount;
    updateUI();
    const scoreEl = document.getElementById("score-text");
    scoreEl.classList.add("score-flash");
    setTimeout(() => scoreEl.classList.remove("score-flash"), 600);
}

// ============================================================
// --- RINGKASAN AKHIR HARI ---
// ============================================================
function showDaySummary(day) {
    interactionScreen.classList.remove("hidden");
    document.getElementById("interaction-title").innerText = `Hari Ke-${day} Selesai`;
    interactionContent.innerHTML = `
        <div class="summary-screen">
            <div class="summary-icon">✦</div>
            <p class="summary-label">Rekap Harian</p>
            <div class="summary-box">
                <p>Total Pendapatan: <b>Rp${gameState.money.toLocaleString('id-ID')}</b></p>
                <p>Total Skor: <b>${gameState.score}</b></p>
            </div>
            <p class="summary-note">Hari ke-${day + 1} akan segera dimulai...</p>
            <button onclick="closeSummary()">Lanjut</button>
        </div>
    `;
}

function closeSummary() {
    interactionScreen.classList.add("hidden");
    document.getElementById("interaction-title").innerText = "Siapkan Pesanan";
}

// ============================================================
// --- DATA NARASI DAY 2 ---
// ============================================================
const storyDay2 = [
    { speaker: "System", text: "[Hari Kedua — Tantangan Kembalian Tunai (Cashback Challenge)]", bgm: "main" },
    { speaker: "Azka", text: "Wah, hari kedua! Semoga hari ini berjalan lancar.", chara: null },
    { speaker: "Metallicat", text: "Meow! Bersiaplah, Azka. Fokus utama hari ini adalah menguji ketelitian matematis kamu dalam menghitung uang kembalian (COD).", chara: null },
    { speaker: "Metallicat", text: "Jika kembalianmu benar, Skor akan bertambah +1. Tapi jika salah, pelanggan akan kecewa dan Skor -1!", chara: null },

    { speaker: "Metallicat", text: "Ada pesanan masuk! Coba cek HP-mu.", action: "trigger_order_day2_irma" },
    { speaker: "Azka", text: "Oke, pesanan dari Irma: 1x Nasi Goreng (Rp15.000). Pembayaran pakai uang Rp20.000.", chara: null },
    { speaker: "Metallicat", text: "Siapkan di dapur sekarang!", action: "wait_cook_nasi_goreng" },
    { speaker: "Irma (Ojol)", text: "mas, ambil pesanan Nasi Goreng. Ini uang tunainya Rp20.000 ya. Tolong kembaliannya.", chara: "images/characters/chara1/Default.png", action: "wait_change_irma" },
    { speaker: "Irma (Ojol)", text: "Kembaliannya Rp5.000 ya? Pas banget! Makasih ya mas.", chara: "images/characters/chara1/Open mouth.png", earnMoney: 15000 },

    { speaker: "Metallicat", text: "Bagus! Pesanan kedua masuk, periksa HP-mu.", action: "trigger_order_day2_rusdi" },
    { speaker: "Azka", text: "Pesanan dari Pak Rusdi: 1x Mie Goreng (Rp13.000). Pembayaran pakai uang Rp20.000.", chara: null },
    { speaker: "Metallicat", text: "Ayo masak Mie Gorengnya!", action: "wait_cook_mie_goreng" },
    { speaker: "Pak Rusdi (Ojol)", text: "Permisi, pesanan Mie Goreng. Ini uangnya Rp20.000. Ditunggu kembaliannya.", chara: "images/characters/chara2/Default.png", action: "wait_change_rusdi" },
    { speaker: "Pak Rusdi (Ojol)", text: "Kembaliannya Rp7.000, betul sekali. Terima kasih, saya antar dulu ya.", chara: "images/characters/chara2/Open mouth.png", earnMoney: 13000 },

    { speaker: "Metallicat", text: "Satu pesanan lagi! Kali ini pembayarannya menggunakan pecahan besar.", action: "trigger_order_day2_mbah" },
    { speaker: "Azka", text: "Pesanan Bubur Ayam (Rp10.000). Wah, pembayarannya Rp50.000. Harus hati-hati hitung kembaliannya.", chara: null },
    { speaker: "Metallicat", text: "Siapkan Bubur Ayamnya dulu di dapur!", action: "wait_cook_bubur_ayam" },
    { speaker: "Mbah (Ojol)", text: "Permisi Mas, pesanan Bubur Ayam. Ini uangnya Rp50.000 ya.", chara: "images/characters/chara3/Default.png", action: "wait_change_mbah" },
    { speaker: "Mbah (Ojol)", text: "Kembalian Rp40.000 ya Mas. Terima kasih ya, Mbah pamit dulu.", chara: "images/characters/chara3/Open mouth.png", earnMoney: 10000 },

    { speaker: "Azka", text: "Huft... selesai juga hari kedua. Lumayan bikin deg-degan pas ngitung uang.", chara: null },
    { speaker: "Metallicat", text: "Kerja yang bagus! Keuanganmu aman. Besok bersiaplah untuk manajemen konflik dan rating buruk.", chara: null },
    { speaker: "System", text: "[Hari Kedua Selesai! Mengkalkulasi progres...]", action: "end_day_2" }
];

function startDay2() {
    gameState.day = 2;
    gameState.currentDialogueIndex = 0;
    activeStory = storyDay2;
    
    charaImg.classList.add("hidden");
    hpNotif.classList.add("hidden");
    btnAction.classList.add("hidden");
    document.getElementById("app-text").innerText = "Tidak ada pesanan masuk.";
    phoneScreen.classList.add("hidden");
    interactionScreen.classList.add("hidden");
    gameState.mode = "dialogue";

    loadDialogue();
}

function insertStorySegment(newLines) {
    const insertAt = gameState.currentDialogueIndex + 1;
    activeStory.splice(insertAt, 0, ...newLines);
}

// ============================================================
// --- SISTEM PILIHAN DIALOG (CHOICE SYSTEM) ---
// ============================================================
function showChoices(question, choices) {
    interactionScreen.classList.remove("hidden");
    document.getElementById("interaction-title").innerText = "Pilih Responmu";

    let buttonsHtml = choices.map((c, i) =>
        `<button class="choice-btn" id="choice-btn-${i}" onclick="triggerChoice(${i})">${c.label}</button>`
    ).join("");

    interactionContent.innerHTML = `
        <div class="choice-question">${question}</div>
        <div class="choice-buttons">${buttonsHtml}</div>
    `;

    window._currentChoices = choices;
}

function triggerChoice(index) {
    if (window._currentChoices && window._currentChoices[index]) {
        window._currentChoices[index].action();
        window._currentChoices = null;
    }
}

// ============================================================
// --- LAYAR ENDING (GOOD / BAD) ---
// ============================================================
const GOOD_ENDING_THRESHOLD = 4; 

function switchToBadEndingBGM() {
    // Ganti BGM ke sad untuk bad ending
    currentBgmMode = ""; // reset agar playBGM mau re-trigger
    playBGM("sad");
}

function showEndingScreen() {
    const finalScore = gameState.score;
    const isGoodEnding = finalScore >= GOOD_ENDING_THRESHOLD;

    if (isGoodEnding) {
        // === GOOD ENDING: langsung tampilkan panel ===
        interactionScreen.classList.remove("hidden");
        document.getElementById("interaction-title").innerText = "Akhir Cerita";
        interactionContent.innerHTML = `
            <div class="ending-screen ending-good">
                <div class="ending-emoji">✦</div>
                <h3 class="ending-title">Good Ending</h3>
                <p class="ending-subtitle">Toko Foodlove Azka Makin Ramai</p>
                <div class="ending-divider"></div>
                <p class="ending-story">Berkat manajemen pelayanan yang baik dan keuangan yang teliti, toko online Azka berkembang pesat. Rating tokonya naik ke bintang 4.8, pesanan membludak setiap hari, dan Azka membuktikan bahwa pengalaman bisa dibangun — tidak harus menunggu lamaran kerja diterima.</p>
                <div class="ending-score-box">
                    <p>Pendapatan: <b>Rp${gameState.money.toLocaleString('id-ID')}</b></p>
                    <p>Skor Akhir: <b>${finalScore}</b></p>
                </div>
                <p class="ending-quote">"Ekonomi digital membuka pintu bagi siapa saja yang mau belajar dan pantang menyerah."</p>
                <button class="ending-btn" onclick="restartGame()">Main Lagi</button>
            </div>
        `;
    } else {
        // === BAD ENDING: gambar fullscreen dulu, panel muncul 5 detik kemudian ===
        switchToBadEndingBGM();

        // 1) Ganti background utama jadi gambar bad ending
        bgMain.src = "images/end/Illustration120.png";
        bgMain.style.filter = "brightness(0.6) saturate(0.7)";
        bgMain.classList.add("bad-ending-bg");

        // 2) Pastikan semua UI tersembunyi, hanya gambar fullscreen
        interactionScreen.classList.add("hidden");
        cartImg.classList.add("hidden");

        // 3) Setelah 5 detik, tampilkan panel ending
        setTimeout(() => {
            interactionScreen.classList.remove("hidden");
            interactionScreen.classList.add("bad-ending-panel-enter");
            document.getElementById("interaction-title").innerText = "Akhir Cerita";
            interactionContent.innerHTML = `
                <div class="ending-screen ending-bad-panel">
                    <p class="ending-subtitle">Toko Foodlove Azka Sepi Pelanggan</p>
                    <div class="ending-divider" style="background: linear-gradient(90deg, transparent, #ff6b6b, transparent);"></div>
                    <p class="ending-story">Rating buruk terus menumpuk dan ulasan negatif menyebar. Pelanggan mulai meninggalkan toko Azka. Aplikasi Foodlove mengirimkan peringatan bahwa toko berpotensi dinonaktifkan. Azka terduduk lesu, menatap gerobaknya yang kini sepi...</p>
                    <div class="ending-score-box bad ending-score-delayed">
                        <p>Pendapatan: <b>Rp${gameState.money.toLocaleString('id-ID')}</b></p>
                        <p>Skor Akhir: <b>${finalScore}</b></p>
                    </div>
                    <div class="ending-reflection">
                        <p class="ending-quote">"Kegagalan bukan akhir dari segalanya. Setiap kesalahan adalah guru terbaik — asalkan kita mau belajar darinya."</p>
                    </div>
                    <button class="ending-btn ending-btn-delayed" onclick="restartGame()">Coba Lagi</button>
                </div>
            `;
        }, 5000);
    }
}

function restartGame() {
    location.reload();
}

// ============================================================
// --- DATA NARASI DAY 3 ---
// ============================================================
const storyDay3 = [
    { speaker: "System", text: "[Hari Ketiga — Manajemen Konflik dan Refleksi Pasar]", bgm: "main" },
    { speaker: "Azka", text: "Pagi! Hari ketiga aku berjualan. Rasanya makin semangat setelah kemarin berhasil melayani tiga pelanggan.", chara: null },
    { speaker: "Azka", text: "Hmm, tapi kok perasaanku agak nggak enak ya... Seperti ada sesuatu yang mengganjal.", chara: null },
    { speaker: "Metallicat", text: "Meow... Azka, sebelum buka toko, ada sesuatu yang harus kamu lihat dulu di HP.", chara: null },
    { speaker: "Azka", text: "Kenapa? Ekspresimu serius banget, Metallicat. Ada apa sih?", chara: null },
    { speaker: "Metallicat", text: "Lebih baik kamu lihat sendiri. Buka HP-mu sekarang.", action: "show_rating_bad" },
    { speaker: "Azka", text: "A-apa?! Bintang 2?! 'Pesanannya lama, kembaliannya sempat salah'... Ya ampun...", chara: null },
    { speaker: "Azka", text: "Ini pasti gara-gara aku kemarin kurang teliti. Astaga, aku malu sekali...", chara: null },
    { speaker: "Metallicat", text: "Jangan panik, Azka. Satu ulasan buruk memang menyakitkan, tapi bukan akhir segalanya.", chara: null },
    { speaker: "Metallicat", text: "Yang penting sekarang adalah bagaimana kamu meresponsnya. Di dunia bisnis online, reputasi itu dibangun dari konsistensi, bukan satu momen.", chara: null },
    { speaker: "Azka", text: "Kamu benar... Aku nggak boleh down. Justru ini jadi pelajaran supaya aku lebih hati-hati.", chara: null },
    { speaker: "Metallicat", text: "Nah, itu baru semangat yang benar! Tapi bersiaplah, hari ini tantangannya tidak main-main.", chara: null },
    { speaker: "Azka", text: "Tantangan? Maksudnya apa?", chara: null },
    { speaker: "Metallicat", text: "Cek HP-mu sekarang. Ada situasi yang belum pernah kamu alami sebelumnya!", action: "trigger_double_order_hp" },
    { speaker: "Azka", text: "Dua pesanan masuk bersamaan?! Dari Irma DAN Pak Rusdi?!", chara: null },
    { speaker: "Azka", text: "Satu pesanan aja kadang sudah bikin deg-degan, ini langsung dua?! Gimana nih...", chara: null },
    { speaker: "Metallicat", text: "Tenang, Azka. Ini ujian manajemen waktu dan prioritas. Kamu harus memilih siapa yang dilayani duluan.", chara: null },
    { speaker: "Azka", text: "Oke... Aku tarik napas dulu. Focus, Azka! Kamu bisa!", chara: null },
];

const storyDay3_Irma = [
    { speaker: "Azka", text: "Oke, aku putuskan layani Irma dulu. Pesanannya ada dua item — Mie Goreng dan Ayam Goreng.", chara: null },
    { speaker: "Azka", text: "Kalau dua menu sekaligus begini, aku harus kerja lebih cepat tapi tetap rapi. Nggak boleh asal-asalan.", chara: null },
    { speaker: "Metallicat", text: "Betul! Kualitas tidak boleh dikorbankan demi kecepatan. Mulai dari Mie Gorengnya dulu, Azka!", action: "cook_irma_mie_goreng" },
    { speaker: "Azka", text: "Satu selesai! Mie Gorengnya sudah matang dan terbungkus rapi.", chara: null },
    { speaker: "Metallicat", text: "Bagus! Lanjut ke Ayam Goreng. Kali ini pastikan bumbunya merata ya!", action: "cook_irma_ayam_goreng" },
    { speaker: "Azka", text: "Ayam Goreng juga sudah selesai! Dua-duanya siap untuk diantar!", chara: null },
    { speaker: "Metallicat", text: "Sekarang kita lihat bagaimana reaksi Irma...", chara: null, action: "eval_irma_cooking" },
];

const storyDay3_Rusdi = [
    { speaker: "Azka", text: "Sekarang giliran Pak Rusdi. Beliau pesan Mie Goreng satu, pembayaran uang pas Rp13.000.", chara: null },
    { speaker: "Azka", text: "Harus fokus nih. Jangan sampai pesanan Pak Rusdi menunggu terlalu lama.", chara: null },
    { speaker: "Metallicat", text: "Tepat! Waktu tunggu pelanggan itu krusial. Ayo masak Mie Gorengnya sekarang!", action: "cook_rusdi_mie_goreng" },
    { speaker: "Azka", text: "Mie Goreng untuk Pak Rusdi sudah matang! Bungkus yang rapi...", chara: null },
    { speaker: "Pak Rusdi (Ojol)", text: "Permisi, mas. Selamat siang. Saya ambil pesanan Mie Goreng atas nama Rusdi.", chara: "images/characters/chara2/Default.png" },
    { speaker: "Azka", text: "Oh, Pak Rusdi! Ini pesanannya, Pak. Sudah siap. Uangnya pas ya?", chara: "images/characters/chara2/Default.png" },
    { speaker: "Pak Rusdi (Ojol)", text: "Betul, uang pas Rp13.000. Terima kasih.", chara: "images/characters/chara2/Default.png", earnMoney: 13000 },
    { speaker: "Azka", text: "Sama-sama, Pak! Terima kasih pesanannya.", chara: "images/characters/chara2/Default.png" },
    { speaker: "Pak Rusdi (Ojol)", text: "Sebentar mas, boleh saya ngobrol sebentar? Saya sudah lama jadi kurir dan sering ketemu berbagai macam penjual online.", chara: "images/characters/chara2/Default.png" },
    { speaker: "Azka", text: "Oh, silakan Pak. Saya malah senang kalau bisa dapat masukan.", chara: "images/characters/chara2/Default.png" },
    { speaker: "Pak Rusdi (Ojol)", text: "Saya lihat toko mas ini masih baru ya? Saya mau kasih sedikit wejangan kalau boleh.", chara: "images/characters/chara2/Default.png" },
    { speaker: "Pak Rusdi (Ojol)", text: "Banyak penjual online yang saya temui akhirnya gulung tikar, bukan karena makanannya nggak enak, tapi karena mereka tidak menjaga reputasi.", chara: "images/characters/chara2/Default.png" },
    { speaker: "Azka", text: "Reputasi... Maksudnya rating dan ulasan, Pak?", chara: "images/characters/chara2/Default.png" },
    { speaker: "Pak Rusdi (Ojol)", text: "Tepat sekali. Ulasan di platform digital itu ibarat mulut-ke-mulut di era tradisional, tapi efeknya jauh lebih luas dan permanen.", chara: "images/characters/chara2/Open mouth.png" },
    { speaker: "Pak Rusdi (Ojol)", text: "Satu bintang 1 bisa menghapus kepercayaan yang dibangun dari 10 bintang 5. Algoritma aplikasi juga lebih menampilkan toko dengan rating tinggi.", chara: "images/characters/chara2/Open mouth.png", action: "choice_rusdi_attitude" },
];

const storyDay3_Mbah = [
    { speaker: "Metallicat", text: "Azka, masih ada satu pesanan terakhir hari ini. Pelanggannya memesan Bubur Ayam.", chara: null },
    { speaker: "Azka", text: "Bubur Ayam? Oke, ini menu yang cukup simpel. Tapi tetap harus teliti!", chara: null },
    { speaker: "Metallicat", text: "Benar! Jangan remehkan pesanan apapun. Ayo masak!", action: "cook_mbah_bubur" },
    { speaker: "Azka", text: "Bubur Ayam sudah jadi! Toppingnya sudah lengkap, bungkusan rapi!", chara: null },
    { speaker: "Mbah (Ojol)", text: "Assalamu'alaikum, Mas. Maaf ya Mbah agak lambat jalannya. Ini pesanan Bubur Ayam atas nama siapa ya?", chara: "images/characters/chara3/Default.png" },
    { speaker: "Azka", text: "Wa'alaikumsalam, Mbah! Ini pesanannya sudah siap. Uangnya pas Rp10.000 ya?", chara: "images/characters/chara3/Default.png" },
    { speaker: "Mbah (Ojol)", text: "Iya Mas, uangnya pas. Terima kasih ya.", chara: "images/characters/chara3/Default.png", earnMoney: 10000 },
    { speaker: "Azka", text: "Sama-sama, Mbah. Oh iya Mbah, kok pakai motor ojol? Mbah juga jadi kurir?", chara: "images/characters/chara3/Default.png" },
    { speaker: "Mbah (Ojol)", text: "Iya Mas, hehe. Daripada duduk di rumah nggak ada kerjaan. Lumayan buat sambilan.", chara: "images/characters/chara3/Default.png" },
    { speaker: "Mbah (Ojol)", text: "Melihat anak muda kayak kamu luwes pakai aplikasi begini, Mbah jadi teringat sesuatu...", chara: "images/characters/chara3/Default.png" },
    { speaker: "Azka", text: "Teringat apa, Mbah?", chara: null },
    { speaker: "Mbah (Ojol)", text: "Dulu Mbah punya warung nasi kecil di pinggir jalan. Sudah hampir 15 tahun Mbah jalankan.", chara: "images/characters/chara3/Default.png" },
    { speaker: "Azka", text: "Wah lama juga ya, Mbah! Lalu kenapa bisa tutup?", chara: null },
    { speaker: "Mbah (Ojol)", text: "Biaya sewa tempat makin lama makin naik, Mas. Dulu Mbah sewa Rp500 ribu sebulan, terakhir sudah Rp3 juta.", chara: "images/characters/chara3/Default.png" },
    { speaker: "Mbah (Ojol)", text: "Sementara itu, kebiasaan orang juga berubah. Dulu orang makan di warung, sekarang lebih pilih pesan lewat HP. Warung Mbah makin sepi...", chara: "images/characters/chara3/Default.png" },
    { speaker: "Azka", text: "Mbah nggak pernah coba daftar di aplikasi online?", chara: null },
    { speaker: "Mbah (Ojol)", text: "Sudah coba, Mas. Tapi Mbah nggak paham caranya. Anak Mbah yang bantuin, tapi dia juga sibuk kerja.", chara: "images/characters/chara3/Default.png" },
    { speaker: "Mbah (Ojol)", text: "Akhirnya warung terpaksa tutup. Mbah beralih jadi kurir ojol... paling nggak masih bisa dapat penghasilan.", chara: "images/characters/chara3/Default.png" },
    { speaker: "Azka", text: "...", chara: null },
    { speaker: "Azka", text: "Mbah, maafkan aku. Aku nggak menyangka ceritanya seperti itu.", chara: null },
    { speaker: "Mbah (Ojol)", text: "Nggak perlu minta maaf, Mas. Ini memang realita zaman sekarang.", chara: "images/characters/chara3/Default.png" },
    { speaker: "Mbah (Ojol)", text: "Ekonomi digital ini seperti pedang bermata dua. Di satu sisi, ia bisa menggusur usaha konvensional yang tidak bisa mengikuti perkembangan.", chara: "images/characters/chara3/Open mouth.png" },
    { speaker: "Mbah (Ojol)", text: "Tapi di sisi lain, ia juga membuka peluang bagi orang-orang sepertimu untuk memulai usaha tanpa modal sewa tempat yang besar.", chara: "images/characters/chara3/Open mouth.png" },
    { speaker: "Mbah (Ojol)", text: "Yang Mbah khawatirkan adalah... bagaimana nasib orang-orang tua seperti Mbah yang nggak sempat belajar teknologi?", chara: "images/characters/chara3/Open mouth.png", action: "choice_mbah_reflection" },

    { speaker: "Azka", text: "...", chara: null },
    { speaker: "Azka", text: "Tiga hari ini... Aku belajar lebih banyak dari pada tiga tahun di bangku kuliah.", chara: null },
    { speaker: "Azka", text: "Berjualan online itu bukan cuma soal memasak dan mengirim pesanan.", chara: null },
    { speaker: "Azka", text: "Ada manajemen pesanan, keuangan, pelayanan pelanggan, tekanan mental dari rating... dan juga empati sosial yang ternyata sangat penting.", chara: null },
    { speaker: "Azka", text: "Ekosistem digital memang membuka jalan baru. Tapi di balik kemudahannya, ada orang-orang seperti Mbah yang terus berjuang menyesuaikan diri.", chara: null },
    { speaker: "Metallicat", text: "Meow... Azka, kamu sudah berkembang jauh sejak hari pertama. Kesadaranmu soal dampak sosial ekonomi digital itu sangat berharga.", chara: null },
    { speaker: "Metallicat", text: "Tidak banyak pemilik usaha online yang mau berpikir sejauh itu. Kamu istimewa, Azka.", chara: null },
    { speaker: "Azka", text: "Terima kasih, Metallicat. Kamu memang teman terbaik yang pernah aku punya.", chara: null },
    { speaker: "Azka", text: "Aku berjanji — usaha ini bukan cuma untuk mengejar uang. Aku ingin membuktikan bahwa anak muda bisa mandiri, sambil tetap peduli pada sekitar.", chara: null },
    { speaker: "Metallicat", text: "Meow! Itu baru Azka yang kukenal. Semangat terus!", chara: null },
];

const storyDay3_Ending = [
    { speaker: "System", text: "[Hari Ketiga Selesai! Menghitung skor akhir...]", action: "end_day_3" }
];

function startDay3() {
    gameState.day = 3;
    gameState.currentDialogueIndex = 0;
    activeStory = [...storyDay3];

    charaImg.classList.add("hidden");
    hpNotif.classList.add("hidden");
    btnAction.classList.add("hidden");
    btnAction.onclick = null;
    document.getElementById("app-text").innerText = "Tidak ada pesanan masuk.";
    phoneScreen.classList.add("hidden");
    interactionScreen.classList.add("hidden");
    gameState.mode = "dialogue";

    loadDialogue();
}