
import { createApi } from 'unsplash-js';

// This is a publishable key, it's safe to be in the code
const unsplash = createApi({
  accessKey: 'kq86fcS7VoxoOkpKP0FY8oG5zGx97mIFGsnaEBcVk6I',
});

export const searchImages = async (query: string): Promise<string> => {
  try {
    const result = await unsplash.search.getPhotos({
      query,
      orientation: 'squarish',
      perPage: 1,
    });

    if (result.errors) {
      // Fallback to the current method if API fails
      return `https://source.unsplash.com/random/1080x1080/?${encodeURIComponent(query.toLowerCase())}`;
    }

    const imageUrl = result.response?.results[0]?.urls?.regular;
    if (!imageUrl) {
      return `https://source.unsplash.com/random/1080x1080/?${encodeURIComponent(query.toLowerCase())}`;
    }

    return imageUrl;
  } catch (error) {
    console.error('Error fetching image:', error);
    // Fallback to the current method if API fails
    return `https://source.unsplash.com/random/1080x1080/?${encodeURIComponent(query.toLowerCase())}`;
  }
};
