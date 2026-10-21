-- ========================================================
-- Schema de Base de Datos para Turso (SQLite / libSQL)
-- FamilyFi AI
-- ========================================================

-- Tabla de Usuarios
CREATE TABLE IF NOT EXISTS users (
    email TEXT PRIMARY KEY,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Transacciones y Gastos
CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    user_email TEXT NOT NULL,
    amount REAL NOT NULL,
    description TEXT NOT NULL,
    notes TEXT,
    date TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('expense', 'income')),
    category TEXT NOT NULL,
    account TEXT DEFAULT 'Principal',
    taxAmount REAL DEFAULT 0,
    isDeductible INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE
);

-- Tabla de Ajustes de Usuario (almacena el JSON de configuración)
CREATE TABLE IF NOT EXISTS settings (
    user_email TEXT PRIMARY KEY,
    data TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE
);

-- Índices para optimizar consultas por usuario y fecha
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_email, date DESC);
