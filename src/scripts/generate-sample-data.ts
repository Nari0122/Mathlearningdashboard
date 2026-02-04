export { };

const admin = require("firebase-admin");
const path = require("path");

// Load service account (Assuming the path provided by user)
const serviceAccountPath = "/Users/nari/Downloads/nari-math-flow-firebase-adminsdk-fbsvc-c15440423d.json";
const serviceAccount = require(serviceAccountPath);

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

const db = admin.firestore();

async function generateData() {
    console.log("Starting data generation for Lee Chan-ju...");

    const studentsRef = db.collection("students");
    const snapshot = await studentsRef.where("name", "==", "이찬주").get();

    let studentDoc;
    let numericId;

    if (snapshot.empty) {
        console.log("Creating new student: 이찬주");
        // Get next ID
        const allStudents = await studentsRef.orderBy("id", "desc").limit(1).get();
        numericId = allStudents.empty ? 1 : (allStudents.docs[0].data().id + 1);

        const res = await studentsRef.add({
            id: numericId,
            name: "이찬주",
            grade: "고1",
            schoolType: "자사고", // Realistic: Sehwa High is autonomous
            schoolName: "세화고",
            phone: "010-1234-5678",
            parentPhone: "010-9876-5432",
            subject: "수학",
            status: "active",
            username: "dlckswn1123", // Updated per user request
            password: "love0024!@#$", // Updated per user request
            enrollmentDate: "2024-03-02",
            createdAt: new Date().toISOString(),
            isActive: true,
            memo: "집중력이 좋으나 계산 실수가 잦음. 오답 노트 활용 권장."
        });
        studentDoc = res;
    } else {
        console.log("Found existing student: 이찬주");
        studentDoc = snapshot.docs[0].ref;
        numericId = snapshot.docs[0].data().id;
        // Update basic info to match realistic profile
        await studentDoc.update({
            grade: "고1",
            schoolType: "자사고",
            schoolName: "세화고",
            username: "dlckswn1123", // Updated per user request
            password: "love0024!@#$", // Updated per user request
            enrollmentDate: "2024-03-02",
            memo: "집중력이 좋으나 계산 실수가 잦음. 오답 노트 활용 권장."
        });
    }

    // --- Units (Polynomials, Equations, Inequalities) ---
    console.log("Generating Units...");
    // Clear existing? Optional. Let's just overwrite or add. 
    // For 'reset' feel, maybe delete all first? 
    // Implementation note: deleting subcollections is hard in Admin SDK without recursive delete.
    // We'll just add new ones or update if finding by name is too complex. 
    // Since user wants "Sample Data", let's assume we can just add.
    // But strictly, let's try to update if exists by name, or delete all 'units' first if feasible.
    // We'll iterate known units and update/create.

    const unitsData = [
        {
            id: 1,
            name: "다항식의 연산",
            grade: "고1",
            subject: "수학",
            status: "HIGH",
            selectedDifficulty: "상",
            completionStatus: "completed",
            errorC: 1, errorM: 2, errorR: 0, errorS: 0,
            createdAt: new Date("2024-03-05").toISOString()
        },
        {
            id: 2,
            name: "나머지정리",
            grade: "고1",
            subject: "수학",
            status: "MID",
            selectedDifficulty: "중",
            completionStatus: "completed",
            errorC: 3, errorM: 0, errorR: 1, errorS: 0,
            createdAt: new Date("2024-03-15").toISOString()
        },
        {
            id: 3,
            name: "인수분해",
            grade: "고1",
            subject: "수학",
            status: "MID",
            selectedDifficulty: "중",
            completionStatus: "in-progress",
            errorC: 5, errorM: 1, errorR: 0, errorS: 2, // Concept errors
            createdAt: new Date("2024-03-25").toISOString()
        },
        {
            id: 4,
            name: "복소수",
            grade: "고1",
            subject: "수학",
            status: "MID",
            selectedDifficulty: "중",
            completionStatus: "in-progress",
            errorC: 0, errorM: 0, errorR: 0, errorS: 0,
            createdAt: new Date("2024-04-05").toISOString()
        },
        {
            id: 5,
            name: "이차방정식",
            grade: "고1",
            subject: "수학",
            status: "LOW", // Struggling?
            selectedDifficulty: "하",
            completionStatus: "incomplete",
            errorC: 0, errorM: 0, errorR: 0, errorS: 0,
            createdAt: new Date("2024-04-15").toISOString()
        }
    ];

    const unitsRef = studentDoc.collection("units");
    // Delete existing to be clean (simple batch delete of fetched docs)
    const existingUnits = await unitsRef.get();
    const batch = db.batch();
    existingUnits.docs.forEach((doc: any) => batch.delete(doc.ref));
    await batch.commit();

    for (const unit of unitsData) {
        await unitsRef.add(unit);
    }
    console.log(`Created ${unitsData.length} units.`);

    // --- Schedules (Recent Classes) ---
    console.log("Generating Schedules...");
    const schedulesData = [
        {
            date: "2026-01-20", startTime: "18:00", endTime: "20:00",
            status: "completed", isRegular: false,
            sessionNumber: 1,
            topic: "다항식의 연산 심화 문제 풀이",
            feedback: "연산 속도는 좋으나 부호 실수가 있음."
        },
        {
            date: "2026-01-23", startTime: "18:00", endTime: "20:00",
            status: "completed", isRegular: false,
            sessionNumber: 2,
            topic: "나머지정리와 인수분해 개념",
            feedback: "나머지정리의 기본 원리를 잘 이해함."
        },
        {
            date: "2026-01-27", startTime: "18:00", endTime: "20:00",
            status: "completed", isRegular: false,
            sessionNumber: 3,
            topic: "인수분해 유형별 문제 풀이",
            feedback: "복잡한 식의 인수분해에서 치환 아이디어를 잘 떠올림."
        },
        {
            date: "2026-01-30", startTime: "18:00", endTime: "20:00",
            status: "completed", isRegular: false,
            sessionNumber: 4,
            topic: "복소수 기초",
            feedback: "허수단위 i의 주기성 파악 완료."
        },
        {
            date: "2026-02-06", startTime: "18:00", endTime: "20:00",
            status: "scheduled", isRegular: false,
            sessionNumber: 5,
            topic: "이차방정식 근과 계수의 관계",
            feedback: ""
        }
    ];

    const schedulesRef = studentDoc.collection("schedules");
    // Clear existing
    const existingSchedules = await schedulesRef.get();
    const scheduleBatch = db.batch();
    existingSchedules.docs.forEach((doc: any) => scheduleBatch.delete(doc.ref));
    await scheduleBatch.commit();

    for (const sch of schedulesData) {
        await schedulesRef.add(sch);
    }


    // --- Assignments (Homework) ---
    console.log("Generating Assignments...");
    const assignmentsData = [
        {
            title: "다항식 워크북 10pg-15pg",
            assignedDate: "2026-01-20", dueDate: "2026-01-23",
            status: "submitted", submittedDate: "2026-01-22",
            score: "A"
        },
        {
            title: "인수분해 프린트물",
            assignedDate: "2026-01-23", dueDate: "2026-01-27",
            status: "late-submitted", submittedDate: "2026-01-28",
            score: "B+"
        },
        {
            title: "복소수 개념정리",
            assignedDate: "2026-01-30", dueDate: "2026-02-03",
            status: "pending",
            score: ""
        }
    ];
    const assignmentsRef = studentDoc.collection("assignments");
    // Clear
    const existingAssignments = await assignmentsRef.get();
    const assignBatch = db.batch();
    existingAssignments.docs.forEach((doc: any) => assignBatch.delete(doc.ref));
    await assignBatch.commit();

    for (const assign of assignmentsData) {
        await assignmentsRef.add(assign);
    }


    // --- Exams (Tests) ---
    console.log("Generating Exams...");
    const examsData = [
        {
            title: "1월 월말 평가 (다항식~인수분해)",
            subject: "수학",
            examType: "월말평가", // Also missing this based on client, client expects 'examType'
            date: "2026-01-28",
            score: 88,
            totalScore: 100,
            analysis: "계산 실수가 2문제 있었으나, 고난도 인수분해 문항(21번)은 잘 해결함."
        }
    ];
    const examsRef = studentDoc.collection("exams");
    // Clear
    const existingExams = await examsRef.get();
    const examBatch = db.batch();
    existingExams.docs.forEach((doc: any) => examBatch.delete(doc.ref));
    await examBatch.commit();

    for (const exam of examsData) {
        await examsRef.add(exam);
    }


    // --- Learning Records (For Report Page Graph) ---
    console.log("Generating Learning Records...");
    const recordsData = [
        { date: "2026-01-10", progress: 10, comment: "첫 수업 오리엔테이션" },
        { date: "2026-01-15", progress: 20, comment: "다항식 진도 나감" },
        { date: "2026-01-20", progress: 35, comment: "나머지정리 이해도 높음" },
        { date: "2026-01-25", progress: 50, comment: "인수분해 집중 학습" },
        { date: "2026-01-30", progress: 65, comment: "복소수 시작" }
    ];
    const recordsRef = studentDoc.collection("learningRecords");
    // Clear
    const existingRecords = await recordsRef.get();
    const recordBatch = db.batch();
    existingRecords.docs.forEach((doc: any) => recordBatch.delete(doc.ref));
    await recordBatch.commit();

    for (const rec of recordsData) {
        await recordsRef.add({ ...rec, userId: numericId }); // Matches ReportPage requirement
    }

    console.log("Data generation complete!");
}

generateData().catch(console.error);
