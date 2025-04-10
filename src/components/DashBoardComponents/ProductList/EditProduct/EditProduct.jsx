import { useState, useEffect } from 'react';
import { useAdmin } from '../../../../context/AdminContext';
import scss from './EditProduct.module.scss';
import { BsPlus, BsTrash, BsChevronDown } from 'react-icons/bs';
import clsx from 'clsx';
import { toast } from 'react-toastify';

export default function EditProduct({ productId, onBack }) {
  const { products, updateProduct, error, setError, accessLevels, uploadImage } = useAdmin();

  // Находим продукт для редактирования
  const productToEdit = products.find((product) => product.id === productId);

  // Состояние для данных продукта
  const [productData, setProductData] = useState({
    id: '',
    nameProduct: '',
    imageProduct: '',
    priceProduct: 0,
    discountedPrice: null,
    discountPercent: null,
    access: '',
    available: true,
    categoryProduct: 'Course',
    descriptionProduct: [],
    speakersProduct: [],
  });

  // Состояние для выбранного файла и предпросмотра
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

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

  // Инициализация данных продукта при загрузке компонента
  useEffect(() => {
    if (!productToEdit) {
      setError('Продукт не найден');
      onBack();
      return;
    }

    setProductData({
      id: productToEdit.id,
      nameProduct: productToEdit.nameProduct || '',
      imageProduct: productToEdit.imageProduct || '',
      priceProduct: productToEdit.priceProduct || 0,
      discountedPrice: productToEdit.discountedPrice || null,
      discountPercent: productToEdit.discountPercent || null,
      access: productToEdit.access || accessLevels[0]?.id || '',
      available: productToEdit.available !== undefined ? productToEdit.available : true,
      categoryProduct: productToEdit.categoryProduct || 'Course',
      descriptionProduct: productToEdit.descriptionProduct || [],
      speakersProduct: productToEdit.speakersProduct || [],
    });
    setPreviewUrl(productToEdit.imageProduct || null); // Устанавливаем текущий URL для предпросмотра
  }, [productToEdit, setError, onBack, accessLevels]);

  // Очистка URL предпросмотра при размонтировании компонента
  useEffect(() => {
    return () => {
      if (previewUrl && !productData.imageProduct) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl, productData.imageProduct]);

  // Обработчик изменения полей продукта
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProductData((prev) => {
      if (name === 'priceProduct') {
        const newPrice = Number(value);
        if (newPrice < 0) {
          toast.error('Цена не может быть меньше 0');
          return prev;
        }
        if (prev.discountPercent) {
          const newDiscountedPrice = newPrice - (newPrice * prev.discountPercent) / 100;
          return {
            ...prev,
            priceProduct: newPrice,
            discountedPrice: newDiscountedPrice.toFixed(2),
          };
        }
      }
      return {
        ...prev,
        [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value,
      };
    });
  };

  // Обработчик выбора файла
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Проверяем, что файл является изображением
      if (!file.type.startsWith('image/')) {
        toast.error('Пожалуйста, выберите файл изображения (jpg, png и т.д.)');
        e.target.value = null;
        return;
      }
      // Проверяем размер файла (не больше 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Файл слишком большой. Максимальный размер: 5MB');
        e.target.value = null;
        return;
      }
      setSelectedFile(file);
      // Создаем URL для предпросмотра
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);
    } else {
      setSelectedFile(null);
      setPreviewUrl(productData.imageProduct || null); // Восстанавливаем текущий URL, если файл не выбран
    }
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
      let imageUrl = productData.imageProduct;
      if (selectedFile) {
        // Загружаем новое изображение
        imageUrl = await uploadImage(selectedFile, productData.id);
        setProductData((prev) => ({ ...prev, imageProduct: imageUrl }));
      }

      const updatedProductData = {
        ...productData,
        imageProduct: imageUrl,
        createdAtProduct: productToEdit.createdAtProduct,
        discountedPrice: productData.discountPercent ? productData.discountedPrice : null,
        discountPercent: productData.discountPercent || null,
      };

      await updateProduct(productData.id, updatedProductData);
      toast.success('Продукт успешно обновлен!');
      onBack();
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
          <label htmlFor='imageProduct'>Изображение продукта</label>
          <div className={scss.fileInputContainer}>
            <input
              type='file'
              id='imageProduct'
              name='imageProduct'
              accept='image/*'
              onChange={handleFileChange}
              className={scss.fileInput}
            />
            {previewUrl && (
              <div className={scss.fileInfo}>
                {selectedFile && <p>Выбранный файл: {selectedFile.name}</p>}
                <img src={previewUrl} alt='Preview' className={scss.imagePreview} />
              </div>
            )}
          </div>
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
          {productData.discountPercent && (
            <p className={scss.discountInfo}>
              Текущая скидка: {productData.discountPercent}% | Цена со скидкой:{' '}
              {productData.discountedPrice} $
            </p>
          )}
        </div>
        <div className={scss.field}>
          <label>Тип доступа</label>
          <div className={scss.accessContainer}>
            <div className={scss.accessButton} onClick={() => setIsAccessOpen(!isAccessOpen)}>
              {getAccessLevelName(productData.access) || 'Выберите тип доступа'}
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
