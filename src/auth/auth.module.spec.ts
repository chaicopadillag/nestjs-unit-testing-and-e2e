import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthModule } from './auth.module';
import { AuthService } from './auth.service';
import { User } from './entities/user.entity';
import { JwtStrategy } from './strategies/jwt.strategy';

describe('AuthModule', () => {
  let moduleRef: TestingModule;

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn((key: string) => {
        const config = {
          JWT_SECRET: 'test-secret',
        };
        return config[key];
      }),
    };

    const mockJwtStrategy = {
      validate: jest.fn(),
    };

    moduleRef = await Test.createTestingModule({
      imports: [AuthModule],
    })
      .overrideProvider(getRepositoryToken(User))
      .useValue(mockRepository)
      .overrideProvider(ConfigService)
      .useValue(mockConfigService)
      .compile();
  });

  it('should be defined', () => {
    expect(moduleRef).toBeDefined();
  });

  it('should compile AuthModule', () => {
    const authModule = moduleRef.get(AuthModule);
    expect(authModule).toBeDefined();
  });

  it('should have AuthController', () => {
    const controller = moduleRef.get<AuthController>(AuthController);
    expect(controller).toBeDefined();
  });

  it('should have AuthService', () => {
    const service = moduleRef.get<AuthService>(AuthService);
    expect(service).toBeDefined();
  });

  it('should have JwtStrategy', () => {
    const strategy = moduleRef.get<JwtStrategy>(JwtStrategy);
    expect(strategy).toBeDefined();
  });
});
