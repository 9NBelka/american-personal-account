import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { updateCourse } from '../../../store/slices/adminSlice';
import scss from './EditCourse.module.scss';

export default function EditCourse({ onBack }) {
  const { courseId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { courses, status } = useSelector((state) => state.admin);

  const course = courses.find((c) => c.id === courseId) || {};
  const [title, setTitle] = useState(course.title || '');
  const [category, setCategory] = useState(course.category || '');
  const [access, setAccess] = useState(course.access || '');

  useEffect(() => {
    if (status === 'succeeded' && onBack) {
      onBack();
    }
  }, [status, onBack]);

  const handleSave = () => {
    const updatedData = { title, category, access };
    dispatch(updateCourse({ courseId, updatedData }))
      .unwrap()
      .then(() => {
        // Не вызываем fetchCourses здесь, полагаемся на обновление состояния
      })
      .catch((error) => {
        console.error('Ошибка при сохранении:', error);
      });
  };

  return (
    <div className={scss.editContainer}>
      <h2>Редактировать курс</h2>
      <input
        type='text'
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder='Название'
      />
      <input
        type='text'
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        placeholder='Категория'
      />
      <input
        type='text'
        value={access}
        onChange={(e) => setAccess(e.target.value)}
        placeholder='Уровень доступа'
      />
      <button onClick={handleSave} disabled={status === 'loading'}>
        {status === 'loading' ? 'Сохранение...' : 'Сохранить'}
      </button>
      <button onClick={onBack}>Назад</button>
    </div>
  );
}
