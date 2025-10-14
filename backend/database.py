import sqlite3
import os
from datetime import datetime

DATABASE_PATH = os.getenv('CONDOMINIO_DB_PATH', 'condominio_nuovo.db')

def get_db():
    """Ottiene una connessione al database SQLite con timeout e configurazione ottimizzata"""
    conn = sqlite3.connect(DATABASE_PATH, timeout=30.0)  # Timeout di 30 secondi
    conn.row_factory = sqlite3.Row

    # Configurazione SQLite per migliorare la gestione della concorrenza
    conn.execute('PRAGMA journal_mode=WAL')  # Write-Ahead Logging per migliore concorrenza
    conn.execute('PRAGMA synchronous=NORMAL')  # Bilanciamento tra sicurezza e performance
    conn.execute('PRAGMA cache_size=10000')  # Cache più grande per performance
    conn.execute('PRAGMA temp_store=MEMORY')  # Temp tables in memoria

    return conn

def init_db():
    """Inizializza il database con tutte le tabelle necessarie"""
    conn = get_db()
    cursor = conn.cursor()

    # Aggiunge la colonna data_spesa alla tabella spese se non esiste (per compatibilità con database esistenti)
    try:
        cursor.execute("ALTER TABLE spese ADD COLUMN data_spesa DATE")
        # Aggiorna le spese esistenti con la data di creazione come data_spesa
        cursor.execute("UPDATE spese SET data_spesa = DATE(created_at) WHERE data_spesa IS NULL")
    except sqlite3.OperationalError:
        # La colonna esiste già, ignora l'errore
        pass

    # Tabella users
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Tabella condominii
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS condominii (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            nome TEXT NOT NULL,
            indirizzo TEXT,
            num_unita INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    ''')

    # Tabella unita_immobiliari
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS unita_immobiliari (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            condominio_id INTEGER NOT NULL,
            numero_unita INTEGER NOT NULL,
            FOREIGN KEY (condominio_id) REFERENCES condominii(id) ON DELETE CASCADE,
            UNIQUE (condominio_id, numero_unita)
        )
    ''')

    # Tabella persone
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS persone (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            condominio_id INTEGER NOT NULL,
            unita_id INTEGER NOT NULL,
            nome TEXT NOT NULL,
            cognome TEXT NOT NULL,
            email TEXT,
            tipo_persona TEXT NOT NULL CHECK (tipo_persona IN ('proprietario', 'inquilino', 'proprietario_inquilino')),
            FOREIGN KEY (condominio_id) REFERENCES condominii(id) ON DELETE CASCADE,
            FOREIGN KEY (unita_id) REFERENCES unita_immobiliari(id) ON DELETE CASCADE
        )
    ''')

    # Tabella millesimi (per tutte le tabelle A-L)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS millesimi (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            condominio_id INTEGER NOT NULL,
            unita_id INTEGER NOT NULL,
            tabella TEXT NOT NULL CHECK (tabella IN ('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'L')),
            valore INTEGER NOT NULL CHECK (valore >= 0 AND valore <= 1000),
            FOREIGN KEY (condominio_id) REFERENCES condominii(id) ON DELETE CASCADE,
            FOREIGN KEY (unita_id) REFERENCES unita_immobiliari(id) ON DELETE CASCADE,
            UNIQUE (condominio_id, unita_id, tabella)
        )
    ''')

    # Tabella spese
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS spese (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            condominio_id INTEGER NOT NULL,
            descrizione TEXT NOT NULL,
            importo REAL NOT NULL CHECK (importo > 0),
            data_spesa DATE NOT NULL,
            tabella_millesimi TEXT NOT NULL CHECK (tabella_millesimi IN ('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'L')),
            logica_pi TEXT NOT NULL CHECK (logica_pi IN ('proprietario', 'inquilino', '50/50', 'personalizzato')),
            percentuale_proprietario REAL DEFAULT 100 CHECK (percentuale_proprietario >= 0 AND percentuale_proprietario <= 100),
            percentuale_inquilino REAL DEFAULT 0 CHECK (percentuale_inquilino >= 0 AND percentuale_inquilino <= 100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (condominio_id) REFERENCES condominii(id) ON DELETE CASCADE
        )
    ''')

    # Tabella ripartizione_spese
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS ripartizione_spese (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            condominio_id INTEGER NOT NULL,
            persona_id INTEGER NOT NULL,
            spesa_id INTEGER NOT NULL,
            importo_dovuto REAL NOT NULL,
            anno INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (condominio_id) REFERENCES condominii(id) ON DELETE CASCADE,
            FOREIGN KEY (persona_id) REFERENCES persone(id) ON DELETE CASCADE,
            FOREIGN KEY (spesa_id) REFERENCES spese(id) ON DELETE CASCADE
        )
    ''')

    # Tabella preventivi_annuali
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS preventivi_annuali (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            condominio_id INTEGER NOT NULL,
            anno INTEGER NOT NULL,
            importo_totale_preventivato REAL NOT NULL,
            importo_totale_speso REAL DEFAULT 0,
            differenza REAL DEFAULT 0,
            note TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (condominio_id) REFERENCES condominii(id) ON DELETE CASCADE,
            UNIQUE (condominio_id, anno)
        )
    ''')

    # Tabella preventivi_dettaglio
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS preventivi_dettaglio (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            preventivo_id INTEGER NOT NULL,
            persona_id INTEGER NOT NULL,
            importo_preventivato REAL NOT NULL,
            importo_effettivo REAL DEFAULT 0,
            differenza REAL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (preventivo_id) REFERENCES preventivi_annuali(id) ON DELETE CASCADE,
            FOREIGN KEY (persona_id) REFERENCES persone(id) ON DELETE CASCADE,
            UNIQUE (preventivo_id, persona_id)
        )
    ''')

    # Tabella spese_preventivate
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS spese_preventivate (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            condominio_id INTEGER NOT NULL,
            preventivo_id INTEGER NOT NULL,
            descrizione TEXT NOT NULL,
            importo_previsto REAL NOT NULL CHECK (importo_previsto > 0),
            tabella_millesimi TEXT NOT NULL CHECK (tabella_millesimi IN ('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'L')),
            logica_pi TEXT NOT NULL CHECK (logica_pi IN ('proprietario', 'inquilino', '50/50', 'personalizzato')),
            percentuale_proprietario REAL DEFAULT 100 CHECK (percentuale_proprietario >= 0 AND percentuale_proprietario <= 100),
            percentuale_inquilino REAL DEFAULT 0 CHECK (percentuale_inquilino >= 0 AND percentuale_inquilino <= 100),
            mese_previsto INTEGER CHECK (mese_previsto BETWEEN 1 AND 12),
            data_prevista DATE,
            note TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (condominio_id) REFERENCES condominii(id) ON DELETE CASCADE,
            FOREIGN KEY (preventivo_id) REFERENCES preventivi_annuali(id) ON DELETE CASCADE
        )
    ''')

    # Migrazione leggera: aggiunge colonna data_prevista se non esiste (per DB esistenti)
    try:
        cursor.execute("ALTER TABLE spese_preventivate ADD COLUMN data_prevista DATE")
    except sqlite3.OperationalError:
        pass

    # Tabella ripartizione_preventivo
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS ripartizione_preventivo (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            condominio_id INTEGER NOT NULL,
            preventivo_id INTEGER NOT NULL,
            persona_id INTEGER NOT NULL,
            importo_previsto_dovuto REAL NOT NULL,
            anno INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (condominio_id) REFERENCES condominii(id) ON DELETE CASCADE,
            FOREIGN KEY (preventivo_id) REFERENCES preventivi_annuali(id) ON DELETE CASCADE,
            FOREIGN KEY (persona_id) REFERENCES persone(id) ON DELETE CASCADE,
            UNIQUE (preventivo_id, persona_id)
        )
    ''')

    # Tabella storici_anni
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS storici_anni (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            condominio_id INTEGER NOT NULL,
            anno INTEGER NOT NULL,
            importo_totale_speso REAL NOT NULL,
            note TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (condominio_id) REFERENCES condominii(id) ON DELETE CASCADE,
            UNIQUE (condominio_id, anno)
        )
    ''')

    conn.commit()
    conn.close()
    print(f"Database inizializzato con successo: {DATABASE_PATH}")

def create_default_user():
    """Crea l'utente di default se non esiste"""
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM users WHERE username = ?", ('admin',))
    if cursor.fetchone() is None:
        # In un'app reale, qui bisognerebbe usare password hashing
        cursor.execute("INSERT INTO users (username, password) VALUES (?, ?)",
                      ('admin', 'admin123'))
        conn.commit()
        print("Utente default creato: admin/admin123")

    conn.close()

def validate_millesimi_total(condominio_id, tabella):
    """Verifica che il totale dei millesimi per una tabella sia 1000"""
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute('''
        SELECT SUM(valore) as totale
        FROM millesimi
        WHERE condominio_id = ? AND tabella = ?
    ''', (condominio_id, tabella))

    result = cursor.fetchone()
    conn.close()

    return result['totale'] == 1000 if result['totale'] else False

def get_condominio_unita(condominio_id):
    """Ottiene tutte le unità immobiliari di un condominio"""
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute('''
        SELECT ui.*,
               GROUP_CONCAT(p.nome || ' ' || p.cognome || ' (' || p.tipo_persona || ')', ', ') as persone
        FROM unita_immobiliari ui
        LEFT JOIN persone p ON ui.id = p.unita_id
        WHERE ui.condominio_id = ?
        GROUP BY ui.id
        ORDER BY ui.numero_unita
    ''', (condominio_id,))

    unita = cursor.fetchall()
    conn.close()
    return unita

def get_millesimi_tabella(condominio_id, tabella):
    """Ottiene i millesimi per una specifica tabella di un condominio"""
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute('''
        SELECT m.*, ui.numero_unita
        FROM millesimi m
        JOIN unita_immobiliari ui ON m.unita_id = ui.id
        WHERE m.condominio_id = ? AND m.tabella = ?
        ORDER BY ui.numero_unita
    ''', (condominio_id, tabella))

    millesimi = cursor.fetchall()
    conn.close()
    return millesimi

def get_persone_condominio(condominio_id):
    """Ottiene tutte le persone di un condominio con dettagli unità"""
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute('''
        SELECT p.*, ui.numero_unita
        FROM persone p
        JOIN unita_immobiliari ui ON p.unita_id = ui.id
        WHERE p.condominio_id = ?
        ORDER BY ui.numero_unita, p.cognome, p.nome
    ''', (condominio_id,))

    persone = cursor.fetchall()
    conn.close()
    return persone

def calculate_ripartizione_spesa(condominio_id, spesa_id):
    """Calcola la ripartizione di una spesa tra le persone"""
    conn = get_db()
    cursor = conn.cursor()

    # Ottieni dettagli spesa
    cursor.execute('SELECT * FROM spese WHERE id = ?', (spesa_id,))
    spesa = cursor.fetchone()

    if not spesa:
        conn.close()
        return []

    # Ottieni tutte le persone del condominio
    persone = get_persone_condominio(condominio_id)
    # Prepara mappa ruoli per unità per gestire il caso 50/50
    unita_ruoli = {}
    for p in persone:
        uid = p['unita_id']
        if uid not in unita_ruoli:
            unita_ruoli[uid] = set()
        if p['tipo_persona'] == 'proprietario_inquilino':
            unita_ruoli[uid].update({'proprietario', 'inquilino'})
        else:
            unita_ruoli[uid].add(p['tipo_persona'])
    risultati = []

    for persona in persone:
        # Ottieni millesimi dell'unità della persona per la tabella della spesa
        cursor.execute('''
            SELECT valore FROM millesimi
            WHERE unita_id = ? AND tabella = ? AND condominio_id = ?
        ''', (persona['unita_id'], spesa['tabella_millesimi'], condominio_id))

        millesimo_result = cursor.fetchone()
        if not millesimo_result:
            continue

        millesimi = millesimo_result['valore']

        # Calcola percentuale in base alla logica P/I
        if spesa['logica_pi'] == 'proprietario':
            percentuale = 100 if persona['tipo_persona'] in ('proprietario', 'proprietario_inquilino') else 0
        elif spesa['logica_pi'] == 'inquilino':
            percentuale = 100 if persona['tipo_persona'] in ('inquilino', 'proprietario_inquilino') else 0
        elif spesa['logica_pi'] == '50/50':
            if persona['tipo_persona'] == 'proprietario_inquilino':
                percentuale = 100
            else:
                ruoli_presenti = unita_ruoli.get(persona['unita_id'], set())
                if 'proprietario' in ruoli_presenti and 'inquilino' in ruoli_presenti:
                    percentuale = 50
                else:
                    percentuale = 100
        else:  # personalizzato
            percentuale = spesa['percentuale_proprietario'] if persona['tipo_persona'] == 'proprietario' else spesa['percentuale_inquilino']

        # Calcola importo dovuto
        importo_dovuto = (spesa['importo'] * millesimi * percentuale / 100) / 1000

        risultati.append({
            'persona_id': persona['id'],
            'nome': persona['nome'],
            'cognome': persona['cognome'],
            'tipo_persona': persona['tipo_persona'],
            'numero_unita': persona['numero_unita'],
            'millesimi': millesimi,
            'percentuale': percentuale,
            'importo_dovuto': importo_dovuto
        })

    conn.close()
    return risultati

if __name__ == '__main__':
    init_db()
    create_default_user()
