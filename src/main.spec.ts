import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { bootstrap } from './main';

jest.mock('@nestjs/common', () => {
  return {
    Logger: jest.fn().mockImplementation(() => ({
      log: jest.fn(),
    })),
    ValidationPipe: jest.requireActual('@nestjs/common').ValidationPipe,
  };
});

jest.mock('@nestjs/core', () => {
  return {
    NestFactory: {
      create: jest.fn().mockImplementation(() => ({
        setGlobalPrefix: jest.fn(),
        enableCors: jest.fn(),
        useGlobalPipes: jest.fn(),
        listen: jest.fn().mockResolvedValue(true),
      })),
    },
  };
});

jest.mock('@nestjs/swagger', () => {
  return {
    DocumentBuilder: jest.fn().mockImplementation(() => ({
      setTitle: jest.fn().mockReturnThis(),
      setDescription: jest.fn().mockReturnThis(),
      setVersion: jest.fn().mockReturnThis(),
      build: jest.fn().mockReturnValue({}),
    })),
    ApiProperty: jest.fn(),
    SwaggerModule: {
      createDocument: jest.fn().mockReturnValue({}),
      setup: jest.fn(),
    },
  };
});

jest.mock('./app.module', () => ({
  AppModule: 'AppModule',
}));

describe('MainSpec', () => {
  let nestFactoryMock: {
    setGlobalPrefix: jest.Mock;
    enableCors: jest.Mock;
    useGlobalPipes: jest.Mock;
    listen: jest.Mock;
  };
  let swaggerModuleMock: {
    createDocument: jest.Mock;
    setup: jest.Mock;
  };
  let loggerMock: {
    log: jest.Mock;
  };

  beforeEach(async () => {
    nestFactoryMock = {
      setGlobalPrefix: jest.fn(),
      enableCors: jest.fn(),
      useGlobalPipes: jest.fn(),
      listen: jest.fn().mockResolvedValue(true),
    };
    swaggerModuleMock = {
      createDocument: jest.fn().mockReturnValue({}),
      setup: jest.fn(),
    };
    loggerMock = {
      log: jest.fn(),
    };

    (NestFactory.create as jest.Mock).mockResolvedValue(nestFactoryMock);
    (SwaggerModule.createDocument as jest.Mock).mockImplementation(
      swaggerModuleMock.createDocument,
    );
    (SwaggerModule.setup as jest.Mock).mockImplementation(
      swaggerModuleMock.setup,
    );
    (Logger as any as jest.Mock).mockImplementation(() => loggerMock);
  });

  it('should be defined', async () => {
    await bootstrap();
  });

  it('should call the necessary methods to set up the app', async () => {
    await bootstrap();
    expect(nestFactoryMock.setGlobalPrefix).toHaveBeenCalledWith('api');
    expect(NestFactory.create).toHaveBeenCalledWith('AppModule');
    expect(nestFactoryMock.enableCors).toHaveBeenCalled();
    expect(nestFactoryMock.useGlobalPipes).toHaveBeenCalledWith(
      expect.objectContaining({
        errorHttpStatusCode: 400,
        validatorOptions: expect.objectContaining({
          forbidNonWhitelisted: true,
          forbidUnknownValues: false,
          whitelist: true,
        }),
      }),
    );
    expect(swaggerModuleMock.createDocument).toHaveBeenCalled();
    expect(swaggerModuleMock.setup).toHaveBeenCalledWith(
      'api',
      nestFactoryMock,
      {},
    );
    expect(nestFactoryMock.listen).toHaveBeenCalledWith(3000);
  });

  it('should document builder methods to set up the swagger config', async () => {
    const setTitleMock = jest.fn().mockReturnThis();
    const setDescriptionMock = jest.fn().mockReturnThis();
    const setVersionMock = jest.fn().mockReturnThis();
    const buildMock = jest.fn().mockReturnValue({});

    const documentBuilderMock = {
      setTitle: setTitleMock,
      setDescription: setDescriptionMock,
      setVersion: setVersionMock,
      build: buildMock,
    };

    (DocumentBuilder as jest.Mock).mockImplementation(
      () => documentBuilderMock,
    );

    await bootstrap();

    expect(setTitleMock).toHaveBeenCalledWith('Teslo RESTFul API');
    expect(setDescriptionMock).toHaveBeenCalledWith('Teslo shop endpoints');
    expect(setVersionMock).toHaveBeenCalledWith('1.0');
    expect(buildMock).toHaveBeenCalled();
  });

  it('should read the port from the environment variable if available', async () => {
    const RUNNING_PORT = 8080;
    process.env.PORT = RUNNING_PORT.toString();
    await bootstrap();
    expect(nestFactoryMock.listen).toHaveBeenCalledWith(
      RUNNING_PORT.toString(),
    );
    delete process.env.PORT;
    expect(nestFactoryMock.listen).not.toHaveBeenCalledWith(3000);
    expect(loggerMock.log).toHaveBeenCalledWith('App running on port 8080');
  });
});
