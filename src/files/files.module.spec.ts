import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { FilesController } from './files.controller';
import { FilesModule } from './files.module';
import { FilesService } from './files.service';

describe('FilesModule', () => {
  let filesModule: FilesModule;
  let moduleRef: TestingModule;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [FilesModule],
      controllers: [],
      providers: [],
    }).compile();

    filesModule = moduleRef.get<FilesModule>(FilesModule);
  });

  it('should be defined', () => {
    expect(filesModule).toBeDefined();
  });

  it('should contain FilesService as a provider', () => {
    const filesService = moduleRef.get<FilesService>(FilesService);
    expect(filesService).toBeDefined();
  });

  it('should contain FilesController as a controller', () => {
    const filesController = moduleRef.get<FilesController>(FilesController);
    expect(filesController).toBeDefined();
    expect(filesController).toBeInstanceOf(FilesController);
  });

  it('should import ConfigModule', () => {
    const imports = moduleRef.get<ConfigModule>(ConfigModule);
    expect(imports).toBeDefined();
    expect(imports).toBeInstanceOf(ConfigModule);
  });
});
