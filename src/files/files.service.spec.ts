import { Test } from '@nestjs/testing';
import { FilesService } from './files.service';

import * as fs from 'fs';
import * as path from 'path';
import { BadRequestException } from '@nestjs/common';

describe('FilesService', () => {
  let filesService: FilesService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [],
      controllers: [],
      providers: [FilesService],
    }).compile();

    filesService = moduleRef.get<FilesService>(FilesService);
  });

  it('should be defined', () => {
    expect(filesService).toBeDefined();
  });

  it('should return the correct image path if the image exists', () => {
    const imageName = 'iphone.jpg';

    jest.spyOn(path, 'join').mockReturnValue(`/mocked/path/${imageName}`);
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);

    const imagePath = filesService.getStaticProductImage(imageName);

    expect(imagePath).toContain(imageName);
  });

  it('should throw BadRequestException if the image does not exist', () => {
    const imageName = 'nonexistent.jpg';

    jest.spyOn(path, 'join').mockReturnValue(`/mocked/path/${imageName}`);
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);

    expect(() => filesService.getStaticProductImage(imageName)).toThrow(
      `No product found with image ${imageName}`,
    );
    expect(() => filesService.getStaticProductImage(imageName)).toThrow(
      BadRequestException,
    );
  });
});
