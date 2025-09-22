import {
  BadRequestException,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRoleGuard } from './user-role.guard';

describe('UserRoleGuard', () => {
  let userRoleGuard: UserRoleGuard;
  let reflector: Reflector;
  let context: ExecutionContext;

  beforeEach(async () => {
    reflector = new Reflector();
    userRoleGuard = new UserRoleGuard(reflector);
    context = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user: {
            fullName: 'Test User',
            roles: ['admin'],
          },
        }),
      }),
      getHandler: jest.fn(),
    } as any;
  });

  it('should return true if no roles are required', () => {
    jest.spyOn(reflector, 'get').mockReturnValue(undefined);
    const hasRole = userRoleGuard.canActivate(context);
    expect(hasRole).toBe(true);
  });

  it('should return true if the user not have roles', () => {
    jest.spyOn(reflector, 'get').mockReturnValue([]);
    const hasRole = userRoleGuard.canActivate(context);
    expect(hasRole).toBe(true);
  });

  it('should return true if the user has a valid role', () => {
    jest.spyOn(reflector, 'get').mockReturnValue(['admin', 'super-user']);
    const hasRole = userRoleGuard.canActivate(context);
    expect(hasRole).toBe(true);
  });

  it('should throw BadRequestException if user is not found', () => {
    jest.spyOn(reflector, 'get').mockReturnValue(['admin']);
    context = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({}),
      }),
      getHandler: jest.fn(),
    } as any;

    expect(() => userRoleGuard.canActivate(context)).toThrow('User not found');
    expect(() => userRoleGuard.canActivate(context)).toThrow(
      BadRequestException,
    );
  });

  it('should throw ForbiddenException if the user does not have a valid role', () => {
    jest.spyOn(reflector, 'get').mockReturnValue(['super-user']);

    expect(() => userRoleGuard.canActivate(context)).toThrow(
      ForbiddenException,
    );
    expect(() => userRoleGuard.canActivate(context)).toThrow(
      'User Test User need a valid role: [super-user]',
    );
  });
});
