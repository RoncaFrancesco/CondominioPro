// Modulo GestioneMillesimi estratto da app.js
(function(){
  if (typeof window === 'undefined' || !window.React) return;
  if (window.GestioneMillesimi) return;
  const React = window.React;

  window.GestioneMillesimi = function GestioneMillesimi({ condominio, showMessage }) {
    const [millesimi, setMillesimi] = React.useState({});
    const [selectedTabella, setSelectedTabella] = React.useState('A');
    const [loading, setLoading] = React.useState(true);
    const [editingMillesimi, setEditingMillesimi] = React.useState({});
    const [showCopyModal, setShowCopyModal] = React.useState(false);

    React.useEffect(() => { loadMillesimi(); }, [selectedTabella]);

    const loadMillesimi = async () => {
      try {
        const data = await api.getMillesimi(condominio.id);
        setMillesimi(data);
        const editing = {};
        if (data[selectedTabella]) {
          data[selectedTabella].forEach(m => { editing[m.unita_id] = m.valore; });
        }
        setEditingMillesimi(editing);
      } catch (err) {
        showMessage({ type: 'danger', text: 'Errore nel caricamento dei millesimi' });
      } finally { setLoading(false); }
    };

    const handleSave = async () => {
      const millesimiList = Object.entries(editingMillesimi).map(([unita_id, valore]) => ({ unita_id: parseInt(unita_id), valore: parseInt(valore) }));
      const totale = millesimiList.reduce((sum, m) => sum + m.valore, 0);
      if (totale !== 1000) { showMessage({ type: 'danger', text: `Il totale dei millesimi deve essere 1000 (attuale: ${totale})` }); return; }
      try {
        const result = await api.saveMillesimi(condominio.id, { tabella: selectedTabella, millesimi: millesimiList });
        if (result.message) { showMessage({ type: 'success', text: 'Millesimi salvati con successo!' }); loadMillesimi(); }
        else { showMessage({ type: 'danger', text: result.message || 'Errore nel salvataggio' }); }
      } catch (err) { showMessage({ type: 'danger', text: 'Errore di connessione al server' }); }
    };

    const handleCopy = () => setShowCopyModal(true);

    const handleCopyConfirm = async (destinazioneTabella) => {
      setShowCopyModal(false);
      if (!destinazioneTabella || destinazioneTabella === selectedTabella) { showMessage({ type: 'warning', text: 'Seleziona una tabella diversa da quella corrente.' }); return; }
      try {
        const result = await api.saveMillesimi(condominio.id, { tabella: destinazioneTabella, millesimi: Object.entries(editingMillesimi).map(([unita_id, valore]) => ({ unita_id: parseInt(unita_id), valore: parseInt(valore) })) });
        if (result.message) { showMessage({ type: 'success', text: `Millesimi copiati con successo dalla tabella ${selectedTabella} alla tabella ${destinazioneTabella}!` }); loadMillesimi(); setSelectedTabella(destinazioneTabella); }
        else { showMessage({ type: 'danger', text: result.message || 'Errore nella copia' }); }
      } catch (err) { showMessage({ type: 'danger', text: 'Errore di connessione al server' }); }
    };

    const totaleMillesimi = Object.values(editingMillesimi).reduce((sum, val) => sum + (parseInt(val) || 0), 0);

    if (loading) {
      return React.createElement('div', { className: 'loading' }, React.createElement('div', { className: 'spinner' }));
    }

    return React.createElement('div', null,
      React.createElement('div', { className: 'card' },
        React.createElement('div', { className: 'card-header' },
          React.createElement('h2', { className: 'card-title' }, ' Gestione Millesimi'),
          React.createElement('div', { className: 'form-group', style: { marginBottom: 0, minWidth: '200px' } },
            React.createElement('select', { className: 'form-select', value: selectedTabella, onChange: (e) => setSelectedTabella(e.target.value) },
              ['A','B','C','D','E','F','G','H','I','L'].map(tabella => React.createElement('option', { key: tabella, value: tabella }, `Tabella ${tabella}`))
            )
          )
        ),
        React.createElement('div', null,
          React.createElement('p', { style: { marginBottom: '20px', color: '#666' } }, `Configura i millesimi per la Tabella ${selectedTabella}. Ogni unità deve avere un valore e il totale deve essere 1000.`),
          React.createElement('div', { className: 'millesimi-grid' },
            Array.from({ length: condominio.num_unita }, (_, i) => {
              const unitaId = i + 1;
              return React.createElement('div', { key: unitaId, className: 'millesimo-input' },
                React.createElement('label', { className: 'form-label' }, `Unità ${unitaId}`),
                React.createElement('input', { type: 'number', className: 'form-control', value: editingMillesimi[unitaId] || '', onChange: (e) => setEditingMillesimi({ ...editingMillesimi, [unitaId]: parseInt(e.target.value) || 0 }), min: '0', max: '1000' })
              );
            })
          ),
          React.createElement('div', { className: `millesimi-total ${totaleMillesimi === 1000 ? 'valid' : 'invalid'}` },
            React.createElement('div', null, `Totale: ${totaleMillesimi} / 1000`),
            React.createElement('div', { style: { fontSize: '14px', marginTop: '4px' } }, totaleMillesimi === 1000 ? ' Valido' : ' Non valido')
          ),
          React.createElement('div', { style: { marginTop: '24px' } },
            React.createElement('div', { style: { display: 'flex', gap: '10px' } },
              React.createElement('button', { className: 'btn btn-primary', onClick: handleSave, disabled: totaleMillesimi !== 1000 }, ' Salva Millesimi'),
              React.createElement('button', { className: 'btn btn-secondary', onClick: handleCopy, disabled: totaleMillesimi !== 1000 }, ' Copia in altra tabella')
            )
          )
        )
      ),
      showCopyModal && React.createElement('div', { className: 'modal active' },
        React.createElement('div', { className: 'modal-content' },
          React.createElement('div', { className: 'modal-header' },
            React.createElement('h3', { className: 'modal-title' }, 'Copia Millesimi'),
            React.createElement('button', { className: 'modal-close', onClick: () => setShowCopyModal(false) }, 'x')
          ),
          React.createElement('div', { style: { marginBottom: '20px' } }, React.createElement('p', { style: { color: '#666' } }, `Copia i millesimi dalla Tabella ${selectedTabella} a un'altra tabella.`)),
          React.createElement('div', { className: 'form-group' },
            React.createElement('label', { className: 'form-label' }, 'Tabella di Destinazione *'),
            React.createElement('select', { className: 'form-select', onChange: (e) => { if (e.target.value && e.target.value !== selectedTabella) { handleCopyConfirm(e.target.value); } }, defaultValue: '' },
              React.createElement('option', { value: '', disabled: true }, 'Seleziona tabella di destinazione'),
              ['A','B','C','D','E','F','G','H','I','L'].filter(t => t !== selectedTabella).map(tabella => React.createElement('option', { key: tabella, value: tabella }, `Tabella ${tabella}`))
            )
          ),
          React.createElement('div', { className: 'modal-footer' }, React.createElement('button', { type: 'button', className: 'btn btn-secondary', onClick: () => setShowCopyModal(false) }, 'Annulla'))
        )
      )
    );
  };
})();
