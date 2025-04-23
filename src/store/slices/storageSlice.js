import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ref, uploadBytes, listAll, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../../firebase';

export const fetchImages = createAsyncThunk('storage/fetchImages', async () => {
  const avatarsRef = ref(storage, 'avatars/');
  const productImagesRef = ref(storage, 'product-images/');

  const [avatarsList, productImagesList] = await Promise.all([
    listAll(avatarsRef),
    listAll(productImagesRef),
  ]);

  const allItems = [...avatarsList.items, ...productImagesList.items];

  const images = await Promise.all(
    allItems.map(async (itemRef) => {
      const url = await getDownloadURL(itemRef);
      return { name: itemRef.name, url, ref: itemRef };
    }),
  );

  return images;
});

export const uploadImage = createAsyncThunk('storage/uploadImage', async (file) => {
  const storageRef = ref(storage, `product-images/${file.name}`);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  return { name: file.name, url, ref: storageRef };
});

export const deleteImage = createAsyncThunk(
  'storage/deleteImage',
  async ({ imageName, imageRef }) => {
    await deleteObject(imageRef);
    return imageName;
  },
);

const storageSlice = createSlice({
  name: 'storage',
  initialState: {
    images: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchImages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchImages.fulfilled, (state, action) => {
        state.loading = false;
        state.images = action.payload;
      })
      .addCase(fetchImages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(uploadImage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadImage.fulfilled, (state, action) => {
        state.loading = false;
        state.images.push(action.payload);
      })
      .addCase(uploadImage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(deleteImage.fulfilled, (state, action) => {
        state.images = state.images.filter((image) => image.name !== action.payload);
      });
  },
});

export default storageSlice.reducer;
