import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import styles from './AccountCertificateForm.module.scss';

export default function AccountCertificateForm() {
  const { courseId } = useParams();
  const [certificateData, setCertificateData] = useState({ firstName: '', lastName: '' });

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
    const canvas = await html2canvas(certificateElement, {
      scale: 4, // Увеличенный масштаб для высокого качества
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
  };

  return (
    <div className={styles.container}>
      <h2>Generate Your Certificate</h2>
      <div className={styles.formAndPreview}>
        <Formik
          initialValues={{ firstName: '', lastName: '' }}
          validationSchema={validationSchema}
          onSubmit={(values) => {
            setCertificateData(values);
          }}>
          {({ isSubmitting }) => (
            <Form className={styles.form}>
              <div className={styles.field}>
                <label htmlFor='firstName'>First Name (English)</label>
                <Field name='firstName' type='text' placeholder='John' />
                <ErrorMessage name='firstName' component='div' className={styles.error} />
              </div>
              <div className={styles.field}>
                <label htmlFor='lastName'>Last Name (English)</label>
                <Field name='lastName' type='text' placeholder='Doe' />
                <ErrorMessage name='lastName' component='div' className={styles.error} />
              </div>
              <button type='submit' disabled={isSubmitting}>
                Preview Certificate
              </button>
            </Form>
          )}
        </Formik>

        <div className={styles.preview}>
          <div id='certificate' className={styles.certificate}>
            <h1>Certificate of Completion</h1>
            <p>This certifies that</p>
            <h2>
              {certificateData.firstName} {certificateData.lastName}
            </h2>
            <p>has successfully completed the course</p>
            <h3>{courseId.replace(/-/g, ' ').toUpperCase()}</h3>
            <p>Date: {new Date().toLocaleDateString()}</p>
          </div>
          {certificateData.firstName && certificateData.lastName && (
            <button onClick={downloadCertificate} className={styles.downloadButton}>
              Download Certificate
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
