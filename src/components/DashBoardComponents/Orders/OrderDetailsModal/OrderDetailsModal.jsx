import clsx from 'clsx';
import scss from './OrderDetailsModal.module.scss';
import { BsX } from 'react-icons/bs';

export default function OrderDetailsModal({ isOpen, onClose, order }) {
  if (!isOpen || !order) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const handleContentClick = (e) => {
    e.stopPropagation();
  };

  return (
    <div className={scss.modalOverlay} onClick={onClose}>
      <div className={scss.modalContent} onClick={handleContentClick}>
        <div className={scss.closeButton}>
          <BsX className={scss.iconClose} onClick={onClose} />
        </div>
        <h2 className={scss.modalTitle}>Подробности заказа</h2>
        <div className={scss.modalSection}>
          <h3>Информация о клиенте</h3>
          <p>
            <strong>Имя:</strong> {order.userDetails.firstName} {order.userDetails.lastName}
          </p>
          <p>
            <strong>Почта:</strong> {order.userDetails.email}
          </p>
          <p>
            <strong>Телефон:</strong> {order.userDetails.phone}
          </p>
          <p>
            <strong>Адресс:</strong> {order.userDetails.address}
          </p>
        </div>
        <div className={scss.modalSection}>
          <h3>Заказаные товары</h3>
          {order.items.length > 0 ? (
            <ul className={scss.itemsList}>
              {order.items.map((item, index) => (
                <li key={index} className={scss.item}>
                  <p>
                    <strong>Товар:</strong> {item.nameProduct}
                  </p>
                  <div className={scss.priceAndDiscountPercent}>
                    <p>
                      <strong>Цена:</strong> ${item.discountedPrice || item.priceProduct}
                    </p>
                    <p className={scss.greenColor}>
                      {item.discountPercent ? `(-${item.discountPercent}%)` : ''}
                    </p>
                  </div>
                  <p>
                    <strong>Количество:</strong> {item.quantity}
                  </p>
                  <p>
                    <strong>Уровень доступа:</strong> {item.access || 'N/A'}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p>В этом заказе нет товаров.</p>
          )}
        </div>
        <div className={scss.modalSection}>
          <h3>Итог заказа</h3>
          <p>
            <strong>Итоговая цена:</strong> ${order.totalPrice}
          </p>
          <p>
            <strong>Первоначальная цена:</strong> ${order.totalOriginalPrice}
          </p>
          {order.promoCode && (
            <>
              <p>
                <strong>Промо-код:</strong> {order.promoCode.name}
              </p>
              <p>
                <strong>Скидка:</strong> ${order.promoCode.discountAmount} (
                {order.promoCode.discountPercent}%)
              </p>
            </>
          )}
          <div className={scss.statusBlock}>
            <p>
              <strong>Статус платежа:</strong>
            </p>
            <p
              className={clsx(
                scss.greenColor,
                order.paymentStatus === 'Processing' && scss.orangeColor,
                order.paymentStatus === 'Canceled' && scss.redColor,
              )}>
              {order.paymentStatus}
            </p>
          </div>
          <p>
            <strong>Создано в:</strong> {formatDate(order.createdAt)}
          </p>
        </div>
      </div>
    </div>
  );
}
