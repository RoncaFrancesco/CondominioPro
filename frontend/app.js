// API CONFIG
// Debug helpers to surface errors on screen
window.addEventListener('error', (e) => {
  try {
    console.error('GlobalError:', e.error || e.message);
    const el = document.getElementById('root');
    if (el && !el.dataset.errorShown) {
      el.dataset.errorShown = '1';
      el.innerHTML = `<div style="padding:16px;color:#b00020;background:#fff3f4;border:1px solid #f1c0c4;border-radius:8px;max-width:900px;margin:24px auto;font-family:sans-serif">
        <h3 style="margin-top:0">Errore JavaScript</h3>
        <pre style="white-space:pre-wrap">${(e.error && e.error.stack) ? e.error.stack : (e.message || 'Errore sconosciuto')}</pre>
      </div>`;
    }
  } catch(_) {}
});
window.addEventListener('unhandledrejection', (e) => {
  try {
    console.error('UnhandledRejection:', e.reason);
    const el = document.getElementById('root');
    if (el && !el.dataset.errorShown) {
      el.dataset.errorShown = '1';
      el.innerHTML = `<div style="padding:16px;color:#b00020;background:#fff3f4;border:1px solid #f1c0c4;border-radius:8px;max-width:900px;margin:24px auto;font-family:sans-serif">
        <h3 style="margin-top:0">Errore Promise</h3>
        <pre style="white-space:pre-wrap">${(e && e.reason && (e.reason.stack || e.reason.message)) || 'Errore sconosciuto'}</pre>
      </div>`;
    }
  } catch(_) {}
});
console.log('app.js loaded', new Date().toISOString());

const API_BASE = 'http://localhost:5000/api';

// UTILITY FUNCTIONS
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('it-IT', {
        style: 'currency',
        currency: 'EUR'
    }).format(amount);
};

const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('it-IT');
};

