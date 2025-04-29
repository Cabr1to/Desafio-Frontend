// modules/client/pages/ClientList.jsx
import { useState, useEffect } from 'react';
import { Table, Button, Card, Alert, Spinner, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import api from '../../../services/api';
import { authService } from '../../../services/api';

function ClientList() {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Obter informações do usuário para verificar permissões
    const userInfo = authService.getUserInfo();
    const isAdmin = userInfo && userInfo.roles &&
        (userInfo.roles.includes('ROLE_ADMIN') ||
            userInfo.roles.includes('ADMIN'));

    useEffect(() => {
        const fetchClients = async () => {
            try {
                setLoading(true);
                const response = await api.get('/api/v1/clients');

                // Log para depuração
                console.log("Dados recebidos da API:", response.data);

                // Identificar a estrutura da resposta e extrair os dados
                let clientsData = [];

                if (Array.isArray(response.data)) {
                    clientsData = response.data;
                } else if (response.data && Array.isArray(response.data.content)) {
                    // Formato paginado
                    clientsData = response.data.content;
                } else if (response.data && typeof response.data === 'object') {
                    // Pode estar em uma propriedade específica
                    const possibleArrays = Object.values(response.data).filter(val => Array.isArray(val));
                    if (possibleArrays.length > 0) {
                        // Usar o primeiro array encontrado
                        clientsData = possibleArrays[0];
                    }
                }

                // Processar cada cliente para exibição na tabela
                const processedClients = clientsData.map(client => {
                    // Lidar com diferentes estruturas possíveis
                    const clientData = client.client && typeof client.client === 'object'
                        ? client.client
                        : client;

                    // Extrair o primeiro email e telefone se forem arrays
                    const primaryEmail = Array.isArray(clientData.emails) && clientData.emails.length > 0
                        ? clientData.emails[0]
                        : (clientData.email || 'N/A');

                    let primaryPhone = 'N/A';
                    if (Array.isArray(clientData.phones) && clientData.phones.length > 0) {
                        const phone = clientData.phones[0];
                        primaryPhone = typeof phone === 'object' ? phone.number : phone;
                    } else if (clientData.phone) {
                        primaryPhone = clientData.phone;
                    }

                    return {
                        id: clientData.id,
                        name: String(clientData.name || 'N/A'),
                        email: String(primaryEmail),
                        phone: String(primaryPhone),
                        cpf: clientData.cpf ? formatCPF(clientData.cpf) : 'N/A'
                    };
                });

                setClients(processedClients);
                setError(null);
            } catch (err) {
                console.error('Erro ao carregar clientes:', err);
                setError('Não foi possível carregar a lista de clientes.');
            } finally {
                setLoading(false);
            }
        };

        fetchClients();
    }, []);

    // Função para formatar CPF
    const formatCPF = (cpf) => {
        if (!cpf) return 'N/A';

        // Limpar qualquer formatação existente
        const cleanCPF = cpf.replace(/\D/g, '');

        if (cleanCPF.length !== 11) return cpf; // Retorna original se não tiver 11 dígitos

        // Aplicar máscara
        return cleanCPF
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})/, '$1-$2');
    };

    if (loading) {
        return (
            <div className="text-center my-4">
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Carregando...</span>
                </Spinner>
            </div>
        );
    }

    return (
        <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
                <h2>Clientes</h2>
                {isAdmin && (
                    <Link to="/clients/new" className="btn btn-primary">
                        Novo Cliente
                    </Link>
                )}
            </Card.Header>
            <Card.Body>
                {error && <Alert variant="danger">{error}</Alert>}

                {clients.length === 0 ? (
                    <Alert variant="info">
                        Nenhum cliente cadastrado.
                    </Alert>
                ) : (
                    <Table striped bordered hover responsive>
                        <thead>
                        <tr>
                            <th>Nome</th>
                            <th>CPF</th>
                            <th>Email</th>
                            <th>Telefone</th>
                            <th className="table-actions">Ações</th>
                        </tr>
                        </thead>
                        <tbody>
                        {clients.map(client => (
                            <tr key={client.id}>
                                <td>{client.name}</td>
                                <td>{client.cpf}</td>
                                <td>{client.email}</td>
                                <td>{client.phone}</td>
                                <td className="table-actions">
                                    <Link
                                        to={`/clients/${client.id}`}
                                        className="btn btn-sm btn-info me-2"
                                    >
                                        Ver
                                    </Link>
                                    {isAdmin && (
                                        <Link
                                            to={`/clients/edit/${client.id}`}
                                            className="btn btn-sm btn-warning me-2"
                                        >
                                            Editar
                                        </Link>
                                    )}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </Table>
                )}
            </Card.Body>
        </Card>
    );
}

export default ClientList;