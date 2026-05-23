
// ============================================================
// --- VARIABEL GLOBAL ---
// ============================================================
let gameState = {
    day: 1,
    score: 0,
    money: 0,
    currentDialogueIndex: 0,
    mode: "dialogue", // "dialogue", "waiting_click", "cooking", "calculating"
    waitingAction: null
};

// Variabel global untuk sistem memasak
let currentRecipe = [];
let targetStep = 0;
let cookingMistakes = 0;

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
// --- DATA NARASI DAY 1 ---
// ============================================================
const storyDay1 = [
    // Konflik Narasi Awal
    { speaker: "Azka", text: "Hah... Surat lamaran kerjaku ditolak lagi. Memang susah cari kerja kalau minim pengalaman.", chara: null },
    { speaker: "Azka", text: "Padahal aku ini fresh graduate jurusan Tata Boga. Apa aku coba rintis usaha kuliner secara online aja ya?", chara: null },
    { speaker: "Azka", text: "Belakangan ini lagi viral aplikasi toko kuliner digital warna pink, namanya 'Foodlove'. Coba aku unduh deh.", chara: null },
    
    // Sesi Tutorial (Metallicat)
    { speaker: "Metallicat", text: "Meow! Halo, manusia! Selamat datang di ekosistem Foodlove!", chara: null }, 
    { speaker: "Azka", text: "Eh?! Kucing bisa bicara?!", chara: null },
    { speaker: "Metallicat", text: "Aku adalah asisten virtualmu. Panggil saja aku Metallicat. Aku akan memandumu memahami sistem operasional dasar di sini.", chara: null },
    { speaker: "Metallicat", text: "Pertama, mari kita buka aplikasinya. Coba kamu klik Ikon HP milikmu di pojok kiri atas.", action: "wait_open_phone" },
    
    // Setelah pemain mengklik HP dan menutupnya
    { speaker: "Metallicat", text: "Bagus! Sekarang akun tokomu sudah terdaftar dan siap beroperasi.", chara: null },
    { speaker: "Metallicat", text: "Mari kita lakukan simulasi. Aku akan memesan Nasi Goreng melalui gawaiku. Buka HP-mu dan cek pesanan yang masuk!", action: "trigger_order_tutorial" },
    
    // Setelah pemain menerima pesanan di HP
    { speaker: "Azka", text: "Wah, pesanannya sudah masuk! Nasi Goreng satu porsi.", chara: null },
    { speaker: "Metallicat", text: "Tepat sekali! Sekarang tugasmu adalah menyiapkannya di dapur. Klik bahan sesuai urutan yang benar!", action: "wait_cook_nasi_goreng" },
    
    // Setelah minigame masak selesai
    { speaker: "Azka", text: "Fiuh, Nasi Gorengnya sudah siap dan dibungkus rapi!", chara: null },
    { speaker: "Metallicat", text: "Kerja bagus, Azka! Sekarang kita tinggal menunggu kurir ojek online datang mengambilnya.", chara: null },
    
    // Mekanis Transaksi (Irma Datang)
    { speaker: "Irma (Ojol)", text: "Permisi, Foodlove! Ambil pesanan atas nama Metallicat, Nasi Goreng satu porsi ya, Mbak.", chara: "images/characters/chara1/Default.png" },
    { speaker: "Azka", text: "Iya Kak, ini pesanannya sudah siap.", chara: "images/characters/chara1/Default.png" },
    { speaker: "Irma (Ojol)", text: "Oke. Ini pembayaran tunai pas dari pelanggan ya, Rp15.000. Terima kasih!", chara: "images/characters/chara1/Open mouth.png", earnMoney: 15000, addScore: 1 },
    { speaker: "Azka", text: "Wah, uang pertamaku! Terima kasih banyak, Kak. Hati-hati di jalan!", chara: "images/characters/chara1/Default.png" },
    { speaker: "Irma (Ojol)", text: "Mari, Mbak. Semoga laris manis dagangannya!", chara: "images/characters/chara1/Default.png" },
    
    // Konklusi Day 1
    { speaker: "Azka", text: "Ternyata tidak terlalu sulit ya berjualan online.", chara: null },
    { speaker: "Metallicat", text: "Meow! Jangan lengah dulu. Besok tantangannya akan lebih sulit karena kamu harus menghitung kembalian tunai.", chara: null },
    { speaker: "Metallicat", text: "Sampai jumpa besok, persiapkan mentalmu!", chara: null },
    { speaker: "System", text: "[Hari Pertama Selesai! Mengkalkulasi progres...]", action: "end_day_1" }
];

