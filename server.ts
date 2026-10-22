import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createClient } from '@libsql/client';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const isProduction = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

// Configuración de la base de datos Turso / libSQL
// Si TURSO_DATABASE_URL no está configurada, usa una base de datos SQLite local para no fallar
const tursoUrl = process.env.TURSO_DATABASE_URL || 'file:local.db';
const tursoAuthToken = process.env.TURSO_AUTH_TOKEN || undefined;

console.log(`[Database] Inicializando conexión a: ${tursoUrl.startsWith('file:') ? 'SQLite Local (' + tursoUrl + ')' : 'Turso Cloud (' + tursoUrl.split('@').pop() + ')'}`);

export const db = createClient({
  url: tursoUrl,
  authToken: tursoAuthToken,
});

// Inicialización automática del esquema en Turso
async function initDatabase() {
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        email TEXT PRIMARY KEY,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        user_email TEXT NOT NULL,
        amount REAL NOT NULL,
        description TEXT NOT NULL,
        notes TEXT,
        date TEXT NOT NULL,
        type TEXT NOT NULL,
        category TEXT NOT NULL,
        account TEXT DEFAULT 'Principal',
        taxAmount REAL DEFAULT 0,
        isDeductible INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS settings (
        user_email TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE
      );
    `);

    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_email, date DESC);
    `);

    console.log('[Database] Tablas e índices verificados y listos en Turso.');
  } catch (error) {
    console.error('[Database Error] Error al inicializar tablas:', error);
  }
}

// Middlewares
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(cookieParser());

// Helper para extraer el email autenticado (cookie de sesión o header Authorization)
function getAuthenticatedUser(req: Request): string | null {
  if (req.cookies && req.cookies.user_email) {
    return req.cookies.user_email;
  }
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  return null;
}

// Configuración de cookie segura
const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: (isProduction ? 'none' : 'lax') as 'none' | 'lax',
  maxAge: 30 * 24 * 60 * 60 * 1000 // 30 días
};

