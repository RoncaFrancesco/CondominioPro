# 🏢 CONDOMINIO NUOVO - WebApp

Gestione condominiale semplificata con login, dashboard e gestione completa per ogni condominio.

## 📋 Overview

**Condominio Nuovo** è un'applicazione web locale per la gestione completa di condominii con:
- ✅ Login sicuro con JWT
- ✅ Gestione multi-condominio
- ✅ Database SQLite locale
- ✅ Calcolo automatico ripartizione spese
- ✅ Gestione millesimi (tabelle A-L)
- ✅ Preventivi annuali
- ✅ Logica Proprietario/Inquilino

## 🛠️ Stack Tecnologico

| Componente | Tecnologia | Versione |
|-----------|-----------|---------|
| **Backend** | Flask (Python) | 3.x |
| **Frontend** | React (CDN) | 18.x |
| **Database** | SQLite 3 | Locale |
| **Auth** | JWT Tokens | Semplice |
| **Build** | No build tools | Vanilla HTML/JS |

## 🚀 Avvio Rapido

### Windows
1. Doppio click su `run.bat`
2. Attendi l'installazione automatica
3. Apri http://localhost:5000

### Linux/macOS
1. Terminale: `chmod +x run.sh`
2. Esegui: `./run.sh`
3. Apri http://localhost:5000

### Manuale
```bash
# 1. Virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 2. Dipendenze
pip install -r backend/requirements.txt

# 3. Avvio
cd backend
python app.py
```

## 🔑 Login di Default

```
Username: admin
Password: admin123
```

## 📁 Struttura Progetto

```
condominio-nuovo/
├── backend/
│   ├── app.py                    # Flask main + routes
│   ├── database.py              # SQLite schema & helpers
│   ├── models.py                # ORM models
│   ├── utils.py                 # Helper functions
│   ├── requirements.txt         # Dependencies
│   └── condominio_nuovo.db     # Database (auto-create)
├── frontend/
│   ├── index.html               # Main HTML + React
│   ├── styles.css               # CSS styles
│   └── app.js                   # React components
├── run.sh / run.bat            # Script di avvio
└── README.md                   # Questo file
```

## 🎯 Funzionalità Principali

### 1. Dashboard Condominii
- Creazione nuovi condominii
- Lista condominii con statistice
- Accesso rapido alla gestione

### 2. Gestione Persone
- Aggiunta proprietari e inquilini
- Associazione a unità immobiliari
- Modifica ed eliminazione

### 3. Millesimi
- 10 tabelle (A, B, C, D, E, F, G, H, I, L)
- Validazione automatica totale = 1000
- Assegnazione per unità (non persone)

### 4. Gestione Spese
- Registrazione spese condominiali
- Logica P/I (Proprietario/Inquilino)
- Tabella millesimi associata

### 5. Calcolo Ripartizione
- Calcolo automatico distribuzione spese
- Dettaglio per persona
- Ricalcolo su richiesta

### 6. Preventivo Annuale
- Generazione preventivi automatici
- Confronto preventivato vs speso
- Storico preventivi per anno

## 📊 Logica Business

### Millesimi
- Assegnati **per unità**, non per persona
- Tutte le persone della stessa unità condividono i millesimi
- Ogni tabella deve totalizzare 1000 millesimi

### Logica P/I (Proprietario/Inquilino)
- **Proprietario**: 100% proprietario, 0% inquilino
- **Inquilino**: 0% proprietario, 100% inquilino
- **50/50**: Divisione equa
- **Personalizzato**: Percentuali personalizzabili

### Formula Calcolo
```
Importo_Persona = (Importo_Spesa × Millesimi_Unita × %_Tipo) ÷ 1000
```

## 🔐 Sicurezza

- Autenticazione JWT con token 24h
- Validazione input lato server
- CORS configurato per localhost
- Database locale (nessun cloud)

## 📡 API Endpoints

### Authentication
- `POST /api/login` - Login
- `POST /api/logout` - Logout

### Condominii
- `GET /api/condominii` - Lista condominii
- `POST /api/condominii` - Crea condominio
- `DELETE /api/condominii/<id>` - Elimina condominio

### Persone
- `GET /api/condominii/<id>/persone` - Lista persone
- `POST /api/condominii/<id>/persone` - Crea persona
- `DELETE /api/persone/<id>` - Elimina persona

### Millesimi
- `GET /api/condominii/<id>/millesimi` - Tutti millesimi
- `POST /api/condominii/<id>/millesimi` - Salva millesimi

### Spese
- `GET /api/condominii/<id>/spese` - Lista spese
- `POST /api/condominii/<id>/spese` - Crea spesa
- `DELETE /api/spese/<id>` - Elimina spesa

### Ripartizione
- `GET /api/condominii/<id>/ripartizione` - Calcola ripartizione

### Preventivi
- `GET /api/condominii/<id>/preventivi` - Lista preventivi
- `POST /api/condominii/<id>/preventivi/<anno>/genera` - Genera preventivo

## 🎨 Interfaccia Utente

### Design
- Moderno con gradienti e ombre
- Responsive per mobile/tablet/desktop
- Colori: Purple gradient theme
- Icone emoji per immediatezza

### Navigazione
1. **Login**: Accesso sicuro
2. **Dashboard**: Overview condominii
3. **Menu Condominio**: Accesso funzioni gestione
4. **Sezioni Dettaglio**: Persone, Millesimi, Spese, etc.

## 🛠️ Sviluppo

### Estensioni
- Aggiungere nuovi tipi di logiche P/I
- Implementare calcolo anno successivo
- Aggiungere export PDF
- Backup/restore database

### Customizzazione
- Modificare colori in `styles.css`
- Aggiungere nuove sezioni in `app.js`
- Estendere API in `app.py`
- Nuove tabelle database in `database.py`

## 🐛 Troubleshooting

### Problemi Comuni
- **Porta 5000 occupata**: Cambiare porta in `app.py`
- **Python non trovato**: Installare Python 3.8+
- **Dipendenze mancanti**: Eseguire `pip install -r requirements.txt`
- **Database corrotto**: Eliminare `condominio_nuovo.db`

### Log
- Errori backend: console Flask
- Errori frontend: browser console (F12)
- Errori database: `error.log` (se creato)

## 📄 Licenza

MIT License - Libero utilizzo e modifica

## 🤝 Supporto

Per problemi o richieste:
1. Controllare troubleshooing sopra
2. Verificare log console
3. Restart completo applicazione

---

**🏢 CONDOMINIO NUOVO** - Gestione condominiale semplificata, veloce ed efficace.