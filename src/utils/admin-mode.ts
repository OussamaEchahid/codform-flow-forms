export const ADMIN_BYPASS_STORAGE_KEY = 'admin_bypass';
export const ADMIN_BYPASS_SHOP_ID = 'admin-bypass';

export const isAdminBypassEnabled = () => {
  if (typeof window === 'undefined') return false;

  try {
    return window.localStorage.getItem(ADMIN_BYPASS_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
};

export const getAdminBypassShopId = () =>
  isAdminBypassEnabled() ? ADMIN_BYPASS_SHOP_ID : null;