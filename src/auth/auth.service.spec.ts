import {
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthService } from './auth.service';
import { CreateUserDto, LoginUserDto } from './dto';
import { User } from './entities/user.entity';

describe('AuthService', () => {
  let authService: AuthService;
  let userRepository: Repository<User>;

  beforeEach(async () => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    const mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
    };
    const mockeJwtService = {
      sign: jest.fn().mockReturnValue('test-jwt-token'),
    };

    const moduleRef = await Test.createTestingModule({
      imports: [],
      controllers: [],
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
        {
          provide: JwtService,
          useValue: mockeJwtService,
        },
      ],
    }).compile();

    authService = moduleRef.get<AuthService>(AuthService);
    userRepository = moduleRef.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  it('should create a user and return JWT token', async () => {
    const createUserDto: CreateUserDto = {
      email: 'Rozella_Schaden@yahoo.com',
      password: 'Password123',
      fullName: 'Rozella Schaden',
    };
    const mockUser = {
      id: 'a3904b9b-de5d-4e11-89a3-d1f42eaca4eb',
      email: createUserDto.email,
      fullName: createUserDto.fullName,
      password: '123456',
      isActive: true,
      roles: ['user'],
    } as User;

    jest.spyOn(userRepository, 'create').mockReturnValue(mockUser);
    const result = await authService.create(createUserDto);

    expect(result).toHaveProperty('user');
    expect(result).toHaveProperty('token');
    expect(result.token).toBe('test-jwt-token');
    expect(result.user).toEqual(mockUser);
    expect(userRepository.create).toHaveBeenCalledTimes(1);
    expect(userRepository.save).toHaveBeenCalledWith(mockUser);
  });

  it('should throw an error if user creation fails', async () => {
    const createUserDto: CreateUserDto = {
      email: 'Rozella_Schaden@yahoo.com',
      password: 'Password123',
      fullName: 'Rozella Schaden',
    };
    const databaseError = {
      code: '23505',
      detail: 'Unique constraint violation',
    };

    jest.spyOn(userRepository, 'save').mockRejectedValue(databaseError);

    await expect(authService.create(createUserDto)).rejects.toThrow(
      databaseError.detail,
    );
    expect(userRepository.create).toHaveBeenCalledTimes(1);
  });

  it('should trow InternalServerError in create User', async () => {
    const createUserDto: CreateUserDto = {
      email: 'Rozella_Schaden@yahoo.com',
      password: 'Password123',
      fullName: 'Rozella Schaden',
    };

    const internalError = new Error('Unexpected error');

    jest.spyOn(userRepository, 'save').mockRejectedValue(internalError);

    await expect(authService.create(createUserDto)).rejects.toThrow(
      InternalServerErrorException,
    );
    expect(userRepository.create).toHaveBeenCalledTimes(1);
  });

  it('should login a user and return JWT token', async () => {
    const loginUserDto: LoginUserDto = {
      email: 'Karlee.Schamberger76@gmail.com',
      password: 'Password123',
    };
    const mockUser = {
      id: 'a3904b9b-de5d-4e11-89a3-d1f42eaca4eb',
      email: loginUserDto.email,
      fullName: 'Karlee Schamberger',
      password: '$2b$10$D64uve610y1zldtiHzi7ueZa/p9Mu.EHoIxobafoIUxkrFgcO3LJy',
      isActive: true,
      roles: ['user'],
    } as User;

    jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);
    const result = await authService.login(loginUserDto);

    expect(result).toHaveProperty('user');
    expect(result).toHaveProperty('token');
    expect(result.token).toBe('test-jwt-token');
    expect(result.user).toEqual(mockUser);
    expect(userRepository.findOne).toHaveBeenCalledTimes(1);
  });

  it('should login a user not found', async () => {
    const loginUserDto: LoginUserDto = {
      email: 'Karlee.Schamberger76@gmail.com',
      password: 'Password123',
    };

    const mockUser = null;

    jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);
    await expect(authService.login(loginUserDto)).rejects.toThrow(
      UnauthorizedException,
    );
    await expect(authService.login(loginUserDto)).rejects.toThrow(
      'Credentials are not valid (email)',
    );
  });

  it('should login a user password not match', async () => {
    const loginUserDto: LoginUserDto = {
      email: 'Karlee.Schamberger76@gmail.com',
      password: '123456',
    };

    const mockUser = {
      id: 'a3904b9b-de5d-4e11-89a3-d1f42eaca4eb',
      email: loginUserDto.email,
      fullName: 'Karlee Schamberger',
      password: '$2b$10$D64uve610y1zldtiHzi7ueZa/p9Mu.EHoIxobafoIUxkrFgcO3LJy',
      isActive: true,
      roles: ['user'],
    } as User;

    jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);
    await expect(authService.login(loginUserDto)).rejects.toThrow(
      UnauthorizedException,
    );
    await expect(authService.login(loginUserDto)).rejects.toThrow(
      'Credentials are not valid (password)',
    );
  });

  it('should check auth status and return new JWT token', async () => {
    const user = {
      id: 'a3904b9b-de5d-4e11-89a3-d1f42eaca4eb',
      email: 'Milford_Anderson@gmail.com',
      fullName: 'Milford Anderson',
      password: 'uZbRX_DAGjkSUV9',
      isActive: true,
      roles: ['user'],
    } as User;

    const result = await authService.checkAuthStatus(user);

    expect(result).toHaveProperty('user');
    expect(result).toHaveProperty('token');
    expect(result.token).toBe('test-jwt-token');
    expect(result.user).toEqual(user);
  });
});
