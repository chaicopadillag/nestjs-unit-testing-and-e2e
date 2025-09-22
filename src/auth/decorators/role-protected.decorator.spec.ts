import { SetMetadata } from '@nestjs/common';
import { RoleProtected } from './role-protected.decorator';

jest.mock('@nestjs/common', () => {
  return {
    SetMetadata: jest.fn(),
  };
});

describe('RoleProtectedDecorator', () => {
  it('should be defined', () => {
    expect(RoleProtected).toBeDefined();
  });

  it('should set metadata correctly', () => {
    const roles: any = ['admin', 'user', 'super-user'];
    const result = RoleProtected(...roles);
    expect(result).toBeUndefined();
    expect(SetMetadata).toHaveBeenCalledWith('roles', roles);
  });
});
