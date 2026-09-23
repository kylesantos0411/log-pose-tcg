'use client';

export interface StoredAccount {
  id: string;
  username: string;
  tag: string; // e.g. "PIRATE-LUFFY-1234"
  email: string;
  password: string; // Plain/hashed client password for device authentication
  avatar: string;
  crew: string;
  rank: string;
  rankBadge: string;
  createdAt: string;
  lastLoginAt: string;
}

export interface UserSession {
  id: string;
  name: string;
  tag: string;
  email?: string;
  avatar: string;
  crew: string;
  rank: string;
  rankBadge: string;
  createdAt?: string;
}

const ACCOUNTS_STORAGE_KEY = 'logpose_registered_accounts';
const SESSION_STORAGE_KEY = 'logpose_user_session';

/**
 * Get all accounts registered on this device/browser
 */
export function getStoredAccounts(): StoredAccount[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to parse stored accounts:', e);
    return [];
  }
}

/**
 * Save accounts array to storage
 */
export function saveStoredAccounts(accounts: StoredAccount[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  } catch (e) {
    console.error('Failed to save stored accounts:', e);
  }
}

/**
 * Find an account by username, email, or tag (case-insensitive)
 */
export function findAccountByIdentifier(identifier: string): StoredAccount | null {
  if (!identifier) return null;
  const clean = identifier.trim().toLowerCase();
  const accounts = getStoredAccounts();

  return (
    accounts.find((acc) => {
      const matchUsername = acc.username.toLowerCase() === clean;
      const matchEmail = acc.email && acc.email.toLowerCase() === clean;
      const matchTag = acc.tag.toLowerCase() === clean;
      const matchTagWithoutPrefix = acc.tag.toLowerCase().replace(/^pirate-/, '') === clean.replace(/^pirate-/, '');
      return matchUsername || matchEmail || matchTag || matchTagWithoutPrefix;
    }) || null
  );
}

/**
 * Register a new user account with unique validation
 */
export function registerAccount(data: {
  username: string;
  email: string;
  password: string;
  avatar?: string;
  crew?: string;
  customTag?: string;
}): { success: boolean; user?: UserSession; error?: string } {
  const username = data.username.trim();
  const email = data.email.trim();
  const password = data.password.trim();

  // Basic validations
  if (!username || username.length < 2) {
    return { success: false, error: 'Username must be at least 2 characters long.' };
  }
  if (!email || !email.includes('@')) {
    return { success: false, error: 'Please enter a valid email address.' };
  }
  if (!password || password.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters long.' };
  }

  const existingAccounts = getStoredAccounts();

  // Check unique username
  if (existingAccounts.some((a) => a.username.toLowerCase() === username.toLowerCase())) {
    return { success: false, error: `Username "${username}" is already registered. Please choose another or sign in.` };
  }

  // Check unique email
  if (existingAccounts.some((a) => a.email.toLowerCase() === email.toLowerCase())) {
    return { success: false, error: `Email "${email}" is already registered. Please sign in instead.` };
  }

  // Generate unique collector tag
  let cleanName = username.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'CAPTAIN';
  let tag = data.customTag ? data.customTag.toUpperCase() : `PIRATE-${cleanName}-${Math.floor(1000 + Math.random() * 9000)}`;

  // Ensure tag is strictly unique
  while (existingAccounts.some((a) => a.tag.toUpperCase() === tag)) {
    tag = `PIRATE-${cleanName}-${Math.floor(1000 + Math.random() * 9000)}`;
  }

  const now = new Date().toISOString();
  const newAccount: StoredAccount = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    username,
    tag,
    email,
    password,
    avatar: data.avatar || '👒',
    crew: data.crew || 'Straw Hat Pirates',
    rank: 'Supernova Collector',
    rankBadge: '🏴‍☠️',
    createdAt: now,
    lastLoginAt: now,
  };

  const updatedAccounts = [...existingAccounts, newAccount];
  saveStoredAccounts(updatedAccounts);

  const sessionUser: UserSession = {
    id: newAccount.id,
    name: newAccount.username,
    tag: newAccount.tag,
    email: newAccount.email,
    avatar: newAccount.avatar,
    crew: newAccount.crew,
    rank: newAccount.rank,
    rankBadge: newAccount.rankBadge,
    createdAt: newAccount.createdAt,
  };

  setActiveSession(sessionUser);
  return { success: true, user: sessionUser };
}

