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

// Обновлённая функция getCourseUserCount с использованием onCall
exports.getCourseUserCount = functions.https.onCall(async (data, context) => {
  // Проверка аутентификации
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'No token provided');
  }

  const userId = context.auth.uid;
  const courseId = data.courseId || 'architecture';

  try {
    const userDoc = await admin.firestore().doc(`users/${userId}`).get();
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('permission-denied', 'User not found');
    }

    const purchasedCourses = userDoc.data().purchasedCourses || {};
    const courseData = purchasedCourses[courseId] || {};
    if (!courseData.access || courseData.access === 'denied') {
      throw new functions.https.HttpsError('permission-denied', 'No access to this course');
    }

    const snapshot = await admin.firestore().collection('users').get();
    const count = snapshot.docs.reduce((acc, doc) => {
      const purchasedCourses = doc.data().purchasedCourses || {};
      const courseData = purchasedCourses[courseId] || {};
      const hasAccess = courseData.access && courseData.access !== 'denied';
      return acc + (hasAccess ? 1 : 0);
    }, 0);

    return { count };
  } catch (error) {
    console.error('Error in getCourseUserCount:', error);
    // Если это уже HttpsError, просто пробрасываем его
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    // Иначе создаём новую ошибку
    throw new functions.https.HttpsError('internal', `Error: ${error.message}`);
  }
});

// Функция для добавления пользователя (без изменений)
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

      const userDoc = await admin.firestore().doc(`users/${userId}`).get();
      if (!userDoc.exists || userDoc.data().role !== 'admin') {
        return res.status(403).send('Forbidden: Only admins can add users');
      }

      const { name, email, role, purchasedCourses, registrationDate } = req.body;

      if (!name || !email || !role) {
        return res.status(400).send('Missing required fields: name, email, role');
      }

      try {
        await admin.auth().getUserByEmail(email);
        return res.status(400).send('User with this email already exists');
      } catch (error) {
        if (error.code !== 'auth/user-not-found') {
          throw error;
        }
      }

      const password = generateRandomPassword();

      const userRecord = await admin.auth().createUser({
        email,
        password,
        displayName: name,
      });

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

// Функция для удаления пользователя (без изменений)
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

      const adminUserDoc = await admin.firestore().doc(`users/${adminUserId}`).get();
      if (!adminUserDoc.exists || adminUserDoc.data().role !== 'admin') {
        return res.status(403).send('Forbidden: Only admins can delete users');
      }

      const { userId } = req.body;

      if (!userId) {
        return res.status(400).send('Missing required field: userId');
      }

      const userDoc = await admin.firestore().doc(`users/${userId}`).get();
      if (!userDoc.exists) {
        return res.status(404).send('User not found in Firestore');
      }

      if (userId === adminUserId) {
        return res.status(403).send('Forbidden: Cannot delete yourself');
      }

      await admin.auth().deleteUser(userId);
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
