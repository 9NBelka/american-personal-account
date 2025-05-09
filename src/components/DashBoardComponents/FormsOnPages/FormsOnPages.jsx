import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchForms } from '../../../store/slices/formsSlice';
import scss from './FormsOnPages.module.scss';

export default function FormsOnPages() {
  const dispatch = useDispatch();
  const { formsPages, status, error } = useSelector((state) => state.forms);
  const [expandedPage, setExpandedPage] = useState(null);

  useEffect(() => {
    dispatch(fetchForms());
  }, [dispatch]);

  const togglePage = (pageId) => {
    setExpandedPage(expandedPage === pageId ? null : pageId);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Нет даты';
    const date = new Date(timestamp);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const renderTableHeaders = (pageId) => {
    switch (pageId) {
      case 'ArchitectureA':
        return (
          <tr>
            <th>№</th>
            <th>Email</th>
            <th>Дата</th>
          </tr>
        );
      case 'ArchitectureB':
        return (
          <tr>
            <th>№</th>
            <th>Полное имя</th>
            <th>Email</th>
            <th>Телефон</th>
            <th>Дата</th>
          </tr>
        );
      case 'ArchitectureC':
        return (
          <tr>
            <th>№</th>
            <th>Имя</th>
            <th>Фамилия</th>
            <th>Email</th>
            <th>Страна</th>
            <th>Телефон</th>
            <th>Дата</th>
          </tr>
        );
      default:
        return null;
    }
  };

  const renderTableRow = (form, index, pageId) => {
    switch (pageId) {
      case 'ArchitectureA':
        return (
          <tr key={index} className={scss.formRow}>
            <td>{index + 1}</td>
            <td>{form.email}</td>
            <td>{formatDate(form.timestamp)}</td>
          </tr>
        );
      case 'ArchitectureB':
        return (
          <tr key={index} className={scss.formRow}>
            <td>{index + 1}</td>
            <td>{form.fullName}</td>
            <td>{form.email}</td>
            <td>{form.phone}</td>
            <td>{formatDate(form.timestamp)}</td>
          </tr>
        );
      case 'ArchitectureC':
        return (
          <tr key={index} className={scss.formRow}>
            <td>{index + 1}</td>
            <td>{form.firstName}</td>
            <td>{form.lastName}</td>
            <td>{form.email}</td>
            <td>{form.country}</td>
            <td>{form.phone}</td>
            <td>{formatDate(form.timestamp)}</td>
          </tr>
        );
      default:
        return null;
    }
  };

  if (status === 'loading') {
    return <div>Загрузка данных форм...</div>;
  }

  if (error) {
    return <div className={scss.error}>Ошибка: {error}</div>;
  }

  return (
    <div className={scss.formsContainer}>
      <h2 className={scss.title}>Данные форм</h2>
      {formsPages.map((page) => (
        <div key={page.pageId} className={scss.pageBlock}>
          <div className={scss.pageHeader} onClick={() => togglePage(page.pageId)}>
            <h3>{page.pageId}</h3>
            <span>{expandedPage === page.pageId ? '▲' : '▼'}</span>
          </div>
          {expandedPage === page.pageId && (
            <div className={scss.tableWrapper}>
              <table className={scss.table}>
                <thead>{renderTableHeaders(page.pageId)}</thead>
                <tbody>
                  {page.forms.length > 0 ? (
                    page.forms.map((form, index) => renderTableRow(form, index, page.pageId))
                  ) : (
                    <tr>
                      <td
                        colSpan={
                          page.pageId === 'ArchitectureA'
                            ? 3
                            : page.pageId === 'ArchitectureB'
                            ? 5
                            : 7
                        }>
                        Нет данных
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
