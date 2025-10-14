import os
import jwt
import hashlib
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify, current_app
from models import User
import json

# Chiave segreta per JWT (usa env in produzione)
SECRET_KEY = os.getenv("SECRET_KEY", "change-me-in-prod")

def hash_password(password):
    """Hash della password usando SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(plain_password, stored_value):
    """Verifica password: compatibile con valori in chiaro e SHA-256.

    - Se la password salvata ha lunghezza 64 (hex SHA-256), confronta l'hash.
    - Altrimenti, confronta in chiaro per compatibilità con vecchi utenti.
    """
    try:
        if isinstance(stored_value, str) and len(stored_value) == 64 and all(c in "0123456789abcdef" for c in stored_value.lower()):
            return hash_password(plain_password) == stored_value
        return plain_password == stored_value
    except Exception:
        return False

def generate_jwt_token(user_id, username):
    """Genera token JWT per l'utente"""
    payload = {
        'user_id': user_id,
        'username': username,
        'exp': datetime.utcnow() + timedelta(hours=24),
        'iat': datetime.utcnow()
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')

def verify_jwt_token(token):
    """Verifica token JWT e restituisce payload"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def token_required(f):
    """Decorator per richiedere autenticazione JWT"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None

        # Estrai token dall'header Authorization
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]  # Bearer <token>
            except IndexError:
                return jsonify({'message': 'Formato token non valido'}), 401

        if not token:
            return jsonify({'message': 'Token mancante'}), 401

        # Verifica token
        payload = verify_jwt_token(token)
        if not payload:
            return jsonify({'message': 'Token non valido o scaduto'}), 401

        # Aggiungi user info al request context
        request.current_user_id = payload['user_id']
        request.current_username = payload['username']

        return f(*args, **kwargs)

    return decorated

def validate_login_data(data):
    """Valida dati di login"""
    errors = []

    if not data.get('username'):
        errors.append('Username obbligatorio')
    elif len(data.get('username', '')) < 3:
        errors.append('Username deve avere almeno 3 caratteri')

    if not data.get('password'):
        errors.append('Password obbligatoria')
    elif len(data.get('password', '')) < 6:
        errors.append('Password deve avere almeno 6 caratteri')

    return errors

def validate_condominio_data(data):
    """Valida dati condominio"""
    errors = []

    if not data.get('nome'):
        errors.append('Nome condominio obbligatorio')
    elif len(data.get('nome', '')) < 2:
        errors.append('Nome condominio deve avere almeno 2 caratteri')

    if not data.get('num_unita'):
        errors.append('Numero unità obbligatorio')
    elif not isinstance(data.get('num_unita'), int) or data.get('num_unita') < 1:
        errors.append('Numero unità deve essere un numero positivo')

    return errors

def validate_persona_data(data):
    """Valida dati persona"""
    errors = []

    if not data.get('nome'):
        errors.append('Nome obbligatorio')
    elif len(data.get('nome', '')) < 2:
        errors.append('Nome deve avere almeno 2 caratteri')

    if not data.get('cognome'):
        errors.append('Cognome obbligatorio')
    elif len(data.get('cognome', '')) < 2:
        errors.append('Cognome deve avere almeno 2 caratteri')

    if not data.get('unita_id'):
        errors.append('Unità immobiliare obbligatoria')

    if not data.get('tipo_persona'):
        errors.append('Tipo persona obbligatorio')
    elif data.get('tipo_persona') not in ['proprietario', 'inquilino', 'proprietario_inquilino']:
        errors.append('Tipo persona deve essere "proprietario", "inquilino" o "proprietario_inquilino"')

    if data.get('email') and '@' not in data.get('email', ''):
        errors.append('Email non valida')

    return errors

def validate_spesa_data(data):
    """Valida dati spesa"""
    errors = []

    if not data.get('descrizione'):
        errors.append('Descrizione spesa obbligatoria')
    elif len(data.get('descrizione', '')) < 3:
        errors.append('Descrizione deve avere almeno 3 caratteri')

    if not data.get('importo'):
        errors.append('Importo obbligatorio')
    elif not isinstance(data.get('importo'), (int, float)) or data.get('importo') <= 0:
        errors.append('Importo deve essere un numero positivo')

    if not data.get('tabella_millesimi'):
        errors.append('Tabella millesimi obbligatoria')
    elif data.get('tabella_millesimi') not in ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'L']:
        errors.append('Tabella millesimi non valida (A-L)')

    if not data.get('logica_pi'):
        errors.append('Logica P/I obbligatoria')
    elif data.get('logica_pi') not in ['proprietario', 'inquilino', '50/50', 'personalizzato']:
        errors.append('Logica P/I non valida')

    # Validazione percentuali per logica personalizzata
    if data.get('logica_pi') == 'personalizzato':
        prop = data.get('percentuale_proprietario', 100)
        inq = data.get('percentuale_inquilino', 0)

        if not isinstance(prop, (int, float)) or prop < 0 or prop > 100:
            errors.append('Percentuale proprietario deve essere tra 0 e 100')
        if not isinstance(inq, (int, float)) or inq < 0 or inq > 100:
            errors.append('Percentuale inquilino deve essere tra 0 e 100')
        if prop + inq != 100:
            errors.append('La somma delle percentuali deve essere 100')

    return errors

