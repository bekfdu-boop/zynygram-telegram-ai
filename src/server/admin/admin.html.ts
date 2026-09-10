export function getAdminHtml(): string {
  return `<!DOCTYPE html>
<html lang="uz" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Zynygram • Web Admin Panel</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          fontFamily: {
            sans: ['"Plus Jakarta Sans"', 'sans-serif'],
          },
          colors: {
            brand: {
              50: '#f5f3ff',
              100: '#ede9fe',
              500: '#8b5cf6',
              600: '#7c3aed',
              700: '#6d28d9',
            }
          }
        }
      }
    }
  </script>
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; }
    /* Custom scrollbar */
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: #0f172a; }
    ::-webkit-scrollbar-thumb { background: #334155; border-radius: 9999px; }
    ::-webkit-scrollbar-thumb:hover { background: #475569; }
    .glass {
      background: rgba(30, 41, 59, 0.7);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.08);
    }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex flex-col antialiased selection:bg-brand-500 selection:text-white">

  <!-- ============================================================= -->
  <!-- LOGIN MODAL / SCREEN -->
  <!-- ============================================================= -->
  <div id="loginSection" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md px-4">
    <div class="glass w-full max-w-md p-8 rounded-2xl shadow-2xl border border-slate-800 relative overflow-hidden">
      <div class="absolute -top-12 -right-12 w-36 h-36 bg-brand-600/20 rounded-full blur-2xl"></div>
      <div class="absolute -bottom-12 -left-12 w-36 h-36 bg-emerald-600/20 rounded-full blur-2xl"></div>

      <div class="text-center mb-6 relative">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white text-3xl shadow-lg shadow-brand-500/30 mb-4">
          🛡
        </div>
        <h1 class="text-2xl font-bold tracking-tight text-white">Zynygram Admin Panel</h1>
        <p class="text-sm text-slate-400 mt-1">Rasmiy qo‘llab-quvvatlash va verifikatsiya boshqaruvi</p>
      </div>

      <form id="loginForm" onsubmit="handleLogin(event)" class="space-y-4 relative">
        <div>
          <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Maxfiy Admin Paroli</label>
          <div class="relative">
            <input
              type="password"
              id="adminPasswordInput"
              required
              placeholder="••••••••••••"
              class="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition text-sm"
            />
            <button
              type="button"
              onclick="togglePasswordVisibility()"
              class="absolute right-3 top-3.5 text-slate-400 hover:text-slate-200 text-xs px-1"
            >
              👁
            </button>
          </div>
        </div>

        <div id="loginError" class="hidden text-xs text-rose-400 bg-rose-950/50 border border-rose-800/60 p-2.5 rounded-lg"></div>

        <button
          type="submit"
          id="loginBtn"
          class="w-full py-3 px-4 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-brand-600/30 transition duration-150 flex items-center justify-center gap-2 text-sm"
        >
          <span>Tizimga kirish</span>
          <span>→</span>
        </button>
      </form>
    </div>
  </div>

  <!-- ============================================================= -->
  <!-- MAIN APP CONTAINER -->
  <!-- ============================================================= -->
  <div id="appSection" class="hidden flex-1 flex flex-col">
    <!-- Top Navigation Bar -->
    <header class="sticky top-0 z-40 glass border-b border-slate-800/80 px-4 lg:px-8 py-3.5 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-xl shadow-md shadow-brand-500/20">
          🛡
        </div>
        <div>
          <div class="flex items-center gap-2">
            <span class="font-extrabold text-base tracking-wide text-white">ZYNYGRAM</span>
            <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">Admin Web</span>
          </div>
          <p class="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Bot faol • Port: 3000</span>
          </p>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <nav class="hidden md:flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
        <button onclick="switchTab('dashboard')" id="tabBtn-dashboard" class="tab-btn px-4 py-1.5 rounded-lg text-xs font-semibold transition text-white bg-brand-600 shadow-sm">
          📊 Boshqaruv
        </button>
        <button onclick="switchTab('verifications')" id="tabBtn-verifications" class="tab-btn px-4 py-1.5 rounded-lg text-xs font-semibold transition text-slate-400 hover:text-white flex items-center gap-1.5">
          <span>🛡 Verifikatsiyalar</span>
          <span id="pendingBadge" class="hidden px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-slate-950 font-bold">0</span>
        </button>
        <button onclick="switchTab('users')" id="tabBtn-users" class="tab-btn px-4 py-1.5 rounded-lg text-xs font-semibold transition text-slate-400 hover:text-white">
          👥 Foydalanuvchilar
        </button>
        <button onclick="switchTab('conversations')" id="tabBtn-conversations" class="tab-btn px-4 py-1.5 rounded-lg text-xs font-semibold transition text-slate-400 hover:text-white">
          💬 Murojaatlar
        </button>
      </nav>

      <!-- Action Buttons -->
      <div class="flex items-center gap-2">
        <button
          onclick="refreshCurrentData()"
          title="Ma’lumotlarni yangilash"
          class="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition"
        >
          🔄
        </button>
        <button
          onclick="logout()"
          title="Chiqish"
          class="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-900/50 transition text-xs font-semibold flex items-center gap-1.5"
        >
          <span>Chiqish</span>
          <span>🚪</span>
        </button>
      </div>
    </header>

    <!-- Mobile Nav Bar -->
    <div class="md:hidden flex items-center justify-around bg-slate-900 border-b border-slate-800 p-2">
      <button onclick="switchTab('dashboard')" class="text-xs px-2 py-1 font-semibold text-slate-300">📊 Boshqaruv</button>
      <button onclick="switchTab('verifications')" class="text-xs px-2 py-1 font-semibold text-slate-300">🛡 Arizalar</button>
      <button onclick="switchTab('users')" class="text-xs px-2 py-1 font-semibold text-slate-300">👥 Userlar</button>
      <button onclick="switchTab('conversations')" class="text-xs px-2 py-1 font-semibold text-slate-300">💬 Chat</button>
    </div>

    <!-- Main Content Area -->
    <main class="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8">

      <!-- ============================================================= -->
      <!-- VIEW 1: DASHBOARD -->
      <!-- ============================================================= -->
      <section id="view-dashboard" class="space-y-6">
        <!-- Banner for Pending Requests -->
        <div id="pendingAlertBanner" class="hidden p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-600/10 to-transparent border border-amber-500/30 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="text-2xl">⏳</span>
            <div>
              <h4 class="text-sm font-bold text-amber-200" id="pendingBannerTitle">Kutilayotgan arizalar mavjud</h4>
              <p class="text-xs text-amber-300/80">Foydalanuvchilar tasdiqlash nishoni olish uchun isbot yuborishgan.</p>
            </div>
          </div>
          <button onclick="switchTab('verifications')" class="px-3.5 py-1.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400 transition">
            Ko‘rib chiqish →
          </button>
        </div>

        <!-- Metric Stat Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="glass p-5 rounded-2xl border border-slate-800">
            <div class="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
              <span>Jami Foydalanuvchilar</span>
              <span class="text-lg">👥</span>
            </div>
            <div class="text-2xl font-black text-white" id="stat-total-users">-</div>
            <p class="text-[11px] text-slate-500 mt-1">Bot bilan muloqot qilganlar</p>
          </div>

          <div class="glass p-5 rounded-2xl border border-slate-800">
            <div class="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
              <span>Kutilayotgan Arizalar</span>
              <span class="text-lg">⏳</span>
            </div>
            <div class="text-2xl font-black text-amber-400" id="stat-pending-v">-</div>
            <p class="text-[11px] text-amber-500/80 mt-1">Ko‘rib chiqilishi kerak</p>
          </div>

          <div class="glass p-5 rounded-2xl border border-slate-800">
            <div class="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
              <span>Tasdiqlangan Nishonlar</span>
              <span class="text-lg">🛡</span>
            </div>
            <div class="text-2xl font-black text-emerald-400" id="stat-approved-v">-</div>
            <p class="text-[11px] text-emerald-500/80 mt-1">Muvaffaqiyatli berilgan</p>
          </div>

          <div class="glass p-5 rounded-2xl border border-slate-800">
            <div class="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
              <span>Muloqotlar & Chat</span>
              <span class="text-lg">💬</span>
            </div>
            <div class="text-2xl font-black text-indigo-400" id="stat-total-convs">-</div>
            <p class="text-[11px] text-slate-500 mt-1">Jami ochilgan suhbatlar</p>
          </div>
        </div>

        <!-- Split Grid: Recent Verifications & Recent Users -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Recent Verifications Table -->
          <div class="glass p-6 rounded-2xl border border-slate-800 flex flex-col">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-sm font-bold text-white flex items-center gap-2">
                <span>🛡</span>
                <span>So‘nggi Tasdiqlash Arizalari</span>
              </h3>
              <button onclick="switchTab('verifications')" class="text-xs text-brand-400 hover:text-brand-300 font-semibold">
                Barchasi →
              </button>
            </div>
            <div id="dashboardRecentVerifications" class="space-y-3 flex-1">
              <p class="text-xs text-slate-500 py-4 text-center">Yuklanmoqda...</p>
            </div>
          </div>

          <!-- Recent Users Table -->
          <div class="glass p-6 rounded-2xl border border-slate-800 flex flex-col">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-sm font-bold text-white flex items-center gap-2">
                <span>👥</span>
                <span>Yangi Foydalanuvchilar</span>
              </h3>
              <button onclick="switchTab('users')" class="text-xs text-brand-400 hover:text-brand-300 font-semibold">
                Barchasi →
              </button>
            </div>
            <div id="dashboardRecentUsers" class="space-y-3 flex-1">
              <p class="text-xs text-slate-500 py-4 text-center">Yuklanmoqda...</p>
            </div>
          </div>
        </div>
      </section>

      <!-- ============================================================= -->
      <!-- VIEW 2: VERIFICATIONS -->
      <!-- ============================================================= -->
      <section id="view-verifications" class="hidden space-y-6">
        <!-- Filter and Search Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass p-4 rounded-2xl border border-slate-800">
          <!-- Status Filters -->
          <div class="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 overflow-x-auto">
            <button onclick="setVerificationFilter('')" id="vFilter-ALL" class="v-filter-btn px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white">
              Barchasi
            </button>
            <button onclick="setVerificationFilter('PENDING')" id="vFilter-PENDING" class="v-filter-btn px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-brand-600">
              ⏳ Kutilayotgan
            </button>
            <button onclick="setVerificationFilter('APPROVED')" id="vFilter-APPROVED" class="v-filter-btn px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white">
              ✅ Tasdiqlangan
            </button>
            <button onclick="setVerificationFilter('REJECTED')" id="vFilter-REJECTED" class="v-filter-btn px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white">
              ❌ Rad etilgan
            </button>
          </div>

          <!-- Search Input -->
          <div class="relative w-full sm:w-72">
            <input
              type="text"
              id="vSearchInput"
              oninput="debounceSearchVerifications()"
              placeholder="Username, nik yoki ID..."
              class="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
            />
            <span class="absolute left-3 top-2.5 text-xs text-slate-500">🔍</span>
          </div>
        </div>

        <!-- Verification Cards Container -->
        <div id="verificationCardsList" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Dynamic cards inserted here -->
        </div>

        <!-- Pagination -->
        <div id="vPagination" class="flex items-center justify-between py-2 text-xs text-slate-400">
          <span id="vPageInfo">Sahifa 1</span>
          <div class="flex gap-2">
            <button id="vPrevBtn" onclick="changeVPage(-1)" class="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40">Oldingi</button>
            <button id="vNextBtn" onclick="changeVPage(1)" class="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40">Keyingi</button>
          </div>
        </div>
      </section>

      <!-- ============================================================= -->
      <!-- VIEW 3: USERS -->
      <!-- ============================================================= -->
      <section id="view-users" class="hidden space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass p-4 rounded-2xl border border-slate-800">
          <div class="flex items-center gap-2">
            <span class="text-lg">👥</span>
            <h3 class="text-sm font-bold text-white">Barcha Foydalanuvchilar</h3>
            <span id="usersTotalBadge" class="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold">0 ta</span>
          </div>

          <div class="relative w-full sm:w-80">
            <input
              type="text"
              id="usersSearchInput"
              oninput="debounceSearchUsers()"
              placeholder="Ism, @username yoki Telegram ID..."
              class="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
            />
            <span class="absolute left-3 top-2.5 text-xs text-slate-500">🔍</span>
          </div>
        </div>

        <!-- Users Table -->
        <div class="glass rounded-2xl border border-slate-800 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-900/80 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th class="py-3.5 px-4 font-semibold">Foydalanuvchi</th>
                  <th class="py-3.5 px-4 font-semibold">Telegram ID</th>
                  <th class="py-3.5 px-4 font-semibold">Nishon (Status)</th>
                  <th class="py-3.5 px-4 font-semibold">Holati</th>
                  <th class="py-3.5 px-4 font-semibold">Sana</th>
                  <th class="py-3.5 px-4 font-semibold text-right">Amallar</th>
                </tr>
              </thead>
              <tbody id="usersTableBody" class="divide-y divide-slate-800/60">
                <!-- User rows inserted here -->
              </tbody>
            </table>
          </div>
        </div>

        <!-- Users Pagination -->
        <div class="flex items-center justify-between py-2 text-xs text-slate-400">
          <span id="usersPageInfo">Sahifa 1</span>
          <div class="flex gap-2">
            <button id="usersPrevBtn" onclick="changeUsersPage(-1)" class="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40">Oldingi</button>
            <button id="usersNextBtn" onclick="changeUsersPage(1)" class="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40">Keyingi</button>
          </div>
        </div>
      </section>

      <!-- ============================================================= -->
      <!-- VIEW 4: CONVERSATIONS & CHAT -->
      <!-- ============================================================= -->
      <section id="view-conversations" class="hidden space-y-6">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[720px]">
          <!-- Conversations List (4 cols) -->
          <div class="lg:col-span-4 glass rounded-2xl border border-slate-800 flex flex-col overflow-hidden">
            <div class="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 class="text-sm font-bold text-white flex items-center gap-2">
                <span>💬</span>
                <span>Murojaatlar</span>
              </h3>
              <span id="convsCountBadge" class="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold">0</span>
            </div>
            <div id="conversationsListContainer" class="flex-1 overflow-y-auto divide-y divide-slate-800/60">
              <p class="text-xs text-slate-500 p-4 text-center">Yuklanmoqda...</p>
            </div>
          </div>

          <!-- Chat Detail & Messages (8 cols) -->
          <div class="lg:col-span-8 glass rounded-2xl border border-slate-800 flex flex-col overflow-hidden">
            <!-- Chat Header -->
            <div id="chatHeader" class="p-4 border-b border-slate-800 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-sm font-bold text-brand-300">
                  👤
                </div>
                <div>
                  <h4 id="chatActiveUser" class="text-xs font-bold text-white">Suhbatni tanlang</h4>
                  <p id="chatActiveMeta" class="text-[10px] text-slate-400">Yozishmalarni ko‘rish uchun ro‘yxatdan suhbat ustiga bosing</p>
                </div>
              </div>
              <div id="chatHeaderActions" class="hidden">
                <button onclick="closeCurrentConversation()" class="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-semibold text-slate-400 hover:text-rose-400 transition">
                  Suhbatni yopish
                </button>
              </div>
            </div>

            <!-- Messages Stream -->
            <div id="chatMessagesStream" class="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-950/40">
              <div class="h-full flex items-center justify-center text-xs text-slate-500">
                Suhbat tanlanmagan
              </div>
            </div>

            <!-- Reply Box -->
            <form id="chatReplyForm" onsubmit="handleSendOperatorReply(event)" class="p-3 border-t border-slate-800 flex gap-2 bg-slate-900/60">
              <input
                type="text"
                id="chatReplyInput"
                disabled
                placeholder="Foydalanuvchiga operator nomidan javob yozish..."
                class="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-40 transition"
              />
              <button
                type="submit"
                id="chatReplyBtn"
                disabled
                class="px-4 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white font-semibold rounded-xl text-xs transition flex items-center gap-1.5"
              >
                <span>Yuborish</span>
                <span>📤</span>
              </button>
            </form>
          </div>
        </div>
      </section>

    </main>
  </div>

  <!-- ============================================================= -->
  <!-- PHOTO PREVIEW MODAL -->
  <!-- ============================================================= -->
  <div id="photoModal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4" onclick="closePhotoModal()">
    <div class="relative max-w-4xl max-h-[90vh] flex flex-col items-center" onclick="event.stopPropagation()">
      <button onclick="closePhotoModal()" class="absolute -top-10 right-0 text-white text-sm font-bold bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded-full transition">
        ✕ Yopish
      </button>
      <img id="photoModalImg" src="" alt="Isbot skrinshoti" class="max-h-[80vh] max-w-full rounded-2xl shadow-2xl border border-slate-700 object-contain" />
      <p class="text-xs text-slate-400 mt-2">📸 Foydalanuvchi yuborgan skrinshot / isbot rasmi</p>
    </div>
  </div>

  <!-- ============================================================= -->
  <!-- FLOATING TOAST NOTIFICATION CONTAINER -->
  <!-- ============================================================= -->
  <div id="toastContainer" class="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none"></div>

  <!-- ============================================================= -->
  <!-- CLIENT LOGIC SCRIPT -->
  <!-- ============================================================= -->
  <script>
    let currentToken = localStorage.getItem('zy_admin_token') || '';
    let currentTab = 'dashboard';
    let currentVFilter = 'PENDING';
    let currentVSearch = '';
    let currentVPage = 1;
    let currentUsersSearch = '';
    let currentUsersPage = 1;
    let activeConversationId = null;
    let vSearchTimer = null;
    let usersSearchTimer = null;

    // Initialize
    window.addEventListener('DOMContentLoaded', async () => {
      if (currentToken) {
        const isValid = await verifyToken(currentToken);
        if (isValid) {
          showApp();
          loadDashboardData();
        } else {
          showLogin();
        }
      } else {
        showLogin();
      }
    });

    function showLogin() {
      document.getElementById('loginSection').classList.remove('hidden');
      document.getElementById('appSection').classList.add('hidden');
    }

    function showApp() {
      document.getElementById('loginSection').classList.add('hidden');
      document.getElementById('appSection').classList.remove('hidden');
    }

    function togglePasswordVisibility() {
      const input = document.getElementById('adminPasswordInput');
      input.type = input.type === 'password' ? 'text' : 'password';
    }

    async function handleLogin(e) {
      e.preventDefault();
      const password = document.getElementById('adminPasswordInput').value;
      const errorEl = document.getElementById('loginError');
      const btn = document.getElementById('loginBtn');

      errorEl.classList.add('hidden');
      btn.disabled = true;
      btn.innerHTML = '<span>Tekshirilmoqda...</span>';

      try {
        const res = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password }),
        });

        const data = await res.json();
        if (res.ok && data.token) {
          currentToken = data.token;
          localStorage.setItem('zy_admin_token', currentToken);
          showToast('Tizimga muvaffaqiyatli kirdingiz! 🛡', 'success');
          showApp();
          loadDashboardData();
        } else {
          errorEl.textContent = data.error || 'Parol noto‘g‘ri. Iltimos, qayta tekshiring.';
          errorEl.classList.remove('hidden');
        }
      } catch (err) {
        errorEl.textContent = 'Serverga ulanishda xatolik yuz berdi.';
        errorEl.classList.remove('hidden');
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<span>Tizimga kirish</span><span>→</span>';
      }
    }

    function logout() {
      currentToken = '';
      localStorage.removeItem('zy_admin_token');
      showLogin();
      showToast('Tizimdan chiqildi.', 'info');
    }

    async function verifyToken(token) {
      try {
        const res = await fetch('/api/admin/auth/check', {
          headers: { 'Authorization': 'Bearer ' + token },
        });
        return res.ok;
      } catch {
        return false;
      }
    }

    // Tab Switching
    function switchTab(tab) {
      currentTab = tab;
      ['dashboard', 'verifications', 'users', 'conversations'].forEach(t => {
        document.getElementById('view-' + t).classList.toggle('hidden', t !== tab);
        const btn = document.getElementById('tabBtn-' + t);
        if (btn) {
          if (t === tab) {
            btn.className = 'tab-btn px-4 py-1.5 rounded-lg text-xs font-semibold transition text-white bg-brand-600 shadow-sm';
          } else {
            btn.className = 'tab-btn px-4 py-1.5 rounded-lg text-xs font-semibold transition text-slate-400 hover:text-white flex items-center gap-1.5';
          }
        }
      });

      if (tab === 'dashboard') loadDashboardData();
      if (tab === 'verifications') loadVerifications();
      if (tab === 'users') loadUsers();
      if (tab === 'conversations') loadConversations();
    }

    function refreshCurrentData() {
      showToast('Yangilanmoqda...', 'info');
      if (currentTab === 'dashboard') loadDashboardData();
      if (currentTab === 'verifications') loadVerifications();
      if (currentTab === 'users') loadUsers();
      if (currentTab === 'conversations') loadConversations();
    }

    // =============================================================
    // API CALLS & LOADERS
    // =============================================================
    async function apiFetch(endpoint, options = {}) {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + currentToken,
        ...(options.headers || {}),
      };

      const res = await fetch(endpoint, { ...options, headers });
      if (res.status === 401) {
        logout();
        throw new Error('Sessiya muddati tugadi');
      }
      return res;
    }

    // Dashboard Data
    async function loadDashboardData() {
      try {
        const res = await apiFetch('/api/admin/stats');
        const data = await res.json();

        document.getElementById('stat-total-users').textContent = data.users?.total ?? 0;
        document.getElementById('stat-pending-v').textContent = data.verification?.pending ?? 0;
        document.getElementById('stat-approved-v').textContent = data.verification?.approved ?? 0;
        document.getElementById('stat-total-convs').textContent = data.conversations?.total ?? 0;

        // Pending Alert Banner & Badge
        const pendingCount = data.verification?.pending ?? 0;
        const banner = document.getElementById('pendingAlertBanner');
        const badge = document.getElementById('pendingBadge');

        if (pendingCount > 0) {
          banner.classList.remove('hidden');
          document.getElementById('pendingBannerTitle').textContent = pendingCount + ' ta yangi tasdiqlash arizasi kutmoqda!';
          badge.textContent = pendingCount;
          badge.classList.remove('hidden');
        } else {
          banner.classList.add('hidden');
          badge.classList.add('hidden');
        }

        // Recent Verifications
        const rVCont = document.getElementById('dashboardRecentVerifications');
        if (data.recentVerifications && data.recentVerifications.length > 0) {
          rVCont.innerHTML = data.recentVerifications.map(req => renderMiniVerificationRow(req)).join('');
        } else {
          rVCont.innerHTML = '<p class="text-xs text-slate-500 py-4 text-center">Yangi arizalar mavjud emas</p>';
        }

        // Recent Users
        const rUCont = document.getElementById('dashboardRecentUsers');
        if (data.recentUsers && data.recentUsers.length > 0) {
          rUCont.innerHTML = data.recentUsers.map(u => renderMiniUserRow(u)).join('');
        } else {
          rUCont.innerHTML = '<p class="text-xs text-slate-500 py-4 text-center">Foydalanuvchilar mavjud emas</p>';
        }

      } catch (err) {
        console.error('Failed to load dashboard:', err);
      }
    }

    function renderMiniVerificationRow(req) {
      const userHandle = req.user?.username ? '@' + req.user.username : (req.user?.firstName || 'Foydalanuvchi');
      const time = new Date(req.createdAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
      const statusBadge = req.status === 'APPROVED'
        ? '<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">Tasdiqlangan</span>'
        : req.status === 'REJECTED'
          ? '<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400">Rad etilgan</span>'
          : '<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 animate-pulse">Kutilmoqda</span>';

      return \`
        <div class="p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 flex items-center justify-between gap-3">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-brand-600/20 text-brand-300 flex items-center justify-center text-xs font-bold">
              🛡
            </div>
            <div>
              <p class="text-xs font-bold text-white">\${escapeHtml(userHandle)}</p>
              <p class="text-[10px] text-slate-400">\${time} • ID: \${req.user?.telegramId || ''}</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            \${statusBadge}
            \${req.status === 'PENDING' ? \`
              <button onclick="quickApprove('\${req.id}')" class="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold transition">
                Tasdiqlash
              </button>
            \` : ''}
          </div>
        </div>
      \`;
    }

    function renderMiniUserRow(u) {
      const name = u.firstName || u.username || 'Foydalanuvchi';
      const handle = u.username ? '@' + u.username : 'ID: ' + u.telegramId;
      return \`
        <div class="p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center text-xs font-bold">
              👤
            </div>
            <div>
              <p class="text-xs font-bold text-white">\${escapeHtml(name)} \${u.isVerified ? '🛡' : ''}</p>
              <p class="text-[10px] text-slate-400">\${escapeHtml(handle)}</p>
            </div>
          </div>
          <span class="text-[10px] \${u.isBlocked ? 'text-rose-400' : 'text-emerald-400'}">
            \${u.isBlocked ? '🚫 Bloklangan' : '✅ Faol'}
          </span>
        </div>
      \`;
    }

    // =============================================================
    // VERIFICATIONS TAB
    // =============================================================
    function setVerificationFilter(filter) {
      currentVFilter = filter;
      currentVPage = 1;
      ['ALL', 'PENDING', 'APPROVED', 'REJECTED'].forEach(f => {
        const btn = document.getElementById('vFilter-' + f);
        if (btn) {
          if ((!filter && f === 'ALL') || filter === f) {
            btn.className = 'v-filter-btn px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-brand-600 shadow-sm';
          } else {
            btn.className = 'v-filter-btn px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white';
          }
        }
      });
      loadVerifications();
    }

    function debounceSearchVerifications() {
      clearTimeout(vSearchTimer);
      vSearchTimer = setTimeout(() => {
        currentVSearch = document.getElementById('vSearchInput').value;
        currentVPage = 1;
        loadVerifications();
      }, 350);
    }

    function changeVPage(delta) {
      currentVPage += delta;
      loadVerifications();
    }

    async function loadVerifications() {
      const container = document.getElementById('verificationCardsList');
      container.innerHTML = '<div class="col-span-full py-10 text-center text-xs text-slate-500">Yuklanmoqda...</div>';

      try {
        const query = new URLSearchParams({
          page: currentVPage,
          limit: 12,
          ...(currentVFilter ? { status: currentVFilter } : {}),
          ...(currentVSearch ? { search: currentVSearch } : {}),
        });

        const res = await apiFetch('/api/admin/verifications?' + query.toString());
        const data = await res.json();

        if (data.requests && data.requests.length > 0) {
          container.innerHTML = data.requests.map(req => renderVerificationCard(req)).join('');
        } else {
          container.innerHTML = '<div class="col-span-full py-12 text-center text-slate-500 text-xs">Hech qanday ariza topilmadi</div>';
        }

        document.getElementById('vPageInfo').textContent = 'Sahifa ' + data.page + ' / ' + (data.totalPages || 1) + ' (Jami: ' + data.total + ')';
        document.getElementById('vPrevBtn').disabled = data.page <= 1;
        document.getElementById('vNextBtn').disabled = data.page >= data.totalPages;

      } catch (err) {
        container.innerHTML = '<div class="col-span-full py-8 text-center text-rose-400 text-xs">Xatolik: Arizalarni yuklab bo‘lmadi</div>';
      }
    }

    function renderVerificationCard(req) {
      const userHandle = req.user?.username ? '@' + req.user.username : 'Username yo‘q';
      const userName = req.user?.firstName || 'Ismsiz';
      const zynygramDisplay = req.zynygramUsername ? '@' + req.zynygramUsername : null;
      const dateStr = new Date(req.createdAt).toLocaleString('uz-UZ');

      let statusBadge = '';
      if (req.status === 'APPROVED') {
        statusBadge = '<span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">✅ Tasdiqlangan</span>';
      } else if (req.status === 'REJECTED') {
        statusBadge = '<span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">❌ Rad etilgan</span>';
      } else {
        statusBadge = '<span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">⏳ Kutilmoqda</span>';
      }

      // Format proof text with clickable links
      let formattedProof = escapeHtml(req.proofText || '(Isbot matni yo‘q)');
      formattedProof = formattedProof.replace(
        /(https?:\\/\\/[^\\s]+)/g,
        '<a href="$1" target="_blank" class="text-brand-400 underline hover:text-brand-300 font-medium break-all">$1</a>'
      );

      const hasPhoto = !!req.photoFileId;
      const photoHtml = hasPhoto
        ? \`
          <div class="mt-3 relative group">
            <div class="text-[11px] font-bold text-slate-400 mb-1 flex items-center gap-1">
              <span>📸</span>
              <span>Ilova qilingan skrinshot:</span>
            </div>
            <div onclick="openPhotoModal('/api/admin/photo/\${req.photoFileId}')" class="cursor-pointer overflow-hidden rounded-xl border border-slate-700 bg-slate-900 max-h-48 flex items-center justify-center group-hover:border-brand-500 transition">
              <img src="/api/admin/photo/\${req.photoFileId}" alt="Isbot" class="object-cover w-full h-48 group-hover:scale-105 transition duration-200" />
            </div>
            <p class="text-[10px] text-slate-500 mt-1 text-center group-hover:text-brand-300">🔎 Kattalashtirib ko‘rish uchun bosing</p>
          </div>
        \`
        : '';

      return \`
        <div class="glass p-5 rounded-2xl border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition">
          <div>
            <!-- Header Row -->
            <div class="flex items-start justify-between gap-3 pb-3 border-b border-slate-800/80">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-800 to-slate-700 flex items-center justify-center text-base font-bold text-brand-300">
                  👤
                </div>
                <div>
                  <h4 class="text-sm font-bold text-white">\${escapeHtml(userName)}</h4>
                  <p class="text-xs text-brand-400 font-medium">\${escapeHtml(userHandle)} • ID: \${req.user?.telegramId || ''}</p>
                </div>
              </div>
              \${statusBadge}
            </div>

            <!-- Meta info: Zynygram Profile & Date -->
            <div class="grid grid-cols-2 gap-2 my-3 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/60 text-xs">
              <div>
                <span class="text-[10px] text-slate-400 block">Zynygram Profili:</span>
                <span class="font-bold text-brand-300">\${zynygramDisplay ? escapeHtml(zynygramDisplay) : '<i class="text-slate-500 font-normal">Belgilanmagan</i>'}</span>
              </div>
              <div>
                <span class="text-[10px] text-slate-400 block">Yuborilgan vaqt:</span>
                <span class="text-slate-300 font-medium text-[11px]">\${dateStr}</span>
              </div>
            </div>

            <!-- Proof Content -->
            <div class="text-xs text-slate-300 leading-relaxed bg-slate-900/40 p-3 rounded-xl border border-slate-800/40">
              <p class="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Murojaat / Isbot matni:</p>
              <div>\${formattedProof}</div>
            </div>

            <!-- Screenshot / Photo Preview -->
            \${photoHtml}
          </div>

          <!-- Actions Footer -->
          \${req.status === 'PENDING' ? \`
            <div class="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-800/80">
              <button
                onclick="approveVerification('\${req.id}')"
                class="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-900/30 transition flex items-center justify-center gap-1.5"
              >
                <span>✅</span>
                <span>Tasdiqlash</span>
              </button>
              <button
                onclick="rejectVerification('\${req.id}')"
                class="py-2 px-3 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-600/30 font-bold text-xs transition flex items-center justify-center gap-1.5"
              >
                <span>❌</span>
                <span>Rad etish</span>
              </button>
            </div>
          \` : ''}
        </div>
      \`;
    }

    async function approveVerification(id) {
      if (!confirm('Ushbu foydalanuvchining arizasini tasdiqlaysizmi? Unga Telegramda tabrik xabari jo‘natiladi.')) return;
      try {
        const res = await apiFetch('/api/admin/verifications/' + id + '/approve', { method: 'POST' });
        const data = await res.json();
        if (res.ok) {
          showToast('✅ Foydalanuvchi tasdiqlandi va Telegram orqali xabar yetkazildi!', 'success');
          loadVerifications();
          loadDashboardData();
        } else {
          showToast('Xatolik: ' + (data.error || 'Tasdiqlab bo‘lmadi'), 'error');
        }
      } catch (err) {
        showToast('Server bilan bog‘lanishda xatolik', 'error');
      }
    }

    async function quickApprove(id) {
      approveVerification(id);
    }

    async function rejectVerification(id) {
      if (!confirm('Ushbu arizani rad etmoqchimisiz?')) return;
      try {
        const res = await apiFetch('/api/admin/verifications/' + id + '/reject', { method: 'POST' });
        const data = await res.json();
        if (res.ok) {
          showToast('Arizani rad etish xabari foydalanuvchiga yuborildi.', 'info');
          loadVerifications();
          loadDashboardData();
        } else {
          showToast('Xatolik: ' + (data.error || 'Rad etib bo‘lmadi'), 'error');
        }
      } catch (err) {
        showToast('Server bilan bog‘lanishda xatolik', 'error');
      }
    }

    // =============================================================
    // USERS TAB
    // =============================================================
    function debounceSearchUsers() {
      clearTimeout(usersSearchTimer);
      usersSearchTimer = setTimeout(() => {
        currentUsersSearch = document.getElementById('usersSearchInput').value;
        currentUsersPage = 1;
        loadUsers();
      }, 350);
    }

    function changeUsersPage(delta) {
      currentUsersPage += delta;
      loadUsers();
    }

    async function loadUsers() {
      const tbody = document.getElementById('usersTableBody');
      tbody.innerHTML = '<tr><td colspan="6" class="py-8 text-center text-slate-500">Yuklanmoqda...</td></tr>';

      try {
        const query = new URLSearchParams({
          page: currentUsersPage,
          limit: 15,
          ...(currentUsersSearch ? { search: currentUsersSearch } : {}),
        });

        const res = await apiFetch('/api/admin/users?' + query.toString());
        const data = await res.json();

        document.getElementById('usersTotalBadge').textContent = data.total + ' ta';
        document.getElementById('usersPageInfo').textContent = 'Sahifa ' + data.page + ' / ' + (data.totalPages || 1) + ' (Jami: ' + data.total + ')';
        document.getElementById('usersPrevBtn').disabled = data.page <= 1;
        document.getElementById('usersNextBtn').disabled = data.page >= data.totalPages;

        if (data.users && data.users.length > 0) {
          tbody.innerHTML = data.users.map(u => renderUserTableRow(u)).join('');
        } else {
          tbody.innerHTML = '<tr><td colspan="6" class="py-8 text-center text-slate-500">Foydalanuvchilar topilmadi</td></tr>';
        }
      } catch (err) {
        tbody.innerHTML = '<tr><td colspan="6" class="py-8 text-center text-rose-400">Xatolik yuz berdi</td></tr>';
      }
    }

    function renderUserTableRow(u) {
      const name = u.firstName || 'Ismsiz';
      const handle = u.username ? '@' + u.username : '-';
      const date = new Date(u.createdAt).toLocaleDateString('uz-UZ');

      return \`
        <tr class="hover:bg-slate-900/40 transition">
          <td class="py-3 px-4">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300">
                👤
              </div>
              <div>
                <p class="font-bold text-white">\${escapeHtml(name)}</p>
                <p class="text-[11px] text-slate-400">\${escapeHtml(handle)}</p>
              </div>
            </div>
          </td>
          <td class="py-3 px-4 font-mono text-[11px] text-slate-300">\${u.telegramId}</td>
          <td class="py-3 px-4">
            \${u.isVerified
              ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">🛡 Tasdiqlangan</span>'
              : '<span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400">Oddiy</span>'
            }
          </td>
          <td class="py-3 px-4">
            \${u.isBlocked
              ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">🚫 Bloklangan</span>'
              : '<span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400">✅ Faol</span>'
            }
          </td>
          <td class="py-3 px-4 text-slate-400 text-[11px]">\${date}</td>
          <td class="py-3 px-4 text-right">
            <div class="flex items-center justify-end gap-1.5">
              <button
                onclick="toggleUserVerify('\${u.telegramId}', \${!u.isVerified})"
                title="\${u.isVerified ? 'Nishonni bekor qilish' : 'Nishon berish'}"
                class="px-2.5 py-1 rounded-lg \${u.isVerified ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-brand-600 text-white hover:bg-brand-500'} text-[10px] font-bold transition"
              >
                \${u.isVerified ? 'Nishonni olish' : '🛡 Nishon berish'}
              </button>
              <button
                onclick="toggleUserBlock('\${u.telegramId}', \${!u.isBlocked})"
                title="\${u.isBlocked ? 'Blokdan chiqarish' : 'Bloklash'}"
                class="px-2.5 py-1 rounded-lg \${u.isBlocked ? 'bg-emerald-600 text-white' : 'bg-rose-600/20 text-rose-300 hover:bg-rose-600 hover:text-white'} text-[10px] font-bold transition"
              >
                \${u.isBlocked ? 'Chiqarish' : 'Bloklash'}
              </button>
            </div>
          </td>
        </tr>
      \`;
    }

    async function toggleUserVerify(telegramId, isVerified) {
      try {
        const res = await apiFetch('/api/admin/users/' + telegramId + '/toggle-verify', {
          method: 'POST',
          body: JSON.stringify({ isVerified }),
        });
        if (res.ok) {
          showToast(isVerified ? '🛡 Foydalanuvchiga nishon berildi!' : 'Nishon olib tashlandi.', 'success');
          loadUsers();
          loadDashboardData();
        }
      } catch (err) {
        showToast('Amalni bajarib bo‘lmadi', 'error');
      }
    }

    async function toggleUserBlock(telegramId, isBlocked) {
      if (!confirm(isBlocked ? 'Ushbu foydalanuvchini bloklamoqchimisiz?' : 'Foydalanuvchini blokdan chiqarmoqchimisiz?')) return;
      try {
        const res = await apiFetch('/api/admin/users/' + telegramId + '/toggle-block', {
          method: 'POST',
          body: JSON.stringify({ isBlocked }),
        });
        if (res.ok) {
          showToast(isBlocked ? 'Foydalanuvchi bloklandi.' : 'Foydalanuvchi blokdan chiqarildi.', 'info');
          loadUsers();
        }
      } catch (err) {
        showToast('Amalni bajarib bo‘lmadi', 'error');
      }
    }

    // =============================================================
    // CONVERSATIONS & CHAT TAB
    // =============================================================
    async function loadConversations() {
      const container = document.getElementById('conversationsListContainer');
      container.innerHTML = '<p class="text-xs text-slate-500 p-4 text-center">Yuklanmoqda...</p>';

      try {
        const res = await apiFetch('/api/admin/conversations?limit=30');
        const data = await res.json();

        document.getElementById('convsCountBadge').textContent = data.total || 0;

        if (data.conversations && data.conversations.length > 0) {
          container.innerHTML = data.conversations.map(c => renderConversationItem(c)).join('');
        } else {
          container.innerHTML = '<p class="text-xs text-slate-500 p-4 text-center">Suhbatlar mavjud emas</p>';
        }
      } catch (err) {
        container.innerHTML = '<p class="text-xs text-rose-400 p-4 text-center">Yuklashda xatolik</p>';
      }
    }

    function renderConversationItem(c) {
      const name = c.user?.firstName || c.user?.username || 'Foydalanuvchi';
      const lastText = c.lastMessage?.content || '(Xabarlar yo‘q)';
      const isSelected = c.id === activeConversationId;
      const statusBadge = c.status === 'WAITING_HUMAN'
        ? '<span class="px-1.5 py-0.2 rounded-full text-[9px] bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">Operator kutmoqda</span>'
        : c.status === 'CLOSED'
          ? '<span class="px-1.5 py-0.2 rounded-full text-[9px] bg-slate-800 text-slate-400 font-semibold">Yopilgan</span>'
          : '<span class="px-1.5 py-0.2 rounded-full text-[9px] bg-brand-500/20 text-brand-300 font-semibold">AI faol</span>';

      return \`
        <div onclick="selectConversation('\${c.id}', '\${escapeHtml(name)}', '\${c.user?.telegramId || ''}', '\${c.status}')" class="p-3 cursor-pointer transition \${isSelected ? 'bg-brand-600/15 border-l-4 border-brand-500' : 'hover:bg-slate-900/50'}">
          <div class="flex items-center justify-between gap-2 mb-1">
            <h5 class="text-xs font-bold text-white truncate">\${escapeHtml(name)}</h5>
            \${statusBadge}
          </div>
          <p class="text-[11px] text-slate-400 truncate">\${escapeHtml(lastText)}</p>
        </div>
      \`;
    }

    async function selectConversation(id, name, telegramId, status) {
      activeConversationId = id;
      document.getElementById('chatActiveUser').textContent = name;
      document.getElementById('chatActiveMeta').textContent = 'Telegram ID: ' + telegramId + ' • Holat: ' + status;
      document.getElementById('chatHeaderActions').classList.remove('hidden');

      const input = document.getElementById('chatReplyInput');
      const btn = document.getElementById('chatReplyBtn');
      input.disabled = false;
      btn.disabled = false;
      input.focus();

      // Highlight in list
      loadConversations();
      loadChatMessages(id);
    }

    async function loadChatMessages(id) {
      const stream = document.getElementById('chatMessagesStream');
      stream.innerHTML = '<div class="h-full flex items-center justify-center text-xs text-slate-500">Xabarlar yuklanmoqda...</div>';

      try {
        const res = await apiFetch('/api/admin/conversations/' + id + '/messages');
        const messages = await res.json();

        if (messages && messages.length > 0) {
          stream.innerHTML = messages.map(m => {
            const isUser = m.role === 'USER';
            const time = new Date(m.createdAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
            return \`
              <div class="flex flex-col \${isUser ? 'items-start' : 'items-end'}">
                <div class="max-w-[75%] p-3 rounded-2xl text-xs leading-relaxed \${isUser ? 'bg-slate-800 text-slate-100 rounded-bl-none' : 'bg-brand-600 text-white rounded-br-none shadow-md shadow-brand-900/20'}">
                  <div class="text-[10px] font-bold opacity-75 mb-1">\${isUser ? '👤 Mijoz' : (m.role === 'ADMIN' ? '👨‍💻 Operator' : '🤖 AI Assistant')}</div>
                  <div class="whitespace-pre-wrap">\${escapeHtml(m.content)}</div>
                  <div class="text-[9px] opacity-60 text-right mt-1">\${time}</div>
                </div>
              </div>
            \`;
          }).join('');
          stream.scrollTop = stream.scrollHeight;
        } else {
          stream.innerHTML = '<div class="h-full flex items-center justify-center text-xs text-slate-500">Xabarlar mavjud emas</div>';
        }
      } catch (err) {
        stream.innerHTML = '<div class="h-full flex items-center justify-center text-xs text-rose-400">Xabarlarni yuklab bo‘lmadi</div>';
      }
    }

    async function handleSendOperatorReply(e) {
      e.preventDefault();
      if (!activeConversationId) return;

      const input = document.getElementById('chatReplyInput');
      const text = input.value.trim();
      if (!text) return;

      input.value = '';
      try {
        const res = await apiFetch('/api/admin/conversations/' + activeConversationId + '/reply', {
          method: 'POST',
          body: JSON.stringify({ message: text }),
        });
        if (res.ok) {
          showToast('Xabar yuborildi!', 'success');
          loadChatMessages(activeConversationId);
          loadConversations();
        } else {
          showToast('Xabarni yuborib bo‘lmadi', 'error');
        }
      } catch (err) {
        showToast('Server bilan bog‘lanishda xatolik', 'error');
      }
    }

    async function closeCurrentConversation() {
      if (!activeConversationId) return;
      if (!confirm('Suhbatni yopmoqchimisiz?')) return;
      try {
        const res = await apiFetch('/api/admin/conversations/' + activeConversationId + '/close', { method: 'POST' });
        if (res.ok) {
          showToast('Suhbat yopildi.', 'info');
          loadConversations();
        }
      } catch (err) {
        showToast('Xatolik', 'error');
      }
    }

    // =============================================================
    // PHOTO MODAL
    // =============================================================
    function openPhotoModal(src) {
      document.getElementById('photoModalImg').src = src;
      document.getElementById('photoModal').classList.remove('hidden');
    }

    function closePhotoModal() {
      document.getElementById('photoModal').classList.add('hidden');
    }

    // =============================================================
    // TOAST NOTIFICATIONS
    // =============================================================
    function showToast(message, type = 'info') {
      const container = document.getElementById('toastContainer');
      const toast = document.createElement('div');

      const bg = type === 'success'
        ? 'bg-emerald-950/90 border-emerald-700/80 text-emerald-200'
        : type === 'error'
          ? 'bg-rose-950/90 border-rose-700/80 text-rose-200'
          : 'bg-slate-900/90 border-slate-700/80 text-slate-200';

      toast.className = 'glass pointer-events-auto p-3.5 rounded-xl border shadow-xl text-xs flex items-center gap-2 transform transition-all duration-300 translate-y-2 opacity-0 ' + bg;
      toast.innerHTML = '<span>' + (type === 'success' ? '✅' : (type === 'error' ? '⚠️' : 'ℹ️')) + '</span><span class="flex-1">' + escapeHtml(message) + '</span>';

      container.appendChild(toast);
      requestAnimationFrame(() => {
        toast.classList.remove('translate-y-2', 'opacity-0');
      });

      setTimeout(() => {
        toast.classList.add('translate-y-2', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
      }, 3500);
    }

    function escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }
  </script>
</body>
</html>
`;
}

export default getAdminHtml;
