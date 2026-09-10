export function getAdminHtml(): string {
  return `<!DOCTYPE html>
<html lang="uz">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Zynygram • Web Admin Panel</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700&display=swap" rel="stylesheet">
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            carbon: '#181925',
            'paper-white': '#ffffff',
            linen: '#fafafa',
            mist: '#f5f5f5',
            fog: '#e8e8e8',
            ash: '#999999',
            graphite: '#666666',
            lavender: '#918df6',
            iris: '#9580ff',
            mint: '#33c758',
            'mint-wash': '#def6e4',
            amber: '#ffa600',
            sky: '#2c78fc',
            magenta: '#d6409f',
            ember: '#ff3e00',
          },
          fontFamily: {
            sans: ['Inter', 'Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
          },
          boxShadow: {
            'subtle': 'rgba(0, 0, 0, 0.08) 0px 1px 1px 1px, rgba(0, 0, 0, 0.06) 0px 0px 0px 0.5px',
            'subtle-2': 'rgba(0, 0, 0, 0.08) 0px 1px 1px 0px, rgba(0, 0, 0, 0.05) 0px 0px 0px 1px',
            'subtle-3': 'rgba(0, 0, 0, 0.06) 0px 1px 3px 0px, rgba(0, 0, 0, 0.06) 0px 8px 16px 0px, rgba(0, 0, 0, 0.02) 0px 0px 0px 1px',
          },
          letterSpacing: {
            'tight-body': '-0.32px',
            'tight-head': '-0.61px',
            'tight-disp': '-1.5px',
          }
        }
      }
    }
  </script>
  <style>
    :root {
      --color-carbon: #181925;
      --color-paper-white: #ffffff;
      --color-linen: #fafafa;
      --color-mist: #f5f5f5;
      --color-fog: #e8e8e8;
      --color-ash: #999999;
      --color-graphite: #666666;
      --color-lavender: #918df6;
      --color-iris: #9580ff;
      --color-mint: #33c758;
      --color-mint-wash: #def6e4;
      --color-amber: #ffa600;
      --color-sky: #2c78fc;
      --color-ember: #ff3e00;
    }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      letter-spacing: -0.32px;
      color: #181925;
      background-color: #fafafa;
    }
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: #fafafa; }
    ::-webkit-scrollbar-thumb { background: #e8e8e8; border-radius: 9999px; }
    ::-webkit-scrollbar-thumb:hover { background: #999999; }
    .btn-pill-primary {
      background-color: #918df6;
      color: #ffffff;
      border-radius: 9999px;
      font-weight: 500;
      font-size: 14px;
      letter-spacing: -0.32px;
      box-shadow: rgba(0, 0, 0, 0.08) 0px 1px 1px 1px, rgba(0, 0, 0, 0.06) 0px 0px 0px 0.5px;
      transition: all 0.15s ease;
    }
    .btn-pill-primary:hover {
      background-color: #7f7af3;
      transform: translateY(-0.5px);
    }
    .btn-pill-ghost {
      background-color: transparent;
      color: #666666;
      border-radius: 9999px;
      font-weight: 500;
      font-size: 14px;
      letter-spacing: -0.32px;
      transition: all 0.15s ease;
    }
    .btn-pill-ghost:hover {
      background-color: #f5f5f5;
      color: #181925;
    }
    .btn-pill-secondary {
      background-color: #ffffff;
      color: #181925;
      border: 1px solid #e8e8e8;
      border-radius: 9999px;
      font-weight: 500;
      font-size: 14px;
      letter-spacing: -0.32px;
      box-shadow: rgba(0, 0, 0, 0.08) 0px 1px 1px 0px, rgba(0, 0, 0, 0.05) 0px 0px 0px 1px;
      transition: all 0.15s ease;
    }
    .btn-pill-secondary:hover {
      background-color: #f5f5f5;
    }
    .card-blueprint {
      background-color: #ffffff;
      border: 1px solid #e8e8e8;
      border-radius: 16px;
      box-shadow: rgba(0, 0, 0, 0.06) 0px 1px 3px 0px, rgba(0, 0, 0, 0.06) 0px 8px 16px 0px, rgba(0, 0, 0, 0.02) 0px 0px 0px 1px;
    }
    .tag-pill {
      border-radius: 9999px;
      font-weight: 500;
      font-size: 12px;
      letter-spacing: -0.32px;
    }
  </style>
</head>
<body class="min-h-screen flex flex-col antialiased bg-[#fafafa] text-carbon selection:bg-lavender selection:text-white">

  <!-- ============================================================= -->
  <!-- LOGIN MODAL / SCREEN (Visitors White Blueprint Style) -->
  <!-- ============================================================= -->
  <div id="loginSection" class="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-md px-4">
    <div class="card-blueprint w-full max-w-md p-8 relative overflow-hidden bg-white">
      <!-- Atmospheric decorative gradient band accent behind top -->
      <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-sky to-lavender"></div>

      <div class="text-center mb-8 pt-2">
        <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-lavender text-white text-xl shadow-subtle mb-4">
          🛡
        </div>
        <h1 class="text-2xl font-semibold tracking-tight-head text-carbon">Zynygram Admin Panel</h1>
        <p class="text-sm text-graphite mt-1">Analytics & Verification Management Portal</p>
      </div>

      <form id="loginForm" onsubmit="handleLogin(event)" class="space-y-4">
        <div>
          <label class="block text-xs font-medium text-graphite uppercase tracking-wider mb-2">Maxfiy Admin Paroli</label>
          <div class="relative">
            <input
              type="password"
              id="adminPasswordInput"
              required
              placeholder="••••••••••••"
              class="w-full px-4 py-2.5 bg-mist border border-fog rounded-lg text-carbon placeholder-ash focus:outline-none focus:bg-white focus:border-lavender focus:ring-1 focus:ring-lavender transition text-sm"
            />
            <button
              type="button"
              onclick="togglePasswordVisibility()"
              class="absolute right-3 top-2.5 text-ash hover:text-carbon text-xs px-1"
            >
              👁
            </button>
          </div>
        </div>

        <div id="loginError" class="hidden text-xs text-ember bg-rose-50 border border-rose-200 p-3 rounded-lg"></div>

        <button
          type="submit"
          id="loginBtn"
          class="w-full py-2.5 px-4 btn-pill-primary flex items-center justify-center gap-2 text-sm mt-2"
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
    <!-- Top Floating Header & Navigation Pill -->
    <header class="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-fog px-4 lg:px-8 py-3 flex items-center justify-between">
      <!-- Left Brand -->
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-full bg-lavender flex items-center justify-center text-white text-sm shadow-subtle">
          🛡
        </div>
        <div>
          <div class="flex items-center gap-2">
            <span class="font-semibold text-sm tracking-tight text-carbon">Visitors</span>
            <span class="text-ash font-normal text-xs">/</span>
            <span class="font-semibold text-xs tracking-tight text-carbon">Zynygram</span>
            <span class="tag-pill px-2 py-0.5 bg-mint-wash text-mint text-[11px] border border-mint/20 font-semibold">Live</span>
          </div>
        </div>
      </div>

      <!-- Center Floating Navigation Pill (Signature Visitors Component) -->
      <nav class="hidden md:flex items-center gap-1 bg-white p-1 rounded-full border border-fog shadow-subtle">
        <button onclick="switchTab('dashboard')" id="tabBtn-dashboard" class="px-4 py-1.5 rounded-full text-xs font-medium transition text-white bg-lavender shadow-subtle">
          Boshqaruv
        </button>
        <button onclick="switchTab('verifications')" id="tabBtn-verifications" class="px-4 py-1.5 rounded-full text-xs font-medium transition text-graphite hover:text-carbon flex items-center gap-1.5">
          <span>Verifikatsiyalar</span>
          <span id="pendingBadge" class="hidden px-1.5 py-0.2 rounded-full text-[10px] bg-amber text-white font-semibold">0</span>
        </button>
        <button onclick="switchTab('users')" id="tabBtn-users" class="px-4 py-1.5 rounded-full text-xs font-medium transition text-graphite hover:text-carbon">
          Foydalanuvchilar
        </button>
        <button onclick="switchTab('conversations')" id="tabBtn-conversations" class="px-4 py-1.5 rounded-full text-xs font-medium transition text-graphite hover:text-carbon">
          Murojaatlar
        </button>
      </nav>

      <!-- Right Action Controls -->
      <div class="flex items-center gap-2">
        <button
          onclick="refreshCurrentData()"
          title="Ma’lumotlarni yangilash"
          class="w-8 h-8 rounded-full flex items-center justify-center bg-white border border-fog text-graphite hover:text-carbon hover:bg-mist transition text-xs shadow-subtle"
        >
          🔄
        </button>
        <button
          onclick="logout()"
          title="Chiqish"
          class="px-3.5 py-1.5 rounded-full bg-white border border-fog text-graphite hover:text-ember transition text-xs font-medium flex items-center gap-1.5 shadow-subtle"
        >
          <span>Chiqish</span>
          <span>🚪</span>
        </button>
      </div>
    </header>

    <!-- Mobile Nav Bar -->
    <div class="md:hidden flex items-center justify-around bg-white border-b border-fog p-2">
      <button onclick="switchTab('dashboard')" class="text-xs px-3 py-1 font-medium text-carbon">Boshqaruv</button>
      <button onclick="switchTab('verifications')" class="text-xs px-3 py-1 font-medium text-graphite">Arizalar</button>
      <button onclick="switchTab('users')" class="text-xs px-3 py-1 font-medium text-graphite">Userlar</button>
      <button onclick="switchTab('conversations')" class="text-xs px-3 py-1 font-medium text-graphite">Chat</button>
    </div>

    <!-- Main Content Canvas (Max width 1200px per DESIGN.md) -->
    <main class="flex-1 max-w-[1200px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8">

      <!-- ============================================================= -->
      <!-- VIEW 1: DASHBOARD -->
      <!-- ============================================================= -->
      <section id="view-dashboard" class="space-y-6">
        <!-- Announcement / Pending Chip Banner (Signature Visitors Component) -->
        <div id="pendingAlertBanner" class="hidden card-blueprint p-4 bg-white border-l-4 border-l-amber flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="tag-pill px-2.5 py-1 bg-amber/15 text-amber text-xs font-semibold">DIQQAT</span>
            <div>
              <h4 class="text-xs font-semibold text-carbon" id="pendingBannerTitle">Kutilayotgan arizalar mavjud</h4>
              <p class="text-xs text-graphite">Foydalanuvchilar tasdiqlash nishoni olish uchun isbot yuborishgan.</p>
            </div>
          </div>
          <button onclick="switchTab('verifications')" class="btn-pill-primary text-xs px-4 py-1.5">
            Ko‘rib chiqish →
          </button>
        </div>

        <!-- Metric Callout Cards Grid (DESIGN.md specification: 16px radius, 12-16px padding, Mint delta) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Stat 1: Total Users -->
          <div class="card-blueprint p-4 bg-white">
            <div class="flex items-center justify-between text-ash text-xs font-normal mb-1">
              <span>Jami Foydalanuvchilar</span>
              <span class="w-2 h-2 rounded-full bg-sky"></span>
            </div>
            <div class="text-2xl font-semibold text-carbon tracking-tight" id="stat-total-users">-</div>
            <div class="mt-2 flex items-center gap-1.5 text-[11px]">
              <span class="tag-pill px-2 py-0.5 bg-mint-wash text-mint font-semibold">+100% faol</span>
              <span class="text-ash">tizimda</span>
            </div>
          </div>

          <!-- Stat 2: Pending Verifications -->
          <div class="card-blueprint p-4 bg-white">
            <div class="flex items-center justify-between text-ash text-xs font-normal mb-1">
              <span>Kutilayotgan Arizalar</span>
              <span class="w-2 h-2 rounded-full bg-amber"></span>
            </div>
            <div class="text-2xl font-semibold text-carbon tracking-tight" id="stat-pending-v">-</div>
            <div class="mt-2 flex items-center gap-1.5 text-[11px]">
              <span class="tag-pill px-2 py-0.5 bg-amber/10 text-amber font-semibold">Ko‘rib chiqish</span>
              <span class="text-ash">kutmoqda</span>
            </div>
          </div>

          <!-- Stat 3: Approved Badges -->
          <div class="card-blueprint p-4 bg-white">
            <div class="flex items-center justify-between text-ash text-xs font-normal mb-1">
              <span>Tasdiqlangan Nishonlar</span>
              <span class="w-2 h-2 rounded-full bg-mint"></span>
            </div>
            <div class="text-2xl font-semibold text-carbon tracking-tight" id="stat-approved-v">-</div>
            <div class="mt-2 flex items-center gap-1.5 text-[11px]">
              <span class="tag-pill px-2 py-0.5 bg-mint-wash text-mint font-semibold">Muvaffaqiyatli</span>
              <span class="text-ash">tasdiqlangan</span>
            </div>
          </div>

          <!-- Stat 4: Support Conversations -->
          <div class="card-blueprint p-4 bg-white">
            <div class="flex items-center justify-between text-ash text-xs font-normal mb-1">
              <span>Muloqotlar & Chat</span>
              <span class="w-2 h-2 rounded-full bg-lavender"></span>
            </div>
            <div class="text-2xl font-semibold text-carbon tracking-tight" id="stat-total-convs">-</div>
            <div class="mt-2 flex items-center gap-1.5 text-[11px]">
              <span class="tag-pill px-2 py-0.5 bg-mist text-graphite font-semibold">Operator & AI</span>
              <span class="text-ash">yozishmalari</span>
            </div>
          </div>
        </div>

        <!-- Split 2-Column Grid: Recent Verifications & Recent Users -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Recent Verifications Panel -->
          <div class="card-blueprint p-6 bg-white flex flex-col">
            <div class="flex items-center justify-between mb-4 pb-3 border-b border-fog">
              <div class="flex items-center gap-2">
                <div class="w-6 h-6 rounded-full bg-lavender/20 text-lavender flex items-center justify-center text-xs font-bold">
                  🛡
                </div>
                <h3 class="text-sm font-semibold text-carbon">So‘nggi Tasdiqlash Arizalari</h3>
              </div>
              <button onclick="switchTab('verifications')" class="text-xs text-lavender hover:underline font-medium">
                Barchasi →
              </button>
            </div>
            <div id="dashboardRecentVerifications" class="space-y-2.5 flex-1">
              <p class="text-xs text-ash py-4 text-center">Yuklanmoqda...</p>
            </div>
          </div>

          <!-- Recent Users Panel -->
          <div class="card-blueprint p-6 bg-white flex flex-col">
            <div class="flex items-center justify-between mb-4 pb-3 border-b border-fog">
              <div class="flex items-center gap-2">
                <div class="w-6 h-6 rounded-full bg-sky/15 text-sky flex items-center justify-center text-xs font-bold">
                  👥
                </div>
                <h3 class="text-sm font-semibold text-carbon">Yangi Ro‘yxatdan O‘tganlar</h3>
              </div>
              <button onclick="switchTab('users')" class="text-xs text-lavender hover:underline font-medium">
                Barchasi →
              </button>
            </div>
            <div id="dashboardRecentUsers" class="space-y-2.5 flex-1">
              <p class="text-xs text-ash py-4 text-center">Yuklanmoqda...</p>
            </div>
          </div>
        </div>
      </section>

      <!-- ============================================================= -->
      <!-- VIEW 2: VERIFICATIONS -->
      <!-- ============================================================= -->
      <section id="view-verifications" class="hidden space-y-6">
        <!-- Filter & Search Toolbar -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 card-blueprint p-4 bg-white">
          <!-- Status Pill Filters -->
          <div class="flex items-center gap-1 bg-mist p-1 rounded-full border border-fog overflow-x-auto">
            <button onclick="setVerificationFilter('')" id="vFilter-ALL" class="v-filter-btn px-4 py-1 rounded-full text-xs font-medium text-graphite hover:text-carbon">
              Barchasi
            </button>
            <button onclick="setVerificationFilter('PENDING')" id="vFilter-PENDING" class="v-filter-btn px-4 py-1 rounded-full text-xs font-medium text-white bg-lavender shadow-subtle">
              ⏳ Kutilayotgan
            </button>
            <button onclick="setVerificationFilter('APPROVED')" id="vFilter-APPROVED" class="v-filter-btn px-4 py-1 rounded-full text-xs font-medium text-graphite hover:text-carbon">
              ✅ Tasdiqlangan
            </button>
            <button onclick="setVerificationFilter('REJECTED')" id="vFilter-REJECTED" class="v-filter-btn px-4 py-1 rounded-full text-xs font-medium text-graphite hover:text-carbon">
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
              class="w-full pl-9 pr-4 py-2 bg-mist border border-fog rounded-full text-xs text-carbon placeholder-ash focus:outline-none focus:bg-white focus:border-lavender focus:ring-1 focus:ring-lavender transition"
            />
            <span class="absolute left-3.5 top-2.5 text-xs text-ash">🔍</span>
          </div>
        </div>

        <!-- Verification Cards Grid -->
        <div id="verificationCardsList" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Dynamic cards inserted here -->
        </div>

        <!-- Pagination -->
        <div id="vPagination" class="flex items-center justify-between py-2 text-xs text-graphite">
          <span id="vPageInfo">Sahifa 1</span>
          <div class="flex gap-2">
            <button id="vPrevBtn" onclick="changeVPage(-1)" class="btn-pill-secondary px-4 py-1 text-xs disabled:opacity-40">Oldingi</button>
            <button id="vNextBtn" onclick="changeVPage(1)" class="btn-pill-secondary px-4 py-1 text-xs disabled:opacity-40">Keyingi</button>
          </div>
        </div>
      </section>

      <!-- ============================================================= -->
      <!-- VIEW 3: USERS -->
      <!-- ============================================================= -->
      <section id="view-users" class="hidden space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 card-blueprint p-4 bg-white">
          <div class="flex items-center gap-2">
            <h3 class="text-sm font-semibold text-carbon">Foydalanuvchilar Bazasi</h3>
            <span id="usersTotalBadge" class="tag-pill px-2.5 py-0.5 bg-mist text-graphite text-xs font-medium border border-fog">0 ta</span>
          </div>

          <div class="relative w-full sm:w-80">
            <input
              type="text"
              id="usersSearchInput"
              oninput="debounceSearchUsers()"
              placeholder="Ism, @username yoki Telegram ID..."
              class="w-full pl-9 pr-4 py-2 bg-mist border border-fog rounded-full text-xs text-carbon placeholder-ash focus:outline-none focus:bg-white focus:border-lavender focus:ring-1 focus:ring-lavender transition"
            />
            <span class="absolute left-3.5 top-2.5 text-xs text-ash">🔍</span>
          </div>
        </div>

        <!-- Users Table (DESIGN.md specification: 24px container radius, 1px Fog gridlines, Carbon headers, Graphite body) -->
        <div class="bg-white border border-fog rounded-[24px] overflow-hidden shadow-subtle-2">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-linen text-carbon uppercase tracking-wider text-[10px] border-b border-fog font-semibold">
                <tr>
                  <th class="py-3 px-5 font-semibold">Foydalanuvchi</th>
                  <th class="py-3 px-5 font-semibold">Telegram ID</th>
                  <th class="py-3 px-5 font-semibold">Nishon (Status)</th>
                  <th class="py-3 px-5 font-semibold">Holati</th>
                  <th class="py-3 px-5 font-semibold">Sana</th>
                  <th class="py-3 px-5 font-semibold text-right">Amallar</th>
                </tr>
              </thead>
              <tbody id="usersTableBody" class="divide-y divide-fog text-graphite">
                <!-- User rows inserted here -->
              </tbody>
            </table>
          </div>
        </div>

        <!-- Users Pagination -->
        <div class="flex items-center justify-between py-2 text-xs text-graphite">
          <span id="usersPageInfo">Sahifa 1</span>
          <div class="flex gap-2">
            <button id="usersPrevBtn" onclick="changeUsersPage(-1)" class="btn-pill-secondary px-4 py-1 text-xs disabled:opacity-40">Oldingi</button>
            <button id="usersNextBtn" onclick="changeUsersPage(1)" class="btn-pill-secondary px-4 py-1 text-xs disabled:opacity-40">Keyingi</button>
          </div>
        </div>
      </section>

      <!-- ============================================================= -->
      <!-- VIEW 4: CONVERSATIONS & CHAT -->
      <!-- ============================================================= -->
      <section id="view-conversations" class="hidden space-y-6">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[720px]">
          <!-- Conversations List (4 cols) -->
          <div class="lg:col-span-4 card-blueprint bg-white flex flex-col overflow-hidden">
            <div class="p-4 border-b border-fog flex items-center justify-between">
              <h3 class="text-sm font-semibold text-carbon flex items-center gap-2">
                <span>💬</span>
                <span>Murojaatlar</span>
              </h3>
              <span id="convsCountBadge" class="tag-pill px-2 py-0.5 bg-mist text-graphite text-xs font-semibold">0</span>
            </div>
            <div id="conversationsListContainer" class="flex-1 overflow-y-auto divide-y divide-fog">
              <p class="text-xs text-ash p-4 text-center">Yuklanmoqda...</p>
            </div>
          </div>

          <!-- Chat Detail & Messages (8 cols) -->
          <div class="lg:col-span-8 card-blueprint bg-white flex flex-col overflow-hidden">
            <!-- Chat Header -->
            <div id="chatHeader" class="p-4 border-b border-fog flex items-center justify-between bg-linen">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-white border border-fog flex items-center justify-center text-xs font-bold text-carbon shadow-subtle">
                  👤
                </div>
                <div>
                  <h4 id="chatActiveUser" class="text-xs font-semibold text-carbon">Suhbatni tanlang</h4>
                  <p id="chatActiveMeta" class="text-[11px] text-ash">Yozishmalarni ko‘rish uchun ro‘yxatdan suhbat ustiga bosing</p>
                </div>
              </div>
              <div id="chatHeaderActions" class="hidden">
                <button onclick="closeCurrentConversation()" class="btn-pill-secondary px-3 py-1 text-xs font-medium text-graphite hover:text-ember">
                  Suhbatni yopish
                </button>
              </div>
            </div>

            <!-- Messages Stream -->
            <div id="chatMessagesStream" class="flex-1 p-5 overflow-y-auto space-y-3 bg-linen/50">
              <div class="h-full flex items-center justify-center text-xs text-ash">
                Suhbat tanlanmagan
              </div>
            </div>

            <!-- Reply Box -->
            <form id="chatReplyForm" onsubmit="handleSendOperatorReply(event)" class="p-3.5 border-t border-fog flex gap-2 bg-white">
              <input
                type="text"
                id="chatReplyInput"
                disabled
                placeholder="Foydalanuvchiga operator nomidan javob yozish..."
                class="flex-1 px-4 py-2 bg-mist border border-fog rounded-full text-xs text-carbon placeholder-ash focus:outline-none focus:bg-white focus:border-lavender focus:ring-1 focus:ring-lavender disabled:opacity-40 transition"
              />
              <button
                type="submit"
                id="chatReplyBtn"
                disabled
                class="btn-pill-primary px-5 py-2 disabled:opacity-40 text-xs flex items-center gap-1.5"
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
  <div id="photoModal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-carbon/60 backdrop-blur-sm p-4" onclick="closePhotoModal()">
    <div class="relative max-w-3xl max-h-[90vh] flex flex-col items-center bg-white p-3 rounded-2xl shadow-subtle-3 border border-fog" onclick="event.stopPropagation()">
      <button onclick="closePhotoModal()" class="absolute -top-3 -right-3 text-carbon text-xs font-semibold bg-white border border-fog hover:bg-mist w-7 h-7 rounded-full shadow-subtle flex items-center justify-center transition">
        ✕
      </button>
      <img id="photoModalImg" src="" alt="Isbot skrinshoti" class="max-h-[75vh] max-w-full rounded-xl object-contain" />
      <p class="text-xs text-graphite mt-3">📸 Foydalanuvchi yuborgan skrinshot / isbot rasmi</p>
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
            btn.className = 'px-4 py-1.5 rounded-full text-xs font-medium transition text-white bg-lavender shadow-subtle';
          } else {
            btn.className = 'px-4 py-1.5 rounded-full text-xs font-medium transition text-graphite hover:text-carbon flex items-center gap-1.5';
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
          rVCont.innerHTML = '<p class="text-xs text-ash py-4 text-center">Yangi arizalar mavjud emas</p>';
        }

        // Recent Users
        const rUCont = document.getElementById('dashboardRecentUsers');
        if (data.recentUsers && data.recentUsers.length > 0) {
          rUCont.innerHTML = data.recentUsers.map(u => renderMiniUserRow(u)).join('');
        } else {
          rUCont.innerHTML = '<p class="text-xs text-ash py-4 text-center">Foydalanuvchilar mavjud emas</p>';
        }

      } catch (err) {
        console.error('Failed to load dashboard:', err);
      }
    }

    function renderMiniVerificationRow(req) {
      const userHandle = req.user?.username ? '@' + req.user.username : (req.user?.firstName || 'Foydalanuvchi');
      const time = new Date(req.createdAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
      const statusBadge = req.status === 'APPROVED'
        ? '<span class="tag-pill px-2.5 py-0.5 bg-mint-wash text-mint font-semibold">Tasdiqlangan</span>'
        : req.status === 'REJECTED'
          ? '<span class="tag-pill px-2.5 py-0.5 bg-rose-50 text-ember font-semibold">Rad etilgan</span>'
          : '<span class="tag-pill px-2.5 py-0.5 bg-amber/15 text-amber font-semibold">Kutilmoqda</span>';

      return \`
        <div class="p-3 rounded-xl bg-linen border border-fog flex items-center justify-between gap-3">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-full bg-white border border-fog text-lavender flex items-center justify-center text-xs font-bold shadow-subtle">
              🛡
            </div>
            <div>
              <p class="text-xs font-semibold text-carbon">\${escapeHtml(userHandle)}</p>
              <p class="text-[11px] text-ash">\${time} • ID: \${req.user?.telegramId || ''}</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            \${statusBadge}
            \${req.status === 'PENDING' ? \`
              <button onclick="quickApprove('\${req.id}')" class="btn-pill-primary px-3 py-1 text-[11px]">
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
        <div class="p-3 rounded-xl bg-linen border border-fog flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-full bg-white border border-fog text-graphite flex items-center justify-center text-xs font-bold shadow-subtle">
              👤
            </div>
            <div>
              <p class="text-xs font-semibold text-carbon">\${escapeHtml(name)} \${u.isVerified ? '🛡' : ''}</p>
              <p class="text-[11px] text-ash">\${escapeHtml(handle)}</p>
            </div>
          </div>
          <span class="tag-pill px-2.5 py-0.5 \${u.isBlocked ? 'bg-rose-50 text-ember' : 'bg-mint-wash text-mint'} font-medium">
            \${u.isBlocked ? 'Bloklangan' : 'Faol'}
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
            btn.className = 'v-filter-btn px-4 py-1 rounded-full text-xs font-medium text-white bg-lavender shadow-subtle';
          } else {
            btn.className = 'v-filter-btn px-4 py-1 rounded-full text-xs font-medium text-graphite hover:text-carbon';
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
      container.innerHTML = '<div class="col-span-full py-10 text-center text-xs text-ash">Yuklanmoqda...</div>';

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
          container.innerHTML = '<div class="col-span-full py-12 text-center text-ash text-xs">Hech qanday ariza topilmadi</div>';
        }

        document.getElementById('vPageInfo').textContent = 'Sahifa ' + data.page + ' / ' + (data.totalPages || 1) + ' (Jami: ' + data.total + ')';
        document.getElementById('vPrevBtn').disabled = data.page <= 1;
        document.getElementById('vNextBtn').disabled = data.page >= data.totalPages;

      } catch (err) {
        container.innerHTML = '<div class="col-span-full py-8 text-center text-ember text-xs">Xatolik: Arizalarni yuklab bo‘lmadi</div>';
      }
    }

    function renderVerificationCard(req) {
      const userHandle = req.user?.username ? '@' + req.user.username : 'Username yo‘q';
      const userName = req.user?.firstName || 'Ismsiz';
      const zynygramDisplay = req.zynygramUsername ? '@' + req.zynygramUsername : null;
      const dateStr = new Date(req.createdAt).toLocaleString('uz-UZ');

      let statusBadge = '';
      if (req.status === 'APPROVED') {
        statusBadge = '<span class="tag-pill px-3 py-1 bg-mint-wash text-mint font-semibold border border-mint/20">✅ Tasdiqlangan</span>';
      } else if (req.status === 'REJECTED') {
        statusBadge = '<span class="tag-pill px-3 py-1 bg-rose-50 text-ember font-semibold border border-rose-200">❌ Rad etilgan</span>';
      } else {
        statusBadge = '<span class="tag-pill px-3 py-1 bg-amber/10 text-amber font-semibold border border-amber/20">⏳ Kutilmoqda</span>';
      }

      // Format proof text with clickable links
      let formattedProof = escapeHtml(req.proofText || '(Isbot matni yo‘q)');
      formattedProof = formattedProof.replace(
        /(https?:\\/\\/[^\\s]+)/g,
        '<a href="$1" target="_blank" class="text-sky hover:underline font-medium break-all">$1</a>'
      );

      const hasPhoto = !!req.photoFileId;
      const photoHtml = hasPhoto
        ? \`
          <div class="mt-3">
            <div class="text-[11px] font-medium text-graphite mb-1 flex items-center gap-1">
              <span>📸</span>
              <span>Ilova qilingan skrinshot:</span>
            </div>
            <div onclick="openPhotoModal('/api/admin/photo/\${req.photoFileId}')" class="cursor-pointer overflow-hidden rounded-lg border border-fog bg-mist max-h-48 flex items-center justify-center hover:border-lavender transition">
              <img src="/api/admin/photo/\${req.photoFileId}" alt="Isbot" class="object-cover w-full h-48 hover:scale-[1.02] transition duration-200" />
            </div>
            <p class="text-[10px] text-ash mt-1 text-center">🔎 Kattalashtirib ko‘rish uchun bosing</p>
          </div>
        \`
        : '';

      return \`
        <div class="card-blueprint p-5 bg-white flex flex-col justify-between hover:border-graphite/40 transition">
          <div>
            <!-- Header Row -->
            <div class="flex items-start justify-between gap-3 pb-3 border-b border-fog">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-mist border border-fog flex items-center justify-center text-sm font-semibold text-carbon shadow-subtle">
                  👤
                </div>
                <div>
                  <h4 class="text-sm font-semibold text-carbon">\${escapeHtml(userName)}</h4>
                  <p class="text-xs text-graphite">\${escapeHtml(userHandle)} • ID: \${req.user?.telegramId || ''}</p>
                </div>
              </div>
              \${statusBadge}
            </div>

            <!-- Meta info: Zynygram Profile & Date -->
            <div class="grid grid-cols-2 gap-2 my-3 p-3 rounded-lg bg-linen border border-fog text-xs">
              <div>
                <span class="text-[10px] text-ash block">Zynygram Profili:</span>
                <span class="font-semibold text-lavender">\${zynygramDisplay ? escapeHtml(zynygramDisplay) : '<i class="text-ash font-normal">Belgilanmagan</i>'}</span>
              </div>
              <div>
                <span class="text-[10px] text-ash block">Yuborilgan vaqt:</span>
                <span class="text-carbon font-medium text-[11px]">\${dateStr}</span>
              </div>
            </div>

            <!-- Proof Content -->
            <div class="text-xs text-graphite leading-relaxed bg-mist/60 p-3 rounded-lg border border-fog">
              <p class="text-[10px] font-semibold uppercase text-ash tracking-wider mb-1">Murojaat / Isbot matni:</p>
              <div class="text-carbon">\${formattedProof}</div>
            </div>

            <!-- Screenshot / Photo Preview -->
            \${photoHtml}
          </div>

          <!-- Actions Footer -->
          \${req.status === 'PENDING' ? \`
            <div class="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-fog">
              <button
                onclick="approveVerification('\${req.id}')"
                class="btn-pill-primary py-2 text-xs flex items-center justify-center gap-1.5"
              >
                <span>✅</span>
                <span>Tasdiqlash</span>
              </button>
              <button
                onclick="rejectVerification('\${req.id}')"
                class="btn-pill-secondary py-2 text-xs text-ember hover:bg-rose-50 flex items-center justify-center gap-1.5"
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
      tbody.innerHTML = '<tr><td colspan="6" class="py-8 text-center text-ash">Yuklanmoqda...</td></tr>';

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
          tbody.innerHTML = '<tr><td colspan="6" class="py-8 text-center text-ash">Foydalanuvchilar topilmadi</td></tr>';
        }
      } catch (err) {
        tbody.innerHTML = '<tr><td colspan="6" class="py-8 text-center text-ember">Xatolik yuz berdi</td></tr>';
      }
    }

    function renderUserTableRow(u) {
      const name = u.firstName || 'Ismsiz';
      const handle = u.username ? '@' + u.username : '-';
      const date = new Date(u.createdAt).toLocaleDateString('uz-UZ');

      return \`
        <tr class="hover:bg-linen transition">
          <td class="py-3 px-5">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-full bg-mist border border-fog flex items-center justify-center text-xs font-semibold text-carbon">
                👤
              </div>
              <div>
                <p class="font-semibold text-carbon">\${escapeHtml(name)}</p>
                <p class="text-[11px] text-ash">\${escapeHtml(handle)}</p>
              </div>
            </div>
          </td>
          <td class="py-3 px-5 font-mono text-[11px] text-graphite">\${u.telegramId}</td>
          <td class="py-3 px-5">
            \${u.isVerified
              ? '<span class="tag-pill px-2.5 py-0.5 bg-mint-wash text-mint border border-mint/20 font-semibold">🛡 Tasdiqlangan</span>'
              : '<span class="tag-pill px-2.5 py-0.5 bg-mist text-ash border border-fog font-medium">Oddiy</span>'
            }
          </td>
          <td class="py-3 px-5">
            \${u.isBlocked
              ? '<span class="tag-pill px-2.5 py-0.5 bg-rose-50 text-ember border border-rose-200 font-semibold">🚫 Bloklangan</span>'
              : '<span class="tag-pill px-2.5 py-0.5 bg-mint-wash text-mint font-medium">Faol</span>'
            }
          </td>
          <td class="py-3 px-5 text-ash text-[11px]">\${date}</td>
          <td class="py-3 px-5 text-right">
            <div class="flex items-center justify-end gap-1.5">
              <button
                onclick="toggleUserVerify('\${u.telegramId}', \${!u.isVerified})"
                title="\${u.isVerified ? 'Nishonni bekor qilish' : 'Nishon berish'}"
                class="btn-pill-secondary px-3 py-1 text-[11px] \${u.isVerified ? 'text-graphite' : 'text-lavender border-lavender/30'}"
              >
                \${u.isVerified ? 'Olish' : '🛡 Nishon'}
              </button>
              <button
                onclick="toggleUserBlock('\${u.telegramId}', \${!u.isBlocked})"
                title="\${u.isBlocked ? 'Blokdan chiqarish' : 'Bloklash'}"
                class="btn-pill-secondary px-3 py-1 text-[11px] \${u.isBlocked ? 'text-mint' : 'text-ember'}"
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
      container.innerHTML = '<p class="text-xs text-ash p-4 text-center">Yuklanmoqda...</p>';

      try {
        const res = await apiFetch('/api/admin/conversations?limit=30');
        const data = await res.json();

        document.getElementById('convsCountBadge').textContent = data.total || 0;

        if (data.conversations && data.conversations.length > 0) {
          container.innerHTML = data.conversations.map(c => renderConversationItem(c)).join('');
        } else {
          container.innerHTML = '<p class="text-xs text-ash p-4 text-center">Suhbatlar mavjud emas</p>';
        }
      } catch (err) {
        container.innerHTML = '<p class="text-xs text-ember p-4 text-center">Yuklashda xatolik</p>';
      }
    }

    function renderConversationItem(c) {
      const name = c.user?.firstName || c.user?.username || 'Foydalanuvchi';
      const lastText = c.lastMessage?.content || '(Xabarlar yo‘q)';
      const isSelected = c.id === activeConversationId;
      const statusBadge = c.status === 'WAITING_HUMAN'
        ? '<span class="tag-pill px-2 py-0.5 bg-amber/15 text-amber text-[10px] font-semibold">Operator</span>'
        : c.status === 'CLOSED'
          ? '<span class="tag-pill px-2 py-0.5 bg-mist text-ash text-[10px]">Yopilgan</span>'
          : '<span class="tag-pill px-2 py-0.5 bg-lavender/15 text-lavender text-[10px]">AI</span>';

      return \`
        <div onclick="selectConversation('\${c.id}', '\${escapeHtml(name)}', '\${c.user?.telegramId || ''}', '\${c.status}')" class="p-3.5 cursor-pointer transition \${isSelected ? 'bg-mist border-l-4 border-l-lavender' : 'hover:bg-linen'}">
          <div class="flex items-center justify-between gap-2 mb-1">
            <h5 class="text-xs font-semibold text-carbon truncate">\${escapeHtml(name)}</h5>
            \${statusBadge}
          </div>
          <p class="text-[11px] text-graphite truncate">\${escapeHtml(lastText)}</p>
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

      loadConversations();
      loadChatMessages(id);
    }

    async function loadChatMessages(id) {
      const stream = document.getElementById('chatMessagesStream');
      stream.innerHTML = '<div class="h-full flex items-center justify-center text-xs text-ash">Xabarlar yuklanmoqda...</div>';

      try {
        const res = await apiFetch('/api/admin/conversations/' + id + '/messages');
        const messages = await res.json();

        if (messages && messages.length > 0) {
          stream.innerHTML = messages.map(m => {
            const isUser = m.role === 'USER';
            const time = new Date(m.createdAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
            return \`
              <div class="flex flex-col \${isUser ? 'items-start' : 'items-end'}">
                <div class="max-w-[75%] p-3.5 rounded-2xl text-xs leading-relaxed \${isUser ? 'bg-white border border-fog text-carbon rounded-bl-none shadow-subtle' : 'bg-lavender text-white rounded-br-none shadow-subtle'}">
                  <div class="text-[10px] font-semibold opacity-75 mb-1">\${isUser ? '👤 Mijoz' : (m.role === 'ADMIN' ? '👨‍💻 Operator' : '🤖 AI Assistant')}</div>
                  <div class="whitespace-pre-wrap">\${escapeHtml(m.content)}</div>
                  <div class="text-[9px] opacity-65 text-right mt-1">\${time}</div>
                </div>
              </div>
            \`;
          }).join('');
          stream.scrollTop = stream.scrollHeight;
        } else {
          stream.innerHTML = '<div class="h-full flex items-center justify-center text-xs text-ash">Xabarlar mavjud emas</div>';
        }
      } catch (err) {
        stream.innerHTML = '<div class="h-full flex items-center justify-center text-xs text-ember">Xabarlarni yuklab bo‘lmadi</div>';
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
    // TOAST NOTIFICATIONS (DESIGN.md White Card Minimalist Style)
    // =============================================================
    function showToast(message, type = 'info') {
      const container = document.getElementById('toastContainer');
      const toast = document.createElement('div');

      const icon = type === 'success' ? '✅' : (type === 'error' ? '⚠️' : 'ℹ️');
      const borderAccent = type === 'success' ? 'border-l-mint' : (type === 'error' ? 'border-l-ember' : 'border-l-lavender');

      toast.className = 'card-blueprint pointer-events-auto p-3.5 border-l-4 shadow-subtle-3 text-xs flex items-center gap-2.5 transform transition-all duration-300 translate-y-2 opacity-0 bg-white ' + borderAccent;
      toast.innerHTML = '<span class="text-sm">' + icon + '</span><span class="flex-1 font-medium text-carbon">' + escapeHtml(message) + '</span>';

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
