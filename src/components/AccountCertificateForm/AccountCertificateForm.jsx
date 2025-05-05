import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import scss from './AccountCertificateForm.module.scss';
import { toast } from 'react-toastify';
import { BsArrowLeftShort } from 'react-icons/bs';
import { fetchUserData, subscribeToCourses } from '../../store/slices/authSlice';
import PlayListLoadingIndicator from '../PlayListLoadingIndicator/PlayListLoadingIndicator';

export default function AccountCertificateForm() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [certificateData, setCertificateData] = useState({ firstName: '', lastName: '' });
  const [hasAccess, setHasAccess] = useState(null);
  const [certificateImageLoaded, setCertificateImageLoaded] = useState(null);

  // Получаем данные из Redux
  const course = useSelector((state) => state.auth.courses.find((c) => c.id === courseId));
  const { userName, user, isAuthInitialized, isCoursesLoaded } = useSelector((state) => state.auth);

  // Загружаем данные пользователя и курсы при монтировании компонента
  useEffect(() => {
    if (!isAuthInitialized) return;

    const initializeData = async () => {
      if (!user) {
        setHasAccess(false);
        return;
      }

      // Загружаем данные пользователя, если они еще не загружены
      const userData = await dispatch(fetchUserData(user.uid)).unwrap();

      // Подписываемся на курсы, если они еще не загружены
      if (!isCoursesLoaded) {
        await dispatch(subscribeToCourses(userData.purchasedCourses)).unwrap();
      }
    };

    initializeData();
  }, [dispatch, isAuthInitialized, user, isCoursesLoaded]);

  // Проверяем доступ пользователя
  useEffect(() => {
    const checkAccess = async () => {
      if (!user || !user.uid) {
        setHasAccess(false);
        return;
      }

      try {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const purchasedCourses = userDoc.data().purchasedCourses || {};
          const courseProgress = purchasedCourses[courseId]?.progress || 0;
          setHasAccess(courseProgress === 100);
        } else {
          setHasAccess(false);
        }
      } catch (error) {
        console.error('Ошибка проверки доступа:', error);
        setHasAccess(false);
      }
    };

    if (isAuthInitialized && user) {
      checkAccess();
    }
  }, [isAuthInitialized, user, courseId]);

  // Редирект, если доступ запрещен
  useEffect(() => {
    if (isAuthInitialized && hasAccess === false) {
      toast.info('You have not completed this course to receive a certificate.');
      navigate('/account', { replace: true });
    }
  }, [isAuthInitialized, hasAccess, navigate]);

  // Предварительная загрузка изображения
  useEffect(() => {
    if (!course || !isCoursesLoaded) return; // Ждем, пока курсы загрузятся

    const certificateImage = course?.certificateImage || '/img/DefaultCertificate.jpg';

    if (certificateImage.startsWith('http')) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = certificateImage;
      img.onload = () => setCertificateImageLoaded(certificateImage);
      img.onerror = () => {
        console.error('Ошибка загрузки изображения сертификата');
        setCertificateImageLoaded('/img/DefaultCertificate.jpg');
      };
    } else {
      setCertificateImageLoaded(certificateImage);
    }
  }, [course, isCoursesLoaded]);

  const validationSchema = Yup.object({
    firstName: Yup.string()
      .matches(/^[A-Za-z]+$/, 'Only English letters are allowed')
      .required('First name is required'),
    lastName: Yup.string()
      .matches(/^[A-Za-z]+$/, 'Only English letters are allowed')
      .required('Last name is required'),
  });

  const downloadCertificate = async () => {
    const certificateElement = document.getElementById('certificate');
    toast.info('Generating image, please wait...');
    try {
      const canvas = await html2canvas(certificateElement, {
        scale: 1.7,
        useCORS: true,
        logging: false,
        imageTimeout: 5000,
        backgroundColor: null,
      });
      const imgData = canvas.toDataURL('image/png', 1.0);

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
        compress: false,
      });

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'SLOW');
      pdf.save(
        `certificate_${courseId}_${certificateData.firstName}_${certificateData.lastName}.pdf`,
      );
      toast.success('Image downloaded successfully!');
    } catch (error) {
      console.error('Ошибка генерации сертификата:', error);
      toast.error('Failed to generate certificate. Please try again.');
    }
  };

  const downloadImage = async () => {
    toast.info('Generating image, please wait...');
    const certificateElement = document.getElementById('certificate');
    try {
      const canvas = await html2canvas(certificateElement, {
        scale: 1.7,
        useCORS: true,
        logging: false,
        imageTimeout: 5000,
        backgroundColor: 'black',
      });
      const imgData = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.href = imgData;
      link.download = `certificate_${courseId}_${certificateData.firstName}_${certificateData.lastName}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Image downloaded successfully!');
    } catch (error) {
      console.error('Ошибка генерации изображения:', error);
      toast.error('Failed to generate image. Please try again.');
    }
  };

  const downloadJpg = async () => {
    toast.info('Generating image, please wait...');
    const certificateElement = document.getElementById('certificate');
    try {
      const canvas = await html2canvas(certificateElement, {
        scale: 1.7,
        useCORS: true,
        logging: false,
        imageTimeout: 5000,
        backgroundColor: 'black',
      });
      const imgData = canvas.toDataURL('image/jpeg', 0.95); // Качество 0.95 для JPEG
      const link = document.createElement('a');
      link.href = imgData;
      link.download = `certificate_${courseId}_${certificateData.firstName}_${certificateData.lastName}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Image downloaded successfully!');
    } catch (error) {
      console.error('Ошибка генерации изображения:', error);
      toast.error('Failed to generate image. Please try again.');
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  // Форматирование списка спикеров
  const formatSpeakers = (speakers) => {
    if (!speakers || speakers.length === 0) return 'Unknown Instructor';
    if (speakers.length === 1) return speakers[0];
    if (speakers.length === 2) return `${speakers[0]} and ${speakers[1]}`;
    return `${speakers.slice(0, -1).join(', ')} and ${speakers[speakers.length - 1]}`;
  };

  // Показываем загрузку, пока проверяем доступ или загружается изображение
  if (!isAuthInitialized || hasAccess === null || !isCoursesLoaded || !certificateImageLoaded) {
    return <PlayListLoadingIndicator />;
  }

  // Если доступ запрещен, не рендерим форму
  if (!hasAccess) {
    return null;
  }

  return (
    <div className={scss.container}>
      <div className={scss.backButtonBlock}>
        <button className={scss.backButton} onClick={handleGoBack}>
          <BsArrowLeftShort className={scss.backIcon} /> Back
        </button>
      </div>
      <div className={scss.certificateTitlePage}>
        <h1>Certificate of completion</h1>
      </div>
      <div className={scss.certificateDesctiptionPage}>
        <p className={scss.welcomeText}>
          Hi, <span>{userName}</span>! Make your certificate here
        </p>
      </div>

      <div className={scss.formAndPreview}>
        <div className={scss.preview}>
          {certificateImageLoaded ? (
            <div
              id='certificate'
              className={scss.certificate}
              style={{ backgroundImage: `url(${certificateImageLoaded})` }}>
              <h2>
                {certificateData.firstName} {certificateData.lastName}
              </h2>
              <p>{new Date().toLocaleDateString()}</p>
            </div>
          ) : (
            <p className={scss.notPossible}>
              At the moment it is not possible to download the certificate.
            </p>
          )}
          {certificateData.firstName && certificateData.lastName && (
            <div className={scss.buttonsDownload}>
              <button onClick={downloadCertificate} className={scss.downloadButton}>
                Download Certificate (PDF)
              </button>
              <button onClick={downloadImage} className={scss.downloadButton}>
                Download Certificate (PNG)
              </button>
              <button onClick={downloadJpg} className={scss.downloadButton}>
                Download Certificate (JPG)
              </button>
            </div>
          )}
        </div>

        <div className={scss.formBlock}>
          <Formik
            initialValues={{ firstName: user?.firstName || '', lastName: user?.lastName || '' }}
            validationSchema={validationSchema}
            onSubmit={(values) => {
              setCertificateData(values);
            }}>
            {({ isSubmitting }) => (
              <Form className={scss.form}>
                <div className={scss.field}>
                  <label htmlFor='firstName'>
                    First Name (<span>English</span>)
                  </label>
                  <Field name='firstName' type='text' placeholder='John' />
                  <ErrorMessage name='firstName' component='div' className={scss.error} />
                </div>
                <div className={scss.field}>
                  <label htmlFor='lastName'>
                    Last Name (<span>English</span>)
                  </label>
                  <Field name='lastName' type='text' placeholder='Doe' />
                  <ErrorMessage name='lastName' component='div' className={scss.error} />
                </div>
                <button className={scss.submitButton} type='submit' disabled={isSubmitting}>
                  Preview Certificate
                </button>
              </Form>
            )}
          </Formik>
          <p className={scss.textAfterForm}>
            {userName} successfully completed the course{' '}
            {course?.title || courseId.replace(/-/g, ' ').toLowerCase()} on{' '}
            {new Date().toLocaleDateString()} taught by {formatSpeakers(course?.speakers)} |
            K.Syndicate.school
          </p>
        </div>
      </div>
    </div>
  );
}
