import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { clientService } from '../../../services/clientService.js';

function ClientDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [client, setClient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchClient = async () => {
            try {
                const data = await clientService.getById(id);
                setClient(data);
            } catch (err) {
                setError('Erro ao carregar detalhes do cliente');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchClient();
    }, [id]);

    const handleDelete = async () => {
        if (window.confirm('Tem certeza que deseja excluir este cliente?')) {
            try {
                await clientService.delete(id);
                alert('Cliente excluído com sucesso!');
                navigate('/clients');
            } catch (err) {
                setError('Erro ao excluir cliente');
                console.error(err);
            }
        }
    };

    if (loading) return <div>Carregando...</div>;
    if (error) return <div className="error">{error}</div>;
    if (!client) return <div>Cliente não encontrado</div>;

    return (
        <div className="client-details">
            <h2>Detalhes do Cliente</h2>

            <div className="detail-section">
                <h3>Informações Pessoais</h3>
                <p><strong>Nome:</strong> {client.nome}</p>
                <p><strong>CPF:</strong> {client.cpfComMascara}</p>
            </div>

            <div className="detail-section">
                <h3>Endereço</h3>
                <p>
                    {client.endereco.logradouro}, {client.endereco.numero} <br />
                    {client.endereco.bairro} <br />
                    {client.endereco.cidade} - {client.endereco.estado} <br />
                    CEP: {client.endereco.cep}
                </p>
            </div>

            <div className="detail-section">
                <h3>Contatos</h3>
                <div>
                    <h4>Telefones</h4>
                    <ul>
                        {client.telefone.map((tel, index) => (
                            <li key={index}>{tel.numero} ({tel.tipo})</li>
                        ))}
                    </ul>
                </div>

                <div>
                    <h4>E-mails</h4>
                    <ul>
                        {client.email.map((email, index) => (
                            <li key={index}>{email.endereco}</li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className="actions">
                <button onClick={() => navigate(`/clients/${id}/edit`)}>Editar</button>
                <button onClick={handleDelete} className="delete-btn">Excluir</button>
                <button onClick={() => navigate('/clients')}>Voltar</button>
            </div>
        </div>
    );
}

export default ClientDetails;