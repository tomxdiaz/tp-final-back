# Spec: app_user + provider — Backend ANDO

**Fecha:** 2026-05-16  
**Estado:** Aprobado

---

## Contexto

Stack: NestJS + TypeScript + Supabase (PostgreSQL + Auth). Sin TypeORM — se usa el cliente de Supabase directamente.

Roles:
- `SUPER_USER` — acceso total (devs/admin). Bypass automático en todos los guards de rol.
- `PROVIDER` — prestador de servicios. Gestiona sus actividades y ve sus reservas.
- `USER` — usuario cliente final. Busca, reserva y reseña.

El JWT de Supabase trae el `sub` (= `app_user.id`). El guard `SupabaseAuthGuard` valida el token y carga el perfil en `request.appUser`.

---

## Paso previo: regenerar tipos

Antes de implementar, correr:

```bash
npm run supabase:regeneratetypes
```

Esto actualiza `src/supabase/database.types.ts` para que incluya los campos nuevos de `app_user` (`first_name`, `last_name`, `phone`, `created_at`, `updated_at`) y las tablas nuevas (`provider`, `activity`, etc.).

**Restricción:** no tocar nada de Supabase que no sea local. Solo cambios en código NestJS y tipos locales.

---

## 1. Guard — RolesGuard

**Cambio mínimo en `src/auth/guards/roles.guard.ts`:**

Agregar bypass para `SUPER_USER` antes del chequeo de roles:

```typescript
if (currentRole === 'SUPER_USER') return true;
```

Así, cualquier endpoint con `@Roles(AppRole.PROVIDER)` también es accesible para el SUPER_USER sin necesidad de agregar `AppRole.SUPER_USER` a cada decorador.

---

## 2. Módulo `app_user`

### 2.1 `AppUserDto` (actualizado)

Agregar los campos nuevos (todos opcionales/nullable para compatibilidad con registros anteriores):

| campo | tipo | descripción |
|---|---|---|
| id | string (uuid) | existente |
| email | string | existente |
| global_role | AppRole | existente |
| first_name | string \| null | nuevo |
| last_name | string \| null | nuevo |
| phone | string \| null | nuevo |
| created_at | string | nuevo |
| updated_at | string | nuevo |

### 2.2 `AppUserController` — prefix `/app_user`

| método | path | roles | descripción |
|---|---|---|---|
| GET | /app_user/me | USER \| PROVIDER \| SUPER | retorna perfil propio — ya existe |
| PATCH | /app_user/me | USER \| PROVIDER \| SUPER | edita perfil propio — nuevo |

**`UpdateMeDto`** (nuevo):
- `first_name?: string`
- `last_name?: string`
- `phone?: string`

Los tres son opcionales. Si el body está vacío, retorna el perfil sin cambios (no es error).

### 2.3 `AppUserAdminController` — prefix `/admin/users`

Registrado dentro de `AppUserModule`. Comparte `AppUserService`.

| método | path | roles | descripción |
|---|---|---|---|
| GET | /admin/users | SUPER | lista todos los usuarios |
| PATCH | /admin/users/:id/role | SUPER | cambia el global_role de un usuario |
| PATCH | /admin/users/:id/block | SUPER | bloquea o desbloquea un usuario |

**`UpdateRoleDto`** (ajustado — `appUserId` pasa a ser param de URL, se elimina del body):
- `role: AppRole`

**`BlockUserDto`** (nuevo):
- `blocked: boolean`

### 2.4 `AppUserService` — métodos nuevos

**`updateMe(userId: string, dto: UpdateMeDto): Promise<AppUserDto>`**
- Actualiza `first_name`, `last_name`, `phone` en tabla `app_user`
- Solo actualiza los campos presentes en el dto (no sobreescribe con undefined)
- Retorna el perfil actualizado

**`setBlockedStatus(userId: string, blocked: boolean): Promise<AppUserDto>`**
- Usa `supabase.auth.admin.updateUserById(userId, { ban_duration: blocked ? '876000h' : 'none' })`
- `'876000h'` ≈ 100 años (efectivamente permanente)
- `'none'` desbloquea
- Retorna el perfil del usuario afectado

