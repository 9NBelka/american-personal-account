import { useState, useEffect } from 'react';
import { useAdmin } from '../../../../context/AdminContext';
import scss from './EditProduct.module.scss';
import { BsPlus, BsTrash, BsChevronDown } from 'react-icons/bs';
import clsx from 'clsx';
import { toast } from 'react-toastify';

export default function EditProduct({ productId, onBack }) {
  const { products, updateProduct, error, setError } = useAdmin();

  // Находим продукт для редактирования
  const productToEdit = products.find((product) => product.id === productId);

  // Состояние для данных продукта
  const [productData, setProductData] = useState({
    id: '',
    nameProduct: '',
    imageProduct: '',
    priceProduct: 0,
    access: 'vanilla',
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

  const accessOptions = [
    { value: 'vanilla', label: 'Vanilla' },
    { value: 'standard', label: 'Standard' },
  ];

  // Инициализация данных продукта при загрузке компонента
  useEffect(() => {
    if (!productToEdit) {
      setError('Продукт не найден');
      onBack(); // Возвращаемся назад, если продукт не найден
      return;
    }

    setProductData({
      id: productToEdit.id,
      nameProduct: productToEdit.nameProduct || '',
      imageProduct: productToEdit.imageProduct || '',
      priceProduct: productToEdit.priceProduct || 0,
      access: productToEdit.access || 'vanilla',
      available: productToEdit.available !== undefined ? productToEdit.available : true,
      categoryProduct: productToEdit.categoryProduct || 'Course',
      descriptionProduct: productToEdit.descriptionProduct || [],
      speakersProduct: productToEdit.speakersProduct || [],
    });
  }, [productToEdit, setError, onBack]);

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
      const updatedProductData = {
        ...productData,
        createdAtProduct: productToEdit.createdAtProduct, // Сохраняем оригинальную дату создания
      };

      await updateProduct(productData.id, updatedProductData);
      toast.success('Продукт успешно обновлен!');
      onBack(); // Возвращаемся к списку после сохранения
    } catch (err) {
      setError('Ошибка при обновлении продукта: ' + err.message);
      toast.error('Ошибка при обновлении: ' + err.message);
    }
  };

  if (!productToEdit) {
    return <div>Загрузка...</div>;
  }

  return (
    <div className={scss.editProduct}>
      <div className={scss.header}>
        <h2 className={scss.title}>Редактировать продукт</h2>
        <button className={scss.backButton} onClick={onBack}>
          Назад
        </button>
      </div>
      {error && <p className={scss.error}>{error}</p>}
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
            disabled
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
            <div className={scss.accessButton} onClick={() => setIsAccessOpen(!isAccessOpen)}>
              {productData.access || 'Выберите тип доступа'}
              <BsChevronDown className={clsx(scss.chevron, isAccessOpen && scss.chevronOpen)} />
            </div>
            {isAccessOpen && (
              <ul className={scss.accessDropdown}>
                {accessOptions.map((option) => (
                  <li
                    key={option.value}
                    className={clsx(
                      scss.accessOption,
                      productData.access === option.value && scss.active,
                    )}
                    onClick={() => handleAccessSelect(option.value)}>
                    {option.label}
                  </li>
                ))}
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
          Сохранить изменения
        </button>
      </form>
    </div>
  );
}
