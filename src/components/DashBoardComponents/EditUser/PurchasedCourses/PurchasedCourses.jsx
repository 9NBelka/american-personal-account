import scss from '../EditUser.module.scss';

export default function PurchasedCourses({
  values,
  setFieldValue,
  getCourseTitle,
  getAccessLevelName,
  accessLevels,
  courses,
}) {
  return (
    <div className={scss.formGroup}>
      <label>Купленные курсы:</label>
      <ul className={scss.courseList}>
        {Object.keys(values.purchasedCourses).map((courseId) => {
          const course = courses.find((c) => c.id === courseId);
          const currentAccess = course?.access || values.purchasedCourses[courseId].access;
          const isOutOfSync = course && course.access !== values.purchasedCourses[courseId].access;

          return (
            <li key={courseId} className={scss.courseItem}>
              <span>
                {getCourseTitle(courseId)} (
                {getAccessLevelName(values.purchasedCourses[courseId].access)})
                {isOutOfSync && (
                  <span className={scss.warning}>
                    (Уровень доступа данного курса {getAccessLevelName(currentAccess)})
                  </span>
                )}
              </span>
              <div className={scss.courseActions}>
                {/* Выпадающий список для редактирования пакета */}
                <select
                  value={values.purchasedCourses[courseId].access}
                  onChange={(e) => {
                    setFieldValue('purchasedCourses', {
                      ...values.purchasedCourses,
                      [courseId]: {
                        ...values.purchasedCourses[courseId],
                        access: e.target.value,
                      },
                    });
                  }}
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
                  onClick={() => {
                    if (window.confirm('Вы уверены, что хотите удалить этот курс?')) {
                      const updatedCourses = { ...values.purchasedCourses };
                      delete updatedCourses[courseId];
                      setFieldValue('purchasedCourses', updatedCourses);
                    }
                  }}
                  className={scss.removeCourseButton}>
                  Удалить
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
