export { };

const admin = require("firebase-admin");
const path = require("path");

const serviceAccountPath = "/Users/nari/Downloads/nari-math-flow-firebase-adminsdk-fbsvc-c15440423d.json";
const serviceAccount = require(serviceAccountPath);

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

const db = admin.firestore();

async function generateNotes() {
    console.log("Generating Incorrect Notes for Lee Chan-ju...");

    const studentsRef = db.collection("students");
    const snapshot = await studentsRef.where("name", "==", "이찬주").get();

    if (snapshot.empty) {
        console.log("Student not found!");
        return;
    }

    const studentDoc = snapshot.docs[0].ref;
    const notesRef = studentDoc.collection("incorrectNotes");

    // Clear existing
    const existingNotes = await notesRef.get();
    const batch = db.batch();
    existingNotes.docs.forEach((doc: any) => batch.delete(doc.ref));
    await batch.commit();

    const notesData = [
        {
            unit: { name: "인수분해", id: 3 },
            errorType: "C", // Concept
            problemName: "쎈 482번 (복잡한 식의 인수분해)",
            memo: "내림차순 정리까지는 잘 했으나, 상수항 인수분해 과정에서 부호 실수함. 치환으로 푸는 방법 다시 설명 필요.",
            isResolved: false,
            questionImg: "", // Placeholder or url
            createdAt: new Date("2026-01-27").toISOString()
        },
        {
            unit: { name: "나머지정리", id: 2 },
            errorType: "S", // Strategy
            problemName: "기출 15번 (f(x) 추론)",
            memo: "차수를 놓치고 시작해서 식을 세우지 못함. 'n차식' 조건이 나오면 차수부터 가정하도록 지도함.",
            isResolved: true,
            questionImg: "",
            createdAt: new Date("2026-01-23").toISOString()
        },
        {
            unit: { name: "다항식의 연산", id: 1 },
            errorType: "M", // Math (Calculation)
            problemName: "교과서 32p 예제 4",
            memo: "단순 전개 실수. (a+b)^3 공식 헷갈려함. 10번 쓰기 숙제 내줌.",
            isResolved: true,
            questionImg: "",
            createdAt: new Date("2026-01-20").toISOString()
        }
    ];

    for (const note of notesData) {
        await notesRef.add(note);
    }

    console.log("Incorrect notes generation complete!");
}

generateNotes().catch(console.error);
