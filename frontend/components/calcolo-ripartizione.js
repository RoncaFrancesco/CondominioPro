// Modulo CalcoloRipartizione estratto da app.js
(function(){
  if (typeof window === 'undefined' || !window.React) return;
  if (window.CalcoloRipartizione) return;
  const React = window.React;

  window.CalcoloRipartizione = function CalcoloRipartizione({ condominio, showMessage }) {
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
      try { await api.stampaRipartizione(condominio.id, tabellaFilter); }
      finally { setStampaLoading(false); }
    };

    const topTotal = (ripartizioneDettagliata && Array.isArray(ripartizioneDettagliata.ripartizione_dettagliata))
      ? ripartizioneDettagliata.ripartizione_dettagliata.reduce((s,p)=>s+(p.totale_dovuto||0),0)
      : ((ripartizione && Array.isArray(ripartizione.ripartizione)) ? ripartizione.ripartizione.reduce((s,p)=>s+(p.importo_dovuto||0),0) : 0);

    const headerCard = React.createElement('div', { className: 'card' },
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
    );

    let body;
    if (loading) {
      body = React.createElement('div', { className: 'loading' }, React.createElement('div', { className: 'spinner' }));
    } else if (ripartizione) {
      const riepilogo = React.createElement('div', { className: 'ripartizione-summary' },
        React.createElement('div', { className: 'total-amount' }, formatCurrency(topTotal)),
        React.createElement('div', { className: 'total-label' }, (tabellaFilter ? ('Importo da Ripartire - Tabella ' + tabellaFilter) : 'Importo Totale da Ripartire - Tutte le tabelle'))
      );

      const dettaglio = (mostraDettagli && ripartizioneDettagliata && ripartizioneDettagliata.ripartizione_dettagliata)
        ? React.createElement('div', { className: 'ripartizione-details' },
            React.createElement('h3', { style:{ marginBottom:'20px' }}, 'Dettaglio Completo Spese per Persona'),
            ripartizioneDettagliata.ripartizione_dettagliata.map(p => React.createElement('div', { key:p.persona_id, className:'persona-ripartizione-detail' },
              React.createElement('div', { className:'persona-header' },
                React.createElement('div', { className:'persona-info' },
                  React.createElement('h4', { style:{ margin:'0 0 8px 0', color:'#333' } }, p.nome + ' ' + p.cognome + ' (' + p.tipo_persona + ') - Unit\u00E0 ' + p.numero_unita),
                  React.createElement('div', { className:'persona-amount' }, formatCurrency(p.totale_dovuto))
                )
              ),
              React.createElement('div', { className:'spese-dettaglio' },
                (p.spese_per_tabella && p.spese_per_tabella.length > 0)
                  ? p.spese_per_tabella.map(tabella => React.createElement('div', { key:tabella.tabella, className:'tabella-spese' },
                      React.createElement('h5', { style:{ margin:'12px 0 8px 0', color:'#764ba2', fontSize:'14px' } }, 'Tabella ' + tabella.tabella + ' - Totale: ' + formatCurrency(tabella.totale_tabella)),
                      React.createElement('div', { className:'spese-list' },
                        tabella.spese.map(spesa => React.createElement('div', { key:spesa.spesa_id, className:'spesa-item' },
                          React.createElement('div', { className:'spesa-info' },
                            React.createElement('span', { className:'spesa-descrizione' }, spesa.descrizione),
                            React.createElement('span', { className:'spesa-data' }, formatDate(spesa.data_spesa))
                          ),
                          React.createElement('div', { className:'spesa-importi' },
                            React.createElement('div', { className:'spesa-dettaglio' }, 'Millesimi: ' + (spesa.millesimi || 'N/D') + ' | ' + 'P/I: ' + (spesa.logica_pi || 'N/D') + ' | ' + '%: ' + (spesa.percentuale_proprietario || 'N/D') + '/' + (spesa.percentuale_inquilino || 'N/D')),
                            React.createElement('div', { className:'spesa-amount' }, formatCurrency(spesa.importo_dovuto))
                          )
                        ))
                      )
                    ))
                  : React.createElement('p', { style:{ fontStyle:'italic', color:'#666', marginLeft:'16px' } }, 'Nessuna spesa dettagliata disponibile')
              )
            ))
          )
        : React.createElement('div', { className: 'ripartizione-details' },
            React.createElement('h3', { style:{ marginBottom:'20px' }}, 'Riepilogo per Persona'),
            ripartizione.ripartizione.map(p => React.createElement('div', { key:p.persona_id, className:'persona-ripartizione' },
              React.createElement('div', { className:'persona-info' }, p.nome + ' ' + p.cognome + ' (' + p.tipo_persona + ') - Unit\u00E0 ' + p.numero_unita),
              React.createElement('div', { className:'persona-amount' }, formatCurrency(p.importo_dovuto))
            ))
          );

      body = React.createElement(React.Fragment, null, riepilogo, dettaglio);
    } else {
      body = React.createElement('p', { style:{ textAlign:'center', color:'#666' }}, tabellaFilter ? ('Nessuna spesa presente per la Tabella ' + tabellaFilter) : 'Nessuna spesa presente per il calcolo della ripartizione');
    }

    return React.createElement('div', null, headerCard, body);
  };
})();

