import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOrders } from '../../../store/slices/adminSlice'; // Adjust path as needed
import scss from './Orders.module.scss';
import { toast } from 'react-toastify';
import OrderDetailsModal from './OrderDetailsModal/OrderDetailsModal';
import FilterOrders from './FilterOrders/FilterOrders';
import TitleListOrders from './TitleListOrders/TitleListOrders';
import TextListOrders from './TextListOrders/TextListOrders';

export default function Orders() {
  const dispatch = useDispatch();
  const { orders, status, error } = useSelector((state) => state.admin);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [sortOption, setSortOption] = useState('date-desc'); // Default to newest first
  const [searchQuery, setSearchQuery] = useState('');
  const ordersPerPage = 5;

  // Fetch orders on component mount
  useEffect(() => {
    if (orders.length === 0) {
      dispatch(fetchOrders());
    }
  }, [orders, dispatch]);

  // Calculate counts for payment status filter
  const paymentStatusCounts = useCallback(() => {
    const counts = {
      all: orders.length,
      Processing: 0,
      Cancelled: 0,
      Paid: 0,
    };

    orders.forEach((order) => {
      if (order.paymentStatus === 'Processing') counts.Processing += 1;
      if (order.paymentStatus === 'Cancelled') counts.Cancelled += 1;
      if (order.paymentStatus === 'Paid') counts.Paid += 1;
    });

    return counts;
  }, [orders]);

  // Debounce function for search
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  const debouncedSetSearchQuery = debounce((value) => {
    setSearchQuery(value);
    setCurrentPage(1);
  }, 300);

  // Filter and sort orders
  useEffect(() => {
    let filtered = [...orders];

    // Filter by payment status
    if (paymentStatusFilter !== 'all') {
      filtered = filtered.filter((order) => order.paymentStatus === paymentStatusFilter);
    }

    // Search by customer name or email
    if (searchQuery) {
      filtered = filtered.filter(
        (order) =>
          `${order.userDetails.firstName} ${order.userDetails.lastName}`
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          order.userDetails.email.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // Sort orders
    filtered.sort((a, b) => {
      if (sortOption === 'price-asc') {
        return parseFloat(a.totalPrice) - parseFloat(b.totalPrice);
      } else if (sortOption === 'price-desc') {
        return parseFloat(b.totalPrice) - parseFloat(a.totalPrice);
      } else if (sortOption === 'date-asc') {
        return new Date(a.createdAt) - new Date(b.createdAt);
      } else if (sortOption === 'date-desc') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      return 0;
    });

    setFilteredOrders(filtered);
  }, [orders, paymentStatusFilter, sortOption, searchQuery]);

  // Pagination
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
  };

  const handleCloseModal = () => {
    setSelectedOrder(null);
  };

  // Show loading state
  if (status === 'loading') {
    return <div>Loading orders...</div>;
  }

  // Show error state
  if (status === 'failed') {
    toast.error('Failed to load orders: ' + error);
    return <div>Error loading orders: {error}</div>;
  }

  return (
    <div className={scss.ordersMainBlock}>
      <h2 className={scss.ordersTitle}>Orders</h2>

      {/* Filters and Search */}
      <FilterOrders
        paymentStatusFilter={paymentStatusFilter}
        setPaymentStatusFilter={setPaymentStatusFilter}
        sortOption={sortOption}
        setSortOption={setSortOption}
        debouncedSetSearchQuery={debouncedSetSearchQuery}
        setCurrentPage={setCurrentPage}
        paymentStatusCounts={paymentStatusCounts()}
      />

      {/* Table of orders */}
      <div className={scss.tableWrapper}>
        <table className={scss.table}>
          <TitleListOrders />
          {currentOrders.length > 0 ? (
            <TextListOrders
              currentOrders={currentOrders}
              handleViewDetails={handleViewDetails}
              indexOfFirstOrder={indexOfFirstOrder}
            />
          ) : (
            <tbody>
              <tr>
                <td colSpan='8'>No orders found.</td>
              </tr>
            </tbody>
          )}
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={scss.pagination}>
          {Array.from({ length: totalPages }, (_, index) => (
            <button
              key={index + 1}
              className={`${scss.pageButton} ${currentPage === index + 1 ? scss.active : ''}`}
              onClick={() => handlePageChange(index + 1)}>
              {index + 1}
            </button>
          ))}
        </div>
      )}

      {/* Modal for order details */}
      <OrderDetailsModal
        isOpen={!!selectedOrder}
        onClose={handleCloseModal}
        order={selectedOrder}
      />
    </div>
  );
}
