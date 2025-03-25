// components/admin/CourseList.jsx
import { useEffect, useState, useMemo } from 'react';
import { useAdmin } from '../../../context/AdminContext';
import { debounce } from 'lodash';
import { toast } from 'react-toastify';
import EditCourse from '../EditCourse/EditCourse';
import scss from './CourseList.module.scss';
import TitleListCourses from './TitleListCourses/TitleListCourses';
import TextListCourses from './TextListCourses/TextListCourses';
import FilterCourses from './FilterCourses/FilterCourses';
import PaginationOnCourses from './PaginationOnCourses/PaginationOnCourses';
import AmountCourses from './AmountCourses/AmountCourses';

export default function CourseList() {
  const { courses, fetchAllCourses, deleteCourse, setError } = useAdmin();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortOption, setSortOption] = useState('title-asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [coursesPerPage] = useState(2);
  const [editingCourseId, setEditingCourseId] = useState(null);

  useEffect(() => {
    fetchAllCourses();
  }, [fetchAllCourses]);

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
    .slice() // Создаём копию массива, чтобы не мутировать оригинал
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]; // Сортируем по createdAt (по убыванию)

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
  const handleDelete = async (courseId) => {
    if (window.confirm('Вы уверены, что хотите удалить этот курс?')) {
      deleteCourse(courseId)
        .then(() => toast.success('Курс удален!'))
        .catch((error) => toast.error('Ошибка при удалении: ' + error.message));
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

  // Иначе показываем список курсов
  return (
    <>
      <AmountCourses categoryCounts={categoryCounts} lastCourse={lastCourse} />
      <div className={scss.listMainBlock}>
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
              />
            ) : (
              <p> Курсы не найдены.</p>
            )}
          </table>
        </div>
        {/* Пагинация */}
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
