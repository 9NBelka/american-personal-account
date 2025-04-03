import { useEffect, useState, useCallback } from 'react';
import { useAdmin } from '../../../context/AdminContext';
import { toast } from 'react-toastify';
import scss from './ProductList.module.scss';
import TitleListProducts from './TitleListProducts/TitleListProducts';
import TextListProducts from './TextListProducts/TextListProducts';
import EditProduct from './EditProduct/EditProduct';
import FilterProducts from './FilterProducts/FilterProducts';
import clsx from 'clsx';

export default function ProductList() {
  const { products, fetchAllProducts, deleteProduct, accessLevels } = useAdmin();
  const [editingProductId, setEditingProductId] = useState(null);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [accessFilter, setAccessFilter] = useState('all');
  const [availableFilter, setAvailableFilter] = useState('all');
  const [sortOption, setSortOption] = useState('name-asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 5;

  // Загружаем продукты при монтировании компонента
  useEffect(() => {
    fetchAllProducts();
  }, [fetchAllProducts]);

  // Подсчёт количества продуктов по категориям, типам доступа и статусу доступности
  const categoryCounts = useCallback(() => {
    const counts = {
      all: products.length,
      Course: 0,
      'Master class': 0,
    };

    products.forEach((product) => {
      if (product.categoryProduct === 'Course') counts.Course += 1;
      if (product.categoryProduct === 'Master class') counts['Master class'] += 1;
    });

    return counts;
  }, [products]);

  const accessCounts = useCallback(() => {
    const counts = { all: products.length };
    accessLevels.forEach((level) => {
      counts[level.id] = 0;
    });

    products.forEach((product) => {
      if (product.access && counts[product.access] !== undefined) {
        counts[product.access] += 1;
      }
    });

    return counts;
  }, [products, accessLevels]);

  const availableCounts = useCallback(() => {
    const counts = {
      all: products.length,
      available: 0,
      'not-available': 0,
    };

    products.forEach((product) => {
      if (product.available) counts.available += 1;
      else counts['not-available'] += 1;
    });

    return counts;
  }, [products]);

  // Функция debounce для поиска
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  const debouncedSetSearchQuery = debounce((value) => {
    setSearchQuery(value);
    setCurrentPage(1);
  }, 300);

  // Функция для получения названия уровня доступа
  const getAccessLevelName = (accessId) => {
    const accessLevel = accessLevels.find((level) => level.id === accessId);
    return accessLevel ? accessLevel.name : accessId || 'Не указан';
  };

  // Фильтрация и сортировка продуктов
  useEffect(() => {
    let filtered = [...products];

    // Фильтрация по категории
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((product) => product.categoryProduct === categoryFilter);
    }

    // Фильтрация по типу доступа
    if (accessFilter !== 'all') {
      filtered = filtered.filter((product) => product.access === accessFilter);
    }

    // Фильтрация по статусу доступности
    if (availableFilter !== 'all') {
      filtered = filtered.filter((product) =>
        availableFilter === 'available' ? product.available : !product.available,
      );
    }

    // Поиск по названию или ID
    if (searchQuery) {
      filtered = filtered.filter(
        (product) =>
          product.nameProduct.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.id.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // Сортировка
    filtered.sort((a, b) => {
      if (sortOption === 'name-asc') {
        return a.nameProduct.localeCompare(b.nameProduct);
      } else if (sortOption === 'name-desc') {
        return b.nameProduct.localeCompare(a.nameProduct);
      } else if (sortOption === 'price-asc') {
        return a.priceProduct - b.priceProduct;
      } else if (sortOption === 'price-desc') {
        return b.priceProduct - a.priceProduct;
      }
      return 0;
    });

    setFilteredProducts(filtered);
  }, [products, categoryFilter, accessFilter, availableFilter, sortOption, searchQuery]);

  // Пагинация
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Обработчик редактирования
  const handleEdit = (productId) => {
    setEditingProductId(productId);
  };

  // Обработчик возврата к списку
  const handleBack = () => {
    setEditingProductId(null);
  };

  // Обработчик удаления
  const handleDelete = async (productId) => {
    if (window.confirm('Вы уверены, что хотите удалить этот продукт?')) {
      try {
        await deleteProduct(productId);
        toast.success('Продукт успешно удален!');
      } catch (error) {
        toast.error('Ошибка при удалении: ' + error.message);
      }
    }
  };

  // Если выбран продукт для редактирования, показываем форму редактирования
  if (editingProductId) {
    return <EditProduct productId={editingProductId} onBack={handleBack} />;
  }

  // Показываем индикатор загрузки, если продукты еще не загрузились
  if (products.length === 0) {
    return <div>Загрузка продуктов...</div>;
  }

  // Показываем список продуктов
  return (
    <div className={scss.listMainBlock}>
      <h2 className={scss.listTitle}>Список продуктов</h2>

      {/* Фильтры */}
      <FilterProducts
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        accessFilter={accessFilter}
        setAccessFilter={setAccessFilter}
        availableFilter={availableFilter}
        setAvailableFilter={setAvailableFilter}
        setCurrentPage={setCurrentPage}
        categoryCounts={categoryCounts()}
        accessCounts={accessCounts()}
        availableCounts={availableCounts()}
        sortOption={sortOption}
        setSortOption={setSortOption}
        debouncedSetSearchQuery={debouncedSetSearchQuery}
        accessLevels={accessLevels} // Передаем accessLevels
      />

      {/* Таблица продуктов */}
      <div className={scss.tableWrapper}>
        <table className={scss.table}>
          <TitleListProducts />
          {currentProducts.length > 0 ? (
            <TextListProducts
              products={currentProducts}
              handleEdit={handleEdit}
              handleDelete={handleDelete}
              getAccessLevelName={getAccessLevelName} // Передаем функцию
            />
          ) : (
            <tbody>
              <tr>
                <td colSpan='8'>Продукты не найдены.</td>
              </tr>
            </tbody>
          )}
        </table>
      </div>

      {/* Пагинация */}
      {totalPages > 1 && (
        <div className={scss.pagination}>
          {Array.from({ length: totalPages }, (_, index) => (
            <button
              key={index + 1}
              className={clsx(scss.pageButton, currentPage === index + 1 && scss.active)}
              onClick={() => handlePageChange(index + 1)}>
              {index + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
