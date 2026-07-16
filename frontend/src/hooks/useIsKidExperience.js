import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';

export function useIsKidExperience() {
  const { user } = useAuth();
  const location = useLocation();
  const isKidRole = user?.role === 'kid';
  const isKidsRoute = location.pathname.startsWith('/kids');
  return isKidRole || isKidsRoute;
}

export default useIsKidExperience;
