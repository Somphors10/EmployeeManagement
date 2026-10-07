export const Permission = {
  DASHBOARD_VIEW: 'dashboard:view',
  EMPLOYEES_VIEW: 'employees:view',
  EMPLOYEES_WRITE: 'employees:write',
  LEAVES_VIEW: 'leaves:view',
  LEAVES_CREATE: 'leaves:create',
  LEAVES_DECIDE: 'leaves:decide',
  ATTENDANCE_VIEW: 'attendance:view',
  ATTENDANCE_CHECK: 'attendance:check',
  PAYROLL_VIEW: 'payroll:view',
  PAYROLL_WRITE: 'payroll:write',
  DOCUMENTS_VIEW: 'documents:view',
  DOCUMENTS_WRITE: 'documents:write',
  PERFORMANCE_VIEW: 'performance:view',
  PERFORMANCE_WRITE: 'performance:write',
  ORGANIZATION_VIEW: 'organization:view',
  ORGANIZATION_WRITE: 'organization:write',
  ANNOUNCEMENTS_VIEW: 'announcements:view',
  ANNOUNCEMENTS_WRITE: 'announcements:write',
  SETTINGS_VIEW: 'settings:view',
  SETTINGS_WRITE: 'settings:write',
};

export const NAV = [
  { key: 'dashboard', label: 'Dashboard', path: '/', permission: Permission.DASHBOARD_VIEW },
  { key: 'employees', label: 'Employees', path: '/employees', permission: Permission.EMPLOYEES_VIEW },
  { key: 'leaves', label: 'Leaves', path: '/leaves', permission: Permission.LEAVES_VIEW },
  { key: 'attendance', label: 'Attendance', path: '/attendance', permission: Permission.ATTENDANCE_VIEW },
  { key: 'payroll', label: 'Payroll', path: '/payroll', permission: Permission.PAYROLL_VIEW },
  { key: 'documents', label: 'Documents', path: '/documents', permission: Permission.DOCUMENTS_VIEW },
  { key: 'performance', label: 'Performance', path: '/performance', permission: Permission.PERFORMANCE_VIEW },
  { key: 'organization', label: 'Organization', path: '/organization', permission: Permission.ORGANIZATION_VIEW },
  { key: 'announcements', label: 'Announcements', path: '/announcements', permission: Permission.ANNOUNCEMENTS_VIEW },
  { key: 'settings', label: 'Settings', path: '/settings', permission: Permission.SETTINGS_VIEW },
];

export const NAV_PERMISSION = Object.fromEntries(NAV.map((item) => [item.key, item.permission]));

const EMPLOYEE = [
  Permission.DASHBOARD_VIEW,
  Permission.EMPLOYEES_VIEW,
  Permission.LEAVES_VIEW,
  Permission.LEAVES_CREATE,
  Permission.ATTENDANCE_VIEW,
  Permission.ATTENDANCE_CHECK,
  Permission.DOCUMENTS_VIEW,
  Permission.PERFORMANCE_VIEW,
  Permission.ORGANIZATION_VIEW,
  Permission.ANNOUNCEMENTS_VIEW,
];

const MANAGER = [...EMPLOYEE, Permission.LEAVES_DECIDE, Permission.PERFORMANCE_WRITE];

const HR = [
  ...MANAGER,
  Permission.EMPLOYEES_WRITE,
  Permission.PAYROLL_VIEW,
  Permission.PAYROLL_WRITE,
  Permission.DOCUMENTS_WRITE,
  Permission.ORGANIZATION_WRITE,
  Permission.ANNOUNCEMENTS_WRITE,
  Permission.SETTINGS_VIEW,
];

const ADMIN = [...HR, Permission.SETTINGS_WRITE];

const ROLE_PERMISSIONS = { ADMIN, HR, MANAGER, EMPLOYEE };

export function permissionsForRole(role) {
  return ROLE_PERMISSIONS[role] || [];
}

export function can(user, permission) {
  if (!user || !permission) return false;
  if (Array.isArray(user.permissions)) {
    return user.permissions.includes(permission);
  }
  return permissionsForRole(user.role).includes(permission);
}
