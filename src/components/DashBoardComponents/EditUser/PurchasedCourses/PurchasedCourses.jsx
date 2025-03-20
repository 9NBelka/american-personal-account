// components/admin/PurchasedCourses.jsx
import scss from '../EditUser.module.scss';

export default function PurchasedCourses({ values, setFieldValue, getCourseTitle }) {
  return (
    <div className={scss.formGroup}>
      <label>Купленные курсы:</label>
      <ul className={scss.courseList}>
        {Object.keys(values.purchasedCourses).map((courseId) => (
          <li key={courseId} className={scss.courseItem}>
            <span>
              {getCourseTitle(courseId)} (
              {values.purchasedCourses[courseId].access === 'vanilla' ? 'Vanilla' : 'Standard'})
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
                <option value='vanilla'>Vanilla</option>
                <option value='standard'>Standard</option>
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
        ))}
      </ul>
    </div>
  );
}
