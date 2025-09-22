import e from 'express';
import { CreateUserDto } from './create-user.dto';
import { validate } from 'class-validator';

describe('CreateUserDto', () => {
  let createUserDto: CreateUserDto;

  it('should be defined', () => {
    createUserDto = new CreateUserDto();
    expect(createUserDto).toBeDefined();
  });

  it('should have email, password and fullName properties', () => {
    const data = {
      email: 'Derrick.Kulas56@gmail.com',
      password: 'Password123',
      fullName: 'Derrick Kulas',
    };
    createUserDto = Object.assign(new CreateUserDto(), data);

    expect(createUserDto).toHaveProperty('email');
    expect(createUserDto).toHaveProperty('password');
    expect(createUserDto).toHaveProperty('fullName');
  });

  it('should empty errors data success', () => {
    const data = {
      email: 'Derrick.Kulas56@gmail.com',
      password: 'Password123',
      fullName: 'Derrick Kulas',
    };
    createUserDto = Object.assign(new CreateUserDto(), data);
    const errors = validate(createUserDto);
    expect(errors).resolves.toEqual([]);
  });
});
