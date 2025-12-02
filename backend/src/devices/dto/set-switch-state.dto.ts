import { IsEnum, IsOptional, IsInt, Min, IsDateString } from 'class-validator';

export enum SwitchMode {
    OFF = 'OFF',
    PULSE = 'PULSE',
    CONTINUOUS = 'CONTINUOUS',
}

export class SetManualSwitchDto {
    @IsEnum(SwitchMode)
    mode: SwitchMode;

    @IsOptional()
    @IsInt()
    @Min(1)
    pulseIntervalSeconds?: number;

    @IsOptional()
    @IsInt()
    @Min(50)
    pulseOnMillis?: number;

    @IsOptional()
    @IsDateString()
    validUntil?: string; // ISO datetime string or null
}

export class SetAutoSwitchDto {
    @IsEnum(['GPS', 'WIFI'])
    trigger: 'GPS' | 'WIFI';

    @IsInt()
    @Min(1)
    durationMinutes: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    pulseIntervalSeconds?: number;

    @IsOptional()
    @IsInt()
    @Min(50)
    pulseOnMillis?: number;
}
