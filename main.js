//HTTP request Get,post,put,delete
async function Load() {
    try {
        let res = await fetch('http://localhost:3000/posts')
        let data = await res.json();
        let body = document.getElementById("table-body");
        body.innerHTML = "";
        for (const post of data) {
            // Apply strikethrough style if post is soft-deleted
            const rowStyle = post.isDeleted ? 'style="text-decoration: line-through; opacity: 0.6;"' : '';
            body.innerHTML += `
            <tr ${rowStyle}>
                <td>${post.id}</td>
                <td>${post.title}</td>
                <td>${post.views}</td>
                <td><input value="Delete" type="submit" onclick="Delete('${post.id}')" /></td>
            </tr>`
        }
    } catch (error) {

    }
}
async function Save() {
    let id = document.getElementById("id_txt").value.trim();
    let title = document.getElementById("title_txt").value;
    let views = document.getElementById("views_txt").value;
    let res;

    // If ID is provided, try to update existing post
    if (id) {
        let getID = await fetch('http://localhost:3000/posts/' + id);
        if (getID.ok) {
            res = await fetch('http://localhost:3000/posts/' + id, {
                method: 'PUT',
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(
                    {
                        title: title,
                        views: views,
                        isDeleted: false
                    }
                )
            })
        }
    } else {
        // Auto-generate ID: fetch all posts and find maxId
        let allPosts = await fetch('http://localhost:3000/posts');
        let postsData = await allPosts.json();
        let maxId = 0;
        for (const post of postsData) {
            let postIdNum = parseInt(post.id);
            if (postIdNum > maxId) {
                maxId = postIdNum;
            }
        }
        let newId = (maxId + 1).toString();

        res = await fetch('http://localhost:3000/posts', {
            method: 'POST',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(
                {
                    id: newId,
                    title: title,
                    views: views,
                    isDeleted: false
                }
            )
        })
    }
    if (res.ok) {
        console.log("them thanh cong");
        Load(); // Refresh the table
    }
}
async function Delete(id) {
    // Soft delete: mark as deleted instead of removing
    let getPost = await fetch('http://localhost:3000/posts/' + id);
    if (getPost.ok) {
        let post = await getPost.json();
        let res = await fetch('http://localhost:3000/posts/' + id, {
            method: 'PUT',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(
                {
                    ...post,
                    isDeleted: true
                }
            )
        });
        if (res.ok) {
            console.log("xoa thanh cong");
            Load(); // Refresh the table
        }
    }
}

// ========== COMMENTS CRUD ==========
async function LoadComments() {
    try {
        let res = await fetch('http://localhost:3000/comments');
        let data = await res.json();
        let body = document.getElementById("comment-table-body");
        body.innerHTML = "";
        for (const comment of data) {
            body.innerHTML += `
            <tr>
                <td>${comment.id}</td>
                <td>${comment.text}</td>
                <td>${comment.postId}</td>
                <td>
                    <input value="Sửa" type="submit" onclick="EditComment('${comment.id}')" />
                    <input value="Xoá" type="submit" onclick="DeleteComment('${comment.id}')" />
                </td>
            </tr>`
        }
    } catch (error) {
        console.error("Error loading comments:", error);
    }
}

async function SaveComment() {
    let id = document.getElementById("comment_id_txt").value.trim();
    let text = document.getElementById("comment_text_txt").value;
    let postId = document.getElementById("comment_postId_txt").value;
    let res;

    // If ID is provided, try to update existing comment
    if (id) {
        let getComment = await fetch('http://localhost:3000/comments/' + id);
        if (getComment.ok) {
            res = await fetch('http://localhost:3000/comments/' + id, {
                method: 'PUT',
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    text: text,
                    postId: postId
                })
            })
        }
    } else {
        // Auto-generate ID: fetch all comments and find maxId
        let allComments = await fetch('http://localhost:3000/comments');
        let commentsData = await allComments.json();
        let maxId = 0;
        for (const comment of commentsData) {
            let commentIdNum = parseInt(comment.id);
            if (commentIdNum > maxId) {
                maxId = commentIdNum;
            }
        }
        let newId = (maxId + 1).toString();

        res = await fetch('http://localhost:3000/comments', {
            method: 'POST',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id: newId,
                text: text,
                postId: postId
            })
        })
    }

    if (res.ok) {
        console.log("Lưu bình luận thành công");
        // Clear form
        document.getElementById("comment_id_txt").value = "";
        document.getElementById("comment_text_txt").value = "";
        document.getElementById("comment_postId_txt").value = "";
        LoadComments(); // Refresh the table
    }
}

async function EditComment(id) {
    // Fetch comment data and populate form for editing
    let res = await fetch('http://localhost:3000/comments/' + id);
    if (res.ok) {
        let comment = await res.json();
        document.getElementById("comment_id_txt").value = comment.id;
        document.getElementById("comment_text_txt").value = comment.text;
        document.getElementById("comment_postId_txt").value = comment.postId;
    }
}

async function DeleteComment(id) {
    if (confirm("Bạn có chắc chắn muốn xoá bình luận này?")) {
        let res = await fetch('http://localhost:3000/comments/' + id, {
            method: 'DELETE'
        });
        if (res.ok) {
            console.log("Xoá bình luận thành công");
            LoadComments(); // Refresh the table
        }
    }
}

Load();
LoadComments();
