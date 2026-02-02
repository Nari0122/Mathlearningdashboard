
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const student = await prisma.user.findFirst({
        where: { role: 'student' },
    });

    if (!student) {
        console.error('No student found');
        return;
    }

    console.log(`Resetting units for student: ${student.name} (${student.id})`);

    // Delete existing units
    await prisma.unit.deleteMany({
        where: { userId: student.id },
    });

    console.log('Deleted existing units.');

    // Create example units
    const examples = [
        { name: '다항식의 연산', grade: '고1', difficulty: '중' },
        { name: '항등식과 나머지정리', grade: '고1', difficulty: '상' },
        { name: '인수분해', grade: '고1', difficulty: '하' },
        { name: '복소수', grade: '고1', difficulty: '중' },
        { name: '이차방정식', grade: '고1', difficulty: '중' },
    ];

    for (const ex of examples) {
        await prisma.unit.create({
            data: {
                userId: student.id,
                name: ex.name,
                grade: ex.grade,
                status: 'MID',
                selectedDifficulty: ex.difficulty,
                completionStatus: 'incomplete',
                errorC: 0,
                errorM: 0,
                errorR: 0,
                errorS: 0,
            },
        });
    }

    console.log('Created example units.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
