/**
 * Firebase units 완전 초기화 및 재생성 스크립트
 * 
 * 경고: 이 스크립트는 모든 학생의 units를 삭제합니다!
 * 
 * 사용 방법:
 * 1. 백업 확인 후 실행
 * 2. 관리자 페이지에서 새로운 커리큘럼 구조로 units 재추가
 */

// 환경변수 로드
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { adminDb } from '../lib/firebase-admin';

async function resetAllUnits() {
    console.log('⚠️  WARNING: This will DELETE ALL units from the database!');
    console.log('⚠️  Make sure you have a backup before proceeding.\n');

    // 안전장치: NODE_ENV가 production이면 실행 안 함
    if (process.env.NODE_ENV === 'production') {
        console.log('❌ Cannot run in production mode');
        process.exit(1);
    }

    const db = adminDb;
    if (!db) {
        console.error('❌ Firebase Admin not initialized. Check FIREBASE_* env vars.');
        process.exit(1);
    }

    try {
        const studentsSnapshot = await db.collection('students').get();
        let totalDeleted = 0;

        for (const studentDoc of studentsSnapshot.docs) {
            const studentData = studentDoc.data();
            const studentName = studentData.name || 'Unknown';

            console.log(`\n📚 Processing student: ${studentName}`);

            const unitsSnapshot = await studentDoc.ref.collection('units').get();

            if (!unitsSnapshot.empty) {
                const batch = db.batch();
                let count = 0;

                for (const unitDoc of unitsSnapshot.docs) {
                    batch.delete(unitDoc.ref);
                    count++;
                }

                await batch.commit();
                console.log(`  ✅ Deleted ${count} units`);
                totalDeleted += count;
            } else {
                console.log(`  ℹ️  No units to delete`);
            }
        }

        console.log(`\n\n✅ Reset completed!`);
        console.log(`📊 Total units deleted: ${totalDeleted}`);
        console.log(`\n📝 Next steps:`);
        console.log(`   1. Go to Admin Panel`);
        console.log(`   2. Add units using the new curriculum structure`);
        console.log(`   3. Select proper 학제/학년/영역or과목/단원/세부내용`);

    } catch (error) {
        console.error('❌ Reset error:', error);
    }
}

// CLI에서 확인 받기
console.log('\n⚠️⚠️⚠️  DESTRUCTIVE OPERATION  ⚠️⚠️⚠️\n');
console.log('This will DELETE ALL units from Firebase.');
console.log('Type "DELETE ALL UNITS" to confirm:\n');

process.stdin.once('data', (data) => {
    const input = data.toString().trim();

    if (input === 'DELETE ALL UNITS') {
        resetAllUnits()
            .then(() => {
                console.log('\n✅ Script finished');
                process.exit(0);
            })
            .catch((error) => {
                console.error('❌ Script error:', error);
                process.exit(1);
            });
    } else {
        console.log('\n❌ Confirmation failed. Aborting.');
        process.exit(0);
    }
});
