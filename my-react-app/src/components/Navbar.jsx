// components/Navbar.jsx
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/api';

function NavigationBar() {
    const navigate = useNavigate();
    const userInfo = authService.getUserInfo();

    // Extrair o nome de usuário de forma segura
    const username = userInfo?.sub || userInfo?.username || 'Usuário';

    // Verificar se o usuário tem papel de ADMIN
    const isAdmin = userInfo && userInfo.roles &&
        (userInfo.roles.includes('ROLE_ADMIN') ||
            userInfo.roles.includes('ADMIN'));

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    return (
        <Navbar bg="primary" variant="dark" expand="lg">
            <Container>
                <Navbar.Brand as={Link} to="/">Sistema de Clientes</Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto">
                        <Nav.Link as={Link} to="/">Clientes</Nav.Link>
                        <Nav.Link as={Link} to="/clients/new">Novo Cliente</Nav.Link>
                    </Nav>
                    <Nav>
                        <div className="d-flex align-items-center">
                            {/* Certifique-se de que username é uma string */}
                            <span className="text-light me-3">
                                Olá, {typeof username === 'string' ? username : 'Usuário'}
                            </span>
                            <Button
                                variant="outline-light"
                                onClick={handleLogout}
                            >
                                Sair
                            </Button>
                        </div>
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
}

export default NavigationBar;