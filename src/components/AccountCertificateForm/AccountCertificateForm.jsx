import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import scss from './AccountCertificateForm.module.scss';
import { toast } from 'react-toastify';

export default function AccountCertificateForm() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [certificateData, setCertificateData] = useState({ firstName: '', lastName: '' });
  const [hasAccess, setHasAccess] = useState(null);

  // Получаем данные курса из Redux
  const course = useSelector((state) => state.auth.courses.find((c) => c.id === courseId));
  const certificateImage = course?.certificateImage || '/img/DefaultCertificate.jpg';

  const { userName } = useSelector((state) => state.auth);
  const user = useSelector((state) => state.auth.user);
  const isAuthInitialized = useSelector((state) => state.auth.isAuthInitialized);

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

    if (isAuthInitialized) {
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
    try {
      const canvas = await html2canvas(certificateElement, {
        scale: 4,
        useCORS: true,
        logging: false,
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
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'NONE');
      pdf.save(
        `certificate_${courseId}_${certificateData.firstName}_${certificateData.lastName}.pdf`,
      );
    } catch (error) {
      console.error('Ошибка генерации сертификата:', error);
      toast.error('Failed to generate certificate. Please try again.');
    }
  };

  // Показываем загрузку, пока проверяем доступ
  if (!isAuthInitialized || hasAccess === null) {
    return <div>Loading...</div>;
  }

  // Если доступ запрещен, не рендерим форму
  if (!hasAccess) {
    return null;
  }

  return (
    <div className={scss.container}>
      <div className={scss.certificateTitlePage}>
        <h1>Certificate of completion</h1>
      </div>
      <div className={scss.certificateDesctiptionPage}>
        <p className={scss.welcomeText}>
          Hi, <span>{userName}</span>! Make your sertificate here
          {/* {course?.title || courseId.replace(/-/g, ' ').toUpperCase()} */}
        </p>
      </div>

      <div className={scss.formAndPreview}>
        <div className={scss.preview}>
          {certificateImage ? (
            <div
              id='certificate'
              className={scss.certificate}
              style={{ backgroundImage: `url(${certificateImage})` }}>
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
            <button onClick={downloadCertificate} className={scss.downloadButton}>
              Download Certificate
            </button>
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
            {userName} успешно прошел курс{' '}
            {course?.title || courseId.replace(/-/g, ' ').toLowerCase()}{' '}
            {new Date().toLocaleDateString()} от преподавателя Oleksey Naumenko and Kate Revvo |
            K.Syndicate.school
          </p>
        </div>
      </div>
    </div>
  );
}
