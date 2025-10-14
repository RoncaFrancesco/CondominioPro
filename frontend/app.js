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

// Global 401 handler: auto-logout on expired/invalid session
(() => {
  if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (...args) => {
      const res = await originalFetch(...args);
      if (res && res.status === 401) {
        try {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        } catch (_) {}
        try { console.warn('Sessione scaduta, reindirizzo al login.'); } catch (_) {}
        setTimeout(() => {
          try { alert('Sessione scaduta. Effettua nuovamente il login.'); } catch (_) {}
          window.location.reload();
        }, 0);
      }
      return res;
    };
  }
})();

// Determina l'URL dell'API in modo dinamico
const DEFAULT_API_BASE = `${window.location.origin}/api`;
const API_BASE = window.API_BASE || window.__API_BASE__ ||
  ((['localhost', '127.0.0.1'].includes(window.location.hostname))
    ? 'http://localhost:5000/api'
    : DEFAULT_API_BASE);
console.log('API_BASE resolved to:', API_BASE);

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
        let json;
        try { json = await response.json(); } catch (_) { json = null; }
        if (!response.ok) {
            const msg = (json && json.message) ? json.message : `Errore ${response.status}`;
            throw new Error(msg);
        }
        return json;
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

    getAnalisiAnnoSuccessivo: async (condoId, annoRiferimento = null) => {
        const url = annoRiferimento
            ? `${API_BASE}/condominii/${condoId}/analisi-anno-successivo?anno_riferimento=${annoRiferimento}`
            : `${API_BASE}/condominii/${condoId}/analisi-anno-successivo`;
        const response = await fetch(url, {
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

// PREVENTIVO ANNUALE COMPONENT (semplificato temporaneamente per stabilit�)
// PREVENTIVO ANNUALE COMPONENT (completo)
const PreventivoAnnuale = ({ condominio, showMessage }) => {
    const [anno, setAnno] = React.useState(new Date().getFullYear() + 1);
    const [spesePreventivate, setSpesePreventivate] = React.useState([]);
    const [tabellaFilter, setTabellaFilter] = React.useState('');
    const [loading, setLoading] = React.useState(true);
    const [showModal, setShowModal] = React.useState(false);
    const [editing, setEditing] = React.useState(null);
    const [calcolo, setCalcolo] = React.useState(null);

    const [formData, setFormData] = React.useState({
        descrizione: '',
        importo: '',
        data_prevista: new Date().toISOString().split('T')[0],
        tabella_millesimi: 'A',
        logica_pi: 'proprietario',
        percentuale_proprietario: 100,
        percentuale_inquilino: 0,
        mese_previsto: ''
    });

    React.useEffect(() => {
        loadSpesePreventivate();
    }, [anno, condominio.id]);

    const loadSpesePreventivate = async () => {
        setLoading(true);
        try {
            const data = await api.getSpesePreventivate(condominio.id, anno);
            setSpesePreventivate(Array.isArray(data) ? data : []);
        } catch (err) {
            showMessage({ type: 'danger', text: 'Errore nel caricamento delle spese preventivate' });
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setEditing(null);
        setFormData({
            descrizione: '',
            importo: '',
            data_prevista: new Date().toISOString().split('T')[0],
            tabella_millesimi: 'A',
            logica_pi: 'proprietario',
            percentuale_proprietario: 100,
            percentuale_inquilino: 0,
            mese_previsto: ''
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const spesaData = {
                ...formData,
                importo: parseFloat(formData.importo),
                anno: anno,
                mese_previsto: formData.mese_previsto ? parseInt(formData.mese_previsto) : (formData.data_prevista ? parseInt(formData.data_prevista.split('-')[1]) : null),
                data_prevista: formData.data_prevista || null
            };
            let result;
            if (editing) {
                result = await api.updateSpesaPreventivata(editing.id, spesaData);
            } else {
                result = await api.createSpesaPreventivata(condominio.id, spesaData);
            }
            if (result && (result.spesa || result.message)) {
                showMessage({ type: 'success', text: editing ? 'Spesa preventivata aggiornata' : 'Spesa preventivata creata' });
                setShowModal(false);
                resetForm();
                loadSpesePreventivate();
            } else {
                showMessage({ type: 'danger', text: (result && result.message) || 'Errore nella richiesta' });
            }
        } catch (err) {
            showMessage({ type: 'danger', text: 'Errore di connessione al server' });
        }
    };

    const handleEdit = (spesa) => {
        setEditing(spesa);
        setFormData({
            descrizione: spesa.descrizione || '',
            importo: spesa.importo_previsto || spesa.importo || '',
            data_prevista: spesa.data_prevista || '',
            tabella_millesimi: spesa.tabella_millesimi || 'A',
            logica_pi: spesa.logica_pi || 'proprietario',
            percentuale_proprietario: spesa.percentuale_proprietario ?? 100,
            percentuale_inquilino: spesa.percentuale_inquilino ?? 0,
            mese_previsto: spesa.mese_previsto ? String(spesa.mese_previsto) : ''
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Eliminare questa spesa preventivata?')) return;
        try {
            const result = await api.deleteSpesaPreventivata(id);
            if (result && result.message) {
                showMessage({ type: 'success', text: 'Spesa preventivata eliminata' });
                loadSpesePreventivate();
            } else {
                showMessage({ type: 'danger', text: 'Errore nella cancellazione' });
            }
        } catch (err) {
            showMessage({ type: 'danger', text: 'Errore di connessione al server' });
        }
    };

    const calcolaPreventivo = async () => {
        setCalcolo(null);
        try {
            const data = await api.getCalcoloPreventivo(condominio.id, anno);
            setCalcolo(data);
        } catch (err) {
            showMessage({ type: 'danger', text: 'Errore nel calcolo del preventivo' });
        }
    };

    const visibleSpesePreventivate = tabellaFilter ? spesePreventivate.filter((sp) => sp.tabella_millesimi === tabellaFilter) : spesePreventivate;
    const totaleSpese = visibleSpesePreventivate.reduce((sum, sp) => sum + (sp.importo_previsto || 0), 0);
    if (loading) {
        return React.createElement('div', { className: 'loading' },
            React.createElement('div', { className: 'spinner' })
        );
    }

    return React.createElement('div', null,

        React.createElement('div', { className: 'stats-grid' },
            React.createElement('div', { className: 'stat-card' },
                React.createElement('div', { className: 'stat-value' }, spesePreventivate.length),
                React.createElement('div', { className: 'stat-label' }, 'Spese Previste')
            ),
            React.createElement('div', { className: 'stat-card' },
                React.createElement('div', { className: 'stat-value' }, formatCurrency(totaleSpese)),
                React.createElement('div', { className: 'stat-label' }, 'Totale Preventivato')
            ),
            React.createElement('div', { className: 'stat-card' },
                React.createElement('div', { className: 'stat-value' }, anno),
                React.createElement('div', { className: 'stat-label' }, 'Anno di Riferimento')
            )
        ),

        React.createElement('div', { className: 'card' },
            React.createElement('div', { className: 'card-header', style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
                React.createElement('h2', { className: 'card-title' }, 'Gestione Spese Preventivate'),
                React.createElement('div', { className: 'btn-group' },
                    React.createElement('select', { className: 'form-select', value: anno, onChange: (e) => setAnno(parseInt(e.target.value) || new Date().getFullYear()), style: { minWidth: '120px' } },
                        [0, 1, 2].map(offset => { const y = new Date().getFullYear() + offset; return React.createElement('option', { key: y, value: y }, y); })
                    ),
                    React.createElement('select', { className: 'form-select', value: tabellaFilter, onChange: (e) => setTabellaFilter(e.target.value), style: { minWidth: '130px' } },
                        React.createElement('option', { value: '' }, 'Tutte le tabelle'),
                        ['A','B','C','D','E','F','G','H','I','L'].map(t => React.createElement('option', { key: t, value: t }, t))
                    ),
                    React.createElement('button', { className: 'btn btn-secondary', onClick: loadSpesePreventivate }, 'Aggiorna'),
                    React.createElement('button', { className: 'btn btn-primary', onClick: () => { resetForm(); setShowModal(true); } }, 'Nuova Spesa'),
                    React.createElement('button', { className: 'btn btn-success', onClick: () => api.stampaPreventivo(condominio.id, anno, tabellaFilter || null) }, 'Stampa Word')
                )
            ),
            React.createElement('div', { className: 'table-container' },
                spesePreventivate.length === 0 ?
                    React.createElement('div', { className: 'alert alert-info' }, 'Nessuna spesa preventivata presente') :
                    React.createElement('table', { className: 'table' },
                        React.createElement('thead', null,
                            React.createElement('tr', null,
                                React.createElement('th', null, 'Descrizione'),
                                React.createElement('th', null, 'Importo'),
                                React.createElement('th', null, 'Tabella'),
                                React.createElement('th', null, 'Logica P/I'),
                                React.createElement('th', null, 'Data/Mese'),
                                React.createElement('th', null, 'Azioni')
                            )
                        ),
                        React.createElement('tbody', null,
                            visibleSpesePreventivate.map(spesa =>
                                React.createElement('tr', { key: spesa.id },
                                    React.createElement('td', null, spesa.descrizione),
                                    React.createElement('td', null, formatCurrency(spesa.importo_previsto || spesa.importo)),
                                    React.createElement('td', null,
                                        React.createElement('span', { className: 'badge bg-info' }, spesa.tabella_millesimi)
                                    ),
                                    React.createElement('td', null,
                                        React.createElement('span', { className: 'badge bg-secondary' }, spesa.logica_pi)
                                    ),
                                    React.createElement('td', null,
                                        spesa.data_prevista ? formatDate(spesa.data_prevista) : (spesa.mese_previsto ? `Mese ${spesa.mese_previsto}` : '-')
                                    ),
                                    React.createElement('td', null,
                                        React.createElement('div', { className: 'btn-group' },
                                            React.createElement('button', { className: 'btn btn-sm btn-secondary', onClick: () => handleEdit(spesa) }, 'Modifica'),
                                            React.createElement('button', { className: 'btn btn-sm btn-danger', onClick: () => handleDelete(spesa.id) }, 'Elimina')
                                        )
                                    )
                                )
                            )
                        )
                    )
            )
        ),

        calcolo && React.createElement('div', { className: 'card' },
            React.createElement('div', { className: 'card-header' },
                React.createElement('h2', { className: 'card-title' }, 'Ripartizione Preventivo')
            ),
            React.createElement('div', { className: 'card-body' },
                React.createElement('div', { className: 'ripartizione-summary' },
                    React.createElement('div', { className: 'total-amount' }, formatCurrency(calcolo.totale || 0)),
                    React.createElement('div', { className: 'total-label' }, 'Importo Totale da Ripartire')
                ),
                React.createElement('div', { className: 'ripartizione-details' },
                    React.createElement('h3', { style: { marginBottom: '20px' } }, 'Dettaglio Ripartizione per Persona'),
                    (calcolo.ripartizione || []).map(p =>
                        React.createElement('div', { key: `${p.persona_id}-${p.numero_unita || ''}` },
                            `${p.nome} ${p.cognome} (${p.tipo_persona}) - Unità ${p.numero_unita || '-'}: ${formatCurrency(p.importo_dovuto)}`
                        )
                    )
                )
            )
        ),

        // Modal CRUD spesa preventivata
        showModal && React.createElement('div', { className: 'modal active' },
            React.createElement('div', { className: 'modal-content' },
                React.createElement('div', { className: 'modal-header' },
                    React.createElement('h3', { className: 'modal-title' }, editing ? 'Modifica Spesa Preventiva' : 'Nuova Spesa Preventiva'),
                    React.createElement('button', { className: 'modal-close', onClick: () => setShowModal(false) }, 'x')
                ),
                React.createElement('form', { onSubmit: handleSubmit },
                    React.createElement('div', { className: 'form-group' },
                        React.createElement('label', { className: 'form-label' }, 'Descrizione *'),
                        React.createElement('input', {
                            type: 'text', className: 'form-control', value: formData.descrizione,
                            onChange: (e) => setFormData({ ...formData, descrizione: e.target.value }), required: true
                        })
                    ),
                    React.createElement('div', { className: 'form-group' },
                        React.createElement('label', { className: 'form-label' }, 'Importo Previsto (EUR) *'),
                        React.createElement('input', {
                            type: 'number', className: 'form-control', value: formData.importo,
                            onChange: (e) => setFormData({ ...formData, importo: e.target.value }), step: '0.01', min: '0.01', required: true
                        })
                    ),
                    React.createElement('div', { className: 'form-group' },
                        React.createElement('label', { className: 'form-label' }, 'Data Prevista *'),
                        React.createElement('input', {
                            type: 'date', className: 'form-control', value: formData.data_prevista,
                            onChange: (e) => setFormData({ ...formData, data_prevista: e.target.value, mese_previsto: e.target.value ? e.target.value.split('-')[1] : '' }), required: true
                        })
                    ),
                    React.createElement('div', { className: 'form-row' },
                        React.createElement('div', { className: 'form-group' },
                            React.createElement('label', { className: 'form-label' }, 'Tabella Millesimi *'),
                            React.createElement('select', {
                                className: 'form-select', value: formData.tabella_millesimi,
                                onChange: (e) => setFormData({ ...formData, tabella_millesimi: e.target.value }), required: true
                            },
                                ['A','B','C','D','E','F','G','H','I','L'].map(tab =>
                                    React.createElement('option', { key: tab, value: tab }, `Tabella ${tab}`)
                                )
                            )
                        ),
                        React.createElement('div', { className: 'form-group' },
                            React.createElement('label', { className: 'form-label' }, 'Logica P/I *'),
                            React.createElement('select', {
                                className: 'form-select', value: formData.logica_pi,
                                onChange: (e) => setFormData({ ...formData, logica_pi: e.target.value }), required: true
                            },
                                React.createElement('option', { value: 'proprietario' }, '100% Proprietario'),
                                React.createElement('option', { value: 'inquilino' }, '100% Inquilino'),
                                React.createElement('option', { value: '50/50' }, '50/50'),
                                React.createElement('option', { value: 'personalizzato' }, 'Personalizzato')
                            )
                        )
                    ),
                    formData.logica_pi === 'personalizzato' && React.createElement('div', { className: 'form-row' },
                        React.createElement('div', { className: 'form-group' },
                            React.createElement('label', { className: 'form-label' }, '% Proprietario'),
                            React.createElement('input', {
                                type: 'number', className: 'form-control', value: formData.percentuale_proprietario,
                                onChange: (e) => setFormData({ ...formData, percentuale_proprietario: parseInt(e.target.value) || 0 }), min: '0', max: '100'
                            })
                        ),
                        React.createElement('div', { className: 'form-group' },
                            React.createElement('label', { className: 'form-label' }, '% Inquilino'),
                            React.createElement('input', {
                                type: 'number', className: 'form-control', value: formData.percentuale_inquilino,
                                onChange: (e) => setFormData({ ...formData, percentuale_inquilino: parseInt(e.target.value) || 0 }), min: '0', max: '100'
                            })
                        )
                    ),
                    React.createElement('div', { className: 'modal-footer' },
                        React.createElement('button', { type: 'button', className: 'btn btn-secondary', onClick: () => setShowModal(false) }, 'Annulla'),
                        React.createElement('button', { type: 'submit', className: 'btn btn-primary' }, editing ? 'Salva' : 'Crea')
                    )
                )
            )
        )
    );
};

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
            if (Array.isArray(data)) {
                setCondominii(data);
            } else {
                setCondominii([]);
                setMessage({ type: 'warning', text: (data && data.message) ? data.message : 'Nessun dato disponibile' });
            }
        } catch (err) {
            setCondominii([]);
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

// CALCOLO ANNO SUCCESSIVO COMPONENT
const CalcoloAnnoSuccessivo = ({ condominio, showMessage }) => {
    const [annoRiferimento, setAnnoRiferimento] = React.useState(new Date().getFullYear());
    const [analisi, setAnalisi] = React.useState(null);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState(null);

    React.useEffect(() => {
        if (condominio && condominio.id) {
            caricaAnalisi();
        }
    }, [condominio, annoRiferimento]);

    const caricaAnalisi = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await api.getAnalisiAnnoSuccessivo(condominio.id, annoRiferimento);
            if (result.message && result.data) {
                setAnalisi(result.data);
            } else {
                setError('Dati non disponibili');
            }
        } catch (err) {
            console.error('Errore caricamento analisi:', err);
            setError(err.message || 'Errore nel caricamento dei dati');
        } finally {
            setLoading(false);
        }
    };

    const getTipoPersonaLabel = (tipo) => {
        switch (tipo) {
            case 'proprietario': return 'Proprietario';
            case 'inquilino': return 'Inquilino';
            case 'proprietario_inquilino': return 'Proprietario/Inquilino';
            default: return tipo;
        }
    };

    const getTipoPersonaColor = (tipo) => {
        switch (tipo) {
            case 'proprietario': return '#007bff';
            case 'inquilino': return '#28a745';
            case 'proprietario_inquilino': return '#6f42c1';
            default: return '#6c757d';
        }
    };

    if (loading) {
        return React.createElement('div', { className: 'container' },
            React.createElement('div', { className: 'header' },
                React.createElement('h1', null, `Calcolo Anno Successivo - ${condominio.nome}`)
            ),
            React.createElement('div', { className: 'card', style: { textAlign: 'center', padding: '40px' } },
                React.createElement('div', { className: 'loading' }, '⏳ Caricamento analisi...')
            )
        );
    }

    if (error) {
        return React.createElement('div', { className: 'container' },
            React.createElement('div', { className: 'header' },
                React.createElement('button', {
                    className: 'btn btn-secondary',
                    onClick: () => window.location.reload()
                }, ' Indietro'),
                React.createElement('h1', null, `Calcolo Anno Successivo - ${condominio.nome}`)
            ),
            React.createElement('div', { className: 'card' },
                React.createElement('div', { style: { textAlign: 'center', padding: '40px' } },
                    React.createElement('h2', { style: { color: '#dc3545' } }, '❌ Errore'),
                    React.createElement('p', { style: { color: '#666' } }, error),
                    React.createElement('button', {
                        className: 'btn btn-primary',
                        onClick: caricaAnalisi
                    }, 'Riprova')
                )
            )
        );
    }

    if (!analisi) {
        return React.createElement('div', { className: 'container' },
            React.createElement('div', { className: 'header' },
                React.createElement('button', {
                    className: 'btn btn-secondary',
                    onClick: () => window.location.reload()
                }, ' Indietro'),
                React.createElement('h1', null, `Calcolo Anno Successivo - ${condominio.nome}`)
            ),
            React.createElement('div', { className: 'card' },
                React.createElement('div', { style: { textAlign: 'center', padding: '40px' } },
                    React.createElement('p', { style: { color: '#666' } }, 'Nessun dato disponibile')
                )
            )
        );
    }

    return React.createElement('div', { className: 'container' },
        React.createElement('div', { className: 'header' },
            React.createElement('button', {
                className: 'btn btn-secondary',
                onClick: () => window.location.reload()
            }, ' Indietro'),
            React.createElement('h1', null, `Calcolo Anno Successivo - ${condominio.nome}`)
        ),

        // Controlli
        React.createElement('div', { className: 'card' },
            React.createElement('h2', null, '⚙️ Parametri di Calcolo'),
            React.createElement('div', { style: { display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' } },
                React.createElement('div', null,
                    React.createElement('label', { htmlFor: 'annoRiferimento' }, 'Anno di Riferimento:'),
                    React.createElement('input', {
                        type: 'number',
                        id: 'annoRiferimento',
                        value: annoRiferimento,
                        onChange: (e) => setAnnoRiferimento(parseInt(e.target.value)),
                        min: '2020',
                        max: '2030',
                        style: { marginLeft: '10px', padding: '5px' }
                    })
                ),
                React.createElement('div', { style: { flex: 1, textAlign: 'right' } },
                    React.createElement('button', {
                        className: 'btn btn-primary',
                        onClick: caricaAnalisi,
                        disabled: loading
                    }, loading ? '⏳ Calcolo...' : '🔄 Ricalcola')
                )
            )
        ),

        // Riepilogo Generale
        React.createElement('div', { className: 'card' },
            React.createElement('h2', null, '📊 Riepilogo Analisi'),
            React.createElement('div', { style: {
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '20px',
                marginBottom: '20px'
            } },
                React.createElement('div', { style: {
                    background: '#e3f2fd',
                    padding: '15px',
                    borderRadius: '8px',
                    textAlign: 'center'
                } },
                    React.createElement('h3', { style: { margin: '0 0 10px 0', color: '#1976d2' } }, 'Anno Successivo'),
                    React.createElement('div', { style: { fontSize: '24px', fontWeight: 'bold' } }, analisi.anno_successivo)
                ),
                React.createElement('div', { style: {
                    background: '#f3e5f5',
                    padding: '15px',
                    borderRadius: '8px',
                    textAlign: 'center'
                } },
                    React.createElement('h3', { style: { margin: '0 0 10px 0', color: '#7b1fa2' } }, 'Anno Riferimento'),
                    React.createElement('div', { style: { fontSize: '24px', fontWeight: 'bold' } }, analisi.anno_riferimento)
                ),
                React.createElement('div', { style: {
                    background: '#e8f5e8',
                    padding: '15px',
                    borderRadius: '8px',
                    textAlign: 'center'
                } },
                    React.createElement('h3', { style: { margin: '0 0 10px 0', color: '#2e7d32' } }, 'Totale Preventivato'),
                    React.createElement('div', { style: { fontSize: '24px', fontWeight: 'bold', color: '#2e7d32' } }, formatCurrency(analisi.totale_previsto))
                ),
                React.createElement('div', { style: {
                    background: '#fff3e0',
                    padding: '15px',
                    borderRadius: '8px',
                    textAlign: 'center'
                } },
                    React.createElement('h3', { style: { margin: '0 0 10px 0', color: '#f57c00' } }, 'Fonte Dati'),
                    React.createElement('div', { style: { fontSize: '16px', fontWeight: 'bold' } }, analisi.fonte_dati.replace('_', ' '))
                )
            ),
            React.createElement('div', { style: {
                background: '#f8f9fa',
                padding: '15px',
                borderRadius: '8px',
                borderLeft: '4px solid #17a2b8'
            } },
                React.createElement('p', { style: { margin: 0, color: '#495057' } }, '📝 ', analisi.note)
            )
        ),

        // Statistiche Generali
        React.createElement('div', { className: 'card' },
            React.createElement('h2', null, '📈 Statistiche Generali'),
            React.createElement('div', { style: {
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '20px'
            } },
                React.createElement('div', { style: {
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    padding: '20px',
                    borderRadius: '12px',
                    textAlign: 'center'
                } },
                    React.createElement('h4', { style: { margin: '0 0 15px 0' } }, 'Totale Proprietari'),
                    React.createElement('div', { style: { fontSize: '28px', fontWeight: 'bold' } }, formatCurrency(analisi.riepilogo.totale_proprietari)),
                    React.createElement('div', { style: { fontSize: '14px', opacity: 0.9 } }, `${analisi.riepilogo.numero_proprietari} proprietari`)
                ),
                React.createElement('div', { style: {
                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    color: 'white',
                    padding: '20px',
                    borderRadius: '12px',
                    textAlign: 'center'
                } },
                    React.createElement('h4', { style: { margin: '0 0 15px 0' } }, 'Totale Inquilini'),
                    React.createElement('div', { style: { fontSize: '28px', fontWeight: 'bold' } }, formatCurrency(analisi.riepilogo.totale_inquilini)),
                    React.createElement('div', { style: { fontSize: '14px', opacity: 0.9 } }, `${analisi.riepilogo.numero_inquilini} inquilini`)
                ),
                React.createElement('div', { style: {
                    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                    color: 'white',
                    padding: '20px',
                    borderRadius: '12px',
                    textAlign: 'center'
                } },
                    React.createElement('h4', { style: { margin: '0 0 15px 0' } }, 'Media per Proprietario'),
                    React.createElement('div', { style: { fontSize: '28px', fontWeight: 'bold' } }, formatCurrency(analisi.riepilogo.media_per_proprietario))
                ),
                React.createElement('div', { style: {
                    background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                    color: 'white',
                    padding: '20px',
                    borderRadius: '12px',
                    textAlign: 'center'
                } },
                    React.createElement('h4', { style: { margin: '0 0 15px 0' } }, 'Media per Inquilino'),
                    React.createElement('div', { style: { fontSize: '28px', fontWeight: 'bold' } }, formatCurrency(analisi.riepilogo.media_per_inquilino))
                )
            )
        ),

        // Analisi per Persona
        analisi.analisi_per_persona && analisi.analisi_per_persona.length > 0 ?
        React.createElement('div', { className: 'card' },
            React.createElement('h2', null, '👥 Analisi per Persona'),
            React.createElement('div', { style: { overflowX: 'auto' } },
                React.createElement('table', {
                    className: 'table table-striped',
                    style: { minWidth: '800px', fontSize: '14px' }
                },
                    React.createElement('thead', null,
                        React.createElement('tr', null,
                            React.createElement('th', null, 'Unità'),
                            React.createElement('th', null, 'Nome'),
                            React.createElement('th', null, 'Tipo'),
                            React.createElement('th', { style: { textAlign: 'right' } }, 'Importo Totale'),
                            React.createElement('th', null, 'Dettaglio Tabelle')
                        )
                    ),
                    React.createElement('tbody', null,
                        analisi.analisi_per_persona.map((persona, idx) =>
                            React.createElement('tr', { key: persona.persona_id },
                                React.createElement('td', { style: { fontWeight: 'bold' } }, persona.numero_unita),
                                React.createElement('td', null, `${persona.cognome} ${persona.nome}`),
                                React.createElement('td', null,
                                    React.createElement('span', {
                                        style: {
                                            background: getTipoPersonaColor(persona.tipo_persona),
                                            color: 'white',
                                            padding: '3px 8px',
                                            borderRadius: '12px',
                                            fontSize: '12px',
                                            fontWeight: 'bold'
                                        }
                                    }, getTipoPersonaLabel(persona.tipo_persona))
                                ),
                                React.createElement('td', {
                                    style: {
                                        textAlign: 'right',
                                        fontWeight: 'bold',
                                        fontSize: '16px',
                                        color: '#2c3e50'
                                    } }, formatCurrency(persona.importo_totale)),
                                React.createElement('td', null,
                                    React.createElement('div', { style: { fontSize: '12px' } },
                                        persona.dettaglio_tabelle.map(dettaglio =>
                                            React.createElement('span', {
                                                key: dettaglio.tabella,
                                                style: {
                                                    display: 'inline-block',
                                                    margin: '2px',
                                                    padding: '2px 6px',
                                                    background: '#e9ecef',
                                                    borderRadius: '4px',
                                                    fontSize: '11px'
                                                }
                                            }, `${dettaglio.tabella}: ${formatCurrency(dettaglio.importo)}`)
                                        )
                                    )
                                )
                            )
                        )
                    )
                )
            )
        ) : null,

        // Analisi per Tabella
        Object.keys(analisi.analisi_per_tabella).length > 0 ?
        React.createElement('div', { className: 'card' },
            React.createElement('h2', null, '📋 Analisi per Tabella Millesimi'),
            Object.entries(analisi.analisi_per_tabella).map(([tabella, dati]) =>
                React.createElement('div', {
                    key: tabella,
                    style: {
                        marginBottom: '30px',
                        padding: '20px',
                        border: '1px solid #dee2e6',
                        borderRadius: '8px',
                        background: '#f8f9fa'
                    } },
                    React.createElement('h3', { style: {
                        color: '#495057',
                        marginBottom: '15px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    } },
                        `Tabella Millesimi: ${tabella}`,
                        React.createElement('span', {
                            style: {
                                background: '#007bff',
                                color: 'white',
                                padding: '5px 10px',
                                borderRadius: '15px',
                                fontSize: '14px',
                                fontWeight: 'bold'
                            }
                        }, `Totale: ${formatCurrency(dati.totale_tabella)}`)
                    ),
                    React.createElement('div', { style: { overflowX: 'auto' } },
                        React.createElement('table', {
                            className: 'table table-sm',
                            style: { fontSize: '13px' }
                        },
                            React.createElement('thead', null,
                                React.createElement('tr', null,
                                    React.createElement('th', null, 'Unità'),
                                    React.createElement('th', null, 'Nome'),
                                    React.createElement('th', null, 'Tipo'),
                                    React.createElement('th', { style: { textAlign: 'right' } }, 'Importo')
                                )
                            ),
                            React.createElement('tbody', null,
                                dati.ripartizioni.map((rip) =>
                                    React.createElement('tr', { key: rip.persona_id },
                                        React.createElement('td', null, rip.numero_unita),
                                        React.createElement('td', null, `${rip.cognome} ${rip.nome}`),
                                        React.createElement('td', null,
                                            React.createElement('span', {
                                                style: {
                                                    background: getTipoPersonaColor(rip.tipo_persona),
                                                    color: 'white',
                                                    padding: '2px 6px',
                                                    borderRadius: '8px',
                                                    fontSize: '11px',
                                                    fontWeight: 'bold'
                                                }
                                            }, getTipoPersonaLabel(rip.tipo_persona))
                                        ),
                                        React.createElement('td', {
                                            style: { textAlign: 'right', fontWeight: 'bold' }
                                        }, formatCurrency(rip.importo_tabella))
                                    )
                                )
                            )
                        )
                    )
                )
            )
        ) : null
    );
};

// GESTIONE PERSONE COMPONENT
const GestionePersone = ({ condominio, showMessage }) => {
    const [persone, setPersone] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [showModal, setShowModal] = React.useState(false);
    const [formData, setFormData] = React.useState({
        nome: '',
        cognome: '',
        email: '',
        tipo_persona: 'proprietario',
        unita_id: ''
    });
    const [editing, setEditing] = React.useState(null);

    React.useEffect(() => {
        loadPersone();
    }, []);

    const loadPersone = async () => {
        try {
            const data = await api.getPersone(condominio.id);
            setPersone(data);
        } catch (err) {
            showMessage({ type: 'danger', text: 'Errore nel caricamento delle persone' });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            let result;
            if (editing) {
                // Modifica persona esistente
                result = await api.updatePersona(editing.id, formData);
                if (result.persona) {
                    showMessage({ type: 'success', text: 'Persona modificata con successo!' });
                }
            } else {
                // Crea nuova persona
                result = await api.createPersona(condominio.id, formData);
                if (result.persona) {
                    showMessage({ type: 'success', text: 'Persona creata con successo!' });
                }
            }

            if (result.persona) {
                setShowModal(false);
                setEditing(null);
                setFormData({ nome: '', cognome: '', email: '', tipo_persona: 'proprietario', unita_id: '' });
                loadPersone();
            } else {
                showMessage({ type: 'danger', text: result.message || 'Errore nel salvataggio' });
            }
        } catch (err) {
            showMessage({ type: 'danger', text: 'Errore di connessione al server' });
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Sei sicuro di voler eliminare questa persona?')) return;

        try {
            const result = await api.deletePersona(id);
            if (result.message) {
                showMessage({ type: 'success', text: 'Persona eliminata con successo!' });
                loadPersone();
            } else {
                showMessage({ type: 'danger', text: 'Errore nell\'eliminazione' });
            }
        } catch (err) {
            showMessage({ type: 'danger', text: 'Errore di connessione al server' });
        }
    };

    if (loading) {
        return React.createElement('div', { className: 'loading' },
            React.createElement('div', { className: 'spinner' })
        );
    }

    return React.createElement('div', null,
        React.createElement('div', { className: 'card' },
            React.createElement('div', { className: 'card-header' },
                React.createElement('h2', { className: 'card-title' }, ' Gestione Persone'),
                React.createElement('button', {
                    className: 'btn btn-primary',
                    onClick: () => setShowModal(true)
                }, ' Aggiungi Persona')
            ),
            React.createElement('div', { className: 'table-container' },
                persone.length === 0 ?
                    React.createElement('p', { style: { textAlign: 'center', color: '#666' } }, 'Nessuna persona registrata') :
                    React.createElement('table', { className: 'table' },
                        React.createElement('thead', null,
                            React.createElement('tr', null,
                                React.createElement('th', null, 'Nome'),
                                React.createElement('th', null, 'Cognome'),
                                React.createElement('th', null, 'Email'),
                                React.createElement('th', null, 'Tipo'),
                        React.createElement('th', null, 'Unità'),
                                React.createElement('th', null, 'Azioni')
                            )
                        ),
                        React.createElement('tbody', null,
                            persone.map(persona =>
                                React.createElement('tr', { key: persona.id },
                                    React.createElement('td', null, persona.nome),
                                    React.createElement('td', null, persona.cognome),
                                    React.createElement('td', null, persona.email || '-'),
                                    React.createElement('td', null,
                                        React.createElement('span', {
                                            className: `badge ${persona.tipo_persona === 'proprietario' ? 'bg-primary' : 'bg-secondary'}`
                                        }, persona.tipo_persona)
                                    ),
                                    React.createElement('td', null, `Unità ${persona.unita_id}`),
                                    React.createElement('td', null,
                                        React.createElement('div', { className: 'table-actions' },
                                            React.createElement('button', {
                                                className: 'btn btn-sm btn-warning',
                                                onClick: () => {
                                                    setEditing(persona);
                                                    setFormData(persona);
                                                    setShowModal(true);
                                                }
                                            }, ''),
                                            React.createElement('button', {
                                                className: 'btn btn-sm btn-danger',
                                                onClick: () => handleDelete(persona.id)
                                            }, '')
                                        )
                                    )
                                )
                            )
                        )
                    )
            )
        ),

        // Modal per aggiungere/modificare persona
        showModal && React.createElement('div', { className: 'modal active' },
            React.createElement('div', { className: 'modal-content' },
                React.createElement('div', { className: 'modal-header' },
                    React.createElement('h3', { className: 'modal-title' },
                        editing ? 'Modifica Persona' : 'Nuova Persona'
                    ),
                    React.createElement('button', { className: 'modal-close', onClick: () => setShowModal(false) }, 'x')

                ),
                React.createElement('form', { onSubmit: handleSubmit },
                    React.createElement('div', { className: 'form-group' },
                        React.createElement('label', { className: 'form-label' }, 'Nome *'),
                        React.createElement('input', {
                            type: 'text',
                            className: 'form-control',
                            value: formData.nome,
                            onChange: (e) => setFormData({ ...formData, nome: e.target.value }),
                            required: true
                        })
                    ),
                    React.createElement('div', { className: 'form-group' },
                        React.createElement('label', { className: 'form-label' }, 'Cognome *'),
                        React.createElement('input', {
                            type: 'text',
                            className: 'form-control',
                            value: formData.cognome,
                            onChange: (e) => setFormData({ ...formData, cognome: e.target.value }),
                            required: true
                        })
                    ),
                    React.createElement('div', { className: 'form-group' },
                        React.createElement('label', { className: 'form-label' }, 'Email'),
                        React.createElement('input', {
                            type: 'email',
                            className: 'form-control',
                            value: formData.email,
                            onChange: (e) => setFormData({ ...formData, email: e.target.value })
                        })
                    ),
                    React.createElement('div', { className: 'form-group' },
                        React.createElement('label', { className: 'form-label' }, 'Tipo Persona *'),
                        React.createElement('select', {
                            className: 'form-select',
                            value: formData.tipo_persona,
                            onChange: (e) => setFormData({ ...formData, tipo_persona: e.target.value }),
                            required: true
                        },
                            React.createElement('option', { value: 'proprietario' }, 'Proprietario'),
                            React.createElement('option', { value: 'inquilino' }, 'Inquilino'),
                            React.createElement('option', { value: 'proprietario_inquilino' }, 'Proprietario/Inquilino')
                        )
                    ),
                    React.createElement('div', { className: 'form-group' },
                        React.createElement('label', { className: 'form-label' }, 'Unità Immobiliare *'),
                        React.createElement('select', {
                            className: 'form-select',
                            value: formData.unita_id,
                            onChange: (e) => setFormData({ ...formData, unita_id: parseInt(e.target.value) }),
                            required: true
                        },
                            React.createElement('option', { value: '' }, 'Seleziona unità'),
                            Array.from({ length: condominio.num_unita }, (_, i) =>
                                React.createElement('option', { key: i + 1, value: i + 1 }, `Unità ${i + 1}`)
                            )
                        )
                    ),
                    React.createElement('div', { className: 'modal-footer' },
                        React.createElement('button', {
                            type: 'button',
                            className: 'btn btn-secondary',
                            onClick: () => setShowModal(false)
                        }, 'Annulla'),
                        React.createElement('button', {
                            type: 'submit',
                            className: 'btn btn-primary'
                        }, editing ? 'Modifica' : 'Crea')
                    )
                )
            )
        )
    );
};

// GESTIONE MILLESIMI COMPONENT
const GestioneMillesimi = ({ condominio, showMessage }) => {
    const [millesimi, setMillesimi] = React.useState({});
    const [selectedTabella, setSelectedTabella] = React.useState('A');
    const [loading, setLoading] = React.useState(true);
    const [editingMillesimi, setEditingMillesimi] = React.useState({});
    const [showCopyModal, setShowCopyModal] = React.useState(false);

    React.useEffect(() => {
        loadMillesimi();
    }, [selectedTabella]);

    const loadMillesimi = async () => {
        try {
            const data = await api.getMillesimi(condominio.id);
            setMillesimi(data);

            // Inizializza form di editing
            const editing = {};
            if (data[selectedTabella]) {
                data[selectedTabella].forEach(m => {
                    editing[m.unita_id] = m.valore;
                });
            }
            setEditingMillesimi(editing);
        } catch (err) {
            showMessage({ type: 'danger', text: 'Errore nel caricamento dei millesimi' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        const millesimiList = Object.entries(editingMillesimi).map(([unita_id, valore]) => ({
            unita_id: parseInt(unita_id),
            valore: parseInt(valore)
        }));

        const totale = millesimiList.reduce((sum, m) => sum + m.valore, 0);
        if (totale !== 1000) {
            showMessage({ type: 'danger', text: `Il totale dei millesimi deve essere 1000 (attuale: ${totale})` });
            return;
        }

        try {
            const result = await api.saveMillesimi(condominio.id, {
                tabella: selectedTabella,
                millesimi: millesimiList
            });
            if (result.message) {
                showMessage({ type: 'success', text: 'Millesimi salvati con successo!' });
                loadMillesimi();
            } else {
                showMessage({ type: 'danger', text: result.message || 'Errore nel salvataggio' });
            }
        } catch (err) {
            showMessage({ type: 'danger', text: 'Errore di connessione al server' });
        }
    };

    const handleCopy = () => {
        setShowCopyModal(true);
    };

    const handleCopyConfirm = async (destinazioneTabella) => {
        setShowCopyModal(false);

        if (!destinazioneTabella || destinazioneTabella === selectedTabella) {
            showMessage({ type: 'warning', text: 'Seleziona una tabella diversa da quella corrente.' });
            return;
        }

        // Copia i millesimi
        try {
            const result = await api.saveMillesimi(condominio.id, {
                tabella: destinazioneTabella,
                millesimi: Object.entries(editingMillesimi).map(([unita_id, valore]) => ({
                    unita_id: parseInt(unita_id),
                    valore: parseInt(valore)
                }))
            });

            if (result.message) {
                showMessage({ type: 'success', text: `Millesimi copiati con successo dalla tabella ${selectedTabella} alla tabella ${destinazioneTabella}!` });
                // Carica i millesimi per aggiornare l'interfaccia
                loadMillesimi();
                // Cambia alla tabella di destinazione
                setSelectedTabella(destinazioneTabella);
            } else {
                showMessage({ type: 'danger', text: result.message || 'Errore nella copia' });
            }
        } catch (err) {
            showMessage({ type: 'danger', text: 'Errore di connessione al server' });
        }
    };

    const totaleMillesimi = Object.values(editingMillesimi).reduce((sum, val) => sum + (parseInt(val) || 0), 0);

    if (loading) {
        return React.createElement('div', { className: 'loading' },
            React.createElement('div', { className: 'spinner' })
        );
    }

    return React.createElement('div', null,
        React.createElement('div', { className: 'card' },
            React.createElement('div', { className: 'card-header' },
                React.createElement('h2', { className: 'card-title' }, ' Gestione Millesimi'),
                React.createElement('div', { className: 'form-group', style: { marginBottom: 0, minWidth: '200px' } },
                    React.createElement('select', {
                        className: 'form-select',
                        value: selectedTabella,
                        onChange: (e) => setSelectedTabella(e.target.value)
                    },
                        ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'L'].map(tabella =>
                            React.createElement('option', { key: tabella, value: tabella }, `Tabella ${tabella}`)
                        )
                    )
                )
            ),
            React.createElement('div', null,
                React.createElement('p', { style: { marginBottom: '20px', color: '#666' } },
                    `Configura i millesimi per la Tabella ${selectedTabella}. Ogni unità deve avere un valore e il totale deve essere 1000.`
                ),
                React.createElement('div', { className: 'millesimi-grid' },
                    Array.from({ length: condominio.num_unita }, (_, i) => {
                        const unitaId = i + 1;
                        return React.createElement('div', { key: unitaId, className: 'millesimo-input' },
                            React.createElement('label', { className: 'form-label' }, `Unità ${unitaId}`),
                            React.createElement('input', {
                                type: 'number',
                                className: 'form-control',
                                value: editingMillesimi[unitaId] || '',
                                onChange: (e) => setEditingMillesimi({
                                    ...editingMillesimi,
                                    [unitaId]: parseInt(e.target.value) || 0
                                }),
                                min: '0',
                                max: '1000'
                            })
                        );
                    })
                ),
                React.createElement('div', { className: `millesimi-total ${totaleMillesimi === 1000 ? 'valid' : 'invalid'}` },
                    React.createElement('div', null, `Totale: ${totaleMillesimi} / 1000`),
                    React.createElement('div', { style: { fontSize: '14px', marginTop: '4px' } },
                        totaleMillesimi === 1000 ? ' Valido' : ' Non valido'
                    )
                ),
                React.createElement('div', { style: { marginTop: '24px' } },
                    React.createElement('div', { style: { display: 'flex', gap: '10px' } },
                        React.createElement('button', {
                            className: 'btn btn-primary',
                            onClick: handleSave,
                            disabled: totaleMillesimi !== 1000
                        }, ' Salva Millesimi'),
                        React.createElement('button', {
                            className: 'btn btn-secondary',
                            onClick: handleCopy,
                            disabled: totaleMillesimi !== 1000
                        }, ' Copia in altra tabella')
                    )
                )
            )
        ),

        // Modal per copia millesimi
        showCopyModal && React.createElement('div', { className: 'modal active' },
            React.createElement('div', { className: 'modal-content' },
                React.createElement('div', { className: 'modal-header' },
                    React.createElement('h3', { className: 'modal-title' }, 'Copia Millesimi'),

                    React.createElement('button', { className: 'modal-close', onClick: () => setShowCopyModal(false) }, 'x')
                ),
                React.createElement('div', { style: { marginBottom: '20px' } },
                    React.createElement('p', { style: { color: '#666' } },
                        `Copia i millesimi dalla Tabella ${selectedTabella} a un'altra tabella.`
                    )
                ),
                React.createElement('div', { className: 'form-group' },
                    React.createElement('label', { className: 'form-label' }, 'Tabella di Destinazione *'),
                    React.createElement('select', {
                        className: 'form-select',
                        onChange: (e) => {
                            if (e.target.value && e.target.value !== selectedTabella) {
                                handleCopyConfirm(e.target.value);
                            }
                        },
                        defaultValue: ''
                    },
                        React.createElement('option', { value: '', disabled: true }, 'Seleziona tabella di destinazione'),
                        ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'L']
                            .filter(tabella => tabella !== selectedTabella)
                            .map(tabella =>
                                React.createElement('option', { key: tabella, value: tabella }, `Tabella ${tabella}`)
                            )
                    )
                ),
                React.createElement('div', { className: 'modal-footer' },
                    React.createElement('button', {
                        type: 'button',
                        className: 'btn btn-secondary',
                        onClick: () => setShowCopyModal(false)
                    }, 'Annulla')
                )
            )
        )
    );
};

// GESTIONE SPESE COMPONENT
const GestioneSpese = ({ condominio, showMessage }) => {
    const [spese, setSpese] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [showModal, setShowModal] = React.useState(false);
    const [tabellaFilter, setTabellaFilter] = React.useState('');
    const [formData, setFormData] = React.useState({
        descrizione: '',
        importo: '',
        data_spesa: new Date().toISOString().split('T')[0], // Data odierna in formato YYYY-MM-DD
        tabella_millesimi: 'A',
        logica_pi: 'proprietario',
        percentuale_proprietario: 100,
        percentuale_inquilino: 0
    });
    const [editing, setEditing] = React.useState(null);
    const [stampaLoading, setStampaLoading] = React.useState(false);

    React.useEffect(() => {
        loadSpese();
    }, [tabellaFilter]);

    const loadSpese = async () => {
        try {
            const data = await api.getSpese(condominio.id, tabellaFilter);
            setSpese(data);
        } catch (err) {
            showMessage({ type: 'danger', text: 'Errore nel caricamento delle spese' });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const spesaData = {
                ...formData,
                importo: parseFloat(formData.importo)
            };
            let result;
            if (editing) {
                // Modifica spesa esistente
                result = await api.updateSpesa(editing.id, spesaData);
                if (result.spesa) {
                    showMessage({ type: 'success', text: 'Spesa modificata con successo!' });
                }
            } else {
                // Crea nuova spesa
                result = await api.createSpesa(condominio.id, spesaData);
                if (result.spesa) {
                    showMessage({ type: 'success', text: 'Spesa creata con successo!' });
                }
            }

            if (result.spesa) {
                setShowModal(false);
                setEditing(null);
                setFormData({
                    descrizione: '',
                    importo: '',
                    data_spesa: new Date().toISOString().split('T')[0],
                    tabella_millesimi: 'A',
                    logica_pi: 'proprietario',
                    percentuale_proprietario: 100,
                    percentuale_inquilino: 0
                });
                loadSpese();
            } else {
                showMessage({ type: 'danger', text: result.message || 'Errore nel salvataggio' });
            }
        } catch (err) {
            showMessage({ type: 'danger', text: 'Errore di connessione al server' });
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Sei sicuro di voler eliminare questa spesa?')) return;

        try {
            const result = await api.deleteSpesa(id);
            if (result.message) {
                showMessage({ type: 'success', text: 'Spesa eliminata con successo!' });
                loadSpese();
            } else {
                showMessage({ type: 'danger', text: 'Errore nell\'eliminazione' });
            }
        } catch (err) {
            showMessage({ type: 'danger', text: 'Errore di connessione al server' });
        }
    };

    const handleStampa = async () => {
        setStampaLoading(true);
        try {
            await api.stampaSpese(condominio.id, tabellaFilter);
            showMessage({ type: 'success', text: 'Documento Word generato con successo!' });
        } catch (err) {
            showMessage({ type: 'danger', text: err.message || 'Errore durante la generazione del documento' });
        } finally {
            setStampaLoading(false);
        }
    };

    const totaleSpese = spese.reduce((sum, spesa) => sum + spesa.importo, 0);

    if (loading) {
        return React.createElement('div', { className: 'loading' },
            React.createElement('div', { className: 'spinner' })
        );
    }

    return React.createElement('div', null,
        React.createElement('div', { className: 'stats-grid' },
            React.createElement('div', { className: 'stat-card' },
                React.createElement('div', { className: 'stat-value' }, spese.length),
                React.createElement('div', { className: 'stat-label' }, 'Spese Totali')
            ),
            React.createElement('div', { className: 'stat-card' },
                React.createElement('div', { className: 'stat-value' }, formatCurrency(totaleSpese)),
                React.createElement('div', { className: 'stat-label' }, 'Importo Totale')
            )
        ),
        React.createElement('div', { className: 'card' },
            React.createElement('div', { className: 'card-header' },

                React.createElement('h2', { className: 'card-title' }, ' Gestione Spese'),
                React.createElement('div', { className: 'btn-group' },
                    React.createElement('select', { className: 'form-select', value: tabellaFilter, onChange: (e) => setTabellaFilter(e.target.value), style: { width: '150px' } },
                        React.createElement('option', { value: '' }, 'Tutte le tabelle'),
                        ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'L'].map(tabella =>
                            React.createElement('option', { key: tabella, value: tabella }, `Tabella ${tabella}`)
                        )
                    ),
                    React.createElement('button', {
                        className: 'btn btn-primary',
                        onClick: () => setShowModal(true)
                    }, ' Aggiungi Spesa'),
                    React.createElement('button', {
                        className: 'btn btn-success',
                        onClick: handleStampa,
                        disabled: stampaLoading || spese.length === 0
                    }, stampaLoading ? ' Generazione...' : ' Stampa Word')
                )
            ),
            React.createElement('div', { className: 'table-container' },
                spese.length === 0 ?
                    React.createElement('p', { style: { textAlign: 'center', color: '#666' } }, 'Nessuna spesa registrata') :
                    React.createElement('table', { className: 'table' },
                        React.createElement('thead', null,
                            React.createElement('tr', null,
                                React.createElement('th', null, 'Descrizione'),
                                React.createElement('th', null, 'Importo'),
                                React.createElement('th', null, 'Tabella'),
                                React.createElement('th', null, 'Logica P/I'),
                                React.createElement('th', null, 'Data'),
                                React.createElement('th', null, 'Azioni')
                            )
                        ),
                        React.createElement('tbody', null,
                            spese.map(spesa =>
                                React.createElement('tr', { key: spesa.id },
                                    React.createElement('td', null, spesa.descrizione),
                                    React.createElement('td', null, formatCurrency(spesa.importo)),
                                    React.createElement('td', null,
                                        React.createElement('span', { className: 'badge bg-info' }, spesa.tabella_millesimi)
                                    ),
                                    React.createElement('td', null,
                                        React.createElement('span', { className: 'badge bg-secondary' }, spesa.logica_pi)
                                    ),
                                    React.createElement('td', null, formatDate(spesa.data_spesa)),
                                    React.createElement('td', null,
                                        React.createElement('div', { className: 'table-actions' },
                                            React.createElement('button', {
                                                className: 'btn btn-sm btn-warning',
                                                onClick: () => {
                                                    setEditing(spesa);
                                                    setFormData({
                                                        descrizione: spesa.descrizione,
                                                        importo: spesa.importo.toString(),
                                                        data_spesa: spesa.data_spesa,
                                                        tabella_millesimi: spesa.tabella_millesimi,
                                                        logica_pi: spesa.logica_pi,
                                                        percentuale_proprietario: spesa.percentuale_proprietario,
                                                        percentuale_inquilino: spesa.percentuale_inquilino
                                                    });
                                                    setShowModal(true);
                                                }
                                            }, ''),
                                            React.createElement('button', {
                                                className: 'btn btn-sm btn-danger',
                                                onClick: () => handleDelete(spesa.id)
                                            }, '')
                                        )
                                    )
                                )
                            )
                        )
                    )
            )
        ),

        // Modal per aggiungere spesa
        showModal && React.createElement('div', { className: 'modal active' },
            React.createElement('div', { className: 'modal-content' },
                React.createElement('div', { className: 'modal-header' },
                    React.createElement('h3', { className: 'modal-title' }, 'Nuova Spesa'),

                    React.createElement('button', { className: 'modal-close', onClick: () => setShowModal(false) }, 'x')
                ),
                React.createElement('form', { onSubmit: handleSubmit },
                    React.createElement('div', { className: 'form-group' },
                        React.createElement('label', { className: 'form-label' }, 'Descrizione *'),
                        React.createElement('input', {
                            type: 'text',
                            className: 'form-control',
                            value: formData.descrizione,
                            onChange: (e) => setFormData({ ...formData, descrizione: e.target.value }),
                            required: true
                        })
                    ),
                    React.createElement('div', { className: 'form-group' },
                        React.createElement('label', { className: 'form-label' }, 'Importo (EUR) *'),
                        React.createElement('input', {
                            type: 'number',
                            className: 'form-control',
                            value: formData.importo,
                            onChange: (e) => setFormData({ ...formData, importo: e.target.value }),
                            step: '0.01',
                            min: '0.01',
                            required: true
                        })
                    ),
                    React.createElement('div', { className: 'form-group' },
                        React.createElement('label', { className: 'form-label' }, 'Data Spesa *'),
                        React.createElement('input', {
                            type: 'date',
                            className: 'form-control',
                            value: formData.data_spesa,
                            onChange: (e) => setFormData({ ...formData, data_spesa: e.target.value }),
                            required: true
                        })
                    ),
                    React.createElement('div', { className: 'form-group' },
                        React.createElement('label', { className: 'form-label' }, 'Data Prevista *'),
                        React.createElement('input', {
                            type: 'date',
                            className: 'form-control',
                            value: formData.data_prevista,
                            onChange: (e) => setFormData({ ...formData, data_prevista: e.target.value, mese_previsto: e.target.value ? e.target.value.split('-')[1] : '' }),
                            required: true
                        })
                    ),
                    React.createElement('div', { className: 'form-row' },
                        React.createElement('div', { className: 'form-group' },
                            React.createElement('label', { className: 'form-label' }, 'Tabella Millesimi *'),
                            React.createElement('select', {
                                className: 'form-select',
                                value: formData.tabella_millesimi,
                                onChange: (e) => setFormData({ ...formData, tabella_millesimi: e.target.value }),
                                required: true
                            },
                                ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'L'].map(tabella =>
                                    React.createElement('option', { key: tabella, value: tabella }, `Tabella ${tabella}`)
                                )
                            )
                        ),
                        React.createElement('div', { className: 'form-group' },
                            React.createElement('label', { className: 'form-label' }, 'Logica P/I *'),
                            React.createElement('select', {
                                className: 'form-select',
                                value: formData.logica_pi,
                                onChange: (e) => setFormData({ ...formData, logica_pi: e.target.value }),
                                required: true
                            },
                                React.createElement('option', { value: 'proprietario' }, '100% Proprietario'),
                                React.createElement('option', { value: 'inquilino' }, '100% Inquilino'),
                                React.createElement('option', { value: '50/50' }, '50/50'),
                                React.createElement('option', { value: 'personalizzato' }, 'Personalizzato')
                            )
                        )
                    ),
                    formData.logica_pi === 'personalizzato' && React.createElement('div', { className: 'form-row' },
                        React.createElement('div', { className: 'form-group' },
                            React.createElement('label', { className: 'form-label' }, '% Proprietario'),
                            React.createElement('input', {
                                type: 'number',
                                className: 'form-control',
                                value: formData.percentuale_proprietario,
                                onChange: (e) => setFormData({ ...formData, percentuale_proprietario: parseInt(e.target.value) || 0 }),
                                min: '0',
                                max: '100'
                            })
                        ),
                        React.createElement('div', { className: 'form-group' },
                            React.createElement('label', { className: 'form-label' }, '% Inquilino'),
                            React.createElement('input', {
                                type: 'number',
                                className: 'form-control',
                                value: formData.percentuale_inquilino,
                                onChange: (e) => setFormData({ ...formData, percentuale_inquilino: parseInt(e.target.value) || 0 }),
                                min: '0',
                                max: '100'
                            })
                        )
                    ),
                    React.createElement('div', { className: 'modal-footer' },
                        React.createElement('button', {
                            type: 'button',
                            className: 'btn btn-secondary',
                            onClick: () => {
                                setShowModal(false);
                                setEditing(null);
                                setFormData({
                                    descrizione: '',
                                    importo: '',
                                    data_spesa: new Date().toISOString().split('T')[0],
                                    tabella_millesimi: 'A',
                                    logica_pi: 'proprietario',
                                    percentuale_proprietario: 100,
                                    percentuale_inquilino: 0
                                });
                            }
                        }, 'Annulla'),
                        React.createElement('button', {
                            type: 'submit',
                            className: 'btn btn-primary'
                        }, editing ? 'Modifica Spesa' : 'Crea Spesa')
                    )
                )
            )
        )
    );
};

// CALCOLO RIPARTIZIONE COMPONENT
const CalcoloRipartizione = ({ condominio, showMessage }) => {
  const [ripartizione, setRipartizione] = React.useState(null);
  const [ripartizioneDettagliata, setRipartizioneDettagliata] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [tabellaFilter, setTabellaFilter] = React.useState('');
  const [stampaLoading, setStampaLoading] = React.useState(false);
  const [mostraDettagli, setMostraDettagli] = React.useState(false);

  const calcolaRipartizione = async () => {
    setLoading(true);
    try {
      const r = await api.getRipartizione(condominio.id, tabellaFilter);
      setRipartizione(r);
      try {
        const d = await api.getRipartizioneDettagliata(condominio.id, tabellaFilter);
        setRipartizioneDettagliata(d);
      } catch (_) {
        setRipartizioneDettagliata(null);
        setMostraDettagli(false);
      }
    } catch (err) {
      showMessage({ type: 'danger', text: 'Errore nel calcolo della ripartizione' });
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { calcolaRipartizione(); }, [tabellaFilter]);

  const handleStampa = async () => {
    setStampaLoading(true);
    try { await api.stampaRipartizione(condominio.id, tabellaFilter); } finally { setStampaLoading(false); }
  };

  const topTotal = (ripartizioneDettagliata && Array.isArray(ripartizioneDettagliata.ripartizione_dettagliata))
    ? ripartizioneDettagliata.ripartizione_dettagliata.reduce((s,p)=>s+(p.totale_dovuto||0),0)
    : ((ripartizione && Array.isArray(ripartizione.ripartizione)) ? ripartizione.ripartizione.reduce((s,p)=>s+(p.importo_dovuto||0),0) : 0);

  return React.createElement('div', null,
    React.createElement('div', { className: 'card' },
      React.createElement('div', { className: 'card-header' },
        React.createElement('h2', { className: 'card-title' }, ' Calcolo Ripartizione Spese'),
        React.createElement('div', { className: 'btn-group' },
          React.createElement('select', { className: 'form-select', value: tabellaFilter, onChange: (e)=>setTabellaFilter(e.target.value), style:{ width:'150px' }},
            React.createElement('option', { value: '' }, 'Tutte le tabelle'),
            ['A','B','C','D','E','F','G','H','I','L'].map(t => React.createElement('option', { key: t, value: t }, t))
          ),
          React.createElement('button', { className: 'btn btn-primary', onClick: calcolaRipartizione, disabled: loading }, loading ? 'Calcolo in corso...' : ' Ricalcola'),
          React.createElement('button', { className: 'btn btn-secondary', onClick: ()=>setMostraDettagli(!mostraDettagli), disabled: !(ripartizioneDettagliata && ripartizioneDettagliata.ripartizione_dettagliata && ripartizioneDettagliata.ripartizione_dettagliata.length>0) }, mostraDettagli ? ' Riepilogo' : ' Dettaglio'),
          React.createElement('button', { className: 'btn btn-success', onClick: handleStampa, disabled: stampaLoading || !(ripartizione && ripartizione.ripartizione && ripartizione.ripartizione.length>0) }, stampaLoading ? ' Generazione...' : ' Stampa Word')
        )
      )
    ),
    loading ? React.createElement('div', { className: 'loading' }, React.createElement('div', { className: 'spinner' })) :
    ripartizione ? React.createElement('div', null,
      React.createElement('div', { className: 'ripartizione-summary' },
        React.createElement('div', { className: 'total-amount' }, formatCurrency(topTotal)),
        React.createElement('div', { className: 'total-label' }, (tabellaFilter ? ('Importo da Ripartire - Tabella ' + tabellaFilter) : 'Importo Totale da Ripartire - Tutte le tabelle'))
      ),
      (mostraDettagli && ripartizioneDettagliata && ripartizioneDettagliata.ripartizione_dettagliata) ? React.createElement('div', { className: 'ripartizione-details' },
        React.createElement('h3', { style:{ marginBottom:'20px' }}, 'Dettaglio Completo Spese per Persona'),
        ripartizioneDettagliata.ripartizione_dettagliata.map(p => React.createElement('div', { key:p.persona_id, className:'persona-ripartizione-detail' },
          // Intestazione persona
          React.createElement('div', { className:'persona-header' },
            React.createElement('div', { className:'persona-info' },
              React.createElement('h4', { style:{ margin:'0 0 8px 0', color:'#333' } },
                p.nome + ' ' + p.cognome + ' (' + p.tipo_persona + ') - Unità ' + p.numero_unita),
              React.createElement('div', { className:'persona-amount' }, formatCurrency(p.totale_dovuto))
            )
          ),
          // Dettaglio spese per tabella
          React.createElement('div', { className:'spese-dettaglio' },
            (p.spese_per_tabella && p.spese_per_tabella.length > 0) ?
              p.spese_per_tabella.map(tabella => React.createElement('div', { key:tabella.tabella, className:'tabella-spese' },
                React.createElement('h5', { style:{ margin:'12px 0 8px 0', color:'#764ba2', fontSize:'14px' } },
                  'Tabella ' + tabella.tabella + ' - Totale: ' + formatCurrency(tabella.totale_tabella)),
                React.createElement('div', { className:'spese-list' },
                  tabella.spese.map(spesa => React.createElement('div', { key:spesa.spesa_id, className:'spesa-item' },
                    React.createElement('div', { className:'spesa-info' },
                      React.createElement('span', { className:'spesa-descrizione' }, spesa.descrizione),
                      React.createElement('span', { className:'spesa-data' }, formatDate(spesa.data_spesa))
                    ),
                    React.createElement('div', { className:'spesa-importi' },
                      React.createElement('div', { className:'spesa-dettaglio' },
                        'Millesimi: ' + (spesa.millesimi || 'N/D') + ' | ' +
                        'P/I: ' + (spesa.logica_pi || 'N/D') + ' | ' +
                        '%: ' + (spesa.percentuale_proprietario || 'N/D') + '/' + (spesa.percentuale_inquilino || 'N/D')),
                      React.createElement('div', { className:'spesa-amount' }, formatCurrency(spesa.importo_dovuto))
                    )
                  ))
                )
              )) : React.createElement('p', { style:{ fontStyle:'italic', color:'#666', marginLeft:'16px' } }, 'Nessuna spesa dettagliata disponibile')
          )
        ))
      ) : React.createElement('div', { className: 'ripartizione-details' },
        React.createElement('h3', { style:{ marginBottom:'20px' }}, 'Riepilogo per Persona'),
        ripartizione.ripartizione.map(p => React.createElement('div', { key:p.persona_id, className:'persona-ripartizione' },
          React.createElement('div', { className:'persona-info' },
            p.nome + ' ' + p.cognome + ' (' + p.tipo_persona + ') - Unità ' + p.numero_unita),
          React.createElement('div', { className:'persona-amount' }, formatCurrency(p.importo_dovuto))
        ))
      )
    ) : React.createElement('p', { style:{ textAlign:'center', color:'#666' }}, tabellaFilter ? ('Nessuna spesa presente per la Tabella ' + tabellaFilter) : 'Nessuna spesa presente per il calcolo della ripartizione')
  );
};

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
