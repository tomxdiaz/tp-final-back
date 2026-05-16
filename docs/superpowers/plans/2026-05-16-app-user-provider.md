# app_user + Provider Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Completar el módulo app_user (editar perfil, rutas admin) y construir el módulo provider desde cero.

**Architecture:** Dos módulos NestJS que comparten SupabaseModule. app_user gana un segundo controller (AppUserAdminController) para rutas admin-only bajo `/admin/users`. Provider es un módulo nuevo autocontenido. Todo el acceso a datos usa el cliente Supabase JS directamente (sin TypeORM). SUPER_USER bypassa todos los role checks.

**Tech Stack:** NestJS 11, TypeScript, Supabase JS v2, class-validator, class-transformer, @nestjs/swagger, Jest.

---

## Archivos

### Modificados
- `src/supabase/database.types.ts` — regenerado vía CLI
- `src/auth/guards/roles.guard.ts` — bypass SUPER_USER
- `src/auth/guards/roles.guard.spec.ts` — test del bypass
- `src/app_user/dto/app_user.dto.ts` — agregar first_name, last_name, phone, created_at, updated_at
- `src/app_user/dto/update-role.dto.ts` — eliminar appUserId (pasa a URL param)
- `src/app_user/app_user.service.ts` — agregar updateMe, setBlockedStatus; refactorizar updateGlobalRole
- `src/app_user/app_user.service.spec.ts` — tests para métodos nuevos
- `src/app_user/app_user.controller.ts` — agregar PATCH /me; eliminar rutas admin viejas
- `src/app_user/app_user.controller.spec.ts` — test para PATCH /me
- `src/app_user/app_user.module.ts` — registrar AppUserAdminController
- `src/app.module.ts` — importar ProviderModule

### Creados
- `src/app_user/dto/update-me.dto.ts`
- `src/app_user/dto/block-user.dto.ts`
- `src/app_user/app_user-admin.controller.ts`
- `src/app_user/app_user-admin.controller.spec.ts`
- `src/provider/dto/provider.dto.ts`
- `src/provider/dto/create-provider.dto.ts`
- `src/provider/dto/update-provider.dto.ts`
- `src/provider/provider.service.ts`
- `src/provider/provider.service.spec.ts`
- `src/provider/provider.controller.ts`
- `src/provider/provider.controller.spec.ts`
- `src/provider/provider.module.ts`

---

## Task 1: Regenerar tipos de Supabase

**Files:**
- Modify: `src/supabase/database.types.ts`

- [ ] **Step 1: Correr el script de regeneración**

```bash
npm run supabase:regeneratetypes
```

- [ ] **Step 2: Verificar que los tipos nuevos están presentes**

Abrir `src/supabase/database.types.ts` y confirmar que `app_user.Row` incluye los campos nuevos y que existe la tabla `provider`:

```typescript
// Debe existir en app_user.Row:
first_name: string | null
last_name: string | null
phone: string | null
created_at: string
updated_at: string

// Debe existir provider.Row:
id: string
app_user_id: string
business_name: string
description: string | null
contact_email: string | null
contact_phone: string | null
verified: boolean
created_at: string
updated_at: string
```

- [ ] **Step 3: Commit**

```bash
git add src/supabase/database.types.ts
git commit -m "chore: regenerate supabase types with new columns and tables"
```

---

## Task 2: RolesGuard — bypass para SUPER_USER

**Files:**
- Modify: `src/auth/guards/roles.guard.ts`
- Modify: `src/auth/guards/roles.guard.spec.ts`

- [ ] **Step 1: Escribir el test que falla**

Reemplazar el contenido completo de `src/auth/guards/roles.guard.spec.ts`:

```typescript
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

const makeContext = (role: string) =>
  ({
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ appUser: { global_role: role } }),
    }),
  }) as unknown as ExecutionContext;

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() } as unknown as jest.Mocked<Reflector>;
    guard = new RolesGuard(reflector);
  });

  it('allows when no roles required', () => {
    reflector.getAllAndOverride.mockReturnValue([]);
    expect(guard.canActivate(makeContext('USER'))).toBe(true);
  });

  it('allows when user has the required role', () => {
    reflector.getAllAndOverride.mockReturnValue(['PROVIDER']);
    expect(guard.canActivate(makeContext('PROVIDER'))).toBe(true);
  });

  it('denies when user does not have the required role', () => {
    reflector.getAllAndOverride.mockReturnValue(['PROVIDER']);
    expect(() => guard.canActivate(makeContext('USER'))).toThrow(ForbiddenException);
  });

  it('allows SUPER_USER regardless of required roles', () => {
    reflector.getAllAndOverride.mockReturnValue(['PROVIDER']);
    expect(guard.canActivate(makeContext('SUPER_USER'))).toBe(true);
  });

  it('throws when appUser is missing', () => {
    reflector.getAllAndOverride.mockReturnValue(['PROVIDER']);
    const ctx = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({ getRequest: () => ({}) }),
    } as unknown as ExecutionContext;
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });
});
```

- [ ] **Step 2: Correr el test para verificar que falla**

```bash
npx jest roles.guard.spec --no-coverage
```

Expected: FAIL — `allows SUPER_USER regardless of required roles`

- [ ] **Step 3: Agregar el bypass en el guard**

En `src/auth/guards/roles.guard.ts`, agregar una línea antes del `includes` check:

