// modules/client/pages/ClientForm.jsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Form, Button, Card, Alert, Spinner, Row, Col, Badge, InputGroup } from 'react-bootstrap'
import api from '../../../services/api'
import { authService } from '../../../services/api'

// Funções de utilidade para máscaras e validações
const applyMask = {
    cpf: (value) => {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})/, '$1-$2')
            .replace(/(-\d{2})\d+?$/, '$1');
    },
    cep: (value) => {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{5})(\d)/, '$1-$2')
            .replace(/(-\d{3})\d+?$/, '$1');
    },
    phoneResidencial: (value) => {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{4})(\d)/, '$1-$2')
            .replace(/(-\d{4})\d+?$/, '$1');
    },
    phoneCelular: (value) => {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{5})(\d)/, '$1-$2')
            .replace(/(-\d{4})\d+?$/, '$1');
    }
};

const removeMask = (value) => {
    return value.replace(/\D/g, '');
};

const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

const validateName = (name) => {
    // Permite letras, espaços e números
    return /^[a-zA-ZÀ-ÖØ-öø-ÿ0-9\s]{3,100}$/.test(name);
};

function ClientForm({ readOnly = false }) {
    const { id } = useParams()
    const navigate = useNavigate()
    const isEditing = !!id

    // Obter informações do usuário para verificar permissões
    const userInfo = authService.getUserInfo();
    const isAdmin = userInfo && userInfo.roles &&
        (userInfo.roles.includes('ROLE_ADMIN') ||
            userInfo.roles.includes('ADMIN'));

    const [formData, setFormData] = useState({
        name: "",
        cpf: "",
        address: {
            cep: "",
            logradouro: "",
            bairro: "",
            cidade: "",
            uf: "",
            complemento: ""
        },
        phones: [{ type: "celular", number: "" }],
        emails: [""]
    });

    const [loading, setLoading] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState(null)
    const [validated, setValidated] = useState(false)
    const [cepLoading, setCepLoading] = useState(false)
    const [fieldErrors, setFieldErrors] = useState({})

    // Verificar permissões ao carregar o componente
    useEffect(() => {
        if (isEditing && !isAdmin && !readOnly) {
            navigate(`/clients/${id}`, { replace: true });
        }
    }, [id, isAdmin, navigate, isEditing, readOnly]);

    useEffect(() => {
        if (id) {
            const fetchClient = async () => {
                try {
                    setLoading(true);
                    const response = await api.get(`/api/v1/clients/${id}`);
                    console.log("Dados do cliente recebidos:", response.data);

                    // Processar os dados
                    const clientData = response.data;

                    // Verificar se há um objeto aninhado chamado 'client'
                    const data = clientData.client && typeof clientData.client === 'object'
                        ? clientData.client
                        : clientData;

                    // Transformar dados para formato correto
                    const formattedData = {
                        name: String(data.name || ''),
                        cpf: data.cpf ? applyMask.cpf(data.cpf) : '',
                        address: {
                            cep: data.address?.cep ? applyMask.cep(data.address.cep) : '',
                            logradouro: data.address?.logradouro || '',
                            bairro: data.address?.bairro || '',
                            cidade: data.address?.cidade || '',
                            uf: data.address?.uf || '',
                            complemento: data.address?.complemento || ''
                        },
                        phones: Array.isArray(data.phones) && data.phones.length > 0
                            ? data.phones.map(phone => ({
                                type: phone.type || 'celular',
                                number: phone.type === 'celular'
                                    ? applyMask.phoneCelular(phone.number)
                                    : applyMask.phoneResidencial(phone.number)
                            }))
                            : [{ type: 'celular', number: '' }],
                        emails: Array.isArray(data.emails) && data.emails.length > 0
                            ? data.emails
                            : ['']
                    };

                    setFormData(formattedData);
                    setError(null);
                } catch (err) {
                    console.error('Erro ao carregar cliente:', err);
                    setError('Erro ao carregar dados do cliente. Por favor, tente novamente.');
                } finally {
                    setLoading(false);
                }
            };

            fetchClient();
        }
    }, [id]);

    const fetchAddressByCep = async (cep) => {
        try {
            setCepLoading(true);
            const cleanCep = removeMask(cep);
            if (cleanCep.length !== 8) return;

            const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
            const data = await response.json();

            if (data.erro) {
                setFieldErrors(prev => ({
                    ...prev,
                    cep: 'CEP não encontrado'
                }));
                return;
            }

            setFormData(prev => ({
                ...prev,
                address: {
                    ...prev.address,
                    logradouro: data.logradouro || '',
                    bairro: data.bairro || '',
                    cidade: data.localidade || '',
                    uf: data.uf || '',
                    complemento: data.complemento || prev.address.complemento
                }
            }));

            setFieldErrors(prev => ({
                ...prev,
                cep: null
            }));
        } catch (err) {
            console.error('Erro ao buscar CEP:', err);
            setFieldErrors(prev => ({
                ...prev,
                cep: 'Erro ao buscar o CEP'
            }));
        } finally {
            setCepLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name.startsWith('address.')) {
            const addressField = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                address: {
                    ...prev.address,
                    [addressField]: value
                }
            }));
        } else if (name === 'cpf') {
            setFormData(prev => ({
                ...prev,
                cpf: applyMask.cpf(value)
            }));
        } else if (name === 'address.cep') {
            const maskedCep = applyMask.cep(value);
            setFormData(prev => ({
                ...prev,
                address: {
                    ...prev.address,
                    cep: maskedCep
                }
            }));

            // Buscar CEP quando tiver 8 dígitos
            if (removeMask(maskedCep).length === 8) {
                fetchAddressByCep(maskedCep);
            }
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }

        // Validar campo específico
        validateField(name, value);
    };

    const handlePhoneChange = (index, field, value) => {
        setFormData(prev => {
            const newPhones = [...prev.phones];

            if (field === 'number') {
                const phoneType = newPhones[index].type;
                const maskedValue = phoneType === 'celular'
                    ? applyMask.phoneCelular(value)
                    : applyMask.phoneResidencial(value);

                newPhones[index] = { ...newPhones[index], [field]: maskedValue };
            } else {
                // Se mudou o tipo, adaptar a máscara se necessário
                const currentNumber = newPhones[index].number;
                const unmaskedNumber = removeMask(currentNumber);

                if (value === 'celular') {
                    newPhones[index] = {
                        type: value,
                        number: applyMask.phoneCelular(unmaskedNumber)
                    };
                } else {
                    newPhones[index] = {
                        type: value,
                        number: applyMask.phoneResidencial(unmaskedNumber)
                    };
                }
            }

            return { ...prev, phones: newPhones };
        });
    };

    const handleEmailChange = (index, value) => {
        setFormData(prev => {
            const newEmails = [...prev.emails];
            newEmails[index] = value;
            return { ...prev, emails: newEmails };
        });

        // Validar email
        const isValid = validateEmail(value);
        setFieldErrors(prev => ({
            ...prev,
            [`emails.${index}`]: isValid ? null : 'Email inválido'
        }));
    };

    const addPhone = () => {
        setFormData(prev => ({
            ...prev,
            phones: [...prev.phones, { type: 'celular', number: '' }]
        }));
    };

    const removePhone = (index) => {
        if (formData.phones.length > 1) {
            setFormData(prev => {
                const newPhones = [...prev.phones];
                newPhones.splice(index, 1);
                return { ...prev, phones: newPhones };
            });
        }
    };

    const addEmail = () => {
        setFormData(prev => ({
            ...prev,
            emails: [...prev.emails, '']
        }));
    };

    const removeEmail = (index) => {
        if (formData.emails.length > 1) {
            setFormData(prev => {
                const newEmails = [...prev.emails];
                newEmails.splice(index, 1);
                return { ...prev, emails: newEmails };
            });
        }
    };

    const validateField = (name, value) => {
        let isValid = true;
        let message = null;

        switch (name) {
            case 'name':
                isValid = validateName(value);
                message = isValid ? null : 'Nome deve ter entre 3 e 100 caracteres e conter apenas letras, números e espaços';
                break;
            case 'cpf':
                isValid = removeMask(value).length === 11;
                message = isValid ? null : 'CPF inválido';
                break;
            case 'address.cep':
                isValid = removeMask(value).length === 8;
                message = isValid ? null : 'CEP inválido';
                break;
            default:
                if (name.startsWith('emails.')) {
                    isValid = validateEmail(value);
                    message = isValid ? null : 'Email inválido';
                }
        }

        setFieldErrors(prev => ({
            ...prev,
            [name]: message
        }));

        return isValid;
    };

    const validateForm = () => {
        let isValid = true;
        const errors = {};

        // Validar nome
        if (!validateName(formData.name)) {
            errors.name = 'Nome deve ter entre 3 e 100 caracteres e conter apenas letras, números e espaços';
            isValid = false;
        }

        // Validar CPF
        if (removeMask(formData.cpf).length !== 11) {
            errors.cpf = 'CPF inválido';
            isValid = false;
        }

        // Validar endereço
        const { cep, logradouro, bairro, cidade, uf } = formData.address;
        if (removeMask(cep).length !== 8) {
            errors['address.cep'] = 'CEP inválido';
            isValid = false;
        }
        if (!logradouro) {
            errors['address.logradouro'] = 'Logradouro é obrigatório';
            isValid = false;
        }
        if (!bairro) {
            errors['address.bairro'] = 'Bairro é obrigatório';
            isValid = false;
        }
        if (!cidade) {
            errors['address.cidade'] = 'Cidade é obrigatória';
            isValid = false;
        }
        if (!uf) {
            errors['address.uf'] = 'UF é obrigatória';
            isValid = false;
        }

        // Validar telefones
        const hasValidPhone = formData.phones.some(phone => {
            const phoneType = phone.type;
            const unmaskedNumber = removeMask(phone.number);
            return (phoneType === 'celular' && unmaskedNumber.length === 11) ||
                (phoneType !== 'celular' && unmaskedNumber.length === 10);
        });

        if (!hasValidPhone) {
            errors['phones'] = 'Pelo menos um telefone válido é obrigatório';
            isValid = false;
        }

        // Validar emails
        const hasValidEmail = formData.emails.some(email => validateEmail(email));
        if (!hasValidEmail) {
            errors['emails'] = 'Pelo menos um email válido é obrigatório';
            isValid = false;
        }

        setFieldErrors(errors);
        return isValid;
    };

    const prepareDataForSubmission = () => {
        // Remover máscaras e preparar dados para envio
        const preparedData = {
            name: formData.name,
            cpf: removeMask(formData.cpf),
            address: {
                ...formData.address,
                cep: removeMask(formData.address.cep)
            },
            phones: formData.phones.map(phone => ({
                type: phone.type,
                number: removeMask(phone.number)
            })),
            emails: formData.emails.filter(email => email.trim() !== '')
        };

        return preparedData;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Se estiver no modo somente leitura, não fazer nada
        if (readOnly) return;

        // Verificar permissões para edição
        if (isEditing && !isAdmin) {
            setError('Você não tem permissão para editar clientes.');
            return;
        }

        // Validar o formulário
        const isFormValid = validateForm();
        setValidated(true);

        if (!isFormValid) {
            return;
        }

        try {
            setSubmitting(true);
            setError(null);

            const dataToSubmit = prepareDataForSubmission();

            // Garantir que o token está sendo enviado corretamente
            const token = authService.getToken();
            const config = {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            };

            if (isEditing) {
                await api.put(`/api/v1/clients/${id}`, dataToSubmit, config);
            } else {
                await api.post('/api/v1/clients', dataToSubmit, config);
            }

            // Navegar para a lista de clientes
            navigate('/');
        } catch (err) {
            console.error('Erro ao salvar cliente:', err);

            let errorMessage = `Erro ao ${isEditing ? 'atualizar' : 'criar'} cliente.`;

            // Verificar se é um erro de autenticação
            if (err.response) {
                if (err.response.status === 401 || err.response.status === 403) {
                    errorMessage = 'Sessão expirada ou sem permissão. Por favor, faça login novamente.';
                    // Não redirecionar automaticamente, deixar o usuário ver a mensagem
                } else if (err.response.data && err.response.data.message) {
                    // Usar mensagem de erro do backend se disponível
                    errorMessage = err.response.data.message;
                }
            }

            setError(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    // Função para lidar com a exclusão de cliente
    const handleDelete = async () => {
        if (!isAdmin) {
            setError('Você não tem permissão para excluir clientes.');
            return;
        }

        if (!window.confirm('Tem certeza que deseja excluir este cliente?')) {
            return;
        }

        try {
            setSubmitting(true);
            await api.delete(`/api/v1/clients/${id}`);
            navigate('/');
        } catch (err) {
            console.error('Erro ao excluir cliente:', err);

            let errorMessage = 'Erro ao excluir cliente.';

            if (err.response && err.response.status === 403) {
                errorMessage = 'Você não tem permissão para excluir clientes.';
            }

            setError(errorMessage);
        } finally {
            setSubmitting(false);
        }
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
                <div>
                    <h2>
                        {readOnly ? 'Detalhes do Cliente' : (isEditing ? 'Editar Cliente' : 'Novo Cliente')}
                    </h2>
                    {readOnly && (
                        <Badge bg="info" className="ms-2">Modo Visualização</Badge>
                    )}
                </div>
                {isAdmin && isEditing && (
                    <div>
                        {readOnly && (
                            <Button
                                variant="warning"
                                onClick={() => navigate(`/clients/edit/${id}`)}
                                className="me-2"
                            >
                                Editar
                            </Button>
                        )}
                        {isAdmin && isEditing && (
                            <Button
                                variant="danger"
                                onClick={handleDelete}
                                disabled={submitting}
                            >
                                {submitting ? 'Excluindo...' : 'Excluir'}
                            </Button>
                        )}
                    </div>
                )}
            </Card.Header>
            <Card.Body>
                {error && <Alert variant="danger">{error}</Alert>}

                <Form noValidate validated={validated} onSubmit={handleSubmit}>
                    {/* Nome */}
                    <Form.Group className="mb-3" controlId="clientName">
                        <Form.Label>Nome</Form.Label>
                        <Form.Control
                            required
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Nome do cliente"
                            readOnly={readOnly}
                            disabled={readOnly}
                            isInvalid={!!fieldErrors.name}
                            minLength={3}
                            maxLength={100}
                        />
                        <Form.Control.Feedback type="invalid">
                            {fieldErrors.name || 'Por favor, informe o nome do cliente.'}
                        </Form.Control.Feedback>
                        <Form.Text className="text-muted">
                            Mínimo de 3 e máximo de 100 caracteres. Permite apenas letras, espaços e números.
                        </Form.Text>
                    </Form.Group>

                    {/* CPF */}
                    <Form.Group className="mb-3" controlId="clientCpf">
                        <Form.Label>CPF</Form.Label>
                        <Form.Control
                            required
                            type="text"
                            name="cpf"
                            value={formData.cpf}
                            onChange={handleChange}
                            placeholder="000.000.000-00"
                            readOnly={readOnly}
                            disabled={readOnly}
                            isInvalid={!!fieldErrors.cpf}
                        />
                        <Form.Control.Feedback type="invalid">
                            {fieldErrors.cpf || 'Por favor, informe um CPF válido.'}
                        </Form.Control.Feedback>
                    </Form.Group>

                    {/* Endereço */}
                    <Card className="mb-3">
                        <Card.Header>Endereço</Card.Header>
                        <Card.Body>
                            <Row>
                                <Col md={4}>
                                    <Form.Group className="mb-3" controlId="clientCep">
                                        <Form.Label>CEP</Form.Label>
                                        <InputGroup>
                                            <Form.Control
                                                required
                                                type="text"
                                                name="address.cep"
                                                value={formData.address.cep}
                                                onChange={handleChange}
                                                placeholder="00000-000"
                                                readOnly={readOnly}
                                                disabled={readOnly || cepLoading}
                                                isInvalid={!!fieldErrors['address.cep']}
                                            />
                                            {cepLoading && (
                                                <InputGroup.Text>
                                                    <Spinner
                                                        animation="border"
                                                        size="sm"
                                                        role="status"
                                                        aria-hidden="true"
                                                    />
                                                </InputGroup.Text>
                                            )}
                                            <Form.Control.Feedback type="invalid">
                                                {fieldErrors['address.cep'] || 'CEP é obrigatório.'}
                                            </Form.Control.Feedback>
                                        </InputGroup>
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Row>
                                <Col md={8}>
                                    <Form.Group className="mb-3" controlId="clientLogradouro">
                                        <Form.Label>Logradouro</Form.Label>
                                        <Form.Control
                                            required
                                            type="text"
                                            name="address.logradouro"
                                            value={formData.address.logradouro}
                                            onChange={handleChange}
                                            placeholder="Rua, Avenida, etc"
                                            readOnly={readOnly}
                                            disabled={readOnly}
                                            isInvalid={!!fieldErrors['address.logradouro']}
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {fieldErrors['address.logradouro'] || 'Logradouro é obrigatório.'}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                                <Col md={4}>
                                    <Form.Group className="mb-3" controlId="clientComplemento">
                                        <Form.Label>Complemento</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="address.complemento"
                                            value={formData.address.complemento}
                                            onChange={handleChange}
                                            placeholder="Apto, Bloco, etc"
                                            readOnly={readOnly}
                                            disabled={readOnly}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Row>
                                <Col md={4}>
                                    <Form.Group className="mb-3" controlId="clientBairro">
                                        <Form.Label>Bairro</Form.Label>
                                        <Form.Control
                                            required
                                            type="text"
                                            name="address.bairro"
                                            value={formData.address.bairro}
                                            onChange={handleChange}
                                            placeholder="Bairro"
                                            readOnly={readOnly}
                                            disabled={readOnly}
                                            isInvalid={!!fieldErrors['address.bairro']}
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {fieldErrors['address.bairro'] || 'Bairro é obrigatório.'}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3" controlId="clientCidade">
                                        <Form.Label>Cidade</Form.Label>
                                        <Form.Control
                                            required
                                            type="text"
                                            name="address.cidade"
                                            value={formData.address.cidade}
                                            onChange={handleChange}
                                            placeholder="Cidade"
                                            readOnly={readOnly}
                                            disabled={readOnly}
                                            isInvalid={!!fieldErrors['address.cidade']}
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {fieldErrors['address.cidade'] || 'Cidade é obrigatória.'}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                                <Col md={2}>
                                    <Form.Group className="mb-3" controlId="clientUf">
                                        <Form.Label>UF</Form.Label>
                                        <Form.Control
                                            required
                                            type="text"
                                            name="address.uf"
                                            value={formData.address.uf}
                                            onChange={handleChange}
                                            placeholder="UF"
                                            readOnly={readOnly}
                                            disabled={readOnly}
                                            isInvalid={!!fieldErrors['address.uf']}
                                            maxLength={2}
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {fieldErrors['address.uf'] || 'UF é obrigatória.'}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>

                    {/* Telefones */}
                    <Card className="mb-3">
                        <Card.Header className="d-flex justify-content-between align-items-center">
                            <span>Telefones</span>
                            {!readOnly && (
                                <Button
                                    variant="outline-primary"
                                    size="sm"
                                    onClick={addPhone}
                                >
                                    + Adicionar Telefone
                                </Button>
                            )}
                        </Card.Header>
                        <Card.Body>
                            {fieldErrors.phones && (
                                <Alert variant="danger">{fieldErrors.phones}</Alert>
                            )}

                            {formData.phones.map((phone, index) => (
                                <Row key={`phone-${index}`} className="mb-3 align-items-end">
                                    <Col md={3}>
                                        <Form.Group controlId={`phoneType-${index}`}>
                                            <Form.Label>Tipo</Form.Label>
                                            <Form.Select
                                                name={`phoneType-${index}`}
                                                value={phone.type}
                                                onChange={(e) => handlePhoneChange(index, 'type', e.target.value)}
                                                readOnly={readOnly}
                                                disabled={readOnly}
                                            >
                                                <option value="celular">Celular</option>
                                                <option value="residencial">Residencial</option>
                                                <option value="comercial">Comercial</option>
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                    <Col md={7}>
                                        <Form.Group controlId={`phoneNumber-${index}`}>
                                            <Form.Label>Número</Form.Label>
                                            <Form.Control
                                                required
                                                type="text"
                                                value={phone.number}
                                                onChange={(e) => handlePhoneChange(index, 'number', e.target.value)}
                                                placeholder={phone.type === 'celular' ? '(00) 00000-0000' : '(00) 0000-0000'}
                                                readOnly={readOnly}
                                                disabled={readOnly}
                                            />
                                        </Form.Group>
                                    </Col>
                                    {!readOnly && formData.phones.length > 1 && (
                                        <Col md={2}>
                                            <Button
                                                variant="outline-danger"
                                                size="sm"
                                                onClick={() => removePhone(index)}
                                            >
                                                Remover
                                            </Button>
                                        </Col>
                                    )}
                                </Row>
                            ))}
                        </Card.Body>
                    </Card>

                    {/* Emails */}
                    <Card className="mb-3">
                        <Card.Header className="d-flex justify-content-between align-items-center">
                            <span>Emails</span>
                            {!readOnly && (
                                <Button
                                    variant="outline-primary"
                                    size="sm"
                                    onClick={addEmail}
                                >
                                    + Adicionar Email
                                </Button>
                            )}
                        </Card.Header>
                        <Card.Body>
                            {fieldErrors.emails && (
                                <Alert variant="danger">{fieldErrors.emails}</Alert>
                            )}

                            {formData.emails.map((email, index) => (
                                <Row key={`email-${index}`} className="mb-3 align-items-end">
                                    <Col md={10}>
                                        <Form.Group controlId={`email-${index}`}>
                                            <Form.Label>Email {index + 1}</Form.Label>
                                            <Form.Control
                                                required
                                                type="email"
                                                value={email}
                                                onChange={(e) => handleEmailChange(index, e.target.value)}
                                                placeholder="email@exemplo.com"
                                                readOnly={readOnly}
                                                disabled={readOnly}
                                                isInvalid={!!fieldErrors[`emails.${index}`]}
                                            />
                                            <Form.Control.Feedback type="invalid">
                                                {fieldErrors[`emails.${index}`] || 'Por favor, informe um email válido.'}
                                            </Form.Control.Feedback>
                                        </Form.Group>
                                    </Col>
                                    {!readOnly && formData.emails.length > 1 && (
                                        <Col md={2}>
                                            <Button
                                                variant="outline-danger"
                                                size="sm"
                                                onClick={() => removeEmail(index)}
                                            >
                                                Remover
                                            </Button>
                                        </Col>
                                    )}
                                </Row>
                            ))}
                        </Card.Body>
                    </Card>

                    <Row className="mt-4">
                        <Col>
                            <Button
                                variant="secondary"
                                onClick={() => navigate('/')}
                                disabled={submitting}
                            >
                                {readOnly ? 'Voltar' : 'Cancelar'}
                            </Button>
                        </Col>

                        {!readOnly && (
                            <Col xs="auto">
                                <Button
                                    variant="primary"
                                    type="submit"
                                    disabled={submitting}
                                >
                                    {submitting ? (
                                        <>
                                            <Spinner
                                                as="span"
                                                animation="border"
                                                size="sm"
                                                role="status"
                                                aria-hidden="true"
                                                className="me-2"
                                            />
                                            Salvando...
                                        </>
                                    ) : (
                                        'Salvar'
                                    )}
                                </Button>
                            </Col>
                        )}
                    </Row>
                </Form>
            </Card.Body>
        </Card>
    );
}

export default ClientForm;