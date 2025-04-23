import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, MessageSquare } from 'lucide-react';
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
    <div className="w-full min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl p-8 mb-8 border border-gray-200/10">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">Community Wall</h1>
          <p className="text-gray-600 mb-8">Share your thoughts and connect with others</p>
          
          {/* Post form */}
          <form onSubmit={handleSubmit} className="mb-12">
            <div className="flex items-start space-x-4">
              <div className="flex-1 bg-white rounded-xl p-4 border border-gray-200 focus-within:border-blue-500 transition-all duration-200 shadow-lg">
                <textarea
                  value={newPost}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewPost(e.target.value)}
                  placeholder="What's on your mind? Share with the community..."
                  className="w-full bg-transparent focus:outline-none resize-none text-gray-800 placeholder-gray-400"
                  rows={3}
                  maxLength={1000}
                />
              </div>
              <button
                type="submit"
                className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-6 py-3 rounded-xl flex items-center space-x-2 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!newPost.trim()}
              >
                <Plus size={20} />
                <span>Post</span>
              </button>
            </div>
          </form>

          {/* Posts feed */}
          <div className="space-y-6">
            {posts.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg">No posts yet. Be the first to share something!</p>
              </div>
            ) : (
              posts.map((post) => (
                <div key={post._id} className="bg-white rounded-xl p-6 border border-gray-200 hover:border-blue-200 transition-all duration-200 shadow-lg hover:shadow-xl">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 flex items-center justify-center text-white font-semibold shadow-md">
                        {post.userName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-semibold text-gray-900">{post.userName}</span>
                        <span className="text-gray-500 text-sm ml-2">
                          {new Date(post.createdAt).toLocaleString()}
                        </span>
                      </div>
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
                          className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                          aria-label="Edit post"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this post?')) {
                              handleDelete(post._id);
                            }
                          }}
                          className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors duration-200"
                          aria-label="Delete post"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="text-gray-700 whitespace-pre-line break-words leading-relaxed">{post.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityWall;