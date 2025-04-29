// src/components/ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router-dom';
import { authService } from '../services/api';

function ProtectedRoute({ children }) {
    const location = useLocation();
    const isAuthenticated = authService.isAuthenticated();

    if (!isAuthenticated) {
        // Redirecionar para a página de login, mas salvar a localização atual
        // para que possamos voltar para ela após o login bem-sucedido
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
}

export default ProtectedRoute;