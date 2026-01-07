const db = require('./db-adapter');
const bcrypt = require('bcryptjs');

async function setupDb() {
  await db.connect();

  const isPg = db.type === 'postgres';
  const autoInc = isPg ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT';
  const text = isPg ? 'TEXT' : 'TEXT'; // Same
  const real = isPg ? 'REAL' : 'REAL'; // Same
  const datetime = isPg ? 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' : 'DATETIME DEFAULT CURRENT_TIMESTAMP';
  const bool = isPg ? 'BOOLEAN DEFAULT TRUE' : 'BOOLEAN DEFAULT 1'; // SQLite 1/0, PG true/false

  // Helper to create tables with appropriate types
  const createTable = async (name, schema) => {
    // Basic replacement for common differences
    let sql = `CREATE TABLE IF NOT EXISTS ${name} (${schema})`;
    if (isPg) {
      // Manual fixups for Postgres specific syntax if needed
      // e.g. SQLite CHECK constraints are mostly compatible
    }
    await db.exec(sql);
  };

  await createTable('users', `
      id ${autoInc},
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT CHECK(role IN ('admin', 'worker')) NOT NULL
  `);

  await createTable('local_orders', `
        id ${autoInc},
        platform TEXT,
        eldorado_ref TEXT,
        client_username TEXT,
        client_password TEXT,
        client_email TEXT,
        order_type TEXT DEFAULT 'Leveling',
        order_link TEXT,
        accepted_price REAL,
        assigned_worker_id INTEGER,
        aldorado_account TEXT,
        status TEXT CHECK(status IN ('New', 'Working', 'Postponed', 'Completed')) DEFAULT 'New',
        notes TEXT,
        screenshot_path TEXT,
        created_at ${datetime},
        completed_at ${isPg ? 'TIMESTAMP' : 'DATETIME'},
        FOREIGN KEY (assigned_worker_id) REFERENCES users(id)
  `);

  await createTable('eldorado_orders', `
      eldorado_id TEXT PRIMARY KEY,
      buyer_username TEXT NOT NULL,
      accepted_price REAL NOT NULL,
      order_link TEXT,
      state TEXT CHECK(state IN ('Pending Delivery', 'Delivered')) DEFAULT 'Pending Delivery',
      converted_to_local_id INTEGER,
      FOREIGN KEY (converted_to_local_id) REFERENCES local_orders(id)
  `);

  await createTable('order_history', `
      id ${autoInc},
      order_id INTEGER NOT NULL,
      status_from TEXT,
      status_to TEXT,
      changed_by INTEGER,
      timestamp ${datetime},
      FOREIGN KEY (order_id) REFERENCES local_orders(id),
      FOREIGN KEY (changed_by) REFERENCES users(id)
  `);

  await createTable('blox_fruits', `
      id ${autoInc},
      name TEXT UNIQUE NOT NULL,
      image_url TEXT,
      quantity INTEGER DEFAULT 0,
      rarity TEXT CHECK(rarity IN ('Common', 'Uncommon', 'Rare', 'Legendary', 'Mythical')) DEFAULT 'Common',
      price REAL DEFAULT 0
  `);

  await createTable('fruit_orders', `
      id ${autoInc},
      local_order_id INTEGER NOT NULL,
      fruit_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      FOREIGN KEY (local_order_id) REFERENCES local_orders(id),
      FOREIGN KEY (fruit_id) REFERENCES blox_fruits(id)
  `);

  await createTable('fruit_stock_history', `
      id ${autoInc},
      fruit_id INTEGER NOT NULL,
      change_amount INTEGER NOT NULL,
      reason TEXT,
      timestamp ${datetime},
      FOREIGN KEY (fruit_id) REFERENCES blox_fruits(id)
  `);

  await createTable('expenses', `
      id ${autoInc},
      title TEXT NOT NULL,
      amount REAL NOT NULL,
      category TEXT,
      notes TEXT,
      created_by INTEGER,
      created_at ${datetime},
      FOREIGN KEY (created_by) REFERENCES users(id)
  `);

  await createTable('campaigns', `
        id ${autoInc},
        title TEXT NOT NULL,
        description TEXT,
        type TEXT CHECK(type IN ('order_count', 'revenue_sum')) NOT NULL,
        target_value REAL NOT NULL,
        reward TEXT,
        start_date ${isPg ? 'TIMESTAMP' : 'DATETIME'},
        end_date ${isPg ? 'TIMESTAMP' : 'DATETIME'},
        is_active ${bool},
        created_at ${datetime}
  `);

  await createTable('aldorado_accounts', `
        id ${autoInc},
        name TEXT NOT NULL UNIQUE,
        email TEXT,
        is_active ${bool},
        created_at ${datetime}
  `);

  await createTable('work_sessions', `
        id ${autoInc},
        user_id INTEGER NOT NULL,
        login_time ${datetime},
        logout_time ${isPg ? 'TIMESTAMP' : 'DATETIME'},
        duration_minutes INTEGER,
        FOREIGN KEY (user_id) REFERENCES users(id)
  `);

  await createTable('scripts', `
    id ${autoInc},
    name TEXT NOT NULL,
    content TEXT,
    source_link TEXT,
    notes TEXT,
    created_at ${datetime}
  `);

  // Create default admin if not exists
  const adminExists = await db.get('SELECT * FROM users WHERE username = ?', ['admin']);
  if (!adminExists) {
    const hash = await bcrypt.hash('admin123', 10);
    await db.run('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)', ['admin', hash, 'admin']);
    console.log('Default admin user created: admin / admin123');
  }

  // SELF-HEALING MIGRATION: Auto-add 'aldorado_account' if missing
  try {
    console.log('Checking for aldorado_account column...');
    await db.run('ALTER TABLE local_orders ADD COLUMN aldorado_account TEXT');
    console.log('Migration Success: Added aldorado_account to local_orders');
  } catch (err) {
    // Ignore error if column already exists (common behavior in restarts)
    // console.log('Migration Note: Column likely exists or not needed.'); 
  }

  // SEEDING: Blox Fruits (If empty)
  const fruitCount = await db.get('SELECT COUNT(*) as c FROM blox_fruits');
  // Postgres returns count as string '0', SQLite as number 0. Use == for loose check.
  if (fruitCount && (fruitCount.c == 0 || fruitCount.count == 0)) {
    console.log('Seeding Blox Fruits...');
    const fruits = [
      { name: 'Rocket', rarity: 'Common', price: 50, image: 'https://placehold.co/64/orange/white?text=Rocket' },
      { name: 'Spin', rarity: 'Common', price: 180, image: 'https://placehold.co/64/gray/white?text=Spin' },
      { name: 'Chop', rarity: 'Common', price: 300, image: 'https://placehold.co/64/blue/white?text=Chop' },
      { name: 'Spring', rarity: 'Common', price: 600, image: 'https://placehold.co/64/pink/white?text=Spring' },
      { name: 'Bomb', rarity: 'Common', price: 800, image: 'https://placehold.co/64/black/white?text=Bomb' },
      { name: 'Smoke', rarity: 'Common', price: 1200, image: 'https://placehold.co/64/gray/white?text=Smoke' },
      { name: 'Spike', rarity: 'Common', price: 1500, image: 'https://placehold.co/64/white/black?text=Spike' },
      { name: 'Flame', rarity: 'Uncommon', price: 2500, image: 'https://placehold.co/64/red/white?text=Flame' },
      { name: 'Ice', rarity: 'Uncommon', price: 3000, image: 'https://placehold.co/64/cyan/white?text=Ice' },
      { name: 'Sand', rarity: 'Uncommon', price: 4000, image: 'https://placehold.co/64/yellow/black?text=Sand' },
      { name: 'Dark', rarity: 'Uncommon', price: 5000, image: 'https://placehold.co/64/black/white?text=Dark' },
      { name: 'Light', rarity: 'Rare', price: 6500, image: 'https://placehold.co/64/yellow/white?text=Light' },
      { name: 'Magma', rarity: 'Rare', price: 8000, image: 'https://placehold.co/64/red/black?text=Magma' },
      { name: 'Rubber', rarity: 'Rare', price: 9000, image: 'https://placehold.co/64/pink/black?text=Rubber' },
      { name: 'Barrier', rarity: 'Rare', price: 10000, image: 'https://placehold.co/64/green/white?text=Barrier' },
      { name: 'Ghost', rarity: 'Rare', price: 12000, image: 'https://placehold.co/64/purple/white?text=Ghost' },
      { name: 'Portal', rarity: 'Legendary', price: 15000, image: 'https://placehold.co/64/blue/white?text=Portal' },
      { name: 'Rumble', rarity: 'Legendary', price: 18000, image: 'https://placehold.co/64/cyan/black?text=Rumble' },
      { name: 'Paw', rarity: 'Legendary', price: 20000, image: 'https://placehold.co/64/pink/white?text=Paw' },
      { name: 'Blizzard', rarity: 'Legendary', price: 22000, image: 'https://placehold.co/64/white/blue?text=Bliz' },
      { name: 'Gravity', rarity: 'Legendary', price: 25000, image: 'https://placehold.co/64/purple/black?text=Grav' },
      { name: 'Dough', rarity: 'Mythical', price: 30000, image: 'https://placehold.co/64/yellow/brown?text=Dough' },
      { name: 'Shadow', rarity: 'Mythical', price: 32000, image: 'https://placehold.co/64/black/purple?text=Shadow' },
      { name: 'Venom', rarity: 'Mythical', price: 35000, image: 'https://placehold.co/64/purple/green?text=Venom' },
      { name: 'Control', rarity: 'Mythical', price: 38000, image: 'https://placehold.co/64/gray/purple?text=Control' },
      { name: 'Spirit', rarity: 'Mythical', price: 40000, image: 'https://placehold.co/64/cyan/red?text=Spirit' },
      { name: 'Dragon', rarity: 'Mythical', price: 50000, image: 'https://placehold.co/64/orange/red?text=Dragon' },
      { name: 'Leopard', rarity: 'Mythical', price: 60000, image: 'https://placehold.co/64/yellow/black?text=Leo' },
      { name: 'Kitsune', rarity: 'Mythical', price: 80000, image: 'https://placehold.co/64/blue/cyan?text=Kit' },
      { name: 'T-Rex', rarity: 'Mythical', price: 90000, image: 'https://placehold.co/64/green/red?text=Rex' }
    ];
    for (const f of fruits) {
      await db.run('INSERT INTO blox_fruits (name, rarity, price, quantity, image_url) VALUES (?, ?, ?, 0, ?)', [f.name, f.rarity, f.price, f.image]);
    }
  }

  // SEEDING: Scripts (If empty)
  const scriptCount = await db.get('SELECT COUNT(*) as c FROM scripts');
  if (scriptCount && (scriptCount.c == 0 || scriptCount.count == 0)) {
    console.log('Seeding Sample Script...');
    await db.run(`INSERT INTO scripts (name, content, source_link, notes) VALUES (?, ?, ?, ?)`, [
      'Auto Farm Level',
      'loadstring(game:HttpGet("https://raw.githubusercontent.com/Example/Script/main/loader.lua"))()',
      'https://script-hub.com',
      'Best auto farm for leveling up quickly.'
    ]);
  }

  return db;
}

module.exports = setupDb;