def validate_millesimi_data(millesimi_list, num_unita):
    """Valida dati millesimi per una tabella"""
    errors = []

    if not millesimi_list:
        errors.append('Lista millesimi vuota')
        return errors

    if len(millesimi_list) != num_unita:
        errors.append(f'Numero millesimi ({len(millesimi_list)}) non corrisponde al numero di unità ({num_unita})')

    totale = 0
    for i, millesimo in enumerate(millesimi_list):
        if not isinstance(millesimo, dict):
            errors.append(f'Millesimo {i+1} non valido')
            continue

        if 'unita_id' not in millesimo:
            errors.append(f'Unità ID mancante per millesimo {i+1}')

        if 'valore' not in millesimo:
            errors.append(f'Valore mancante per millesimo {i+1}')
        elif not isinstance(millesimo['valore'], (int, float)) or millesimo['valore'] < 0:
            errors.append(f'Valore millesimo {i+1} deve essere un numero non negativo')
        else:
            totale += millesimo['valore']

    if totale != 1000:
        errors.append(f'Il totale dei millesimi deve essere 1000 (attuale: {totale})')

    return errors

def calculate_ripartizione_completa(condominio_id):
    """Calcola la ripartizione completa per un condominio"""
    from models import Spesa, Persona
    from database_universal import get_db

    conn = get_db()
    cursor = conn.cursor()

    # Pulisci ripartizioni esistenti
    cursor.execute("""
        DELETE FROM ripartizione_spese
        WHERE condominio_id = ?
    """, (condominio_id,))
    conn.commit()  # Assicura che la cancellazione sia persistita prima di procedere

    # Ottieni tutte le spese del condominio
    spese = Spesa.get_by_condominio(condominio_id)
    persone = Persona.get_by_condominio(condominio_id)

    # Calcola ripartizione per ogni spesa
    ripartizione_totale = {persona.id: 0 for persona in persone}

    for spesa in spese:
        # Calcola ripartizione per questa spesa
        cursor.execute("""
            SELECT p.id as persona_id, p.nome, p.cognome, p.tipo_persona,
                   ui.id as unita_id, ui.numero_unita, m.valore as millesimi
            FROM persone p
            JOIN unita_immobiliari ui ON p.unita_id = ui.id
            LEFT JOIN millesimi m ON ui.id = m.unita_id AND m.tabella = ?
            WHERE p.condominio_id = ?
            ORDER BY ui.numero_unita
        """, (spesa.tabella_millesimi, condominio_id))

        persone_con_millesimi = cursor.fetchall()

        # Precalcola presenza ruoli e conteggi per unità (per dividere correttamente tra più persone dello stesso ruolo)
        unita_ruoli = {}
        ruolo_counts = {}
        for p in persone_con_millesimi:
            if not p['millesimi']:
                continue
            uid = p['unita_id']
            unita_ruoli.setdefault(uid, set())
            ruolo_counts.setdefault(uid, {'proprietario': 0, 'inquilino': 0, 'both': 0})
            if p['tipo_persona'] == 'proprietario_inquilino':
                unita_ruoli[uid].update({'proprietario', 'inquilino'})
                ruolo_counts[uid]['both'] += 1
            elif p['tipo_persona'] in ('proprietario', 'inquilino'):
                unita_ruoli[uid].add(p['tipo_persona'])
                ruolo_counts[uid][p['tipo_persona']] += 1

        for persona in persone_con_millesimi:
            if not persona['millesimi']:
                continue  # Salta persone senza millesimi per questa tabella

            # Calcola percentuale in base alla logica P/I
            if spesa.logica_pi == 'proprietario':
                if persona['tipo_persona'] in ['proprietario', 'proprietario_inquilino']:
                    percentuale = 100
                else:
                    percentuale = 0
            elif spesa.logica_pi == 'inquilino':
                if persona['tipo_persona'] in ['inquilino', 'proprietario_inquilino']:
                    percentuale = 100
                else:
                    percentuale = 0
            elif spesa.logica_pi == '50/50':
                # Se è una persona che ricopre entrambi i ruoli, paga il 100%
                if persona['tipo_persona'] == 'proprietario_inquilino':
                    percentuale = 100
                else:
                    # Se nell'unità sono presenti entrambi i ruoli, paga il 50%
                    ruoli_presenti = unita_ruoli.get(persona['unita_id'], set())
                    if 'proprietario' in ruoli_presenti and 'inquilino' in ruoli_presenti:
                        percentuale = 50
                    else:
                        # Se manca il contro-ruolo, il presente copre il 100%
                        percentuale = 100
            else:  # personalizzato
                if persona['tipo_persona'] == 'proprietario_inquilino':
                    # Per P/I, il proprietario/inquilino paga entrambe le quote
                    percentuale = spesa.percentuale_proprietario + spesa.percentuale_inquilino
                elif persona['tipo_persona'] == 'proprietario':
                    percentuale = spesa.percentuale_proprietario
                else:  # inquilino
                    percentuale = spesa.percentuale_inquilino

            # Ripartizione intra-ruolo: se ci sono più persone dello stesso ruolo nella stessa unità,
            # divide la quota tra loro in parti uguali (escluso il caso 'proprietario_inquilino' che già paga il 100%).
            quota_divisore = 1
            uid = persona['unita_id']
            if persona['tipo_persona'] == 'proprietario':
                quota_divisore = max(1, ruolo_counts.get(uid, {}).get('proprietario', 1))
            elif persona['tipo_persona'] == 'inquilino':
                quota_divisore = max(1, ruolo_counts.get(uid, {}).get('inquilino', 1))

            # Calcola importo dovuto
            importo_dovuto = (spesa.importo * persona['millesimi'] * (percentuale / 100)) / 1000
            importo_dovuto = importo_dovuto / quota_divisore

            # Salva in database
            cursor.execute("""
                INSERT INTO ripartizione_spese
                (condominio_id, persona_id, spesa_id, importo_dovuto, anno)
                VALUES (?, ?, ?, ?, ?)
            """, (condominio_id, persona['persona_id'], spesa.id, importo_dovuto, datetime.now().year))

            # Aggiungi al totale
            ripartizione_totale[persona['persona_id']] += importo_dovuto

    conn.commit()
    conn.close()

    return ripartizione_totale