```typescript
// Archivo completo resultante:
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { Tables } from '../../supabase/database.types';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { AppRole } from '../../utils/enums/roles';

type AppUser = Tables<'app_user'>;
type AuthenticatedRequest = Request & { appUser?: AppUser };

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<AppRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const currentRole = request.appUser?.global_role;

    if (!currentRole) {
      throw new ForbiddenException('Falta el usuario autenticado');
    }

    if (currentRole === 'SUPER_USER') return true;

    if (!requiredRoles.includes(currentRole)) {
      throw new ForbiddenException('No tenés permisos para acceder a este recurso');
    }

    return true;
  }
}
```

- [ ] **Step 4: Correr los tests para verificar que pasan**

```bash
npx jest roles.guard.spec --no-coverage
```

Expected: PASS — 5 tests passing

- [ ] **Step 5: Commit**

```bash
git add src/auth/guards/roles.guard.ts src/auth/guards/roles.guard.spec.ts
git commit -m "feat: SUPER_USER bypasses role guard on all endpoints"
```

---

## Task 3: Expandir AppUserDto y toAppUserDto

**Files:**
- Modify: `src/app_user/dto/app_user.dto.ts`
- Modify: `src/app_user/app_user.service.ts` (solo `toAppUserDto`)

- [ ] **Step 1: Actualizar AppUserDto**

Reemplazar el contenido de `src/app_user/dto/app_user.dto.ts`:

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { AppRole } from '../../utils/enums/roles';

export class AppUserDto {
  @ApiProperty({ example: '1a1a1a1a-1a1a-1a1a-1a1a-1a1a1a1a1a1a', format: 'uuid' })
  @IsUUID()
  id!: string;

