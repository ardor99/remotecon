import { IsOptional, IsNumber, IsArray, IsString, Min } from 'class-validator';

export class UpdateUserSettingsDto {
    @IsOptional()
    @IsNumber()
    homeLatitude?: number;

    @IsOptional()
    @IsNumber()
    homeLongitude?: number;

    @IsOptional()
    @IsNumber()
    @Min(50)
    homeRadiusMeters?: number;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    homeWifiSsids?: string[];
}
