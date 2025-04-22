import scss from './TitleListOrders.module.scss';

export default function TitleListOrders() {
  return (
    <thead className={scss.titleListOrders}>
      <tr>
        <th>№</th>
        <th>ID Заказа</th>
        <th>Имя</th>
        <th>Почта</th>
        <th>Итоговая стоимость</th>
        <th>Статус заказа</th>
        <th>Дата создания</th>
        <th>Действия</th>
      </tr>
    </thead>
  );
}
