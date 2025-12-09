import { Test, TestingModule } from '@nestjs/testing';
import { DevicesService } from './devices.service';
import { TriggerType } from './dto/set-switch-state.dto';
import { PrismaService } from '../prisma/prisma.service';

describe('DevicesService', () => {
    let service: DevicesService;
    let prismaService: PrismaService;

    const mockPrismaService = {
        device: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
        switchState: {
            findFirst: jest.fn(),
            create: jest.fn(),
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DevicesService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
            ],
        }).compile();

        service = module.get<DevicesService>(DevicesService);
        prismaService = module.get<PrismaService>(PrismaService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getCurrentState', () => {
        it('should return OFF for expired states', async () => {
            const deviceId = 'device-1';
            const expiredState = {
                id: '1',
                deviceId,
                mode: 'PULSE',
                pulseIntervalSeconds: 10,
                pulseOnMillis: 500,
                validUntil: new Date(Date.now() - 60000), // 1 minute ago
                createdAt: new Date(),
            };

            mockPrismaService.device.findUnique.mockResolvedValue({
                id: deviceId,
                name: 'Test Device',
            });

            mockPrismaService.switchState.findFirst.mockResolvedValue(expiredState);

            const result = await service.getCurrentState(deviceId);

            expect(result.mode).toBe('OFF');
            expect(result.isActive).toBe(false);
        });

        it('should return active state for valid states', async () => {
            const deviceId = 'device-1';
            const activeState = {
                id: '1',
                deviceId,
                mode: 'PULSE',
                pulseIntervalSeconds: 10,
                pulseOnMillis: 500,
                validUntil: new Date(Date.now() + 60000), // 1 minute from now
                createdAt: new Date(),
            };

            mockPrismaService.device.findUnique.mockResolvedValue({
                id: deviceId,
                name: 'Test Device',
            });

            mockPrismaService.switchState.findFirst.mockResolvedValue(activeState);

            const result = await service.getCurrentState(deviceId);

            expect(result.mode).toBe('PULSE');
            expect(result.isActive).toBe(true);
        });

        it('should return active state for null validUntil', async () => {
            const deviceId = 'device-1';
            const activeState = {
                id: '1',
                deviceId,
                mode: 'PULSE',
                pulseIntervalSeconds: 10,
                pulseOnMillis: 500,
                validUntil: null, // No expiration
                createdAt: new Date(),
            };

            mockPrismaService.device.findUnique.mockResolvedValue({
                id: deviceId,
                name: 'Test Device',
            });

            mockPrismaService.switchState.findFirst.mockResolvedValue(activeState);

            const result = await service.getCurrentState(deviceId);

            expect(result.mode).toBe('PULSE');
            expect(result.isActive).toBe(true);
        });
    });

    describe('setAutoState', () => {
        it('should calculate validUntil correctly', async () => {
            const deviceId = 'device-1';
            const userId = 'user-1';
            const dto = {
                trigger: TriggerType.GPS,
                durationMinutes: 20,
            };

            mockPrismaService.device.findUnique.mockResolvedValue({
                id: deviceId,
                name: 'Test Device',
            });

            mockPrismaService.switchState.create.mockImplementation((args) => {
                return Promise.resolve({
                    id: '1',
                    ...args.data,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
            });

            const beforeTime = Date.now();
            await service.setAutoState(deviceId, userId, dto);
            const afterTime = Date.now();

            const createCall = mockPrismaService.switchState.create.mock.calls[0][0];
            const validUntil = createCall.data.validUntil.getTime();

            // Verify validUntil is approximately 20 minutes from now
            expect(validUntil).toBeGreaterThanOrEqual(beforeTime + 20 * 60000);
            expect(validUntil).toBeLessThanOrEqual(afterTime + 20 * 60000);
        });
    });
});
