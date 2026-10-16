import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function Forbidden() {
  const { user } = useAuth();

  return (
    <section className="page">
      <div className="empty-state">
        <h3>Access denied</h3>
        <p>
          You are signed in{user?.role ? ` as ${user.role}` : ''}, but this page needs a permission you do not have.
        </p>
        <div className="form-actions">
          <Link to="/" className="button-primary">
            Back to dashboard
          </Link>
        </div>
      </div>
    </section>
  );
}
