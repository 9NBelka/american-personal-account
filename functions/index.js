process.on('warning', (warning) => {
  console.warn(warning.name); // Название предупреждения
  console.warn(warning.message); // Сообщение
  console.warn(warning.stack); // Стек вызовов
});

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: 'https://lms-jet-one.vercel.app' });

admin.initializeApp();

exports.getCourseUserCount = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    if (req.method !== 'GET' && req.method !== 'POST') {
      return res.status(405).send('Method Not Allowed');
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).send('Unauthorized: No token provided');
    }

    const idToken = authHeader.split('Bearer ')[1];
    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const userId = decodedToken.uid; // Получаем UID пользователя

      const courseId = req.query.courseId || 'architecture';

      // Проверяем, имеет ли пользователь доступ к курсу
      const userDoc = await admin.firestore().doc(`users/${userId}`).get();
      if (!userDoc.exists) {
        return res.status(403).send('Forbidden: User not found');
      }

      const purchasedCourses = userDoc.data().purchasedCourses || {};
      const courseData = purchasedCourses[courseId] || {};
      if (!courseData.access || courseData.access === 'denied') {
        return res.status(403).send('Forbidden: No access to this course');
      }

      // Считаем пользователей с доступом
      const snapshot = await admin.firestore().collection('users').get();
      const count = snapshot.docs.reduce((acc, doc) => {
        const purchasedCourses = doc.data().purchasedCourses || {};
        const courseData = purchasedCourses[courseId] || {};
        const hasAccess = courseData.access && courseData.access !== 'denied';
        return acc + (hasAccess ? 1 : 0);
      }, 0);

      res.status(200).json({ count });
    } catch (error) {
      return res.status(401).send('Unauthorized: Invalid token');
    }
  });
});

exports.createUser = functions.https.onCall(async (data, context) => {
  // Проверяем, что запрос отправлен админом
  if (!context.auth || context.auth.token.role !== 'admin') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Только администраторы могут создавать пользователей',
    );
  }

  const { email, password, name, role, registrationDate, purchasedCourses } = data;

  try {
    // Создаём пользователя в Firebase Authentication
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
    });

    // Добавляем данные пользователя в Firestore
    await admin
      .firestore()
      .collection('users')
      .doc(userRecord.uid)
      .set({
        id: userRecord.uid,
        email: email,
        name: name,
        role: role,
        registrationDate: registrationDate,
        purchasedCourses: purchasedCourses || {},
      });

    // Отправляем ссылку для сброса пароля
    await admin.auth().generatePasswordResetLink(email, {
      url: 'https://your-app-url/login', // Замени на URL твоего приложения
      handleCodeInApp: true,
    });

    return { success: true, uid: userRecord.uid };
  } catch (error) {
    throw new functions.https.HttpsError(
      'internal',
      'Ошибка при создании пользователя: ' + error.message,
    );
  }
});