// Set narasi aktif ke Day 1
let activeStory = storyDay1;

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

// ============================================================
// --- LOGIKA MESIN VISUAL NOVEL ---
// ============================================================
updateUI();
loadDialogue();

function loadDialogue() {
    if (gameState.currentDialogueIndex >= activeStory.length) return;
    
    let currentLine = activeStory[gameState.currentDialogueIndex];
    
    uiName.innerText = currentLine.speaker;
    
    // Warna nama karakter
    if (currentLine.speaker === "System") uiName.style.color = "#ffff00";
    else if (currentLine.speaker === "Metallicat") uiName.style.color = "#00ffff";
    else if (currentLine.speaker.includes("Irma")) uiName.style.color = "#ff8fa0";
    else if (currentLine.speaker.includes("Rusdi")) uiName.style.color = "#8fafff";
    else if (currentLine.speaker.includes("Mbah")) uiName.style.color = "#c0a0ff";
    else uiName.style.color = "#ffb6c1";

    uiText.innerText = currentLine.text;

    // Sistem penampakan karakter
    if (currentLine.chara) {
        charaImg.src = currentLine.chara;
        charaImg.classList.remove("hidden");
    } else {
        charaImg.classList.add("hidden");
    }

    // Sistem Reward
    if (currentLine.earnMoney) updateMoney(currentLine.earnMoney);
    if (currentLine.addScore) updateScore(currentLine.addScore);

    // Sistem Trigger Aksi Interaktif
    if (currentLine.action) {
        handleAction(currentLine.action);
    }
}

function nextDialogue() {
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
        // === DAY 1 ACTIONS ===
        case "wait_open_phone":
            gameState.mode = "waiting_click";
            hpNotif.classList.remove("hidden");
            uiText.innerText += "\n\n(Klik Ikon HP di Pojok Kiri Atas)";
            break;
            
        case "trigger_order_tutorial":
            gameState.mode = "waiting_click";
            document.getElementById("app-text").innerText = "Terdapat Pesanan Baru:\n\n1x Nasi Goreng\nPembayaran: Tunai (COD)\nTotal: Rp15.000";
            btnAction.innerText = "Terima Pesanan";
            btnAction.classList.remove("hidden");
            hpNotif.classList.remove("hidden");
            uiText.innerText += "\n\n(Buka HP dan Klik Terima Pesanan)";
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

        // === DAY 2 ACTIONS ===
        case "trigger_order_day2_irma":
            gameState.mode = "waiting_click";
            document.getElementById("app-text").innerText = "📦 Pesanan Baru (Irma)!\n\n1x Nasi Goreng\nHarga: Rp15.000\nPembayaran: Rp20.000\nKembalian: ???";
            btnAction.innerText = "Terima Pesanan";
            btnAction.classList.remove("hidden");
            hpNotif.classList.remove("hidden");
            break;

        case "trigger_order_day2_rusdi":
            gameState.mode = "waiting_click";
            document.getElementById("app-text").innerText = "📦 Pesanan Baru (Pak Rusdi)!\n\n1x Mie Goreng\nHarga: Rp13.000\nPembayaran: Rp20.000\nKembalian: ???";
            btnAction.innerText = "Terima Pesanan";
            btnAction.classList.remove("hidden");
            hpNotif.classList.remove("hidden");
            break;

        case "trigger_order_day2_mbah":
            gameState.mode = "waiting_click";
            document.getElementById("app-text").innerText = "📦 Pesanan Baru (Mbah)!\n\n1x Bubur Ayam\nHarga: Rp10.000\nPembayaran: Rp50.000\nKembalian: ???";
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
                // Uncomment ketika Day 3 sudah siap:
                // setTimeout(() => {
                //     const btn = interactionContent.querySelector("button");
                //     if (btn) btn.onclick = () => { interactionScreen.classList.add("hidden"); startDay3(); };
                // }, 200);
            }, 1000);
            break;
    }
}

