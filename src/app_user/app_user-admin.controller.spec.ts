import { ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppUserAdminController } from './app_user-admin.controller';
import { AppUserService } from './app_user.service';
import { AppUserDto } from './dto/app_user.dto';
import { UpdateGlobalRoleDto } from './dto/update-role.dto';
import { BlockUserDto } from './dto/block-user.dto';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

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
    })
      .overrideGuard(SupabaseAuthGuard)
      .useValue({ canActivate: (_ctx: ExecutionContext) => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: (_ctx: ExecutionContext) => true })
      .compile();

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
