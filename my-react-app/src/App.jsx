import {Routes, Route, Navigate, useNavigate, useLocation} from 'react-router-dom';
import { Container } from 'react-bootstrap';
import './App.css';
import ClientList from './modules/client/pages/ClientList.jsx';
import ClientForm from './modules/client/pages/ClientForm.jsx';
import Login from "./modules/auth/Login.jsx";
import NavigationBar from "./components/Navbar.jsx";
import PrivateRoute from "./routes/PrivateRoute.jsx";

import NotFound from "./modules/error/NotFound.jsx";
import { authService } from './services/api.js';
import AdminRoute from "./routes/AdminRoute.jsx";
import {useEffect} from "react"; // Importando o serviço de autenticação

function App() {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // Verificar se a sessão expirou e se não estamos já na página de login
        const sessionExpired = authService.checkSessionExpired();
        if (sessionExpired && !location.pathname.includes('/login')) {
            // Limpar flag
            authService.clearSessionExpiredFlag();
            // Mostrar alerta
            alert('Sua sessão expirou. Por favor, faça login novamente.');
            // Redirecionar para login
            navigate('/login', { state: { from: location.pathname } });
        }
    }, [navigate, location]);

    window.addEventListener('error', (event) => {
        if (event.error && event.error.message && event.error.message.includes('Objects are not valid as a React child')) {
            console.error('ERRO DE RENDERIZAÇÃO DE OBJETO:', event.error);
            console.error('Stack trace:', event.error.stack);

            // Tentar identificar o objeto problemático
            const match = event.error.message.match(/found: (.*?)$$/);
            if (match) {
                console.error('Objeto problemático:', match[1]);
            }
        }
    });


    // Verificar se o usuário está autenticado
    const isAuthenticated = authService.isAuthenticated();

    // Obter informações do usuário, incluindo o papel (role)
    const userInfo = authService.getUserInfo();

    return (
        <div className="App">
            {/* Navbar só aparece se o usuário estiver autenticado */}
            {isAuthenticated && <NavigationBar />}

            <Container className={isAuthenticated ? "mt-4" : ""}>
                <Routes>
                    {/* Rota pública para login - redireciona para home se já estiver autenticado */}
                    <Route
                        path="/login"
                        element={
                            isAuthenticated
                                ? <Navigate to="/" replace />
                                : <Login />
                        }
                    />

                    {/* Rota principal - lista de clientes (acessível para USER e ADMIN) */}
                    <Route
                        path="/"
                        element={
                            <PrivateRoute>
                                <ClientList />
                            </PrivateRoute>
                        }
                    />

                    {/* Rota para criar novo cliente (acessível para USER e ADMIN) */}
                    <Route
                        path="/clients/new"
                        element={
                            <PrivateRoute>
                                <ClientForm />
                            </PrivateRoute>
                        }
                    />

                    {/* Rota para editar cliente (acessível apenas para ADMIN) */}
                    <Route
                        path="/clients/edit/:id"
                        element={
                            <AdminRoute>
                                <ClientForm />
                            </AdminRoute>
                        }
                    />

                    {/* Rota para visualizar detalhes do cliente (acessível para USER e ADMIN) */}
                    <Route
                        path="/clients/:id"
                        element={
                            <PrivateRoute>
                                <ClientForm readOnly={true} />
                            </PrivateRoute>
                        }
                    />

                    {/* Rota para páginas não encontradas */}
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </Container>
        </div>
    );
}

export default App;