process.on('warning', (warning) => {
  console.warn(warning.name);
  console.warn(warning.message);
  console.warn(warning.stack);
});

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: 'https://lms-jet-one.vercel.app' });

admin.initializeApp();

// Функция для генерации случайного пароля
const generateRandomPassword = () => {
  const length = 12;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
  let password = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
};

// Существующая функция getCourseUserCount
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
      const userId = decodedToken.uid;

      const courseId = req.query.courseId || 'architecture';

      const userDoc = await admin.firestore().doc(`users/${userId}`).get();
      if (!userDoc.exists) {
        return res.status(403).send('Forbidden: User not found');
      }

      const purchasedCourses = userDoc.data().purchasedCourses || {};
      const courseData = purchasedCourses[courseId] || {};
      if (!courseData.access || courseData.access === 'denied') {
        return res.status(403).send('Forbidden: No access to this course');
      }

      const snapshot = await admin.firestore().collection('users').get();
      const count = snapshot.docs.reduce((acc, doc) => {
        const purchasedCourses = doc.data().purchasedCourses || {};
        const courseData = purchasedCourses[courseId] || {};
        const hasAccess = courseData.access && courseData.access !== 'denied';
        return acc + (hasAccess ? 1 : 0);
      }, 0);

      res.status(200).json({ count });
    } catch (error) {
      console.error('Error verifying token:', error);
      return res.status(401).send('Unauthorized: Invalid token');
    }
  });
});

// Функция для добавления пользователя
exports.addNewUser = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).send('Method Not Allowed');
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).send('Unauthorized: No token provided');
    }

    try {
      const idToken = authHeader.split('Bearer ')[1];
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const userId = decodedToken.uid;

      // Проверяем, что вызывающий пользователь — администратор
      const userDoc = await admin.firestore().doc(`users/${userId}`).get();
      if (!userDoc.exists || userDoc.data().role !== 'admin') {
        return res.status(403).send('Forbidden: Only admins can add users');
      }

      const { name, email, role, purchasedCourses, registrationDate } = req.body;

      // Проверяем, что все обязательные поля переданы
      if (!name || !email || !role) {
        return res.status(400).send('Missing required fields: name, email, role');
      }

      // Проверяем, существует ли пользователь с таким email
      try {
        await admin.auth().getUserByEmail(email);
        return res.status(400).send('User with this email already exists');
      } catch (error) {
        if (error.code !== 'auth/user-not-found') {
          throw error;
        }
      }

      // Генерируем случайный пароль
      const password = generateRandomPassword();

      // Создаем пользователя в Firebase Authentication
      const userRecord = await admin.auth().createUser({
        email,
        password,
        displayName: name,
      });

      // Сохраняем данные пользователя в Firestore
      await admin
        .firestore()
        .doc(`users/${userRecord.uid}`)
        .set({
          name,
          email,
          role,
          registrationDate: registrationDate || new Date().toISOString(),
          purchasedCourses: purchasedCourses || {},
          avatarUrl: null,
          readNotifications: [],
        });

      // Генерируем ссылку для сброса пароля
      const actionCodeSettings = {
        url: 'https://lms-jet-one.vercel.app/login',
        handleCodeInApp: true,
      };

      const resetLink = await admin.auth().generatePasswordResetLink(email, actionCodeSettings);

      res.status(200).json({
        message: 'User created successfully',
        userId: userRecord.uid,
        resetLink,
      });
    } catch (error) {
      console.error('Error adding user:', error);
      res.status(500).send(`Error adding user: ${error.message}`);
    }
  });
});

// Новая функция для удаления пользователя
exports.deleteUser = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).send('Method Not Allowed');
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).send('Unauthorized: No token provided');
    }

    try {
      const idToken = authHeader.split('Bearer ')[1];
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const adminUserId = decodedToken.uid;

      // Проверяем, что вызывающий пользователь — администратор
      const adminUserDoc = await admin.firestore().doc(`users/${adminUserId}`).get();
      if (!adminUserDoc.exists || adminUserDoc.data().role !== 'admin') {
        return res.status(403).send('Forbidden: Only admins can delete users');
      }

      const { userId } = req.body;

      // Проверяем, что userId передан
      if (!userId) {
        return res.status(400).send('Missing required field: userId');
      }

      // Проверяем, что пользователь, которого пытаются удалить, существует
      const userDoc = await admin.firestore().doc(`users/${userId}`).get();
      if (!userDoc.exists) {
        return res.status(404).send('User not found in Firestore');
      }

      // Нельзя удалить самого себя
      if (userId === adminUserId) {
        return res.status(403).send('Forbidden: Cannot delete yourself');
      }

      // Удаляем пользователя из Firebase Authentication
      await admin.auth().deleteUser(userId);

      // Удаляем данные пользователя из Firestore
      await admin.firestore().doc(`users/${userId}`).delete();

      res.status(200).json({
        message: 'User deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).send(`Error deleting user: ${error.message}`);
    }
  });
});
