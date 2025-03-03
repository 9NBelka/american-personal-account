import { doc, updateDoc } from 'firebase/firestore';

const updateUserRole = async (uid) => {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    role: 'student',
  });
};
