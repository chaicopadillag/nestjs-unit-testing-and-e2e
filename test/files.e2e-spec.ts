import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';

import { FilesModule } from '../src/files/files.module';

import { setupApp } from './test-utils';

describe('Files (e2e)', () => {
  let app: INestApplication;
  let configService: ConfigService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [FilesModule],
      providers: [],
    })
      .overrideProvider(ConfigService)
      .useValue({
        get: (key: string) => {
          const config = {
            JWT_SECRET: 'test_jwt_secret',
            HOST_API: 'http://localhost:3000/api',
          };
          return config[key];
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    setupApp(app);
    await app.init();

    configService = moduleFixture.get<ConfigService>(ConfigService);

    // Reset mocks
    jest.clearAllMocks();
  });

  beforeAll(async () => {
    await app.close();
  });

  describe('/files/product/:imageName (GET)', () => {
    it('should serve existing product image', async () => {
      const imageName = '1473809-00-A_alt.jpg';
      const response = await request(app.getHttpServer()).get(
        `/files/product/${imageName}`,
      );

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('image/jpeg');
      expect(response.body).toBeInstanceOf(Buffer);
    });

    it('should return 404 for non-existent product image', async () => {
      const imageName = 'non-existent-image.jpg';

      const response = await request(app.getHttpServer()).get(
        `/files/product/${imageName}`,
      );

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        'message',
        `No product found with image ${imageName}`,
      );
      expect(response.body).toHaveProperty('statusCode', 400);
      expect(response.body).toHaveProperty('error', 'Bad Request');
    });

    it('should return 400 for image name without extension', async () => {
      const invalidImageName = 'no-extension';

      await request(app.getHttpServer())
        .get(`/files/product/${invalidImageName}`)
        .expect(400);
    });

    it('should return 400 for image name with invalid extension', async () => {
      const invalidImageName = 'malicious.exe';

      await request(app.getHttpServer())
        .get(`/files/product/${invalidImageName}`)
        .expect(400);
    });
  });

  describe('/files/product (POST)', () => {
    it('should return 400 when no file is uploaded', async () => {
      await request(app.getHttpServer()).post('/files/product').expect(400);
    });

    it('should return 400 for invalid file type', async () => {
      const invalidFile = Buffer.from('fake file content');

      await request(app.getHttpServer())
        .post('/files/product')
        .attach('file', invalidFile, 'test.txt')
        .expect(400);
    });

    it('should handle valid image upload simulation', async () => {
      const validImageBuffer = Buffer.from('fake image data');

      const response = await request(app.getHttpServer())
        .post('/files/product')
        .attach('file', validImageBuffer, 'test-image.jpg');

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('secureUrl');
      expect(response.body.secureUrl).toContain(configService.get('HOST_API'));
      expect(response.body.secureUrl).toContain('/files/product/');

      const filename = response.body.secureUrl.split('/files/product/')[1];

      const filePath = `./static/products/${filename}`;
      const fs = require('fs');
      expect(fs.existsSync(filePath)).toBe(true);

      // Clean up the uploaded file after test
      fs.unlinkSync(filePath);
    });
  });
});
