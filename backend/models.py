from database_universal import get_db, exec_sql
from datetime import datetime
import json

class User:
    """Modello per la tabella users"""

    def __init__(self, username=None, password=None, id=None, created_at=None):
        self.id = id
        self.username = username
        self.password = password
        self.created_at = created_at

    @classmethod
    def find_by_username(cls, username):
        """Trova utente per username"""
        conn = get_db()
        cursor = conn.cursor()
        exec_sql(cursor, "SELECT * FROM users WHERE username = ?", (username,))
        row = cursor.fetchone()
        conn.close()

        if row:
            return cls(
                id=row['id'],
                username=row['username'],
                password=row['password'],
                created_at=row['created_at']
            )
        return None

    @classmethod
    def find_by_id(cls, user_id):
        """Trova utente per ID"""
        conn = get_db()
        cursor = conn.cursor()
        exec_sql(cursor, "SELECT * FROM users WHERE id = ?", (user_id,))
        row = cursor.fetchone()
        conn.close()

        if row:
            return cls(
                id=row['id'],
                username=row['username'],
                password=row['password'],
                created_at=row['created_at']
            )
        return None

    def save(self):
        """Salva utente nel database"""
        conn = get_db()
        cursor = conn.cursor()

        if self.id:
            exec_sql(cursor, """
                UPDATE users SET username = ?, password = ?
                WHERE id = ?
            """, (self.username, self.password, self.id))
        else:
            exec_sql(cursor, """
                INSERT INTO users (username, password)
                VALUES (?, ?)
            """, (self.username, self.password))
            self.id = cursor.lastrowid

        conn.commit()
        conn.close()
        return self

