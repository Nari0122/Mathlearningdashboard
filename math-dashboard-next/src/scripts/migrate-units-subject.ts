/**
 * Firebase 데이터베이스 마이그레이션 스크립트
 * 
 * 목적: 기존 units의 subject "수학"을 올바른 영역/과목으로 변환
 * 
 * 주의: 기존 데이터에는 어떤 영역/과목인지 정보가 없으므로
 *       수동으로 확인하거나 기본값을 설정해야 합니다.
 */

import { adminDb } from '../lib/firebase-admin';

async function migrateUnitsSubject() {
    console.log('🚀 Starting units subject migration...\n');

    const db = adminDb;
    if (!db) {
        console.error('❌ Firebase Admin not initialized. Check FIREBASE_* env vars.');
        process.exit(1);
    }

    try {
        const studentsSnapshot = await db.collection('students').get();

        for (const studentDoc of studentsSnapshot.docs) {
            const studentData = studentDoc.data();
            const studentId = studentData.id;
            const studentName = studentData.name || 'Unknown';

            console.log(`\n📚 Processing student: ${studentName} (ID: ${studentId})`);

            const unitsSnapshot = await studentDoc.ref.collection('units').get();

            if (unitsSnapshot.empty) {
                console.log('  ⚠️  No units found');
                continue;
            }

            let updatedCount = 0;

            for (const unitDoc of unitsSnapshot.docs) {
                const unitData = unitDoc.data();
                const grade = unitData.grade;
                const currentSubject = unitData.subject;
                const schoolLevel = unitData.schoolLevel || (['중1', '중2', '중3'].includes(grade) ? '중등' : '고등');

                // "수학"이면 변환 필요
                if (currentSubject === '수학') {
                    console.log(`\n  ⚠️  Found unit with subject "수학":`);
                    console.log(`     Grade: ${grade}, Unit: ${unitData.unitName || unitData.name}`);
                    console.log(`     School Level: ${schoolLevel}`);
                    console.log(`     Details: ${JSON.stringify(unitData.unitDetails || [])}`);

                    // 경고: 자동 변환 불가능
                    console.log(`     ❌ Cannot auto-convert "수학" to specific subject/area`);
                    console.log(`     ℹ️  Please manually update this unit in the admin panel`);

                    // schoolLevel과 unitDetails는 업데이트
                    await unitDoc.ref.update({
                        schoolLevel: schoolLevel,
                        unitDetails: unitData.unitDetails || []
                    });

                    updatedCount++;
                } else if (!unitData.schoolLevel) {
                    // schoolLevel이 없으면 추가
                    await unitDoc.ref.update({
                        schoolLevel: schoolLevel,
                        unitDetails: unitData.unitDetails || []
                    });
                    updatedCount++;
                    console.log(`  ✅ Added schoolLevel: ${schoolLevel}`);
                }
            }

            console.log(`\n  📊 Updated ${updatedCount} units for ${studentName}`);
        }

        console.log('\n\n✅ Migration completed!');
        console.log('\n⚠️  IMPORTANT: Units with subject "수학" need manual update:');
        console.log('   1. Go to Admin Panel');
        console.log('   2. Edit each unit');
        console.log('   3. Select correct 영역/과목 based on unit content');

    } catch (error) {
        console.error('❌ Migration error:', error);
    }
}

// 실행
migrateUnitsSubject()
    .then(() => {
        console.log('\n✅ Script finished');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Script error:', error);
        process.exit(1);
    });
