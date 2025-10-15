// Caricato dopo app.js. Usa React globale e api globale.
(function(){
  if (!window || !window.React) return;
  const React = window.React;

  function CalcoloAnnoSuccessivo({ condominio, showMessage }) {
    const [annoRiferimento, setAnnoRiferimento] = React.useState(new Date().getFullYear());
    const [analisi, setAnalisi] = React.useState(null);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState('');

    const caricaAnalisi = async () => {
      setLoading(true); setError('');
      try {
        const res = await api.getAnalisiAnnoSuccessivo(condominio.id, annoRiferimento);
        if (res && res.data) setAnalisi(res.data); else setError((res && res.message) || 'Dati non disponibili');
      } catch (e) {
        setError(e && e.message ? e.message : 'Errore nel caricamento');
      } finally { setLoading(false); }
    };

    React.useEffect(() => { caricaAnalisi(); }, [annoRiferimento, condominio && condominio.id]);

    return React.createElement('div', null,
      React.createElement('div', { className: 'card' },
        React.createElement('h2', { className: 'card-title' }, ' Parametri di Calcolo'),
        React.createElement('div', { className: 'btn-group' },
          React.createElement('label', { htmlFor: 'annoRif' }, 'Anno di Riferimento:'),
          React.createElement('input', { id: 'annoRif', type: 'number', value: annoRiferimento, min: '2020', max: '2099', onChange: (e)=>setAnnoRiferimento(parseInt(e.target.value)||new Date().getFullYear()), className: 'form-control', style:{maxWidth:'140px'} }),
          React.createElement('button', { className: 'btn btn-primary', onClick: caricaAnalisi, disabled: loading }, loading ? 'Calcolo...' : 'Ricalcola')
        ),
        error && React.createElement('div', { className: 'alert alert-danger', style:{marginTop:'12px'} }, error)
      ),
      (analisi && !error) && React.createElement('div', null,
        React.createElement('div', { className: 'card' },
          React.createElement('h2', { className: 'card-title' }, ' Riepilogo Analisi'),
          React.createElement('div', { className: 'info-grid', style:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:'16px'} },
            React.createElement('div', null,
              React.createElement('div', { style:{color:'#666'} }, 'Anno Riferimento'),
              React.createElement('div', { style:{fontSize:'22px',fontWeight:'bold'} }, analisi.anno_riferimento)
            ),
            React.createElement('div', null,
              React.createElement('div', { style:{color:'#666'} }, 'Anno Successivo'),
              React.createElement('div', { style:{fontSize:'22px',fontWeight:'bold'} }, analisi.anno_successivo)
            ),
            React.createElement('div', null,
              React.createElement('div', { style:{color:'#666'} }, 'Totale Preventivato'),
              React.createElement('div', { style:{fontSize:'22px',fontWeight:'bold'} }, formatCurrency(analisi.totale_previsto||0))
            ),
            React.createElement('div', null,
              React.createElement('div', { style:{color:'#666'} }, 'Fonte Dati'),
              React.createElement('div', { style:{fontSize:'16px',fontWeight:'bold'} }, (analisi.fonte_dati||'').replace('_',' '))
            )
          ),
          React.createElement('div', { style:{marginTop:'8px',color:'#666'} }, analisi.note||'')
        )
      )
    );
  }

  window.CalcoloAnnoSuccessivo = CalcoloAnnoSuccessivo;
})();

