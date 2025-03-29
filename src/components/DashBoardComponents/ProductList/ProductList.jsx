import { useEffect, useState } from 'react';
import { useAdmin } from '../../../context/AdminContext';
import { toast } from 'react-toastify';
import scss from './ProductList.module.scss';
import TitleListProducts from './TitleListProducts/TitleListProducts';
import TextListProducts from './TextListProducts/TextListProducts';

export default function ProductList() {
  const { products, fetchAllProducts } = useAdmin();
  const [editingProductId, setEditingProductId] = useState(null);

  // Загружаем продукты при монтировании компонента
  useEffect(() => {
    fetchAllProducts();
  }, [fetchAllProducts]);

  // Обработчик редактирования
  const handleEdit = (productId) => {
    setEditingProductId(productId);
  };

  // Обработчик удаления (пока заглушка, так как функции deleteProduct нет)
  const handleDelete = (productId) => {
    if (window.confirm('Вы уверены, что хотите удалить этот продукт?')) {
      toast.info('Функция удаления продукта пока не реализована.');
    }
  };

  // Показываем индикатор загрузки, если продукты еще не загрузились
  if (products.length === 0) {
    return <div>Загрузка продуктов...</div>;
  }

  // Показываем список продуктов
  return (
    <div className={scss.listMainBlock}>
      <h2 className={scss.listTitle}>Список продуктов</h2>
      <div className={scss.tableWrapper}>
        <table className={scss.table}>
          <TitleListProducts />
          {products.length > 0 ? (
            <TextListProducts
              products={products}
              handleEdit={handleEdit}
              handleDelete={handleDelete}
            />
          ) : (
            <p>Продукты не найдены.</p>
          )}
        </table>
      </div>
    </div>
  );
}
