import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
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
  let mockAdminClient: {
    from: jest.Mock;
    auth: { admin: { updateUserById: jest.Mock } };
  };
  let mockClient: { from: jest.Mock };

  beforeEach(() => {
    mockChain = makeChain({ data: mockUser, error: null });
    mockAdminClient = {
      from: jest.fn().mockReturnValue(mockChain),
      auth: {
        admin: { updateUserById: jest.fn().mockResolvedValue({ error: null }) },
      },
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
      await expect(service.updateMe('bad-uuid', {})).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws InternalServerErrorException on supabase error', async () => {
      mockChain.maybeSingle.mockResolvedValue({
        data: null,
        error: { message: 'db error' },
      });
      await expect(service.updateMe('user-uuid', {})).rejects.toThrow(
        InternalServerErrorException,
      );
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
      mockAdminClient.auth.admin.updateUserById.mockResolvedValue({
        error: { message: 'auth error' },
      });
      await expect(service.setBlockedStatus('user-uuid', true)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
