import { ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BusinessController } from './business.controller';
import { BusinessService } from './business.service';
import { BusinessDto } from './dto/business.dto';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

const mockBusinessDto: BusinessDto = {
  id: 'business-uuid',
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

describe('BusinessController', () => {
  let controller: BusinessController;
  let service: jest.Mocked<BusinessService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BusinessController],
      providers: [
        {
          provide: BusinessService,
          useValue: {
            create: jest.fn().mockResolvedValue(mockBusinessDto),
            findMyProfile: jest.fn().mockResolvedValue(mockBusinessDto),
            updateMyProfile: jest.fn().mockResolvedValue(mockBusinessDto),
            findPublicById: jest.fn().mockResolvedValue(mockBusinessDto),
          },
        },
      ],
    })
      .overrideGuard(SupabaseAuthGuard)
      .useValue({ canActivate: (_ctx: ExecutionContext) => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: (_ctx: ExecutionContext) => true })
      .compile();

    controller = module.get<BusinessController>(BusinessController);
    service = module.get(BusinessService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('creates a business profile for the current user', async () => {
      const dto: CreateBusinessDto = { business_name: 'Aventuras del Sur' };
      const result = await controller.create(mockAppUser as never, dto);
      expect(service.create).toHaveBeenCalledWith('user-uuid', dto);
      expect(result).toEqual(mockBusinessDto);
    });
  });

  describe('findMe', () => {
    it('returns the business profile of the current user', async () => {
      const result = await controller.findMe(mockAppUser as never);
      expect(service.findMyProfile).toHaveBeenCalledWith('user-uuid');
      expect(result).toEqual(mockBusinessDto);
    });
  });

  describe('updateMe', () => {
    it('updates the business profile of the current user', async () => {
      const dto: UpdateBusinessDto = { business_name: 'Nuevo Nombre' };
      const result = await controller.updateMe(mockAppUser as never, dto);
      expect(service.updateMyProfile).toHaveBeenCalledWith('user-uuid', dto);
      expect(result).toEqual(mockBusinessDto);
    });
  });

  describe('findPublicById', () => {
    it('returns public business profile by id', async () => {
      const result = await controller.findPublicById('business-uuid');
      expect(service.findPublicById).toHaveBeenCalledWith('business-uuid');
      expect(result).toEqual(mockBusinessDto);
    });
  });
});
