import { useState, useEffect } from 'react';
import { useAdmin } from '../../../context/AdminContext';
import scss from './PromoCodes.module.scss';
import { BsPlus, BsTrash, BsPencil } from 'react-icons/bs';
import { toast } from 'react-toastify';
import { v4 as uuidv4 } from 'uuid';

export default function PromoCodes() {
  const {
    products,
    fetchAllProducts,
    accessLevels,
    promoCodes,
    addPromoCode,
    updatePromoCode,
    deletePromoCode,
    togglePromoCode,
    error,
    setError,
  } = useAdmin();
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPromoCodeId, setEditingPromoCodeId] = useState(null);
  const [promoCodeName, setPromoCodeName] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [items, setItems] = useState([{ productId: '', accessLevelId: '' }]);
  const [productSearchTerms, setProductSearchTerms] = useState(['']);
  const [accessLevelSearchTerms, setAccessLevelSearchTerms] = useState(['']);
  const [expiryDate, setExpiryDate] = useState('');

  useEffect(() => {
    fetchAllProducts();
  }, [fetchAllProducts]);

  // Синхронизируем search terms с items
  useEffect(() => {
    setProductSearchTerms((prev) => {
      const newTerms = items.map((_, index) => prev[index] || '');
      return newTerms;
    });
    setAccessLevelSearchTerms((prev) => {
      const newTerms = items.map((_, index) => prev[index] || '');
      return newTerms;
    });
  }, [items]);

  const handleCreatePromoCode = () => {
    setIsCreating(true);
    setIsEditing(false);
    setEditingPromoCodeId(null);
    setPromoCodeName('');
    setDiscountPercent(0);
    setItems([{ productId: '', accessLevelId: '' }]);
    setProductSearchTerms(['']);
    setAccessLevelSearchTerms(['']);
    setExpiryDate('');
  };

  const handleEditPromoCode = (promoCode) => {
    setIsEditing(true);
    setIsCreating(false);
    setEditingPromoCodeId(promoCode.id);
    setPromoCodeName(promoCode.name);
    setDiscountPercent(promoCode.discountPercent);
    setItems(promoCode.items.map((item) => ({ ...item })));
    setProductSearchTerms(promoCode.items.map(() => ''));
    setAccessLevelSearchTerms(promoCode.items.map(() => ''));
    setExpiryDate(promoCode.expiryDate || '');
  };

  const handleCancel = () => {
    setIsCreating(false);
    setIsEditing(false);
    setEditingPromoCodeId(null);
    setPromoCodeName('');
    setDiscountPercent(0);
    setItems([{ productId: '', accessLevelId: '' }]);
    setProductSearchTerms(['']);
    setAccessLevelSearchTerms(['']);
    setExpiryDate('');
  };

  const handleAddItem = () => {
    setItems([...items, { productId: '', accessLevelId: '' }]);
    setProductSearchTerms((prev) => [...prev, '']);
    setAccessLevelSearchTerms((prev) => [...prev, '']);
  };

  const handleProductSearchChange = (index, value) => {
    const newSearchTerms = [...productSearchTerms];
    newSearchTerms[index] = value || '';
    setProductSearchTerms(newSearchTerms);
  };

  const handleAccessLevelSearchChange = (index, value) => {
    const newSearchTerms = [...accessLevelSearchTerms];
    newSearchTerms[index] = value || '';
    setAccessLevelSearchTerms(newSearchTerms);
  };

  const handleProductSelect = (index, productId) => {
    const newItems = [...items];
    if (newItems[index].productId === productId) return; // Избегаем лишних обновлений

    newItems[index].productId = productId;

    const selectedProduct = products.find((p) => p.id === productId);
    const productAccessLevel = selectedProduct?.access || '';
    newItems[index].accessLevelId = productAccessLevel;

    setItems(newItems);

    const newSearchTerms = [...productSearchTerms];
    newSearchTerms[index] = '';
    setProductSearchTerms(newSearchTerms);
  };

  const handleAccessLevelSelect = (index, accessLevelId) => {
    const newItems = [...items];
    newItems[index].accessLevelId = accessLevelId;
    setItems(newItems);

    const newSearchTerms = [...accessLevelSearchTerms];
    newSearchTerms[index] = '';
    setAccessLevelSearchTerms(newSearchTerms);
  };

  const handleDiscountChange = (value) => {
    setDiscountPercent(Number(value) || 0);
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
    setProductSearchTerms((prev) => prev.filter((_, i) => i !== index));
    setAccessLevelSearchTerms((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!promoCodeName) {
        throw new Error('Введите название промокода');
      }

      if (discountPercent <= 0 || discountPercent > 100) {
        throw new Error('Процент скидки должен быть от 1 до 100');
      }

      if (items.some((item) => !item.productId || !item.accessLevelId)) {
        throw new Error('Убедитесь, что все товары и уровни доступа выбраны');
      }

      if (isEditing) {
        const existingPromoCode = promoCodes.find(
          (p) =>
            p.name.toLowerCase() === promoCodeName.toLowerCase() && p.id !== editingPromoCodeId,
        );
        if (existingPromoCode) {
          throw new Error('Промокод с таким названием уже существует');
        }

        const promoCodeData = {
          name: promoCodeName,
          discountPercent,
          items,
          createdAt: promoCodes.find((p) => p.id === editingPromoCodeId).createdAt,
          available: promoCodes.find((p) => p.id === editingPromoCodeId).available,
          expiryDate: expiryDate || null,
        };

        await updatePromoCode(editingPromoCodeId, promoCodeData);
        toast.success('Промокод успешно обновлён!');
      } else {
        const existingPromoCode = promoCodes.find(
          (p) => p.name.toLowerCase() === promoCodeName.toLowerCase(),
        );
        if (existingPromoCode) {
          throw new Error('Промокод с таким названием уже существует');
        }

        const promoCodeData = {
          id: `promo_${uuidv4()}`,
          name: promoCodeName,
          discountPercent,
          items,
          createdAt: new Date().toISOString(),
          available: true,
          expiryDate: expiryDate || null,
        };

        await addPromoCode(promoCodeData);
        toast.success('Промокод успешно создан!');
      }

      setIsCreating(false);
      setIsEditing(false);
      setEditingPromoCodeId(null);
      setPromoCodeName('');
      setDiscountPercent(0);
      setItems([{ productId: '', accessLevelId: '' }]);
      setProductSearchTerms(['']);
      setAccessLevelSearchTerms(['']);
      setExpiryDate('');
    } catch (err) {
      setError('Ошибка: ' + err.message);
      toast.error('Ошибка: ' + err.message);
    }
  };

  const handleDeletePromoCode = async (promoCodeId) => {
    if (window.confirm('Вы уверены, что хотите удалить этот промокод?')) {
      try {
        await deletePromoCode(promoCodeId);
        toast.success('Промокод успешно удалён!');
      } catch (error) {
        toast.error('Ошибка при удалении: ' + error.message);
      }
    }
  };

  const handleTogglePromoCode = async (promoCodeId) => {
    try {
      await togglePromoCode(promoCodeId);
      toast.success('Статус промокода изменён!');
    } catch (error) {
      toast.error('Ошибка при изменении статуса: ' + error.message);
    }
  };

  const getProductName = (productId) => {
    const product = products.find((p) => p.id === productId);
    return product ? product.nameProduct : 'Не найден';
  };

  const getAccessLevelName = (accessLevelId) => {
    const accessLevel = accessLevels.find((a) => a.id === accessLevelId);
    return accessLevel ? accessLevel.name : 'Не найден';
  };

  const getFilteredProducts = (searchTerm) => {
    if (!searchTerm) return [];
    return products.filter((product) =>
      product.nameProduct.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  };

  const getFilteredAccessLevels = (searchTerm) => {
    if (!searchTerm) return [];
    return accessLevels.filter((accessLevel) =>
      accessLevel.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Не указано';
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={scss.promoCodes}>
      <h2 className={scss.title}>Промокоды</h2>
      {error && <p className={scss.error}>{error}</p>}

      {!isCreating && !isEditing && (
        <button className={scss.createPromoCodeButton} onClick={handleCreatePromoCode}>
          Создать промокод
        </button>
      )}

      {(isCreating || isEditing) && (
        <form onSubmit={handleSubmit} className={scss.promoCodeForm}>
          <div className={scss.field}>
            <label htmlFor='promoCodeName'>Название промокода</label>
            <input
              type='text'
              id='promoCodeName'
              value={promoCodeName}
              onChange={(e) => setPromoCodeName(e.target.value)}
              placeholder='Введите название промокода...'
              required
            />
          </div>

          <div className={scss.field}>
            <label htmlFor='discountPercent'>Процент скидки</label>
            <input
              type='number'
              id='discountPercent'
              value={discountPercent}
              onChange={(e) => handleDiscountChange(e.target.value)}
              placeholder='Процент скидки...'
              min='1'
              max='100'
              required
            />
          </div>

          <div className={scss.field}>
            <label htmlFor='expiryDate'>Дата истечения срока действия</label>
            <input
              type='datetime-local'
              id='expiryDate'
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              placeholder='Выберите дату и время...'
            />
          </div>

          {items.map((item, index) => {
            const filteredProducts = getFilteredProducts(productSearchTerms[index]);
            const filteredAccessLevels = getFilteredAccessLevels(accessLevelSearchTerms[index]);

            // Проверяем, отличается ли выбранный уровень доступа от уровня доступа товара
            const selectedProduct = products.find((p) => p.id === item.productId);
            const productAccessLevel = selectedProduct?.access || '';
            const isAccessOutOfSync =
              item.productId &&
              productAccessLevel &&
              item.accessLevelId &&
              item.accessLevelId !== productAccessLevel;

            return (
              <div key={index} className={scss.promoCodeItem}>
                <div className={scss.searchContainer}>
                  <input
                    type='text'
                    value={productSearchTerms[index]}
                    onChange={(e) => handleProductSearchChange(index, e.target.value)}
                    placeholder='Поиск товара...'
                    disabled={!!item.productId}
                  />
                  {productSearchTerms[index] && !item.productId && filteredProducts.length > 0 && (
                    <ul className={scss.suggestions}>
                      {filteredProducts.map((product) => (
                        <li
                          key={product.id}
                          className={scss.suggestionItem}
                          onClick={() => handleProductSelect(index, product.id)}>
                          {product.nameProduct}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {item.productId && <span>{getProductName(item.productId)}</span>}

                <div className={scss.searchContainer}>
                  <input
                    type='text'
                    value={accessLevelSearchTerms[index]}
                    onChange={(e) => handleAccessLevelSearchChange(index, e.target.value)}
                    placeholder='Поиск уровня доступа...'
                    disabled={!!item.accessLevelId}
                  />
                  {accessLevelSearchTerms[index] &&
                    !item.accessLevelId &&
                    filteredAccessLevels.length > 0 && (
                      <ul className={scss.suggestions}>
                        {filteredAccessLevels.map((accessLevel) => (
                          <li
                            key={accessLevel.id}
                            className={scss.suggestionItem}
                            onClick={() => handleAccessLevelSelect(index, accessLevel.id)}>
                            {accessLevel.name}
                          </li>
                        ))}
                      </ul>
                    )}
                </div>

                {item.accessLevelId && (
                  <span>
                    {getAccessLevelName(item.accessLevelId)}
                    {isAccessOutOfSync && (
                      <span className={scss.warning}>
                        {' '}
                        (Уровень доступа товара: {getAccessLevelName(productAccessLevel)})
                      </span>
                    )}
                  </span>
                )}

                <button
                  type='button'
                  className={scss.deleteButton}
                  onClick={() => handleRemoveItem(index)}>
                  <BsTrash />
                </button>
              </div>
            );
          })}

          <button type='button' className={scss.addItemButton} onClick={handleAddItem}>
            <BsPlus /> Добавить товар и уровень доступа
          </button>

          <div className={scss.formButtons}>
            <button type='submit' className={scss.submitButton}>
              {isEditing ? 'Сохранить изменения' : 'Создать промокод'}
            </button>
            <button type='button' className={scss.cancelButton} onClick={handleCancel}>
              Отмена
            </button>
          </div>
        </form>
      )}

      <div className={scss.promoCodeList}>
        {promoCodes.map((promoCode) => (
          <div key={promoCode.id} className={scss.promoCode}>
            <div className={scss.promoCodeHeader}>
              <div className={scss.promoCodeName}>{promoCode.name}</div>
              {promoCode.available && <span className={scss.activeLabel}>Активен</span>}
            </div>
            <div className={scss.createdAt}>Создан: {formatDate(promoCode.createdAt)}</div>
            <div className={scss.expiryDate}>Истекает: {formatDate(promoCode.expiryDate)}</div>
            <div className={scss.discountPercent}>Скидка: {promoCode.discountPercent}%</div>
            <div className={scss.promoCodeItems}>
              {promoCode.items.map((item, index) => (
                <div key={index} className={scss.item}>
                  <span className={scss.productName}>{getProductName(item.productId)}</span>
                  <span className={scss.accessLevelName}>
                    {getAccessLevelName(item.accessLevelId)}
                  </span>
                </div>
              ))}
            </div>
            <div className={scss.promoCodeActions}>
              <button
                className={promoCode.available ? scss.deactivateButton : scss.activateButton}
                onClick={() => handleTogglePromoCode(promoCode.id)}>
                {promoCode.available ? 'Выключить' : 'Включить'}
              </button>
              <button className={scss.editButton} onClick={() => handleEditPromoCode(promoCode)}>
                <BsPencil /> Редактировать
              </button>
              <button
                className={scss.deleteButton}
                onClick={() => handleDeletePromoCode(promoCode.id)}>
                Удалить промокод
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