/**
 * Authenticate credentials against stored accounts
 */
export function authenticateAccount(
  identifier: string,
  password: string
): { success: boolean; user?: UserSession; error?: string } {
  if (!identifier || !identifier.trim()) {
    return { success: false, error: 'Please enter your username, email, or Collector Tag.' };
  }
  if (!password) {
    return { success: false, error: 'Please enter your password.' };
  }

  const account = findAccountByIdentifier(identifier);
  if (!account) {
    return {
      success: false,
      error: 'No account found matching this username, email, or Collector Tag. Please check your spelling or register.',
    };
  }

  if (account.password !== password.trim()) {
    return {
      success: false,
      error: 'Incorrect password. Please try again.',
    };
  }

  // Update last login
  account.lastLoginAt = new Date().toISOString();
  const all = getStoredAccounts().map((a) => (a.id === account.id ? account : a));
  saveStoredAccounts(all);

  const sessionUser: UserSession = {
    id: account.id,
    name: account.username,
    tag: account.tag,
    email: account.email,
    avatar: account.avatar,
    crew: account.crew,
    rank: account.rank,
    rankBadge: account.rankBadge,
    createdAt: account.createdAt,
  };

  setActiveSession(sessionUser);
  return { success: true, user: sessionUser };
}

/**
 * Get the currently logged-in user session
 */
export function getActiveSession(): UserSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Set active user session
 */
export function setActiveSession(user: UserSession | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (user) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
    window.dispatchEvent(new Event('logpose_auth_changed'));
    window.dispatchEvent(new Event('logpose_collection_updated'));
  } catch (e) {
    console.error('Failed to set active session:', e);
  }
}

/**
 * Delete account and associated data
 */
export function deleteStoredAccount(idOrTag: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const accounts = getStoredAccounts();
    const target = accounts.find((a) => a.id === idOrTag || a.tag === idOrTag);
    if (!target) return false;

    const remaining = accounts.filter((a) => a.id !== target.id);
    saveStoredAccounts(remaining);

    // Delete user binder
    localStorage.removeItem(`logpose_binder_${target.tag.toUpperCase()}`);

    // If currently logged into this account, logout
    const current = getActiveSession();
    if (current && (current.id === target.id || current.tag === target.tag)) {
      setActiveSession(null);
    }
    return true;
  } catch (e) {
    console.error('Failed to delete account:', e);
    return false;
  }
}

/**
 * Update or cache a server session user into local stored accounts list
 */
export function saveStoredAccountFromSession(sessionUser: UserSession): void {
  if (typeof window === 'undefined') return;
  try {
    const accounts = getStoredAccounts();
    const index = accounts.findIndex((a) => a.id === sessionUser.id || a.tag === sessionUser.tag);
    const updated: StoredAccount = {
      id: sessionUser.id,
      username: sessionUser.name,
      tag: sessionUser.tag,
      email: sessionUser.email || '',
      password: '',
      avatar: sessionUser.avatar,
      crew: sessionUser.crew,
      rank: sessionUser.rank,
      rankBadge: sessionUser.rankBadge,
      createdAt: sessionUser.createdAt || new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
    if (index >= 0) {
      accounts[index] = { ...accounts[index], ...updated };
    } else {
      accounts.push(updated);
    }
    saveStoredAccounts(accounts);
  } catch (e) {
    console.error('Failed to sync stored account from session:', e);
  }
}

/**
 * Update password for a stored account
 */
export function updateStoredAccountPassword(emailOrTag: string, newPassword: string): void {
  if (typeof window === 'undefined') return;
  try {
    const clean = emailOrTag.trim().toLowerCase();
    const accounts = getStoredAccounts();
    const target = accounts.find((a) => a.email.toLowerCase() === clean || a.tag.toLowerCase() === clean);
    if (target) {
      target.password = newPassword.trim();
      saveStoredAccounts(accounts);
    }
  } catch (e) {
    console.error('Failed to update stored account password:', e);
  }
}


