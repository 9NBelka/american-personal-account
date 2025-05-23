import scss from './TextListProducts.module.scss';
import { useState } from 'react'; // Добавляем useState для управления состоянием загрузки

export default function TextListProducts({
  products,
  handleEdit,
  handleDelete,
  getAccessLevelName,
}) {
  // Функция для форматирования даты в формат DD.MM.YYYY
  const formatDate = (dateString) => {
    if (!dateString) return 'Нет даты';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  return (
    <tbody className={scss.listProducts}>
      {products.map((product, index) => {
        // Состояние для отслеживания загрузки изображения

        return (
          <tr key={product.id} className={scss.product}>
            <td>{index + 1}</td>
            <td>
              <div className={scss.imagePreview}>
                {isLoading && !hasError && <div className={scss.loader}>Загрузка...</div>}
                {product.imageProduct ? (
                  <img
                    className={scss.image}
                    src={product.imageProduct}
                    alt={product.nameProduct || 'productImage'}
                    onLoad={() => setIsLoading(false)}
                    onError={() => {
                      setIsLoading(false);
                      setHasError(true);
                    }}
                    style={{ display: isLoading || hasError ? 'none' : 'block' }}
                  />
                ) : null}
                {(hasError || !product.imageProduct) && (
                  <img
                    className={scss.image}
                    src='/img/defaultAvatar.webp'
                    alt='defaultProductImage'
                    onLoad={() => setIsLoading(false)}
                    style={{ display: isLoading ? 'none' : 'block' }}
                  />
                )}
              </div>
            </td>
            <td>{product.nameProduct || 'Без названия'}</td>
            <td>{product.categoryProduct || 'Нет категории'}</td>
            <td>
              {product.discountedPrice ? (
                <div className={scss.priceContainer}>
                  <span className={scss.originalPrice}>{product.priceProduct} $</span>
                  <span className={scss.discountedPrice}>
                    {product.discountedPrice} $ (-{product.discountPercent}%)
                  </span>
                </div>
              ) : product.priceProduct ? (
                `${product.priceProduct} $`
              ) : (
                'Нет цены'
              )}
            </td>
            <td>{getAccessLevelName(product.access)}</td>
            <td>{product.available ? 'В продаже' : 'Не в продаже'}</td>
            <td>{formatDate(product.createdAtProduct)}</td>
            <td className={scss.actions}>
              <button className={scss.editButton} onClick={() => handleEdit(product.id)}>
                Редактировать
              </button>
              <button className={scss.deleteButton} onClick={() => handleDelete(product.id)}>
                Удалить
              </button>
            </td>
          </tr>
        );
      })}
    </tbody>
  );
}
