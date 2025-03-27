// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Инициализируем Admin SDK только один раз
admin.initializeApp();

// Обработчик предупреждений
process.on('warning', (warning) => {
  console.warn(warning.name);
  console.warn(warning.message);
  console.warn(warning.stack);
});

// Функция для получения количества пользователей курса
exports.getCourseUserCount = functions
  .region('us-central1') // Указываем регион
  .https.onRequest(async (req, res) => {
    // Проверяем метод запроса
    if (req.method !== 'GET' && req.method !== 'POST') {
      return res.status(405).send('Method Not Allowed');
    }

    // Проверяем токен авторизации
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).send('Unauthorized: No token provided');
    }

    const idToken = authHeader.split('Bearer ')[1];
    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const userId = decodedToken.uid;

      const courseId = req.query.courseId || 'architecture';

      // Проверяем доступ пользователя к курсу
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
      console.error('Ошибка в getCourseUserCount:', error.message);
      return res.status(401).send('Unauthorized: Invalid token');
    }
  });

// Функция для создания пользователя
exports.createUser = functions
  .region('us-central1') // Указываем регион
  .https.onCall(async (data, context) => {
    // Добавляем отладочные логи
    console.log('Заголовки запроса:', context.rawRequest.headers);
    console.log('Полный контекст:', JSON.stringify(context, null, 2));
    console.log(
      'Токен пользователя:',
      context.auth ? JSON.stringify(context.auth.token, null, 2) : 'Нет токена',
    );

    // Проверяем, является ли пользователь админом
    if (!context.auth || context.auth.token.role !== 'admin') {
      console.log('Роль пользователя:', context.auth ? context.auth.token.role : 'Нет роли');
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

      // Сохраняем данные пользователя в Firestore
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

      // Генерируем ссылку для сброса пароля
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

// Функция для удаления пользователя
exports.deleteUser = functions
  .region('us-central1') // Указываем регион
  .https.onCall(async (data, context) => {
    // Добавляем отладочные логи
    console.log('Заголовки запроса:', context.rawRequest.headers);
    console.log('Полный контекст:', JSON.stringify(context, null, 2));
    console.log(
      'Токен пользователя:',
      context.auth ? JSON.stringify(context.auth.token, null, 2) : 'Нет токена',
    );

    // Проверяем, является ли пользователь админом
    if (!context.auth || context.auth.token.role !== 'admin') {
      console.log('Роль пользователя:', context.auth ? context.auth.token.role : 'Нет роли');
      throw new functions.https.HttpsError(
        'permission-denied',
        'Только администраторы могут удалять пользователей',
      );
    }

    const { userId } = data;

    try {
      // Удаляем пользователя из Firebase Authentication
      await admin.auth().deleteUser(userId);
      console.log(`Пользователь ${userId} удалён из Authentication`);

      // Удаляем пользователя из Firestore
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