// ==========================================
// CONTROLADOR UNIFICADO DE API (Compatible con ?action= y REST)
// ==========================================
async function handleApiAction(req: Request, res: Response) {
  const action = (req.query.action as string) || (req.params.action as string) || '';

  try {
    if (action === 'register') {
      const email = (req.body.email || '').toLowerCase().trim();
      const password = req.body.password || '';

      if (!email || !password) {
        return res.status(400).json({ error: 'MISSING_DATA' });
      }

      // Verificar si ya existe
      const existing = await db.execute({
        sql: 'SELECT email FROM users WHERE email = ?',
        args: [email]
      });

      if (existing.rows.length > 0) {
        return res.status(409).json({ error: 'USER_ALREADY_EXISTS' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      await db.execute({
        sql: 'INSERT INTO users (email, password) VALUES (?, ?)',
        args: [email, hashedPassword]
      });

      res.cookie('user_email', email, cookieOptions);
      return res.json({ status: 'ok', email });
    }

    if (action === 'login') {
      const email = (req.body.email || '').toLowerCase().trim();
      const password = req.body.password || '';

      const userRes = await db.execute({
        sql: 'SELECT email, password FROM users WHERE email = ?',
        args: [email]
      });

      if (userRes.rows.length === 0) {
        return res.status(401).json({ error: 'INVALID_LOGIN' });
      }

      const user = userRes.rows[0];
      const match = await bcrypt.compare(password, user.password as string);

      if (!match) {
        return res.status(401).json({ error: 'INVALID_LOGIN' });
      }

      res.cookie('user_email', email, cookieOptions);
      return res.json({ status: 'ok', email });
    }

    if (action === 'check_auth') {
      const email = getAuthenticatedUser(req);
      return res.json({
        authenticated: !!email,
        email: email || null
      });
    }

    if (action === 'logout') {
      res.clearCookie('user_email', cookieOptions);
      return res.json({ status: 'ok' });
    }

    // Rutas protegidas que requieren autenticación
    const userEmail = getAuthenticatedUser(req);
    if (!userEmail) {
      return res.status(401).json({ error: 'UNAUTHORIZED' });
    }

    if (action === 'get_data') {
      const [txResult, settingsResult] = await Promise.all([
        db.execute({
          sql: 'SELECT * FROM transactions WHERE user_email = ? ORDER BY date DESC',
          args: [userEmail]
        }),
        db.execute({
          sql: 'SELECT data FROM settings WHERE user_email = ?',
          args: [userEmail]
        })
      ]);

      const transactions = txResult.rows.map(row => ({
        id: row.id,
        amount: Number(row.amount),
        description: row.description,
        notes: row.notes,
        date: row.date,
        type: row.type,
        category: row.category,
        account: row.account,
        taxAmount: Number(row.taxAmount || 0),
        isDeductible: Boolean(row.isDeductible)
      }));

      let settingsData = null;
      if (settingsResult.rows.length > 0 && settingsResult.rows[0].data) {
        try {
          settingsData = JSON.parse(settingsResult.rows[0].data as string);
        } catch {
          settingsData = null;
        }
      }

      return res.json({
        transactions,
        settings: settingsData
      });
    }

    if (action === 'save_transaction') {
      const d = req.body;
      if (!d || !d.id || d.amount === undefined) {
        return res.status(400).json({ error: 'INVALID_TRANSACTION_PAYLOAD' });
      }

      const amount = Number(d.amount) || 0;
      const description = d.description || '';
      const notes = d.notes || '';
      const date = d.date || new Date().toISOString().split('T')[0];
      const type = d.type === 'income' ? 'income' : 'expense';
      const category = d.category || 'Otros';
      const account = d.account || 'Principal';
      const taxAmount = Number(d.taxAmount) || 0;
      const isDeductible = d.isDeductible ? 1 : 0;

      await db.execute({
        sql: `INSERT INTO transactions (id, user_email, amount, description, notes, date, type, category, account, taxAmount, isDeductible)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(id) DO UPDATE SET
                amount = excluded.amount,
                description = excluded.description,
                notes = excluded.notes,
                date = excluded.date,
                type = excluded.type,
                category = excluded.category,
                account = excluded.account,
                taxAmount = excluded.taxAmount,
                isDeductible = excluded.isDeductible`,
        args: [
          d.id,
          userEmail,
          amount,
          description,
          notes,
          date,
          type,
          category,
          account,
          taxAmount,
          isDeductible
        ]
      });

      return res.json({ status: 'ok' });
    }

    if (action === 'save_settings') {
      const dataStr = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

      await db.execute({
        sql: `INSERT INTO settings (user_email, data, updated_at)
              VALUES (?, ?, CURRENT_TIMESTAMP)
              ON CONFLICT(user_email) DO UPDATE SET
                data = excluded.data,
                updated_at = CURRENT_TIMESTAMP`,
        args: [userEmail, dataStr]
      });

      return res.json({ status: 'ok' });
    }

    return res.status(400).json({ error: 'UNKNOWN_ACTION', action });
  } catch (error: any) {
    console.error(`[API Error] Error en acción '${action}':`, error);
    return res.status(500).json({ error: error?.message || 'INTERNAL_SERVER_ERROR' });
  }
}

// Rutas de API: Soportamos tanto /api?action=... como /api.php?action=...
app.all('/api', handleApiAction);
app.all('/api.php', handleApiAction);
app.all('/api/:action', handleApiAction);

// Endpoint de estado y diagnóstico para Render
app.get('/health', async (req: Request, res: Response) => {
  try {
    const dbCheck = await db.execute('SELECT 1 as alive');
    res.json({
      status: 'healthy',
      database: 'connected',
      tursoConnected: !!tursoAuthToken,
      databaseUrl: tursoUrl.startsWith('file:') ? 'local-sqlite' : 'turso-cloud',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(500).json({
      status: 'unhealthy',
      databaseError: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Inicialización del servidor según entorno (Desarrollo con Vite Middleware vs Producción con dist/)
async function startServer() {
  await initDatabase();

  if (!isProduction) {
    // Modo Desarrollo: integramos Vite dev server como middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });

    app.use(vite.middlewares);
    console.log('[Dev Server] Vite middleware montado.');
  } else {
    // Modo Producción: servimos los archivos estáticos generados en 'dist'
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));

    // Fallback SPA para React Router / navegación HTML5 (compatible con Express 5 y path-to-regexp v6+)
    app.use((req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log(`[Prod Server] Sirviendo estáticos desde: ${distPath}`);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`===============================================`);
    console.log(`🚀 FamilyFi AI Servidor Activo`);
    console.log(`📡 Puerto: ${PORT}`);
    console.log(`🌐 Modo: ${isProduction ? 'PRODUCCIÓN (Render)' : 'DESARROLLO'}`);
    console.log(`🗄️ Base de datos: ${tursoUrl}`);
    console.log(`===============================================`);
  });
}

startServer();
