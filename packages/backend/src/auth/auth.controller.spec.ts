import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    signup: jest.fn(),
    login: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('signup', () => {
    it('should call authService.signup and return result', async () => {
      const dto: SignupDto = { username: 'testuser', email: 'test@example.com', password: 'password123' };
      const expectedResult = { id: 'uuid', username: 'testuser', email: 'test@example.com', createdAt: new Date(), updatedAt: new Date(), reputationScore: 0, inAppCurrencyBalance: 1000 };
      
      mockAuthService.signup.mockResolvedValue(expectedResult);
      
      const result = await controller.signup(dto);
      expect(authService.signup).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('login', () => {
    it('should call authService.login and return result', async () => {
      const dto: LoginDto = { email: 'test@example.com', password: 'password123' };
      const expectedResult = { accessToken: 'token', user: { id: 'uuid', username: 'testuser', email: 'test@example.com' } };
      
      mockAuthService.login.mockResolvedValue(expectedResult);
      
      const result = await controller.login(dto);
      expect(authService.login).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResult);
    });
  });
});
