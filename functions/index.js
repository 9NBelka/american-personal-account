const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.getCourseUserCount = functions.https.onCall(async (data, context) => {
  // Проверяем, что запрос авторизован (опционально, для безопасности)
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Требуется авторизация для доступа к этой функции.',
    );
  }

  // Получаем название курса из запроса
  const courseId = data.courseId || 'architecture'; // По умолчанию "architecture"

  try {
    // Запрашиваем все документы из коллекции users
    const snapshot = await admin.firestore().collection('users').get();

    // Фильтруем и подсчитываем пользователей с доступом к курсу
    const count = snapshot.docs.reduce((acc, doc) => {
      const purchasedCourses = doc.data().purchasedCourses || {};
      const courseData = purchasedCourses[courseId] || {};
      const hasAccess = courseData.access && courseData.access !== 'denied';
      return acc + (hasAccess ? 1 : 0);
    }, 0);

    return { count };
  } catch (error) {
    throw new functions.https.HttpsError('internal', `Ошибка при подсчёте: ${error.message}`);
  }
});
