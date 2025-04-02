import scss from '../EditUser.module.scss';
import scsss from './AddCourseForm.module.scss';
import { toast } from 'react-toastify';
import { useEffect } from 'react';

export default function AddCourseForm({
  courses,
  values,
  setFieldValue,
  selectedCourse,
  setSelectedCourse,
  selectedPackage,
  setSelectedPackage,
  getCourseTitle,
  accessLevels,
}) {
  const selectedCourseData = courses.find((course) => course.id === selectedCourse);
  const courseAccessLevel = selectedCourseData?.access || null;
  const accessLevelName =
    accessLevels.find((level) => level.id === courseAccessLevel)?.name || courseAccessLevel;

  useEffect(() => {
    if (selectedCourseData && courseAccessLevel) {
      setSelectedPackage(courseAccessLevel);
    } else {
      setSelectedPackage('');
    }
  }, [selectedCourse, selectedCourseData, courseAccessLevel, setSelectedPackage]);

  const isAccessOutOfSync =
    selectedCourse && courseAccessLevel && selectedPackage && selectedPackage !== courseAccessLevel;

  const getAccessLevelName = (accessId) => {
    const accessLevel = accessLevels.find((level) => level.id === accessId);
    return accessLevel ? accessLevel.name : accessId || 'Не указан';
  };

  const handleRemoveCourse = (courseId) => {
    if (window.confirm('Вы уверены, что хотите удалить этот курс?')) {
      const updatedCourses = { ...values.purchasedCourses };
      delete updatedCourses[courseId];
      setFieldValue('purchasedCourses', updatedCourses);
    }
  };

  const handleChangeAccessLevel = (courseId, newAccessLevel) => {
    setFieldValue('purchasedCourses', {
      ...values.purchasedCourses,
      [courseId]: {
        ...values.purchasedCourses[courseId],
        access: newAccessLevel,
      },
    });
  };

  return (
    <div className={scss.addCourseContainer}>
      {/* Отображение добавленных курсов */}
      {Object.keys(values.purchasedCourses).length > 0 && (
        <div className={scsss.addedCourses}>
          <h4>Добавленные курсы:</h4>
          <ul className={scsss.addedCoursesList}>
            {Object.keys(values.purchasedCourses).map((courseId) => (
              <li key={courseId} className={scsss.addedCourseItem}>
                <span>{getCourseTitle(courseId)}</span>
                <div className={scss.courseActions}>
                  <select
                    value={values.purchasedCourses[courseId].access}
                    onChange={(e) => handleChangeAccessLevel(courseId, e.target.value)}
                    className={scss.packageSelect}>
                    <option value='' disabled>
                      Выберите уровень доступа
                    </option>
                    {accessLevels.map((level) => (
                      <option key={level.id} value={level.id}>
                        {level.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type='button'
                    className={scsss.removeCourseButton}
                    onClick={() => handleRemoveCourse(courseId)}>
                    Удалить
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className={scss.addCourseField}>
        <label htmlFor='addCourse'>Добавить курс:</label>
        <select
          id='addCourse'
          value={selectedCourse}
          onChange={(e) => {
            setSelectedCourse(e.target.value);
          }}
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
            Выберите уровень доступа
          </option>
          {accessLevels && accessLevels.length > 0 ? (
            accessLevels.map((level) => (
              <option key={level.id} value={level.id}>
                {level.name}
              </option>
            ))
          ) : (
            <option disabled>Загрузка уровней доступа...</option>
          )}
        </select>
        {isAccessOutOfSync && (
          <div className={scss.warning}>
            Уровень доступа курса: {accessLevelName}. Выбранный уровень (
            {accessLevels.find((level) => level.id === selectedPackage)?.name}) отличается.
          </div>
        )}
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
            toast.error('Пожалуйста, выберите курс и уровень доступа.');
          }
        }}>
        Добавить
      </button>
    </div>
  );
}