  @ApiProperty({ example: 'owner@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ enum: AppRole, example: 'USER' })
  @IsEnum(AppRole)
  global_role!: AppRole;

  @ApiPropertyOptional({ example: 'Juan' })
  @IsOptional()
  @IsString()
  first_name!: string | null;

  @ApiPropertyOptional({ example: 'Pérez' })
  @IsOptional()
  @IsString()
  last_name!: string | null;

  @ApiPropertyOptional({ example: '+54911234567' })
  @IsOptional()
  @IsString()
  phone!: string | null;

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  created_at!: string;

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  updated_at!: string;
}
```

- [ ] **Step 2: Actualizar toAppUserDto en el service**

En `src/app_user/app_user.service.ts`, reemplazar el método `toAppUserDto`:

```typescript
toAppUserDto(appUser: AppUser): AppUserDto {
  return {
    id: appUser.id,
    email: appUser.email,
    global_role: appUser.global_role,
    first_name: appUser.first_name ?? null,
    last_name: appUser.last_name ?? null,
    phone: appUser.phone ?? null,
    created_at: appUser.created_at,
    updated_at: appUser.updated_at,
  };
}
```

- [ ] **Step 3: Correr tests existentes para verificar que no rompimos nada**

```bash
npx jest app_user --no-coverage
```

Expected: PASS (los tests existentes solo verifican `toBeDefined`)

- [ ] **Step 4: Commit**

```bash
git add src/app_user/dto/app_user.dto.ts src/app_user/app_user.service.ts
git commit -m "feat: expand AppUserDto with profile fields"
```

---

## Task 4: PATCH /app_user/me — editar perfil propio

**Files:**
- Create: `src/app_user/dto/update-me.dto.ts`
- Modify: `src/app_user/app_user.service.ts`
- Modify: `src/app_user/app_user.service.spec.ts`
- Modify: `src/app_user/app_user.controller.ts`
- Modify: `src/app_user/app_user.controller.spec.ts`

- [ ] **Step 1: Crear UpdateMeDto**

Crear `src/app_user/dto/update-me.dto.ts`:

```typescript
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateMeDto {
  @ApiPropertyOptional({ example: 'Juan' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  first_name?: string;

  @ApiPropertyOptional({ example: 'Pérez' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  last_name?: string;

  @ApiPropertyOptional({ example: '+54911234567' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;
}
```

- [ ] **Step 2: Escribir el test que falla para updateMe**

Reemplazar el contenido de `src/app_user/app_user.service.spec.ts`:

```typescript
import { InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { AppUserService } from './app_user.service';
import { UpdateMeDto } from './dto/update-me.dto';

const mockUser = {
  id: 'user-uuid',
  email: 'test@example.com',
  global_role: 'USER' as const,
  first_name: 'Juan',
  last_name: 'Pérez',
  phone: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const makeChain = (result: { data: unknown; error: unknown }) => ({
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  maybeSingle: jest.fn().mockResolvedValue(result),
});

describe('AppUserService', () => {
  let service: AppUserService;
  let mockChain: ReturnType<typeof makeChain>;
  let mockAdminClient: { from: jest.Mock; auth: { admin: { updateUserById: jest.Mock } } };
  let mockClient: { from: jest.Mock };

  beforeEach(() => {
    mockChain = makeChain({ data: mockUser, error: null });
    mockAdminClient = {
      from: jest.fn().mockReturnValue(mockChain),
      auth: { admin: { updateUserById: jest.fn().mockResolvedValue({ error: null }) } },
    };
    mockClient = { from: jest.fn().mockReturnValue(mockChain) };

    const mockSupabaseService = {
      getAdminClient: jest.fn().mockReturnValue(mockAdminClient),
      getClient: jest.fn().mockReturnValue(mockClient),
    };

    service = new AppUserService(mockSupabaseService as never);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('updateMe', () => {
    it('updates user profile fields and returns AppUserDto', async () => {
      const dto: UpdateMeDto = { first_name: 'Carlos' };
      const updated = { ...mockUser, first_name: 'Carlos' };
      mockChain.maybeSingle.mockResolvedValue({ data: updated, error: null });

      const result = await service.updateMe('user-uuid', dto);

      expect(mockAdminClient.from).toHaveBeenCalledWith('app_user');
      expect(result.first_name).toBe('Carlos');
      expect(result.id).toBe('user-uuid');
    });

    it('throws NotFoundException when user does not exist', async () => {
      mockChain.maybeSingle.mockResolvedValue({ data: null, error: null });
      await expect(service.updateMe('bad-uuid', {})).rejects.toThrow(NotFoundException);
    });

    it('throws InternalServerErrorException on supabase error', async () => {
      mockChain.maybeSingle.mockResolvedValue({ data: null, error: { message: 'db error' } });
      await expect(service.updateMe('user-uuid', {})).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('setBlockedStatus', () => {
    it('bans the user when blocked=true and returns the profile', async () => {
      const result = await service.setBlockedStatus('user-uuid', true);

      expect(mockAdminClient.auth.admin.updateUserById).toHaveBeenCalledWith(
        'user-uuid',
        { ban_duration: '876000h' },
      );
      expect(result.id).toBe('user-uuid');
    });

    it('unbans the user when blocked=false', async () => {
      await service.setBlockedStatus('user-uuid', false);

      expect(mockAdminClient.auth.admin.updateUserById).toHaveBeenCalledWith(
        'user-uuid',
        { ban_duration: 'none' },
      );
    });

    it('throws InternalServerErrorException on auth error', async () => {
      mockAdminClient.auth.admin.updateUserById.mockResolvedValue({ error: { message: 'auth error' } });
      await expect(service.setBlockedStatus('user-uuid', true)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
```

- [ ] **Step 3: Correr los tests para verificar que fallan**

```bash
npx jest app_user.service.spec --no-coverage
```

Expected: FAIL — `updateMe` y `setBlockedStatus` no existen

- [ ] **Step 4: Agregar updateMe y setBlockedStatus al service**

En `src/app_user/app_user.service.ts`, agregar los imports y métodos nuevos (mantener los existentes):

```typescript
// Agregar este import junto a los existentes:
import { UpdateMeDto } from './dto/update-me.dto';

// Agregar estos métodos en la clase AppUserService:

async updateMe(userId: string, dto: UpdateMeDto): Promise<AppUserDto> {
  const supabase = this.supabaseService.getAdminClient();

  const updates: Record<string, string> = {};
  if (dto.first_name !== undefined) updates['first_name'] = dto.first_name;
  if (dto.last_name !== undefined) updates['last_name'] = dto.last_name;
  if (dto.phone !== undefined) updates['phone'] = dto.phone;

  const { data, error } = await supabase
    .from('app_user')
    .update(updates)
    .eq('id', userId)
    .select('*')
    .maybeSingle();

  if (error) {
    this.logger.error(`Error updating app_user: ${error.message}`);
    throw new InternalServerErrorException('Error inesperado al actualizar el perfil');
  }

  if (!data) throw new NotFoundException('Usuario no encontrado');

  return this.toAppUserDto(data);
}

async setBlockedStatus(userId: string, blocked: boolean): Promise<AppUserDto> {
  const supabase = this.supabaseService.getAdminClient();

  const { error } = await supabase.auth.admin.updateUserById(userId, {
    ban_duration: blocked ? '876000h' : 'none',
  });

  if (error) {
    this.logger.error(`Error blocking user: ${error.message}`);
    throw new InternalServerErrorException('Error inesperado al actualizar el estado del usuario');
  }

  return this.findById(userId);
}
```

- [ ] **Step 5: Correr los tests para verificar que pasan**

```bash
npx jest app_user.service.spec --no-coverage
```

Expected: PASS — todos los tests

- [ ] **Step 6: Escribir el test que falla para PATCH /app_user/me**

Reemplazar el contenido de `src/app_user/app_user.controller.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { AppUserController } from './app_user.controller';
import { AppUserService } from './app_user.service';
import { AppUserDto } from './dto/app_user.dto';
import { UpdateMeDto } from './dto/update-me.dto';

const mockAppUserDto: AppUserDto = {
  id: 'user-uuid',
  email: 'test@example.com',
  global_role: 'USER',
  first_name: 'Juan',
  last_name: null,
  phone: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('AppUserController', () => {
  let controller: AppUserController;
  let service: jest.Mocked<AppUserService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppUserController],
      providers: [
        {
          provide: AppUserService,
          useValue: {
            findById: jest.fn().mockResolvedValue(mockAppUserDto),
            updateMe: jest.fn().mockResolvedValue(mockAppUserDto),
          },
        },
      ],
    }).compile();

    controller = module.get<AppUserController>(AppUserController);
    service = module.get(AppUserService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findMe', () => {
    it('returns the current user profile', async () => {
      const result = await controller.findMe(mockAppUserDto as never);
      expect(service.findById).toHaveBeenCalledWith('user-uuid');
      expect(result).toEqual(mockAppUserDto);
    });
  });

  describe('updateMe', () => {
    it('updates and returns the current user profile', async () => {
      const dto: UpdateMeDto = { first_name: 'Carlos' };
      const result = await controller.updateMe(mockAppUserDto as never, dto);
      expect(service.updateMe).toHaveBeenCalledWith('user-uuid', dto);
      expect(result).toEqual(mockAppUserDto);
    });
  });
});
```

- [ ] **Step 7: Correr el test para verificar que falla**

```bash
npx jest app_user.controller.spec --no-coverage
```

Expected: FAIL — `updateMe` no existe en el controller

- [ ] **Step 8: Agregar PATCH /me y eliminar rutas admin viejas del controller**

Reemplazar el contenido completo de `src/app_user/app_user.controller.ts`:

```typescript
import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { AppUserService } from './app_user.service';
import { AppUserDto } from './dto/app_user.dto';
import { UpdateMeDto } from './dto/update-me.dto';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { CurrentAppUser } from '../auth/decorators/current-app-user.decorator';
import type { Tables } from '../supabase/database.types';

type AppUser = Tables<'app_user'>;

@ApiTags('app_user')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('app_user')
export class AppUserController {
  constructor(private readonly appUserService: AppUserService) {}

  @Get('me')
  @ApiOperation({ summary: 'Obtener mi perfil' })
  @ApiOkResponse({ type: AppUserDto })
  @ApiUnauthorizedResponse({ description: 'Token inválido o no enviado' })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado' })
  @ApiInternalServerErrorResponse({ description: 'Error interno' })
  async findMe(@CurrentAppUser appUser: AppUser): Promise<AppUserDto> {
    return this.appUserService.findById(appUser.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Editar mi perfil (first_name, last_name, phone)' })
  @ApiOkResponse({ type: AppUserDto })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  @ApiUnauthorizedResponse({ description: 'Token inválido o no enviado' })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado' })
  @ApiInternalServerErrorResponse({ description: 'Error interno' })
  async updateMe(
    @CurrentAppUser appUser: AppUser,
    @Body() dto: UpdateMeDto,
  ): Promise<AppUserDto> {
    return this.appUserService.updateMe(appUser.id, dto);
  }
}
```

- [ ] **Step 9: Correr los tests para verificar que pasan**

```bash
npx jest app_user.controller.spec --no-coverage
```

Expected: PASS

- [ ] **Step 10: Commit**

```bash
git add src/app_user/dto/update-me.dto.ts src/app_user/app_user.service.ts src/app_user/app_user.service.spec.ts src/app_user/app_user.controller.ts src/app_user/app_user.controller.spec.ts
git commit -m "feat: add PATCH /app_user/me to edit own profile"
```

---

## Task 5: AppUserAdminController — rutas /admin/users

**Files:**
- Modify: `src/app_user/dto/update-role.dto.ts`
- Modify: `src/app_user/app_user.service.ts` (refactorizar updateGlobalRole)
- Create: `src/app_user/dto/block-user.dto.ts`
- Create: `src/app_user/app_user-admin.controller.ts`
- Create: `src/app_user/app_user-admin.controller.spec.ts`
- Modify: `src/app_user/app_user.module.ts`

- [ ] **Step 1: Actualizar UpdateGlobalRoleDto (eliminar appUserId)**

Reemplazar el contenido de `src/app_user/dto/update-role.dto.ts`:

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { AppRole } from '../../utils/enums/roles';

export class UpdateGlobalRoleDto {
  @ApiProperty({ enum: Object.values(AppRole), example: 'PROVIDER' })
  @IsEnum(AppRole, {
    message: `role must be one of: ${Object.values(AppRole).join(', ')}`,
  })
  role!: AppRole;
}
```

- [ ] **Step 2: Crear BlockUserDto**

Crear `src/app_user/dto/block-user.dto.ts`:

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class BlockUserDto {
  @ApiProperty({ example: true, description: 'true para bloquear, false para desbloquear' })
  @IsBoolean()
  blocked!: boolean;
}
```

- [ ] **Step 3: Refactorizar updateGlobalRole en el service**

En `src/app_user/app_user.service.ts`, reemplazar el método `updateGlobalRole` por esta versión con firma simplificada:

```typescript
async updateGlobalRole(userId: string, role: AppRole): Promise<AppUserDto> {
  const supabase = this.supabaseService.getAdminClient();

  const { data, error } = await supabase
    .from('app_user')
    .update({ global_role: role })
    .eq('id', userId)
    .select('*')
    .maybeSingle();

  if (error) {
    this.logger.error(`Error updating global role: ${error.message}`);
    if (this.isInvalidInputError(error)) {
      throw new BadRequestException('Datos inválidos para actualizar el rol');
    }
    throw new InternalServerErrorException('Error inesperado al actualizar el rol global');
  }

  if (!data) throw new NotFoundException('Usuario a actualizar no encontrado');

  return this.toAppUserDto(data);
}
```

Agregar también el import de `AppRole` al service (si no está ya):

```typescript
import { AppRole } from '../utils/enums/roles';
```

- [ ] **Step 4: Escribir el test que falla para AppUserAdminController**

Crear `src/app_user/app_user-admin.controller.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { AppUserAdminController } from './app_user-admin.controller';
import { AppUserService } from './app_user.service';
import { AppUserDto } from './dto/app_user.dto';
import { UpdateGlobalRoleDto } from './dto/update-role.dto';
import { BlockUserDto } from './dto/block-user.dto';

const mockAppUserDto: AppUserDto = {
  id: 'user-uuid',
  email: 'test@example.com',
  global_role: 'USER',
  first_name: null,
  last_name: null,
  phone: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('AppUserAdminController', () => {
  let controller: AppUserAdminController;
  let service: jest.Mocked<AppUserService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppUserAdminController],
      providers: [
        {
          provide: AppUserService,
          useValue: {
            findAll: jest.fn().mockResolvedValue([mockAppUserDto]),
            updateGlobalRole: jest.fn().mockResolvedValue(mockAppUserDto),
            setBlockedStatus: jest.fn().mockResolvedValue(mockAppUserDto),
          },
        },
      ],
    }).compile();

    controller = module.get<AppUserAdminController>(AppUserAdminController);
    service = module.get(AppUserService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('returns all users', async () => {
      const result = await controller.findAll();
      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual([mockAppUserDto]);
    });
  });

  describe('updateRole', () => {
    it('updates the role of a user by id', async () => {
      const dto: UpdateGlobalRoleDto = { role: 'PROVIDER' };
      const result = await controller.updateRole('user-uuid', dto);
      expect(service.updateGlobalRole).toHaveBeenCalledWith('user-uuid', 'PROVIDER');
      expect(result).toEqual(mockAppUserDto);
    });
  });

  describe('blockUser', () => {
    it('blocks a user by id', async () => {
      const dto: BlockUserDto = { blocked: true };
      const result = await controller.blockUser('user-uuid', dto);
      expect(service.setBlockedStatus).toHaveBeenCalledWith('user-uuid', true);
      expect(result).toEqual(mockAppUserDto);
    });

    it('unblocks a user by id', async () => {
      const dto: BlockUserDto = { blocked: false };
      await controller.blockUser('user-uuid', dto);
      expect(service.setBlockedStatus).toHaveBeenCalledWith('user-uuid', false);
    });
  });
});
```

- [ ] **Step 5: Correr el test para verificar que falla**

```bash
npx jest app_user-admin.controller.spec --no-coverage
```

Expected: FAIL — `AppUserAdminController` no existe

- [ ] **Step 6: Crear AppUserAdminController**

Crear `src/app_user/app_user-admin.controller.ts`:

```typescript
import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AppUserService } from './app_user.service';
import { AppUserDto } from './dto/app_user.dto';
import { UpdateGlobalRoleDto } from './dto/update-role.dto';
import { BlockUserDto } from './dto/block-user.dto';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AppRole } from '../utils/enums/roles';

@ApiTags('admin/users')
@ApiBearerAuth()
@Roles(AppRole.SUPER_USER)
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Controller('admin/users')
export class AppUserAdminController {
  constructor(private readonly appUserService: AppUserService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos los usuarios (SUPER_USER)' })
  @ApiOkResponse({ type: AppUserDto, isArray: true })
  @ApiUnauthorizedResponse({ description: 'Token inválido o no enviado' })
  @ApiForbiddenResponse({ description: 'Sin permisos' })
  @ApiInternalServerErrorResponse({ description: 'Error interno' })
  async findAll(): Promise<AppUserDto[]> {
    return this.appUserService.findAll();
  }

  @Patch(':id/role')
  @ApiOperation({ summary: 'Cambiar el rol de un usuario (SUPER_USER)' })
  @ApiOkResponse({ type: AppUserDto })
  @ApiUnauthorizedResponse({ description: 'Token inválido o no enviado' })
  @ApiForbiddenResponse({ description: 'Sin permisos' })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado' })
  @ApiInternalServerErrorResponse({ description: 'Error interno' })
  async updateRole(
    @Param('id') id: string,
    @Body() dto: UpdateGlobalRoleDto,
  ): Promise<AppUserDto> {
    return this.appUserService.updateGlobalRole(id, dto.role);
  }

  @Patch(':id/block')
  @ApiOperation({ summary: 'Bloquear o desbloquear un usuario (SUPER_USER)' })
  @ApiOkResponse({ type: AppUserDto })
  @ApiUnauthorizedResponse({ description: 'Token inválido o no enviado' })
  @ApiForbiddenResponse({ description: 'Sin permisos' })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado' })
  @ApiInternalServerErrorResponse({ description: 'Error interno' })
  async blockUser(
    @Param('id') id: string,
    @Body() dto: BlockUserDto,
  ): Promise<AppUserDto> {
    return this.appUserService.setBlockedStatus(id, dto.blocked);
  }
}
```

- [ ] **Step 7: Registrar AppUserAdminController en AppUserModule**

Reemplazar el contenido de `src/app_user/app_user.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { AppUserService } from './app_user.service';
import { AppUserController } from './app_user.controller';
import { AppUserAdminController } from './app_user-admin.controller';
import { SupabaseModule } from '../supabase/supabase.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [SupabaseModule, AuthModule],
  controllers: [AppUserController, AppUserAdminController],
  providers: [AppUserService],
  exports: [AppUserService],
})
export class AppUserModule {}
```

- [ ] **Step 8: Correr los tests para verificar que pasan**

```bash
npx jest app_user --no-coverage
```

Expected: PASS — todos los tests de app_user

- [ ] **Step 9: Commit**

```bash
git add src/app_user/dto/update-role.dto.ts src/app_user/dto/block-user.dto.ts src/app_user/app_user.service.ts src/app_user/app_user-admin.controller.ts src/app_user/app_user-admin.controller.spec.ts src/app_user/app_user.module.ts
git commit -m "feat: add admin routes GET /admin/users, PATCH /admin/users/:id/role and /block"
```

---

## Task 6: Módulo Provider

**Files:**
- Create: `src/provider/dto/provider.dto.ts`
- Create: `src/provider/dto/create-provider.dto.ts`
- Create: `src/provider/dto/update-provider.dto.ts`
- Create: `src/provider/provider.service.ts`
- Create: `src/provider/provider.service.spec.ts`
- Create: `src/provider/provider.controller.ts`
- Create: `src/provider/provider.controller.spec.ts`
- Create: `src/provider/provider.module.ts`
- Modify: `src/app.module.ts`

- [ ] **Step 1: Crear ProviderDto**

Crear `src/provider/dto/provider.dto.ts`:

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsOptional, IsString, IsUUID } from 'class-validator';

export class ProviderDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  id!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  app_user_id!: string;

  @ApiProperty({ example: 'Aventuras del Sur' })
  @IsString()
  business_name!: string;

  @ApiPropertyOptional({ example: 'Ofrecemos excursiones en la Patagonia' })
  @IsOptional()
  @IsString()
  description!: string | null;

  @ApiPropertyOptional({ example: 'contacto@aventurasur.com' })
  @IsOptional()
  @IsEmail()
  contact_email!: string | null;

  @ApiPropertyOptional({ example: '+54911234567' })
  @IsOptional()
  @IsString()
  contact_phone!: string | null;

  @ApiProperty({ example: false })
  @IsBoolean()
  verified!: boolean;

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  created_at!: string;

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  updated_at!: string;
}
```

- [ ] **Step 2: Crear CreateProviderDto**

Crear `src/provider/dto/create-provider.dto.ts`:

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateProviderDto {
  @ApiProperty({ example: 'Aventuras del Sur' })
  @IsString()
  @MaxLength(200)
  business_name!: string;

  @ApiPropertyOptional({ example: 'Ofrecemos excursiones en la Patagonia' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'contacto@aventurasur.com' })
  @IsOptional()
  @IsEmail()
  contact_email?: string;

  @ApiPropertyOptional({ example: '+54911234567' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  contact_phone?: string;
}
```

- [ ] **Step 3: Crear UpdateProviderDto**

Crear `src/provider/dto/update-provider.dto.ts`:

```typescript
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateProviderDto {
  @ApiPropertyOptional({ example: 'Aventuras del Sur' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  business_name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  contact_email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(30)
  contact_phone?: string;
}
```

- [ ] **Step 4: Escribir los tests que fallan para ProviderService**

Crear `src/provider/provider.service.spec.ts`:

```typescript
import { ConflictException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ProviderService } from './provider.service';
import { CreateProviderDto } from './dto/create-provider.dto';
import { UpdateProviderDto } from './dto/update-provider.dto';

const mockProvider = {
  id: 'provider-uuid',
  app_user_id: 'user-uuid',
  business_name: 'Aventuras del Sur',
  description: null,
  contact_email: null,
  contact_phone: null,
  verified: false,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const makeChain = (result: { data: unknown; error: unknown }) => ({
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue(result),
  maybeSingle: jest.fn().mockResolvedValue(result),
});

describe('ProviderService', () => {
  let service: ProviderService;
  let mockChain: ReturnType<typeof makeChain>;
  let mockAdminClient: { from: jest.Mock };

  beforeEach(() => {
    mockChain = makeChain({ data: mockProvider, error: null });
    mockAdminClient = { from: jest.fn().mockReturnValue(mockChain) };

    const mockSupabaseService = {
      getAdminClient: jest.fn().mockReturnValue(mockAdminClient),
    };

    service = new ProviderService(mockSupabaseService as never);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const dto: CreateProviderDto = { business_name: 'Aventuras del Sur' };

    it('creates a provider and returns ProviderDto', async () => {
      const result = await service.create('user-uuid', dto);
      expect(mockAdminClient.from).toHaveBeenCalledWith('provider');
      expect(result.business_name).toBe('Aventuras del Sur');
      expect(result.verified).toBe(false);
    });

    it('throws ConflictException when provider already exists (unique constraint)', async () => {
      mockChain.single.mockResolvedValue({ data: null, error: { code: '23505', message: 'unique violation' } });
      await expect(service.create('user-uuid', dto)).rejects.toThrow(ConflictException);
    });

    it('throws InternalServerErrorException on other db error', async () => {
      mockChain.single.mockResolvedValue({ data: null, error: { code: 'XXXXX', message: 'db error' } });
      await expect(service.create('user-uuid', dto)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('findMyProfile', () => {
    it('returns the provider profile for the given userId', async () => {
      const result = await service.findMyProfile('user-uuid');
      expect(result.app_user_id).toBe('user-uuid');
    });

    it('throws NotFoundException when profile does not exist', async () => {
      mockChain.maybeSingle.mockResolvedValue({ data: null, error: null });
      await expect(service.findMyProfile('user-uuid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateMyProfile', () => {
    it('updates and returns the provider profile', async () => {
      const dto: UpdateProviderDto = { business_name: 'Nuevo Nombre' };
      const updated = { ...mockProvider, business_name: 'Nuevo Nombre' };
      mockChain.maybeSingle.mockResolvedValue({ data: updated, error: null });

      const result = await service.updateMyProfile('user-uuid', dto);
      expect(result.business_name).toBe('Nuevo Nombre');
    });

    it('throws NotFoundException when profile does not exist', async () => {
      mockChain.maybeSingle.mockResolvedValue({ data: null, error: null });
      await expect(service.updateMyProfile('user-uuid', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('findPublicById', () => {
    it('returns provider by id', async () => {
      const result = await service.findPublicById('provider-uuid');
      expect(result.id).toBe('provider-uuid');
    });

    it('throws NotFoundException when provider does not exist', async () => {
      mockChain.maybeSingle.mockResolvedValue({ data: null, error: null });
      await expect(service.findPublicById('bad-uuid')).rejects.toThrow(NotFoundException);
    });
  });
});
```

- [ ] **Step 5: Correr los tests para verificar que fallan**

```bash
npx jest provider.service.spec --no-coverage
```

Expected: FAIL — `ProviderService` no existe

- [ ] **Step 6: Crear ProviderService**

Crear `src/provider/provider.service.ts`:

```typescript
import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { ProviderDto } from './dto/provider.dto';
import { CreateProviderDto } from './dto/create-provider.dto';
import { UpdateProviderDto } from './dto/update-provider.dto';
import type { Tables } from '../supabase/database.types';

type Provider = Tables<'provider'>;

@Injectable()
export class ProviderService {
  private readonly logger = new Logger(ProviderService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async create(userId: string, dto: CreateProviderDto): Promise<ProviderDto> {
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase
      .from('provider')
      .insert({
        app_user_id: userId,
        business_name: dto.business_name,
        description: dto.description ?? null,
        contact_email: dto.contact_email ?? null,
        contact_phone: dto.contact_phone ?? null,
      })
      .select('*')
      .single();

    if (error) {
      this.logger.error(`Error creating provider: ${error.message}`);
      if (error.code === '23505') {
        throw new ConflictException('Ya existe un perfil de provider para este usuario');
      }
      throw new InternalServerErrorException('Error inesperado al crear el perfil de provider');
    }

    return this.toProviderDto(data);
  }

  async findMyProfile(userId: string): Promise<ProviderDto> {
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase
      .from('provider')
      .select('*')
      .eq('app_user_id', userId)
      .maybeSingle();

    if (error) {
      this.logger.error(`Error finding provider: ${error.message}`);
      throw new InternalServerErrorException('Error inesperado al obtener el perfil de provider');
    }

    if (!data) throw new NotFoundException('Perfil de provider no encontrado');

    return this.toProviderDto(data);
  }

  async updateMyProfile(userId: string, dto: UpdateProviderDto): Promise<ProviderDto> {
    const supabase = this.supabaseService.getAdminClient();

    const updates: Partial<Provider> = {};
    if (dto.business_name !== undefined) updates.business_name = dto.business_name;
    if (dto.description !== undefined) updates.description = dto.description;
    if (dto.contact_email !== undefined) updates.contact_email = dto.contact_email;
    if (dto.contact_phone !== undefined) updates.contact_phone = dto.contact_phone;

    const { data, error } = await supabase
      .from('provider')
      .update(updates)
      .eq('app_user_id', userId)
      .select('*')
      .maybeSingle();

    if (error) {
      this.logger.error(`Error updating provider: ${error.message}`);
      throw new InternalServerErrorException('Error inesperado al actualizar el perfil de provider');
    }

    if (!data) throw new NotFoundException('Perfil de provider no encontrado');

    return this.toProviderDto(data);
  }

  async findPublicById(providerId: string): Promise<ProviderDto> {
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase
      .from('provider')
      .select('*')
      .eq('id', providerId)
      .maybeSingle();

    if (error) {
      this.logger.error(`Error finding provider by id: ${error.message}`);
      throw new InternalServerErrorException('Error inesperado al obtener el provider');
    }

    if (!data) throw new NotFoundException('Provider no encontrado');

    return this.toProviderDto(data);
  }

  private toProviderDto(provider: Provider): ProviderDto {
    return {
      id: provider.id,
      app_user_id: provider.app_user_id,
      business_name: provider.business_name,
      description: provider.description ?? null,
      contact_email: provider.contact_email ?? null,
      contact_phone: provider.contact_phone ?? null,
      verified: provider.verified,
      created_at: provider.created_at,
      updated_at: provider.updated_at,
    };
  }
}
```

- [ ] **Step 7: Correr los tests para verificar que pasan**

```bash
npx jest provider.service.spec --no-coverage
```

Expected: PASS — todos los tests

- [ ] **Step 8: Escribir los tests que fallan para ProviderController**

Crear `src/provider/provider.controller.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ProviderController } from './provider.controller';
import { ProviderService } from './provider.service';
import { ProviderDto } from './dto/provider.dto';
import { CreateProviderDto } from './dto/create-provider.dto';
import { UpdateProviderDto } from './dto/update-provider.dto';

const mockProviderDto: ProviderDto = {
  id: 'provider-uuid',
  app_user_id: 'user-uuid',
  business_name: 'Aventuras del Sur',
  description: null,
  contact_email: null,
  contact_phone: null,
  verified: false,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const mockAppUser = { id: 'user-uuid', email: 'test@example.com', global_role: 'USER' };

describe('ProviderController', () => {
  let controller: ProviderController;
  let service: jest.Mocked<ProviderService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProviderController],
      providers: [
        {
          provide: ProviderService,
          useValue: {
            create: jest.fn().mockResolvedValue(mockProviderDto),
            findMyProfile: jest.fn().mockResolvedValue(mockProviderDto),
            updateMyProfile: jest.fn().mockResolvedValue(mockProviderDto),
            findPublicById: jest.fn().mockResolvedValue(mockProviderDto),
          },
        },
      ],
    }).compile();

    controller = module.get<ProviderController>(ProviderController);
    service = module.get(ProviderService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('creates a provider profile for the current user', async () => {
      const dto: CreateProviderDto = { business_name: 'Aventuras del Sur' };
      const result = await controller.create(mockAppUser as never, dto);
      expect(service.create).toHaveBeenCalledWith('user-uuid', dto);
      expect(result).toEqual(mockProviderDto);
    });
  });

  describe('findMe', () => {
    it('returns the provider profile of the current user', async () => {
      const result = await controller.findMe(mockAppUser as never);
      expect(service.findMyProfile).toHaveBeenCalledWith('user-uuid');
      expect(result).toEqual(mockProviderDto);
    });
  });

  describe('updateMe', () => {
    it('updates the provider profile of the current user', async () => {
      const dto: UpdateProviderDto = { business_name: 'Nuevo Nombre' };
      const result = await controller.updateMe(mockAppUser as never, dto);
      expect(service.updateMyProfile).toHaveBeenCalledWith('user-uuid', dto);
      expect(result).toEqual(mockProviderDto);
    });
  });

  describe('findPublicById', () => {
    it('returns public provider profile by id', async () => {
      const result = await controller.findPublicById('provider-uuid');
      expect(service.findPublicById).toHaveBeenCalledWith('provider-uuid');
      expect(result).toEqual(mockProviderDto);
    });
  });
});
```

- [ ] **Step 9: Correr los tests para verificar que fallan**

```bash
npx jest provider.controller.spec --no-coverage
```

Expected: FAIL — `ProviderController` no existe

- [ ] **Step 10: Crear ProviderController**

Crear `src/provider/provider.controller.ts`:

```typescript
import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ProviderService } from './provider.service';
import { ProviderDto } from './dto/provider.dto';
import { CreateProviderDto } from './dto/create-provider.dto';
import { UpdateProviderDto } from './dto/update-provider.dto';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentAppUser } from '../auth/decorators/current-app-user.decorator';
import { AppRole } from '../utils/enums/roles';
import type { Tables } from '../supabase/database.types';

type AppUser = Tables<'app_user'>;

@ApiTags('provider')
@Controller('provider')
export class ProviderController {
  constructor(private readonly providerService: ProviderService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(SupabaseAuthGuard)
  @ApiOperation({ summary: 'Crear perfil de provider (USER o SUPER_USER)' })
  @ApiCreatedResponse({ type: ProviderDto })
  @ApiConflictResponse({ description: 'Ya existe un perfil de provider para este usuario' })
  @ApiUnauthorizedResponse({ description: 'Token inválido o no enviado' })
  @ApiInternalServerErrorResponse({ description: 'Error interno' })
  async create(
    @CurrentAppUser appUser: AppUser,
    @Body() dto: CreateProviderDto,
  ): Promise<ProviderDto> {
    return this.providerService.create(appUser.id, dto);
  }

  @Get('me')
  @ApiBearerAuth()
  @Roles(AppRole.PROVIDER)
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Mi perfil de provider (PROVIDER o SUPER_USER)' })
  @ApiOkResponse({ type: ProviderDto })
  @ApiUnauthorizedResponse({ description: 'Token inválido o no enviado' })
  @ApiForbiddenResponse({ description: 'Sin permisos' })
  @ApiNotFoundResponse({ description: 'Perfil de provider no encontrado' })
  @ApiInternalServerErrorResponse({ description: 'Error interno' })
  async findMe(@CurrentAppUser appUser: AppUser): Promise<ProviderDto> {
    return this.providerService.findMyProfile(appUser.id);
  }

  @Patch('me')
  @ApiBearerAuth()
  @Roles(AppRole.PROVIDER)
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Editar mi perfil de provider (PROVIDER o SUPER_USER)' })
  @ApiOkResponse({ type: ProviderDto })
  @ApiUnauthorizedResponse({ description: 'Token inválido o no enviado' })
  @ApiForbiddenResponse({ description: 'Sin permisos' })
  @ApiNotFoundResponse({ description: 'Perfil de provider no encontrado' })
  @ApiInternalServerErrorResponse({ description: 'Error interno' })
  async updateMe(
    @CurrentAppUser appUser: AppUser,
    @Body() dto: UpdateProviderDto,
  ): Promise<ProviderDto> {
    return this.providerService.updateMyProfile(appUser.id, dto);
  }

  @Get(':providerId')
  @ApiOperation({ summary: 'Perfil público de un provider (sin auth)' })
  @ApiOkResponse({ type: ProviderDto })
  @ApiNotFoundResponse({ description: 'Provider no encontrado' })
  @ApiInternalServerErrorResponse({ description: 'Error interno' })
  async findPublicById(@Param('providerId') providerId: string): Promise<ProviderDto> {
    return this.providerService.findPublicById(providerId);
  }
}
```

- [ ] **Step 11: Crear ProviderModule**

Crear `src/provider/provider.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { ProviderService } from './provider.service';
import { ProviderController } from './provider.controller';
import { SupabaseModule } from '../supabase/supabase.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [SupabaseModule, AuthModule],
  controllers: [ProviderController],
  providers: [ProviderService],
  exports: [ProviderService],
})
export class ProviderModule {}
```

- [ ] **Step 12: Registrar ProviderModule en AppModule**

En `src/app.module.ts`, agregar el import:

```typescript
import { ProviderModule } from './provider/provider.module';

// En el array imports, agregar ProviderModule:
imports: [
  ConfigModule.forRoot({ ... }),
  SupabaseModule,
  HealthModule,
  AuthModule,
  AppUserModule,
  NewsletterModule,
  ProviderModule,
],
```

- [ ] **Step 13: Correr todos los tests para verificar que pasan**

```bash
npx jest provider --no-coverage
```

Expected: PASS — todos los tests del módulo provider

- [ ] **Step 14: Correr la suite completa**

```bash
npx jest --no-coverage
```

Expected: PASS — todos los tests del proyecto

- [ ] **Step 15: Commit final**

```bash
git add src/provider/ src/app.module.ts
git commit -m "feat: add provider module with CRUD endpoints"
```
