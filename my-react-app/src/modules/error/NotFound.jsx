// components/NotFound.jsx
import { Container, Row, Col, Button } from 'react-bootstrap'
import { Link } from 'react-router-dom'

function NotFound() {
    return (
        <Container className="text-center py-5">
            <Row className="justify-content-center">
                <Col md={6}>
                    <h1 className="display-1 fw-bold">404</h1>
                    <h2 className="mb-4">Página Não Encontrada</h2>
                    <p className="lead mb-4">
                        A página que você está procurando não existe ou foi movida.
                    </p>
                    <Button as={Link} to="/" variant="primary" size="lg">
                        Voltar para a página inicial
                    </Button>
                </Col>
            </Row>
        </Container>
    )
}

export default NotFound