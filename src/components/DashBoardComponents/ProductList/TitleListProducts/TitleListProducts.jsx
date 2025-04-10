import scss from './TitleListProducts.module.scss';

export default function TitleListProducts() {
  return (
    <thead className={scss.titleListProducts}>
      <tr>
        <th>№</th>
        <th>Изображение</th>
        <th>Название</th>
        <th>Категория</th>
        <th>Цена</th>
        <th>Уровень доступа</th>
        <th>Статус</th>
        <th>Дата создания</th>
        <th>Действия</th>
      </tr>
    </thead>
  );
}
