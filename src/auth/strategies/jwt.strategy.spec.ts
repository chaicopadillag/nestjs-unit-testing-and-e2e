import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let jwtStrategy: JwtStrategy;

  const mockUser: any = {
    id: '1',
    email: 'test@example.com',
    fullName: 'Test User',
    isActive: true,
    roles: ['user'],
    password: 'XXXXXXXX',
    checkFieldsBeforeInsert: jest.fn(),
    checkFieldsBeforeUpdate: jest.fn(),
  };

  const mockUserRepository = {
    findOneBy: jest.fn().mockResolvedValue(mockUser),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('test-secret'),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [],
      providers: [
        JwtStrategy,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    jwtStrategy = moduleRef.get<JwtStrategy>(JwtStrategy);
  });

  it('should be defined', () => {
    expect(jwtStrategy).toBeDefined();
  });

  describe('validate', () => {
    const payload = { id: '1' };
    it('should return a user if valid', async () => {
      const user = await jwtStrategy.validate(payload);
      expect(user).toEqual(mockUser);
      expect(mockUserRepository.findOneBy).toHaveBeenCalledWith({ id: '1' });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockUserRepository.findOneBy.mockResolvedValueOnce(null);
      await expect(jwtStrategy.validate(payload)).rejects.toThrow(
        'Token not valid',
      );

      mockUserRepository.findOneBy.mockResolvedValueOnce(null);
      await expect(jwtStrategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if user is inactive', async () => {
      mockUserRepository.findOneBy.mockResolvedValueOnce({
        ...mockUser,
        isActive: false,
      });
      await expect(jwtStrategy.validate(payload)).rejects.toThrow(
        'User is inactive, talk with an admin',
      );

      mockUserRepository.findOneBy.mockResolvedValueOnce({
        ...mockUser,
        isActive: false,
      });
      await expect(jwtStrategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