def export_condominio_json(condominio_id):
    """Esporta tutti i dati di un condominio in formato JSON"""
    from models import Condominio, UnitaImmobiliare, Persona, Spesa, Millesemo, PreventivoAnnuale

    # Ottieni condominio
    condominio = Condominio.find_by_id(condominio_id)
    if not condominio:
        return None

    # Ottieni tutti i dati
    unita = UnitaImmobiliare.get_by_condominio(condominio_id)
    persone = Persona.get_by_condominio(condominio_id)
    spese = Spesa.get_by_condominio(condominio_id)
    preventivi = PreventivoAnnuale.get_by_condominio(condominio_id)

    # Ottieni millesimi per tutte le tabelle
    millesimi_completi = {}
    for tabella in ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'L']:
        millesimi_completi[tabella] = Millesemo.get_by_condominio_tabella(condominio_id, tabella)

    # Crea struttura JSON
    export_data = {
        'condominio': {
            'id': condominio.id,
            'nome': condominio.nome,
            'indirizzo': condominio.indirizzo,
            'num_unita': condominio.num_unita,
            'created_at': condominio.created_at
        },
        'unita_immobiliari': [
            {
                'id': u.id,
                'numero_unita': u.numero_unita
            } for u in unita
        ],
        'persone': [
            {
                'id': p.id,
                'nome': p.nome,
                'cognome': p.cognome,
                'email': p.email,
                'tipo_persona': p.tipo_persona,
                'unita_id': p.unita_id
            } for p in persone
        ],
        'spese': [
            {
                'id': s.id,
                'descrizione': s.descrizione,
                'importo': s.importo,
                'tabella_millesimi': s.tabella_millesimi,
                'logica_pi': s.logica_pi,
                'percentuale_proprietario': s.percentuale_proprietario,
                'percentuale_inquilino': s.percentuale_inquilino,
                'created_at': s.created_at
            } for s in spese
        ],
        'millesimi': {
            tabella: [
                {
                    'id': m.id,
                    'unita_id': m.unita_id,
                    'valore': m.valore
                } for m in millesimi_list
            ] for tabella, millesimi_list in millesimi_completi.items()
        },
        'preventivi_annuali': [
            {
                'id': p.id,
                'anno': p.anno,
                'importo_totale_preventivato': p.importo_totale_preventivato,
                'importo_totale_speso': p.importo_totale_speso,
                'note': p.note,
                'created_at': p.created_at,
                'updated_at': p.updated_at
            } for p in preventivi
        ],
        'export_date': datetime.now().isoformat(),
        'version': '1.0'
    }

    return json.dumps(export_data, indent=2, ensure_ascii=False)

