// src/routes/PrivateRoute.jsx
import { Navigate, useLocation } from 'react-router-dom';
import { authService } from '../services/api';

function PrivateRoute({ children }) {
    const location = useLocation();
    const isAuthenticated = authService.isAuthenticated();

    if (!isAuthenticated) {
        // Redirecionar para a página de login, mas salvar a localização atual
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
}

export default PrivateRoute;