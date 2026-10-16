import { useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { prettyEnum } from '../utils/format';
import { IconChevron } from './Icons';

function formatRole(role) {
  if (!role) return 'User';
  if (role === 'HR' || role === 'ADMIN') return role;
  return prettyEnum(role);
}

export default function AccountMenu({ user, onLogout }) {
  const wrapRef = useRef(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onDoc(event) {
      if (!wrapRef.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  return (
    <div className="account-menu" ref={wrapRef}>
      <button type="button" className="topbar-profile" onClick={() => setOpen((current) => !current)}>
        <span className="sidebar-avatar">{(user?.username || 'U').slice(0, 1).toUpperCase()}</span>
        <span className="sidebar-user-copy">
          <strong>{user?.username}</strong>
          <em>{formatRole(user?.role)}</em>
        </span>
        <span className={`account-caret ${open ? 'is-open' : ''}`}>
          <IconChevron />
        </span>
      </button>
      {open && (
        <div className="account-panel">
          <NavLink to="/profile" onClick={() => setOpen(false)}>
            My profile
          </NavLink>
          <NavLink to="/notifications" onClick={() => setOpen(false)}>
            Notifications
          </NavLink>
          <button type="button" onClick={() => { setOpen(false); onLogout(); }}>
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
