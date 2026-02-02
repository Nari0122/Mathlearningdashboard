import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findFirst({
        where: { name: '이찬주' },
        include: { units: true }
    });

    if (!user) {
        console.log('User 이찬주 not found');
        return;
    }

    console.log(`User: ${user.name} (ID: ${user.id})`);
    console.log(`Units count: ${user.units.length}`);
    console.log('Units:', JSON.stringify(user.units, null, 2));
}

main()
    .catch((e) => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
