import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ref, uploadBytes, listAll, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../../../firebase';
import { fetchImages, uploadImage, deleteImage } from '../../../store/slices/storageSlice';
import { toast } from 'react-toastify';
import styles from './StorageForImages.module.scss';

export default function StorageForImages() {
  const dispatch = useDispatch();
  const { images, loading, error } = useSelector((state) => state.storage);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    dispatch(fetchImages());
  }, [dispatch]);

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      await dispatch(uploadImage(file)).unwrap();
      toast.success('Изображение успешно загружено!');
      setFile(null);
    } catch (err) {
      toast.error('Ошибка при загрузке изображения');
    }
    setUploading(false);
  };

  const handleDelete = async (imageName, imageRef) => {
    if (window.confirm('Вы уверены, что хотите удалить это изображение?')) {
      try {
        await dispatch(deleteImage({ imageName, imageRef })).unwrap();
        toast.success('Изображение успешно удалено!');
      } catch (err) {
        toast.error('Ошибка при удалении изображения');
      }
    }
  };

  const handleCopyLink = (url) => {
    navigator.clipboard.writeText(url);
    toast.success('Ссылка скопирована в буфер обмена!');
  };

  return (
    <div className={styles.mainBlock}>
      <h2 className={styles.title}>Управление изображениями</h2>

      {/* Загрузка файла */}
      <div className={styles.uploadSection}>
        <input
          type='file'
          accept='image/*'
          onChange={handleFileChange}
          className={styles.fileInput}
        />
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className={styles.uploadButton}>
          {uploading ? 'Загрузка...' : 'Загрузить'}
        </button>
      </div>

      {/* Отображение ошибок */}
      {error && <p className={styles.error}>{error}</p>}

      {/* Список изображений */}
      {loading ? (
        <p className={styles.loading}>Загрузка...</p>
      ) : (
        <div className={styles.imageList}>
          {images.map((image) => (
            <div key={image.name} className={styles.imageCard}>
              <div className={styles.imageWrapper}>
                <img src={image.url} alt={image.name} className={styles.image} />
              </div>
              <p className={styles.imageName} title={image.name}>
                {image.name}
              </p>
              <div className={styles.buttonGroup}>
                <button onClick={() => handleCopyLink(image.url)} className={styles.actionButton}>
                  Скопировать
                </button>
                <button
                  onClick={() => handleDelete(image.name, image.ref)}
                  className={styles.actionButtonDelete}>
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
