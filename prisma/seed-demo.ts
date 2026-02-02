import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding demo data...');

    // 1. Delete existing test student if exists
    const existingUser = await prisma.user.findUnique({
        where: { loginId: 'teststudent' }
    });

    if (existingUser) {
        // Delete related data first
        await prisma.incorrectNote.deleteMany({ where: { userId: existingUser.id } });
        await prisma.exam.deleteMany({ where: { userId: existingUser.id } });
        await prisma.homework.deleteMany({ where: { userId: existingUser.id } });
        await prisma.schedule.deleteMany({ where: { userId: existingUser.id } });
        await prisma.learningRecord.deleteMany({ where: { userId: existingUser.id } });
        await prisma.unit.deleteMany({ where: { userId: existingUser.id } });
        await prisma.studentProfile.deleteMany({ where: { userId: existingUser.id } });
        await prisma.user.delete({ where: { id: existingUser.id } });
        console.log('✅ Deleted existing test student data');
    }

    // 2. Create Test Student User
    const testStudent = await prisma.user.create({
        data: {
            loginId: 'teststudent',
            password: 'test123',
            name: '김민준',
            role: 'student',
            isActive: true,
        }
    });
    console.log(`✅ Created test student: ${testStudent.name} (ID: ${testStudent.id})`);

    // 3. Create Student Profile
    await prisma.studentProfile.create({
        data: {
            userId: testStudent.id,
            grade: '고1',
            class: '3반',
            email: 'minjun.kim@example.com',
            phone: '010-1234-5678',
            parentPhone: '010-9876-5432',
            parentRelation: '모',
            statusSummary: '양호',
        }
    });
    console.log('✅ Created student profile');

    // 4. Create Units (Learning Units)
    const units = await Promise.all([
        prisma.unit.create({
            data: {
                userId: testStudent.id,
                name: '다항식의 연산',
                grade: '고1',
                subject: '공통수학1',
                status: 'HIGH',
                selectedDifficulty: '상',
                completionStatus: 'completed',
                errorC: 3, errorM: 5, errorR: 2, errorS: 1,
            }
        }),
        prisma.unit.create({
            data: {
                userId: testStudent.id,
                name: '나머지 정리와 인수분해',
                grade: '고1',
                subject: '공통수학1',
                status: 'MID',
                selectedDifficulty: '중',
                completionStatus: 'completed',
                errorC: 2, errorM: 4, errorR: 3, errorS: 2,
            }
        }),
        prisma.unit.create({
            data: {
                userId: testStudent.id,
                name: '복소수와 이차방정식',
                grade: '고1',
                subject: '공통수학1',
                status: 'HIGH',
                selectedDifficulty: '상',
                completionStatus: 'in-progress',
                errorC: 4, errorM: 6, errorR: 1, errorS: 3,
            }
        }),
        prisma.unit.create({
            data: {
                userId: testStudent.id,
                name: '이차함수와 이차부등식',
                grade: '고1',
                subject: '공통수학1',
                status: 'LOW',
                selectedDifficulty: '중',
                completionStatus: 'incomplete',
                errorC: 1, errorM: 2, errorR: 0, errorS: 1,
            }
        }),
        prisma.unit.create({
            data: {
                userId: testStudent.id,
                name: '직선의 방정식',
                grade: '고1',
                subject: '공통수학2',
                status: 'MID',
                selectedDifficulty: '하',
                completionStatus: 'completed',
                errorC: 2, errorM: 3, errorR: 4, errorS: 2,
            }
        }),
        prisma.unit.create({
            data: {
                userId: testStudent.id,
                name: '원의 방정식',
                grade: '고1',
                subject: '공통수학2',
                status: 'HIGH',
                selectedDifficulty: '상',
                completionStatus: 'in-progress',
                errorC: 5, errorM: 7, errorR: 2, errorS: 4,
            }
        }),
    ]);
    console.log(`✅ Created ${units.length} units`);

    // 5. Create Learning Records (학습 기록)
    const today = new Date();
    const progressOptions = [
        '다항식 연산 복습 완료', '인수분해 문제 풀이 20문항', '이차방정식 개념 정리',
        '복소수 연습문제 완료', '직선의 방정식 오답 정리', '원의 방정식 기본 문제',
        '중간고사 대비 복습', '쎈수학 45~60번 풀이', '실력문제 도전', '취약 단원 보충 학습'
    ];
    const commentOptions = [
        '오늘 집중력이 좋았어요. 계산 실수가 줄었습니다.', '개념 이해도가 향상되고 있습니다.',
        '어려운 문제에도 끈기있게 도전했습니다.', '복습이 필요한 부분을 파악했습니다.',
        '문제 풀이 속도가 빨라졌어요.', '응용문제 접근법을 잘 익혔습니다.',
        '계산 과정을 더 꼼꼼히 적도록 지도했습니다.', '자신감이 많이 생겼습니다.',
        '다음 시간에 오답 복습 예정입니다.', '전체적으로 양호한 학습 태도입니다.'
    ];

    for (let i = 0; i < 20; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i * 2);
        await prisma.learningRecord.create({
            data: {
                userId: testStudent.id,
                date: date.toISOString().split('T')[0],
                progress: progressOptions[i % progressOptions.length],
                comment: commentOptions[i % commentOptions.length],
                createdBy: i % 3 === 0 ? 'student' : 'admin',
            }
        });
    }
    console.log('✅ Created 20 learning records');

    // 6. Create Schedules (수업 일정)
    // Regular weekly schedule
    for (const reg of [
        { dayOfWeek: '월요일', startTime: '16:00', endTime: '18:00' },
        { dayOfWeek: '수요일', startTime: '16:00', endTime: '18:00' },
        { dayOfWeek: '금요일', startTime: '14:00', endTime: '16:00' },
    ]) {
        await prisma.schedule.create({
            data: {
                userId: testStudent.id,
                dayOfWeek: reg.dayOfWeek,
                startTime: reg.startTime,
                endTime: reg.endTime,
                status: 'scheduled',
                isRegular: true,
            }
        });
    }

    // Specific date schedules
    let sessionNum = 1;
    for (let weekOffset = 0; weekOffset < 4; weekOffset++) {
        for (let dayOffset of [0, 2, 4]) {
            const scheduleDate = new Date(today);
            scheduleDate.setDate(scheduleDate.getDate() - scheduleDate.getDay() + 1 + dayOffset + (weekOffset * 7));
            const dateStr = scheduleDate.toISOString().split('T')[0];
            const isPast = scheduleDate < today;

            await prisma.schedule.create({
                data: {
                    userId: testStudent.id,
                    date: dateStr,
                    startTime: dayOffset === 4 ? '14:00' : '16:00',
                    endTime: dayOffset === 4 ? '16:00' : '18:00',
                    status: isPast ? 'completed' : 'scheduled',
                    notes: isPast ? `${sessionNum}회차 수업 완료` : `${sessionNum}회차 수업 예정`,
                    isRegular: false,
                    sessionNumber: sessionNum,
                }
            });
            sessionNum++;
        }
    }
    console.log('✅ Created schedules');

    // 7. Create Homeworks (숙제)
    const homeworks = [
        { title: '쎈수학 다항식 45-60번', description: '다항식의 연산 복습 문제입니다.', assigned: -14, due: -10, status: 'submitted', feedback: '잘 풀었습니다. 51번에서 계산 실수가 있었어요.' },
        { title: '인수분해 개념정리 노트 작성', description: '인수분해 공식과 예제를 정리해오세요.', assigned: -10, due: -7, status: 'submitted', feedback: '깔끔하게 정리했네요!' },
        { title: '복소수 연습문제 p.78-82', description: '복소수의 사칙연산 연습문제입니다.', assigned: -7, due: -3, status: 'submitted', feedback: '대부분 맞았습니다.' },
        { title: '이차방정식 응용문제 10문항', description: '근과 계수의 관계 응용문제입니다.', assigned: -3, due: 2, status: 'pending', feedback: null },
        { title: '중간고사 대비 모의고사', description: '60분 제한시간 내에 풀어보세요.', assigned: 0, due: 7, status: 'pending', feedback: null },
    ];

    for (const hw of homeworks) {
        await prisma.homework.create({
            data: {
                userId: testStudent.id,
                title: hw.title,
                description: hw.description,
                assignedDate: getDateString(hw.assigned),
                dueDate: getDateString(hw.due),
                status: hw.status,
                feedback: hw.feedback,
            }
        });
    }
    console.log('✅ Created 5 homeworks');

    // 8. Create Exams (시험 기록)
    const exams = [
        { type: '단원평가', subject: '공통수학1', days: -60, score: 78, notes: '다항식 단원 - 계산 실수 주의' },
        { type: '1학기 중간고사', subject: '수학', days: -45, score: 82, notes: '전체적으로 양호' },
        { type: '단원평가', subject: '공통수학1', days: -30, score: 85, notes: '인수분해 단원 - 향상됨' },
        { type: '모의고사', subject: '수학', days: -20, score: 88, notes: '시간 관리 잘함' },
        { type: '1학기 기말고사', subject: '수학', days: -10, score: 91, notes: '우수! 꾸준한 성장세' },
    ];

    for (const exam of exams) {
        await prisma.exam.create({
            data: {
                userId: testStudent.id,
                examType: exam.type,
                subject: exam.subject,
                date: getDateString(exam.days),
                score: exam.score,
                maxScore: 100,
                notes: exam.notes,
            }
        });
    }
    console.log('✅ Created 5 exam records');

    // 9. Create Incorrect Notes (오답노트)
    const notes = [
        { unit: 0, problem: '쎈수학 124번', memo: '다항식 나눗셈에서 차수 비교 실수', type: 'C', resolved: true },
        { unit: 0, problem: '쎈수학 138번', memo: '(a+b)^2 전개할 때 중간항 2ab 빠뜨림', type: 'M', resolved: true },
        { unit: 1, problem: '개념유형 75번', memo: '인수정리 적용 시 x=a 대입 잊음', type: 'C', resolved: false },
        { unit: 2, problem: '쎈수학 256번', memo: 'i^4 = 1 활용 못함. 주기성 암기!', type: 'C', resolved: false },
        { unit: 2, problem: '기출문제 3번', memo: '근과 계수의 관계 공식 혼동', type: 'R', resolved: false },
        { unit: 4, problem: '쎈수학 312번', memo: '두 직선 평행 조건 적용 못함', type: 'S', resolved: true },
        { unit: 5, problem: '개념유형 89번', memo: '원의 방정식 일반형→표준형 변환 실수', type: 'M', resolved: false },
        { unit: 5, problem: '모의고사 28번', memo: '원과 직선 위치관계 판별식 혼동', type: 'S', resolved: false },
    ];

    for (const note of notes) {
        await prisma.incorrectNote.create({
            data: {
                userId: testStudent.id,
                unitId: units[note.unit].id,
                problemName: note.problem,
                memo: note.memo,
                errorType: note.type,
                isResolved: note.resolved,
            }
        });
    }
    console.log('✅ Created 8 incorrect notes');

    console.log('\n🎉 Demo data seeding completed!');
    console.log(`\n📋 Test Student: ${testStudent.name} (ID: ${testStudent.id})`);
    console.log('   Login: teststudent / test123');
}

function getDateString(daysOffset: number): string {
    const date = new Date();
    date.setDate(date.getDate() + daysOffset);
    return date.toISOString().split('T')[0];
}

main()
    .catch((e) => { console.error('Error:', e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
