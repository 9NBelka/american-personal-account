// Импорты для firebase-functions/v2
import { onRequest } from 'firebase-functions/v2/https'; // Правильный импорт для HTTP-функций
import {
  onDocumentCreated,
  onDocumentUpdated,
  onDocumentDeleted,
} from 'firebase-functions/v2/firestore';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import cors from 'cors';

// Обработчик предупреждений Node.js
process.on('warning', (warning) => {
  console.warn(warning.name);
  console.warn(warning.message);
  console.warn(warning.stack);
});

// Инициализация Firebase Admin
initializeApp();
const adminFirestore = getFirestore();
const adminAuth = getAuth();

// Настройка CORS
const corsHandler = cors({ origin: 'https://lms-jet-one.vercel.app' });

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

// Функция getCourseUserCount
export const getCourseUserCount = onRequest(async (req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== 'GET' && req.method !== 'POST') {
      return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    const idToken = authHeader.split('Bearer ')[1];
    try {
      const decodedToken = await adminAuth.verifyIdToken(idToken);
      const userId = decodedToken.uid;

      const userDoc = await adminFirestore.doc(`users/${userId}`).get();
      if (!userDoc.exists) {
        return res.status(403).json({ message: 'Forbidden: User not found' });
      }

      const purchasedCourses = userDoc.data().purchasedCourses || {};
      const courseId = req.query.courseId || 'architecture';
      const courseData = purchasedCourses[courseId] || {};
      if (!courseData.access || courseData.access === 'denied') {
        return res.status(403).json({ message: 'Forbidden: No access to this course' });
      }

      const courseDoc = await adminFirestore.doc(`courses/${courseId}`).get();
      const count =
        courseDoc.exists && courseDoc.data().userCount !== undefined
          ? courseDoc.data().userCount
          : 0;

      res.status(200).json({ count });
    } catch (error) {
      console.error('Error verifying token or fetching course data:', error);
      return res.status(401).json({ message: 'Unauthorized: Invalid token or server error' });
    }
  });
});

// Новая HTTP-функция для ручного пересчета userCount
export const recalculateUserCount = onRequest(async (req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    try {
      const idToken = authHeader.split('Bearer ')[1];
      const decodedToken = await adminAuth.verifyIdToken(idToken);
      const userId = decodedToken.uid;

      // Проверяем, что вызывающий пользователь — администратор
      const userDoc = await adminFirestore.doc(`users/${userId}`).get();
      if (!userDoc.exists || userDoc.data().role !== 'admin') {
        return res
          .status(403)
          .json({ message: 'Forbidden: Only admins can recalculate user counts' });
      }

      const coursesSnapshot = await adminFirestore.collection('courses').get();
      const courseIds = coursesSnapshot.docs.map((doc) => doc.id);

      for (const courseId of courseIds) {
        const usersSnapshot = await adminFirestore.collection('users').get();
        const count = usersSnapshot.docs.reduce((acc, doc) => {
          const purchasedCourses = doc.data().purchasedCourses || {};
          const courseData = purchasedCourses[courseId] || {};
          const hasAccess = courseData.access && courseData.access !== 'denied';
          return acc + (hasAccess ? 1 : 0);
        }, 0);

        await adminFirestore
          .doc(`courses/${courseId}`)
          .update({
            userCount: count,
            lastUpdated: new Date().toISOString(),
          })
          .catch(async (error) => {
            if (error.code === 'not-found') {
              await adminFirestore.doc(`courses/${courseId}`).set({
                id: courseId,
                userCount: count,
                lastUpdated: new Date().toISOString(),
              });
            } else {
              throw error;
            }
          });
      }

      res.status(200).json({ message: 'Successfully recalculated userCount for all courses' });
    } catch (error) {
      console.error('Error recalculating userCount:', error);
      res.status(500).json({ message: `Error recalculating userCount: ${error.message}` });
    }
  });
});

// Функция addNewUser
// Функция addNewUser
export const addNewUser = onRequest(async (req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    try {
      const idToken = authHeader.split('Bearer ')[1];
      const decodedToken = await adminAuth.verifyIdToken(idToken);
      const userId = decodedToken.uid;

      const userDoc = await adminFirestore.doc(`users/${userId}`).get();
      if (!userDoc.exists || !['admin', 'moderator'].includes(userDoc.data().role)) {
        return res
          .status(403)
          .json({ message: 'Forbidden: Only admins and moderators can add users' });
      }

      const { name, email, role, purchasedCourses, registrationDate } = req.body;

      if (!name || !email || !role) {
        return res.status(400).json({ message: 'Missing required fields: name, email, role' });
      }

      // Запрещаем модераторам создавать администраторов
      if (userDoc.data().role === 'moderator' && role === 'admin') {
        return res.status(403).json({ message: 'Forbidden: Moderators cannot create admin users' });
      }

      // Проверяем, существует ли пользователь с таким email
      try {
        await adminAuth.getUserByEmail(email);
        return res.status(400).json({ message: 'User with this email already exists' });
      } catch (error) {
        if (error.code !== 'auth/user-not-found') {
          throw error;
        }
      }

      const password = generateRandomPassword();

      const userRecord = await adminAuth.createUser({
        email,
        password,
        displayName: name,
      });

      await adminFirestore.doc(`users/${userRecord.uid}`).set({
        name,
        email,
        role,
        registrationDate: registrationDate || new Date().toISOString(),
        purchasedCourses: purchasedCourses || {},
        avatarUrl: null,
        readNotifications: [],
      });

      res.status(200).json({
        message: 'User created successfully',
        userId: userRecord.uid,
      });
    } catch (error) {
      console.error('Error adding user:', error);
      res.status(500).json({ message: `Error adding user: ${error.message}` });
    }
  });
});

