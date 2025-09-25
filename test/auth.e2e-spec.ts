import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as request from 'supertest';

import { AuthModule } from '../src/auth/auth.module';
import { User } from '../src/auth/entities/user.entity';
import { CommonModule } from '../src/common/common.module';

import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import {
  MockRepository,
  createMockRepository,
  getCommonProviders,
  getRepositoryProviders,
  mockUser,
  setupApp,
} from './test-utils';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let userRepository: MockRepository<User>;
  let jwtService: JwtService;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AuthModule, CommonModule],
      providers: [...getRepositoryProviders(), ...getCommonProviders()],
    })
      .overrideProvider(getRepositoryToken(User))
      .useValue(createMockRepository())
      .overrideProvider(ConfigService)
      .useValue({
        get: (key: string) => {
          const config = { JWT_SECRET: 'test_jwt_secret' };
          return config[key];
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    setupApp(app);
    await app.init();

    userRepository = moduleFixture.get<MockRepository<User>>(
      getRepositoryToken(User),
    );
    jwtService = moduleFixture.get<JwtService>(JwtService);

    // Reset mocks
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/auth/register (POST)', () => {
    const registerDto = {
      email: 'newuser@test.com',
      password: 'Test123456',
      fullName: 'New Test User',
    };

    it('should register a new user successfully', async () => {
      userRepository.findOneBy.mockResolvedValue(null);

      const newUser = {
        ...mockUser,
        ...registerDto,
        password: 'hashed_password',
      };

      userRepository.create.mockReturnValue(newUser);
      userRepository.save.mockResolvedValue(newUser);

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      expect(response.body).toEqual({
        user: {
          id: expect.any(String),
          email: 'newuser@test.com',
          fullName: 'New Test User',
          isActive: true,
          roles: ['user'],
        },
        token: expect.any(String),
      });
    });

    it('should return 400 when email already exists', async () => {
      userRepository.save.mockImplementation(() => {
        throw {
          code: '23505',
          detail: `Key email already exists.`,
        };
      });

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        statusCode: 400,
        message: 'Key email already exists.',
        error: 'Bad Request',
      });
    });

    it('should return 400 for invalid email format', async () => {
      const invalidRegisterDto = {
        ...registerDto,
        email: 'invalid-email',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(invalidRegisterDto)
        .expect(400);
    });

    it('should return 400 for weak password', async () => {
      const weakPasswordDto = {
        ...registerDto,
        password: '123', // Too short
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(weakPasswordDto)
        .expect(400);
    });

    it('should return 400 for missing required fields', async () => {
      const incompleteDto = {
        email: 'test@test.com',
        // Missing password and fullName
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(incompleteDto)
        .expect(400);
    });

    it('should return 400 for empty fullName', async () => {
      const emptyNameDto = {
        ...registerDto,
        fullName: '',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(emptyNameDto)
        .expect(400);
    });
  });

  describe('/auth/login (POST)', () => {
    const loginDto = {
      email: 'test@test.com',
      password: 'Test123456',
    };

    it('should login user with valid credentials', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compareSync').mockReturnValue(true);

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto);
      authToken = response.body.token;

      expect(response.body).toEqual({
        user: {
          id: expect.any(String),
          email: 'test@test.com',
          fullName: 'Test User',
          isActive: true,
          roles: ['user'],
        },
        token: expect.any(String),
      });
    });

    it('should return 401 for non-existent user', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(401);
    });

    it('should return 401 for incorrect password', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compareSync').mockReturnValue(false);
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto);

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        statusCode: 401,
        message: 'Credentials are not valid (password)',
        error: 'Unauthorized',
      });
    });

    it('should return 401 for inactive user', async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      userRepository.findOne.mockResolvedValue(inactiveUser);

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(401);
    });

    it('should return 400 for invalid email format', async () => {
      const invalidLoginDto = {
        email: 'invalid-email',
        password: 'Test123456',
      };

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(invalidLoginDto)
        .expect(400);
    });

    it('should return 400 for missing credentials', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({})
        .expect(400);
    });

    it('should return 400 for empty password', async () => {
      const emptyPasswordDto = {
        email: 'test@test.com',
        password: '',
      };

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(emptyPasswordDto)
        .expect(400);
    });
  });

  describe('/auth/check-status (GET)', () => {
    it('should return user info with valid token', async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      userRepository.findOneBy.mockResolvedValue(mockUser);

      const response = await request(app.getHttpServer())
        .get('/auth/check-status')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.body).toEqual({
        user: {
          id: expect.any(String),
          email: 'test@test.com',
          fullName: 'Test User',
          isActive: true,
          roles: ['user'],
        },
        token: expect.any(String),
      });
      expect(response.body.token).not.toBe(authToken);
    });

    it('should return 401 without token', async () => {
      await request(app.getHttpServer()).get('/auth/check-status').expect(401);
    });

    it('should return 401 with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/auth/check-status')
        .set('Authorization', 'Bearer invalid_token')
        .expect(401);
    });

    it('should return 401 for inactive user', async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      userRepository.findOneBy.mockResolvedValue(inactiveUser);

      await request(app.getHttpServer())
        .get('/auth/check-status')
        .set('Authorization', 'Bearer mock_jwt_token')
        .expect(401);
    });

    it('should return 401 when user not found', async () => {
      userRepository.findOneBy.mockResolvedValue(null);

      await request(app.getHttpServer())
        .get('/auth/check-status')
        .set('Authorization', 'Bearer mock_jwt_token')
        .expect(401);
    });
  });

  describe('/auth/private (GET)', () => {
    it('should access private route with valid token', async () => {
      userRepository.findOneBy.mockResolvedValue(mockUser);

      const response = await request(app.getHttpServer())
        .get('/auth/private')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('ok', true);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('user');
    });

    it('should return 401 without token', async () => {
      await request(app.getHttpServer()).get('/auth/private').expect(401);
    });
  });

  describe('/auth/private2 (GET)', () => {
    it('should access private2 route with user role super-user and admin', async () => {
      userRepository.findOneBy.mockResolvedValue({
        ...mockUser,
        roles: ['super-user', 'admin'],
      });

      const response = await request(app.getHttpServer())
        .get('/auth/private2')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.body).toEqual({
        ok: true,
        user: {
          id: expect.any(String),
          email: 'test@test.com',
          fullName: 'Test User',
          isActive: true,
          roles: ['super-user', 'admin'],
        },
      });
    });

    it('should return 401 without token', async () => {
      await request(app.getHttpServer()).get('/auth/private2').expect(401);
    });
  });
});