// API FUNCTIONS
const api = {
    // Auth
    login: async (username, password) => {
        const response = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        return response.json();
    },

    logout: async () => {
        const response = await fetch(`${API_BASE}/logout`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        return response.json();
    },

    // Condominii
    getCondominii: async () => {
        const response = await fetch(`${API_BASE}/condominii`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        return response.json();
    },

    createCondominio: async (data) => {
        const response = await fetch(`${API_BASE}/condominii`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(data)
        });
        return response.json();
    },

    deleteCondominio: async (id) => {
        const response = await fetch(`${API_BASE}/condominii/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        return response.json();
    },

    // Persone
    getPersone: async (condoId) => {
        const response = await fetch(`${API_BASE}/condominii/${condoId}/persone`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        return response.json();
    },

    createPersona: async (condoId, data) => {
        const response = await fetch(`${API_BASE}/condominii/${condoId}/persone`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(data)
        });
        return response.json();
    },

    updatePersona: async (id, data) => {
        const response = await fetch(`${API_BASE}/persone/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(data)
        });
        return response.json();
    },

    deletePersona: async (id) => {
        const response = await fetch(`${API_BASE}/persone/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        return response.json();
    },

    // Millesimi
    getMillesimi: async (condoId) => {
        const response = await fetch(`${API_BASE}/condominii/${condoId}/millesimi`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        return response.json();
    },

    saveMillesimi: async (condoId, data) => {
        const response = await fetch(`${API_BASE}/condominii/${condoId}/millesimi`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(data)
        });
        return response.json();
    },

    // Spese
    getSpese: async (condoId, tabellaFilter = null) => {
        const url = tabellaFilter ? `${API_BASE}/condominii/${condoId}/spese?tabella=${tabellaFilter}` : `${API_BASE}/condominii/${condoId}/spese`;
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        return response.json();
    },

    createSpesa: async (condoId, data) => {
        const response = await fetch(`${API_BASE}/condominii/${condoId}/spese`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(data)
        });
        return response.json();
    },

    deleteSpesa: async (id) => {
        const response = await fetch(`${API_BASE}/spese/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        return response.json();
    },

    updateSpesa: async (id, data) => {
        const response = await fetch(`${API_BASE}/spese/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(data)
        });
        return response.json();
    },

    // Ripartizione
    getRipartizione: async (condoId, tabellaFilter = null) => {
        const url = tabellaFilter ? `${API_BASE}/condominii/${condoId}/ripartizione?tabella=${tabellaFilter}` : `${API_BASE}/condominii/${condoId}/ripartizione`;
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        return response.json();
    },

    getRipartizioneDettagliata: async (condoId, tabellaFilter = null) => {
        const url = tabellaFilter ? `${API_BASE}/condominii/${condoId}/ripartizione/dettagliata?tabella=${tabellaFilter}` : `${API_BASE}/condominii/${condoId}/ripartizione/dettagliata`;
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        return response.json();
    },

    // Preventivi
    getPreventivi: async (condoId) => {
        const response = await fetch(`${API_BASE}/condominii/${condoId}/preventivi`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        return response.json();
    },

    generaPreventivo: async (condoId, anno) => {
        const response = await fetch(`${API_BASE}/condominii/${condoId}/preventivi/${anno}/genera`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        return response.json();
    },

    // Spese Preventivate
    getSpesePreventivate: async (condoId, anno) => {
        const response = await fetch(`${API_BASE}/condominii/${condoId}/spese-preventivate/${anno}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        return response.json();
    },

    createSpesaPreventivata: async (condoId, data) => {
        const response = await fetch(`${API_BASE}/condominii/${condoId}/spese-preventivate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(data)
        });
        return response.json();
    },

    deleteSpesaPreventivata: async (id) => {
        const response = await fetch(`${API_BASE}/spese-preventivate/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        return response.json();
    },

    // Calcolo Preventivo
    getCalcoloPreventivo: async (condoId, anno) => {
        const response = await fetch(`${API_BASE}/condominii/${condoId}/calcolo-preventivo/${anno}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        return response.json();
    },

    // Stampa Word
    stampaSpese: async (condoId, tabellaFilter = null) => {
        const url = tabellaFilter ? `${API_BASE}/condominii/${condoId}/stampa/spese?tabella=${tabellaFilter}` : `${API_BASE}/condominii/${condoId}/stampa/spese`;
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        if (response.ok) {
            const blob = await response.blob();
            const cd = response.headers.get("Content-Disposition") || '';
            const m = cd.match(/filename="(.+)"/);
            const filename = (m && m[1]) || 'spese.docx';

            // Crea link per download
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);

            return { success: true };
        } else {
            const errorText = await response.text();
            console.error('Errore risposta server:', response.status, errorText);

            try {
                const error = JSON.parse(errorText);
                throw new Error(error.message || `Errore ${response.status}: ${response.statusText}`);
            } catch (e) {
                throw new Error(`Errore ${response.status}: ${response.statusText}`);
            }
        }
    },

    stampaPreventivo: async (condoId, anno) => {
        const url = `${API_BASE}/condominii/${condoId}/stampa/preventivo/${anno}`;
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (response.ok) {
            const blob = await response.blob();
            const cd = response.headers.get("Content-Disposition") || '';
            const m = cd.match(/filename=\"(.+)\"/);
            const filename = (m && m[1]) || `preventivo_${anno}.docx`;
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
            return { success: true };
        } else {
            const errorText = await response.text();
            try {
                const error = JSON.parse(errorText);
                throw new Error(error.message || `Errore ${response.status}`);
            } catch (e) {
                throw new Error(`Errore ${response.status}`);
            }
        }
    },
};

// LOGIN COMPONENT (semplice)
const Login = ({ onLogin }) => {
    const [formData, setFormData] = React.useState({ username: '', password: '' });
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const result = await api.login(formData.username, formData.password);
            if (result && result.token) {
                localStorage.setItem('token', result.token);
                localStorage.setItem('user', JSON.stringify(result.user));
                onLogin(result.user);
            } else {
                setError((result && result.message) || 'Login fallito');
            }
        } catch (err) {
            setError('Errore di connessione al server');
        } finally {
            setLoading(false);
        }
    };

    return React.createElement(
        'div',
        { className: 'login-container' },
        React.createElement(
            'div',
            { className: 'login-card' },
            React.createElement(
                'div',
                { className: 'login-header' },
                React.createElement('h1', null, ' CONDOMINIO PRO'),
                React.createElement('p', null, 'Gestione Condominiale Professionale')
            ),
            error && React.createElement('div', { className: 'alert alert-danger' }, error),
            React.createElement(
                'form',
                { onSubmit: handleSubmit, className: 'login-form' },
                React.createElement('div', { className: 'form-group' },
                    React.createElement('input', {
                        type: 'text',
                        className: 'form-control',
                        value: formData.username,
                        onChange: (e) => setFormData({ ...formData, username: e.target.value }),
                        placeholder: 'Username',
                        required: true
                    })
                ),
                React.createElement('div', { className: 'form-group' },
                    React.createElement('input', {
                        type: 'password',
                        className: 'form-control',
                        value: formData.password,
                        onChange: (e) => setFormData({ ...formData, password: e.target.value }),
                        placeholder: 'Password',
                        required: true
                    })
                ),
                React.createElement(
                    'div',
                    { className: 'login-buttons' },
                    React.createElement(
                        'button',
                        { type: 'submit', className: 'btn btn-primary', disabled: loading },
                        loading ? 'Login in corso...' : 'Login'
                    )
                )
            )
        )
    );
};

// PREVENTIVO ANNUALE COMPONENT (semplificato temporaneamente per stabilità)
// PREVENTIVO ANNUALE COMPONENT (completo)
const PreventivoAnnuale = (props) => (window.PreventivoAnnuale ? window.PreventivoAnnuale(props) : React.createElement('div', { className: 'card' }, React.createElement('div', { style: { padding: '24px', textAlign: 'center' } }, 'Sezione non disponibile')));

// DASHBOARD COMPONENT
const Dashboard = ({ user, onLogout, onSelectCondominio }) => {
    const [condominii, setCondominii] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [showNuovoCondominio, setShowNuovoCondominio] = React.useState(false);
    const [nuovoCondominio, setNuovoCondominio] = React.useState({
        nome: '',
        indirizzo: '',
        num_unita: '',
        anno_costruzione: '',
        numero_scale: '',
        presidente_assemblea: '',
        responsabile: '',
        telefono_responsabile: '',
        email_responsabile: '',
        amministratore_esterno: '',
        partita_iva: '',
        iban_condominio: '',
        banca_appoggio: '',
        descrizione_edificio: '',
        note_interne: ''
    });
    const [message, setMessage] = React.useState({ type: '', text: '' });

    React.useEffect(() => {
        loadCondominii();
    }, []);

    const loadCondominii = async () => {
        try {
            const data = await api.getCondominii();
            setCondominii(data);
        } catch (err) {
            setMessage({ type: 'danger', text: 'Errore nel caricamento dei condominii' });
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCondominio = async (e) => {
        e.preventDefault();
        try {
            const result = await api.createCondominio(nuovoCondominio);
            if (result.condominio) {
                setMessage({ type: 'success', text: 'Condominio creato con successo!' });
                setNuovoCondominio({
                    nome: '',
                    indirizzo: '',
                    num_unita: '',
                    anno_costruzione: '',
                    numero_scale: '',
                    presidente_assemblea: '',
                    responsabile: '',
                    telefono_responsabile: '',
                    email_responsabile: '',
                    amministratore_esterno: '',
                    partita_iva: '',
                    iban_condominio: '',
                    banca_appoggio: '',
                    descrizione_edificio: '',
                    note_interne: ''
                });
                setShowNuovoCondominio(false);
                loadCondominii();
            } else {
                setMessage({ type: 'danger', text: result.message || 'Errore nella creazione' });
            }
        } catch (err) {
            setMessage({ type: 'danger', text: 'Errore di connessione al server' });
        }
    };

    const handleDeleteCondominio = async (id) => {
        if (!confirm('Sei sicuro di voler eliminare questo condominio?')) return;

        try {
            const result = await api.deleteCondominio(id);
            if (result.message) {
                setMessage({ type: 'success', text: 'Condominio eliminato con successo!' });
                loadCondominii();
            } else {
                setMessage({ type: 'danger', text: 'Errore nell\'eliminazione' });
            }
        } catch (err) {
            setMessage({ type: 'danger', text: 'Errore di connessione al server' });
        }
    };

    if (loading) {
        return React.createElement('div', { className: 'loading' },
            React.createElement('div', { className: 'spinner' })
        );
    }

    return React.createElement('div', { className: 'container' },
        React.createElement('div', { className: 'dashboard-header' },
            React.createElement('div', { className: 'welcome-section' },
                React.createElement('h2', null, 'Benvenuto in CONDOMINIO PRO'),
                React.createElement('p', null, 'La web app dedicata per la gestione dei condomini')
            ),
            React.createElement('div', { className: 'user-info' },
                React.createElement('span', null, 'Pronto a gestire i tuoi condomini?'),
                React.createElement('button', {
                    className: 'btn btn-secondary',
                    onClick: onLogout
                }, 'Logout')
            )
        ),

        message.text && React.createElement('div', { className: `alert alert-${message.type}` }, message.text),

        // Nuovo Condominio Form
        React.createElement('div', { style: { marginBottom: '20px' } },
            React.createElement('button', {
                className: 'btn btn-primary',
                onClick: () => setShowNuovoCondominio(true),
                style: { background: 'white', color: '#764ba2' }
            }, ' Nuovo Condominio')
        ),

        // Lista Condominii
        React.createElement('div', null,
            React.createElement('h3', { style: { marginBottom: '20px', color: 'white' } }, 'I TUOI CONDOMINII'),
            condominii.length === 0 ?
                React.createElement('div', { className: 'card', style: { textAlign: 'center' } },
                    React.createElement('p', { style: { color: '#666' } }, 'Nessun condominio presente. Creane uno nuovo!')
                ) :
                React.createElement('div', null,
                    condominii.map(condo =>
                        React.createElement('div', { key: condo.id, className: 'condominio-card' },
                            React.createElement('div', { className: 'condominio-header' },
                                React.createElement('div', null,
                                    React.createElement('div', { className: 'condominio-title' }, ` ${condo.nome}`),
                                    React.createElement('div', { className: 'condominio-address' },
                                        React.createElement('span', null, '📍 '), condo.indirizzo || 'Indirizzo non specificato'
                                    ),
                                    condo.anno_costruzione && React.createElement('div', { className: 'condominio-address' },
                                        React.createElement('span', null, '🏗️ '), `Costruito nel ${condo.anno_costruzione}`
                                    ),
                                    condo.numero_scale && React.createElement('div', { className: 'condominio-address' },
                                        React.createElement('span', null, '🏢 '), `${condo.numero_scale} scala${condo.numero_scale > 1 ? 'e' : ''}`
                                    ),
                                    condo.presidente_assemblea && React.createElement('div', { className: 'condominio-address' },
                                        React.createElement('span', null, '👔 '), `Pres. ${condo.presidente_assemblea}`
                                    ),
                                    condo.responsabile && React.createElement('div', { className: 'condominio-address' },
                                        React.createElement('span', null, '👤 '), `Resp. ${condo.responsabile}`
                                    )
                                ),
                                React.createElement('div', { className: 'condominio-actions' },
                                    React.createElement('button', {
                                        className: 'btn btn-primary btn-sm',
                                        onClick: () => onSelectCondominio(condo)
                                    }, 'Gestisci'),
                                    React.createElement('button', {
                                        className: 'btn btn-danger btn-sm',
                                        onClick: () => handleDeleteCondominio(condo.id)
                                    }, 'Elimina')
                                )
                            ),
                            React.createElement('div', { className: 'condominio-info' },
                                React.createElement('div', { className: 'info-item' },
                                    React.createElement('span', null, '🏘️ '), `${condo.num_unita} unità`
                                ),
                                React.createElement('div', { className: 'info-item' },
                                    React.createElement('span', null, '📅 '), `Creato il ${formatDate(condo.created_at)}`
                                )
                            )
                        )
                    )
                )
        ),

        // Modal per creare nuovo condominio
        showNuovoCondominio && React.createElement('div', { className: 'modal active' },
            React.createElement('div', { className: 'modal-content' },
                React.createElement('div', { className: 'modal-header' },
                    React.createElement('h3', { className: 'modal-title' }, 'Nuovo Condominio'),
                    React.createElement('button', { className: 'modal-close', onClick: () => setShowNuovoCondominio(false) }, 'x')
                ),

                React.createElement('form', { onSubmit: handleCreateCondominio },
                    React.createElement('div', { className: 'form-group' },
                        React.createElement('label', { className: 'form-label' }, 'Nome Condominio *'),
                        React.createElement('input', {
                            type: 'text',
                            className: 'form-control',
                            value: nuovoCondominio.nome,
                            onChange: (e) => setNuovoCondominio({ ...nuovoCondominio, nome: e.target.value }),
                            placeholder: 'Inserisci nome condominio',
                            required: true
                        })
                    ),
                    React.createElement('div', { className: 'form-group' },
                        React.createElement('label', { className: 'form-label' }, 'Indirizzo'),
                        React.createElement('input', {
                            type: 'text',
                            className: 'form-control',
                            value: nuovoCondominio.indirizzo,
                            onChange: (e) => setNuovoCondominio({ ...nuovoCondominio, indirizzo: e.target.value }),
                            placeholder: 'Inserisci indirizzo'
                        })
                    ),
                    React.createElement('div', { className: 'form-group' },
                        React.createElement('label', { className: 'form-label' }, 'Numero Unità *'),
                        React.createElement('input', {
                            type: 'number',
                            className: 'form-control',
                            value: nuovoCondominio.num_unita,
                            onChange: (e) => setNuovoCondominio({ ...nuovoCondominio, num_unita: parseInt(e.target.value) }),
                            placeholder: 'Inserisci numero unità',
                            min: '1',
                            required: true
                        })
                    ),

                    // SEZIONE INFORMAZIONI AGGIUNTIVE
                    React.createElement('hr', { style: { margin: '20px 0' } }),
                    React.createElement('h4', { style: { color: '#764ba2', marginBottom: '15px' } }, '📋 Informazioni Aggiuntive'),

                    // Anno di costruzione e numero scale
                    React.createElement('div', { style: { display: 'flex', gap: '10px' } },
                        React.createElement('div', { className: 'form-group', style: { flex: 1 } },
                            React.createElement('label', { className: 'form-label' }, 'Anno Costruzione'),
                            React.createElement('input', {
                                type: 'number',
                                className: 'form-control',
                                value: nuovoCondominio.anno_costruzione,
                                onChange: (e) => setNuovoCondominio({ ...nuovoCondominio, anno_costruzione: e.target.value }),
                                placeholder: 'Es: 1990',
                                min: '1800',
                                max: new Date().getFullYear()
                            })
                        ),
                        React.createElement('div', { className: 'form-group', style: { flex: 1 } },
                            React.createElement('label', { className: 'form-label' }, 'Numero Scale'),
                            React.createElement('input', {
                                type: 'number',
                                className: 'form-control',
                                value: nuovoCondominio.numero_scale,
                                onChange: (e) => setNuovoCondominio({ ...nuovoCondominio, numero_scale: e.target.value }),
                                placeholder: 'Es: 2',
                                min: '1'
                            })
                        )
                    ),

                    // Presidente assemblea e responsabile
                    React.createElement('div', { style: { display: 'flex', gap: '10px' } },
                        React.createElement('div', { className: 'form-group', style: { flex: 1 } },
                            React.createElement('label', { className: 'form-label' }, 'Presidente Assemblea'),
                            React.createElement('input', {
                                type: 'text',
                                className: 'form-control',
                                value: nuovoCondominio.presidente_assemblea,
                                onChange: (e) => setNuovoCondominio({ ...nuovoCondominio, presidente_assemblea: e.target.value }),
                                placeholder: 'Nome presidente assemblea'
                            })
                        ),
                        React.createElement('div', { className: 'form-group', style: { flex: 1 } },
                            React.createElement('label', { className: 'form-label' }, 'Responsabile Condominio'),
                            React.createElement('input', {
                                type: 'text',
                                className: 'form-control',
                                value: nuovoCondominio.responsabile,
                                onChange: (e) => setNuovoCondominio({ ...nuovoCondominio, responsabile: e.target.value }),
                                placeholder: 'Nome responsabile'
                            })
                        )
                    ),

                    // Email e telefono responsabile
                    React.createElement('div', { style: { display: 'flex', gap: '10px' } },
                        React.createElement('div', { className: 'form-group', style: { flex: 1 } },
                            React.createElement('label', { className: 'form-label' }, 'Email Responsabile'),
                            React.createElement('input', {
                                type: 'email',
                                className: 'form-control',
                                value: nuovoCondominio.email_responsabile,
                                onChange: (e) => setNuovoCondominio({ ...nuovoCondominio, email_responsabile: e.target.value }),
                                placeholder: 'email@esempio.com'
                            })
                        ),
                        React.createElement('div', { className: 'form-group', style: { flex: 1 } },
                            React.createElement('label', { className: 'form-label' }, 'Telefono Responsabile'),
                            React.createElement('input', {
                                type: 'tel',
                                className: 'form-control',
                                value: nuovoCondominio.telefono_responsabile,
                                onChange: (e) => setNuovoCondominio({ ...nuovoCondominio, telefono_responsabile: e.target.value }),
                                placeholder: '333 1234567'
                            })
                        )
                    ),

                    // Amministratore esterno e partita IVA
                    React.createElement('div', { style: { display: 'flex', gap: '10px' } },
                        React.createElement('div', { className: 'form-group', style: { flex: 2 } },
                            React.createElement('label', { className: 'form-label' }, 'Amministratore Esterno'),
                            React.createElement('input', {
                                type: 'text',
                                className: 'form-control',
                                value: nuovoCondominio.amministratore_esterno,
                                onChange: (e) => setNuovoCondominio({ ...nuovoCondominio, amministratore_esterno: e.target.value }),
                                placeholder: 'Nome studio amministratore'
                            })
                        ),
                        React.createElement('div', { className: 'form-group', style: { flex: 1 } },
                            React.createElement('label', { className: 'form-label' }, 'Partita IVA'),
                            React.createElement('input', {
                                type: 'text',
                                className: 'form-control',
                                value: nuovoCondominio.partita_iva,
                                onChange: (e) => setNuovoCondominio({ ...nuovoCondominio, partita_iva: e.target.value }),
                                placeholder: 'IT12345678901'
                            })
                        )
                    ),

                    // IBAN e banca appoggio
                    React.createElement('div', { className: 'form-group' },
                        React.createElement('label', { className: 'form-label' }, 'IBAN Conto Corrente Condominio'),
                        React.createElement('input', {
                            type: 'text',
                            className: 'form-control',
                            value: nuovoCondominio.iban_condominio,
                            onChange: (e) => setNuovoCondominio({ ...nuovoCondominio, iban_condominio: e.target.value }),
                            placeholder: 'ITXX XXXX XXXX XXXX XXXX XXXX XXXX'
                        })
                    ),
                    React.createElement('div', { className: 'form-group' },
                        React.createElement('label', { className: 'form-label' }, 'Banca di Appoggio'),
                        React.createElement('input', {
                            type: 'text',
                            className: 'form-control',
                            value: nuovoCondominio.banca_appoggio,
                            onChange: (e) => setNuovoCondominio({ ...nuovoCondominio, banca_appoggio: e.target.value }),
                            placeholder: 'Nome banca di appoggio'
                        })
                    ),

                    // Descrizione edificio
                    React.createElement('div', { className: 'form-group' },
                        React.createElement('label', { className: 'form-label' }, 'Descrizione Edificio'),
                        React.createElement('textarea', {
                            className: 'form-control',
                            value: nuovoCondominio.descrizione_edificio,
                            onChange: (e) => setNuovoCondominio({ ...nuovoCondominio, descrizione_edificio: e.target.value }),
                            placeholder: 'Descrizione generale dell\'edificio, numero piani, tipo di costruzione, ecc.',
                            rows: 3
                        })
                    ),

                    // Note interne
                    React.createElement('div', { className: 'form-group' },
                        React.createElement('label', { className: 'form-label' }, 'Note Interne (per amministratore)'),
                        React.createElement('textarea', {
                            className: 'form-control',
                            value: nuovoCondominio.note_interne,
                            onChange: (e) => setNuovoCondominio({ ...nuovoCondominio, note_interne: e.target.value }),
                            placeholder: 'Note interne visibili solo all\'amministratore',
                            rows: 2
                        })
                    ),
                    React.createElement('div', { className: 'modal-footer' },
                        React.createElement('button', {
                            type: 'button',
                            className: 'btn btn-secondary',
                            onClick: () => setShowNuovoCondominio(false)
                        }, 'Annulla'),
                        React.createElement('button', {
                            type: 'submit',
                            className: 'btn btn-primary'
                        }, 'Crea Condominio')
                    )
                )
            )
        )
    );
};

// GESTIONE CONDOMINIO COMPONENT
const GestioneCondominio = ({ condominio, onBack }) => {
    const [activeSection, setActiveSection] = React.useState(null);
    const [message, setMessage] = React.useState({ type: '', text: '' });

    const menuItems = [
        { id: 'persone',       icon: '👤', title: 'GESTIONE PERSONE',      description: 'Aggiungi e modifica proprietari e inquilini' },
        { id: 'millesimi',     icon: '📊', title: 'MILLESIMI',             description: 'Gestisci tabelle millesimali A-L' },
        { id: 'spese',         icon: '🧾', title: 'GESTIONE SPESE',        description: 'Registra e gestisci le spese condominiali' },
        { id: 'ripartizione',  icon: '➗', title: 'CALCOLO RIPARTIZIONE',  description: 'Calcolo spese tra persone' },
        { id: 'preventivi',    icon: '📅', title: 'PREVENTIVO ANNUALE',    description: 'Gestisci preventivi e confronti con spese reali' },
        { id: 'anno-successivo', icon: '🔁', title: 'CALCOLO ANNO SUCCESSIVO', description: 'Conguagli e analisi storiche' }
    ];

    if (activeSection) {
        return React.createElement('div', { className: 'container' },
            React.createElement('div', { className: 'header' },
                React.createElement('button', {
                    className: 'btn btn-secondary',
                    onClick: () => setActiveSection(null)
                }, ' Indietro'),
                React.createElement('h1', null, `Condominio: ${condominio.nome}`)
            ),
            message.text && React.createElement('div', { className: `alert alert-${message.type}` }, message.text),
            React.createElement(SezioneCondominio, {
                section: activeSection,
                condominio: condominio,
                onBack: () => setActiveSection(null),
                showMessage: setMessage
            })
        );
    }

    return React.createElement('div', { className: 'container' },
        React.createElement('div', { className: 'header' },
            React.createElement('button', {
                className: 'btn btn-secondary',
                onClick: onBack
            }, ' Dashboard'),
            React.createElement('h1', null, `Condominio: ${condominio.nome}`)
        ),
        React.createElement('div', { className: 'condominio-menu' },
            menuItems.map(item =>
                React.createElement('div', {
                    key: item.id,
                    className: 'menu-item',
                    onClick: () => setActiveSection(item.id)
                },
                    React.createElement('div', { className: 'menu-icon' }, item.icon),
                    React.createElement('div', { className: 'menu-title' }, item.title),
                    React.createElement('div', { className: 'menu-description' }, item.description)
                )
            )
        )
    );
};

// SEZIONE CONDOMINIO COMPONENT
const SezioneCondominio = ({ section, condominio, onBack, showMessage }) => {
    switch (section) {
        case 'persone':
            return React.createElement(GestionePersone, { condominio, showMessage });
        case 'millesimi':
            return React.createElement(GestioneMillesimi, { condominio, showMessage });
        case 'spese':
            return React.createElement(GestioneSpese, { condominio, showMessage });
        case 'ripartizione':
            return React.createElement(CalcoloRipartizione, { condominio, showMessage });
        case 'preventivi':
            return React.createElement(PreventivoAnnuale, { condominio, showMessage });
        case 'anno-successivo':
            // Componente non ancora implementato
            return React.createElement('div', { className: 'container' },
                React.createElement('div', { className: 'header' },
                    React.createElement('button', {
                        className: 'btn btn-secondary',
                        onClick: onBack
                    }, ' Indietro'),
                    React.createElement('h1', null, `Calcolo Anno Successivo - ${condominio.nome}`)
                ),
                React.createElement('div', { className: 'card' },
                    React.createElement('div', { style: { textAlign: 'center', padding: '40px' } },
                        React.createElement('h2', { style: { color: '#666', marginBottom: '20px' } }, '🚧 Funzione in Sviluppo'),
                        React.createElement('p', { style: { color: '#888', marginBottom: '30px' } },
                            'Questa funzione per il calcolo dell\'anno successivo è in fase di sviluppo. Sarà disponibile prossimamente.'),
                        React.createElement('div', { style: {
                            background: '#f8f9fa',
                            padding: '20px',
                            borderRadius: '8px',
                            borderLeft: '4px solid #ffc107'
                        } },
                            React.createElement('h3', { style: { color: '#856404', marginBottom: '10px' } }, 'Cosa includerà:'),
                            React.createElement('ul', { style: { textAlign: 'left', color: '#666' } },
                                React.createElement('li', null, 'Conguagli tra preventivi e spese reali'),
                                React.createElement('li', null, 'Analisi storiche degli anni precedenti'),
                                React.createElement('li', null, 'Proiezioni per l\'anno successivo'),
                                React.createElement('li', null, 'Report dettagliati delle differenze')
                            )
                        )
                    )
                )
            );
        default:
            return React.createElement('div', { className: 'container' },
                React.createElement('div', { className: 'header' },
                    React.createElement('button', {
                        className: 'btn btn-secondary',
                        onClick: onBack
                    }, ' Indietro'),
                    React.createElement('h1', null, 'Errore')
                ),
                React.createElement('div', { className: 'card' },
                    React.createElement('div', { style: { textAlign: 'center', padding: '40px' } },
                        React.createElement('h2', { style: { color: '#dc3545' } }, '❌ Sezione non trovata'),
                        React.createElement('p', { style: { color: '#666' } }, 'La sezione richiesta non è disponibile.')
                    )
                )
            );
    }
};

// GESTIONE PERSONE COMPONENT
const GestionePersone = (props) => (window.GestionePersone ? window.GestionePersone(props) : React.createElement('div', { className: 'card' }, React.createElement('div', { style: { padding: '24px', textAlign: 'center' } }, 'Sezione non disponibile')));

// GESTIONE MILLESIMI COMPONENT
const GestioneMillesimi = (props) => (window.GestioneMillesimi ? window.GestioneMillesimi(props) : React.createElement('div', { className: 'card' }, React.createElement('div', { style: { padding: '24px', textAlign: 'center' } }, 'Sezione non disponibile')));

// GESTIONE SPESE COMPONENT
const GestioneSpese = (props) => (window.GestioneSpese ? window.GestioneSpese(props) : React.createElement('div', { className: 'card' }, React.createElement('div', { style: { padding: '24px', textAlign: 'center' } }, 'Sezione non disponibile')));

// CALCOLO RIPARTIZIONE COMPONENT
const CalcoloRipartizione = (props) => (window.CalcoloRipartizione ? window.CalcoloRipartizione(props) : React.createElement('div', { className: 'card' }, React.createElement('div', { style: { padding: '24px', textAlign: 'center' } }, 'Sezione non disponibile')));

// MAIN APP COMPONENT
const App = () => {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [selectedCondominio, setSelectedCondominio] = React.useState(null);

  React.useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch (e) {
        console.error('Error parsing user data:', e);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    setSelectedCondominio(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const handleSelectCondominio = (condominio) => {
    setSelectedCondominio(condominio);
  };

  const handleBackToDashboard = () => {
    setSelectedCondominio(null);
  };

  if (loading) {
    return React.createElement('div', { style: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      fontSize: '18px',
      color: '#666'
    }}, 'Caricamento...');
  }

  if (!user) {
    return React.createElement(Login, { onLogin: handleLogin });
  }

  if (selectedCondominio) {
    return React.createElement(GestioneCondominio, {
      condominio: selectedCondominio,
      onBack: handleBackToDashboard
    });
  }

  return React.createElement(Dashboard, {
    user,
    onLogout: handleLogout,
    onSelectCondominio: handleSelectCondominio
  });
};

// Initialize the app using ReactDOM
try {
  const rootElement = document.getElementById('root');
  if (rootElement && window.ReactDOM) {
    const root = window.ReactDOM.createRoot(rootElement);
    root.render(window.React.createElement(App));
    console.log('App initialized successfully');
  } else {
    console.error('Root element or ReactDOM not available');
  }
} catch (error) {
  console.error('Error initializing app:', error);
}



