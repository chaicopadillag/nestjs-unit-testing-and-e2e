import { validate } from 'class-validator';
import { LoginUserDto } from './login-user.dto';

describe('LoginUserDto', () => {
  let loginUserDto: LoginUserDto;

  it('should be defined', () => {
    loginUserDto = new LoginUserDto();
    expect(loginUserDto).toBeDefined();
  });

  it('should have email and password properties', () => {
    const userLogin = new LoginUserDto();
    userLogin.email = 'Dahlia.Cremin@hotmail.com';
    userLogin.password = '123456';

    expect(userLogin).toHaveProperty('email');
    expect(userLogin).toHaveProperty('password');
  });

  it('should user login validate not errors ', async () => {
    const userLogin = new LoginUserDto();
    userLogin.email = 'dahliacremin@hotmail.com';
    userLogin.password = '123456$#Aa';
    const errors = await validate(userLogin);
    expect(errors.length).toBe(0);
  });
});
