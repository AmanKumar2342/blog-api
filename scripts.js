const apiUrl = 'http://localhost:3000'; // Replace with your API URL
let authToken = null;

async function registerUser() {
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;

    try {
        const response = await fetch(`${apiUrl}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();
        document.getElementById('registerResponse').innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
        if (response.ok) {
            alert('Registration successful! You can now log in.');
        } else {
            alert('Registration failed: ' + data.errors.map(e => e.msg).join(', '));
        }
    } catch (error) {
        console.error('Error registering user:', error);
        document.getElementById('registerResponse').innerHTML = `<pre>${error.message}</pre>`;
    }
}

async function loginUser() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch(`${apiUrl}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        document.getElementById('loginResponse').innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
        if (response.ok) {
            authToken = data.token;
            alert('Login successful! Your token is: ' + authToken);
        } else {
            alert('Login failed: ' + data.message);
        }
    } catch (error) {
        console.error('Error logging in user:', error);
        document.getElementById('loginResponse').innerHTML = `<pre>${error.message}</pre>`;
    }
}

async function createPost() {
    const title = document.getElementById('postTitle').value;
    const content = document.getElementById('postContent').value;

    try {
        const response = await fetch(`${apiUrl}/posts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ title, content })
        });

        const data = await response.json();
        document.getElementById('createPostResponse').innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
        if (response.ok) {
            alert('Post created successfully!');
            getAllPosts(); // Refresh the list of posts
        } else {
            alert('Failed to create post: ' + data.message);
        }
    } catch (error) {
        console.error('Error creating post:', error);
        document.getElementById('createPostResponse').innerHTML = `<pre>${error.message}</pre>`;
    }
}

async function updatePost() {
    const id = document.getElementById('updatePostId').value;
    const title = document.getElementById('updatePostTitle').value;
    const content = document.getElementById('updatePostContent').value;

    try {
        const response = await fetch(`${apiUrl}/posts/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ title, content })
        });

        const data = await response.json();
        document.getElementById('updatePostResponse').innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
        if (response.ok) {
            alert('Post updated successfully!');
            getAllPosts(); // Refresh the list of posts
        } else {
            alert('Failed to update post: ' + data.message);
        }
    } catch (error) {
        console.error('Error updating post:', error);
        document.getElementById('updatePostResponse').innerHTML = `<pre>${error.message}</pre>`;
    }
}

async function deletePostById(postId) {
    try {
        const response = await fetch(`${apiUrl}/posts/${postId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        const data = await response.json();
        document.getElementById('deletePostResponse').innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
        if (response.ok) {
            alert('Post deleted successfully!');
            getAllPosts(); // Refresh the list of posts
        } else {
            alert('Failed to delete post: ' + data.message);
        }
    } catch (error) {
        console.error('Error deleting post:', error);
        document.getElementById('deletePostResponse').innerHTML = `<pre>${error.message}</pre>`;
    }
}

async function getAllPosts() {
    try {
        const response = await fetch(`${apiUrl}/posts`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        const data = await response.json();
        const postsContainer = document.getElementById('allPostsResponse');
        postsContainer.innerHTML = ''; // Clear existing content

        if (data.length === 0) {
            postsContainer.innerHTML = '<p>No posts found.</p>';
            return;
        }

        data.forEach(post => {
            const postElement = document.createElement('div');
            postElement.classList.add('post');
            postElement.innerHTML = `
                <h3>${post.title}</h3>
                <p>${post.content}</p>
                <p><strong>Author:</strong> ${post.author_id}</p>
                <hr>
            `;

            if (authToken) {
                const updateButton = document.createElement('button');
                updateButton.textContent = 'Update';
                updateButton.onclick = () => {
                    document.getElementById('updatePostId').value = post.id;
                    document.getElementById('updatePostTitle').value = post.title;
                    document.getElementById('updatePostContent').value = post.content;
                    window.scrollTo(0, document.getElementById('updatePostForm').offsetTop);
                };

                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Delete';
                deleteButton.onclick = () => {
                    deletePostById(post.id);
                };

                postElement.appendChild(updateButton);
                postElement.appendChild(deleteButton);
            }

            postsContainer.appendChild(postElement);
        });
    } catch (error) {
        console.error('Error fetching posts:', error);
        document.getElementById('allPostsResponse').innerHTML = `<pre>${error.message}</pre>`;
    }
}

document.addEventListener('DOMContentLoaded', getAllPosts);
