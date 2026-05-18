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
