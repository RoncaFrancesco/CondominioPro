# Condominio – WebApp

Gestione condominiale completa: login JWT, dashboard, gestione condominii/persone/unità, millesimi A–L, spese, ripartizioni, preventivi, ed export Word.

## Stack

- Backend: Flask (Python)
- Frontend: React (statico, via CDN)
- Database: SQLite (locale) / PostgreSQL (produzione)
- Auth: JWT tokens

## Funzionalità principali

- Login sicuro con JWT
- Gestione multi‑condominio
- Gestione persone e unità immobiliari
- Millesimi (tabelle A–L) con validazione totale = 1000
- Gestione spese con logica P/I (proprietario/inquilino, 50/50, personalizzato)
- Calcolo ripartizioni (totale e dettagli per tabella/persona)
- Preventivi annuali (spese preventivate, ripartizione, analisi anno successivo)
- Esportazione documenti Word (spese, ripartizioni, preventivi)

## Avvio locale

Prerequisiti: Python 3.8+

1) Installazione dipendenze

```
pip install -r requirements.txt
```

2) Avvio

- Windows: doppio click su `start.bat` (avvia `backend/app.py`)
- Manuale:

```
cd backend
python app.py
```

Backend in ascolto su: http://localhost:5000

Credenziali di default: `admin` / `admin123`

## Deploy (Render.com)

- Il file `render.yaml` configura un servizio web Python con `gunicorn` e un database PostgreSQL.
- Variabili d’ambiente principali:
  - `DATABASE_URL` (PostgreSQL)
  - `SECRET_KEY` (chiave JWT)
  - `PYTHON_VERSION`
- In produzione il backend usa automaticamente PostgreSQL se `DATABASE_URL` è impostata; in locale usa SQLite.

## Sicurezza

- JWT per autenticazione (token lato client)
- Hashing password (SHA‑256 per l’utente predefinito, compatibilità legacy supportata)
- CORS configurabile via env (`CORS_ORIGINS`/`FRONTEND_ORIGIN`)
- Validazione input server‑side

## Struttura

```
backend/
  app.py                 # Flask app + API
  models.py              # Modelli e accesso dati
  database_universal.py  # SQLite/Postgres auto‑switch
  utils.py               # JWT, validazioni, calcoli, export
frontend/
  index.html             # App statica React (CDN + fallback)
  app.js                 # Logica UI
  styles.css             # Stili
render.yaml              # Config Deploy Render
requirements.txt         # Dipendenze
start.bat                # Avvio rapido su Windows
```

---

Condominio – gestione condominiale semplice ed efficace.