---

## 3. Módulo `provider` (nuevo)

### 3.1 Tabla `provider`

```
id            uuid PK
app_user_id   uuid UNIQUE FK → app_user.id
business_name text NOT NULL
description   text
contact_email text
contact_phone text
verified      boolean default false
created_at    timestamptz
updated_at    timestamptz
```

### 3.2 DTOs

**`ProviderDto`** (respuesta):
- id, app_user_id, business_name, description, contact_email, contact_phone, verified, created_at, updated_at

**`CreateProviderDto`**:
- `business_name: string` — requerido
- `description?: string`
- `contact_email?: string` — validar formato email si presente
- `contact_phone?: string`

**`UpdateProviderDto`**:
- Todos opcionales: `business_name?`, `description?`, `contact_email?`, `contact_phone?`

### 3.3 `ProviderController` — prefix `/provider`

| método | path | guard | roles | descripción |
|---|---|---|---|---|
| POST | /provider | SupabaseAuthGuard | USER (SUPER bypass) | crea perfil de provider |
| GET | /provider/me | SupabaseAuthGuard + RolesGuard | PROVIDER (SUPER bypass) | mi perfil de provider |
| PATCH | /provider/me | SupabaseAuthGuard + RolesGuard | PROVIDER (SUPER bypass) | edita mi perfil |
| GET | /provider/:providerId | sin guard | PUBLIC | perfil público por id |

**Reglas de negocio:**
- `POST /provider`: si ya existe un registro con `app_user_id = userId`, lanzar `ConflictException` (409). El perfil se crea con `verified=false`. El rol del usuario **no cambia** — el SUPER_USER lo aprueba manualmente vía `PATCH /admin/users/:id/role`.
- `GET /provider/me`: busca por `app_user_id = userId`. Si no existe, `NotFoundException`.
- `PATCH /provider/me`: busca por `app_user_id = userId`, actualiza solo los campos presentes.
- `GET /provider/:providerId`: busca por `id`. Si no existe, `NotFoundException`. No requiere auth.

### 3.4 `ProviderService`

- `create(userId: string, dto: CreateProviderDto): Promise<ProviderDto>`
- `findMyProfile(userId: string): Promise<ProviderDto>`
- `updateMyProfile(userId: string, dto: UpdateProviderDto): Promise<ProviderDto>`
- `findPublicById(providerId: string): Promise<ProviderDto>`

---

## Flujo completo — provider

1. Un usuario se registra → `POST /auth/sign-up` → rol `USER`
2. Llama `POST /provider` → se crea registro con `verified=false`, rol sigue `USER`
3. El SUPER_USER revisa → `PATCH /admin/users/:id/role` con `{ role: "PROVIDER" }`
4. El usuario ahora tiene rol `PROVIDER` y puede usar sus endpoints

**Testing como SUPER_USER único:**
El SUPER_USER puede llamar `POST /provider` para crear su propio perfil y luego acceder a `GET /provider/me` y `PATCH /provider/me` directamente (bypass de roles). No necesita cambiar su propio rol.

---

## Estructura de archivos resultante

```
src/
  auth/
    guards/
      roles.guard.ts          ← modificado (bypass SUPER_USER)
  app_user/
    dto/
      app_user.dto.ts         ← modificado (nuevos campos)
      update-me.dto.ts        ← nuevo
      update-role.dto.ts      ← modificado (sin appUserId en body)
      block-user.dto.ts       ← nuevo
    app_user.controller.ts    ← modificado (agrega PATCH /me)
    app_user-admin.controller.ts ← nuevo
    app_user.service.ts       ← modificado (updateMe, setBlockedStatus)
    app_user.module.ts        ← modificado (registra AppUserAdminController)
  provider/
    dto/
      provider.dto.ts         ← nuevo
      create-provider.dto.ts  ← nuevo
      update-provider.dto.ts  ← nuevo
    provider.controller.ts    ← nuevo
    provider.service.ts       ← nuevo
    provider.module.ts        ← nuevo
  app.module.ts               ← modificado (importa ProviderModule)
```
