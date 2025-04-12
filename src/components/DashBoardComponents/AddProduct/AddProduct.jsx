import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux'; // Добавляем Redux хуки
import { addProduct, clearError, setError, uploadImage } from '../../../store/slices/adminSlice'; // Импортируем действия
import scss from './AddProduct.module.scss';
import { BsPlus, BsTrash, BsChevronDown } from 'react-icons/bs';
import clsx from 'clsx';
import { toast } from 'react-toastify';

export default function AddProduct() {
  const dispatch = useDispatch();

  // Получаем данные из Redux store
  const { accessLevels, error } = useSelector((state) => state.admin);

  // Состояние для данных продукта
  const [productData, setProductData] = useState({
    id: '',
    nameProduct: '',
    imageProduct: '', // Здесь будет храниться URL после загрузки
    priceProduct: 0,
    access: accessLevels[0]?.id || '',
    available: true,
    categoryProduct: 'Course',
    descriptionProduct: [],
    speakersProduct: [],
  });

  // Состояние для выбранного файла
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null); // Для предпросмотра изображения

  // Состояние для выпадающего списка категорий и доступа
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isAccessOpen, setIsAccessOpen] = useState(false);

  const categoryOptions = [
    { value: 'Course', label: 'Course' },
    { value: 'Master class', label: 'Master class' },
  ];

  const accessOptions = accessLevels.map((level) => ({
    value: level.id,
    label: level.name,
  }));

  // Обновляем productData.access, если accessLevels изменились
  useEffect(() => {
    if (accessLevels.length > 0 && !productData.access) {
      setProductData((prev) => ({
        ...prev,
        access: accessLevels[0].id,
      }));
    }
  }, [accessLevels, productData.access]);

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

  // Обработчик выбора файла
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Проверяем, что файл является изображением
      if (!file.type.startsWith('image/')) {
        toast.error('Пожалуйста, выберите файл изображения (jpg, png и т.д.)');
        e.target.value = null; // Сбрасываем input
        return;
      }
      // Проверяем размер файла (например, не больше 5MB)
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
      setPreviewUrl(null);
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
      // Валидация productId
      if (!/^[a-zA-Z0-9-_]+$/.test(productData.id)) {
        throw new Error(
          'ID продукта должен содержать только латинские буквы, цифры, дефисы или подчеркивания',
        );
      }

      let imageUrl = '';
      if (selectedFile) {
        imageUrl = await dispatch(
          uploadImage({ file: selectedFile, productId: productData.id }),
        ).unwrap();
      }

      const formattedProductData = {
        ...productData,
        imageProduct: imageUrl,
        createdAtProduct: new Date().toISOString(),
      };

      await dispatch(addProduct(formattedProductData)).unwrap();
      toast.success('Продукт успешно добавлен!');
      dispatch(clearError()); // Очищаем ошибку после успешного добавления
      setProductData({
        id: '',
        nameProduct: '',
        imageProduct: '',
        priceProduct: 0,
        access: accessLevels[0]?.id || '',
        available: true,
        categoryProduct: 'Course',
        descriptionProduct: [],
        speakersProduct: [],
      });
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (err) {
      dispatch(setError('Ошибка при добавлении продукта: ' + err)); // Используем dispatch
      toast.error('Ошибка при добавлении: ' + err);
    }
  };

  // Очистка URL предпросмотра при размонтировании компонента
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <div className={scss.addProduct}>
      <h2 className={scss.title}>Добавить новый продукт</h2>
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
            {selectedFile && (
              <div className={scss.fileInfo}>
                <p>Выбранный файл: {selectedFile.name}</p>
                {previewUrl && <img src={previewUrl} alt='Preview' className={scss.imagePreview} />}
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
        </div>
        <div className={scss.field}>
          <label>Тип доступа</label>
          <div className={scss.accessContainer}>
            <div
              className={clsx(scss.accessButton, accessLevels.length === 0 && scss.disabled)}
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
