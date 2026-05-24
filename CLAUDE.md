# ANDO — CLAUDE.md

## Stack
NestJS + TypeScript · Supabase (PostgreSQL) · JWT Supabase Auth · TypeORM

## Roles
`global_role` en `app_user`: `SUPER_USER` | `USER`
JWT de Supabase trae `sub` = `app_user.id`

---

### app_user
GET   /app_user/me              USER | SUPER  — mi perfil
PATCH /app_user/me              USER | SUPER  — editar mis datos
GET   /admin/user               SUPER         — listar usuarios
PATCH /admin/user/:id/role      SUPER         — cambiar rol
PATCH /admin/user/:id/block     SUPER         — bloquear usuario

### business
POST  /business                 USER | SUPER  — crear perfil de negocio (app_user_id UNIQUE)
GET   /business/me              USER | SUPER  — mi perfil de negocio
PATCH /business/me              USER | SUPER  — editar mi perfil
GET   /business/:businessId     PUBLIC        — perfil público

## Reglas de negocio críticas

### Booking — transacción con lock obligatorio
El chequeo de cupos y el insert van siempre en una sola transacción con `pessimistic_write`.
Al cancelar, decrementar `booked_spots` en la misma transacción.

### Business ownership
Antes de PATCH/DELETE en activity, schedule-rule o session: verificar explícitamente
que `activity.business_id` pertenece al negocio del usuario autenticado. No asumir que el JWT alcanza.

### Sessions
Se generan automáticamente desde `schedule_rules`.
El script debe ser idempotente — el UNIQUE `(activity_id, schedule_rule_id, start_datetime)` lo garantiza en DB.

### Review
Requiere `booking.status = CONFIRMED` del mismo usuario.
`booking_id` es UNIQUE en DB → una sola reseña por reserva.

### Soft delete
Nunca borrar físicamente. `activity` e `activity_schedule_rule` usan `is_active = false`.

---

## Convenciones

- DB: `snake_case` · Entities/responses: `camelCase`
- IDs: UUID en todas las tablas
- Todas las tablas tienen `created_at` y `updated_at`
- Filtros de `GET /activity`: `category`, `province`, `difficulty`, `min_price`, `max_price`, `min_age`
- Precios y cupos nunca negativos — validar en DTO (`@Min(0)`) y hay CHECK en DB
- `days_of_week` es `int[]` (0=dom … 6=sab)