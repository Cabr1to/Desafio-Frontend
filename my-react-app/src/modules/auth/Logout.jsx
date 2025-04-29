// src/components/Logout.jsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {authService} from "../../services/api.js";


function Logout() {
    const navigate = useNavigate();

    useEffect(() => {
        authService.logout();
        navigate('/login', { replace: true });
    }, [navigate]);

    return <div>Saindo...</div>;
}

export default Logout;