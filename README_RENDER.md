# 🏢 Condominio Pro - Deploy su Render.com

Questa guida spiega come pubblicare l'applicazione di gestione condominiale su Render.com.

## 📋 Prerequisiti

- Account GitHub connesso a Render.com
- Repository GitHub con il codice del progetto

## 🚀 Procedura di Deploy

### 1. Fork del Repository

1. Fai fork del repository sul tuo account GitHub
2. Assicurati che tutti i file siano presenti:
   - `requirements.txt`
   - `render.yaml`
   - `backend/database_universal.py`
   - `backend/app.py`
   - `frontend/` (tutti i file frontend)

### 2. Creazione Nuovo Service su Render

1. Accedi a Render.com con il tuo account GitHub
2. Clicca su **"New +"** → **"Web Service"**
3. Seleziona il repository GitHub del progetto
4. Render rileverà automaticamente il file `render.yaml`

### 3. Configurazione Automatica

Render creerà automaticamente:

- **Database PostgreSQL**: `condominio-db`
- **Backend API**: `condominio-api` (Python Flask)
- **Frontend Static**: `condominio-frontend`

### 4. Variabili d'Ambiente

Render configurerà automaticamente:

- `DATABASE_URL`: Connection string per PostgreSQL
- `FLASK_ENV`: production
- `PYTHON_VERSION`: 3.9.0

### 5. Deploy Automatico

Una volta completata la configurazione, Render:

1. Clonerà il repository
2. Installerà le dipendenze da `requirements.txt`
3. Creerà il database PostgreSQL
4. Eseguirà le migrazioni automatiche
5. Avvierà l'applicazione

## 🌐 Accesso all'Applicazione

Dopo il deploy:

- **Frontend**: `https://tuonome.onrender.com`
- **API Backend**: `https://condominio-api.onrender.com`
- **Database**: Accessibile tramite connection string

## 📁 Struttura dei File

```
condominio/
├── backend/
│   ├── app.py              # API Flask
│   ├── database_universal.py # Database universale (SQLite/PostgreSQL)
│   └── requirements.txt     # Dipendenze Python
├── frontend/
│   ├── index.html          # Pagina principale
│   ├── app.js              # Applicazione JavaScript
│   └── styles.css          # Stili CSS
├── render.yaml             # Configurazione Render
└── README_RENDER.md        # Questa guida
```

## 🔧 Database Supportato

L'applicazione supporta automaticamente:

- **Sviluppo locale**: Database SQLite
- **Produzione su Render**: Database PostgreSQL

Il codice rileva automaticamente l'ambiente e usa il database appropriato.

## 🛠️ Comandi Utili

### Test Locale
```bash
# Avvio in sviluppo (SQLite)
python backend/app.py
```

### Debug su Render
- Controlla i logs su Render Dashboard
- Verifica le variabili d'ambiente
- Testa le API endpoints

## 📚 Funzionalità Supportate

- ✅ Autenticazione utenti
- ✅ Gestione condominii
- ✅ Gestione persone e unità immobiliari
- ✅ Millesimi per tabelle A-L
- ✅ Gestione spese
- ✅ Calcolo ripartizioni
- ✅ Preventivi annuali
- ✅ Esportazione Word
- ✅ Database persistente su PostgreSQL

## 🔒 Sicurezza

- Login con JWT tokens
- Password hashing (implementare in produzione)
- Validazione input server-side
- CORS configurato per frontend

## 📱 Mobile Responsive

L'applicazione è completamente responsive e funziona su:
- Desktop
- Tablet
- Smartphone

## 🆘 Supporto

In caso di problemi:

1. Controlla i logs di deploy su Render
2. Verifica che tutti i file siano nel repository
3. Assicurati che `render.yaml` sia valido
4. Controlla le variabili d'ambiente

## 🎯 Prossimi Miglioramenti

- Implementare password hashing con bcrypt
- Aggiungere backup automatici del database
- Configurare dominio personalizzato
- Implementare notifiche email
- Aggiungere sistema di roles/permissions