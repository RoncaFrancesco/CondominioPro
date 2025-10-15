# Condominio Pro - Deploy su Render.com

Questa guida spiega come pubblicare l'applicazione su Render.com.

## Prerequisiti

- Account GitHub collegato a Render.com
- Repository GitHub con il codice del progetto

## Procedura di Deploy

### 1) Fork del repository

1. Fai fork del repository sul tuo account GitHub
2. Verifica che siano presenti:
   - `requirements.txt`
   - `render.yaml`
   - `backend/app.py` e `backend/database_universal.py`
   - `frontend/` (file statici)

### 2) Nuovo servizio su Render

1. Accedi a Render.com
2. Clicca “New +” → “Web Service”
3. Seleziona il repository GitHub
4. Render rileverà automaticamente `render.yaml`

### 3) Risorse create

- Database PostgreSQL (gratuito) collegato al servizio
- Backend Flask avviato con `gunicorn`
- Frontend statico servito da Flask (cartella `frontend`)

### 4) Variabili d'ambiente

- `DATABASE_URL`: connection string PostgreSQL (impostata da Render)
- `SECRET_KEY`: chiave JWT (generata dal template)
- `PYTHON_VERSION`: versione Python

### 5) Deploy automatico

Render esegue automaticamente:
1. Installazione dipendenze (`requirements.txt`)
2. Creazione database + migrazioni iniziali
3. Avvio `gunicorn backend.app:app`

## Accesso

- App: URL del servizio web su Render
- API: `/api/...` sullo stesso dominio

## Test locale

```
pip install -r requirements.txt
python backend/app.py
```

## Note

- In produzione viene usato PostgreSQL (se `DATABASE_URL` è impostata), in locale SQLite.
- CORS configurabile con `CORS_ORIGINS`/`FRONTEND_ORIGIN`.
