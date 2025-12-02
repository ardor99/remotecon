import { IsString } from 'class-validator';

export class DevicePollDto {
    @IsString()
    deviceKey: string;
}