class Condominio:
    """Modello per la tabella condominii"""

    def __init__(self, user_id=None, nome=None, indirizzo=None, num_unita=None,
                 anno_costruzione=None, numero_scale=None, presidente_assemblea=None,
                 responsabile=None, telefono_responsabile=None, email_responsabile=None,
                 amministratore_esterno=None, partita_iva=None, iban_condominio=None,
                 banca_appoggio=None, descrizione_edificio=None, note_interne=None,
                 id=None, created_at=None):
        self.id = id
        self.user_id = user_id
        self.nome = nome
        self.indirizzo = indirizzo
        self.num_unita = num_unita
        self.anno_costruzione = anno_costruzione
        self.numero_scale = numero_scale
        self.presidente_assemblea = presidente_assemblea
        self.responsabile = responsabile
        self.telefono_responsabile = telefono_responsabile
        self.email_responsabile = email_responsabile
        self.amministratore_esterno = amministratore_esterno
        self.partita_iva = partita_iva
        self.iban_condominio = iban_condominio
        self.banca_appoggio = banca_appoggio
        self.descrizione_edificio = descrizione_edificio
        self.note_interne = note_interne
        self.created_at = created_at

    @classmethod
    def get_by_user_id(cls, user_id):
        """Ottiene tutti i condominii di un utente"""
        conn = get_db()
        cursor = conn.cursor()
        exec_sql(cursor, """
            SELECT * FROM condominii
            WHERE user_id = ?
            ORDER BY created_at DESC
        """, (user_id,))

        condominii = []
        for row in cursor.fetchall():
            condominii.append(cls(
                id=row['id'],
                user_id=row['user_id'],
                nome=row['nome'],
                indirizzo=row['indirizzo'],
                num_unita=row['num_unita'],
                anno_costruzione=row['anno_costruzione'] if 'anno_costruzione' in row.keys() else None,
                numero_scale=row['numero_scale'] if 'numero_scale' in row.keys() else None,
                presidente_assemblea=row['presidente_assemblea'] if 'presidente_assemblea' in row.keys() else None,
                responsabile=row['responsabile'] if 'responsabile' in row.keys() else None,
                telefono_responsabile=row['telefono_responsabile'] if 'telefono_responsabile' in row.keys() else None,
                email_responsabile=row['email_responsabile'] if 'email_responsabile' in row.keys() else None,
                amministratore_esterno=row['amministratore_esterno'] if 'amministratore_esterno' in row.keys() else None,
                partita_iva=row['partita_iva'] if 'partita_iva' in row.keys() else None,
                iban_condominio=row['iban_condominio'] if 'iban_condominio' in row.keys() else None,
                banca_appoggio=row['banca_appoggio'] if 'banca_appoggio' in row.keys() else None,
                descrizione_edificio=row['descrizione_edificio'] if 'descrizione_edificio' in row.keys() else None,
                note_interne=row['note_interne'] if 'note_interne' in row.keys() else None,
                created_at=row['created_at']
            ))

        conn.close()
        return condominii

    @classmethod
    def find_by_id(cls, condo_id):
        """Trova condominio per ID"""
        conn = get_db()
        cursor = conn.cursor()
        exec_sql(cursor, "SELECT * FROM condominii WHERE id = ?", (condo_id,))
        row = cursor.fetchone()
        conn.close()

        if row:
            return cls(
                id=row['id'],
                user_id=row['user_id'],
                nome=row['nome'],
                indirizzo=row['indirizzo'],
                num_unita=row['num_unita'],
                anno_costruzione=row['anno_costruzione'] if 'anno_costruzione' in row.keys() else None,
                numero_scale=row['numero_scale'] if 'numero_scale' in row.keys() else None,
                presidente_assemblea=row['presidente_assemblea'] if 'presidente_assemblea' in row.keys() else None,
                responsabile=row['responsabile'] if 'responsabile' in row.keys() else None,
                telefono_responsabile=row['telefono_responsabile'] if 'telefono_responsabile' in row.keys() else None,
                email_responsabile=row['email_responsabile'] if 'email_responsabile' in row.keys() else None,
                amministratore_esterno=row['amministratore_esterno'] if 'amministratore_esterno' in row.keys() else None,
                partita_iva=row['partita_iva'] if 'partita_iva' in row.keys() else None,
                iban_condominio=row['iban_condominio'] if 'iban_condominio' in row.keys() else None,
                banca_appoggio=row['banca_appoggio'] if 'banca_appoggio' in row.keys() else None,
                descrizione_edificio=row['descrizione_edificio'] if 'descrizione_edificio' in row.keys() else None,
                note_interne=row['note_interne'] if 'note_interne' in row.keys() else None,
                created_at=row['created_at']
            )
        return None

    def save(self):
        """Salva condominio nel database"""
        conn = get_db()
        cursor = conn.cursor()

        try:
            if self.id:
                exec_sql(cursor, """
                    UPDATE condominii SET nome = ?, indirizzo = ?, num_unita = ?,
                    anno_costruzione = ?, numero_scale = ?, presidente_assemblea = ?,
                    responsabile = ?, telefono_responsabile = ?, email_responsabile = ?,
                    amministratore_esterno = ?, partita_iva = ?, iban_condominio = ?,
                    banca_appoggio = ?, descrizione_edificio = ?, note_interne = ?
                    WHERE id = ?
                """, (self.nome, self.indirizzo, self.num_unita, self.anno_costruzione,
                      self.numero_scale, self.presidente_assemblea, self.responsabile,
                      self.telefono_responsabile, self.email_responsabile,
                      self.amministratore_esterno, self.partita_iva, self.iban_condominio,
                      self.banca_appoggio, self.descrizione_edificio, self.note_interne, self.id))
            else:
                exec_sql(cursor, """
                    INSERT INTO condominii (user_id, nome, indirizzo, num_unita,
                    anno_costruzione, numero_scale, presidente_assemblea, responsabile,
                    telefono_responsabile, email_responsabile, amministratore_esterno,
                    partita_iva, iban_condominio, banca_appoggio, descrizione_edificio,
                    note_interne)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (self.user_id, self.nome, self.indirizzo, self.num_unita,
                      self.anno_costruzione, self.numero_scale, self.presidente_assemblea,
                      self.responsabile, self.telefono_responsabile, self.email_responsabile,
                      self.amministratore_esterno, self.partita_iva, self.iban_condominio,
                      self.banca_appoggio, self.descrizione_edificio, self.note_interne))
                self.id = cursor.lastrowid

                # Crea automaticamente le unità immobiliari
                for i in range(1, self.num_unita + 1):
                    exec_sql(cursor, """
                        INSERT INTO unita_immobiliari (condominio_id, numero_unita)
                        VALUES (?, ?)
                    """, (self.id, i))

            conn.commit()
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            conn.close()

        return self

    def delete(self):
        """Elimina condominio e tutti i dati associati"""
        conn = get_db()
        cursor = conn.cursor()
        exec_sql(cursor, "DELETE FROM condominii WHERE id = ?", (self.id,))
        conn.commit()
        conn.close()

class UnitaImmobiliare:
    """Modello per la tabella unita_immobiliari"""

    def __init__(self, condominio_id=None, numero_unita=None, id=None):
        self.id = id
        self.condominio_id = condominio_id
        self.numero_unita = numero_unita

    @classmethod
    def get_by_condominio(cls, condominio_id):
        """Ottiene tutte le unità di un condominio"""
        conn = get_db()
        cursor = conn.cursor()
        exec_sql(cursor, """
            SELECT * FROM unita_immobiliari
            WHERE condominio_id = ?
            ORDER BY numero_unita
        """, (condominio_id,))

        unita = []
        for row in cursor.fetchall():
            unita.append(cls(
                id=row['id'],
                condominio_id=row['condominio_id'],
                numero_unita=row['numero_unita']
            ))

        conn.close()
        return unita

class Persona:
    """Modello per la tabella persone"""

    def __init__(self, condominio_id=None, unita_id=None, nome=None, cognome=None,
                 email=None, tipo_persona=None, id=None):
        self.id = id
        self.condominio_id = condominio_id
        self.unita_id = unita_id
        self.nome = nome
        self.cognome = cognome
        self.email = email
        self.tipo_persona = tipo_persona  # 'proprietario' o 'inquilino'

    @classmethod
    def get_by_condominio(cls, condominio_id):
        """Ottiene tutte le persone di un condominio con dettagli unità"""
        conn = get_db()
        cursor = conn.cursor()
        exec_sql(cursor, """
            SELECT p.*, ui.numero_unita
            FROM persone p
            JOIN unita_immobiliari ui ON p.unita_id = ui.id
            WHERE p.condominio_id = ?
            ORDER BY ui.numero_unita, p.cognome, p.nome
        """, (condominio_id,))

        persone = []
        for row in cursor.fetchall():
            persone.append(cls(
                id=row['id'],
                condominio_id=row['condominio_id'],
                unita_id=row['unita_id'],
                nome=row['nome'],
                cognome=row['cognome'],
                email=row['email'],
                tipo_persona=row['tipo_persona']
            ))

        conn.close()
        return persone

    @classmethod
    def find_by_id(cls, persona_id):
        """Trova persona per ID"""
        conn = get_db()
        cursor = conn.cursor()
        exec_sql(cursor, """
            SELECT p.*, ui.numero_unita
            FROM persone p
            JOIN unita_immobiliari ui ON p.unita_id = ui.id
            WHERE p.id = ?
        """, (persona_id,))

        row = cursor.fetchone()
        conn.close()

        if row:
            return cls(
                id=row['id'],
                condominio_id=row['condominio_id'],
                unita_id=row['unita_id'],
                nome=row['nome'],
                cognome=row['cognome'],
                email=row['email'],
                tipo_persona=row['tipo_persona']
            )
        return None

    def save(self):
        """Salva persona nel database"""
        conn = get_db()
        cursor = conn.cursor()

        if self.id:
            exec_sql(cursor, """
                UPDATE persone SET unita_id = ?, nome = ?, cognome = ?,
                email = ?, tipo_persona = ?
                WHERE id = ?
            """, (self.unita_id, self.nome, self.cognome,
                  self.email, self.tipo_persona, self.id))
        else:
            exec_sql(cursor, """
                INSERT INTO persone (condominio_id, unita_id, nome, cognome,
                email, tipo_persona)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (self.condominio_id, self.unita_id, self.nome, self.cognome,
                  self.email, self.tipo_persona))
            self.id = cursor.lastrowid

        conn.commit()
        conn.close()
        return self

    def delete(self):
        """Elimina persona dal database"""
        conn = get_db()
        cursor = conn.cursor()
        exec_sql(cursor, "DELETE FROM persone WHERE id = ?", (self.id,))
        conn.commit()
        conn.close()