// Функция deleteUser
export const deleteUser = onRequest(async (req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    try {
      const idToken = authHeader.split('Bearer ')[1];
      const decodedToken = await adminAuth.verifyIdToken(idToken);
      const adminUserId = decodedToken.uid;

      const adminUserDoc = await adminFirestore.doc(`users/${adminUserId}`).get();
      if (!adminUserDoc.exists || adminUserDoc.data().role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden: Only admins can delete users' });
      }

      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ message: 'Missing required field: userId' });
      }

      const userDoc = await adminFirestore.doc(`users/${userId}`).get();
      if (!userDoc.exists) {
        return res.status(404).json({ message: 'User not found in Firestore' });
      }

      if (userId === adminUserId) {
        return res.status(403).json({ message: 'Forbidden: Cannot delete yourself' });
      }

      await adminAuth.deleteUser(userId);
      await adminFirestore.doc(`users/${userId}`).delete();

      res.status(200).json({
        message: 'User deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ message: `Error deleting user: ${error.message}` });
    }
  });
});

// Вспомогательная функция для обновления userCount
const updateCourseUserCount = async (courseId) => {
  const usersSnapshot = await adminFirestore.collection('users').get();
  const count = usersSnapshot.docs.reduce((acc, doc) => {
    const purchasedCourses = doc.data().purchasedCourses || {};
    const courseData = purchasedCourses[courseId] || {};
    const hasAccess = courseData.access && courseData.access !== 'denied';
    return acc + (hasAccess ? 1 : 0);
  }, 0);

  await adminFirestore
    .doc(`courses/${courseId}`)
    .update({
      userCount: count,
      lastUpdated: new Date().toISOString(),
    })
    .catch(async (error) => {
      if (error.code === 'not-found') {
        await adminFirestore.doc(`courses/${courseId}`).set({
          id: courseId,
          userCount: count,
          lastUpdated: new Date().toISOString(),
        });
      } else {
        throw error;
      }
    });
};

// Триггер onUserCreate
export const onUserCreate = onDocumentCreated('users/{userId}', async (event) => {
  try {
    const snap = event.data;
    if (!snap) {
      console.log('No data associated with the event');
      return;
    }
    const userData = snap.data();
    const purchasedCourses = userData.purchasedCourses || {};

    for (const courseId of Object.keys(purchasedCourses)) {
      const courseData = purchasedCourses[courseId];
      const hasAccess = courseData.access && courseData.access !== 'denied';
      if (hasAccess) {
        await updateCourseUserCount(courseId);
      }
    }
  } catch (error) {
    console.error('Error in onUserCreate:', error);
  }
});

// Триггер onUserUpdate
export const onUserUpdate = onDocumentUpdated('users/{userId}', async (event) => {
  try {
    const beforeData = event.data.before.data();
    const afterData = event.data.after.data();

    const beforeCourses = beforeData.purchasedCourses || {};
    const afterCourses = afterData.purchasedCourses || {};

    const allCourseIds = new Set([...Object.keys(beforeCourses), ...Object.keys(afterCourses)]);

    for (const courseId of allCourseIds) {
      const beforeAccess =
        beforeCourses[courseId]?.access && beforeCourses[courseId].access !== 'denied';
      const afterAccess =
        afterCourses[courseId]?.access && afterCourses[courseId].access !== 'denied';

      if (beforeAccess !== afterAccess) {
        await updateCourseUserCount(courseId);
      }
    }
  } catch (error) {
    console.error('Error in onUserUpdate:', error);
  }
});

// Триггер onUserDelete
export const onUserDelete = onDocumentDeleted('users/{userId}', async (event) => {
  try {
    const snap = event.data;
    if (!snap) {
      console.log('No data associated with the event');
      return;
    }
    const userData = snap.data();
    const purchasedCourses = userData.purchasedCourses || {};

    for (const courseId of Object.keys(purchasedCourses)) {
      const courseData = purchasedCourses[courseId];
      const hadAccess = courseData.access && courseData.access !== 'denied';
      if (hadAccess) {
        await updateCourseUserCount(courseId);
      }
    }
  } catch (error) {
    console.error('Error in onUserDelete:', error);
  }
});
