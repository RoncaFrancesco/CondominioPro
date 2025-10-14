import os
import sqlite3
from datetime import datetime

# Importa psycopg2 solo se necessario
try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
    PSYCOPG2_AVAILABLE = True
except ImportError:
    PSYCOPG2_AVAILABLE = False

# Determina il tipo di database dall'environment
DATABASE_URL = os.getenv('DATABASE_URL')
IS_POSTGRES = DATABASE_URL and DATABASE_URL.startswith('postgres') and PSYCOPG2_AVAILABLE

def get_db():
    """Ottiene una connessione al database (SQLite o PostgreSQL)"""
    if IS_POSTGRES:
        return get_postgres_db()
    else:
        return get_sqlite_db()

def get_sqlite_db():
    """Connessione SQLite per sviluppo locale"""
    DATABASE_PATH = os.getenv('CONDOMINIO_DB_PATH', 'condominio_nuovo.db')
    conn = sqlite3.connect(DATABASE_PATH, timeout=30.0)
    conn.row_factory = sqlite3.Row

    # Configurazione SQLite
    conn.execute('PRAGMA journal_mode=WAL')
    conn.execute('PRAGMA synchronous=NORMAL')
    conn.execute('PRAGMA cache_size=10000')
    conn.execute('PRAGMA temp_store=MEMORY')

    return conn

def get_postgres_db():
    """Connessione PostgreSQL per produzione"""
    conn = psycopg2.connect(DATABASE_URL)
    return conn

def init_db():
    """Inizializza il database con tutte le tabelle necessarie"""
    if IS_POSTGRES:
        init_postgres_db()
    else:
        init_sqlite_db()

def init_sqlite_db():
    """Inizializza il database SQLite"""
    conn = get_sqlite_db()
    cursor = conn.cursor()

    # Aggiunge la colonna data_spesa se non esiste
    try:
        cursor.execute("ALTER TABLE spese ADD COLUMN data_spesa DATE")
        cursor.execute("UPDATE spese SET data_spesa = DATE(created_at) WHERE data_spesa IS NULL")
    except sqlite3.OperationalError:
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

    # Tabella millesimi
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

    # Aggiunge colonna data_prevista se non esiste
    try:
        cursor.execute("ALTER TABLE spese_preventivate ADD COLUMN data_prevista DATE")
    except sqlite3.OperationalError:
        pass

    conn.commit()
    conn.close()
    print(f"Database SQLite inizializzato con successo")

