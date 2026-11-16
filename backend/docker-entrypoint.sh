#!/bin/sh
set -e

echo "Aplicando migrations..."
npx prisma migrate deploy

if [ "$SEED_DEMO" = "true" ]; then
  # O seed apaga a base antes de popular; só roda se ainda não houver usuários.
  USUARIOS=$(node -e "
    const { Client } = require('pg');
    const c = new Client({ connectionString: process.env.DATABASE_URL });
    c.connect()
      .then(() => c.query('SELECT count(*)::int AS n FROM usuarios'))
      .then((r) => { console.log(r.rows[0].n); return c.end(); })
      .catch((e) => { console.error(e.message); process.exit(1); });
  ")
  if [ "$USUARIOS" = "0" ]; then
    echo "Base vazia: carregando dados fictícios de demonstração..."
    node dist/src/seed.js
  fi
fi

exec node dist/src/main
