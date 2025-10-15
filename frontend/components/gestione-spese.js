// Modulo GestioneSpese estratto da app.js
(function(){
  if (typeof window === 'undefined' || !window.React) return;
  if (window.GestioneSpese) return;
  const React = window.React;

  window.GestioneSpese = function GestioneSpese({ condominio, showMessage }) {
    const [spese, setSpese] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [showModal, setShowModal] = React.useState(false);
    const [tabellaFilter, setTabellaFilter] = React.useState('');
    const [formData, setFormData] = React.useState({
        descrizione: '',
        importo: '',
        data_spesa: new Date().toISOString().split('T')[0],
        tabella_millesimi: 'A',
        logica_pi: 'proprietario',
        percentuale_proprietario: 100,
        percentuale_inquilino: 0
    });
    const [editing, setEditing] = React.useState(null);
    const [stampaLoading, setStampaLoading] = React.useState(false);

    React.useEffect(() => { loadSpese(); }, [tabellaFilter]);

    const loadSpese = async () => {
      try { const data = await api.getSpese(condominio.id, tabellaFilter); setSpese(data); }
      catch (err) { showMessage({ type: 'danger', text: 'Errore nel caricamento delle spese' }); }
      finally { setLoading(false); }
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        const spesaData = { ...formData, importo: parseFloat(formData.importo) };
        let result;
        if (editing) {
          result = await api.updateSpesa(editing.id, spesaData);
          if (result.spesa) showMessage({ type: 'success', text: 'Spesa modificata con successo!' });
        } else {
          result = await api.createSpesa(condominio.id, spesaData);
          if (result.spesa) showMessage({ type: 'success', text: 'Spesa creata con successo!' });
        }
        if (result.spesa) {
          setShowModal(false); setEditing(null);
          setFormData({ descrizione:'', importo:'', data_spesa:new Date().toISOString().split('T')[0], tabella_millesimi:'A', logica_pi:'proprietario', percentuale_proprietario:100, percentuale_inquilino:0 });
          loadSpese();
        } else {
          showMessage({ type: 'danger', text: result.message || 'Errore nel salvataggio' });
        }
      } catch (err) { showMessage({ type: 'danger', text: 'Errore di connessione al server' }); }
    };

    const handleDelete = async (id) => {
      if (!confirm('Sei sicuro di voler eliminare questa spesa?')) return;
      try {
        const result = await api.deleteSpesa(id);
        if (result.message) { showMessage({ type: 'success', text: 'Spesa eliminata con successo!' }); loadSpese(); }
        else { showMessage({ type: 'danger', text: 'Errore nell\'eliminazione' }); }
      } catch (err) { showMessage({ type: 'danger', text: 'Errore di connessione al server' }); }
    };

    const handleStampa = async () => {
      setStampaLoading(true);
      try { await api.stampaSpese(condominio.id, tabellaFilter); showMessage({ type: 'success', text: 'Documento Word generato con successo!' }); }
      catch (err) { showMessage({ type: 'danger', text: err.message || 'Errore durante la generazione del documento' }); }
      finally { setStampaLoading(false); }
    };

    const totaleSpese = spese.reduce((sum, spesa) => sum + spesa.importo, 0);

    if (loading) return React.createElement('div', { className: 'loading' }, React.createElement('div', { className: 'spinner' }));

    return React.createElement('div', null,
      React.createElement('div', { className: 'stats-grid' },
        React.createElement('div', { className: 'stat-card' }, React.createElement('div', { className: 'stat-value' }, spese.length), React.createElement('div', { className: 'stat-label' }, 'Spese Totali')),
        React.createElement('div', { className: 'stat-card' }, React.createElement('div', { className: 'stat-value' }, formatCurrency(totaleSpese)), React.createElement('div', { className: 'stat-label' }, 'Importo Totale'))
      ),
      React.createElement('div', { className: 'card' },
        React.createElement('div', { className: 'card-header' },
          React.createElement('h2', { className: 'card-title' }, ' Gestione Spese'),
          React.createElement('div', { className: 'btn-group' },
            React.createElement('select', { className: 'form-select', value: tabellaFilter, onChange: (e) => setTabellaFilter(e.target.value), style: { width: '150px' } },
              React.createElement('option', { value: '' }, 'Tutte le tabelle'),
              ['A','B','C','D','E','F','G','H','I','L'].map(tabella => React.createElement('option', { key: tabella, value: tabella }, `Tabella ${tabella}`))
            ),
            React.createElement('button', { className: 'btn btn-primary', onClick: () => setShowModal(true) }, ' Aggiungi Spesa'),
            React.createElement('button', { className: 'btn btn-success', onClick: handleStampa, disabled: stampaLoading || spese.length === 0 }, stampaLoading ? ' Generazione...' : ' Stampa Word')
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
                spese.map(spesa => React.createElement('tr', { key: spesa.id },
                  React.createElement('td', null, spesa.descrizione),
                  React.createElement('td', null, formatCurrency(spesa.importo)),
                  React.createElement('td', null, React.createElement('span', { className: 'badge bg-info' }, spesa.tabella_millesimi)),
                  React.createElement('td', null, React.createElement('span', { className: 'badge bg-secondary' }, spesa.logica_pi)),
                  React.createElement('td', null, formatDate(spesa.data_spesa)),
                  React.createElement('td', null, React.createElement('div', { className: 'table-actions' },
                    React.createElement('button', { className: 'btn btn-sm btn-warning', onClick: () => { setEditing(spesa); setFormData({ descrizione: spesa.descrizione, importo: spesa.importo.toString(), data_spesa: spesa.data_spesa, tabella_millesimi: spesa.tabella_millesimi, logica_pi: spesa.logica_pi, percentuale_proprietario: spesa.percentuale_proprietario, percentuale_inquilino: spesa.percentuale_inquilino }); setShowModal(true); } }, ' Modifica'),
                    React.createElement('button', { className: 'btn btn-sm btn-danger', onClick: () => handleDelete(spesa.id) }, ' Elimina')
                  ))
                ))
              )
            )
        ),
      ),
      showModal && React.createElement('div', { className: 'modal active' },
        React.createElement('div', { className: 'modal-content' },
          React.createElement('div', { className: 'modal-header' },
            React.createElement('h3', { className: 'modal-title' }, 'Nuova Spesa'),
            React.createElement('button', { className: 'modal-close', onClick: () => setShowModal(false) }, 'x')
          ),
          React.createElement('form', { onSubmit: handleSubmit },
            React.createElement('div', { className: 'form-group' }, React.createElement('label', { className: 'form-label' }, 'Descrizione *'), React.createElement('input', { type: 'text', className: 'form-control', value: formData.descrizione, onChange: (e) => setFormData({ ...formData, descrizione: e.target.value }), required: true })),
            React.createElement('div', { className: 'form-group' }, React.createElement('label', { className: 'form-label' }, 'Importo (EUR) *'), React.createElement('input', { type: 'number', className: 'form-control', value: formData.importo, onChange: (e) => setFormData({ ...formData, importo: e.target.value }), step: '0.01', min: '0.01', required: true })),
            React.createElement('div', { className: 'form-group' }, React.createElement('label', { className: 'form-label' }, 'Data Spesa *'), React.createElement('input', { type: 'date', className: 'form-control', value: formData.data_spesa, onChange: (e) => setFormData({ ...formData, data_spesa: e.target.value }), required: true })),
            React.createElement('div', { className: 'form-group' }, React.createElement('label', { className: 'form-label' }, 'Data Prevista *'), React.createElement('input', { type: 'date', className: 'form-control', value: formData.data_prevista, onChange: (e) => setFormData({ ...formData, data_prevista: e.target.value, mese_previsto: e.target.value ? e.target.value.split('-')[1] : '' }), required: true })),
            React.createElement('div', { className: 'form-row' },
              React.createElement('div', { className: 'form-group' }, React.createElement('label', { className: 'form-label' }, 'Tabella Millesimi *'), React.createElement('select', { className: 'form-select', value: formData.tabella_millesimi, onChange: (e) => setFormData({ ...formData, tabella_millesimi: e.target.value }), required: true }, ['A','B','C','D','E','F','G','H','I','L'].map(tabella => React.createElement('option', { key: tabella, value: tabella }, `Tabella ${tabella}`)))),
              React.createElement('div', { className: 'form-group' }, React.createElement('label', { className: 'form-label' }, 'Logica P/I *'), React.createElement('select', { className: 'form-select', value: formData.logica_pi, onChange: (e) => setFormData({ ...formData, logica_pi: e.target.value }), required: true }, React.createElement('option', { value: 'proprietario' }, '100% Proprietario'), React.createElement('option', { value: 'inquilino' }, '100% Inquilino'), React.createElement('option', { value: '50/50' }, '50/50'), React.createElement('option', { value: 'personalizzato' }, 'Personalizzato')))
            ),
            formData.logica_pi === 'personalizzato' && React.createElement('div', { className: 'form-row' },
              React.createElement('div', { className: 'form-group' }, React.createElement('label', { className: 'form-label' }, '% Proprietario'), React.createElement('input', { type: 'number', className: 'form-control', value: formData.percentuale_proprietario, onChange: (e) => setFormData({ ...formData, percentuale_proprietario: parseInt(e.target.value) || 0 }), min: '0', max: '100' })),
              React.createElement('div', { className: 'form-group' }, React.createElement('label', { className: 'form-label' }, '% Inquilino'), React.createElement('input', { type: 'number', className: 'form-control', value: formData.percentuale_inquilino, onChange: (e) => setFormData({ ...formData, percentuale_inquilino: parseInt(e.target.value) || 0 }), min: '0', max: '100' }))
            ),
            React.createElement('div', { className: 'modal-footer' },
              React.createElement('button', { type: 'button', className: 'btn btn-secondary', onClick: () => { setShowModal(false); setEditing(null); setFormData({ descrizione:'', importo:'', data_spesa:new Date().toISOString().split('T')[0], tabella_millesimi:'A', logica_pi:'proprietario', percentuale_proprietario:100, percentuale_inquilino:0 }); } }, 'Annulla'),
              React.createElement('button', { type: 'submit', className: 'btn btn-primary' }, editing ? 'Modifica Spesa' : 'Crea Spesa')
            )
          )
        )
      )
    );
  };
})();