def init_postgres_db():
    """Inizializza il database PostgreSQL"""
    conn = get_postgres_db()
    cursor = conn.cursor()

    # Tabella users
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Tabella condominii
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS condominii (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            nome TEXT NOT NULL,
            indirizzo TEXT,
            num_unita INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Tabella unita_immobiliari
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS unita_immobiliari (
            id SERIAL PRIMARY KEY,
            condominio_id INTEGER NOT NULL REFERENCES condominii(id) ON DELETE CASCADE,
            numero_unita INTEGER NOT NULL,
            UNIQUE (condominio_id, numero_unita)
        )
    ''')

    # Tabella persone
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS persone (
            id SERIAL PRIMARY KEY,
            condominio_id INTEGER NOT NULL REFERENCES condominii(id) ON DELETE CASCADE,
            unita_id INTEGER NOT NULL REFERENCES unita_immobiliari(id) ON DELETE CASCADE,
            nome TEXT NOT NULL,
            cognome TEXT NOT NULL,
            email TEXT,
            tipo_persona TEXT NOT NULL CHECK (tipo_persona IN ('proprietario', 'inquilino', 'proprietario_inquilino'))
        )
    ''')

    # Tabella millesimi
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS millesimi (
            id SERIAL PRIMARY KEY,
            condominio_id INTEGER NOT NULL REFERENCES condominii(id) ON DELETE CASCADE,
            unita_id INTEGER NOT NULL REFERENCES unita_immobiliari(id) ON DELETE CASCADE,
            tabella TEXT NOT NULL CHECK (tabella IN ('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'L')),
            valore INTEGER NOT NULL CHECK (valore >= 0 AND valore <= 1000),
            UNIQUE (condominio_id, unita_id, tabella)
        )
    ''')

    # Tabella spese
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS spese (
            id SERIAL PRIMARY KEY,
            condominio_id INTEGER NOT NULL REFERENCES condominii(id) ON DELETE CASCADE,
            descrizione TEXT NOT NULL,
            importo REAL NOT NULL CHECK (importo > 0),
            data_spesa DATE NOT NULL,
            tabella_millesimi TEXT NOT NULL CHECK (tabella_millesimi IN ('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'L')),
            logica_pi TEXT NOT NULL CHECK (logica_pi IN ('proprietario', 'inquilino', '50/50', 'personalizzato')),
            percentuale_proprietario REAL DEFAULT 100 CHECK (percentuale_proprietario >= 0 AND percentuale_proprietario <= 100),
            percentuale_inquilino REAL DEFAULT 0 CHECK (percentuale_inquilino >= 0 AND percentuale_inquilino <= 100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Tabella ripartizione_spese
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS ripartizione_spese (
            id SERIAL PRIMARY KEY,
            condominio_id INTEGER NOT NULL REFERENCES condominii(id) ON DELETE CASCADE,
            persona_id INTEGER NOT NULL REFERENCES persone(id) ON DELETE CASCADE,
            spesa_id INTEGER NOT NULL REFERENCES spese(id) ON DELETE CASCADE,
            importo_dovuto REAL NOT NULL,
            anno INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Tabella preventivi_annuali
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS preventivi_annuali (
            id SERIAL PRIMARY KEY,
            condominio_id INTEGER NOT NULL REFERENCES condominii(id) ON DELETE CASCADE,
            anno INTEGER NOT NULL,
            importo_totale_preventivato REAL NOT NULL,
            importo_totale_speso REAL DEFAULT 0,
            differenza REAL DEFAULT 0,
            note TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE (condominio_id, anno)
        )
    ''')

    # Tabella spese_preventivate
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS spese_preventivate (
            id SERIAL PRIMARY KEY,
            condominio_id INTEGER NOT NULL REFERENCES condominii(id) ON DELETE CASCADE,
            preventivo_id INTEGER NOT NULL REFERENCES preventivi_annuali(id) ON DELETE CASCADE,
            descrizione TEXT NOT NULL,
            importo_previsto REAL NOT NULL CHECK (importo_previsto > 0),
            tabella_millesimi TEXT NOT NULL CHECK (tabella_millesimi IN ('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'L')),
            logica_pi TEXT NOT NULL CHECK (logica_pi IN ('proprietario', 'inquilino', '50/50', 'personalizzato')),
            percentuale_proprietario REAL DEFAULT 100 CHECK (percentuale_proprietario >= 0 AND percentuale_proprietario <= 100),
            percentuale_inquilino REAL DEFAULT 0 CHECK (percentuale_inquilino >= 0 AND percentuale_inquilino <= 100),
            mese_previsto INTEGER CHECK (mese_previsto BETWEEN 1 AND 12),
            data_prevista DATE,
            note TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    conn.commit()
    conn.close()
    print("Database PostgreSQL inizializzato con successo")

def create_default_user():
    """Crea l'utente di default se non esiste"""
    conn = get_db()
    cursor = conn.cursor()

    if IS_POSTGRES:
        cursor.execute("SELECT * FROM users WHERE username = %s", ('admin',))
    else:
        cursor.execute("SELECT * FROM users WHERE username = ?", ('admin',))

    if cursor.fetchone() is None:
        if IS_POSTGRES:
            cursor.execute("INSERT INTO users (username, password) VALUES (%s, %s)",
                          ('admin', 'admin123'))
        else:
            cursor.execute("INSERT INTO users (username, password) VALUES (?, ?)",
                          ('admin', 'admin123'))
        conn.commit()
        print("Utente default creato: admin/admin123")

    conn.close()

# Altre funzioni del database rimangono uguali ma adattate per entrambi i tipi di DB
def validate_millesimi_total(condominio_id, tabella):
    """Verifica che il totale dei millesimi per una tabella sia 1000"""
    conn = get_db()
    cursor = conn.cursor()

    if IS_POSTGRES:
        cursor.execute('''
            SELECT SUM(valore) as totale
            FROM millesimi
            WHERE condominio_id = %s AND tabella = %s
        ''', (condominio_id, tabella))
    else:
        cursor.execute('''
            SELECT SUM(valore) as totale
            FROM millesimi
            WHERE condominio_id = ? AND tabella = ?
        ''', (condominio_id, tabella))

    result = cursor.fetchone()
    conn.close()

    if IS_POSTGRES:
        return result['totale'] == 1000 if result and result['totale'] else False
    else:
        return result['totale'] == 1000 if result and result['totale'] else False

def get_condominio_unita(condominio_id):
    """Ottiene tutte le unità immobiliari di un condominio"""
    conn = get_db()
    cursor = conn.cursor()

    if IS_POSTGRES:
        cursor.execute('''
            SELECT ui.*,
                   STRING_AGG(p.nome || ' ' || p.cognome || ' (' || p.tipo_persona || ')', ', ') as persone
            FROM unita_immobiliari ui
            LEFT JOIN persone p ON ui.id = p.unita_id
            WHERE ui.condominio_id = %s
            GROUP BY ui.id
            ORDER BY ui.numero_unita
        ''', (condominio_id,))
    else:
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

    if IS_POSTGRES:
        cursor.execute('''
            SELECT m.*, ui.numero_unita
            FROM millesimi m
            JOIN unita_immobiliari ui ON m.unita_id = ui.id
            WHERE m.condominio_id = %s AND m.tabella = %s
            ORDER BY ui.numero_unita
        ''', (condominio_id, tabella))
    else:
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

    if IS_POSTGRES:
        cursor.execute('''
            SELECT p.*, ui.numero_unita
            FROM persone p
            JOIN unita_immobiliari ui ON p.unita_id = ui.id
            WHERE p.condominio_id = %s
            ORDER BY ui.numero_unita, p.cognome, p.nome
        ''', (condominio_id,))
    else:
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

if __name__ == '__main__':
    init_db()
    create_default_user()