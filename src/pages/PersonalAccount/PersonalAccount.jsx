import { useEffect, useState } from 'react';
import { auth, db } from '../../firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function PersonalAccount() {
  const navigate = useNavigate();
  const { user, userRole, isLoading: authLoading } = useAuth();
  const [userName, setUserName] = useState('');
  const [registrationDate, setRegistrationDate] = useState('');
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user || !user.uid) {
        if (!authLoading) {
          navigate('/login');
        }
        return;
      }

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserName(data.name || '');
        setRegistrationDate(data.registrationDate || '');
        const purchasedCourses = data.purchasedCourses || [];

        try {
          console.log('Attempting to fetch courses collection');
          const courseDocs = await getDocs(collection(db, 'courses'));
          console.log(
            'Courses fetched:',
            courseDocs.docs.map((doc) => doc.id),
          );
          if (courseDocs.empty) {
            console.log('No courses found in the "courses" collection');
            setCourses([]);
          } else {
            const courseList = await Promise.all(
              courseDocs.docs.map(async (doc) => {
                const courseData = doc.data();
                const hasModules = courseData.modules && Object.keys(courseData.modules).length > 0;
                return {
                  id: doc.id,
                  title:
                    courseData.title ||
                    doc.id.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
                  available: purchasedCourses.includes(doc.id) && hasModules,
                };
              }),
            );
            setCourses(courseList);
          }
        } catch (error) {
          console.error('Error fetching courses:', error);
          setError(error.message);
        }
      }
    };

    fetchUserData();
  }, [user, authLoading, navigate]);

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/login');
  };

  // Показываем лоадинг до полной загрузки данных
  if (authLoading) {
    return (
      <div className='loading-container'>
        <div className='loading'>Загрузка...</div>
      </div>
    );
  }

  /*
  В PersonalAccount.jsx курс считается доступным (available: true), если выполняются два условия:

Курс есть в purchasedCourses пользователя.
У курса есть модули (hasModules — true).
Курс teamlead отображается как "Not available", значит, одно из этих условий не выполняется. Давай проверим оба условия.
  */

  // После загрузки показываем всё содержимое
  return (
    <div className='personal-account'>
      <h2>Профиль</h2>
      <p>Добро пожаловать, {userName}!</p>
      <p>Роль: {userRole}</p>
      <p>Дата регистрации: {new Date(registrationDate).toLocaleString()}</p>
      {error && <p style={{ color: 'red' }}>Ошибка: {error}</p>}
      <h3>Доступные курсы:</h3>
      {!authLoading && (
        <div className='courses-grid'>
          {courses.length > 0 ? (
            courses.map((course) => (
              <div
                key={course.id}
                className={`course-card ${course.available ? 'available' : 'not-available'}`}>
                <h4>{course.title}</h4>
                {course.available ? (
                  <Link to={`/playlist/${course.id}`} className='watch-button'>
                    Watch
                  </Link>
                ) : (
                  <button className='not-available-button' disabled>
                    Not available
                  </button>
                )}
              </div>
            ))
          ) : (
            <p>Курсы пока недоступны.</p>
          )}
        </div>
      )}
      <button onClick={handleLogout} className='logout-button'>
        Выйти
      </button>
    </div>
  );
}
