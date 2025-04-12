import { useState, useCallback, useEffect } from "react";
import { dummyPosts } from "../utils/dummyData";
import { searchImages } from '../services/imageService';

export interface Post {
  id: string;
  topic: string;
  content: string;
  imageUrl: string;
  savedAt: string;
  scheduledFor: string | null;
}

// Gemini API key
const GEMINI_API_KEY = "AIzaSyDF322wMDlK6cMiiUSz5JBLGXAXWUNHgUE";

export function usePosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  // Initialize posts from localStorage or use dummy data
  useEffect(() => {
    const savedPosts = localStorage.getItem("elevate-posts");
    if (savedPosts) {
      setPosts(JSON.parse(savedPosts));
    } else {
      setPosts(dummyPosts);
    }
    setLoading(false);
  }, []);

  // Save posts to localStorage whenever posts change
  useEffect(() => {
    if (!loading) {
      localStorage.setItem("elevate-posts", JSON.stringify(posts));
    }
  }, [posts, loading]);

  const generatePost = useCallback(async (topic: string): Promise<Post> => {
    try {
      // Updated to use Gemini 2.0 Flash model and correct API endpoint
      const response = await fetch("https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Generate an engaging LinkedIn post about ${topic}. The post should be professional, include 2-3 key takeaways, and end with a call to action or question. Format it with appropriate emojis, line breaks, and hashtags. Keep it under 1300 characters.`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 800,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Gemini API error:", errorData);
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Extract the generated text
      const generatedText = data.candidates[0].content.parts[0].text;
      
      // Get image using the new service
      const imageUrl = await searchImages(topic);
      
      return {
        id: Date.now().toString(),
        topic,
        content: generatedText,
        imageUrl,
        savedAt: new Date().toISOString(),
        scheduledFor: null,
      };
    } catch (error) {
      console.error("Error generating post:", error);
      throw error;
    }
  }, []);

  const savePost = useCallback((post: Post) => {
    setPosts((prev) => [post, ...prev]);
  }, []);

  const schedulePost = useCallback((postId: string, scheduledFor: string) => {
    setPosts((prev) => 
      prev.map((post) => 
        post.id === postId ? { ...post, scheduledFor } : post
      )
    );
  }, []);

  const deletePost = useCallback((postId: string) => {
    setPosts((prev) => prev.filter((post) => post.id !== postId));
  }, []);

  return {
    posts,
    loading,
    generatePost,
    savePost,
    schedulePost,
    deletePost,
  };
}
