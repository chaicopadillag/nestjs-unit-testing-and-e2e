import { PassportModule } from '@nestjs/passport';
import { Test } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CreateUserDto, LoginUserDto } from './dto';
import { User } from './entities/user.entity';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const authServiceMock = {
      create: jest.fn(),
      login: jest.fn(),
      checkAuthStatus: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authServiceMock,
        },
      ],
    }).compile();

    authController = moduleRef.get<AuthController>(AuthController);
    authService = moduleRef.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(authController).toBeDefined();
  });

  it('should call authService.create when calling createUser', async () => {
    const createUserDto: CreateUserDto = {
      email: 'test@example.com',
      password: 'securePassword',
      fullName: 'Test User',
    };

    await authController.createUser(createUserDto);
    expect(authService.create).toHaveBeenCalledWith(createUserDto);
  });

  it('should call authService.login when calling loginUser', async () => {
    const loginUserDto: LoginUserDto = {
      email: 'test@example.com',
      password: 'XXXXXXXXXXXXXX',
    };

    await authController.loginUser(loginUserDto);
    expect(authService.login).toHaveBeenCalledWith(loginUserDto);
  });

  it('should call authService.checkAuthStatus when calling checkAuthStatus', async () => {
    const user: any = {
      email: 'test@example.com',
      fullName: 'Test User',
      isActive: true,
      password: 'XXXXXXXXXXXXXX',
      roles: ['user'],
      id: '123',
    };

    await authController.checkAuthStatus(user);
    expect(authService.checkAuthStatus).toHaveBeenCalledWith(user);
  });

  it('should return expected response from testingPrivateRoute', () => {
    const request = {} as Express.Request;
    const user = {
      email: 'test@example.com',
      fullName: 'Test User',
      isActive: true,
      roles: ['user'],
      id: '123',
    } as User;

    const userEmail = user.email;

    const rawHeaders = [
      'Authorization: Bearer token',
      'Content-Type: application/json',
    ];

    const headers = {
      authorization: 'Bearer token',
      'content-type': 'application/json',
    };

    const response = authController.testingPrivateRoute(
      request,
      user,
      userEmail!,
      rawHeaders,
      headers,
    );

    expect(response).toEqual({
      ok: true,
      message: 'Hola Mundo Private',
      user,
      userEmail,
      rawHeaders,
      headers,
    });
  });

  it('should return expected response from privateRoute2', () => {
    const user = {
      email: 'test@example.com',
      fullName: 'Test User',
      isActive: true,
      roles: ['user'],
      id: '123',
    } as User;

    const response = authController.privateRoute2(user);

    expect(response).toEqual({
      ok: true,
      user,
    });
  });

  it('should return expected response from privateRoute3', () => {
    const user = {
      email: 'test@example.com',
      fullName: 'Test User',
      isActive: true,
      roles: ['user'],
      id: '123',
    } as User;
    const response = authController.privateRoute3(user);

    expect(response).toEqual({
      ok: true,
      user,
    });
  });
});
