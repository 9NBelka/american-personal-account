import scss from './TextListProducts.module.scss';

export default function TextListProducts({ products, handleEdit, handleDelete }) {
  // Функция для форматирования даты в формат DD.MM.YYYY
  const formatDate = (dateString) => {
    if (!dateString) return 'Нет даты';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  return (
    <tbody className={scss.listProducts}>
      {products.map((product, index) => (
        <tr key={product.id} className={scss.product}>
          <td>{index + 1}</td>
          <td>
            <div className={scss.imagePreview}>
              {product.imageProduct ? (
                <img
                  className={scss.image}
                  src={product.imageProduct}
                  alt='productImage'
                  onError={(e) => (e.target.src = '/img/defaultProductImage.webp')}
                />
              ) : (
                <img
                  className={scss.image}
                  src='/img/defaultProductImage.webp'
                  alt='productImage'
                />
              )}
            </div>
          </td>
          <td>{product.nameProduct || 'Без названия'}</td>
          <td>{product.categoryProduct || 'Нет категории'}</td>
          <td>{product.priceProduct ? `${product.priceProduct} $` : 'Нет цены'}</td>
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
      ))}
    </tbody>
  );
}