def format_currency(amount):
    """Formatta importo in Euro"""
    return f"€{amount:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.')

def generate_preventivo_anno(condominio_id, anno):
    """Genera preventivo per un anno basandosi sulle spese attuali"""
    from models import Spesa, Persona, PreventivoAnnuale
    from database_universal import get_db

    try:
        conn = get_db()
        cursor = conn.cursor()

        # Ottieni tutte le spese dell'anno corrente
        cursor.execute("""
            SELECT * FROM spese
            WHERE condominio_id = ? AND strftime('%Y', created_at) = ?
        """, (condominio_id, str(datetime.now().year)))

        spese_anno_corrente = cursor.fetchall()
        totale_spese = sum(spesa['importo'] for spesa in spese_anno_corrente)

        # Chiudi la connessione corrente prima di chiamare calculate_ripartizione_completa
        conn.close()

        # Calcola preventivo per persona usando la logica di ripartizione
        persone = Persona.get_by_condominio(condominio_id)
        preventivo_dettaglio = {}

        if persone and spese_anno_corrente:
            # Usa la funzione di calcolo ripartizione esistente
            # che gestisce la sua connessione al database
            try:
                preventivo_dettaglio = calculate_ripartizione_completa(condominio_id)
            except Exception as e:
                log_error(f"Errore nel calcolo ripartizione: {str(e)}", "generate_preventivo_anno")
                preventivo_dettaglio = {}

        # Crea preventivo annuale
        preventivo = PreventivoAnnuale(
            condominio_id=condominio_id,
            anno=anno,
            importo_totale_preventivato=totale_spese,
            note=f"Preventivo generato automaticamente basato su spese {datetime.now().year}"
        )
        preventivo.save()

        return {
            'preventivo': preventivo,
            'dettaglio': preventivo_dettaglio
        }

    except Exception as e:
        log_error(f"Errore generazione preventivo: {str(e)}", "generate_preventivo_anno")
        # Chiudi la connessione se ancora aperta
        try:
            if 'conn' in locals() and conn:
                conn.close()
        except:
            pass
        raise e

