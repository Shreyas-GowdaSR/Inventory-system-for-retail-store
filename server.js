import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

// In-memory / file persistent store for Provision Store (kirana)
// Used when Supabase credentials are not provided or as a smooth fallback
const DEFAULT_ITEMS = [
  {
    id: 'item-1',
    name: 'Sona Masoori Rice',
    category: 'Grains & Staples',
    quantity: 25,
    unit: 'kg',
    cost_price: 42,
    selling_price: 55,
    min_stock_level: 10,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'item-2',
    name: 'Whole Wheat Atta (Aashirvaad)',
    category: 'Grains & Staples',
    quantity: 6,
    unit: 'kg',
    cost_price: 36,
    selling_price: 45,
    min_stock_level: 15,
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'item-3',
    name: 'Toor Dal (Premium)',
    category: 'Pulses & Lentils',
    quantity: 14,
    unit: 'kg',
    cost_price: 135,
    selling_price: 165,
    min_stock_level: 8,
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'item-4',
    name: 'Moong Dal (Yellow)',
    category: 'Pulses & Lentils',
    quantity: 3,
    unit: 'kg',
    cost_price: 110,
    selling_price: 135,
    min_stock_level: 7,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'item-5',
    name: 'Refined White Sugar',
    category: 'Sugar & Salt',
    quantity: 32,
    unit: 'kg',
    cost_price: 38,
    selling_price: 46,
    min_stock_level: 12,
    created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'item-6',
    name: 'Tata Iodized Salt',
    category: 'Sugar & Salt',
    quantity: 20,
    unit: 'kg',
    cost_price: 19,
    selling_price: 25,
    min_stock_level: 10,
    created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'item-7',
    name: 'Sunflower Cooking Oil (Pouch)',
    category: 'Oils & Ghee',
    quantity: 4,
    unit: 'L',
    cost_price: 122,
    selling_price: 145,
    min_stock_level: 12,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'item-8',
    name: 'Pure Desi Cow Ghee',
    category: 'Oils & Ghee',
    quantity: 8,
    unit: 'L',
    cost_price: 520,
    selling_price: 640,
    min_stock_level: 4,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'item-9',
    name: 'Red Label Tea Dust (500g)',
    category: 'Tea & Coffee',
    quantity: 11,
    unit: 'pkt',
    cost_price: 140,
    selling_price: 175,
    min_stock_level: 6,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'item-10',
    name: 'Bru Instant Coffee (100g)',
    category: 'Tea & Coffee',
    quantity: 2,
    unit: 'pkt',
    cost_price: 95,
    selling_price: 120,
    min_stock_level: 5,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'item-11',
    name: 'Nandini Fresh Milk (500ml)',
    category: 'Dairy & Bakery',
    quantity: 0,
    unit: 'pkt',
    cost_price: 24,
    selling_price: 27,
    min_stock_level: 15,
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'item-12',
    name: 'Marie Gold Biscuits (120g)',
    category: 'Snacks & Packaged',
    quantity: 28,
    unit: 'pkt',
    cost_price: 18,
    selling_price: 25,
    min_stock_level: 10,
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'item-13',
    name: 'Surf Excel Detergent Powder (1kg)',
    category: 'Household & Cleaning',
    quantity: 9,
    unit: 'pkt',
    cost_price: 110,
    selling_price: 135,
    min_stock_level: 5,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'item-14',
    name: 'Lifebuoy Total Soap (Pack of 3)',
    category: 'Household & Cleaning',
    quantity: 16,
    unit: 'pkt',
    cost_price: 78,
    selling_price: 99,
    min_stock_level: 6,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date().toISOString()
  }
];

