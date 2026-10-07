export function applyWorkspaceSettings(settings = []) {
  const map = Object.fromEntries(settings.map((item) => [item.key, item.value]));
  const root = document.documentElement;

  if (map['theme.primary']) {
    root.style.setProperty('--accent', map['theme.primary']);
  } else {
    root.style.removeProperty('--accent');
  }

  if (map['theme.primary-light']) {
    root.style.setProperty('--accent-soft', map['theme.primary-light']);
  } else {
    root.style.removeProperty('--accent-soft');
  }

  return {
    companyName: map['company.name'] || 'Employee Hub',
    themeMode: map['theme.mode'] || 'light',
  };
}

export function clearWorkspaceSettings() {
  const root = document.documentElement;
  root.style.removeProperty('--accent');
  root.style.removeProperty('--accent-soft');
}
