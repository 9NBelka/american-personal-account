// functions/index.js
process.on('warning', (warning) => {
  console.warn(warning.name); // Название предупреждения
  console.warn(warning.message); // Сообщение
  console.warn(warning.stack); // Стек вызовов
});

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({
  origin: ['https://lms-jet-one.vercel.app', 'http://localhost:5173'],
});

// Инициализируем Admin SDK с использованием переменной окружения
try {
  const serviceAccount = JSON.parse(functions.config().google_cloud.credentials);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
} catch (error) {
  console.error('Ошибка при инициализации Firebase Admin SDK:', error.message);
  // Если переменная окружения недоступна, можно использовать дефолтные учётные данные
  admin.initializeApp();
}

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
      console.error('Ошибка при верификации токена:', error.message);
      return res.status(401).send('Unauthorized: Invalid token');
    }
  });
});

// functions/index.js
// functions/index.js
exports.createUser = functions.https.onCall(async (data, context) => {
  console.log('Полный контекст:', JSON.stringify(context, null, 2));
  console.log(
    'Токен пользователя:',
    context.auth ? JSON.stringify(context.auth.token, null, 2) : 'Нет токена',
  );
  // if (!context.auth || context.auth.token.role !== 'admin') {
  //   console.log('Роль пользователя:', context.auth ? context.auth.token.role : 'Нет роли');
  //   throw new functions.https.HttpsError(
  //     'permission-denied',
  //     'Только администраторы могут создавать пользователей',
  //   );
  // }

  const { email, password, name, role, registrationDate, purchasedCourses } = data;

  try {
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
    });

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

    if (role === 'admin') {
      await admin.auth().setCustomUserClaims(userRecord.uid, { role: 'admin' });
      console.log(`Кастомный токен установлен для нового админа: ${userRecord.uid}`);
    }

    await admin.auth().generatePasswordResetLink(email, {
      url: 'https://lms-jet-one.vercel.app/login',
      handleCodeInApp: true,
    });

    return { success: true, uid: userRecord.uid };
  } catch (error) {
    console.error('Ошибка при создании пользователя:', error.message);
    throw new functions.https.HttpsError(
      'internal',
      'Ошибка при создании пользователя: ' + error.message,
    );
  }
});

exports.deleteUser = functions.https.onCall(async (data, context) => {
  if (!context.auth || context.auth.token.role !== 'admin') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Только администраторы могут удалять пользователей',
    );
  }

  const { userId } = data;

  try {
    await admin.auth().deleteUser(userId);
    console.log(`Пользователь ${userId} удалён из Authentication`);

    await admin.firestore().collection('users').doc(userId).delete();
    console.log(`Пользователь ${userId} удалён из Firestore`);

    return { success: true };
  } catch (error) {
    console.error('Ошибка при удалении пользователя:', error.message);
    throw new functions.https.HttpsError(
      'internal',
      'Ошибка при удалении пользователя: ' + error.message,
    );
  }
});
