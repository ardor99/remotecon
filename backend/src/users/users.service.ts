import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserSettingsDto } from './dto/update-user-settings.dto';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async getAllUsers() {
        return this.prisma.user.findMany({
            select: {
                id: true,
                email: true,
                role: true,
                isApproved: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async approveUser(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return this.prisma.user.update({
            where: { id: userId },
            data: { isApproved: true },
            select: {
                id: true,
                email: true,
                role: true,
                isApproved: true,
            },
        });
    }

    async rejectUser(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return this.prisma.user.update({
            where: { id: userId },
            data: { isApproved: false },
            select: {
                id: true,
                email: true,
                role: true,
                isApproved: true,
            },
        });
    }

    async getCurrentUser(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                role: true,
                isApproved: true,
                createdAt: true,
                userSettings: true,
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return user;
    }

    async updateUserSettings(userId: string, dto: UpdateUserSettingsDto) {
        // Check if user exists
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Upsert user settings
        const settings = await this.prisma.userSettings.upsert({
            where: { userId },
            create: {
                userId,
                ...dto,
            },
            update: dto,
        });

        return settings;
    }
}
