import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { Response } from 'express';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';

describe('FilesController', () => {
  let filesController: FilesController;
  let filesService: FilesService;

  beforeEach(async () => {
    const mockFilesService = {
      getStaticProductImage: jest.fn().mockReturnValue('test-image.jpg'),
    };

    const mockConfigService = {
      get: jest.fn().mockReturnValue('http://localhost:3000'),
    };

    const moduleRef = await Test.createTestingModule({
      imports: [],
      controllers: [FilesController],
      providers: [
        {
          provide: FilesService,
          useValue: mockFilesService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    filesController = moduleRef.get<FilesController>(FilesController);
    filesService = moduleRef.get<FilesService>(FilesService);
  });

  it('should be defined', () => {
    expect(filesController).toBeDefined();
  });

  it('should return image path for findProductImage', () => {
    const res = {
      sendFile: jest.fn(),
    } as any as Response;

    const imageName = 'test-image.jpg';
    const path = `files/product/${imageName}`;
    jest.spyOn(filesService, 'getStaticProductImage').mockReturnValue(path);

    filesController.findProductImage(res, imageName);
    expect(res.sendFile).toHaveBeenCalledWith(path);
  });

  it('should upload product image and return secure URL', () => {
    const file = {
      filename: 'uploaded-image.jpg',
    } as Express.Multer.File;

    const result = filesController.uploadProductImage(file);
    expect(result).toEqual({
      secureUrl: 'http://localhost:3000/files/product/uploaded-image.jpg',
    });
  });

  it('should throw BadRequestException if no file is uploaded', () => {
    expect(() => filesController.uploadProductImage(null)).toThrow(
      'Make sure that the file is an image',
    );
  });
});
