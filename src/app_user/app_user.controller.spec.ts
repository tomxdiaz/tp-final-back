import { ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppUserController } from './app_user.controller';
import { AppUserService } from './app_user.service';
import { AppUserDto } from './dto/app_user.dto';
import { UpdateMeDto } from './dto/update-me.dto';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';

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
    })
      .overrideGuard(SupabaseAuthGuard)
      .useValue({ canActivate: (_ctx: ExecutionContext) => true })
      .compile();

    controller = module.get<AppUserController>(AppUserController);
    service = module.get(AppUserService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findMe', () => {
    it('returns the current user profile', async () => {
      const result = await controller.findMe(mockAppUserDto);
      expect(service.findById).toHaveBeenCalledWith('user-uuid');
      expect(result).toEqual(mockAppUserDto);
    });
  });

  describe('updateMe', () => {
    it('updates and returns the current user profile', async () => {
      const dto: UpdateMeDto = { first_name: 'Carlos' };
      const result = await controller.updateMe(mockAppUserDto, dto);
      expect(service.updateMe).toHaveBeenCalledWith('user-uuid', dto);
      expect(result).toEqual(mockAppUserDto);
    });
  });
});