const DEFAULT_TRANSACTIONS = [
  {
    id: 'tx-1',
    item_id: 'item-1',
    item_name: 'Sona Masoori Rice',
    change_type: 'IN',
    quantity_change: 25,
    previous_quantity: 0,
    new_quantity: 25,
    notes: 'Morning wholesale supplier delivery',
    performed_by: 'Admin (Ramesh Store Owner)',
    created_at: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    id: 'tx-2',
    item_id: 'item-2',
    item_name: 'Whole Wheat Atta (Aashirvaad)',
    change_type: 'OUT',
    quantity_change: -4,
    previous_quantity: 10,
    new_quantity: 6,
    notes: 'Counter sale - customer billing',
    performed_by: 'Staff (Suresh Counter)',
    created_at: new Date(Date.now() - 3600000 * 3).toISOString()
  },
  {
    id: 'tx-3',
    item_id: 'item-7',
    item_name: 'Sunflower Cooking Oil (Pouch)',
    change_type: 'OUT',
    quantity_change: -2,
    previous_quantity: 6,
    new_quantity: 4,
    notes: 'Customer sale (2 packets)',
    performed_by: 'Staff (Suresh Counter)',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'tx-4',
    item_id: 'item-11',
    item_name: 'Nandini Fresh Milk (500ml)',
    change_type: 'OUT',
    quantity_change: -12,
    previous_quantity: 12,
    new_quantity: 0,
    notes: 'Morning milk packets sold out',
    performed_by: 'Staff (Suresh Counter)',
    created_at: new Date(Date.now() - 3600000 * 1).toISOString()
  }
];

// Active state
let localItems = [...DEFAULT_ITEMS];
let localTransactions = [...DEFAULT_TRANSACTIONS];

// Supabase configuration state (Supports Supabase Publishable Key and Secret Key, plus legacy anon/service_role keys)
let supabaseConfig = {
  url: process.env.SUPABASE_URL || '',
  // Prefer Secret Key for Node.js Express server-side database operations if provided, or Publishable Key / Anon Key
  key: process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || '',
  publishableKey: process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || '',
  secretKey: process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''
};

let supabaseClient = null;
let supabaseStatus = {
  connected: false,
  message: 'Supabase URL and API Key (Secret Key or Publishable Key) not configured. Running in local provision store mode.',
  lastChecked: null,
  tablesExist: false,
  keyType: 'none' // 'secret', 'publishable', or 'legacy'
};

// Detect key type (sb_sec_ / service_role vs sb_pub_ / anon)
function detectKeyType(key) {
  if (!key) return 'none';
  if (key.startsWith('sb_sec_')) return 'secret (sb_sec_...)';
  if (key.startsWith('sb_pub_')) return 'publishable (sb_pub_...)';
  if (key.startsWith('eyJ')) {
    // Decode basic payload to check role if JWT
    try {
      const parts = key.split('.');
      if (parts.length >= 2) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        if (payload.role === 'service_role') return 'secret (service_role)';
        if (payload.role === 'anon') return 'publishable (anon)';
      }
    } catch (e) {}
    return 'token / key';
  }
  return 'custom key';
}

// Initialize or update Supabase client
function initSupabase(url, key) {
  const chosenKey = key || supabaseConfig.key;
  if (url && chosenKey && url.startsWith('http')) {
    try {
      supabaseClient = createClient(url, chosenKey);
      supabaseConfig.url = url;
      supabaseConfig.key = chosenKey;
      supabaseStatus.keyType = detectKeyType(chosenKey);
      return true;
    } catch (err) {
      console.error('Failed to initialize Supabase client:', err.message);
      supabaseClient = null;
      supabaseStatus.keyType = 'none';
      return false;
    }
  } else {
    supabaseClient = null;
    supabaseStatus.keyType = 'none';
    return false;
  }
}

// Initial init
initSupabase(supabaseConfig.url, supabaseConfig.key);

// Helper to test Supabase connection and tables
async function checkSupabaseConnection() {
  if (!supabaseClient) {
    supabaseStatus = {
      connected: false,
      message: 'Supabase URL and Key (Secret Key or Publishable Key) are not provided. Running in provision store local mode.',
      lastChecked: new Date().toISOString(),
      tablesExist: false,
      keyType: 'none'
    };
    return supabaseStatus;
  }

  try {
    // Attempt a light query to test table 'items'
    const { data, error } = await supabaseClient.from('items').select('id').limit(1);

    if (error) {
      // Table might not exist yet
      if (error.code === '42P01' || error.message?.includes('does not exist') || error.message?.includes('relation "items" does not exist')) {
        supabaseStatus = {
          connected: true,
          message: 'Connected to Supabase PostgreSQL! The "items" table has not been created yet. Please execute the SQL setup script in your Supabase SQL editor.',
          lastChecked: new Date().toISOString(),
          tablesExist: false
        };
      } else {
        supabaseStatus = {
          connected: false,
          message: `Supabase error: ${error.message} (${error.code || 'UNKNOWN'})`,
          lastChecked: new Date().toISOString(),
          tablesExist: false
        };
      }
    } else {
      supabaseStatus = {
        connected: true,
        message: 'Successfully connected to Supabase PostgreSQL database!',
        lastChecked: new Date().toISOString(),
        tablesExist: true
      };
    }
  } catch (err) {
    supabaseStatus = {
      connected: false,
      message: `Failed to connect to Supabase: ${err.message}`,
      lastChecked: new Date().toISOString(),
      tablesExist: false
    };
  }

  return supabaseStatus;
}

