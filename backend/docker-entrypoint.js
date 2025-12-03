const { spawnSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

console.log('🐳 Docker Entrypoint Starting...');

function runCommand(command, args) {
    console.log(`\n👉 Running: ${command} ${args.join(' ')}`);
    const result = spawnSync(command, args, { stdio: 'inherit', shell: true });
    if (result.status !== 0) {
        console.error(`❌ Command failed with code ${result.status}`);
        process.exit(1);
    }
    return true;
}

async function seedDatabase() {
    console.log('🌱 Seeding Database...');
    try {
        // Check if admin user exists
        const existingAdmin = await prisma.user.findUnique({
            where: { email: 'admin@remotecon.local' }
        });

        if (existingAdmin) {
            console.log('✅ Admin user already exists, skipping seed');
            return;
        }

        // Create admin user
        const hashedPassword = await bcrypt.hash('admin123', 10);
        const admin = await prisma.user.create({
            data: {
                email: 'admin@remotecon.local',
                password: hashedPassword,
                role: 'ADMIN',
                isApproved: true,
            },
        });

        // Create test device
        await prisma.device.create({
            data: {
                name: 'Main Elevator Switch',
                deviceKey: 'test-device-key-change-this',
            },
        });

        console.log('✅ Database seeded successfully');
    } catch (error) {
        console.error('⚠️  Seed error (might be already seeded):', error.message);
    }
}

async function main() {
    // 1. Wait a bit for DB
    console.log('⏳ Waiting 5s for Database to be ready...');
    spawnSync('sleep', ['5']);

    // 2. Push Schema to DB
    console.log('🔄 Pushing Prisma Schema to Database...');
    runCommand('prisma', ['db', 'push', '--accept-data-loss']);

    // 3. Seed Database directly
    await seedDatabase();

    // 4. Close Prisma connection
    await prisma.$disconnect();

    // 5. Start Application
    console.log('🚀 Starting Application...');
    runCommand('node', ['dist/main']);
}

main().catch(async (error) => {
    console.error('💥 Fatal error:', error);
    await prisma.$disconnect();
    process.exit(1);
});
