import { useEffect, useState, useMemo } from 'react';
import { debounce } from 'lodash';
import { toast } from 'react-toastify';
import EditCourse from '../EditCourse/EditCourse';
import scss from './CourseList.module.scss';
import TitleListCourses from './TitleListCourses/TitleListCourses';
import TextListCourses from './TextListCourses/TextListCourses';
import FilterCourses from './FilterCourses/FilterCourses';
import PaginationOnCourses from './PaginationOnCourses/PaginationOnCourses';
import AmountCourses from './AmountCourses/AmountCourses';
import { useOutletContext } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCourses, deleteCourse, addCourse } from '../../../store/slices/adminSlice';

export default function CourseList() {
  const { handleSectionClick } = useOutletContext();
  const dispatch = useDispatch();

  const { courses, accessLevels, status } = useSelector((state) => state.admin);
  const { userRole } = useSelector((state) => state.auth);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortOption, setSortOption] = useState('title-asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [coursesPerPage] = useState(20);
  const [editingCourseId, setEditingCourseId] = useState(null);
  const [duplicatingCourseId, setDuplicatingCourseId] = useState(null);

  useEffect(() => {
    dispatch(fetchCourses());
  }, [dispatch]);

  // Debounce для поиска
  const debouncedSetSearchQuery = useMemo(
    () =>
      debounce((value) => {
        setSearchQuery(value);
        setCurrentPage(1);
      }, 300),
    [],
  );

  // Подсчет количества курсов по категориям
  const categoryCounts = {
    all: courses.length,
    Course: courses.filter((course) => course.category === 'Course').length,
    'Master class': courses.filter((course) => course.category === 'Master class').length,
  };

  // Находим последний добавленный курс
  const lastCourse = courses
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

  // Фильтрация и сортировка курсов для списка
  const filteredCourses = courses
    .filter((course) => {
      const matchesCategory = categoryFilter === 'all' || course.category === categoryFilter;
      const matchesSearch =
        searchQuery === '' ||
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      if (sortOption === 'title-asc') {
        return a.title.localeCompare(b.title);
      } else if (sortOption === 'title-desc') {
        return b.title.localeCompare(a.title);
      } else if (sortOption === 'category-asc') {
        return (a.category || '').localeCompare(b.category || '');
      } else if (sortOption === 'category-desc') {
        return (b.category || '').localeCompare(a.category || '');
      }
      return 0;
    });

  // Пагинация
  const totalCourses = filteredCourses.length;
  const totalPages = Math.ceil(totalCourses / coursesPerPage);
  const startIndex = (currentPage - 1) * coursesPerPage;
  const paginatedCourses = filteredCourses.slice(startIndex, startIndex + coursesPerPage);

  // Обработчик редактирования
  const handleEdit = (courseId) => {
    setEditingCourseId(courseId);
  };

  // Обработчик удаления
  const handleDelete = (courseId) => {
    if (window.confirm('Вы уверены, что хотите удалить этот курс?')) {
      dispatch(deleteCourse(courseId))
        .unwrap()
        .then(() => toast.success('Курс удален!'))
        .catch((error) => toast.error('Ошибка при удалении: ' + error));
    }
  };

  // Обработчик дублирования
  const handleDuplicate = async (courseId) => {
    if (duplicatingCourseId) return;

    setDuplicatingCourseId(courseId);
    const courseToDuplicate = courses.find((course) => course.id === courseId);
    if (!courseToDuplicate) {
      toast.error('Курс не найден');
      setDuplicatingCourseId(null);
      return;
    }

    let newId = courseToDuplicate.id;
    let newTitle = `${courseToDuplicate.title}_копия`;
    let counter = 1;

    // Проверяем уникальность ID с добавлением цифры
    while (courses.some((course) => course.id === newId + counter)) {
      counter++;
    }
    newId += counter;

    // Проверяем уникальность заголовка с добавлением номера
    while (courses.some((course) => course.title === newTitle + (counter > 1 ? counter : ''))) {
      counter++;
      newTitle = `${courseToDuplicate.title}_копия${counter}`;
    }
    if (counter > 1) {
      newTitle += counter;
    }

    // Создаем новый объект курса с глубоким копированием модулей
    const duplicatedCourse = {
      ...courseToDuplicate,
      id: newId,
      title: newTitle,
      createdAt: new Date().toISOString(),
      modules: Object.keys(courseToDuplicate.modules || {}).reduce((acc, moduleId) => {
        acc[`${moduleId}_${Date.now()}`] = {
          ...courseToDuplicate.modules[moduleId],
          lessons: [...(courseToDuplicate.modules[moduleId].lessons || [])],
        };
        return acc;
      }, {}),
    };

    try {
      await dispatch(addCourse(duplicatedCourse)).unwrap();
      toast.success('Курс успешно дублирован!');
    } catch (error) {
      toast.error(`Ошибка при дублировании курса: ${error}`);
    } finally {
      setDuplicatingCourseId(null);
    }
  };

  // Обработчик возврата к списку
  const handleBack = () => {
    setEditingCourseId(null);
  };

  // Обработчик смены страницы
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Если редактируем курс, показываем EditCourse
  if (editingCourseId) {
    return <EditCourse courseId={editingCourseId} onBack={handleBack} />;
  }

  // Показываем индикатор загрузки, если данные еще не загружены
  if (status === 'loading' && !duplicatingCourseId) {
    return <div>Загрузка курсов...</div>;
  }

  // Иначе показываем список курсов
  return (
    <>
      <AmountCourses categoryCounts={categoryCounts} lastCourse={lastCourse} />
      <div className={scss.listMainBlock}>
        {userRole === 'admin' && (
          <div>
            <button
              className={scss.addCourseButton}
              onClick={() => handleSectionClick('addCourse')}>
              Добавить курс
            </button>
          </div>
        )}
        <h2 className={scss.listTitle}>Список курсов</h2>

        {/* Фильтры и сортировка */}
        <FilterCourses
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          setCurrentPage={setCurrentPage}
          categoryCounts={categoryCounts}
          sortOption={sortOption}
          setSortOption={setSortOption}
          debouncedSetSearchQuery={debouncedSetSearchQuery}
        />
        <div className={scss.tableWrapper}>
          <table className={scss.table}>
            <TitleListCourses />
            {paginatedCourses.length > 0 ? (
              <TextListCourses
                courses={paginatedCourses}
                handleEdit={handleEdit}
                handleDelete={handleDelete}
                handleDuplicate={handleDuplicate}
                accessLevels={accessLevels}
                userRole={userRole}
                duplicatingCourseId={duplicatingCourseId}
              />
            ) : (
              <tbody>
                <tr>
                  <td>Курсы не найдены.</td>
                </tr>
              </tbody>
            )}
          </table>
        </div>

        {totalPages > 1 && (
          <PaginationOnCourses
            totalPages={totalPages}
            currentPage={currentPage}
            handlePageChange={handlePageChange}
          />
        )}
      </div>
    </>
  );
}
