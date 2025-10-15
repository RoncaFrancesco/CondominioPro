// Modulo PreventivoAnnuale estratto da app.js
(function(){
  if (typeof window === 'undefined' || !window.React) return;
  if (window.PreventivoAnnuale) return;
  const React = window.React;

  window.PreventivoAnnuale = function PreventivoAnnuale({ condominio, showMessage }) {
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

    React.useEffect(() => { loadSpesePreventivate(); }, [anno, condominio.id]);

    const loadSpesePreventivate = async () => {
      setLoading(true);
      try { const data = await api.getSpesePreventivate(condominio.id, anno); setSpesePreventivate(Array.isArray(data) ? data : []); }
      catch (err) { showMessage({ type: 'danger', text: 'Errore nel caricamento delle spese preventivate' }); }
      finally { setLoading(false); }
    };

    const resetForm = () => {
      setEditing(null);
      setFormData({ descrizione: '', importo: '', data_prevista: new Date().toISOString().split('T')[0], tabella_millesimi: 'A', logica_pi: 'proprietario', percentuale_proprietario: 100, percentuale_inquilino: 0, mese_previsto: '' });
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        const spesaData = { ...formData, importo: parseFloat(formData.importo), anno: anno, mese_previsto: formData.mese_previsto ? parseInt(formData.mese_previsto) : (formData.data_prevista ? parseInt(formData.data_prevista.split('-')[1]) : null), data_prevista: formData.data_prevista || null };
        let result;
        if (editing) { result = await api.updateSpesaPreventivata(editing.id, spesaData); }
        else { result = await api.createSpesaPreventivata(condominio.id, spesaData); }
        if (result && (result.spesa || result.message)) { showMessage({ type: 'success', text: editing ? 'Spesa preventivata aggiornata' : 'Spesa preventivata creata' }); setShowModal(false); resetForm(); loadSpesePreventivate(); }
        else { showMessage({ type: 'danger', text: (result && result.message) || 'Errore nella richiesta' }); }
      } catch (err) { showMessage({ type: 'danger', text: 'Errore di connessione al server' }); }
    };

    const handleEdit = (spesa) => { setEditing(spesa); setFormData({ descrizione: spesa.descrizione || '', importo: spesa.importo_previsto || spesa.importo || '', data_prevista: spesa.data_prevista || '', tabella_millesimi: spesa.tabella_millesimi || 'A', logica_pi: spesa.logica_pi || 'proprietario', percentuale_proprietario: spesa.percentuale_proprietario ?? 100, percentuale_inquilino: spesa.percentuale_inquilino ?? 0, mese_previsto: spesa.mese_previsto ? String(spesa.mese_previsto) : '' }); setShowModal(true); };

    const handleDelete = async (id) => { if (!confirm('Eliminare questa spesa preventivata?')) return; try { const result = await api.deleteSpesaPreventivata(id); if (result && result.message) { showMessage({ type: 'success', text: 'Spesa preventivata eliminata' }); loadSpesePreventivate(); } else { showMessage({ type: 'danger', text: 'Errore nella cancellazione' }); } } catch (err) { showMessage({ type: 'danger', text: 'Errore di connessione al server' }); } };

    const calcolaPreventivo = async () => { setCalcolo(null); try { const data = await api.getCalcoloPreventivo(condominio.id, anno); setCalcolo(data); } catch (err) { showMessage({ type: 'danger', text: 'Errore nel calcolo del preventivo' }); } };

    const visibleSpesePreventivate = tabellaFilter ? spesePreventivate.filter((sp) => sp.tabella_millesimi === tabellaFilter) : spesePreventivate;
    const totaleSpese = visibleSpesePreventivate.reduce((sum, sp) => sum + (sp.importo_previsto || 0), 0);

    if (loading) { return React.createElement('div', { className: 'loading' }, React.createElement('div', { className: 'spinner' })); }

    return React.createElement('div', null,
      React.createElement('div', { className: 'stats-grid' },
        React.createElement('div', { className: 'stat-card' }, React.createElement('div', { className: 'stat-value' }, (calcolo && calcolo.totale) || 0), React.createElement('div', { className: 'stat-label' }, 'Totale Ripartizione')),
        React.createElement('div', { className: 'stat-card' }, React.createElement('div', { className: 'stat-value' }, formatCurrency(totaleSpese)), React.createElement('div', { className: 'stat-label' }, 'Totale Preventivato')),
        React.createElement('div', { className: 'stat-card' }, React.createElement('div', { className: 'stat-value' }, anno), React.createElement('div', { className: 'stat-label' }, 'Anno di Riferimento'))
      ),
      React.createElement('div', { className: 'card' },
        React.createElement('div', { className: 'card-header', style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
          React.createElement('h2', { className: 'card-title' }, 'Gestione Spese Preventivate'),
          React.createElement('div', { className: 'btn-group' },
            React.createElement('select', { className: 'form-select', value: anno, onChange: (e) => setAnno(parseInt(e.target.value) || new Date().getFullYear()), style: { minWidth: '120px' } }, [0,1,2].map(offset => { const y = new Date().getFullYear() + offset; return React.createElement('option', { key: y, value: y }, y); })),
            React.createElement('select', { className: 'form-select', value: tabellaFilter, onChange: (e) => setTabellaFilter(e.target.value), style: { minWidth: '130px' } }, React.createElement('option', { value: '' }, 'Tutte le tabelle'), ['A','B','C','D','E','F','G','H','I','L'].map(t => React.createElement('option', { key: t, value: t }, t))),
            React.createElement('button', { className: 'btn btn-secondary', onClick: loadSpesePreventivate }, 'Aggiorna'),
            React.createElement('button', { className: 'btn btn-primary', onClick: () => { resetForm(); setShowModal(true); } }, 'Nuova Spesa'),
            React.createElement('button', { className: 'btn btn-success', onClick: () => api.stampaPreventivo(condominio.id, anno, tabellaFilter || null) }, 'Stampa Word')
          )
        ),
        React.createElement('div', { className: 'table-container' },
          spesePreventivate.length === 0 ? React.createElement('div', { className: 'alert alert-info' }, 'Nessuna spesa preventivata presente') :
          React.createElement('table', { className: 'table' },
            React.createElement('thead', null, React.createElement('tr', null,
              React.createElement('th', null, 'Descrizione'), React.createElement('th', null, 'Importo'), React.createElement('th', null, 'Tabella'), React.createElement('th', null, 'Logica P/I'), React.createElement('th', null, 'Data/Mese'), React.createElement('th', null, 'Azioni')
            )),
            React.createElement('tbody', null,
              visibleSpesePreventivate.map(spesa => React.createElement('tr', { key: spesa.id },
                React.createElement('td', null, spesa.descrizione),
                React.createElement('td', null, formatCurrency(spesa.importo_previsto || spesa.importo)),
                React.createElement('td', null, React.createElement('span', { className: 'badge bg-info' }, spesa.tabella_millesimi)),
                React.createElement('td', null, React.createElement('span', { className: 'badge bg-secondary' }, spesa.logica_pi)),
                React.createElement('td', null, spesa.data_prevista ? formatDate(spesa.data_prevista) : (spesa.mese_previsto ? `Mese ${spesa.mese_previsto}` : '-')),
                React.createElement('td', null, React.createElement('div', { className: 'btn-group' },
                  React.createElement('button', { className: 'btn btn-sm btn-secondary', onClick: () => handleEdit(spesa) }, 'Modifica'),
                  React.createElement('button', { className: 'btn btn-sm btn-danger', onClick: () => handleDelete(spesa.id) }, 'Elimina')
                ))
              ))
            )
          )
        )
      ),
      React.createElement('div', { className: 'card' },
        React.createElement('div', { className: 'card-header' }, React.createElement('h2', { className: 'card-title' }, ' Ripartizione Preventivo')),
        React.createElement('div', { className: 'card-body' },
          React.createElement('div', { className: 'ripartizione-summary' }, React.createElement('div', { className: 'total-amount' }, formatCurrency((calcolo && calcolo.totale) || 0)), React.createElement('div', { className: 'total-label' }, 'Importo Totale Preventivato')),
          React.createElement('div', { className: 'ripartizione-details' }, React.createElement('h3', { style: { marginBottom: '20px' } }, 'Dettaglio Ripartizione per Persona'),
            (calcolo && calcolo.ripartizione ? calcolo.ripartizione : []).map(p => React.createElement('div', { key: `${p.persona_id}-${p.numero_unita || ''}` }, `${p.nome} ${p.cognome} (${p.tipo_persona}) - Unità ${p.numero_unita || '-'}: ${formatCurrency(p.importo_dovuto)}`))
          )
        )
      )
    );
  };
})();
