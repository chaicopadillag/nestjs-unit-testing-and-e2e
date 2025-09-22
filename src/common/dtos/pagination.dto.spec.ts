import { plainToClass } from 'class-transformer';
import { PaginationDto } from './pagination.dto';
import { validateSync } from 'class-validator';

describe('PaginationDto', () => {
  let paginationDto: PaginationDto;

  it('should be defined', () => {
    paginationDto = new PaginationDto();
    expect(paginationDto).toBeDefined();
  });

  it('should have default values', () => {
    paginationDto = new PaginationDto();
    expect(paginationDto.limit).toBeUndefined();
    expect(paginationDto.offset).toBeUndefined();
    expect(paginationDto.gender).toBeUndefined();
  });

  it('should accept valid values', () => {
    paginationDto = new PaginationDto();
    paginationDto.limit = 20;
    paginationDto.offset = 5;
    paginationDto.gender = 'kid';

    expect(paginationDto.limit).toBe(20);
    expect(paginationDto.offset).toBe(5);
    expect(paginationDto.gender).toBe('kid');
  });

  it('should reject invalid limit values', async () => {
    paginationDto = plainToClass(PaginationDto, {
      limit: -10,
      offset: -5,
      gender: 'invalid',
    });

    const validationErrors = await validateSync(paginationDto);
    expect(validationErrors.length).toBe(3);
  });

  it('should reject invalid gender values', async () => {
    paginationDto = plainToClass(PaginationDto, { gender: 'invalid' });

    const validGenders = ['men', 'women', 'unisex', 'kid'];
    const validationErrors = await validateSync(paginationDto);
    expect(validationErrors.length).toBe(1);
    expect(validGenders).not.toContain(paginationDto.gender);
  });
});
