// Definisce una versione modulare di GestionePersone senza toccare app.js
(function(){
  if (typeof window === 'undefined' || !window.React) return;
  if (window.GestionePersone) return; // già definito
  const React = window.React;

  window.GestionePersone = function GestionePersone({ condominio, showMessage }) {
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

    React.useEffect(() => { loadPersone(); }, []);

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
          result = await api.updatePersona(editing.id, formData);
          if (result.persona) {
            showMessage({ type: 'success', text: 'Persona modificata con successo!' });
          }
        } else {
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
          React.createElement('button', { className: 'btn btn-primary', onClick: () => setShowModal(true) }, ' Aggiungi Persona')
        ),
        React.createElement('div', { className: 'table-container' },
          persone.length === 0
            ? React.createElement('p', { style: { textAlign: 'center', color: '#666' } }, 'Nessuna persona registrata')
            : React.createElement('table', { className: 'table' },
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
                  persone.map(persona => React.createElement('tr', { key: persona.id },
                    React.createElement('td', null, persona.nome),
                    React.createElement('td', null, persona.cognome),
                    React.createElement('td', null, persona.email || '-'),
                    React.createElement('td', null, React.createElement('span', { className: `badge ${persona.tipo_persona === 'proprietario' ? 'bg-primary' : 'bg-secondary'}` }, persona.tipo_persona)),
                    React.createElement('td', null, `Unità ${persona.unita_id}`),
                    React.createElement('td', null,
                      React.createElement('div', { className: 'table-actions' },
                        React.createElement('button', { className: 'btn btn-sm btn-warning', onClick: () => { setEditing(persona); setFormData(persona); setShowModal(true); } }, ' Modifica'),
                        React.createElement('button', { className: 'btn btn-sm btn-danger', onClick: () => handleDelete(persona.id) }, ' Elimina')
                      )
                    )
                  ))
                )
              )
        )
      ),
      showModal && React.createElement('div', { className: 'modal active' },
        React.createElement('div', { className: 'modal-content' },
          React.createElement('div', { className: 'modal-header' },
            React.createElement('h3', { className: 'modal-title' }, editing ? 'Modifica Persona' : 'Nuova Persona'),
            React.createElement('button', { className: 'modal-close', onClick: () => setShowModal(false) }, 'x')
          ),
          React.createElement('form', { onSubmit: handleSubmit },
            React.createElement('div', { className: 'form-group' },
              React.createElement('label', { className: 'form-label' }, 'Nome *'),
              React.createElement('input', { type: 'text', className: 'form-control', value: formData.nome, onChange: (e) => setFormData({ ...formData, nome: e.target.value }), required: true })
            ),
            React.createElement('div', { className: 'form-group' },
              React.createElement('label', { className: 'form-label' }, 'Cognome *'),
              React.createElement('input', { type: 'text', className: 'form-control', value: formData.cognome, onChange: (e) => setFormData({ ...formData, cognome: e.target.value }), required: true })
            ),
            React.createElement('div', { className: 'form-group' },
              React.createElement('label', { className: 'form-label' }, 'Email'),
              React.createElement('input', { type: 'email', className: 'form-control', value: formData.email, onChange: (e) => setFormData({ ...formData, email: e.target.value }) })
            ),
            React.createElement('div', { className: 'form-group' },
              React.createElement('label', { className: 'form-label' }, 'Tipo Persona *'),
              React.createElement('select', { className: 'form-select', value: formData.tipo_persona, onChange: (e) => setFormData({ ...formData, tipo_persona: e.target.value }), required: true },
                React.createElement('option', { value: 'proprietario' }, 'Proprietario'),
                React.createElement('option', { value: 'inquilino' }, 'Inquilino'),
                React.createElement('option', { value: 'proprietario_inquilino' }, 'Proprietario/Inquilino')
              )
            ),
            React.createElement('div', { className: 'form-group' },
              React.createElement('label', { className: 'form-label' }, 'Unità Immobiliare *'),
              React.createElement('select', { className: 'form-select', value: formData.unita_id, onChange: (e) => setFormData({ ...formData, unita_id: parseInt(e.target.value) }), required: true },
                React.createElement('option', { value: '' }, 'Seleziona unità'),
                Array.from({ length: condominio.num_unita }, (_, i) => React.createElement('option', { key: i + 1, value: i + 1 }, `Unità ${i + 1}`))
              )
            ),
            React.createElement('div', { className: 'modal-footer' },
              React.createElement('button', { type: 'button', className: 'btn btn-secondary', onClick: () => setShowModal(false) }, 'Annulla'),
              React.createElement('button', { type: 'submit', className: 'btn btn-primary' }, editing ? 'Modifica' : 'Crea')
            )
          )
        )
      )
    );
  };
})();
