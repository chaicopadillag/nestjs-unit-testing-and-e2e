import { INestApplication, Provider, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';

import { DataSource } from 'typeorm';
import { User } from '../src/auth/entities/user.entity';
import { ProductImage } from '../src/products/entities/product-image.entity';
import { Product } from '../src/products/entities/product.entity';

export interface MockRepository<T = any> {
  find: jest.Mock;
  findOne: jest.Mock;
  findOneBy: jest.Mock;
  findAndCount: jest.Mock;
  save: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  remove: jest.Mock;
  preload: jest.Mock;
  createQueryBuilder: jest.Mock;
  merge: jest.Mock;
}

export const createMockRepository = (): MockRepository => ({
  find: jest.fn(),
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  findAndCount: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  remove: jest.fn(),
  preload: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
    getMany: jest.fn(),
    getManyAndCount: jest.fn(),
  })),
  merge: jest.fn(),
});

export const createMockConfigService = () => ({
  get: jest.fn((key: string) => {
    const config = {
      DB_HOST: 'localhost',
      DB_PORT: '5432',
      DB_NAME: 'test_db',
      DB_USERNAME: 'test_user',
      DB_PASSWORD: 'test_password',
      JWT_SECRET: 'test_jwt_secret',
      HOST_API: 'http://localhost:3000/api',
      STAGE: 'dev',
    };
    return config[key];
  }),
});

export const createMockJwtService = () => ({
  sign: jest.fn(() => 'mock_jwt_token'),
  verify: jest.fn(() => ({ id: 'mock_user_id' })),
  signAsync: jest.fn(() => Promise.resolve('mock_jwt_token')),
  verifyAsync: jest.fn(() => Promise.resolve({ id: 'mock_user_id' })),
});

export const createMockDataSource = () => ({
  createQueryRunner: jest.fn().mockReturnValue({
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      save: jest.fn(),
      delete: jest.fn(),
    },
  }),
});

export const mockUser: Partial<User> = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'test@test.com',
  password: '$2b$10$mockhashedpassword',
  fullName: 'Test User',
  isActive: true,
  roles: ['user'],
};

export const mockProduct: Partial<Product> = {
  id: '550e8400-e29b-41d4-a716-446655440001',
  title: 'Test Product',
  price: 99.99,
  description: 'Test product description',
  slug: 'test-product',
  stock: 10,
  sizes: ['S', 'M', 'L'],
  gender: 'men',
  tags: ['test', 'product'],
  images: [],
  user: mockUser as User,
};

export const mockProductImage: Partial<ProductImage> = {
  id: 1,
  url: 'test-image.jpg',
  product: mockProduct as Product,
};

export function setupApp(app: INestApplication): INestApplication {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  return app;
}

export const getRepositoryProviders = (): Provider[] => [
  {
    provide: getRepositoryToken(Product),
    useValue: createMockRepository(),
  },
  {
    provide: getRepositoryToken(ProductImage),
    useValue: createMockRepository(),
  },
  {
    provide: getRepositoryToken(User),
    useValue: createMockRepository(),
  },
  {
    provide: DataSource,
    useValue: createMockDataSource(),
  },
];

export const getCommonProviders = (): Provider[] => [
  {
    provide: ConfigService,
    useValue: createMockConfigService(),
  },
  {
    provide: JwtService,
    useValue: createMockJwtService(),
  },
];
