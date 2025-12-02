import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) { }

    async register(registerDto: RegisterDto) {
        const { email, password } = registerDto;

        // Check if user already exists
        const existingUser = await this.prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            throw new BadRequestException('User with this email already exists');
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user (unapproved by default)
        const user = await this.prisma.user.create({
            data: {
                email,
                passwordHash,
                role: 'USER',
                isApproved: false,
            },
            select: {
                id: true,
                email: true,
                role: true,
                isApproved: true,
                createdAt: true,
            },
        });

        return {
            message: 'Registration successful. Please wait for admin approval.',
            user,
        };
    }

    async login(loginDto: LoginDto) {
        const { email, password } = loginDto;

        // Find user
        const user = await this.prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Check if user is approved
        if (!user.isApproved) {
            throw new UnauthorizedException('Your account is pending approval');
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Generate tokens
        const tokens = await this.generateTokens(user.id, user.email, user.role);

        // Save refresh token
        await this.saveRefreshToken(user.id, tokens.refreshToken);

        return {
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                isApproved: user.isApproved,
            },
            ...tokens,
        };
    }

    async refresh(refreshToken: string) {
        try {
            // Verify refresh token
            const payload = this.jwtService.verify(refreshToken, {
                secret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret',
            });

            // Check if refresh token exists in database
            const storedToken = await this.prisma.refreshToken.findUnique({
                where: { token: refreshToken },
            });

            if (!storedToken || storedToken.expiresAt < new Date()) {
                throw new UnauthorizedException('Invalid or expired refresh token');
            }

            // Get user
            const user = await this.prisma.user.findUnique({
                where: { id: payload.sub },
            });

            if (!user || !user.isApproved) {
                throw new UnauthorizedException('User not found or not approved');
            }

            // Generate new tokens
            const tokens = await this.generateTokens(user.id, user.email, user.role);

            // Delete old refresh token and save new one
            await this.prisma.refreshToken.delete({
                where: { token: refreshToken },
            });
            await this.saveRefreshToken(user.id, tokens.refreshToken);

            return tokens;
        } catch (error) {
            throw new UnauthorizedException('Invalid refresh token');
        }
    }

    private async generateTokens(userId: string, email: string, role: string) {
        const payload = { sub: userId, email, role };

        const accessToken = this.jwtService.sign(payload, {
            secret: process.env.JWT_ACCESS_SECRET || 'default-secret-change-this',
            expiresIn: process.env.JWT_ACCESS_EXPIRATION || '15m',
        });

        const refreshToken = this.jwtService.sign(payload, {
            secret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret',
            expiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
        });

        return { accessToken, refreshToken };
    }

    private async saveRefreshToken(userId: string, token: string) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

        await this.prisma.refreshToken.create({
            data: {
                token,
                userId,
                expiresAt,
            },
        });
    }

    async validateUser(userId: string) {
        return this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                role: true,
                isApproved: true,
            },
        });
    }
}
