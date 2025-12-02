import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SetManualSwitchDto, SetAutoSwitchDto } from './dto/set-switch-state.dto';
import { DevicePollDto } from './dto/device-poll.dto';

@Controller('devices')
export class DevicesController {
    constructor(private devicesService: DevicesService) { }

    @Get()
    @UseGuards(JwtAuthGuard)
    async getAllDevices() {
        return this.devicesService.getAllDevices();
    }

    @Get('admin/devices')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    async getDevicesWithState() {
        return this.devicesService.getDevicesWithState();
    }

    @Get(':id/state')
    @UseGuards(JwtAuthGuard)
    async getCurrentState(@Param('id') id: string) {
        return this.devicesService.getCurrentState(id);
    }

    @Post(':id/state/manual')
    @UseGuards(JwtAuthGuard)
    async setManualState(
        @Param('id') id: string,
        @Request() req,
        @Body() dto: SetManualSwitchDto,
    ) {
        return this.devicesService.setManualState(id, req.user.id, dto);
    }

    @Post(':id/state/auto')
    @UseGuards(JwtAuthGuard)
    async setAutoState(
        @Param('id') id: string,
        @Request() req,
        @Body() dto: SetAutoSwitchDto,
    ) {
        return this.devicesService.setAutoState(id, req.user.id, dto);
    }

    // ESP32 polling endpoint (no JWT, uses deviceKey)
    @Post(':id/poll')
    async devicePoll(@Param('id') id: string, @Body() dto: DevicePollDto) {
        return this.devicesService.devicePoll(id, dto.deviceKey);
    }
}
