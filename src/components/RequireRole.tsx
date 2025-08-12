import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface MeResponse { user?: { role?: string } }

interface Props {
  allow: 'clinician' | 'hospital';
  children: React.ReactElement;
}

const RequireRole: React.FC<Props> = ({ allow, children }) => {
  const [status, setStatus] = useState<'loading' | 'ok' | 'redirect'>('loading');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;
    fetch('http://localhost:5001/auth/me', { credentials: 'include' })
      .then(async r => {
        if (r.status === 401) return { user: undefined } as MeResponse;
        return r.json();
      })
      .then(data => {
        if (cancelled) return;
        if (!data.user) {
          navigate('/login', { replace: true, state: { from: location.pathname } });
          setStatus('redirect');
          return;
        }
        if (data.user.role !== allow) {
          const target = data.user.role === 'hospital' ? '/hospital/dashboard' : '/triage';
          if (location.pathname !== target) {
            navigate(target, { replace: true });
            setStatus('redirect');
            return;
          }
        }
        setStatus('ok');
      })
      .catch(() => {
        if (cancelled) return;
        navigate('/login', { replace: true });
        setStatus('redirect');
      });
    return () => { cancelled = true; };
  }, [allow, navigate, location.pathname]);

  if (status === 'loading') {
    return <div className="flex items-center justify-center min-h-screen text-gray-600">Checking access...</div>;
  }
  if (status === 'ok') return children;
  return null;
};

export default RequireRole;
