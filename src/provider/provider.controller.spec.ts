import { ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ProviderController } from './provider.controller';
import { ProviderService } from './provider.service';
import { ProviderDto } from './dto/provider.dto';
import { CreateProviderDto } from './dto/create-provider.dto';
import { UpdateProviderDto } from './dto/update-provider.dto';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

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
    })
      .overrideGuard(SupabaseAuthGuard)
      .useValue({ canActivate: (_ctx: ExecutionContext) => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: (_ctx: ExecutionContext) => true })
      .compile();

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
