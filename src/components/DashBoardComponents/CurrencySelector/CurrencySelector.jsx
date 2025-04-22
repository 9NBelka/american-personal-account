import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchCurrencies,
  addCurrency,
  updateCurrency,
  setActiveCurrency,
} from '../../../store/slices/currencySlice';
import styles from './CurrencySelector.module.scss';
import clsx from 'clsx';
import { FaDollarSign, FaEuroSign, FaHryvnia, FaPoundSign, FaMoneyBillWave } from 'react-icons/fa';
import { toast } from 'react-toastify';

export default function CurrencySelector() {
  const dispatch = useDispatch();
  const { currencies, activeCurrency, status, error } = useSelector((state) => state.currency);
  const [customRates, setCustomRates] = useState({});
  const [newCurrency, setNewCurrency] = useState({
    id: '',
    code: '',
    name: '',
    rate: '',
  });

  // Маппинг иконок для валют
  const currencyIcons = {
    USD: FaDollarSign,
    EUR: FaEuroSign,
    UAH: FaHryvnia,
    PLN: FaMoneyBillWave,
    GBP: FaPoundSign,
  };

  useEffect(() => {
    dispatch(fetchCurrencies());
  }, [dispatch]);

  const handleRateChange = (currencyId, value) => {
    setCustomRates((prev) => ({ ...prev, [currencyId]: value }));
  };

  const handleSaveCustomRate = (currencyId) => {
    const customRate = customRates[currencyId];
    if (customRate) {
      dispatch(updateCurrency({ currencyId, updatedData: { customRate: parseFloat(customRate) } }));
      toast.success('Кастомный курс сохранен');
    } else {
      toast.error('Введите кастомный курс');
    }
  };

  const handleToggleActive = (currencyId) => {
    dispatch(setActiveCurrency(currencyId));
    toast.success(
      `Валюта ${currencyId} ${
        currencies.find((c) => c.id === currencyId)?.isActive ? 'деактивирована' : 'активирована'
      }`,
    );
  };

  const handleNewCurrencyChange = (e) => {
    const { name, value } = e.target;
    setNewCurrency((prev) => ({
      ...prev,
      [name]: value,
      id: name === 'code' ? value : prev.id,
    }));
  };

  const handleAddCurrency = (e) => {
    e.preventDefault();
    const existingCurrency = currencies.find((c) => c.code === newCurrency.code);
    if (existingCurrency) {
      toast.error('Валюта с таким кодом уже существует');
      return;
    }

    if (newCurrency.code && newCurrency.name && newCurrency.rate) {
      dispatch(addCurrency(newCurrency));
      setNewCurrency({ id: '', code: '', name: '', rate: '' });
      toast.success('Валюта добавлена');
    } else {
      toast.error('Заполните все поля');
    }
  };

  // Выбор градиента и цвета иконки на основе валюты
  const getCurrencyStyle = (code) => {
    switch (code) {
      case 'USD':
        return { gradient: styles.blueGradient, iconColor: '#484eac' };
      case 'EUR':
        return { gradient: styles.greenGradient, iconColor: '#5fac66' };
      case 'UAH':
        return { gradient: styles.orangeGradient, iconColor: '#ff9c14' };
      case 'PLN':
        return { gradient: styles.lightBlueGradient, iconColor: '#2caedf' };
      default:
        return { gradient: styles.blueGradient, iconColor: '#484eac' };
    }
  };

  if (status === 'loading') return <div className={styles.loader}>Загрузка...</div>;
  if (error) return <div className={styles.error}>Ошибка: {error}</div>;

  return (
    <div className={styles.currencySelector}>
      <h2>Управление валютами</h2>
      <div className={styles.currencyTiles}>
        {currencies.map((currency) => {
          const Icon = currencyIcons[currency.code] || FaMoneyBillWave;
          const { gradient, iconColor } = getCurrencyStyle(currency.code);
          return (
            <div
              key={currency.id}
              className={clsx(styles.currencyTile, gradient, {
                [styles.active]: currency.isActive,
              })}>
              <div className={styles.currencyContent}>
                <h5 className={styles.currencyTitle}>
                  {currency.code} - {currency.name}
                </h5>
                <p className={styles.currencyRate}>Курс при добавлении: {currency.rate}</p>
                <p className={styles.currencyRate}>Кастомный курс: {currency.customRate || 0}</p>
                <p className={styles.currencyRate}>
                  Текущий курс: {currency.customRate || currency.rate}
                </p>
                <p
                  className={clsx(styles.currencyStatus, {
                    [styles.activeStatus]: currency.isActive,
                  })}>
                  {currency.isActive ? 'Активно' : 'Неактивно'}
                </p>
                <input
                  type='number'
                  placeholder='Кастомный курс'
                  value={customRates[currency.id] || ''}
                  onChange={(e) => handleRateChange(currency.id, e.target.value)}
                  className={styles.input}
                />
                <div className={styles.buttonGroup}>
                  <button
                    onClick={() => handleSaveCustomRate(currency.id)}
                    className={styles.button}>
                    Сохранить курс
                  </button>
                  <button
                    onClick={() => handleToggleActive(currency.id)}
                    className={clsx(styles.button, styles.toggleButton, {
                      [styles.activeToggle]: currency.isActive,
                    })}>
                    {currency.isActive ? 'Выключить' : 'Включить'}
                  </button>
                </div>
              </div>
              <div className={styles.iconBlock}>
                <Icon className={styles.amountIcon} style={{ fill: iconColor }} />
              </div>
            </div>
          );
        })}
      </div>
      <div className={clsx(styles.addCurrency, styles.blueGradient)}>
        <h3>Добавить валюту</h3>
        <form className={styles.form} onSubmit={handleAddCurrency}>
          <input
            type='text'
            name='code'
            placeholder='Код (например, GBP)'
            value={newCurrency.code}
            onChange={handleNewCurrencyChange}
            className={styles.input}
          />
          <input
            type='text'
            name='name'
            placeholder='Название (например, British Pound)'
            value={newCurrency.name}
            onChange={handleNewCurrencyChange}
            className={styles.input}
          />
          <input
            type='number'
            name='rate'
            placeholder='Курс (например, 1.25)'
            value={newCurrency.rate}
            onChange={handleNewCurrencyChange}
            className={styles.input}
          />
          <button type='submit' className={styles.button}>
            Добавить
          </button>
        </form>
      </div>
    </div>
  );
}