// ============================================================
// --- FUNGSI INTERAKSI HP ---
// ============================================================
function openPhone() {
    if (gameState.mode === "waiting_click" && activeStory[gameState.currentDialogueIndex].action === "wait_open_phone") {
        hpNotif.classList.add("hidden");
        document.getElementById("app-text").innerText = "Aplikasi Foodlove siap digunakan. Menunggu pesanan...";
    }
    phoneScreen.classList.remove("hidden");
}

function closePhone() {
    phoneScreen.classList.add("hidden");
    
    if (gameState.mode === "waiting_click" && activeStory[gameState.currentDialogueIndex].action === "wait_open_phone") {
        gameState.mode = "dialogue";
        nextDialogue();
    }
}

function processOrder() {
    document.getElementById("app-text").innerText = "Pesanan sedang diproses di dapur...";
    btnAction.classList.add("hidden");
    hpNotif.classList.add("hidden");
    closePhone();
    
    gameState.mode = "dialogue";
    nextDialogue();
}

// ============================================================
// --- FUNGSI INTERAKSI DAPUR (COOKING SYSTEM) ---
// ============================================================

/**
 * Utilitas: Mengacak array (Fisher-Yates Shuffle)
 */
function shuffleArray(arr) {
    let shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Membuka layar memasak dengan progress bar dan tombol acak.
 */
function openCookingScreen(foodName) {
    interactionScreen.classList.remove("hidden");
    document.getElementById("interaction-title").innerText = "🍳 Dapur: " + foodName;
    
    // Ambil resep dari data
    if (!resepMakanan[foodName]) {
        console.error("Resep tidak ditemukan untuk:", foodName);
        return;
    }
    
    currentRecipe = resepMakanan[foodName];
    targetStep = 0;
    cookingMistakes = 0;
    
    renderCookingSteps(foodName);
}

/**
 * Merender tombol bahan makanan dalam urutan acak + progress bar.
 */
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

/**
 * Memeriksa apakah langkah memasak yang diklik sesuai urutan.
 * - Benar: Tombol berubah hijau, lanjut ke step berikutnya
 * - Salah: Tombol bergetar merah, beri feedback negatif
 * - Selesai: Tampilkan "Pesanan Siap!" dan kembali ke dialog
 */
function checkCookingStep(clickedStep, buttonElement, foodName) {
    const correctStep = currentRecipe[targetStep];
    const feedbackEl = document.getElementById("cooking-feedback");
    const progressEl = document.getElementById("cooking-progress");
    const stepTextEl = document.getElementById("cooking-step-text");
    
    if (clickedStep === correctStep) {
        // === BENAR ===
        targetStep++;
        
        // Tandai tombol sebagai benar
        buttonElement.classList.add("correct");
        buttonElement.disabled = true;
        
        // Update progress bar
        const progressPercent = (targetStep / currentRecipe.length) * 100;
        progressEl.style.width = progressPercent + "%";
        
        // Feedback positif
        feedbackEl.innerHTML = `<span class="feedback-correct">✅ ${clickedStep} — Benar!</span>`;
        feedbackEl.classList.add("feedback-pop");
        setTimeout(() => feedbackEl.classList.remove("feedback-pop"), 400);
        
        // Cek apakah semua langkah selesai
        if (targetStep >= currentRecipe.length) {
            // === SEMUA LANGKAH SELESAI ===
            stepTextEl.innerText = "✅ Semua langkah selesai!";
            feedbackEl.innerHTML = `<span class="feedback-complete">🎉 ${foodName} siap dibungkus!</span>`;
            
            // Disable semua tombol yang tersisa
            document.querySelectorAll(".recipe-btn").forEach(btn => {
                btn.disabled = true;
                btn.classList.add("disabled");
            });
            
            // Auto-close dan kembali ke dialog setelah delay
            setTimeout(() => {
                interactionScreen.classList.add("hidden");
                gameState.mode = "dialogue";
                nextDialogue();
            }, 1500);
        } else {
            stepTextEl.innerText = `Langkah ${targetStep + 1} / ${currentRecipe.length}`;
        }
        
    } else {
        // === SALAH ===
        cookingMistakes++;
        
        // Animasi shake pada tombol
        buttonElement.classList.add("wrong");
        setTimeout(() => buttonElement.classList.remove("wrong"), 600);
        
        // Feedback negatif
        feedbackEl.innerHTML = `<span class="feedback-wrong">❌ Salah! Yang benar selanjutnya bukan "${clickedStep}".</span>`;
        feedbackEl.classList.add("feedback-pop");
        setTimeout(() => feedbackEl.classList.remove("feedback-pop"), 400);
    }
}

// ============================================================
// --- MINIGAME KEMBALIAN (PENILAIAN +1 / -1) ---
// ============================================================
let hasMadeMistake = false;

function openChangeCalculator(paid, price) {
    hasMadeMistake = false;
    const correctChange = paid - price;
    interactionScreen.classList.remove("hidden");
    document.getElementById("interaction-title").innerText = "💰 Hitung Kembalian";

    interactionContent.innerHTML = `
        <div style="background:#fff0f5;border-radius:12px;padding:16px;margin-bottom:16px;border:2px solid #ffb6c1;">
            <p style="margin:4px 0;font-size:16px;">💵 Pelanggan Bayar: <b>Rp${paid.toLocaleString('id-ID')}</b></p>
            <p style="margin:4px 0;font-size:16px;">🛒 Harga Pesanan: <b>Rp${price.toLocaleString('id-ID')}</b></p>
        </div>
        <p style="font-size:15px;color:#333;margin-bottom:8px;">Masukkan jumlah kembalian yang tepat (Rp):</p>
        <input type="number" id="change-input" placeholder="Contoh: 5000"
            style="width:90%;padding:12px;font-size:22px;border:3px solid #ff69b4;border-radius:10px;text-align:center;margin-bottom:16px;box-sizing:border-box;outline:none;">
        <button onclick="submitChange(${paid}, ${price})"
            style="background:#ff69b4;padding:14px;font-size:18px;width:100%;border-radius:10px;border:none;color:white;cursor:pointer;font-weight:bold;">
            ✅ Berikan Kembalian
        </button>
        <div id="change-feedback" style="margin-top:12px;font-size:16px;min-height:24px;"></div>
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
        
        feedback.innerHTML = `<span style="color:green;font-weight:bold;">✅ Tepat! Kembaliannya Rp${correct.toLocaleString('id-ID')}</span>`;
        
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
        feedback.innerHTML = `<span style="color:#e00;font-weight:bold;">❌ Salah! Coba hitung dengan lebih teliti.</span>`;
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
    // Animasi flash pada ui-money
    const moneyEl = document.getElementById("ui-money");
    moneyEl.classList.add("money-flash");
    setTimeout(() => moneyEl.classList.remove("money-flash"), 600);
}

function updateScore(amount) {
    gameState.score += amount;
    updateUI();
    // Animasi flash pada score
    const scoreEl = document.getElementById("score-text");
    scoreEl.classList.add("score-flash");
    setTimeout(() => scoreEl.classList.remove("score-flash"), 600);
}

// ============================================================
// --- RINGKASAN AKHIR HARI ---
// ============================================================
function showDaySummary(day) {
    interactionScreen.classList.remove("hidden");
    document.getElementById("interaction-title").innerText = `🌙 Hari Ke-${day} Selesai!`;
    interactionContent.innerHTML = `
        <div style="text-align:center;padding:10px;">
            <div style="font-size:60px;margin-bottom:10px;">🎉</div>
            <p style="font-size:18px;color:#333;margin-bottom:8px;">Rekap Harian:</p>
            <div style="background:#fff0f5;border-radius:12px;padding:16px;border:2px solid #ffb6c1;margin-bottom:16px;">
                <p style="font-size:20px;margin:6px 0;">💰 Total Pendapatan: <b>Rp${gameState.money.toLocaleString('id-ID')}</b></p>
                <p style="font-size:20px;margin:6px 0;">⭐ Total Skor: <b>${gameState.score}</b></p>
            </div>
            <p style="font-size:15px;color:#888;margin-bottom:16px;">Hari ke-${day + 1} akan segera dimulai...</p>
            <button onclick="closeSummary()" style="background:#ff69b4;padding:14px 30px;font-size:18px;border-radius:10px;border:none;color:white;cursor:pointer;font-weight:bold;">
                Lanjut ➔
            </button>
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
    // Opening Day 2
    { speaker: "System", text: "[Hari Kedua — Tantangan Kembalian Tunai (Cashback Challenge)]" },
    { speaker: "Azka", text: "Wah, hari kedua! Semoga hari ini berjalan lancar.", chara: null },
    { speaker: "Metallicat", text: "Meow! Bersiaplah, Azka. Fokus utama hari ini adalah menguji ketelitian matematis kamu dalam menghitung uang kembalian (COD).", chara: null },
    { speaker: "Metallicat", text: "Jika kembalianmu benar, Skor akan bertambah +1. Tapi jika salah, pelanggan akan kecewa dan Skor -1!", chara: null },

    // Pesanan 1: Irma
    { speaker: "Metallicat", text: "Ada pesanan masuk! Coba cek HP-mu.", action: "trigger_order_day2_irma" },
    { speaker: "Azka", text: "Oke, pesanan dari Irma: 1x Nasi Goreng (Rp15.000). Pembayaran pakai uang Rp20.000.", chara: null },
    { speaker: "Metallicat", text: "Siapkan di dapur sekarang!", action: "wait_cook_nasi_goreng" },
    { speaker: "Irma (Ojol)", text: "Mbak, ambil pesanan Nasi Goreng. Ini uang tunainya Rp20.000 ya. Tolong kembaliannya.", chara: "images/characters/chara1/Default.png", action: "wait_change_irma" },
    { speaker: "Irma (Ojol)", text: "Kembaliannya Rp5.000 ya? Pas banget! Makasih ya Mbak.", chara: "images/characters/chara1/Open mouth.png", earnMoney: 15000 },

    // Pesanan 2: Pak Rusdi
    { speaker: "Metallicat", text: "Bagus! Pesanan kedua masuk, periksa HP-mu.", action: "trigger_order_day2_rusdi" },
    { speaker: "Azka", text: "Pesanan dari Pak Rusdi: 1x Mie Goreng (Rp13.000). Pembayaran pakai uang Rp20.000.", chara: null },
    { speaker: "Metallicat", text: "Ayo masak Mie Gorengnya!", action: "wait_cook_mie_goreng" },
    { speaker: "Pak Rusdi (Ojol)", text: "Permisi, pesanan Mie Goreng. Ini uangnya Rp20.000. Ditunggu kembaliannya.", chara: "images/characters/chara2/Default.png", action: "wait_change_rusdi" },
    { speaker: "Pak Rusdi (Ojol)", text: "Kembaliannya Rp7.000, betul sekali. Terima kasih, saya antar dulu ya.", chara: "images/characters/chara2/Open mouth.png", earnMoney: 13000 },

    // Pesanan 3: Mbah
    { speaker: "Metallicat", text: "Satu pesanan lagi! Kali ini pembayarannya menggunakan pecahan besar.", action: "trigger_order_day2_mbah" },
    { speaker: "Azka", text: "Pesanan Bubur Ayam (Rp10.000). Wah, pembayarannya Rp50.000. Harus hati-hati hitung kembaliannya.", chara: null },
    { speaker: "Metallicat", text: "Siapkan Bubur Ayamnya dulu di dapur!", action: "wait_cook_bubur_ayam" },
    { speaker: "Mbah (Ojol)", text: "Nduk, Mbah ambil Bubur Ayam. Ini uangnya Rp50.000.", chara: "images/characters/chara3/Default.png", action: "wait_change_mbah" },
    { speaker: "Mbah (Ojol)", text: "Kembalian Rp40.000 ya Nduk. Suwun ya, Mbah pamit dulu.", chara: "images/characters/chara3/Open mouth.png", earnMoney: 10000 },

    // Konklusi Day 2
    { speaker: "Azka", text: "Huft... selesai juga hari kedua. Lumayan bikin deg-degan pas ngitung uang.", chara: null },
    { speaker: "Metallicat", text: "Kerja yang bagus! Keuanganmu aman. Besok bersiaplah untuk manajemen konflik dan rating buruk.", chara: null },
    { speaker: "System", text: "[Hari Kedua Selesai! Mengkalkulasi progres...]", action: "end_day_2" }
];

// ============================================================
// --- FUNGSI START DAY 2 ---
// ============================================================
function startDay2() {
    gameState.day = 2;
    gameState.currentDialogueIndex = 0;
    activeStory = storyDay2;
    
    // Reset UI
    charaImg.classList.add("hidden");
    hpNotif.classList.add("hidden");
    btnAction.classList.add("hidden");
    document.getElementById("app-text").innerText = "Tidak ada pesanan masuk.";
    phoneScreen.classList.add("hidden");
    interactionScreen.classList.add("hidden");
    gameState.mode = "dialogue";

    loadDialogue();
}