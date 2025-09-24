import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from 'src/auth/entities/user.entity';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { DataSource, Repository } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { Product, ProductImage } from './entities';
import { ProductsService } from './products.service';

describe('ProductsService', () => {
  let productsService: ProductsService;
  let productRepository: Repository<Product>;
  let productImageRepository: Repository<ProductImage>;
  let dataSource: DataSource;

  beforeEach(async () => {
    const mockProductRepository = {
      find: jest.fn(),
      findOneBy: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      preload: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue({
        delete: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({}),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        getOne: jest.fn(),
      }),
    };

    const mockProductImageRepository = {
      delete: jest.fn(),
      create: jest.fn(),
    };

    const mockDataSource = {
      createQueryRunner: jest.fn().mockReturnValue({
        connect: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
        manager: {
          delete: jest.fn(),
          save: jest.fn(),
        },
      }),
    };

    const moduleRef = await Test.createTestingModule({
      imports: [],
      controllers: [],
      providers: [
        ProductsService,
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductRepository,
        },
        {
          provide: getRepositoryToken(ProductImage),
          useValue: mockProductImageRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    productsService = moduleRef.get<ProductsService>(ProductsService);
    productRepository = moduleRef.get<Repository<Product>>(
      getRepositoryToken(Product),
    );
    productImageRepository = moduleRef.get<Repository<ProductImage>>(
      getRepositoryToken(ProductImage),
    );
    dataSource = moduleRef.get<DataSource>(DataSource);
  });

  it('should be defined', () => {
    expect(productsService).toBeDefined();
  });

  it('should create a product', async () => {
    const createProductDto = {
      title: 'Test Product',
      price: 100,
      description: 'Test Description',
      slug: 'test-product',
      stock: 10,
      images: ['image1.jpg', 'image2.jpg'],
    } as CreateProductDto;

    const user = { id: 'user-id' } as User;
    const uuidProduct = '0406d16b-d998-4d74-8f99-b4626ba7fac5';

    const product = {
      id: uuidProduct,
      ...createProductDto,
      user,
      images: createProductDto.images.map((url) => ({ url })),
    } as Product;

    jest.spyOn(productRepository, 'create').mockReturnValue(product);
    jest.spyOn(productRepository, 'save').mockResolvedValue(product);
    jest
      .spyOn(productImageRepository, 'create')
      .mockImplementation((dataSource) => dataSource as any);

    const result = await productsService.create(createProductDto, user);

    expect(productRepository.save).toHaveBeenCalled();
    expect(result).toEqual({ ...product, images: createProductDto.images });
  });

  it('should throw an error if create fails', async () => {
    const createProductDto = {
      title: 'Test Product',
      price: 100,
      description: 'Test Description',
      slug: 'test-product',
      stock: 10,
      images: ['image1.jpg', 'image2.jpg'],
    } as CreateProductDto;

    const user = { id: 'user-id' } as User;

    jest.spyOn(productRepository, 'create').mockImplementation(() => {
      throw new Error('Unexpected error, check server logs');
    });

    await expect(
      productsService.create(createProductDto, user),
    ).rejects.toThrow('Unexpected error, check server logs');

    await expect(
      productsService.create(createProductDto, user),
    ).rejects.toThrow(InternalServerErrorException);
  });

  it('should throw an error database duplicate id', async () => {
    const createProductDto = {
      title: 'Test Product',
      price: 100,
      description: 'Test Description',
      slug: 'test-product',
      stock: 10,
      images: ['image1.jpg', 'image2.jpg'],
    } as CreateProductDto;

    const user = { id: 'user-id' } as User;

    const dbError = {
      code: '23505',
      detail: 'Key (id)=(0406d16b-d998-4d74-8f99-b4626ba7fac5) already exists.',
    };

    jest.spyOn(productRepository, 'create').mockImplementation(() => {
      throw dbError;
    });

    await expect(
      productsService.create(createProductDto, user),
    ).rejects.toThrow(dbError.detail);

    await expect(
      productsService.create(createProductDto, user),
    ).rejects.toThrow(BadRequestException);
  });

  it('should return all products', async () => {
    const products = [
      {
        id: '9dab131a-de5f-43dc-8068-b17ef1466258',
        title: 'IPhone 14',
        price: 100,
        description: 'Incredible phone',
        slug: 'iphone-14',
        stock: 10,
        images: [{ url: 'image1.jpg' }, { url: 'image2.jpg' }],
      },
      {
        id: 'b1e8f3c4-2f3a-4f4b-9c3a-1c2b3d4e5f6g',
        title: 'Samsung S22',
        price: 200,
        description: 'The latest Samsung phone',
        slug: 'samsung-s22',
        stock: 20,
        images: [{ url: 'image3.jpg' }, { url: 'image4.jpg' }],
      },
    ] as Product[];
    jest.spyOn(productRepository, 'find').mockResolvedValue(products);

    const paginationDto = { limit: 10, offset: 0 } as PaginationDto;
    const result = await productsService.findAll(paginationDto);
    expect(result).toEqual(
      products.map((product) => ({
        ...product,
        images: product.images.map((img) => img.url),
      })),
    );
    expect(productRepository.find).toHaveBeenCalled();
  });

  it('should return product findOne by id', async () => {
    const term = '9dab131a-de5f-43dc-8068-b17ef1466258';
    const mockProduct = {
      id: term,
      title: 'IPhone 14',
      price: 100,
      description: 'Incredible phone',
      slug: 'iphone-14',
      stock: 10,
      images: [{ url: 'image1.jpg' }, { url: 'image2.jpg' }],
    } as Product;

    jest.spyOn(productRepository, 'findOneBy').mockResolvedValue(mockProduct);

    const result = await productsService.findOne(term);
    expect(result).toEqual(mockProduct);
    expect(productRepository.findOneBy).toHaveBeenCalledWith({ id: term });
  });

  it('should return product findOne by slug', async () => {
    const term = 'iphone-14';
    const mockProduct = {
      id: '9dab131a-de5f-43dc-8068-b17ef1466258',
      title: 'IPhone 14',
      price: 100,
      description: 'Incredible phone',
      slug: term,
      stock: 10,
      images: [{ url: 'image1.jpg' }, { url: 'image2.jpg' }],
    } as Product;

    const queryBuilder: any = {
      where: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(mockProduct),
    };

    jest
      .spyOn(productRepository, 'createQueryBuilder')
      .mockReturnValue(queryBuilder);

    const result = await productsService.findOne(term);
    expect(result).toEqual(mockProduct);
    expect(productRepository.createQueryBuilder).toHaveBeenCalledWith('prod');
    expect(queryBuilder.where).toHaveBeenCalledWith(
      'UPPER(title) =:title or slug =:slug',
      {
        title: term.toUpperCase(),
        slug: term.toLowerCase(),
      },
    );
  });

  it('should throw NotFoundException if product not found', async () => {
    const term = '4a9f5f86-7e13-4b44-a3ff-5ac493da2e8b';

    jest.spyOn(productRepository, 'findOneBy').mockResolvedValue(null);

    await expect(productsService.findOne(term)).rejects.toThrow(
      `Product with ${term} not found`,
    );
    await expect(productsService.findOne(term)).rejects.toThrow(
      NotFoundException,
    );
    expect(productRepository.findOneBy).toHaveBeenCalledWith({ id: term });
  });

  it('should return product findOnePlain', async () => {
    const term = 'iphone-14';
    const mockProduct = {
      id: '9dab131a-de5f-43dc-8068-b17ef1466258',
      title: 'IPhone 14',
      price: 100,
      description: 'Incredible phone',
      slug: term,
      stock: 10,
      images: [{ url: 'image1.jpg' }, { url: 'image2.jpg' }],
    } as Product;

    jest.spyOn(productsService, 'findOne').mockResolvedValue(mockProduct);

    const result = await productsService.findOnePlain(term);
    expect(result).toEqual({
      id: mockProduct.id,
      title: mockProduct.title,
      price: mockProduct.price,
      description: mockProduct.description,
      slug: mockProduct.slug,
      stock: mockProduct.stock,
      images: mockProduct.images.map((img) => img.url),
    });
    expect(productsService.findOne).toHaveBeenCalledWith(term);
  });

  it('should update a product', async () => {
    const productId = '9dab131a-de5f-43dc-8068-b17ef1466258';
    const updateProductDto = {
      title: 'Updated IPhone 14',
      price: 150,
      description: 'Updated Description',
      slug: 'updated-iphone-14',
      stock: 15,
      images: ['newimage1.jpg', 'newimage2.jpg'],
    } as any;
    const user = { id: 'user-id' } as User;

    const existingProduct = {
      id: productId,
      title: 'IPhone 14',
      price: 100,
      description: 'Incredible phone',
      slug: 'iphone-14',
      stock: 10,
      images: [{ url: 'image1.jpg' }, { url: 'image2.jpg' }],
    } as Product;

    const updatedProduct = {
      ...existingProduct,
      ...updateProductDto,
      images: updateProductDto.images.map((url) => ({ url })),
    } as Product;

    jest.spyOn(productRepository, 'preload').mockResolvedValue(updatedProduct);
    jest.spyOn(productRepository, 'save').mockResolvedValue(updatedProduct);
    jest
      .spyOn(productImageRepository, 'create')
      .mockImplementation((dataSource) => dataSource as any);
    const queryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        delete: jest.fn(),
        save: jest.fn(),
      },
    };
    jest
      .spyOn(dataSource, 'createQueryRunner')
      .mockReturnValue(queryRunner as any);
    jest
      .spyOn(productsService, 'findOnePlain')
      .mockResolvedValue(updatedProduct as any);

    const result = await productsService.update(
      productId,
      updateProductDto,
      user,
    );
    expect(result).toEqual(updatedProduct);
    expect(productRepository.preload).toHaveBeenCalled();
    expect(queryRunner.manager.delete).toHaveBeenCalledWith(ProductImage, {
      product: { id: productId },
    });
    expect(queryRunner.manager.save).toHaveBeenCalledWith(updatedProduct);
    expect(queryRunner.commitTransaction).toHaveBeenCalled();
    expect(queryRunner.release).toHaveBeenCalled();
    expect(productsService.findOnePlain).toHaveBeenCalledWith(productId);
  });

  it('should throw NotFoundException if update product not found', async () => {
    const productId = 'non-existent-id';
    const updateProductDto = {
      title: 'Updated IPhone 14',
      price: 150,
      description: 'Updated Description',
      slug: 'updated-iphone-14',
      stock: 15,
      images: ['newimage1.jpg', 'newimage2.jpg'],
    } as any;
    const user = { id: 'user-id' } as User;

    jest.spyOn(productRepository, 'preload').mockResolvedValue(null);

    await expect(
      productsService.update(productId, updateProductDto, user),
    ).rejects.toThrow(`Product with id: ${productId} not found`);
    await expect(
      productsService.update(productId, updateProductDto, user),
    ).rejects.toThrow(NotFoundException);
  });

  it('should rollback transaction if update fails', async () => {
    const productId = '9dab131a-de5f-43dc-8068-b17ef1466258';
    const updateProductDto = {
      title: 'Updated IPhone 14',
      price: 150,
      description: 'Updated Description',
      slug: 'updated-iphone-14',
      stock: 15,
      images: ['newimage1.jpg', 'newimage2.jpg'],
    } as any;
    const user = { id: 'user-id' } as User;

    const existingProduct = {
      id: productId,
      title: 'IPhone 14',
      price: 100,
      description: 'Incredible phone',
      slug: 'iphone-14',
      stock: 10,
      images: [{ url: 'image1.jpg' }, { url: 'image2.jpg' }],
    } as Product;

    const updatedProduct = {
      ...existingProduct,
      ...updateProductDto,
      images: updateProductDto.images.map((url) => ({ url })),
    } as Product;

    jest.spyOn(productRepository, 'preload').mockResolvedValue(updatedProduct);
    const queryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        delete: jest.fn(),
        save: jest.fn().mockImplementation(() => {
          throw new Error('Update product failed, rollback transaction');
        }),
      },
    };
    jest
      .spyOn(dataSource, 'createQueryRunner')
      .mockReturnValue(queryRunner as any);

    await expect(
      productsService.update(productId, updateProductDto, user),
    ).rejects.toThrow('Unexpected error, check server logs');
    expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    expect(queryRunner.release).toHaveBeenCalled();
  });

  it('should remove a product', async () => {
    const productId = '9dab131a-de5f-43dc-8068-b17ef1466258';
    const mockProduct = {
      id: productId,
      title: 'IPhone 14',
      price: 100,
      description: 'Incredible phone',
      slug: 'iphone-14',
      stock: 10,
      images: [{ url: 'image1.jpg' }, { url: 'image2.jpg' }],
    } as Product;

    jest.spyOn(productsService, 'findOne').mockResolvedValue(mockProduct);
    jest.spyOn(productRepository, 'remove').mockResolvedValue(mockProduct);

    await productsService.remove(productId);
    expect(productsService.findOne).toHaveBeenCalledWith(productId);
    expect(productRepository.remove).toHaveBeenCalledWith(mockProduct);
  });

  it('Delete all products', async () => {
    const queryBuilder: any = {
      delete: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({}),
    };
    jest
      .spyOn(productRepository, 'createQueryBuilder')
      .mockReturnValue(queryBuilder);

    await productsService.deleteAllProducts();
    expect(productRepository.createQueryBuilder).toHaveBeenCalledWith(
      'product',
    );
    expect(queryBuilder.delete).toHaveBeenCalled();
    expect(queryBuilder.execute).toHaveBeenCalled();
  });

  it('Throw Error Delete all products', async () => {
    const queryBuilder: any = {
      delete: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      execute: jest.fn().mockImplementation(() => {
        throw new Error('Error delete products');
      }),
    };
    jest
      .spyOn(productRepository, 'createQueryBuilder')
      .mockReturnValue(queryBuilder);

    await expect(productsService.deleteAllProducts()).rejects.toThrow(
      InternalServerErrorException,
    );
  });
});