def calculate_ripartizione_preventivo(condominio_id, anno, tabella_filter=None):
    """Calcola la ripartizione basata sulle spese preventivate per un anno"""
    from models import SpesaPreventivata, Persona, PreventivoAnnuale, RipartizionePreventivo
    from database_universal import get_db

    try:
        conn = get_db()
        cursor = conn.cursor()

        # Trova preventivo per l'anno
        preventivi = PreventivoAnnuale.get_by_condominio(condominio_id)
        preventivo = None
        for p in preventivi:
            if p.anno == anno:
                preventivo = p
                break

        if not preventivo:
            return {'ripartizione': [], 'totale_previsto': 0}

        # Pulisci ripartizioni preventivo esistenti
        RipartizionePreventivo.delete_by_preventivo(preventivo.id)

        # Ottieni spese preventivate per il preventivo
        spese = SpesaPreventivata.get_by_preventivo(preventivo.id)
        if tabella_filter:
            spese = [s for s in spese if s.tabella_millesimi == tabella_filter]
        persone = Persona.get_by_condominio(condominio_id)

        if not spese or not persone:
            conn.close()
            return {'ripartizione': [], 'totale_previsto': 0}

        # Calcola ripartizione per ogni spesa preventivata
        ripartizione_totale = {persona.id: 0 for persona in persone}

        for spesa in spese:
            # Calcola ripartizione per questa spesa preventivata
            cursor.execute("""
                SELECT p.id as persona_id, p.nome, p.cognome, p.tipo_persona,
                       ui.id as unita_id, ui.numero_unita, m.valore as millesimi
                FROM persone p
                JOIN unita_immobiliari ui ON p.unita_id = ui.id
                LEFT JOIN millesimi m ON ui.id = m.unita_id AND m.tabella = ?
                WHERE p.condominio_id = ?
                ORDER BY ui.numero_unita
            """, (spesa.tabella_millesimi, condominio_id))

            persone_con_millesimi = cursor.fetchall()

            # Precalcola presenza ruoli e conteggi per unità (per suddividere correttamente quote intra-ruolo)
            unita_ruoli = {}
            ruolo_counts = {}
            for p in persone_con_millesimi:
                if not p['millesimi']:
                    continue
                uid = p['unita_id']
                unita_ruoli.setdefault(uid, set())
                ruolo_counts.setdefault(uid, {'proprietario': 0, 'inquilino': 0, 'both': 0})
                if p['tipo_persona'] == 'proprietario_inquilino':
                    unita_ruoli[uid].update({'proprietario', 'inquilino'})
                    ruolo_counts[uid]['both'] += 1
                elif p['tipo_persona'] in ('proprietario', 'inquilino'):
                    unita_ruoli[uid].add(p['tipo_persona'])
                    ruolo_counts[uid][p['tipo_persona']] += 1

            for persona in persone_con_millesimi:
                if not persona['millesimi']:
                    continue  # Salta persone senza millesimi per questa tabella

                # Calcola percentuale in base alla logica P/I
                if spesa.logica_pi == 'proprietario':
                    if persona['tipo_persona'] in ['proprietario', 'proprietario_inquilino']:
                        percentuale = 100
                    else:
                        percentuale = 0
                elif spesa.logica_pi == 'inquilino':
                    if persona['tipo_persona'] in ['inquilino', 'proprietario_inquilino']:
                        percentuale = 100
                    else:
                        percentuale = 0
                elif spesa.logica_pi == '50/50':
                    if persona['tipo_persona'] == 'proprietario_inquilino':
                        percentuale = 100
                    else:
                        ruoli_presenti = unita_ruoli.get(persona['unita_id'], set())
                        if 'proprietario' in ruoli_presenti and 'inquilino' in ruoli_presenti:
                            percentuale = 50
                        else:
                            percentuale = 100
                else:  # personalizzato
                    if persona['tipo_persona'] == 'proprietario_inquilino':
                        # Per P/I, il proprietario/inquilino paga entrambe le quote
                        percentuale = spesa.percentuale_proprietario + spesa.percentuale_inquilino
                    elif persona['tipo_persona'] == 'proprietario':
                        percentuale = spesa.percentuale_proprietario
                    else:  # inquilino
                        percentuale = spesa.percentuale_inquilino

                # Divisione intra-ruolo tra più persone della stessa unità
                quota_divisore = 1
                uid = persona['unita_id']
                if persona['tipo_persona'] == 'proprietario':
                    quota_divisore = max(1, ruolo_counts.get(uid, {}).get('proprietario', 1))
                elif persona['tipo_persona'] == 'inquilino':
                    quota_divisore = max(1, ruolo_counts.get(uid, {}).get('inquilino', 1))

                # Calcola importo dovuto
                importo_dovuto = (spesa.importo_previsto * persona['millesimi'] * (percentuale / 100)) / 1000
                importo_dovuto = importo_dovuto / quota_divisore

                # Accumula sul totale per persona (persistiamo dopo aver sommato tutte le spese)
                ripartizione_totale[persona['persona_id']] += importo_dovuto

        # Persisti una sola riga per persona (vincolo UNIQUE sul pair preventivo_id/persona_id)
        for persona in persone:
            totale_persona = ripartizione_totale.get(persona.id, 0)
            rip = RipartizionePreventivo(
                condominio_id=condominio_id,
                preventivo_id=preventivo.id,
                persona_id=persona.id,
                importo_previsto_dovuto=totale_persona,
                anno=anno
            )
            rip.save()

        conn.close()

        # Prepara risultato con dettagli persone
        risultato = []
        for persona in persone:
            risultato.append({
                'persona_id': persona.id,
                'nome': persona.nome,
                'cognome': persona.cognome,
                'tipo_persona': persona.tipo_persona,
                'importo_previsto_dovuto': ripartizione_totale.get(persona.id, 0)
            })

        return {
            'ripartizione': risultato,
            'totale_previsto': sum(ripartizione_totale.values())
        }

    except Exception as e:
        log_error(f"Errore calcolo ripartizione preventivo: {str(e)}", f"calculate_ripartizione_preventivo {condominio_id} {anno}")
        # Chiudi la connessione se ancora aperta
        try:
            if 'conn' in locals() and conn:
                conn.close()
        except:
            pass
        raise e

def log_error(error_message, context=None):
    """Log degli errori (in produzione potrebbe usare un sistema di logging più robusto)"""
    timestamp = datetime.now().isoformat()
    log_entry = f"[{timestamp}] ERROR: {error_message}"
    if context:
        log_entry += f" | Context: {context}"

    print(log_entry)  # In produzione sostituire con proper logging

    # Potrebbe salvare su file o database
    with open('error.log', 'a', encoding='utf-8') as f:
        f.write(log_entry + '\n')
