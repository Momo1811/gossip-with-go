import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams, useNavigate } from 'react-router-dom';
import { 
  Container, Typography, List, ListItem, ListItemText, Paper, 
  CircularProgress, TextField, Button, Box, Divider, AppBar, 
  Toolbar, Card, CardContent, CardActionArea, IconButton
} from '@mui/material';
import ForumIcon from '@mui/icons-material/Forum'; 
import axios from 'axios';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import DeleteIcon from '@mui/icons-material/Delete';
import FavoriteIcon from '@mui/icons-material/Favorite';
import HeartBrokenIcon from '@mui/icons-material/HeartBroken';
import ShareIcon from '@mui/icons-material/Share';
import PushPinIcon from '@mui/icons-material/PushPin';

// Navbar Component
const Navbar = () => (
  <AppBar position="static" sx={{ mb: 4, bgcolor: '#c13ab8' }}>
    <Toolbar>
      <ForumIcon sx={{ mr: 2 }} />
      <Typography variant="h6" component={Link} to="/" sx={{ flexGrow: 1, textDecoration: 'none', color: 'white' }}>
        Gossip Forum
      </Typography>
      <Button color="inherit" component={Link} to="/">Home</Button>
    </Toolbar>
  </AppBar>
);

// Cmt 
const CommentSection = ({ postId, postAuthor }: { postId: number, postAuthor: string }) => {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [show, setShow] = useState(false);
  const loggedInUser = localStorage.getItem("username");
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editCommentContent, setEditCommentContent] = useState("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);

  const fetchComments = () => {
    axios.get(`https://gossip-with-go-n9z1.onrender.com/api/get-comments?post_id=${postId}`)
      .then(res => setComments(Array.isArray(res.data) ? res.data : []))
      .catch(() => setComments([]));
  };

  useEffect(() => {
    if (show) fetchComments();
  }, [show]);

  const handleAddComment = () => {
    if (!newComment || !loggedInUser) return;
    const pId =replyingTo ? replyingTo :0 ;
    axios.get(`https://gossip-with-go-n9z1.onrender.com/api/add-comment?post_id=${postId}&author=${loggedInUser}&content=${newComment}&parent_id=${pId}`)
    .then(() => {
      setNewComment("");
      setReplyingTo(null); 
      fetchComments();
    });
  };

  const handleDeleteComment = (commentId: number) => {
    if (window.confirm("Confirm Deletion?")) {
      axios.get(`https://gossip-with-go-n9z1.onrender.com/api/delete-comment?id=${commentId}&username=${loggedInUser}`)
        .then(() => fetchComments())
        .catch(err => alert(err.response.data));
    }
  };

  const handleSaveEditComment = (id: number) => {
    axios.get(`https://gossip-with-go-n9z1.onrender.com/api/edit-comment?id=${id}&content=${editCommentContent}&username=${loggedInUser}`)
      .then(() => {
        setEditingCommentId(null); 
        fetchComments(); 
      })
      .catch(err => alert(err.response.data));
  };

  const handlePinComment = (commentId: number) => {
    axios.get(`https://gossip-with-go-n9z1.onrender.com/api/pin-comment?id=${commentId}`)
      .then(() => fetchComments())
      .catch(err => console.log(err));
  };

  const handleLikeComment = (commentId: number) => {
      if (!loggedInUser) return alert("Login First");

      axios.get(`https://gossip-with-go-n9z1.onrender.com/api/like-comment?id=${commentId}&username=${loggedInUser}`)
        .then(() => {
            fetchComments();
        })
        .catch(err => console.error(err));
  };

  return (
    <Box sx={{ mt: 2, pl: 2, borderLeft: '2px solid #ddd' }}>
      <Button size="small" onClick={() => setShow(!show)}>
        {show ? "Hide Comments" : `Show Comments `}
      </Button>

      {show && (
        <Box sx={{ mt: 2, display:'block'}}>
          {(comments || []).map((c: any) => {
            const isOwner = loggedInUser === c.author;
            const isEditing = editingCommentId === c.id;

            return (
              <Paper 
                key={c.id} 
                variant="outlined" 
                 sx={{ 
                  p: 1.5, mb: 1, 
                  ml: c.content.includes('@') ? 5 : 0,
                  bgcolor: c.content.includes('@') ? '#f3f4f6' : '#fafafa', 
                  borderLeft: c.content.includes('@') ? '4px solid #590355' : '1px solid #e0e0e0',
                  
                  borderRadius: '8px',
                  position: 'relative'
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                  {c.author}: 
                </Typography>

                {isEditing ? (
                  <Box sx={{ mt: 1 }}>
                    <TextField 
                      fullWidth size="small" 
                      value={editCommentContent} 
                      onChange={(e) => setEditCommentContent(e.target.value)}
                      autoFocus
                    />
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                      <Button size="small" variant="contained" color="success" onClick={() => handleSaveEditComment(c.id)}>Save</Button>
                      <Button size="small" onClick={() => setEditingCommentId(null)}>Cancel</Button>
                    </Box>
                  </Box>
                ) : (
                  <>
                    <Typography variant="body2" sx={{ color: '#333', whiteSpace: 'pre-wrap' }}>
                      {c.content.split(' ').map((word: string, index: number) => {
                        if (word.startsWith('@')) {
                          return (
                            <span key={index} style={{ color: '#1976d2', fontWeight: 'bold' }}>
                              {word}{' '}
                            </span>
                          );
                        }
                        return word + ' ';
                      })}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 1, mt: 0.5, alignItems: 'center' }}>
                      <IconButton size="small" onClick={(e) => {
                        e.stopPropagation(); 
                        handleLikeComment(c.id);}}>
                        <FavoriteIcon sx={{ 
                          fontSize: '1rem', 
                          color: c.likes > 0 ? 'red' : 'inherit' 
                        }} />
                      </IconButton>

                      <Typography variant="caption">{c.likes || 0}</Typography>

                      {postAuthor === loggedInUser && (
                        <IconButton 
                          size="small" 
                          onClick={() => handlePinComment(c.id)}
                          sx={{ ml: 1 }}
                        >
                          <PushPinIcon 
                            sx={{ 
                              fontSize: '1rem', 
                              color: c.is_pinned ? '#1976d2' : 'inherit',
                              transform: c.is_pinned ? 'rotate(0deg)' : 'rotate(45deg)' 
                            }} 
                          />
                        </IconButton>
                      )}

                      {!c.parent_id && (
                        <Button size="small" sx={{ fontSize: '0.65rem', py: 0 }} onClick={() => {
                          setReplyingTo(c.id);
                          setNewComment(`@${c.author}` );
                          window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                        }}>
                          Reply
                        </Button>
                      )}
                    </Box>

                    

                    {isOwner && (
                      <Box sx={{ position: 'absolute', top: 0, right: 0 }}>
                        <IconButton 
                          size="small"
                          color="primary"
                          onClick={() => {
                            setEditingCommentId(c.id);
                            setEditCommentContent(c.content);
                          }}
                        >
                          <EditIcon fontSize="inherit" />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          color="error" 
                          onClick={() => handleDeleteComment(c.id)}
                        >
                          <DeleteIcon fontSize="inherit" />
                        </IconButton>
                      </Box>
                    )}

                  </>
                )}
              </Paper>
            );
          })}

          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            <Typography variant="caption" sx={{ alignSelf: 'center', fontWeight: 'bold' }}>
              {loggedInUser ? `As: ${loggedInUser}` : "Please Login"}
            </Typography>

            <TextField 
              size="small" 
              fullWidth 
              placeholder={replyingTo ? `Replying to comment...` : "Write a comment..."} 
              value={newComment} 
              onChange={(e) => setNewComment(e.target.value)} 
              disabled={!loggedInUser}
            />
            <Button 
              variant="contained" 
              size="small" 
              onClick={handleAddComment} 
              disabled={!loggedInUser || !newComment}
            >
              Post
            </Button>
            {replyingTo && (
              <Button size="small" color="inherit" onClick={() => {setReplyingTo(null); setNewComment("");}}>Cancel</Button>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
};

//Register
const RegisterPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate(); 

  const handleRegister = () => {
    axios.get(`https://gossip-with-go-n9z1.onrender.com/api/register?username=${username}&password=${password}`)
      .then(() => {
        alert("Register Successful!");
        navigate("/login");
      })
      .catch(() => alert("Username already Used"));
  };

  return (
    <Container maxWidth="xs" sx={{ mt: 8 }}>
      <Paper elevation={6} sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>Sign Up</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <TextField label="Username" variant="outlined" fullWidth onChange={(e) => setUsername(e.target.value)} />
          <TextField label="Password" type="password" variant="outlined" fullWidth onChange={(e) => setPassword(e.target.value)} />
          <Button variant="contained" size="large" onClick={handleRegister} sx={{ mt: 2 }}>
            Register
          </Button>
          <Typography variant="body2">
            Already have an account? <Link to="/login">Login </Link>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

//login 
const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = () => {
    axios.get(`https://gossip-with-go-n9z1.onrender.com/api/login?username=${username}&password=${password}`)
      .then(res => {
        const { token, username } = res.data; 
        
        localStorage.setItem("token", token);
        localStorage.setItem("username", username);

        alert("Welcome back, " + username + "!");
        navigate("/"); 
        window.location.reload();
      })
      .catch(() => alert("Login Failed"));
  };  

  return (
    <Container maxWidth="xs" sx={{ mt: 8 }}>
      <Paper elevation={6} sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>Welcome Back</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <TextField label="Username" variant="outlined" fullWidth onChange={(e) => setUsername(e.target.value)} />
          <TextField label="Password" type="password" variant="outlined" fullWidth onChange={(e) => setPassword(e.target.value)} />
          <Button variant="contained" color="success" size="large" onClick={handleLogin} sx={{ mt: 2 }}>
            Login
          </Button>
          <Typography variant="body2">
            Haven't an account yet? <Link to="/register">Register Here!</Link>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};


//Home Page
const Home = () => {
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTopic, setNewTopic] = useState("");
  
  const [searchTerm, setSearchTerm] = useState("");
  const loggedInUser = localStorage.getItem("username");

  const fetchTopics = () => {
    axios.get('https://gossip-with-go-n9z1.onrender.com/api/topics')
      .then(res => { 
        setTopics(res.data); 
        setLoading(false); 
      });
  };

  useEffect(() => { fetchTopics(); }, []);

  const handleAddTopic = () => {
    if (!newTopic) return;
    axios.get(`https://gossip-with-go-n9z1.onrender.com/api/add-topic?name=${newTopic}&author=${loggedInUser}`)
      .then(() => { setNewTopic(""); fetchTopics(); });
  };

  console.log("Current user:", loggedInUser);
  const handleEditTopic = (id: number, currentName: string) => {
      const newName = prompt("Update your topic name", currentName);
      if (newName && newName !== currentName) {
        axios.get(`https://gossip-with-go-n9z1.onrender.com/api/edit-topic?id=${id}&name=${newName}&username=${loggedInUser}`)
          .then(() => {setTopics(prev => prev.map(t=>t.id===id?{...t,name:newName}:t));})
          .catch(err=>console.log(err.response.data));
      }
    };
  const handleDeleteTopic = (id: number) => {
    if (window.confirm("Confirm deletion? This will also delete all posts within this topic.!")) {
      axios.get(`https://gossip-with-go-n9z1.onrender.com/api/delete-topic?id=${id}&username=${loggedInUser}`)
        .then(() => {
          setTopics(prevTopics => (prevTopics || []).filter(t => t.id !== id));
        });
    }
  };

  const filteredTopics = (topics || []).filter(topic => 
    (topic.name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 3, mb: 4, bgcolor: '#f8f9fa' }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
          Explore or Create Topics
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField 
            label="Search Topics..." 
            variant="outlined" 
            fullWidth 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Type to filter topics..."
          />
          
          <Divider>OR</Divider>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField 
              label="New Topic Name" 
              variant="outlined" 
              fullWidth 
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              disabled={!loggedInUser} 
              placeholder={loggedInUser ? "" : "Login to do this action"}
            />
            <Button variant="contained" onClick={handleAddTopic} sx={{ px: 4, bgcolor:'#c13ab8' }} disabled={!loggedInUser}>
              Add
            </Button>
          </Box>
        </Box>
      </Paper>

      <Typography variant="h6" gutterBottom color="textSecondary">
        {searchTerm ? `Search results for "${searchTerm}"` : "Recent Topics"}
      </Typography>

      {loading ? (<CircularProgress sx={{ display: 'block', mx: 'auto' }} />) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 3 }}>
          {filteredTopics.length > 0 ? (
            filteredTopics.map((topic, index) => {
              const topicId = topics.indexOf(topic) + 1; 
              const isOwner = loggedInUser === topic.author; 
              return (
                <Card key={index} elevation={2} sx={{ position: 'relative', transition: '0.3s', '&:hover': { transform: 'translateY(-5px)', boxShadow: 6 } }}>
                  {isOwner && (
                    <Box sx={{ position: 'absolute', top: 5, right: 5, zIndex: 2, display: 'flex', gap: 1 }}>
                      <IconButton size="small" onClick={(e) => { e.preventDefault(); handleEditTopic(topic.id, topic.name); }} disabled={!loggedInUser}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={(e) => { e.preventDefault(); handleDeleteTopic(topic.id); }} disabled={!loggedInUser}>                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  )}

                  <CardActionArea component={Link} to={`/topic/${topic.id}`}>
                    <CardContent sx={{ pt: 4 }}>
                      <Typography variant="h6" color="primary">{topic.name}</Typography>
                      <Typography variant="body2" color="textSecondary">Join the conversation</Typography>
                      {topic.author && (
                        <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'gray' }}>
                            Created by: {topic.author}
                        </Typography>
                      )}
                    </CardContent>
                  </CardActionArea>
                </Card>
              );
            })
          ) : (
            <Typography sx={{ mt: 2 }}>No topics found matching your search.</Typography>
          )}
        </Box>
      )}
    </Container>
  );
};

const PostList = () => {
  const { id } = useParams();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [author, setAuthor] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  const fetchPosts = () => {
    setLoading(true);
    axios.get(`https://gossip-with-go-n9z1.onrender.com/api/get-posts?topic_id=${id}`)
      .then(res => {
        setPosts(res.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchPosts(); }, [id]);

  const handleAddPost = () => {
     const loggedInUser = localStorage.getItem("username");

    if (!loggedInUser) {
      alert("Login to do this action!");
      return;
    }
    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    formData.append("topic_id", id!); 
    formData.append("author", loggedInUser);

    if (selectedFile) {
        formData.append("image", selectedFile);
    }

    axios.post("https://gossip-with-go-n9z1.onrender.com/api/add-post", formData, {
        headers: { "Content-Type": "multipart/form-data" }
    })
    .then(() => {
        setTitle("");   
        setContent("");
        setSelectedFile(null); 
        fetchPosts();   
    })
    .catch(err => console.error("Upload error:", err));
  };

  const handleDeletePost = (postId: number) => {
    const loggedInUser = localStorage.getItem("username");
    if (window.confirm("Are you sure you want to delete this post?")) {
      axios.get(`https://gossip-with-go-n9z1.onrender.com/api/delete-post?id=${postId}&username=${loggedInUser}`)
      .then(() => {
        alert("Post deleted!");
        fetchPosts(); 
      })
      .catch((err) => {
        alert(err.response.data); 
      });
    }
  };

  const startEdit = (post: any) => {
    setEditingId(post.id);
    setEditTitle(post.title);
    setEditContent(post.content);
  };

  const handleSaveEdit = (postId: number) => {
    const loggedInUser = localStorage.getItem("username");
    axios.get(`https://gossip-with-go-n9z1.onrender.com/api/edit-post?id=${postId}&title=${editTitle}&content=${editContent}&username=${loggedInUser}`)
    .then(() => {
      setEditingId(null);
      fetchPosts();
      alert("Post Updated!");
    })
    .catch((err) => {
      alert(err.response.data);
      setEditingId(null); 
    });
  };

  const handleLike = (postId: number) => {
    const loggedInUser = localStorage.getItem("username"); 
    if (!loggedInUser) return alert("Please login to like this post");
    axios.get(`https://gossip-with-go-n9z1.onrender.com/api/like-post?id=${postId}&username=${loggedInUser}`)
      .then(() => {
        fetchPosts(); 
      })
      .catch(err => console.error(err));
  };

  const handleDislike = (postId: number) => {
    const loggedInUser = localStorage.getItem("username");

    
    if (!loggedInUser) {
      alert("Please login to dislike this post!");
      return;
    }

    axios.get(`https://gossip-with-go-n9z1.onrender.com/api/dislike-post?id=${postId}&username=${loggedInUser}`)
      .then((res) => {
        console.log(res.data); 
        fetchPosts(); 
      })
      .catch(err => {
        console.error("Error:", err.response?.data);
        alert(err.response?.data || "Something went wrong");
      });
  };

  const handleShare = (post: any) => {
      const caption = window.prompt("Write a caption for your share:", "Check this out!");
      if (caption !== null) {
          axios.get(`https://gossip-with-go-n9z1.onrender.com/api/share-post?id=${post.id}`)
              .then(() => {
                  alert(`Shared with caption: ${caption}`);
                  fetchPosts();
              });
      }
  };


  return (
    <Container maxWidth="md">
      <Button component={Link} to="/" variant="outlined" sx={{ mb: 2 , }}>Back to Topics</Button>
      <Typography variant="h4" color="primary" gutterBottom sx={{ fontWeight: 'bold' }}></Typography>
      
      <Paper elevation={3} sx={{ p: 4, mb: 4, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>Join the Discussion</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField label="Caption" variant="outlined" fullWidth value={title} onChange={(e) => setTitle(e.target.value)} />
          <TextField label="Tell us more..." variant="outlined" multiline rows={4} fullWidth value={content} onChange={(e) => setContent(e.target.value)} />
          <Box sx={{ mt: 1, mb: 2 }}>
                    <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} 
                    />
                    {selectedFile && <p style={{ fontSize: '12px' }}>Selected: {selectedFile.name}</p>}
          </Box>
          <Button variant="contained" size="large" onClick={handleAddPost} sx={{bgcolor: '#c13ab8' , '&:hover':{bgcolor:'#b5424ab'}}}>Submit Post</Button>
        </Box>
      </Paper>

      <Divider sx={{ my: 4 }} />

      {loading ? <CircularProgress sx={{ display: 'block', mx: 'auto' }} /> : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {posts.length === 0 ? (
            <Typography align="center" color="textSecondary">No gossip yet. Be the first!</Typography>
          ) : (
            posts.map((post: any) => (
              <Paper key={post.id} sx={{ p: 3, borderLeft: '6px solid #c13ab8', borderRadius: '4px 12px 12px 4px' }}>
                {editingId === post.id ? (
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField fullWidth value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                    <TextField fullWidth multiline rows={3} value={editContent} onChange={(e) => setEditContent(e.target.value)} />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button startIcon={<SaveIcon />} variant="contained" color="success" onClick={() => handleSaveEdit(post.id)}>Save</Button>
                      <Button startIcon={<CancelIcon />} variant="outlined" onClick={() => setEditingId(null)}>Cancel</Button>
                    </Box>
                  </Box>
                  
                ) : (
                  
                  <>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
  
                        <Typography variant="h5" gutterBottom>{post.title}</Typography>
                        <Typography variant="body1" sx={{ fontSize: '1.1rem', mb: 2 }}>{post.content}</Typography>
                        {post.image_url && (
                          <Box sx={{ mt: 2, mb: 2 }}>
                            <img 
                              src={`https://gossip-with-go-n9z1.onrender.com${post.image_url}`} 
                              alt="post image" 
                              style={{ 
                                maxWidth: '100%', 
                                borderRadius: '8px', 
                                display: 'block' 
                              }} 
                              onError={(e) => {
                                console.log("Image source was:", (e.target as HTMLImageElement).src);
                              }}
                            />
                          </Box>
                        )}
                      </Box>
                      <Box>
                         {localStorage.getItem("username") === post.author && (
                            <>
                              <IconButton color="primary" onClick={() => startEdit(post)}>
                                <EditIcon />
                              </IconButton>
                              <IconButton color="error" onClick={() => handleDeletePost(post.id)}>
                                <DeleteIcon />
                              </IconButton>
                            </>
                          )}
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                      <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#555' }}>By {post.author}</Typography>
                      <Typography variant="caption" color="textSecondary">{new Date(post.created_at).toLocaleString()}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                      <Button 
                        startIcon={<FavoriteIcon />} 
                        color="error" 
                        onClick={() => handleLike(post.id)}
                        sx={{ borderRadius: '20px', textTransform: 'none' }}
                      >
                        {post.likes || 0} Likes
                      </Button>
                      <Button 
                        startIcon={<HeartBrokenIcon />} 
                        color="inherit" 
                        onClick={() => handleDislike(post.id)}
                        sx={{ borderRadius: '20px', textTransform: 'none', color: '#555' }}
                      >
                        {post.dislikes || 0} Dislikes
                      </Button>

                      <Button 
                        startIcon={<ShareIcon />} 
                        color="primary" 
                        onClick={() => handleShare(post)}
                        sx={{ borderRadius: '20px', textTransform: 'none' }}
                      >
                        {post.shares || 0} Shares
                      </Button>
                    </Box>
                  </>
                )}
                <Divider sx={{ my: 1 }} />
                <CommentSection postId={post.id} postAuthor={post.author} />
              </Paper>
            ))
          )}
        </Box>
      )}
    </Container>
  );
};

function App() {
  const loggedInUser = localStorage.getItem("username");
  return (
    <Router>
      <AppBar position="static" sx={{bgcolor:'#eb94e5'}} >
        <Toolbar >
          <Typography variant="h6" sx={{ flexGrow: 1 }}></Typography>
          {loggedInUser ? (
            <>
              <Typography sx={{ mr: 2 }}>Hello, {loggedInUser}!</Typography>
              <Button color="inherit" onClick={() => { localStorage.clear(); window.location.reload(); }}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button color="inherit" component={Link} to="/login">Login</Button>
              <Button color="inherit" variant="outlined" component={Link} to="/register" sx={{ ml: 1 }}>Register</Button>
            </>
          )}
        </Toolbar>
      </AppBar>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/topic/:id" element={<PostList />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
    </Router>
  );
}

export default App;