class Spesa:
    """Modello per la tabella spese"""

    def __init__(self, condominio_id=None, descrizione=None, importo=None, data_spesa=None,
                 tabella_millesimi=None, logica_pi=None, percentuale_proprietario=100,
                 percentuale_inquilino=0, id=None, created_at=None):
        self.id = id
        self.condominio_id = condominio_id
        self.descrizione = descrizione
        self.importo = importo
        self.data_spesa = data_spesa
        self.tabella_millesimi = tabella_millesimi  # A-L
        self.logica_pi = logica_pi  # 'proprietario', 'inquilino', '50/50', 'personalizzato'
        self.percentuale_proprietario = percentuale_proprietario
        self.percentuale_inquilino = percentuale_inquilino
        self.created_at = created_at

    @classmethod
    def get_by_condominio(cls, condominio_id, tabella_filter=None):
        """Ottiene tutte le spese di un condominio, con filtro opzionale per tabella"""
        conn = get_db()
        cursor = conn.cursor()

        if tabella_filter:
            exec_sql(cursor, """
                SELECT * FROM spese
                WHERE condominio_id = ? AND tabella_millesimi = ?
                ORDER BY data_spesa DESC, created_at DESC
            """, (condominio_id, tabella_filter))
        else:
            exec_sql(cursor, """
                SELECT * FROM spese
                WHERE condominio_id = ?
                ORDER BY data_spesa DESC, created_at DESC
            """, (condominio_id,))

        spese = []
        for row in cursor.fetchall():
            spese.append(cls(
                id=row['id'],
                condominio_id=row['condominio_id'],
                descrizione=row['descrizione'],
                importo=row['importo'],
                data_spesa=row['data_spesa'],
                tabella_millesimi=row['tabella_millesimi'],
                logica_pi=row['logica_pi'],
                percentuale_proprietario=row['percentuale_proprietario'],
                percentuale_inquilino=row['percentuale_inquilino'],
                created_at=row['created_at']
            ))

        conn.close()
        return spese

    @classmethod
    def find_by_id(cls, spesa_id):
        """Trova spesa per ID"""
        conn = get_db()
        cursor = conn.cursor()
        exec_sql(cursor, "SELECT * FROM spese WHERE id = ?", (spesa_id,))

        row = cursor.fetchone()
        conn.close()

        if row:
            return cls(
                id=row['id'],
                condominio_id=row['condominio_id'],
                descrizione=row['descrizione'],
                importo=row['importo'],
                data_spesa=row['data_spesa'],
                tabella_millesimi=row['tabella_millesimi'],
                logica_pi=row['logica_pi'],
                percentuale_proprietario=row['percentuale_proprietario'],
                percentuale_inquilino=row['percentuale_inquilino'],
                created_at=row['created_at']
            )
        return None

    def save(self):
        """Salva spesa nel database"""
        conn = get_db()
        cursor = conn.cursor()

        if self.id:
            exec_sql(cursor, """
                UPDATE spese SET descrizione = ?, importo = ?, data_spesa = ?,
                tabella_millesimi = ?, logica_pi = ?,
                percentuale_proprietario = ?, percentuale_inquilino = ?
                WHERE id = ?
            """, (self.descrizione, self.importo, self.data_spesa, self.tabella_millesimi,
                  self.logica_pi, self.percentuale_proprietario,
                  self.percentuale_inquilino, self.id))
        else:
            exec_sql(cursor, """
                INSERT INTO spese (condominio_id, descrizione, importo, data_spesa,
                tabella_millesimi, logica_pi, percentuale_proprietario,
                percentuale_inquilino)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (self.condominio_id, self.descrizione, self.importo, self.data_spesa,
                  self.tabella_millesimi, self.logica_pi,
                  self.percentuale_proprietario, self.percentuale_inquilino))
            self.id = cursor.lastrowid

        conn.commit()
        conn.close()
        return self

    def delete(self):
        """Elimina spesa dal database"""
        conn = get_db()
        cursor = conn.cursor()
        exec_sql(cursor, "DELETE FROM spese WHERE id = ?", (self.id,))
        conn.commit()
        conn.close()

class Millesemo:
    """Modello per la tabella millesimi"""

    def __init__(self, condominio_id=None, unita_id=None, tabella=None,
                 valore=None, id=None):
        self.id = id
        self.condominio_id = condominio_id
        self.unita_id = unita_id
        self.tabella = tabella  # A-L
        self.valore = valore

    @classmethod
    def get_by_condominio_tabella(cls, condominio_id, tabella):
        """Ottiene i millesimi per condominio e tabella"""
        conn = get_db()
        cursor = conn.cursor()
        exec_sql(cursor, """
            SELECT m.*, ui.numero_unita
            FROM millesimi m
            JOIN unita_immobiliari ui ON m.unita_id = ui.id
            WHERE m.condominio_id = ? AND m.tabella = ?
            ORDER BY ui.numero_unita
        """, (condominio_id, tabella))

        millesimi = []
        for row in cursor.fetchall():
            millesimi.append(cls(
                id=row['id'],
                condominio_id=row['condominio_id'],
                unita_id=row['unita_id'],
                tabella=row['tabella'],
                valore=row['valore']
            ))

        conn.close()
        return millesimi

    @classmethod
    def get_unita_millesimi(cls, unita_id):
        """Ottiene tutti i millesimi di un'unità"""
        conn = get_db()
        cursor = conn.cursor()
        exec_sql(cursor, """
            SELECT * FROM millesimi
            WHERE unita_id = ?
            ORDER BY tabella
        """, (unita_id,))

        millesimi = {}
        for row in cursor.fetchall():
            millesimi[row['tabella']] = row['valore']

        conn.close()
        return millesimi

    def save(self):
        """Salva o aggiorna millesimo nel database"""
        conn = get_db()
        cursor = conn.cursor()

        exec_sql(cursor, """
            INSERT OR REPLACE INTO millesimi
            (condominio_id, unita_id, tabella, valore)
            VALUES (?, ?, ?, ?)
        """, (self.condominio_id, self.unita_id, self.tabella, self.valore))

        conn.commit()
        conn.close()
        return self

    @classmethod
    def validate_total(cls, condominio_id, tabella):
        """Verifica che il totale dei millesimi sia 1000"""
        conn = get_db()
        cursor = conn.cursor()
        exec_sql(cursor, """
            SELECT SUM(valore) as totale
            FROM millesimi
            WHERE condominio_id = ? AND tabella = ?
        """, (condominio_id, tabella))

        result = cursor.fetchone()
        conn.close()

        return result['totale'] == 1000 if result['totale'] else False

class PreventivoAnnuale:
    """Modello per la tabella preventivi_annuali"""

    def __init__(self, condominio_id=None, anno=None, importo_totale_preventivato=None,
                 importo_totale_speso=0, note=None, id=None, created_at=None, updated_at=None):
        self.id = id
        self.condominio_id = condominio_id
        self.anno = anno
        self.importo_totale_preventivato = importo_totale_preventivato
        self.importo_totale_speso = importo_totale_speso
        self.differenza = importo_totale_preventivato - importo_totale_speso
        self.note = note
        self.created_at = created_at
        self.updated_at = updated_at

    @classmethod
    def get_by_condominio(cls, condominio_id):
        """Ottiene tutti i preventivi di un condominio"""
        conn = get_db()
        cursor = conn.cursor()
        exec_sql(cursor, """
            SELECT * FROM preventivi_annuali
            WHERE condominio_id = ?
            ORDER BY anno DESC
        """, (condominio_id,))

        preventivi = []
        for row in cursor.fetchall():
            preventivi.append(cls(
                id=row['id'],
                condominio_id=row['condominio_id'],
                anno=row['anno'],
                importo_totale_preventivato=row['importo_totale_preventivato'],
                importo_totale_speso=row['importo_totale_speso'],
                note=row['note'],
                created_at=row['created_at'],
                updated_at=row['updated_at']
            ))

        conn.close()
        return preventivi

    @classmethod
    def find_by_id(cls, preventivo_id):
        """Trova preventivo annuale per ID"""
        conn = get_db()
        cursor = conn.cursor()
        exec_sql(cursor, "SELECT * FROM preventivi_annuali WHERE id = ?", (preventivo_id,))

        row = cursor.fetchone()
        conn.close()

        if row:
            return cls(
                id=row['id'],
                condominio_id=row['condominio_id'],
                anno=row['anno'],
                importo_totale_preventivato=row['importo_totale_preventivato'],
                importo_totale_speso=row['importo_totale_speso'],
                note=row['note'],
                created_at=row['created_at'],
                updated_at=row['updated_at']
            )
        return None

    def save(self):
        """Salva preventivo nel database"""
        conn = get_db()
        cursor = conn.cursor()

        if self.id:
            exec_sql(cursor, """
                UPDATE preventivi_annuali SET
                importo_totale_preventivato = ?,
                importo_totale_speso = ?,
                note = ?,
                updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            """, (self.importo_totale_preventivato, self.importo_totale_speso,
                  self.note, self.id))
        else:
            exec_sql(cursor, """
                INSERT INTO preventivi_annuali
                (condominio_id, anno, importo_totale_preventivato,
                importo_totale_speso, note)
                VALUES (?, ?, ?, ?, ?)
            """, (self.condominio_id, self.anno, self.importo_totale_preventivato,
                  self.importo_totale_speso, self.note))
            self.id = cursor.lastrowid

        conn.commit()
        conn.close()
        return self

class SpesaPreventivata:
    """Modello per la tabella spese_preventivate"""

    def __init__(self, condominio_id=None, preventivo_id=None, descrizione=None,
                 importo_previsto=None, tabella_millesimi=None, logica_pi=None,
                 percentuale_proprietario=100, percentuale_inquilino=0,
                 mese_previsto=None, data_prevista=None, note=None, id=None, created_at=None):
        self.id = id
        self.condominio_id = condominio_id
        self.preventivo_id = preventivo_id
        self.descrizione = descrizione
        self.importo_previsto = importo_previsto
        self.tabella_millesimi = tabella_millesimi  # A-L
        self.logica_pi = logica_pi  # 'proprietario', 'inquilino', '50/50', 'personalizzato'
        self.percentuale_proprietario = percentuale_proprietario
        self.percentuale_inquilino = percentuale_inquilino
        self.mese_previsto = mese_previsto  # 1-12
        self.data_prevista = data_prevista  # YYYY-MM-DD
        self.note = note
        self.created_at = created_at

    @classmethod
    def get_by_preventivo(cls, preventivo_id):
        """Ottiene tutte le spese preventivate per un preventivo"""
        conn = get_db()
        cursor = conn.cursor()
        exec_sql(cursor, """
            SELECT * FROM spese_preventivate
            WHERE preventivo_id = ?
            ORDER BY COALESCE(data_prevista, DATE('now')) ASC, COALESCE(mese_previsto, 13) ASC, created_at ASC
        """, (preventivo_id,))

        spese = []
        for row in cursor.fetchall():
            spese.append(cls(
                id=row['id'],
                condominio_id=row['condominio_id'],
                preventivo_id=row['preventivo_id'],
                descrizione=row['descrizione'],
                importo_previsto=row['importo_previsto'],
                tabella_millesimi=row['tabella_millesimi'],
                logica_pi=row['logica_pi'],
                percentuale_proprietario=row['percentuale_proprietario'],
                percentuale_inquilino=row['percentuale_inquilino'],
                mese_previsto=row['mese_previsto'],
                data_prevista=row['data_prevista'],
                note=row['note'],
                created_at=row['created_at']
            ))

        conn.close()
        return spese

    @classmethod
    def get_by_condominio_anno(cls, condominio_id, anno):
        """Ottiene tutte le spese preventivate per condominio e anno"""
        conn = get_db()
        cursor = conn.cursor()
        exec_sql(cursor, """
            SELECT sp.* FROM spese_preventivate sp
            JOIN preventivi_annuali p ON sp.preventivo_id = p.id
            WHERE sp.condominio_id = ? AND p.anno = ?
            ORDER BY COALESCE(sp.data_prevista, DATE('now')) ASC, COALESCE(sp.mese_previsto, 13) ASC, sp.created_at ASC
        """, (condominio_id, anno))

        spese = []
        for row in cursor.fetchall():
            spese.append(cls(
                id=row['id'],
                condominio_id=row['condominio_id'],
                preventivo_id=row['preventivo_id'],
                descrizione=row['descrizione'],
                importo_previsto=row['importo_previsto'],
                tabella_millesimi=row['tabella_millesimi'],
                logica_pi=row['logica_pi'],
                percentuale_proprietario=row['percentuale_proprietario'],
                percentuale_inquilino=row['percentuale_inquilino'],
                mese_previsto=row['mese_previsto'],
                data_prevista=row['data_prevista'],
                note=row['note'],
                created_at=row['created_at']
            ))

        conn.close()
        return spese

    @classmethod
    def find_by_id(cls, spesa_id):
        """Trova spesa preventivata per ID"""
        conn = get_db()
        cursor = conn.cursor()
        exec_sql(cursor, "SELECT * FROM spese_preventivate WHERE id = ?", (spesa_id,))

        row = cursor.fetchone()
        conn.close()

        if row:
            return cls(
                id=row['id'],
                condominio_id=row['condominio_id'],
                preventivo_id=row['preventivo_id'],
                descrizione=row['descrizione'],
                importo_previsto=row['importo_previsto'],
                tabella_millesimi=row['tabella_millesimi'],
                logica_pi=row['logica_pi'],
                percentuale_proprietario=row['percentuale_proprietario'],
                percentuale_inquilino=row['percentuale_inquilino'],
                mese_previsto=row['mese_previsto'],
                data_prevista=row['data_prevista'],
                note=row['note'],
                created_at=row['created_at']
            )
        return None

    def save(self):
        """Salva spesa preventivata nel database"""
        conn = get_db()
        cursor = conn.cursor()

        if self.id:
            exec_sql(cursor, """
                UPDATE spese_preventivate SET
                descrizione = ?, importo_previsto = ?, tabella_millesimi = ?,
                logica_pi = ?, percentuale_proprietario = ?, percentuale_inquilino = ?,
                mese_previsto = ?, data_prevista = ?, note = ?
                WHERE id = ?
            """, (self.descrizione, self.importo_previsto, self.tabella_millesimi,
                  self.logica_pi, self.percentuale_proprietario, self.percentuale_inquilino,
                  self.mese_previsto, self.data_prevista, self.note, self.id))
        else:
            exec_sql(cursor, """
                INSERT INTO spese_preventivate
                (condominio_id, preventivo_id, descrizione, importo_previsto,
                tabella_millesimi, logica_pi, percentuale_proprietario,
                percentuale_inquilino, mese_previsto, data_prevista, note)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (self.condominio_id, self.preventivo_id, self.descrizione,
                  self.importo_previsto, self.tabella_millesimi, self.logica_pi,
                  self.percentuale_proprietario, self.percentuale_inquilino,
                  self.mese_previsto, self.data_prevista, self.note))
            self.id = cursor.lastrowid

        conn.commit()
        conn.close()
        return self

    def delete(self):
        """Elimina spesa preventivata dal database"""
        conn = get_db()
        cursor = conn.cursor()
        exec_sql(cursor, "DELETE FROM spese_preventivate WHERE id = ?", (self.id,))
        conn.commit()
        conn.close()

class RipartizionePreventivo:
    """Modello per la tabella ripartizione_preventivo"""

    def __init__(self, condominio_id=None, preventivo_id=None, persona_id=None,
                 importo_previsto_dovuto=None, anno=None, id=None, created_at=None):
        self.id = id
        self.condominio_id = condominio_id
        self.preventivo_id = preventivo_id
        self.persona_id = persona_id
        self.importo_previsto_dovuto = importo_previsto_dovuto
        self.anno = anno
        self.created_at = created_at

    @classmethod
    def get_by_preventivo(cls, preventivo_id):
        """Ottiene tutte le ripartizioni per un preventivo"""
        conn = get_db()
        cursor = conn.cursor()
        exec_sql(cursor, """
            SELECT rp.*, p.nome, p.cognome, p.tipo_persona, ui.numero_unita
            FROM ripartizione_preventivo rp
            JOIN persone p ON rp.persona_id = p.id
            JOIN unita_immobiliari ui ON p.unita_id = ui.id
            WHERE rp.preventivo_id = ?
            ORDER BY ui.numero_unita, p.cognome, p.nome
        """, (preventivo_id,))

        ripartizioni = []
        for row in cursor.fetchall():
            ripartizioni.append({
                'id': row['id'],
                'persona_id': row['persona_id'],
                'nome': row['nome'],
                'cognome': row['cognome'],
                'tipo_persona': row['tipo_persona'],
                'numero_unita': row['numero_unita'],
                'importo_previsto_dovuto': row['importo_previsto_dovuto']
            })

        conn.close()
        return ripartizioni

    @classmethod
    def get_by_condominio_anno(cls, condominio_id, anno):
        """Ottiene le ripartizioni per condominio e anno"""
        conn = get_db()
        cursor = conn.cursor()
        exec_sql(cursor, """
            SELECT rp.*, p.nome, p.cognome, p.tipo_persona, ui.numero_unita
            FROM ripartizione_preventivo rp
            JOIN persone p ON rp.persona_id = p.id
            JOIN unita_immobiliari ui ON p.unita_id = ui.id
            JOIN preventivi_annuali pa ON rp.preventivo_id = pa.id
            WHERE rp.condominio_id = ? AND rp.anno = ?
            ORDER BY ui.numero_unita, p.cognome, p.nome
        """, (condominio_id, anno))

        ripartizioni = []
        for row in cursor.fetchall():
            ripartizioni.append({
                'id': row['id'],
                'persona_id': row['persona_id'],
                'nome': row['nome'],
                'cognome': row['cognome'],
                'tipo_persona': row['tipo_persona'],
                'numero_unita': row['numero_unita'],
                'importo_previsto_dovuto': row['importo_previsto_dovuto']
            })

        conn.close()
        return ripartizioni

    def save(self):
        """Salva ripartizione preventivo nel database"""
        conn = get_db()
        cursor = conn.cursor()

        exec_sql(cursor, """
            INSERT OR REPLACE INTO ripartizione_preventivo
            (condominio_id, preventivo_id, persona_id, importo_previsto_dovuto, anno)
            VALUES (?, ?, ?, ?, ?)
        """, (self.condominio_id, self.preventivo_id, self.persona_id,
              self.importo_previsto_dovuto, self.anno))

        conn.commit()
        conn.close()
        return self

    @classmethod
    def delete_by_preventivo(cls, preventivo_id):
        """Elimina tutte le ripartizioni per un preventivo"""
        conn = get_db()
        cursor = conn.cursor()
        exec_sql(cursor, "DELETE FROM ripartizione_preventivo WHERE preventivo_id = ?", (preventivo_id,))
        conn.commit()
        conn.close()

