// src/routes/AdminRoute.jsx (provável implementação)
import { Navigate, useLocation } from 'react-router-dom';
import { authService } from '../services/api';

function AdminRoute({ children }) {
    const location = useLocation();
    const isAuthenticated = authService.isAuthenticated(); // Esta linha também precisa funcionar
    const userInfo = authService.getUserInfo();
    const isAdmin = userInfo && userInfo.roles &&
        (userInfo.roles.includes('ROLE_ADMIN') ||
            userInfo.roles.includes('ADMIN'));

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (!isAdmin) {
        return <Navigate to="/" replace />;
    }

    return children;
}

export default AdminRoute;