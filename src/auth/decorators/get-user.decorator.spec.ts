import { InternalServerErrorException } from '@nestjs/common';
import { getAuthUser } from './get-user.decorator';

const mockUser = {
  id: 1,
  name: 'John Doe',
  email: 'miracle.white27@hotmail.com',
  role: 'admin',
};

const mockExecutionContext = {
  switchToHttp: jest.fn().mockReturnValue({
    getRequest: jest.fn().mockReturnValue({
      user: mockUser,
    }),
  }),
};

jest.mock('@nestjs/common', () => ({
  createParamDecorator: jest.fn((fn) => fn),
  InternalServerErrorException:
    jest.requireActual('@nestjs/common').InternalServerErrorException,
}));

describe('GetUserDecorator', () => {
  it('should be defined', () => {
    expect(getAuthUser).toBeDefined();
  });

  it('should return the user from the request', () => {
    const result = getAuthUser('', mockExecutionContext as any);
    expect(result).toEqual(mockUser);
  });

  it('should return a specific property of the user from the request', () => {
    const result = getAuthUser('email', mockExecutionContext as any);
    expect(result).toEqual(mockUser.email);
  });

  it('should throw an error if no user is found in the request', () => {
    const mockCtxNoUser = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({}),
      }),
    };

    expect(() => getAuthUser('', mockCtxNoUser as any)).toThrow(
      InternalServerErrorException,
    );
    expect(() => getAuthUser('', mockCtxNoUser as any)).toThrow(
      'User not found (request)',
    );
  });
});
