# Cuarenta B-TECH

Bracket de torneo de Cuarenta por parejas: jugadores se anotan, el organizador hace el sorteo (equipos y cuadro al azar), carga el marcador final de cada partido y todos ven el cuadro actualizarse.

## Probar en local

```bash
npm install
cp .env.example .env.local   # y escribe un ADMIN_PIN de al menos 6 caracteres
npm run dev
```

Sin claves de Supabase, todo se guarda en `.data/state.json`. Abre http://localhost:3000.

Pruebas de la lógica del cuadro: `npm test`.

## Poner Supabase

1. Crea un proyecto en supabase.com.
2. En **SQL Editor**, pega y ejecuta `supabase/schema.sql`.
3. En **Project Settings > API** copia la **Project URL** y la clave **service_role**.
4. Ponlas en `.env.local` como `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`.

La clave `service_role` solo la usa el servidor. No la pongas con prefijo `NEXT_PUBLIC_` ni la subas a git.

## Publicar en Vercel

1. Sube el repositorio a GitHub e impórtalo en Vercel.
2. En **Settings > Environment Variables** agrega `ADMIN_PIN`, `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`.
3. Despliega.

En Vercel las tres variables son obligatorias: sin Supabase la página muestra un error en vez de perder datos.

## Cómo funciona

- Todas las lecturas y escrituras pasan por rutas del servidor (`src/app/api`). El navegador nunca habla directo con Supabase.
- El torneo es un solo documento con número de versión; si dos personas guardan a la vez, el servidor reintenta en vez de pisar datos.
- Las pantallas se actualizan solas cada 4 segundos mientras la pestaña está visible.
- Reglas del torneo: `src/app/reglas/page.tsx`.
