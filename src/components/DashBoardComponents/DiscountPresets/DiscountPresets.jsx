import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux'; // Добавляем Redux хуки
import {
  addDiscountPreset,
  updateDiscountPreset,
  deleteDiscountPreset,
  toggleDiscountPreset,
  setError,
  clearError,
} from '../../../store/slices/adminSlice'; // Импортируем действия
import scss from './DiscountPresets.module.scss';
import { BsPlus, BsTrash, BsPencil } from 'react-icons/bs';
import { toast } from 'react-toastify';
import { v4 as uuidv4 } from 'uuid';

export default function DiscountPresets() {
  const dispatch = useDispatch();

  // Получаем данные из Redux store
  const { products, discountPresets, error } = useSelector((state) => state.admin);

  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPresetId, setEditingPresetId] = useState(null);
  const [presetName, setPresetName] = useState('');
  const [discountItems, setDiscountItems] = useState([]);
  const [searchTerms, setSearchTerms] = useState([]);

  useEffect(() => {
    setSearchTerms(discountItems.map(() => ''));
  }, [discountItems]);

  const handleCreatePreset = () => {
    setIsCreating(true);
    setIsEditing(false);
    setEditingPresetId(null);
    setPresetName('');
    setDiscountItems([{ productId: '', discountPercent: 0 }]);
    setSearchTerms(['']);
  };

  const handleEditPreset = (preset) => {
    setIsEditing(true);
    setIsCreating(false);
    setEditingPresetId(preset.id);
    setPresetName(preset.name);
    setDiscountItems(preset.discountItems.map((item) => ({ ...item })));
    setSearchTerms(preset.discountItems.map(() => ''));
  };

  const handleCancel = () => {
    setIsCreating(false);
    setIsEditing(false);
    setEditingPresetId(null);
    setPresetName('');
    setDiscountItems([]);
    setSearchTerms([]);
  };

  const handleAddItem = () => {
    setDiscountItems([...discountItems, { productId: '', discountPercent: 0 }]);
  };

  const handleSearchChange = (index, value) => {
    const newSearchTerms = [...searchTerms];
    newSearchTerms[index] = value;
    setSearchTerms(newSearchTerms);
  };

  const handleProductSelect = (index, productId) => {
    const newDiscountItems = [...discountItems];
    newDiscountItems[index].productId = productId;
    setDiscountItems(newDiscountItems);

    const newSearchTerms = [...searchTerms];
    newSearchTerms[index] = '';
    setSearchTerms(newSearchTerms);
  };

  const handleDiscountChange = (index, value) => {
    const newDiscountItems = [...discountItems];
    newDiscountItems[index].discountPercent = Number(value);
    setDiscountItems(newDiscountItems);
  };

  const handleRemoveItem = (index) => {
    setDiscountItems(discountItems.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!presetName) {
        throw new Error('Введите название пресета');
      }

      if (discountItems.some((item) => !item.productId || item.discountPercent <= 0)) {
        throw new Error('Убедитесь, что все товары выбраны и процент скидки больше 0');
      }

      if (isEditing) {
        const existingPreset = discountPresets.find(
          (p) => p.name.toLowerCase() === presetName.toLowerCase() && p.id !== editingPresetId,
        );
        if (existingPreset) {
          throw new Error('Пресет с таким названием уже существует');
        }

        const presetData = {
          name: presetName,
          discountItems,
          createdAt: discountPresets.find((p) => p.id === editingPresetId).createdAt,
          isActive: discountPresets.find((p) => p.id === editingPresetId).isActive,
        };

        await dispatch(
          updateDiscountPreset({ presetId: editingPresetId, updatedData: presetData }),
        ).unwrap();
        toast.success('Пресет успешно обновлён!');
      } else {
        const existingPreset = discountPresets.find(
          (p) => p.name.toLowerCase() === presetName.toLowerCase(),
        );
        if (existingPreset) {
          throw new Error('Пресет с таким названием уже существует');
        }

        const presetData = {
          id: `preset_${uuidv4()}`,
          name: presetName,
          discountItems,
          createdAt: new Date().toISOString(),
          isActive: true,
        };

        await dispatch(addDiscountPreset(presetData)).unwrap();
        toast.success('Пресет скидок успешно создан!');
      }

      dispatch(clearError()); // Очищаем ошибку после успешного действия
      setIsCreating(false);
      setIsEditing(false);
      setEditingPresetId(null);
      setPresetName('');
      setDiscountItems([]);
    } catch (err) {
      dispatch(setError('Ошибка: ' + err)); // Используем dispatch
      toast.error('Ошибка: ' + err);
    }
  };

  const handleDeletePreset = async (presetId) => {
    if (window.confirm('Вы уверены, что хотите удалить этот пресет?')) {
      try {
        await dispatch(deleteDiscountPreset(presetId)).unwrap();
        toast.success('Пресет успешно удалён!');
      } catch (error) {
        toast.error('Ошибка при удалении: ' + error);
      }
    }
  };

  const handleTogglePreset = async (presetId) => {
    try {
      await dispatch(toggleDiscountPreset(presetId)).unwrap();
      toast.success('Статус пресета изменён!');
    } catch (error) {
      toast.error('Ошибка при изменении статуса: ' + error);
    }
  };

  const getProductName = (productId) => {
    const product = products.find((p) => p.id === productId);
    return product ? product.nameProduct : 'Не найден';
  };

  const getProductPrice = (productId) => {
    const product = products.find((p) => p.id === productId);
    return product ? product.priceProduct : 0;
  };

  const calculateDiscountedPrice = (price, discountPercent) => {
    return price - (price * discountPercent) / 100;
  };

  const getFilteredProducts = (searchTerm) => {
    if (!searchTerm) return [];
    return products.filter((product) =>
      product.nameProduct.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={scss.discountPresets}>
      <h2 className={scss.title}>Пресеты скидок</h2>
      {error && <p className={scss.error}>{error}</p>}

      {!isCreating && !isEditing && (
        <button className={scss.createPresetButton} onClick={handleCreatePreset}>
          Создать пресет скидок
        </button>
      )}

      {(isCreating || isEditing) && (
        <form onSubmit={handleSubmit} className={scss.presetForm}>
          <div className={scss.field}>
            <label htmlFor='presetName'>Название пресета</label>
            <input
              type='text'
              id='presetName'
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder='Введите название пресета...'
              required
            />
          </div>

          {discountItems.map((item, index) => {
            const price = getProductPrice(item.productId);
            const discountedPrice = calculateDiscountedPrice(price, item.discountPercent);
            const filteredProducts = getFilteredProducts(searchTerms[index]);

            return (
              <div key={index} className={scss.discountItem}>
                <div className={scss.searchContainer}>
                  <input
                    type='text'
                    value={searchTerms[index]}
                    onChange={(e) => handleSearchChange(index, e.target.value)}
                    placeholder='Поиск товара...'
                    disabled={!!item.productId}
                  />
                  {searchTerms[index] && !item.productId && filteredProducts.length > 0 && (
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

                <input
                  type='number'
                  className={scss.discountInput}
                  value={item.discountPercent}
                  onChange={(e) => handleDiscountChange(index, e.target.value)}
                  placeholder='Скидка %'
                  min='0'
                  max='100'
                  required
                />

                {item.productId && (
                  <div className={scss.priceInfo}>
                    <span>
                      Цена: {price} | Со скидкой: {discountedPrice.toFixed(2)}
                    </span>
                  </div>
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
            <BsPlus /> Добавить товар
          </button>

          <div className={scss.formButtons}>
            <button type='submit' className={scss.submitButton}>
              {isEditing ? 'Сохранить изменения' : 'Создать пресет'}
            </button>
            <button type='button' className={scss.cancelButton} onClick={handleCancel}>
              Отмена
            </button>
          </div>
        </form>
      )}

      <div className={scss.presetList}>
        {discountPresets.map((preset) => (
          <div key={preset.id} className={scss.preset}>
            <div className={scss.presetHeader}>
              <div className={scss.presetName}>{preset.name}</div>
              {preset.isActive && <span className={scss.activeLabel}>Активен</span>}
            </div>
            <div className={scss.createdAt}>Создан: {formatDate(preset.createdAt)}</div>
            <div className={scss.discountItems}>
              {preset.discountItems.map((item, index) => {
                const price = getProductPrice(item.productId);
                const discountedPrice = calculateDiscountedPrice(price, item.discountPercent);
                return (
                  <div key={index} className={scss.item}>
                    <span className={scss.productName}>{getProductName(item.productId)}</span>
                    <span className={scss.discountPercent}>{item.discountPercent}%</span>
                    <span className={scss.prices}>
                      Цена: {price} | Со скидкой: {discountedPrice.toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className={scss.presetActions}>
              <button
                className={preset.isActive ? scss.deactivateButton : scss.activateButton}
                onClick={() => handleTogglePreset(preset.id)}>
                {preset.isActive ? 'Выключить' : 'Включить'}
              </button>
              <button className={scss.editButton} onClick={() => handleEditPreset(preset)}>
                <BsPencil /> Редактировать
              </button>
              <button className={scss.deleteButton} onClick={() => handleDeletePreset(preset.id)}>
                Удалить пресет
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