// Seed Supabase if empty and tables exist
async function seedSupabaseIfEmpty() {
  if (!supabaseClient || !supabaseStatus.tablesExist) return;
  try {
    const { data, error } = await supabaseClient.from('items').select('id').limit(1);
    if (!error && (!data || data.length === 0)) {
      console.log('Seeding initial provision store items into Supabase PostgreSQL...');
      const cleanItems = DEFAULT_ITEMS.map(i => ({
        name: i.name,
        category: i.category,
        quantity: i.quantity,
        unit: i.unit,
        cost_price: i.cost_price,
        selling_price: i.selling_price,
        min_stock_level: i.min_stock_level,
        created_at: i.created_at,
        updated_at: i.updated_at
      }));
      await supabaseClient.from('items').insert(cleanItems);
    }
  } catch (e) {
    console.warn('Auto-seed check failed:', e.message);
  }
}

// Check at startup
checkSupabaseConnection().then(status => {
  if (status.connected && status.tablesExist) {
    seedSupabaseIfEmpty();
  }
});

// Express App
async function startServer() {
  const app = express();
  app.use(express.json());

  // Request logger for learning inspection
  app.use((req, res, next) => {
    if (req.url.startsWith('/api')) {
      console.log(`[API ${req.method}] ${req.url}`);
    }
    next();
  });

  // --- API ROUTES ---

  // 1. System & Database Status
  app.get('/api/status', async (req, res) => {
    await checkSupabaseConnection();
    res.json({
      supabase: {
        configured: Boolean(supabaseConfig.url && supabaseConfig.key),
        url: supabaseConfig.url ? supabaseConfig.url.replace(/^(https?:\/\/[^.]+).*/, '$1...supabase.co') : null,
        fullUrl: supabaseConfig.url || '',
        connected: supabaseStatus.connected,
        tablesExist: supabaseStatus.tablesExist,
        keyType: supabaseStatus.keyType,
        message: supabaseStatus.message,
        lastChecked: supabaseStatus.lastChecked
      },
      mode: (supabaseStatus.connected && supabaseStatus.tablesExist) ? 'supabase' : 'local_storage',
      stats: {
        totalItems: localItems.length,
        lowStockItems: localItems.filter(i => Number(i.quantity) <= Number(i.min_stock_level)).length,
        outOfStockItems: localItems.filter(i => Number(i.quantity) <= 0).length
      }
    });
  });

  // 2. Configure Supabase dynamically from UI (accepts secretKey, publishableKey, or key/anonKey)
  app.post('/api/config/supabase', async (req, res) => {
    const { url, secretKey, publishableKey, key, anonKey } = req.body;
    const chosenKey = (secretKey || key || publishableKey || anonKey || '').trim();

    if (!url || !chosenKey) {
      return res.status(400).json({ error: 'Supabase URL and API Key (Secret Key or Publishable Key) are required.' });
    }

    if (secretKey) supabaseConfig.secretKey = secretKey.trim();
    if (publishableKey) supabaseConfig.publishableKey = publishableKey.trim();

    const initialized = initSupabase(url.trim(), chosenKey);
    if (!initialized) {
      return res.status(400).json({ error: 'Invalid URL format or key format.' });
    }

    const status = await checkSupabaseConnection();
    if (status.connected && status.tablesExist) {
      await seedSupabaseIfEmpty();
    }

    res.json({ success: true, status });
  });

  // 3. Clear Supabase config (reset to local demo mode)
  app.post('/api/config/supabase/reset', (req, res) => {
    supabaseClient = null;
    supabaseConfig.url = '';
    supabaseConfig.key = '';
    supabaseConfig.secretKey = '';
    supabaseConfig.publishableKey = '';
    supabaseStatus = {
      connected: false,
      message: 'Switched back to local mode.',
      lastChecked: new Date().toISOString(),
      tablesExist: false,
      keyType: 'none'
    };
    res.json({ success: true, message: 'Reset to local provision store mode.' });
  });

  // 4. Supabase SQL Migration Script (For students learning how to create PostgreSQL schema)
  app.get('/api/sql-schema', (req, res) => {
    const sql = `-- ========================================================
-- Provision Store Inventory System - Supabase PostgreSQL Schema
-- Run this script in your Supabase Project -> SQL Editor
-- ========================================================

-- 1. Create Items Table (Stock tracking and low-level alerts)
CREATE TABLE IF NOT EXISTS public.items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    quantity NUMERIC NOT NULL DEFAULT 0,
    unit TEXT NOT NULL DEFAULT 'kg',
    cost_price NUMERIC NOT NULL DEFAULT 0,
    selling_price NUMERIC NOT NULL DEFAULT 0,
    min_stock_level NUMERIC NOT NULL DEFAULT 5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Stock Transaction Logs Table (Audit trail)
CREATE TABLE IF NOT EXISTS public.stock_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID REFERENCES public.items(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    change_type TEXT NOT NULL CHECK (change_type IN ('IN', 'OUT', 'ADJUSTMENT')),
    quantity_change NUMERIC NOT NULL,
    previous_quantity NUMERIC,
    new_quantity NUMERIC,
    notes TEXT,
    performed_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable Row Level Security (RLS) & Policies
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_logs ENABLE ROW LEVEL SECURITY;

-- Allow public read/write access for store staff and admin
CREATE POLICY "Allow public read access to items" 
ON public.items FOR SELECT USING (true);

CREATE POLICY "Allow public insert to items" 
ON public.items FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update to items" 
ON public.items FOR UPDATE USING (true);

CREATE POLICY "Allow public delete to items" 
ON public.items FOR DELETE USING (true);

CREATE POLICY "Allow public access to stock_logs" 
ON public.stock_logs FOR ALL USING (true);

-- 4. Initial Sample Provision Store Items
INSERT INTO public.items (name, category, quantity, unit, cost_price, selling_price, min_stock_level) VALUES
('Sona Masoori Rice', 'Grains & Staples', 25, 'kg', 42, 55, 10),
('Whole Wheat Atta (Aashirvaad)', 'Grains & Staples', 6, 'kg', 36, 45, 15),
('Toor Dal (Premium)', 'Pulses & Lentils', 14, 'kg', 135, 165, 8),
('Moong Dal (Yellow)', 'Pulses & Lentils', 3, 'kg', 110, 135, 7),
('Refined White Sugar', 'Sugar & Salt', 32, 'kg', 38, 46, 12),
('Tata Iodized Salt', 'Sugar & Salt', 20, 'kg', 19, 25, 10),
('Sunflower Cooking Oil (Pouch)', 'Oils & Ghee', 4, 'L', 122, 145, 12),
('Pure Desi Cow Ghee', 'Oils & Ghee', 8, 'L', 520, 640, 4),
('Red Label Tea Dust (500g)', 'Tea & Coffee', 11, 'pkt', 140, 175, 6),
('Nandini Fresh Milk (500ml)', 'Dairy & Bakery', 0, 'pkt', 24, 27, 15),
('Surf Excel Detergent (1kg)', 'Household & Cleaning', 9, 'pkt', 110, 135, 5);
`;
    res.json({ sql });
  });

  // 5. GET Items (with search and category filter)
  app.get('/api/items', async (req, res) => {
    const { search, category, low_stock_only } = req.query;

    if (supabaseClient && supabaseStatus.tablesExist) {
      try {
        let query = supabaseClient.from('items').select('*').order('name', { ascending: true });

        if (category && category !== 'All') {
          query = query.eq('category', category);
        }

        const { data, error } = await query;
        if (error) throw error;

        let results = data || [];
        if (search) {
          const s = search.toLowerCase();
          results = results.filter(i => i.name.toLowerCase().includes(s) || i.category.toLowerCase().includes(s));
        }

        if (low_stock_only === 'true') {
          results = results.filter(i => Number(i.quantity) <= Number(i.min_stock_level));
        }

        return res.json(results);
      } catch (err) {
        console.warn('Supabase query failed, falling back to local items:', err.message);
      }
    }

    // Local fallback
    let filtered = [...localItems];
    if (category && category !== 'All') {
      filtered = filtered.filter(i => i.category === category);
    }
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(i => i.name.toLowerCase().includes(s) || i.category.toLowerCase().includes(s));
    }
    if (low_stock_only === 'true') {
      filtered = filtered.filter(i => Number(i.quantity) <= Number(i.min_stock_level));
    }

    filtered.sort((a, b) => a.name.localeCompare(b.name));
    res.json(filtered);
  });

  // 6. POST Item (Add new item - Admin only)
  app.post('/api/items', async (req, res) => {
    const { name, category, quantity, unit, cost_price, selling_price, min_stock_level, role } = req.body;

    if (!name || !category || quantity === undefined) {
      return res.status(400).json({ error: 'Name, category, and quantity are required.' });
    }

    const newItem = {
      name: name.trim(),
      category: category.trim(),
      quantity: Math.max(0, Number(quantity) || 0),
      unit: unit ? unit.trim() : 'kg',
      cost_price: Number(cost_price) || 0,
      selling_price: Number(selling_price) || 0,
      min_stock_level: Number(min_stock_level) || 5,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (supabaseClient && supabaseStatus.tablesExist) {
      try {
        const { data, error } = await supabaseClient.from('items').insert([newItem]).select().single();
        if (error) throw error;

        // Also record creation transaction
        const initialLog = {
          item_id: data.id,
          item_name: data.name,
          change_type: 'IN',
          quantity_change: data.quantity,
          previous_quantity: 0,
          new_quantity: data.quantity,
          notes: 'Initial stock registration',
          performed_by: role === 'admin' ? 'Admin' : 'Staff',
          created_at: new Date().toISOString()
        };
        await supabaseClient.from('stock_logs').insert([initialLog]).catch(() => {});

        return res.status(201).json(data);
      } catch (err) {
        console.warn('Supabase insert failed, inserting to local:', err.message);
      }
    }

    newItem.id = 'item-' + Date.now();
    localItems.push(newItem);

    // Record initial log
    localTransactions.unshift({
      id: 'tx-' + Date.now(),
      item_id: newItem.id,
      item_name: newItem.name,
      change_type: 'IN',
      quantity_change: newItem.quantity,
      previous_quantity: 0,
      new_quantity: newItem.quantity,
      notes: 'Initial stock registration',
      performed_by: role === 'admin' ? 'Admin' : 'Staff',
      created_at: new Date().toISOString()
    });

    res.status(201).json(newItem);
  });

  // 7. PUT Item (Update details or restock threshold)
  app.put('/api/items/:id', async (req, res) => {
    const { id } = req.params;
    const { name, category, quantity, unit, cost_price, selling_price, min_stock_level } = req.body;

    const updates = {
      updated_at: new Date().toISOString()
    };
    if (name !== undefined) updates.name = name.trim();
    if (category !== undefined) updates.category = category.trim();
    if (quantity !== undefined) updates.quantity = Math.max(0, Number(quantity));
    if (unit !== undefined) updates.unit = unit.trim();
    if (cost_price !== undefined) updates.cost_price = Number(cost_price);
    if (selling_price !== undefined) updates.selling_price = Number(selling_price);
    if (min_stock_level !== undefined) updates.min_stock_level = Number(min_stock_level);

    if (supabaseClient && supabaseStatus.tablesExist) {
      try {
        const { data, error } = await supabaseClient.from('items').update(updates).eq('id', id).select().single();
        if (error) throw error;
        return res.json(data);
      } catch (err) {
        console.warn('Supabase update failed, updating locally:', err.message);
      }
    }

    const index = localItems.findIndex(i => i.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Item not found' });
    }

    localItems[index] = { ...localItems[index], ...updates };
    res.json(localItems[index]);
  });

  // 8. DELETE Item (Admin only)
  app.delete('/api/items/:id', async (req, res) => {
    const { id } = req.params;

    if (supabaseClient && supabaseStatus.tablesExist) {
      try {
        const { error } = await supabaseClient.from('items').delete().eq('id', id);
        if (error) throw error;
        return res.json({ success: true, message: 'Item deleted from database' });
      } catch (err) {
        console.warn('Supabase delete failed, deleting locally:', err.message);
      }
    }

    localItems = localItems.filter(i => i.id !== id);
    res.json({ success: true, message: 'Item deleted' });
  });

  // 9. Stock Transaction (IN / OUT / ADJUSTMENT) - Core stock tracking!
  app.post('/api/stock-transaction', async (req, res) => {
    const { item_id, change_type, quantity_change, notes, performed_by } = req.body;

    if (!item_id || !change_type || quantity_change === undefined) {
      return res.status(400).json({ error: 'Item ID, change_type (IN/OUT/ADJUSTMENT), and quantity_change are required.' });
    }

    const numChange = Number(quantity_change);
    if (isNaN(numChange) || numChange <= 0) {
      return res.status(400).json({ error: 'Quantity change must be a positive number.' });
    }

    // Determine actual delta: IN = +qty, OUT = -qty, ADJUSTMENT = could replace or delta
    let delta = 0;
    if (change_type === 'IN') delta = numChange;
    else if (change_type === 'OUT') delta = -numChange;
    else delta = numChange; // For adjustment, user passes delta or signed

    // Supabase path
    if (supabaseClient && supabaseStatus.tablesExist) {
      try {
        // Fetch current item
        const { data: item, error: fetchErr } = await supabaseClient.from('items').select('*').eq('id', item_id).single();
        if (fetchErr || !item) {
          return res.status(404).json({ error: 'Item not found' });
        }

        const prevQty = Number(item.quantity);
        let newQty = prevQty + delta;
        if (newQty < 0) {
          return res.status(400).json({
            error: `Cannot reduce stock by ${numChange} ${item.unit}. Only ${prevQty} ${item.unit} available in store.`
          });
        }

        // Update item quantity
        const { data: updatedItem, error: updateErr } = await supabaseClient
          .from('items')
          .update({ quantity: newQty, updated_at: new Date().toISOString() })
          .eq('id', item_id)
          .select()
          .single();

        if (updateErr) throw updateErr;

        // Log transaction
        const logEntry = {
          item_id: item.id,
          item_name: item.name,
          change_type,
          quantity_change: delta,
          previous_quantity: prevQty,
          new_quantity: newQty,
          notes: notes || (change_type === 'OUT' ? 'Customer sale' : change_type === 'IN' ? 'Supplier Restock' : 'Stock adjustment'),
          performed_by: performed_by || 'Store Staff',
          created_at: new Date().toISOString()
        };

        await supabaseClient.from('stock_logs').insert([logEntry]);

        const isLow = newQty <= Number(updatedItem.min_stock_level);
        return res.json({
          success: true,
          item: updatedItem,
          transaction: logEntry,
          isLowStock: isLow,
          isOutOfStock: newQty <= 0,
          alertMessage: isLow ? `⚠️ Alert: ${updatedItem.name} has reached low stock (${newQty} ${updatedItem.unit} remaining, min alert: ${updatedItem.min_stock_level} ${updatedItem.unit})` : null
        });
      } catch (err) {
        console.warn('Supabase stock transaction failed, running locally:', err.message);
      }
    }

    // Local fallback path
    const itemIndex = localItems.findIndex(i => i.id === item_id);
    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const item = localItems[itemIndex];
    const prevQty = Number(item.quantity);
    const newQty = prevQty + delta;

    if (newQty < 0) {
      return res.status(400).json({
        error: `Cannot reduce stock by ${numChange} ${item.unit}. Only ${prevQty} ${item.unit} available in store.`
      });
    }

    item.quantity = newQty;
    item.updated_at = new Date().toISOString();

    const logEntry = {
      id: 'tx-' + Date.now(),
      item_id: item.id,
      item_name: item.name,
      change_type,
      quantity_change: delta,
      previous_quantity: prevQty,
      new_quantity: newQty,
      notes: notes || (change_type === 'OUT' ? 'Customer sale' : change_type === 'IN' ? 'Supplier Restock' : 'Stock adjustment'),
      performed_by: performed_by || 'Store Staff',
      created_at: new Date().toISOString()
    };

    localTransactions.unshift(logEntry);
    if (localTransactions.length > 100) localTransactions.pop();

    const isLow = newQty <= Number(item.min_stock_level);
    res.json({
      success: true,
      item,
      transaction: logEntry,
      isLowStock: isLow,
      isOutOfStock: newQty <= 0,
      alertMessage: isLow ? `⚠️ Alert: ${item.name} has reached low stock (${newQty} ${item.unit} remaining, min alert: ${item.min_stock_level} ${item.unit})` : null
    });
  });

  // 10. GET Stock Transactions (Audit history)
  app.get('/api/stock-transactions', async (req, res) => {
    if (supabaseClient && supabaseStatus.tablesExist) {
      try {
        const { data, error } = await supabaseClient
          .from('stock_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);
        if (!error && data) return res.json(data);
      } catch (e) {
        console.warn('Supabase fetch logs failed, using local logs:', e.message);
      }
    }

    res.json(localTransactions);
  });

  // 11. Low stock alerts summary endpoint
  app.get('/api/alerts', async (req, res) => {
    let items = localItems;
    if (supabaseClient && supabaseStatus.tablesExist) {
      try {
        const { data } = await supabaseClient.from('items').select('*');
        if (data) items = data;
      } catch (e) {}
    }

    const alerts = items
      .filter(i => Number(i.quantity) <= Number(i.min_stock_level))
      .map(i => ({
        id: i.id,
        name: i.name,
        category: i.category,
        quantity: Number(i.quantity),
        min_stock_level: Number(i.min_stock_level),
        unit: i.unit,
        deficit: Math.max(0, Number(i.min_stock_level) - Number(i.quantity)),
        isOutOfStock: Number(i.quantity) <= 0
      }))
      .sort((a, b) => {
        // Out of stock first, then highest deficit
        if (a.isOutOfStock && !b.isOutOfStock) return -1;
        if (!a.isOutOfStock && b.isOutOfStock) return 1;
        return b.deficit - a.deficit;
      });

    res.json({
      count: alerts.length,
      alerts
    });
  });

  // 12. Authentication (Admin & Staff roles)
  app.post('/api/auth/login', async (req, res) => {
    const { email, password, role } = req.body;

    // Quick demo role selection support
    if (role === 'admin' || email === 'admin@store.com') {
      return res.json({
        user: {
          id: 'user-admin-1',
          email: email || 'admin@store.com',
          name: 'Ramesh Sharma (Store Owner)',
          role: 'admin'
        },
        token: 'demo-token-admin'
      });
    }

    if (role === 'staff' || email === 'staff@store.com') {
      return res.json({
        user: {
          id: 'user-staff-1',
          email: email || 'staff@store.com',
          name: 'Suresh Kumar (Counter Staff)',
          role: 'staff'
        },
        token: 'demo-token-staff'
      });
    }

    // Supabase Auth integration if live
    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;

        // Extract role from user_metadata
        const userRole = data.user.user_metadata?.role || (email.includes('admin') ? 'admin' : 'staff');
        return res.json({
          user: {
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.full_name || data.user.email.split('@')[0],
            role: userRole
          },
          session: data.session
        });
      } catch (err) {
        return res.status(401).json({ error: err.message });
      }
    }

    // Default fallback
    return res.status(401).json({ error: 'Invalid credentials. Please use demo buttons or connect Supabase.' });
  });

  // 13. Supabase Auth Sign Up
  app.post('/api/auth/signup', async (req, res) => {
    const { email, password, name, role } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const assignedRole = role === 'admin' ? 'admin' : 'staff';

    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name || email.split('@')[0],
              role: assignedRole
            }
          }
        });
        if (error) throw error;
        return res.json({
          success: true,
          message: 'Sign up successful! Please check your email for confirmation if enabled.',
          user: data.user
        });
      } catch (err) {
        return res.status(400).json({ error: err.message });
      }
    }

    // Local simulation
    res.json({
      success: true,
      message: 'Account created (Local mode). You can now log in.',
      user: {
        id: 'user-' + Date.now(),
        email,
        name: name || email.split('@')[0],
        role: assignedRole
      }
    });
  });

  // --- VITE MIDDLEWARE / STATIC ASSETS ---
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[KiranaStore Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Server failed to start:', err);
});
