import { useState } from 'react';
import { useAdmin } from '../../../context/AdminContext';
import scss from './AddProduct.module.scss';
import { BsPlus, BsTrash, BsChevronDown } from 'react-icons/bs';
import clsx from 'clsx';
import { toast } from 'react-toastify';

export default function AddProduct() {
  const { addProduct, error, setError, accessLevels } = useAdmin();

  // Состояние для данных продукта
  const [productData, setProductData] = useState({
    id: '',
    nameProduct: '',
    imageProduct: '',
    priceProduct: 0,
    access: accessLevels[0]?.id || '', // Устанавливаем первый уровень доступа по умолчанию
    available: true,
    categoryProduct: 'Course',
    descriptionProduct: [],
    speakersProduct: [],
  });

  // Состояние для выпадающего списка категорий и доступа
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isAccessOpen, setIsAccessOpen] = useState(false);

  const categoryOptions = [
    { value: 'Course', label: 'Course' },
    { value: 'Master class', label: 'Master class' },
  ];

  // Динамические опции для типов доступа
  const accessOptions = accessLevels.map((level) => ({
    value: level.id,
    label: level.name,
  }));

  // Функция для получения названия уровня доступа
  const getAccessLevelName = (accessId) => {
    const accessLevel = accessLevels.find((level) => level.id === accessId);
    return accessLevel ? accessLevel.name : accessId || 'Не указан';
  };

  // Обработчик изменения полей продукта
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProductData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value,
    }));
  };

  // Обработчик выбора категории
  const handleCategorySelect = (value) => {
    setProductData((prev) => ({ ...prev, categoryProduct: value }));
    setIsCategoryOpen(false);
  };

  // Обработчик выбора типа доступа
  const handleAccessSelect = (value) => {
    setProductData((prev) => ({ ...prev, access: value }));
    setIsAccessOpen(false);
  };

  // Добавление нового пункта в descriptionProduct
  const addDescriptionItem = () => {
    setProductData((prev) => ({
      ...prev,
      descriptionProduct: [...prev.descriptionProduct, ''],
    }));
  };

  // Обновление пункта в descriptionProduct
  const handleDescriptionChange = (index, value) => {
    setProductData((prev) => {
      const updatedDescription = [...prev.descriptionProduct];
      updatedDescription[index] = value;
      return { ...prev, descriptionProduct: updatedDescription };
    });
  };

  // Удаление пункта из descriptionProduct
  const removeDescriptionItem = (index) => {
    setProductData((prev) => ({
      ...prev,
      descriptionProduct: prev.descriptionProduct.filter((_, i) => i !== index),
    }));
  };

  // Добавление нового спикера в speakersProduct
  const addSpeaker = () => {
    setProductData((prev) => ({
      ...prev,
      speakersProduct: [...prev.speakersProduct, ''],
    }));
  };

  // Обновление спикера в speakersProduct
  const handleSpeakerChange = (index, value) => {
    setProductData((prev) => {
      const updatedSpeakers = [...prev.speakersProduct];
      updatedSpeakers[index] = value;
      return { ...prev, speakersProduct: updatedSpeakers };
    });
  };

  // Удаление спикера из speakersProduct
  const removeSpeaker = (index) => {
    setProductData((prev) => ({
      ...prev,
      speakersProduct: prev.speakersProduct.filter((_, i) => i !== index),
    }));
  };

  // Обработчик отправки формы
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Формируем данные продукта для отправки в базу
      const formattedProductData = {
        ...productData,
        createdAtProduct: new Date().toISOString(), // Добавляем текущую дату создания
      };

      await addProduct(formattedProductData);
      toast.success('Продукт успешно добавлен!');
      // Сбрасываем форму
      setProductData({
        id: '',
        nameProduct: '',
        imageProduct: '',
        priceProduct: 0,
        access: accessLevels[0]?.id || '', // Сбрасываем на первый уровень доступа
        available: true,
        categoryProduct: 'Course',
        descriptionProduct: [],
        speakersProduct: [],
      });
    } catch (err) {
      setError('Ошибка при добавлении продукта: ' + err.message);
      toast.error('Ошибка при добавлении: ' + err.message);
    }
  };

  return (
    <div className={scss.addProduct}>
      <h2 className={scss.title}>Добавить новый продукт</h2>

      <form onSubmit={handleSubmit} className={scss.form}>
        {/* Основные поля продукта */}
        <div className={scss.field}>
          <label htmlFor='id'>ID продукта</label>
          <input
            type='text'
            id='id'
            name='id'
            value={productData.id}
            onChange={handleInputChange}
            placeholder='Введите ID продукта (уникальный идентификатор)...'
            required
          />
        </div>
        <div className={scss.field}>
          <label htmlFor='nameProduct'>Название продукта</label>
          <input
            type='text'
            id='nameProduct'
            name='nameProduct'
            value={productData.nameProduct}
            onChange={handleInputChange}
            placeholder='Введите название продукта...'
            required
          />
        </div>
        <div className={scss.field}>
          <label htmlFor='imageProduct'>URL изображения</label>
          <input
            type='url'
            id='imageProduct'
            name='imageProduct'
            value={productData.imageProduct}
            onChange={handleInputChange}
            placeholder='Введите URL изображения продукта...'
          />
        </div>
        <div className={scss.field}>
          <label htmlFor='priceProduct'>Цена</label>
          <input
            type='number'
            id='priceProduct'
            name='priceProduct'
            value={productData.priceProduct}
            onChange={handleInputChange}
            placeholder='Введите цену продукта...'
            min='0'
            required
          />
        </div>
        <div className={scss.field}>
          <label>Тип доступа</label>
          <div className={scss.accessContainer}>
            <div
              className={clsx(
                scss.accessButton,
                accessLevels.length === 0 && scss.disabled, // Добавляем класс disabled, если accessLevels пуст
              )}
              onClick={() => {
                if (accessLevels.length > 0) {
                  setIsAccessOpen(!isAccessOpen);
                }
              }}>
              {getAccessLevelName(productData.access) || 'Выберите тип доступа'}
              <BsChevronDown className={clsx(scss.chevron, isAccessOpen && scss.chevronOpen)} />
            </div>
            {isAccessOpen && (
              <ul className={scss.accessDropdown}>
                {accessOptions.length > 0 ? (
                  accessOptions.map((option) => (
                    <li
                      key={option.value}
                      className={clsx(
                        scss.accessOption,
                        productData.access === option.value && scss.active,
                      )}
                      onClick={() => handleAccessSelect(option.value)}>
                      {option.label}
                    </li>
                  ))
                ) : (
                  <li className={scss.accessOption}>Загрузка уровней доступа...</li>
                )}
              </ul>
            )}
          </div>
        </div>
        <div className={scss.field}>
          <label>
            <input
              type='checkbox'
              name='available'
              checked={productData.available}
              onChange={handleInputChange}
            />
            Доступен для покупки
          </label>
        </div>
        <div className={scss.field}>
          <label>Категория</label>
          <div className={scss.categoryContainer}>
            <div className={scss.categoryButton} onClick={() => setIsCategoryOpen(!isCategoryOpen)}>
              {productData.categoryProduct || 'Выберите категорию'}
              <BsChevronDown className={clsx(scss.chevron, isCategoryOpen && scss.chevronOpen)} />
            </div>
            {isCategoryOpen && (
              <ul className={scss.categoryDropdown}>
                {categoryOptions.map((option) => (
                  <li
                    key={option.value}
                    className={clsx(
                      scss.categoryOption,
                      productData.categoryProduct === option.value && scss.active,
                    )}
                    onClick={() => handleCategorySelect(option.value)}>
                    {option.label}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Описание продукта (descriptionProduct) */}
        <div className={scss.descriptionSection}>
          <h3>Описание продукта</h3>
          {productData.descriptionProduct.map((item, index) => (
            <div key={index} className={scss.descriptionItem}>
              <input
                type='text'
                value={item}
                onChange={(e) => handleDescriptionChange(index, e.target.value)}
                placeholder={`Пункт описания ${index + 1}`}
                required
              />
              <button
                type='button'
                className={scss.deleteButton}
                onClick={() => removeDescriptionItem(index)}>
                <BsTrash />
              </button>
            </div>
          ))}
          <button type='button' className={scss.addDescriptionButton} onClick={addDescriptionItem}>
            <BsPlus /> Добавить пункт описания
          </button>
        </div>

        {/* Спикеры продукта (speakersProduct) */}
        <div className={scss.speakersSection}>
          <h3>Спикеры</h3>
          {productData.speakersProduct.map((speaker, index) => (
            <div key={index} className={scss.speaker}>
              <input
                type='text'
                value={speaker}
                onChange={(e) => handleSpeakerChange(index, e.target.value)}
                placeholder={`Спикер ${index + 1}`}
                required
              />
              <button
                type='button'
                className={scss.deleteButton}
                onClick={() => removeSpeaker(index)}>
                <BsTrash />
              </button>
            </div>
          ))}
          <button type='button' className={scss.addSpeakerButton} onClick={addSpeaker}>
            <BsPlus /> Добавить спикера
          </button>
        </div>

        {/* Кнопка отправки */}
        <button type='submit' className={scss.submitButton}>
          Добавить продукт
        </button>
      </form>
    </div>
  );
}
