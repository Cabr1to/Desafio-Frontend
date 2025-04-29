// src/modules/auth/pages/Login.jsx
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Form, Button, Card, Alert, Spinner, Container, Row, Col } from 'react-bootstrap';
import { authService } from '../../services/api.js';

function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || '/';

    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [validated, setValidated] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleLogin = async () => {
        // Validar formulário manualmente
        const form = document.getElementById('loginForm');
        if (!form.checkValidity()) {
            setValidated(true);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            console.log("Tentando login com credenciais:", formData);

            const result = await authService.login(formData);
            console.log("Resultado do login:", result);

            if (result.success) {
                console.log("Login bem-sucedido, token:", localStorage.getItem('token'));
                console.log("Redirecionando para:", from);
                navigate(from, { replace: true });
            } else {
                console.error("Falha no login:", result.message);
                setError(result.message);
            }
        } catch (err) {
            console.error("Erro não tratado no login:", err);
            setError("Ocorreu um erro inesperado. Tente novamente mais tarde.");
        } finally {
            setLoading(false);
        }
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleLogin();
        return false;
    };

    return (
        <div className="login-container">
            <Container>
                <Row className="justify-content-center">
                    <Col md={6} lg={5} xl={4}>
                        <Card className="login-card">
                            <Card.Body>
                                <div className="text-center mb-4">
                                    <h2>Login</h2>
                                    <p className="text-muted">Acesse o sistema de gerenciamento de clientes</p>
                                </div>

                                {error && <Alert variant="danger">{error}</Alert>}

                                <Form
                                    id="loginForm"
                                    noValidate
                                    validated={validated}
                                    onSubmit={handleFormSubmit}
                                >
                                    <Form.Group className="mb-3" controlId="username">
                                        <Form.Label>Usuário</Form.Label>
                                        <Form.Control
                                            required
                                            type="text"
                                            name="username"
                                            value={formData.username}
                                            onChange={handleChange}
                                            placeholder="Nome de usuário"
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            Por favor, informe seu nome de usuário.
                                        </Form.Control.Feedback>
                                    </Form.Group>

                                    <Form.Group className="mb-3" controlId="password">
                                        <Form.Label>Senha</Form.Label>
                                        <Form.Control
                                            required
                                            type="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            placeholder="Sua senha"
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            Por favor, informe sua senha.
                                        </Form.Control.Feedback>
                                    </Form.Group>

                                    <div className="d-grid gap-2 mt-4">
                                        <Button
                                            variant="primary"
                                            onClick={handleLogin}
                                            disabled={loading}
                                            type="button"
                                        >
                                            {loading ? (
                                                <>
                                                    <Spinner
                                                        as="span"
                                                        animation="border"
                                                        size="sm"
                                                        role="status"
                                                        aria-hidden="true"
                                                        className="me-2"
                                                    />
                                                    Entrando...
                                                </>
                                            ) : (
                                                'Entrar'
                                            )}
                                        </Button>
                                    </div>
                                </Form>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </div>
    );
}

export default Login;