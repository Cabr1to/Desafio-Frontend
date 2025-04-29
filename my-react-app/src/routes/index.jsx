import {createBrowserRouter, RouterProvider, useNavigate} from 'react-router-dom';
import App from '../App';
import ClientList from '../modules/client/pages/ClientList.jsx';
import ClientForm from '../modules/client/pages/ClientForm.jsx';
import ClientDetails from '../modules/client/pages/ClientDetails.jsx';
import Login from '../modules/auth/Login.jsx';
import NotFound from '../modules/error/NotFound.jsx';
import ProtectedRoute from './ProtectedRoute';

// Componente de layout principal (opcional)
import Layout from '../components/Layout';

const router = createBrowserRouter([
    {
        path: '/',
        element: <Layout />,
        errorElement: <NotFound />,
        children: [
            { index: true, element: <App /> },
            { path: 'login', element: <Login /> },
            {
                path: 'clients',
                element: <ProtectedRoute><ClientList /></ProtectedRoute>
            },
            {
                path: 'clients/new',
                element: <ProtectedRoute><ClientForm /></ProtectedRoute>
            },
            {
                path: 'clients/:id',
                element: <ProtectedRoute><ClientDetails /></ProtectedRoute>
            },
            {
                path: 'clients/:id/edit',
                element: <ProtectedRoute><ClientForm /></ProtectedRoute>
            },
        ],
    },
]);

