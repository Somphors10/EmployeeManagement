import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function Forbidden() {
  const { user } = useAuth();

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h2>Access denied</h2>
          <p className="page-copy">
            You are signed in{user?.role ? ` as ${user.role}` : ''}, but this page needs a permission you do not have.
          </p>
        </div>
        <Link to="/" className="button-primary">
          Back to dashboard
        </Link>
      </header>
    </section>
  );
}
