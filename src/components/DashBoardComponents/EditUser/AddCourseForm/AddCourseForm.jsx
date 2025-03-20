// components/admin/AddCourseForm.jsx
import scss from '../EditUser.module.scss';
import { toast } from 'react-toastify';

export default function AddCourseForm({
  courses,
  values,
  setFieldValue,
  selectedCourse,
  setSelectedCourse,
  selectedPackage,
  setSelectedPackage,
  getCourseTitle,
}) {
  return (
    <div className={scss.addCourseContainer}>
      <div className={scss.addCourseField}>
        <label htmlFor='addCourse'>Добавить курс:</label>
        <select
          id='addCourse'
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className={scss.input}>
          <option value='' disabled>
            Выберите курс
          </option>
          {courses
            .filter((course) => !Object.keys(values.purchasedCourses).includes(course.id))
            .map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
        </select>
      </div>

      <div className={scss.addCourseField}>
        <label htmlFor='addCoursePackage'>Пакет:</label>
        <select
          id='addCoursePackage'
          value={selectedPackage}
          onChange={(e) => setSelectedPackage(e.target.value)}
          className={scss.input}>
          <option value='' disabled>
            Выберите пакет
          </option>
          <option value='vanilla'>Vanilla</option>
          <option value='standard'>Standard</option>
        </select>
      </div>

      <button
        type='button'
        className={scss.addCourseButton}
        onClick={() => {
          if (selectedCourse && selectedPackage) {
            setFieldValue('purchasedCourses', {
              ...values.purchasedCourses,
              [selectedCourse]: {
                completedLessons: {},
                progress: 0,
                access: selectedPackage,
              },
            });
            setSelectedCourse('');
            setSelectedPackage('');
          } else {
            toast.error('Пожалуйста, выберите курс и пакет.');
          }
        }}>
        Добавить
      </button>
    </div>
  );
}
