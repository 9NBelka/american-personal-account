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
      // Проверяем валидность токена
      await admin.auth().verifyIdToken(idToken);

      const courseId = req.query.courseId || 'architecture';
      const snapshot = await admin.firestore().collection('users').get();
      const count = snapshot.docs.reduce((acc, doc) => {
        const purchasedCourses = doc.data().purchasedCourses || {};
        const courseData = purchasedCourses[courseId] || {};
        const hasAccess = courseData.access && courseData.access !== 'denied';
        return acc + (hasAccess ? 1 : 0);
      }, 0);

      res.status(200).json({ count });
    } catch (error) {
      if (error.code === 'auth/argument-error' || error.code === 'auth/id-token-expired') {
        return res.status(401).send('Unauthorized: Invalid or expired token');
      }
      res.status(500).send(`Ошибка: ${error.message}`);
    }
  });
});
