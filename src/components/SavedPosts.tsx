
import { Post } from "../hooks/usePosts";
import { PostsList } from "./PostsList";

interface SavedPostsProps {
  posts: Post[];
  onDelete: (postId: string) => void;
}

export function SavedPosts({ posts, onDelete }: SavedPostsProps) {
  // Filter posts - scheduled and non-scheduled
  const scheduledPosts = posts.filter((post) => post.scheduledFor);
  const savedPosts = posts.filter((post) => !post.scheduledFor);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-medium mb-4">Scheduled Posts</h3>
        <PostsList 
          posts={scheduledPosts} 
          onDelete={onDelete} 
          emptyMessage="No scheduled posts found" 
        />
      </div>
      
      <div>
        <h3 className="text-xl font-medium mb-4">Saved Posts</h3>
        <PostsList 
          posts={savedPosts} 
          onDelete={onDelete} 
          emptyMessage="No saved posts found" 
        />
      </div>
    </div>
  );
}
