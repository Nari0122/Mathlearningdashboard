const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Seeding data...');

    // 1. Create Admin
    const admin = await prisma.user.upsert({
        where: { loginId: 'admin' },
        update: {},
        create: {
            loginId: 'admin',
            password: 'admin',
            name: '관리자',
            role: 'admin'
        }
    });

    // 2. Create Student
    const student = await prisma.user.upsert({
        where: { loginId: 'student1' },
        update: {},
        create: {
            loginId: 'student1', // Changed to match "student1" from prompt
            password: '123',
            name: '강나리',
            role: 'student',
            profile: {
                create: {
                    grade: '고2',
                    class: '1반',
                    statusSummary: '양호'
                }
            }
        }
    });

    // 3. Create Sample Units
    const units = [
        { name: "집합과 명제", status: "HIGH", selectedDifficulty: "상", completionStatus: "completed", errorC: 2, errorM: 1, errorS: 1 },
        { name: "함수", status: "MID", selectedDifficulty: "중", completionStatus: "in-progress", errorC: 1, errorM: 2, errorR: 1 },
        { name: "방정식과 부등식", status: "LOW", selectedDifficulty: "하", completionStatus: "completed", errorM: 1, errorS: 1 },
        { name: "도형의 방정식", status: "MID", selectedDifficulty: "상", completionStatus: "incomplete", errorC: 2, errorR: 1, errorS: 2 }
    ];

    for (const u of units) {
        await prisma.unit.create({
            data: {
                userId: student.id,
                name: u.name,
                status: u.status,
                selectedDifficulty: u.selectedDifficulty,
                completionStatus: u.completionStatus,
                errorC: u.errorC || 0,
                errorM: u.errorM || 0,
                errorR: u.errorR || 0,
                errorS: u.errorS || 0
            }
        });
    }

    // 4. Learning History
    await prisma.learningRecord.create({
        data: {
            userId: student.id,
            date: '2026-01-12',
            progress: '집합과 명제 3-2단원 완료',
            comment: '개념 이해도 우수. 다음 시간 문제 풀이 예정.',
            createdBy: 'admin'
        }
    });

    // 5. Homework
    const homeworks = [
        {
            title: '수학 문제집 p.24-28',
            description: '이차방정식 연습문제 풀이',
            assignedDate: '2026-01-24',
            dueDate: '2026-01-29',
            status: 'pending',
            feedback: ''
        },
        {
            title: '함수 그래프 그리기',
            description: '3개 함수 그래프 노트에 작성',
            assignedDate: '2026-01-20',
            dueDate: '2026-01-24',
            status: 'submitted',
            feedback: '잘 했습니다!'
        }
    ];

    for (const hw of homeworks) {
        await prisma.homework.create({
            data: {
                userId: student.id,
                ...hw
            }
        });
    }

    console.log('Seeding finished.');
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
