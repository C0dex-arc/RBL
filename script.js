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
const storyDay1 = [
    { speaker: "Azka", text: "Oke! Gerobak sudah siap, bahan-bahan sudah lengkap. Tinggal buka toko online-nya!", bg: "images/backgrounds/IMG_3104.JPG", showCart: true, hideUI: false, bgm: "main" },
    { speaker: "Azka", text: "Tapi... gimana caranya ya? Aku belum pernah pakai aplikasi Foodlove sebelumnya.", showCart: true },
    
    { speaker: "Metallicat", text: "Meow! Halo, manusia! Selamat datang di ekosistem Foodlove!", chara: null }, 
    { speaker: "Azka", text: "Eh?! Kucing bisa bicara?!", chara: null },
    { speaker: "Metallicat", text: "Aku adalah asisten virtualmu. Panggil saja aku Metallicat. Aku akan memandumu memahami sistem operasional dasar di sini.", chara: null },
    { speaker: "Metallicat", text: "Pertama, mari kita buka aplikasinya. Coba kamu klik Ikon HP milikmu.", action: "wait_open_phone" },
    
    { speaker: "Metallicat", text: "Bagus! Sekarang akun tokomu sudah terdaftar dan siap beroperasi.", chara: null },
    { speaker: "Metallicat", text: "Mari kita lakukan simulasi. Aku akan memesan Nasi Goreng melalui gawaiku. Buka HP-mu dan cek pesanan yang masuk!", action: "trigger_order_tutorial" },
    
    { speaker: "Azka", text: "Wah, pesanannya sudah masuk! Nasi Goreng satu porsi.", chara: null },
    { speaker: "Metallicat", text: "Tepat sekali! Sekarang tugasmu adalah menyiapkannya di dapur. Klik bahan sesuai urutan yang benar!", action: "wait_cook_nasi_goreng" },
    
    { speaker: "Azka", text: "Fiuh, Nasi Gorengnya sudah siap dan dibungkus rapi!", chara: null },
    { speaker: "Metallicat", text: "Kerja bagus, Azka! Sekarang kita tinggal menunggu kurir ojek online datang mengambilnya.", chara: null },
    
    { speaker: "Irma (Ojol)", text: "Permisi, Foodlove! Ambil pesanan atas nama Metallicat, Nasi Goreng satu porsi ya, Mbak.", chara: "images/characters/chara1/Default.png" },
    { speaker: "Azka", text: "Iya Kak, ini pesanannya sudah siap.", chara: "images/characters/chara1/Default.png" },
    { speaker: "Irma (Ojol)", text: "Oke. Ini pembayaran tunai pas dari pelanggan ya, Rp15.000. Terima kasih!", chara: "images/characters/chara1/Open mouth.png", earnMoney: 15000, addScore: 1 },
    { speaker: "Azka", text: "Wah, uang pertamaku! Terima kasih banyak, Kak. Hati-hati di jalan!", chara: "images/characters/chara1/Default.png" },
    { speaker: "Irma (Ojol)", text: "Mari, Mbak. Semoga laris manis dagangannya!", chara: "images/characters/chara1/Default.png" },
    
    { speaker: "Azka", text: "Ternyata tidak terlalu sulit ya berjualan online.", chara: null },
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

// Inisialisasi awal
cartImg.classList.add("hidden");
uiMoney.classList.add("hidden");
uiHpIcon.style.pointerEvents = "auto"; // Pastikan click handler bawaan HTML/CSS tidak diblokir mutlak
uiHpIcon.style.opacity = "0";

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
            setTimeout(() => {
                gameState.currentDialogueIndex = 0;
                activeStory = storyDay1;
                gameState.mode = "dialogue";
                loadDialogue();
            }, 1500);
            break;

        case "wait_open_phone":
            // Tetap izinkan HP diklik dengan mengubah mode tunggu khusus
            hpNotif.classList.remove("hidden");
            uiHpIcon.style.opacity = "1";
            break;
            
        case "trigger_order_tutorial":
            document.getElementById("app-text").innerText = "Terdapat Pesanan Baru:\n\n1x Nasi Goreng\nPembayaran: Tunai (COD)\nTotal: Rp15.000";
            btnAction.innerText = "Terima Pesanan";
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
                    if (btn) btn.onclick = () => { interactionScreen.classList.add("hidden"); startDay2(); };
                }, 200);
            }, 1000);
            break;

        case "trigger_order_day2_irma":
            document.getElementById("app-text").innerText = "Pesanan Baru (Irma)\n\n1x Nasi Goreng\nHarga: Rp15.000\nPembayaran: Rp20.000\nKembalian: ???";
            btnAction.innerText = "Terima Pesanan";
            btnAction.classList.remove("hidden");
            hpNotif.classList.remove("hidden");
            break;

        case "trigger_order_day2_rusdi":
            document.getElementById("app-text").innerText = "Pesanan Baru (Pak Rusdi)\n\n1x Mie Goreng\nHarga: Rp13.000\nPembayaran: Rp20.000\nKembalian: ???";
            btnAction.innerText = "Terima Pesanan";
            btnAction.classList.remove("hidden");
            hpNotif.classList.remove("hidden");
            break;

        case "trigger_order_day2_mbah":
            document.getElementById("app-text").innerText = "Pesanan Baru (Mbah)\n\n1x Bubur Ayam\nHarga: Rp10.000\nPembayaran: Rp50.000\nKembalian: ???";
            btnAction.innerText = "Terima Pesanan";
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
                    if (btn) btn.onclick = () => { interactionScreen.classList.add("hidden"); startDay3(); };
                }, 200);
            }, 1000);
            break;

        case "show_rating_bad":
            document.getElementById("app-text").innerHTML =
                `<div style="text-align:center;padding:8px 0;">
                    <div style="font-size:22px;margin-bottom:6px;letter-spacing:4px;">★☆☆☆☆</div>
                    <b style="color:#e05560;font-size:14px;">Ulasan Baru — Bintang 2</b>
                    <hr style="margin:10px 0;border-color:rgba(255,107,157,0.2);">
                    <p style="font-size:13px;color:var(--text-main);text-align:left;line-height:1.6;opacity:0.85;">"Pesanannya lama, kembaliannya sempat salah. Tolong lebih teliti ya Mbak! Semoga bisa meningkatkan pelayanannya."</p>
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
                    { speaker: "Irma (Ojol)", text: "Wah, cepat banget! Dua pesanan ini langsung siap semua. Keren banget Mbak, terima kasih ya! Pasti saya kasih bintang 5 nih.", chara: "images/characters/chara1/Open mouth.png", earnMoney: 28000 },
                    { speaker: "Azka", text: "Makasih banyak Kak Irma! Selamat jalan.", chara: "images/characters/chara1/Default.png" }
                ]);
            } else {
                updateScore(-1);
                insertStorySegment([
                    { speaker: "Irma (Ojol)", text: "Mbak, pesanannya ini... kok keliatan berantakan ya? Bumbunya kurang merata nih. Saya agak kecewa.", chara: "images/characters/chara1/Marah.png", action: "choice_irma_apology" }
                ]);
            }
            gameState.mode = "dialogue";
            nextDialogue();
            break;

        case "choice_irma_apology":
            gameState.mode = "choosing";
            showChoices(
                "Irma tampak kecewa. Apa responsmu?",
                [
                    {
                        label: "\"Ini sudah standar kok Kak, mungkin selera aja berbeda.\" (Membela diri)",
                        action: () => {
                            updateScore(-1);
                            interactionScreen.classList.add("hidden");
                            insertStorySegment([
                                { speaker: "Irma (Ojol)", text: "Hmm... ya sudah. Tapi kalau begini terus, nanti toko ini bisa dapet rating buruk lho.", chara: "images/characters/chara1/Marah.png" },
                                { speaker: "Azka", text: "...", chara: null }
                            ]);
                            gameState.mode = "dialogue";
                            nextDialogue();
                        }
                    },
                    {
                        label: "\"Maaf ya Kak Irma, aku akan lebih teliti lagi lain kali!\" (Minta maaf)",
                        action: () => {
                            updateScore(1);
                            interactionScreen.classList.add("hidden");
                            insertStorySegment([
                                { speaker: "Irma (Ojol)", text: "Oke, aku hargai kejujuranmu. Nanti aku kasih bintang 3 deh, semangat ya Mbak!", chara: "images/characters/chara1/Default.png", earnMoney: 28000 },
                                { speaker: "Azka", text: "Terima kasih Kak Irma, aku sungguh-sungguh belajar dari ini.", chara: null }
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
                "Pak Rusdi memberimu masukan soal ulasan. Bagaimana sikapmu?",
                [
                    {
                        label: "\"Wah, bener juga Pak. Terima kasih masukannya!\" (Responsif)",
                        action: () => {
                            updateScore(1);
                            interactionScreen.classList.add("hidden");
                            insertStorySegment([
                                { speaker: "Pak Rusdi (Ojol)", text: "Nah, itu baru namanya penjual yang mau berkembang. Semangat ya!", chara: "images/characters/chara2/Open mouth.png" },
                                { speaker: "Azka", text: "Siap Pak! Aku akan jaga kualitas pelayanan dari sekarang.", chara: null }
                            ]);
                            gameState.mode = "dialogue";
                            nextDialogue();
                        }
                    },
                    {
                        label: "\"Ah, terserah pelanggan mau kasih rating apa.\" (Judes)",
                        action: () => {
                            updateScore(-1);
                            interactionScreen.classList.add("hidden");
                            insertStorySegment([
                                { speaker: "Pak Rusdi (Ojol)", text: "Hmm... sikap seperti itu yang bisa bikin toko online tutup, Mbak. Tolong dipikirkan lagi.", chara: "images/characters/chara2/Marah.png" },
                                { speaker: "Azka", text: "...", chara: null }
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

        case "end_day_3":
            gameState.mode = "waiting_click"; // blokir klik dialog
            // Hentikan typewriter agar tidak ada race condition
            clearInterval(typingTimer);
            isTextFullyDisplayed = true;
            uiText.textContent = "[Hari Ketiga Selesai! Menghitung skor akhir...]";
            setTimeout(() => {
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
                showEndingScreen();
            }, 1800);
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
        phoneScreen.classList.remove("hidden");
    }
}

function closePhone() {
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
    { speaker: "Irma (Ojol)", text: "Mbak, ambil pesanan Nasi Goreng. Ini uang tunainya Rp20.000 ya. Tolong kembaliannya.", chara: "images/characters/chara1/Default.png", action: "wait_change_irma" },
    { speaker: "Irma (Ojol)", text: "Kembaliannya Rp5.000 ya? Pas banget! Makasih ya Mbak.", chara: "images/characters/chara1/Open mouth.png", earnMoney: 15000 },

    { speaker: "Metallicat", text: "Bagus! Pesanan kedua masuk, periksa HP-mu.", action: "trigger_order_day2_rusdi" },
    { speaker: "Azka", text: "Pesanan dari Pak Rusdi: 1x Mie Goreng (Rp13.000). Pembayaran pakai uang Rp20.000.", chara: null },
    { speaker: "Metallicat", text: "Ayo masak Mie Gorengnya!", action: "wait_cook_mie_goreng" },
    { speaker: "Pak Rusdi (Ojol)", text: "Permisi, pesanan Mie Goreng. Ini uangnya Rp20.000. Ditunggu kembaliannya.", chara: "images/characters/chara2/Default.png", action: "wait_change_rusdi" },
    { speaker: "Pak Rusdi (Ojol)", text: "Kembaliannya Rp7.000, betul sekali. Terima kasih, saya antar dulu ya.", chara: "images/characters/chara2/Open mouth.png", earnMoney: 13000 },

    { speaker: "Metallicat", text: "Satu pesanan lagi! Kali ini pembayarannya menggunakan pecahan besar.", action: "trigger_order_day2_mbah" },
    { speaker: "Azka", text: "Pesanan Bubur Ayam (Rp10.000). Wah, pembayarannya Rp50.000. Harus hati-hati hitung kembaliannya.", chara: null },
    { speaker: "Metallicat", text: "Siapkan Bubur Ayamnya dulu di dapur!", action: "wait_cook_bubur_ayam" },
    { speaker: "Mbah (Ojol)", text: "Nduk, Mbah ambil Bubur Ayam. Ini uangnya Rp50.000.", chara: "images/characters/chara3/Default.png", action: "wait_change_mbah" },
    { speaker: "Mbah (Ojol)", text: "Kembalian Rp40.000 ya Nduk. Suwun ya, Mbah pamit dulu.", chara: "images/characters/chara3/Open mouth.png", earnMoney: 10000 },

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

    // Pastikan interaction screen bersih dan tampil
    interactionScreen.classList.remove("hidden");
    document.getElementById("interaction-title").innerText = "Akhir Cerita";

    if (isGoodEnding) {
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
        switchToBadEndingBGM();
        interactionContent.innerHTML = `
            <div class="ending-screen ending-bad">
                <div class="ending-emoji">✦</div>
                <h3 class="ending-title">Bad Ending</h3>
                <p class="ending-subtitle">Toko Foodlove Azka Sepi Pelanggan</p>
                <div class="ending-divider"></div>
                <p class="ending-story">Rating buruk terus menumpuk dan ulasan negatif menyebar. Pelanggan mulai meninggalkan toko Azka. Aplikasi Foodlove mengirimkan peringatan bahwa toko berpotensi dinonaktifkan. Azka terduduk lesu, menatap gerobaknya yang kini sepi...</p>
                <div class="ending-score-box bad">
                    <p>Pendapatan: <b>Rp${gameState.money.toLocaleString('id-ID')}</b></p>
                    <p>Skor Akhir: <b>${finalScore}</b></p>
                </div>
                <p class="ending-quote">"Kegagalan adalah awal dari pembelajaran. Coba lagi dengan lebih bijak!"</p>
                <button class="ending-btn" onclick="restartGame()">Coba Lagi</button>
            </div>
        `;
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
    { speaker: "Azka", text: "Buka toko lagi ah! Hari ini pasti lebih sibuk dari kemarin.", chara: null },
    { speaker: "Metallicat", text: "Meow! Tapi Azka, ada yang perlu kamu lihat dulu. Buka HP-mu!", action: "show_rating_bad" },
    { speaker: "Azka", text: "Bintang 2?! Ulasan buruk?! Ya ampun...", chara: null },
    { speaker: "Metallicat", text: "Ini konsekuensi dari pelayanan hari kemarin. Rating sangat penting dalam bisnis online, Azka.", chara: null },
    { speaker: "Azka", text: "Aku harus jaga pelayanan lebih baik lagi hari ini. Tidak boleh sampai ini terulang.", chara: null },

    { speaker: "Metallicat", text: "Bersiaplah! Ada situasi tak terduga. Cek HP-mu sekarang!", action: "trigger_double_order_hp" },
    { speaker: "Azka", text: "Dua pesanan sekaligus?! Dari Irma dan Pak Rusdi?! Ini gawat...", chara: null },
];

const storyDay3_Irma = [
    { speaker: "Azka", text: "Oke, aku layani Irma dulu. Dia pesan Mie Goreng dan Ayam Goreng. Banyak tapi bisa!", chara: null },
    { speaker: "Metallicat", text: "Masak Mie Goreng-nya dulu, Azka!", action: "cook_irma_mie_goreng" },
    { speaker: "Azka", text: "Mie Goreng selesai! Sekarang Ayam Goreng!", chara: null },
    { speaker: "Metallicat", text: "Lanjut, masak Ayam Gorengnya!", action: "cook_irma_ayam_goreng" },
    { speaker: "Azka", text: "Semua pesanan Irma sudah siap!", chara: null, action: "eval_irma_cooking" },
];

const storyDay3_Rusdi = [
    { speaker: "Azka", text: "Sekarang giliran Pak Rusdi. Beliau pesan Mie Goreng, pembayaran uang pas.", chara: null },
    { speaker: "Metallicat", text: "Masak Mie Gorengnya untuk Pak Rusdi!", action: "cook_rusdi_mie_goreng" },
    { speaker: "Pak Rusdi (Ojol)", text: "Permisi, Mbak. Ini pesanan Mie Goreng saya. Uangnya pas, Rp13.000.", chara: "images/characters/chara2/Default.png", earnMoney: 13000 },
    { speaker: "Azka", text: "Ini pesanannya, Pak. Terima kasih!", chara: "images/characters/chara2/Default.png" },
    { speaker: "Pak Rusdi (Ojol)", text: "Mbak, boleh saya kasih masukan? Saya sering lihat penjual online yang tutup gara-gara tidak menjaga rating.", chara: "images/characters/chara2/Default.png" },
    { speaker: "Pak Rusdi (Ojol)", text: "Ulasan itu ibarat reputasi di dunia digital. Satu bintang 1 bisa menghapus 10 bintang 5 di mata algoritma aplikasi.", chara: "images/characters/chara2/Open mouth.png", action: "choice_rusdi_attitude" },
];

const storyDay3_Mbah = [
    { speaker: "Metallicat", text: "Masak masih ada satu pesanan lagi. Mbah memesan Bubur Ayam!", action: "cook_mbah_bubur" },
    { speaker: "Mbah (Ojol)", text: "Nduk, Mbah ambil Bubur Ayam. Ini uangnya pas ya, Rp10.000.", chara: "images/characters/chara3/Default.png", earnMoney: 10000 },
    { speaker: "Azka", text: "Ini Mbah, terima kasih sudah mampir!", chara: "images/characters/chara3/Default.png" },
    { speaker: "Mbah (Ojol)", text: "Nduk, Mbah mau tanya. Dulu Mbah juga punya warung, tapi sepi karena tempatnya di gang sempit.", chara: "images/characters/chara3/Default.png" },
    { speaker: "Mbah (Ojol)", text: "Kalau zaman Mbah dulu ada aplikasi seperti ini, mungkin warung Mbah masih buka sampai sekarang.", chara: "images/characters/chara3/Open mouth.png" },
    { speaker: "Azka", text: "Wah, Mbah juga pernah berjualan? Memangnya apa bedanya warung tradisional sama jualan online, Mbah?", chara: null },
    { speaker: "Mbah (Ojol)", text: "Warung tradisional itu kuat di kepercayaan dan hubungan personal. Tapi jangkauannya terbatas.", chara: "images/characters/chara3/Default.png" },
    { speaker: "Mbah (Ojol)", text: "Kalau online, jangkauannya luas, tapi kamu harus kerja keras menjaga reputasi digital. Lebih kompleks, tapi peluangnya jauh lebih besar.", chara: "images/characters/chara3/Open mouth.png" },
    { speaker: "Azka", text: "Jadi keduanya ada kelebihan dan kekurangannya masing-masing ya, Mbah.", chara: null },
    { speaker: "Mbah (Ojol)", text: "Betul, Nduk. Yang penting, niat baik dan pelayanan yang tulus. Di mana pun kamu berjualan, itu yang utama. Suwun ya!", chara: "images/characters/chara3/Default.png" },

    { speaker: "Azka", text: "Tiga hari ini aku belajar banyak sekali...", chara: null },
    { speaker: "Azka", text: "Berjualan online bukan cuma soal memasak. Ada manajemen pesanan, keuangan, pelayanan, bahkan psikologi pelanggan.", chara: null },
    { speaker: "Azka", text: "Ekosistem digital ini seperti warung modern — membutuhkan dedikasi yang tidak kalah dari warung konvensional.", chara: null },
    { speaker: "Metallicat", text: "Meow! Kamu sudah berkembang sejauh ini, Azka. Aku bangga melihatmu.", chara: null },
    { speaker: "Azka", text: "Terima kasih Metallicat. Aku akan terus belajar dan berkembang!", chara: null },
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