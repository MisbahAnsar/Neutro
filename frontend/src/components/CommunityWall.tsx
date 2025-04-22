import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit } from 'lucide-react';
import axios, { AxiosError, AxiosResponse } from 'axios';

interface Post {
  _id: string;
  content: string;
  userId: string;
  userName: string;
  createdAt: string;
  updatedAt: string;
}

interface ApiError {
  message?: string;
}

const CommunityWall: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get token and user info from localStorage
  const token = localStorage.getItem('neutroToken') || '';
  const userId = localStorage.getItem('neutroUserId') || '';
  const userName = localStorage.getItem('neutroUserName') || '';

  // Axios instance with auth header
  const api = axios.create({
    baseURL: 'http://localhost:3000/api',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  // Fetch posts
  const fetchPosts = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const response: AxiosResponse<Post[]> = await api.get('/posts');
      setPosts(response.data);
      setIsLoading(false);
      setError(null);
    } catch (err) {
      const error = err as AxiosError<ApiError>;
      setError(error.response?.data?.message || error.message || 'Failed to fetch posts');
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchPosts();
    
    // Polling for real-time updates (every 10 seconds)
    const interval = setInterval(fetchPosts, 10000);
    return () => clearInterval(interval);
  }, []);

  // Create post
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!newPost.trim()) return;

    try {
      const response: AxiosResponse<Post> = await api.post('/posts', { content: newPost });
      setPosts([response.data, ...posts]);
      setNewPost('');
      setError(null);
    } catch (err) {
      const error = err as AxiosError<ApiError>;
      setError(error.response?.data?.message || error.message || 'Failed to create post');
    }
  };

  // Update post
  const handleUpdate = async (postId: string, newContent: string): Promise<void> => {
    if (!newContent.trim()) return;

    try {
      const response: AxiosResponse<Post> = await api.put(`/posts/${postId}`, { content: newContent });
      setPosts(posts.map(post => 
        post._id === postId ? response.data : post
      ));
      setError(null);
    } catch (err) {
      const error = err as AxiosError<ApiError>;
      setError(error.response?.data?.message || error.message || 'Failed to update post');
    }
  };

  // Delete post
  const handleDelete = async (postId: string): Promise<void> => {
    try {
      await api.delete(`/posts/${postId}`);
      setPosts(posts.filter(post => post._id !== postId));
      setError(null);
    } catch (err) {
      const error = err as AxiosError<ApiError>;
      setError(error.response?.data?.message || error.message || 'Failed to delete post');
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading posts...</div>;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg mx-4 my-2">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Community Wall</h1>
      
      {/* Post form */}
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex items-start space-x-2">
          <textarea
            value={newPost}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewPost(e.target.value)}
            placeholder="Share your thoughts with the community..."
            className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={3}
            maxLength={1000}
          />
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-lg flex items-center disabled:opacity-50"
            disabled={!newPost.trim()}
          >
            <Plus size={18} className="mr-1" />
            Post
          </button>
        </div>
      </form>

      {/* Posts feed */}
      <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No posts yet. Be the first to share something!
          </div>
        ) : (
          posts.map((post) => (
            <div key={post._id} className="border rounded-lg p-4 bg-white shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="font-semibold">{post.userName}</span>
                  <span className="text-gray-500 text-sm ml-2">
                    {new Date(post.createdAt).toLocaleString()}
                  </span>
                </div>
                {post.userId === userId && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        const newContent = prompt('Edit your post:', post.content);
                        if (newContent !== null) {
                          handleUpdate(post._id, newContent);
                        }
                      }}
                      className="text-gray-500 hover:text-blue-500"
                      aria-label="Edit post"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this post?')) {
                          handleDelete(post._id);
                        }
                      }}
                      className="text-gray-500 hover:text-red-500"
                      aria-label="Delete post"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
              <p className="whitespace-pre-line break-words">{post.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CommunityWall;