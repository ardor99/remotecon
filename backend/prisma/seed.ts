import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database...');

    // Create admin user
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@remotecon.local' },
        update: {},
        create: {
            email: 'admin@remotecon.local',
            passwordHash: adminPasswordHash,
            role: 'ADMIN',
            isApproved: true,
        },
    });
    console.log('Created admin user:', admin.email);

    // Create a test device
    const device = await prisma.device.upsert({
        where: { deviceKey: 'test-device-key-12345' },
        update: {},
        create: {
            name: 'Home Elevator ESP32',
            deviceKey: 'test-device-key-12345',
            isActive: true,
        },
    });
    console.log('Created test device:', device.name);

    // Create initial switch state (OFF)
    const switchState = await prisma.switchState.create({
        data: {
            deviceId: device.id,
            mode: 'OFF',
            pulseIntervalSeconds: 10,
            pulseOnMillis: 500,
            validUntil: null,
        },
    });
    console.log('Created initial switch state:', switchState.mode);

    console.log('Seeding complete!');
}

main()
    .catch((e) => {
        console.error('Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
