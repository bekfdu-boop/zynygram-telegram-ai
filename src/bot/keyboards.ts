import { Markup } from 'telegraf';

export const USER_MENU_BUTTONS = {
  VERIFY: '🛡 Tasdiqlash nishonini olish',
  FEEDBACK: '✍️ Taklif yoki muammo bildirish',
  OPERATOR: '👤 Operatorga ulanish',
  ABOUT: 'ℹ️ Zynygram haqida',
} as const;

export const ADMIN_MENU_BUTTONS = {
  STATS: '📊 Umumiy hisobot',
  VERIFICATION_STATS: '🛡 Verifikatsiya statistikasi',
  PENDING_VERIFICATIONS: '⏳ Kutilayotgan arizalar',
  INQUIRIES: '📩 Taklif va muammolar',
  USERS: '👥 Foydalanuvchilar',
  REFRESH: '🔄 Menyuni yangilash',
} as const;

/**
 * Returns the persistent reply keyboard for regular users
 */
export function getUserMainMenu() {
  return Markup.keyboard([
    [USER_MENU_BUTTONS.VERIFY],
    [USER_MENU_BUTTONS.FEEDBACK, USER_MENU_BUTTONS.OPERATOR],
    [USER_MENU_BUTTONS.ABOUT],
  ])
    .resize()
    .persistent();
}

/**
 * Returns the persistent reply keyboard for administrators (ID: 8191294446)
 */
export function getAdminMainMenu() {
  return Markup.keyboard([
    [ADMIN_MENU_BUTTONS.STATS, ADMIN_MENU_BUTTONS.VERIFICATION_STATS],
    [ADMIN_MENU_BUTTONS.PENDING_VERIFICATIONS, ADMIN_MENU_BUTTONS.INQUIRIES],
    [ADMIN_MENU_BUTTONS.USERS, ADMIN_MENU_BUTTONS.REFRESH],
  ])
    .resize()
    .persistent();
}

