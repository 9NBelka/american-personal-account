// setAdminRole.js
import admin from 'firebase-admin';
import { cert, initializeApp } from 'firebase-admin/app';

// Инициализируем Admin SDK с сервисным ключом
initializeApp({
  credential: cert('./service-account-key.json'), // Укажи путь к своему сервисному ключу
});

// UID твоего админа (замени на UID, который ты скопировал)
const adminUid = 'I3FVwa894aZl04PCYMRCumadylT2'; // Например: 'kX9mPqRtY2uWvZ8nL4jH5gD3cF7e'

// Устанавливаем кастомный токен
admin
  .auth()
  .setCustomUserClaims(adminUid, { role: 'admin' })
  .then(() => {
    console.log('Кастомный токен успешно установлен для админа:', adminUid);
    console.log('Теперь выйдите и войдите заново, чтобы обновить токен.');
  })
  .catch((error) => {
    console.error('Ошибка при установке кастомного токена:', error);
  });
