import { Controller, Get, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UpdateUserSettingsDto } from './dto/update-user-settings.dto';

@Controller()
export class UsersController {
    constructor(private usersService: UsersService) { }

    // Admin endpoints
    @Get('admin/users')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    async getAllUsers() {
        return this.usersService.getAllUsers();
    }

    @Patch('admin/users/:id/approve')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    async approveUser(@Param('id') id: string) {
        return this.usersService.approveUser(id);
    }

    @Patch('admin/users/:id/reject')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    async rejectUser(@Param('id') id: string) {
        return this.usersService.rejectUser(id);
    }

    // User endpoints
    @Get('users/me')
    @UseGuards(JwtAuthGuard)
    async getCurrentUser(@Request() req) {
        return this.usersService.getCurrentUser(req.user.id);
    }

    @Patch('users/me/settings')
    @UseGuards(JwtAuthGuard)
    async updateSettings(@Request() req, @Body() dto: UpdateUserSettingsDto) {
        return this.usersService.updateUserSettings(req.user.id, dto);
    }
}
