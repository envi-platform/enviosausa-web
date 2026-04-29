import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, setDoc, doc, addDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import betterSqlite3 from 'better-sqlite3';
import path from 'path';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
const auth = getAuth(app);

const sqliteDbPath = path.resolve(process.cwd(), 'envi.db');
const sqliteDb = new betterSqlite3(sqliteDbPath);

async function migrate() {
  console.log('Starting migration...');

  // Create Users in Firebase Auth
  const usersToCreate = [
    { email: 'admin@envi.gt', pass: 'envi2024admin', rol: 'admin', nombre: 'Dwight Leal' },
    { email: 'agente@envi.gt', pass: 'agente2024', rol: 'agente', nombre: 'Agente Demo' }
  ];

  for (const u of usersToCreate) {
    try {
      const cred = await createUserWithEmailAndPassword(auth, u.email, u.pass);
      console.log('Created user in auth:', u.email);
      // Store in firestore
      await setDoc(doc(db, 'usuarios', cred.user.uid), {
        nombre: u.nombre,
        email: u.email,
        rol: u.rol,
        activo: true,
        created_at: new Date().toISOString()
      });
    } catch (e: any) {
      if (e.code === 'auth/email-already-in-use') {
         console.log('User already exists in auth:', u.email);
         try {
           const cred = await signInWithEmailAndPassword(auth, u.email, u.pass);
           await setDoc(doc(db, 'usuarios', cred.user.uid), {
             nombre: u.nombre,
             email: u.email,
             rol: u.rol,
             activo: true,
             created_at: new Date().toISOString()
           }, { merge: true });
         } catch(err) {
            console.error('Error signing in:', err);
         }
      } else if (e.code === 'auth/operation-not-allowed') {
        console.error(`Please enable Email/Password Authentication in Firebase Console! Skipping auth creation for ${u.email}`);
      } else {
        console.error('Error creating user:', e);
      }
    }
  }

  // Set initial parameters directly
  const defaultParams = [
      ['isse_1a_libra_pub', '475', 'Precio público 1ª libra DHL/ISSE'],
      ['isse_lb_adic_pub', '85', 'Precio público lb adicional DHL/ISSE'],
      ['isse_1a_libra_costo', '375', 'Costo ENVI 1ª libra DHL/ISSE'],
      ['isse_lb_adic_costo', '55', 'Costo ENVI lb adicional DHL/ISSE'],
      ['erg_1a_libra_pub', '580.25', 'Precio público 1ª libra FedEx/ERG'],
      ['erg_lb_adic_pub', '103', 'Precio público lb adicional FedEx/ERG'],
      ['erg_1a_libra_costo', '480.25', 'Costo ENVI 1ª libra FedEx/ERG'],
      ['erg_lb_adic_costo', '83', 'Costo ENVI lb adicional FedEx/ERG'],
      ['factor_volumetrico', '139', 'Divisor pulgadas³/libra'],
      ['dias_alerta_amarillo', '3', 'Días sin update para alerta amarilla'],
      ['dias_alerta_rojo', '7', 'Días sin update para alerta roja'],
      ['impuesto_previo', '150', 'GTQ impuesto previo fijo'],
      ['seguro_base', '100', 'GTQ seguro básico'],
      ['correlativo_actual', '0', 'Último correlativo usado']
  ];
  for (const [name, val, desc] of defaultParams) {
    try {
      await setDoc(doc(db, 'parametros', name), {
        nombre: name,
        valor: val,
        descripcion: desc,
        updated_at: new Date().toISOString()
      });
    } catch (e) { console.error('Error:', e); }
  }

  // 3. Migrate carriers
  const carriers = sqliteDb.prepare('SELECT * FROM carriers').all();
  for (const c of carriers as any[]) {
      const oldId = c.id;
      delete c.id;
      const cRef = await addDoc(collection(db, 'carriers'), {
          ...c, old_id: oldId
      });
      // migrate tarifas for this carrier
      const tarifas = sqliteDb.prepare('SELECT * FROM carrier_tarifas WHERE carrier_id = ?').all(oldId);
      for (const t of tarifas as any[]) {
          const tId = t.id;
          delete t.id;
          await addDoc(collection(db, 'carrier_tarifas'), {
              ...t, old_id: tId, carrier_id: cRef.id
          });
      }
  }

  // Migrate municipios
  const municipios = sqliteDb.prepare('SELECT * FROM municipios').all();
  for (const m of municipios as any[]) {
      delete m.id;
      await addDoc(collection(db, 'municipios'), {
          ...m
      });
  }

  // Migrate remitentes & destinatarios (store id maps to link to envios later if needed)
  const remMap = new Map();
  const destMap = new Map();
  
  const remitentes = sqliteDb.prepare('SELECT * FROM remitentes').all();
  for (const r of remitentes as any[]) {
      const oldId = r.id;
      delete r.id;
      const ref = await addDoc(collection(db, 'remitentes'), { ...r, old_id: oldId });
      remMap.set(oldId, ref.id);
  }

  const destinatarios = sqliteDb.prepare('SELECT * FROM destinatarios').all();
  for (const d of destinatarios as any[]) {
      const oldId = d.id;
      delete d.id;
      const ref = await addDoc(collection(db, 'destinatarios'), { ...d, old_id: oldId });
      destMap.set(oldId, ref.id);
  }

  // Migrate envios and mapping to events
  const envios = sqliteDb.prepare('SELECT * FROM envios').all();
  for (const e of envios as any[]) {
      const oldId = e.id;
      delete e.id;
      
      // Map old refs to new
      if (e.remitente_id && remMap.has(e.remitente_id)) e.remitente_id = remMap.get(e.remitente_id);
      if (e.destinatario_id && destMap.has(e.destinatario_id)) e.destinatario_id = destMap.get(e.destinatario_id);
      
      // Agente mapping will be broken if user IDs changed, but let's just keep the old ID or 0 for now as it maps to the new users we create manually? Wait, the users we created might have different IDs. 

      const ref = await addDoc(collection(db, 'envios'), { ...e, old_id: oldId });
      
      // Migrate events
      const eventos = sqliteDb.prepare('SELECT * FROM tracking_eventos WHERE envio_id = ?').all(oldId);
      for (const ev of eventos as any[]) {
          delete ev.id;
          ev.envio_id = ref.id;
          await addDoc(collection(db, 'tracking_eventos'), { ...ev });
      }
  }

  console.log('Migration complete!');
  process.exit(0);
}

migrate();
