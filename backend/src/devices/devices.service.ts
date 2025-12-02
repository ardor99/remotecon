import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SetManualSwitchDto, SetAutoSwitchDto } from './dto/set-switch-state.dto';

@Injectable()
export class DevicesService {
    constructor(private prisma: PrismaService) { }

    async getAllDevices() {
        return this.prisma.device.findMany({
            select: {
                id: true,
                name: true,
                isActive: true,
                lastPollAt: true,
                createdAt: true,
            },
        });
    }

    async getDevicesWithState() {
        const devices = await this.prisma.device.findMany({
            include: {
                switchStates: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
        });

        return devices.map((device) => ({
            id: device.id,
            name: device.name,
            isActive: device.isActive,
            lastPollAt: device.lastPollAt,
            createdAt: device.createdAt,
            currentState: device.switchStates[0] || null,
        }));
    }

    async getCurrentState(deviceId: string) {
        const device = await this.prisma.device.findUnique({
            where: { id: deviceId },
        });

        if (!device) {
            throw new NotFoundException('Device not found');
        }

        // Get the latest switch state
        const latestState = await this.prisma.switchState.findFirst({
            where: { deviceId },
            orderBy: { createdAt: 'desc' },
        });

        if (!latestState) {
            // Return default OFF state if no state exists
            return {
                mode: 'OFF',
                pulseIntervalSeconds: 10,
                pulseOnMillis: 500,
                validUntil: null,
                isActive: false,
            };
        }

        // Check if state is still valid
        const isActive = this.isStateActive(latestState);

        return {
            mode: isActive ? latestState.mode : 'OFF',
            pulseIntervalSeconds: latestState.pulseIntervalSeconds,
            pulseOnMillis: latestState.pulseOnMillis,
            validUntil: latestState.validUntil,
            isActive,
        };
    }

    async setManualState(deviceId: string, userId: string, dto: SetManualSwitchDto) {
        const device = await this.prisma.device.findUnique({
            where: { id: deviceId },
        });

        if (!device) {
            throw new NotFoundException('Device not found');
        }

        const validUntil = dto.validUntil ? new Date(dto.validUntil) : null;

        const newState = await this.prisma.switchState.create({
            data: {
                deviceId,
                mode: dto.mode,
                pulseIntervalSeconds: dto.pulseIntervalSeconds || 10,
                pulseOnMillis: dto.pulseOnMillis || 500,
                validUntil,
                lastUpdatedByUserId: userId,
            },
        });

        return {
            message: 'Switch state updated',
            state: newState,
        };
    }

    async setAutoState(deviceId: string, userId: string, dto: SetAutoSwitchDto) {
        const device = await this.prisma.device.findUnique({
            where: { id: deviceId },
        });

        if (!device) {
            throw new NotFoundException('Device not found');
        }

        // Calculate validUntil based on trigger type
        const now = new Date();
        const validUntil = new Date(now.getTime() + dto.durationMinutes * 60000);

        const newState = await this.prisma.switchState.create({
            data: {
                deviceId,
                mode: 'PULSE',
                pulseIntervalSeconds: dto.pulseIntervalSeconds || 10,
                pulseOnMillis: dto.pulseOnMillis || 500,
                validUntil,
                lastUpdatedByUserId: userId,
            },
        });

        return {
            message: `Auto-unlock activated (${dto.trigger}) for ${dto.durationMinutes} minutes`,
            state: newState,
        };
    }

    async devicePoll(deviceId: string, deviceKey: string) {
        // Authenticate device
        const device = await this.prisma.device.findUnique({
            where: { id: deviceId },
        });

        if (!device || device.deviceKey !== deviceKey) {
            throw new UnauthorizedException('Invalid device credentials');
        }

        // Update last poll timestamp
        await this.prisma.device.update({
            where: { id: deviceId },
            data: { lastPollAt: new Date() },
        });

        // Get current state
        const state = await this.getCurrentState(deviceId);

        return {
            mode: state.isActive ? state.mode : 'OFF',
            pulseIntervalSeconds: state.pulseIntervalSeconds,
            pulseOnMillis: state.pulseOnMillis,
            validUntil: state.validUntil ? state.validUntil.toISOString() : null,
        };
    }

    private isStateActive(state: any): boolean {
        if (state.mode === 'OFF') {
            return false;
        }

        if (!state.validUntil) {
            return true; // No expiration
        }

        return new Date() < new Date(state.validUntil);
    }
}
