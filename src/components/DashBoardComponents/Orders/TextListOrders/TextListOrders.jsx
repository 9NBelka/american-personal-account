import scss from './TextListOrders.module.scss';

export default function TextListOrders({ currentOrders, handleViewDetails, indexOfFirstOrder }) {
  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  return (
    <tbody className={scss.listOrders}>
      {currentOrders.map((order, index) => (
        <tr key={order.id} className={scss.order}>
          <td>{indexOfFirstOrder + index + 1}</td>
          <td>{order.id}</td>
          <td>
            {order.userDetails.firstName} {order.userDetails.lastName}
          </td>
          <td>{order.userDetails.email}</td>
          <td>${order.totalPrice}</td>
          <td>{order.paymentStatus}</td>
          <td>{formatDate(order.createdAt)}</td>
          <td className={scss.actions}>
            <button className={scss.detailsButton} onClick={() => handleViewDetails(order)}>
              Details
            </button>
          </td>
        </tr>
      ))}
    </tbody>
  );
}
