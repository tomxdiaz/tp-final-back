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
