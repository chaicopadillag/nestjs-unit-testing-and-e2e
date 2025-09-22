import { createParamDecorator } from '@nestjs/common';
import { RawHeaders } from './raw-headers.decorator';

jest.mock('@nestjs/common', () => ({
  createParamDecorator: jest.fn().mockImplementation((fn) => fn),
}));

describe('RawHeadersDecorator', () => {
  it('should be defined', () => {
    expect(RawHeaders).toBeDefined();
  });

  it('should return raw headers from request', () => {
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          rawHeaders: ['Authorization', 'Bearer token'],
        }),
      }),
    } as any;

    const result = (RawHeaders as any)(null, mockContext);
    expect(result).toEqual(['Authorization', 'Bearer token']);
    expect(createParamDecorator).toHaveBeenCalledWith(expect.any(Function));
  });
});
