import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
    let service: AuthService;
    let prismaService: PrismaService;
    let jwtService: JwtService;

    const mockPrismaService = {
        user: {
            findUnique: jest.fn(),
            create: jest.fn(),
        },
        refreshToken: {
            findUnique: jest.fn(),
            create: jest.fn(),
            delete: jest.fn(),
        },
    };

    const mockJwtService = {
        sign: jest.fn(),
        verify: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
                {
                    provide: JwtService,
                    useValue: mockJwtService,
                },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
        prismaService = module.get<PrismaService>(PrismaService);
        jwtService = module.get<JwtService>(JwtService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('register', () => {
        it('should create a new unapproved user', async () => {
            const registerDto = {
                email: 'test@example.com',
                password: 'password123',
            };

            mockPrismaService.user.findUnique.mockResolvedValue(null);
            mockPrismaService.user.create.mockResolvedValue({
                id: '1',
                email: registerDto.email,
                role: 'USER',
                isApproved: false,
                createdAt: new Date(),
            });

            const result = await service.register(registerDto);

            expect(result.user.isApproved).toBe(false);
            expect(result.user.email).toBe(registerDto.email);
        });

        it('should throw error if user already exists', async () => {
            const registerDto = {
                email: 'test@example.com',
                password: 'password123',
            };

            mockPrismaService.user.findUnique.mockResolvedValue({
                id: '1',
                email: registerDto.email,
            });

            await expect(service.register(registerDto)).rejects.toThrow('User with this email already exists');
        });
    });

    describe('login', () => {
        it('should reject unapproved users', async () => {
            const loginDto = {
                email: 'test@example.com',
                password: 'password123',
            };

            mockPrismaService.user.findUnique.mockResolvedValue({
                id: '1',
                email: loginDto.email,
                passwordHash: await bcrypt.hash(loginDto.password, 10),
                isApproved: false,
            });

            await expect(service.login(loginDto)).rejects.toThrow('Your account is pending approval');
        });

        it('should login approved user successfully', async () => {
            const loginDto = {
                email: 'test@example.com',
                password: 'password123',
            };

            const hashedPassword = await bcrypt.hash(loginDto.password, 10);

            mockPrismaService.user.findUnique.mockResolvedValue({
                id: '1',
                email: loginDto.email,
                passwordHash: hashedPassword,
                role: 'USER',
                isApproved: true,
            });

            mockJwtService.sign.mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');

            mockPrismaService.refreshToken.create.mockResolvedValue({});

            const result = await service.login(loginDto);

            expect(result.accessToken).toBe('access-token');
            expect(result.refreshToken).toBe('refresh-token');
            expect(result.user.email).toBe(loginDto.email);
        });
    });
});
