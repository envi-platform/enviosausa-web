import Database from 'better-sqlite3';
import path from 'path';
import bcrypt from 'bcryptjs';

const dbPath = path.resolve(process.cwd(), 'envi.db');
const db = new Database(dbPath);

export function initDb() {
  db.exec(`
    -- USUARIOS
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      rol TEXT NOT NULL CHECK(rol IN ('admin', 'agente')),
      telefono TEXT,
      activo INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- REMITENTES
    CREATE TABLE IF NOT EXISTS remitentes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      dpi TEXT,
      telefono TEXT,
      municipio TEXT,
      suborigen TEXT,
      total_envios INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- DESTINATARIOS
    CREATE TABLE IF NOT EXISTS destinatarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      telefono TEXT,
      direccion TEXT,
      ciudad TEXT,
      estado_usa TEXT,
      zip TEXT,
      total_envios INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- ENVÍOS
    CREATE TABLE IF NOT EXISTS envios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      codigo_envi TEXT UNIQUE NOT NULL,
      tpc_referencia TEXT,
      remitente_id INTEGER REFERENCES remitentes(id),
      destinatario_id INTEGER REFERENCES destinatarios(id),
      agente_id INTEGER REFERENCES usuarios(id),
      municipio_origen TEXT NOT NULL,
      suborigen TEXT,
      carrier TEXT NOT NULL,
      waybill TEXT,
      peso_real_lbs REAL,
      largo_in REAL,
      ancho_in REAL,
      alto_in REAL,
      peso_volumetrico_lbs REAL,
      peso_facturable_lbs REAL,
      contenido TEXT,
      packing_list TEXT, -- JSON array of items
      valor_declarado_usd REAL DEFAULT 0,
      seguro INTEGER DEFAULT 0,
      precio_cliente_q REAL,
      costo_carrier_q REAL,
      ganancia_q REAL,
      pago_pendiente INTEGER DEFAULT 0,
      estado TEXT DEFAULT 'Creado',
      semaforo TEXT DEFAULT 'VERDE',
      observaciones TEXT,
      fecha_recepcion DATE NOT NULL,
      fecha_entrega DATE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- TRACKING
    CREATE TABLE IF NOT EXISTS tracking_eventos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      envio_id INTEGER REFERENCES envios(id),
      codigo_envi TEXT NOT NULL,
      fecha_hora TIMESTAMP NOT NULL,
      evento TEXT NOT NULL,
      ubicacion TEXT,
      lat REAL,
      lng REAL,
      responsable TEXT,
      comentario TEXT,
      estado_resultante TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- CARRIERS
    CREATE TABLE IF NOT EXISTS carriers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT UNIQUE NOT NULL,
      referencia TEXT,
      contacto_nombre TEXT,
      contacto_tel TEXT,
      contacto_direccion TEXT,
      activo INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- CARRIER TARIFAS
    CREATE TABLE IF NOT EXISTS carrier_tarifas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      carrier_id INTEGER REFERENCES carriers(id),
      peso_min REAL,
      peso_max REAL,
      precio_costo_q REAL,
      precio_venta_q REAL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- PARÁMETROS
    CREATE TABLE IF NOT EXISTS parametros (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT UNIQUE NOT NULL,
      valor TEXT NOT NULL,
      descripcion TEXT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- MUNICIPIOS
    CREATE TABLE IF NOT EXISTS municipios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      prefijo TEXT NOT NULL,
      departamento TEXT,
      activo INTEGER DEFAULT 1
    );

    -- NOTIFICATIONS
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER REFERENCES usuarios(id),
      tipo TEXT NOT NULL, -- 'shipment_update', 'task', 'system'
      titulo TEXT NOT NULL,
      mensaje TEXT NOT NULL,
      visto INTEGER DEFAULT 0,
      link TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed Parameters
  const paramsCount = db.prepare('SELECT count(*) as count FROM parametros').get() as { count: number };
  if (paramsCount.count === 0) {
    const insertParam = db.prepare('INSERT INTO parametros (nombre, valor, descripcion) VALUES (?, ?, ?)');
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
      insertParam.run(name, val, desc);
    }
  }

  // Seed Users with fresh hashes (Always ensure correct passwords for these accounts)
  const adminHash = bcrypt.hashSync('envi2024admin', 10);
  const agentHash = bcrypt.hashSync('agente2024', 10);

  const upsertUser = db.prepare(`
    INSERT INTO usuarios (nombre, email, password_hash, rol)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(email) DO UPDATE SET password_hash = excluded.password_hash
  `);

  upsertUser.run('Dwight Leal', 'admin@envi.gt', adminHash, 'admin');
  upsertUser.run('Agente Demo', 'agente@envi.gt', agentHash, 'agente');
  
  console.log('Usuarios de prueba verificados/actualizados.');

  // Historical Seed (27 Real Receipts)
  // SEED REMOVED: User requested a virgin DB
  // const envCount = db.prepare('SELECT count(*) as count FROM envios').get() as { count: number };
  // if (envCount.count === 0) {
  //   const enviosHistoricos = [...];
  // }

  // Seed Municipalities
  const munCount = db.prepare('SELECT count(*) as count FROM municipios').get() as { count: number };
  if (munCount.count === 0) {
    const insertMun = db.prepare('INSERT INTO municipios (nombre, prefijo, departamento) VALUES (?, ?, ?)');
    const muns = [
      ['Cobán centro', 'CO', 'Alta Verapaz'],
      ['San Pedro Carchá', 'CA', 'Alta Verapaz'],
      ['Chisec', 'CH', 'Alta Verapaz'],
      ['Tactic', 'TA', 'Alta Verapaz'],
      ['Santa Cruz Verapaz', 'SC', 'Alta Verapaz'],
      ['Lanquín', 'LA', 'Alta Verapaz'],
      ['Fray Bartolomé de las Casas', 'FB', 'Alta Verapaz'],
      ['Senahú', 'SE', 'Alta Verapaz'],
      ['Cahabón', 'CJ', 'Alta Verapaz'],
      ['Campur', 'CM', 'Alta Verapaz'],
      ['Chamelco', 'CL', 'Alta Verapaz'],
      ['Ixcán', 'IX', 'Quiché'],
      ['Chicamán', 'QC', 'Quiché'],
      ['Guatemala Ciudad', 'GC', 'Guatemala'],
      ['Quetzaltenango', 'QZ', 'Quetzaltenango'],
      ['Otro', 'OT', 'Otro']
    ];
    for (const [name, pre, dep] of muns) {
      insertMun.run(name, pre, dep);
    }
  }

  // Seed Carriers
  // const carrierCount = db.prepare('SELECT count(*) as count FROM carriers').get() as { count: number };
  // if (carrierCount.count === 0) {
  //   const insertCarrier = db.prepare('INSERT INTO carriers (nombre, referencia, contacto_nombre, contacto_tel, contacto_direccion) VALUES (?, ?, ?, ?, ?)');
  //   const insertTarifa = db.prepare('INSERT INTO carrier_tarifas (carrier_id, peso_min, peso_max, precio_costo_q, precio_venta_q) VALUES (?, ?, ?, ?, ?)');
  //
  //   const initialCarriers = [
  //     ['DHL / ISSE', 'DHL', 'Carlos Mendez', '55443322', 'Ave. Reforma 10-20, Zona 10, GT'],
  //     ['FEDEX / ERG', 'FEDEX', 'Luis Gomez', '44332211', 'Diagonal 6, Zona 10, GT'],
  //     ['TIKAL EXPRESS', 'TIKAL', 'Marta Tikal', '33221100', 'Zona 9, GT'],
  //     ['ERG LOGISTICS', 'ERG', 'Agente ERG', '22110099', 'Zona 13, GT']
  //   ];
  //
  //   for (const [nom, ref, contact, tel, dir] of initialCarriers) {
  //     const res = insertCarrier.run(nom, ref, contact, tel, dir);
  //     const cId = res.lastInsertRowid;
  //     
  //     // Default sample rates
  //     insertTarifa.run(cId, 0, 1, 375, 475); // 1st lb
  //     insertTarifa.run(cId, 1, 100, 55, 85); // LB adicional
  //   }
  // }
}

export default db;
